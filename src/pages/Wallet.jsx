import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { addWalletTransaction } from "../services/walletService";
import Modal from "../components/ui/Modal";
import toast from 'react-hot-toast';

const Wallet = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, lastMonthlyCredit: null });
  const [loading, setLoading] = useState(true);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addAmount, setAddAmount] = useState(500);

  useEffect(() => {
    let unsubSnapshot = null;
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setCurrentUser(u);
        try {
          const userRef = doc(db, "users", u.uid);
          // subscribe to realtime updates so transactions show up immediately
          unsubSnapshot = onSnapshot(userRef, (snap) => {
            if (snap.exists()) setWallet(snap.data().wallet || { balance: 0 });
            setLoading(false);
          }, (err) => {
            console.error('wallet onSnapshot error', err);
            setLoading(false);
          });
        } catch (err) {
          console.error(err);
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return () => {
      if (unsubSnapshot) unsubSnapshot();
      unsubAuth();
    };
  }, []);

  const submitAdd = async () => {
    if (!currentUser) return;
    const amount = Number(addAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Enter a valid amount");
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);
      const currentWallet = (snap.exists() && snap.data().wallet) || { balance: 0 };
      const newBalance = (currentWallet.balance || 0) + amount;
      await updateDoc(userRef, { "wallet.balance": newBalance });
      // record transaction
      await addWalletTransaction(currentUser.uid, { type: "credit", amount, note: "Wallet Top-up" });
      setWallet((w) => ({ ...w, balance: newBalance }));
      toast.success(`₹${amount} added. New balance: ₹${newBalance}`);
      setShowAddMoneyModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add money to wallet");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  // extract transactions
  const txList = (wallet.transactions || []).slice().sort((a, b) => {
    const ad = a.date && a.date.toDate ? a.date.toDate().getTime() : (a.date ? new Date(a.date).getTime() : 0);
    const bd = b.date && b.date.toDate ? b.date.toDate().getTime() : (b.date ? new Date(b.date).getTime() : 0);
    return bd - ad;
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-br from-[#071018] to-[#06101a] border border-white/6 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white">My Wallet</h2>
            <p className="text-sm text-gray-400 mt-1">Manage balance and view quick actions.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Balance</p>
            <p className="text-3xl font-black text-emerald-400">₹ {wallet.balance || 0}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => setShowAddMoneyModal(true)} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold">Add Money</button>
          <button onClick={() => toast('No transactions yet', { icon: 'ℹ️' })} className="px-4 py-2 rounded-xl bg-white/5 text-white">Transactions</button>
        </div>
      </div>

      <Modal show={showAddMoneyModal} title="Add Money to Wallet" onClose={() => setShowAddMoneyModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Amount (INR)</label>
            <input type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} className="w-full mt-2 px-4 py-3 rounded-xl bg-black/30 border border-gray-700 text-white outline-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowAddMoneyModal(false)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">Cancel</button>
            <button onClick={submitAdd} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold">Add Money</button>
          </div>
        </div>
      </Modal>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Transaction History</h3>
        {txList.length === 0 ? (
          <div className="bg-white/5 p-6 rounded-2xl text-gray-300">No transactions yet</div>
        ) : (
          <div className="space-y-3">
            {txList.map((t, idx) => {
              const date = t.date && t.date.toDate ? t.date.toDate() : (t.date ? new Date(t.date) : new Date());
              return (
                <div key={idx} className="flex justify-between items-center bg-[#0b1418]/70 border border-white/6 p-4 rounded-xl">
                  <div>
                    <div className="text-sm text-gray-400">{t.type === 'credit' ? 'Credit' : 'Debit'}</div>
                    <div className="text-white font-bold">{t.note || ''}</div>
                    <div className="text-xs text-gray-500 mt-1">{date.toLocaleString()}</div>
                  </div>
                  <div className={`text-lg font-black ${t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.type === 'credit' ? '+' : '-'} ₹{t.amount}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
