import useTheme from '../../hooks/useTheme';
import { Sun, Moon, Sparkles, Heart, Zap, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="hidden md:block mt-16 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#090d16]/70 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Trust Badges Banner */}
        <div className="grid grid-cols-4 gap-4 pb-8 mb-8 border-b border-slate-200/80 dark:border-slate-800 text-center">
          <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <Truck className="text-indigo-500 mb-1" size={20} />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Free Express Shipping</span>
            <span className="text-[10px] text-slate-400">On all prepaid & COD orders</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <ShieldCheck className="text-emerald-500 mb-1" size={20} />
            <span className="text-xs font-bold text-slate-900 dark:text-white">100% Genuine Products</span>
            <span className="text-[10px] text-slate-400">Verified manufacturer warranty</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <RefreshCw className="text-cyan-500 mb-1" size={20} />
            <span className="text-xs font-bold text-slate-900 dark:text-white">7-Day Easy Returns</span>
            <span className="text-[10px] text-slate-400">Instant wallet credit on cancel</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <Zap className="text-amber-500 mb-1" size={20} />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Instant Split Checkout</span>
            <span className="text-[10px] text-slate-400">Combine UPI + Card + Wallet</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20">
                <Zap size={16} className="fill-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                ShopIndia
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              India's premier next-generation e-commerce destination with lightning-fast delivery and multi-method split payments.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Shopping Links</h3>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li><Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home Store</Link></li>
              <li><Link to="/cart" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Cart & Checkout</Link></li>
              <li><Link to="/wallet" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">ShopIndia Wallet</Link></li>
              <li><Link to="/profile" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Order Tracker</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Customer Care</h3>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li><span>Khodiyar Nagar, Ahmedabad, Gujarat</span></li>
              <li><span>7-Day Easy Replacement Policy</span></li>
              <li><span>100% Purchase Protection</span></li>
              <li><span>24/7 Priority Support</span></li>
            </ul>
          </div>

          {/* Preferences & Theme */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Theme & Appearance</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Switch visual mode anytime:</p>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
              <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
          <p>© 2026 ShopIndia v3.0. Next-Gen Indian E-Commerce.</p>
          <div className="flex items-center gap-1.5">
            <span>Engineered with</span>
            <Heart size={13} className="text-rose-500 fill-current" />
            <span>for smooth performance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;