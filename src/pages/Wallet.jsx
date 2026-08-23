import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";
import { addWalletTransaction } from "../services/walletService";
import Modal from "../components/ui/Modal";
import notify from "../components/ui/LuxuryToast";
import { formatPrice } from "../utils/priceFormatter";
import { 
  WalletCards, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck,
  Sparkles,
  Zap,
  Gift
} from "lucide-react";

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
    if (isNaN(amount) || amount <= 0) {
      notify.error("Invalid Amount", "Please enter a valid rupee amount to top-up.");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);
      const currentWallet = (snap.exists() && snap.data().wallet) || { balance: 0, transactions: [] };
      const newBalance = (currentWallet.balance || 0) + amount;

      const newTx = {
        type: "credit",
        amount: amount,
        note: "Wallet Top-up (Online)",
        date: new Date().toISOString()
      };

      await updateDoc(userRef, { 
        "wallet.balance": newBalance,
        "wallet.transactions": arrayUnion(newTx)
      });

      try {
        await addWalletTransaction(currentUser.uid, newTx);
      } catch (e) {
        console.warn("External wallet service warning:", e);
      }

      notify.success("Top-up Successful! 💳", `₹${formatPrice(amount)} has been added to your ShopIndia wallet.`);
      setShowAddMoneyModal(false);
      setAddAmount(500);
    } catch (err) {
      console.error(err);
      notify.error("Top-up Failed", "Failed to add money to wallet.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
          Loading Wallet...
        </span>
      </div>
    );
  }

  const txList = (wallet.transactions || []).slice().sort((a, b) => {
    const ad = a.date && a.date.toDate ? a.date.toDate().getTime() : (a.date ? new Date(a.date).getTime() : 0);
    const bd = b.date && b.date.toDate ? b.date.toDate().getTime() : (b.date ? new Date(b.date).getTime() : 0);
    return bd - ad;
  });

  return (
    <div className="space-y-6 md:space-y-8 pb-10 transition-colors duration-300">
      
      {/* Wallet Balance Showcase Card (Fixed contrast & luxury styling) */}
      <div className="bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 rounded-2xl md:rounded-3xl p-5 md:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <WalletCards size={24} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">ShopIndia Wallet</h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              Instant 1-click checkout balance with automated monthly bonus & fast refunds.
            </p>
          </div>

          {/* Balance Capsule Box - High Contrast Dark & Light */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-slate-850 border border-emerald-200 dark:border-emerald-800/80 w-full sm:w-auto text-left sm:text-right shadow-sm">
            <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
              Available Balance
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-300 mt-0.5">
              ₹{formatPrice(wallet.balance || 0)}
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setShowAddMoneyModal(true)} 
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Top-up Wallet</span>
          </button>

          {/* Quick Top-up Preset Chips */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase">Quick Add:</span>
            {[100, 500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                onClick={() => { setAddAmount(amt); setShowAddMoneyModal(true); }}
                className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:border-emerald-500 border border-transparent text-gray-700 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                +₹{amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      <Modal show={showAddMoneyModal} title="Add Funds to Wallet" onClose={() => setShowAddMoneyModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Amount (INR)</label>
            <input 
              type="number" 
              value={addAmount} 
              onChange={(e) => setAddAmount(e.target.value)} 
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-gray-900 dark:text-white font-bold text-lg outline-none focus:border-emerald-500" 
            />
          </div>

          <div className="flex gap-2">
            {[200, 500, 1000, 2500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAddAmount(val)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  addAmount === val 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                }`}
              >
                ₹{val}
              </button>
            ))}
          </div>

          <div className="flex gap-2.5 justify-end pt-2">
            <button 
              onClick={() => setShowAddMoneyModal(false)} 
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={submitAdd} 
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              Confirm Top-up
            </button>
          </div>
        </div>
      </Modal>

      {/* Transaction History Section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Transaction History ({txList.length})</h2>

        {txList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/60 p-8 rounded-2xl text-center border border-gray-200 dark:border-slate-800">
            <span className="text-3xl block mb-2 opacity-50">📂</span>
            <p className="text-xs text-gray-500 dark:text-slate-400">No wallet transactions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txList.map((t, idx) => {
              const date = t.date && t.date.toDate ? t.date.toDate() : (t.date ? new Date(t.date) : new Date());
              const isCredit = t.type === 'credit';
              const isRefund = t.note?.toLowerCase().includes('refund');

              return (
                <div 
                  key={idx} 
                  className={`flex justify-between items-center bg-white dark:bg-slate-900/90 border p-3.5 rounded-2xl shadow-sm transition-colors ${
                    isRefund 
                      ? 'border-amber-400/40 dark:border-amber-500/30' 
                      : 'border-gray-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isRefund 
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                        : isCredit 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {isRefund ? <Gift size={18} /> : isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{t.note || 'Wallet Transfer'}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">{date.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <span className={`text-xs sm:text-sm font-black ${
                    isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {isCredit ? '+' : '-'} ₹{formatPrice(t.amount)}
                  </span>
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