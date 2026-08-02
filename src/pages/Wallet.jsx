import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";
import { addWalletTransaction } from "../services/walletService";
import Modal from "../components/ui/Modal";
import toast from 'react-hot-toast';
import { formatPrice } from "../utils/priceFormatter";

const Wallet = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
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
          // Subscribe to realtime updates so balance and transactions show up immediately
          unsubSnapshot = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setWallet(data.wallet || { balance: 0, transactions: [] });
            }
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
      const currentWallet = (snap.exists() && snap.data().wallet) || { balance: 0, transactions: [] };
      const newBalance = (currentWallet.balance || 0) + amount;

      const newTx = {
        type: "credit",
        amount: amount,
        note: "Wallet Top-up",
        date: new Date().toISOString()
      };

      // Update both balance and push transaction into the array in Firestore
      await updateDoc(userRef, { 
        "wallet.balance": newBalance,
        "wallet.transactions": arrayUnion(newTx)
      });

      // Also call external service if configured
      try {
        await addWalletTransaction(currentUser.uid, newTx);
      } catch (e) {
        console.warn("External wallet service sync warning:", e);
      }

      toast.success(`₹${formatPrice(amount)} added successfully! New balance: ₹${formatPrice(newBalance)}`);
      setShowAddMoneyModal(false);
      setAddAmount(500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add money to wallet");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-5 transition-colors duration-500">
        <div className="relative flex justify-center items-center">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-200 dark:border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]"></div>
            <div className="absolute w-4 h-4 bg-teal-500 dark:bg-teal-400 rounded-full animate-pulse shadow-lg shadow-teal-500/60"></div>
        </div>
        <span className="text-emerald-700 dark:text-emerald-400/90 text-sm font-bold tracking-[0.25em] animate-pulse">
            LOADING WALLET...
        </span>
      </div>
    );
  }

  // Extract and sort transactions safely (latest first)
  const txList = (wallet.transactions || []).slice().sort((a, b) => {
    const ad = a.date && a.date.toDate ? a.date.toDate().getTime() : (a.date ? new Date(a.date).getTime() : 0);
    const bd = b.date && b.date.toDate ? b.date.toDate().getTime() : (b.date ? new Date(b.date).getTime() : 0);
    return bd - ad;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 transition-colors duration-500">
      
      {/* Wallet Balance Card */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#071018] dark:to-[#06101a] border border-gray-200 dark:border-white/6 rounded-[2rem] p-6 md:p-8 shadow-xl dark:shadow-2xl transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">My Wallet 💳</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage balance and view transaction history.</p>
          </div>
          <div className="text-left sm:text-right bg-gray-50 dark:bg-black/30 p-4 rounded-2xl border border-gray-200 dark:border-white/5 w-full sm:w-auto shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Available Balance</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹ {formatPrice(wallet.balance || 0)}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button 
            onClick={() => setShowAddMoneyModal(true)} 
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md dark:shadow-lg dark:shadow-emerald-500/20 transition-all active:scale-95"
          >
            + Add Money
          </button>
        </div>
      </div>

      {/* Add Money Modal */}
      <Modal show={showAddMoneyModal} title="Add Money to Wallet" onClose={() => setShowAddMoneyModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">Amount (INR)</label>
            <input 
              type="number" 
              value={addAmount} 
              onChange={(e) => setAddAmount(e.target.value)} 
              className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm font-bold text-lg" 
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button 
              onClick={() => setShowAddMoneyModal(false)} 
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button 
              onClick={submitAdd} 
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md transition"
            >
              Proceed to Add
            </button>
          </div>
        </div>
      </Modal>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📜</span> Transaction History
        </h3>

        {txList.length === 0 ? (
          <div className="bg-white dark:bg-white/5 p-8 rounded-3xl text-center border border-gray-200 dark:border-white/5 shadow-sm">
            <span className="text-4xl block mb-2 opacity-50">📂</span>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {txList.map((t, idx) => {
              const date = t.date && t.date.toDate ? t.date.toDate() : (t.date ? new Date(t.date) : new Date());
              const isCredit = t.type === 'credit';

              return (
                <div key={idx} className="flex justify-between items-center bg-white dark:bg-[#0b1418]/70 border border-gray-200 dark:border-white/6 p-4 md:p-5 rounded-2xl shadow-sm hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md border ${isCredit ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'}`}>
                        {t.type || 'Transaction'}
                      </span>
                    </div>
                    <div className="text-gray-900 dark:text-white font-bold mt-1 text-base">{t.note || 'Wallet Update'}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{date.toLocaleString('en-IN')}</div>
                  </div>
                  <div className={`text-lg md:text-xl font-black ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {isCredit ? '+' : '-'} ₹{formatPrice(t.amount)}
                  </div>
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