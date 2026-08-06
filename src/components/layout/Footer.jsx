import GlassCard from "../ui/GlassCard";
import useTheme from '../../hooks/useTheme';

const Footer = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <footer className="mt-20 pb-10 px-4 md:px-8 w-full transition-colors duration-500">
      <GlassCard className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#111827]/60 backdrop-blur-xl rounded-3xl shadow-lg dark:shadow-2xl transition-all duration-500">
        
        {/* Brand Info */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent drop-shadow-sm">
            ShopIndia 💎
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-sm transition-colors">
            Delivering quality products across India with reliable service and competitive prices. Experience premium shopping.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide transition-colors">Quick Links</h3>
          <ul className="text-gray-600 dark:text-gray-400 space-y-3 text-sm font-medium">
            <li className="group hover:text-cyan-600 dark:hover:text-cyan-400 hover:translate-x-2 transform transition-all duration-300 cursor-pointer flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span> 
              About Us
            </li>
            <li className="group hover:text-cyan-600 dark:hover:text-cyan-400 hover:translate-x-2 transform transition-all duration-300 cursor-pointer flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span> 
              Contact: Khodiyar Nagar, Ahmedabad
            </li>
            <li className="group hover:text-cyan-600 dark:hover:text-cyan-400 hover:translate-x-2 transform transition-all duration-300 cursor-pointer flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span> 
              Privacy Policy
            </li>
          </ul>
        </div>

        {/* Social & Support */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide transition-colors">Stay Connected</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Subscribe for product updates, offers, and new releases.</p>
          <div className="flex gap-4 pt-2">
            {/* FB Icon */}
            <span className="flex items-center justify-center w-11 h-11 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white rounded-full hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 dark:hover:bg-blue-600/20 dark:hover:text-blue-400 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer shadow-sm dark:shadow-lg">
              FB
            </span>
            {/* IG Icon */}
            <span className="flex items-center justify-center w-11 h-11 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white rounded-full hover:bg-pink-50 hover:border-pink-500 hover:text-pink-600 dark:hover:bg-pink-500/20 dark:hover:text-pink-400 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer shadow-sm dark:shadow-lg">
              IG
            </span>
            {/* YT Icon */}
            <span className="flex items-center justify-center w-11 h-11 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white rounded-full hover:bg-red-50 hover:border-red-500 hover:text-red-600 dark:hover:bg-red-600/20 dark:hover:text-red-400 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer shadow-sm dark:shadow-lg">
              YT
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Copyright & Theme Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-6 px-4 gap-3">
        <div className="flex items-center gap-4">
          <p className="text-center text-gray-500 dark:text-white/40 text-xs font-medium transition-colors">© 2026 ShopIndia. All rights reserved.</p>
          <p className="text-center text-gray-400 dark:text-white/30 text-xs font-medium transition-colors">Version 1.5.6</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-800 dark:text-white/90 hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center gap-2 shadow-sm dark:shadow-none"
          >
            {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;