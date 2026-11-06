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

const AUTO_DISMISS_DURATION = 2200; // Snappy 2.2s auto-dismiss

/**
 * Ultra-Premium Floating Pill Toast Notification Component
 * High-performance, AMOLED dark contrast, smooth CSS exit keyframes
 */
export const notify = {
  success: (title, message = "") => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-sm sm:max-w-md w-full bg-[#050811]/95 backdrop-blur-2xl border border-emerald-500/40 text-white shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)] rounded-2xl p-3 sm:p-3.5 flex flex-col pointer-events-auto transition-all overflow-hidden relative group`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={17} className="stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-[13px] font-black text-white tracking-wide truncate">{title}</p>
            {message && <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">{message}</p>}
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
            aria-label="Close Notification"
          >
            <X size={14} />
          </button>
        </div>
        {/* Sleek auto-dismiss indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500/20">
          <div className="h-full bg-emerald-500 animate-toast-progress"></div>
        </div>
      </div>
    ), { duration: AUTO_DISMISS_DURATION });
  },

  error: (title, message = "") => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-sm sm:max-w-md w-full bg-[#050811]/95 backdrop-blur-2xl border border-rose-500/40 text-white shadow-[0_20px_60px_-15px_rgba(244,63,94,0.3)] rounded-2xl p-3 sm:p-3.5 flex flex-col pointer-events-auto transition-all overflow-hidden relative group`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <XCircle size={17} className="stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-[13px] font-black text-white tracking-wide truncate">{title}</p>
            {message && <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">{message}</p>}
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
            aria-label="Close Notification"
          >
            <X size={14} />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose-500/20">
          <div className="h-full bg-rose-500 animate-toast-progress"></div>
        </div>
      </div>
    ), { duration: AUTO_DISMISS_DURATION });
  },

  cart: (productName, price) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-sm sm:max-w-md w-full bg-[#050811]/95 backdrop-blur-2xl border border-indigo-500/40 text-white shadow-[0_20px_60px_-15px_rgba(99,102,241,0.3)] rounded-2xl p-3 sm:p-3.5 flex flex-col pointer-events-auto transition-all overflow-hidden relative group`}
      >
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0 font-bold">
              <ShoppingCart size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-black text-white truncate">Added to Cart! 🛍️</p>
              <p className="text-[11px] text-indigo-300 font-semibold truncate">
                {productName} {price ? `· ₹${formatPrice(price)}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500/20">
          <div className="h-full bg-indigo-500 animate-toast-progress"></div>
        </div>
      </div>
    ), { duration: AUTO_DISMISS_DURATION });
  },

  refund: (amount, orderId) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-sm sm:max-w-md w-full bg-[#050811]/95 backdrop-blur-2xl border border-amber-500/40 text-white shadow-[0_20px_60px_-15px_rgba(245,158,11,0.3)] rounded-2xl p-3 sm:p-3.5 flex flex-col pointer-events-auto transition-all overflow-hidden relative group`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Wallet size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-[13px] font-black text-amber-300 truncate">Refund Credited to Wallet! 💳</p>
            <p className="text-[11px] text-slate-300 mt-0.5 truncate">
              ₹{formatPrice(amount)} for Order #{orderId ? orderId.slice(0, 8) : ""}
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500/20">
          <div className="h-full bg-amber-500 animate-toast-progress"></div>
        </div>
      </div>
    ), { duration: AUTO_DISMISS_DURATION });
  },

  info: (title, message = "") => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-sm sm:max-w-md w-full bg-[#050811]/95 backdrop-blur-2xl border border-blue-500/40 text-white shadow-[0_20px_60px_-15px_rgba(59,130,246,0.3)] rounded-2xl p-3 sm:p-3.5 flex flex-col pointer-events-auto transition-all overflow-hidden relative group`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <Info size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-[13px] font-black text-white truncate">{title}</p>
            {message && <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">{message}</p>}
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500/20">
          <div className="h-full bg-blue-500 animate-toast-progress"></div>
        </div>
      </div>
    ), { duration: AUTO_DISMISS_DURATION });
  }
};

export default notify;
