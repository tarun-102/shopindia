import GlassCard from "../ui/GlassCard";

const Footer = () => {
  return (
    <footer className="mt-20 pb-10 px-4 md:px-8 w-full">
      <GlassCard className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 border border-white/10 bg-white/5 backdrop-blur-lg rounded-3xl shadow-2xl">
        
        {/* Brand Info */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-sm">
            ShopIndia 💎
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
            Delivering quality products across India with reliable service and competitive prices. Experience premium shopping.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-xl font-bold text-white tracking-wide">Quick Links</h3>
          <ul className="text-gray-400 space-y-3 text-sm font-medium">
            <li className="hover:text-cyan-400 hover:translate-x-2 transform transition-all duration-300 cursor-pointer flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 opacity-0 transition-opacity duration-300" style={{ opacity: 'inherit' }}></span> 
              About Us
            </li>
            <li className="hover:text-cyan-400 hover:translate-x-2 transform transition-all duration-300 cursor-pointer flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 opacity-0 transition-opacity duration-300" style={{ opacity: 'inherit' }}></span> 
              Contact: Khodiyar Nagar, Ahmedabad
            </li>
            <li className="hover:text-cyan-400 hover:translate-x-2 transform transition-all duration-300 cursor-pointer flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 opacity-0 transition-opacity duration-300" style={{ opacity: 'inherit' }}></span> 
              Privacy Policy
            </li>
          </ul>
        </div>

        {/* Social & Support */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-xl font-bold text-white tracking-wide">Stay Connected</h3>
          <p className="text-gray-400 text-sm">Subscribe for product updates, offers, and new releases.</p>
          <div className="flex gap-4 pt-2">
            {/* FB Icon */}
            <span className="flex items-center justify-center w-11 h-11 bg-white/5 border border-white/10 rounded-full hover:bg-blue-600/20 hover:border-blue-500 hover:text-blue-400 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer text-white shadow-lg">
              FB
            </span>
            {/* IG Icon */}
            <span className="flex items-center justify-center w-11 h-11 bg-white/5 border border-white/10 rounded-full hover:bg-pink-500/20 hover:border-pink-500 hover:text-pink-400 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer text-white shadow-lg">
              IG
            </span>
            {/* YT Icon */}
            <span className="flex items-center justify-center w-11 h-11 bg-white/5 border border-white/10 rounded-full hover:bg-red-600/20 hover:border-red-500 hover:text-red-400 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer text-white shadow-lg">
              YT
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Copyright Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-6 px-4">
        <p className="text-center text-white/40 text-xs">© 2026 ShopIndia. All rights reserved.</p>
        <p className="text-center text-white/30 text-xs mt-2 md:mt-0">Version 1.5.5</p>
      </div>
    </footer>
  );
};

export default Footer;