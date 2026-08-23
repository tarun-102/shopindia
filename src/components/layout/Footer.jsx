import useTheme from '../../hooks/useTheme';
import { Sun, Moon, Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="hidden md:block mt-16 border-t border-gray-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm">
                S
              </div>
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white uppercase">
                ShopIndia
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              India's favorite online store delivering genuine products, unbeatable deals, and nationwide express shipping.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Shopping Links</h3>
            <ul className="space-y-1.5 text-xs text-gray-600 dark:text-slate-400">
              <li><Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">Home Store</Link></li>
              <li><Link to="/cart" className="hover:text-emerald-600 dark:hover:text-emerald-400">Cart & Checkout</Link></li>
              <li><Link to="/wallet" className="hover:text-emerald-600 dark:hover:text-emerald-400">ShopIndia Wallet</Link></li>
              <li><Link to="/profile" className="hover:text-emerald-600 dark:hover:text-emerald-400">Order History</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Customer Care</h3>
            <ul className="space-y-1.5 text-xs text-gray-600 dark:text-slate-400">
              <li><span>Khodiyar Nagar, Ahmedabad, Gujarat</span></li>
              <li><span>7-Day Easy Replacement Policy</span></li>
              <li><span>100% Purchase Protection</span></li>
              <li><span>24/7 Verified Support</span></li>
            </ul>
          </div>

          {/* Preferences & Theme */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Preferences</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Switch theme appearance anytime:</p>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-xs font-bold border border-gray-200 dark:border-slate-700"
            >
              {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
              <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-slate-500">
          <p>© 2026 ShopIndia. Designed for modern Indian e-commerce.</p>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart size={13} className="text-rose-500 fill-current" />
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;