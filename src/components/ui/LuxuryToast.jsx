import React from 'react';
import toast from 'react-hot-toast';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ShoppingCart, 
  Sparkles, 
  Zap, 
  Wallet,
  X
} from 'lucide-react';
import { formatPrice } from '../../utils/priceFormatter';

/**
 * Premium Luxury Toast Notification Component
 */
export const notify = {
  success: (title, message = "") => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-slate-900/95 dark:bg-[#0b1220]/95 backdrop-blur-xl border border-emerald-500/30 text-white shadow-2xl rounded-2xl p-3.5 flex items-start gap-3 pointer-events-auto transition-all transform duration-300 hover:scale-[1.02]`}
      >
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
          <CheckCircle2 size={18} className="animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-black text-white tracking-wide">{title}</p>
          {message && <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{message}</p>}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    ), { duration: 3500 });
  },

  error: (title, message = "") => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-slate-900/95 dark:bg-[#0b1220]/95 backdrop-blur-xl border border-rose-500/30 text-white shadow-2xl rounded-2xl p-3.5 flex items-start gap-3 pointer-events-auto transition-all transform duration-300 hover:scale-[1.02]`}
      >
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0 mt-0.5">
          <XCircle size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-black text-white tracking-wide">{title}</p>
          {message && <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{message}</p>}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    ), { duration: 4000 });
  },

  cart: (productName, price) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-slate-900/95 dark:bg-[#0b1220]/95 backdrop-blur-xl border border-emerald-500/40 text-white shadow-2xl rounded-2xl p-3.5 flex items-center justify-between gap-3 pointer-events-auto transition-all`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30 shrink-0">
            <ShoppingCart size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-black text-white truncate">Added to Cart! 🛍️</p>
            <p className="text-[11px] text-emerald-300 font-semibold truncate">
              {productName} {price ? `· ₹${formatPrice(price)}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X size={14} />
        </button>
      </div>
    ), { duration: 3000 });
  },

  refund: (amount, orderId) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-slate-900/95 dark:bg-[#0b1220]/95 backdrop-blur-xl border border-amber-500/40 text-white shadow-2xl rounded-2xl p-3.5 flex items-start gap-3 pointer-events-auto transition-all`}
      >
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
          <Wallet size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-black text-amber-300">Refund Credited to Wallet! 💳</p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            ₹{formatPrice(amount)} refunded for Order #{orderId ? orderId.slice(0,6) : ""}
          </p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X size={14} />
        </button>
      </div>
    ), { duration: 5000 });
  },

  info: (title, message = "") => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-slate-900/95 dark:bg-[#0b1220]/95 backdrop-blur-xl border border-blue-500/30 text-white shadow-2xl rounded-2xl p-3.5 flex items-start gap-3 pointer-events-auto transition-all`}
      >
        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0 mt-0.5">
          <Info size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-black text-white">{title}</p>
          {message && <p className="text-[11px] text-slate-300 mt-0.5">{message}</p>}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X size={14} />
        </button>
      </div>
    ), { duration: 3500 });
  }
};

export default notify;

