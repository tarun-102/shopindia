import GlassCard from "../ui/GlassCard";

const Footer = () => {
  return (
    <footer className="mt-20 pb-10 px-6">
      <GlassCard className="p-10 grid grid-cols-1 md:grid-cols-3 gap-10 border-white/10">
        {/* Brand Info */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white">ShopIndia 💎</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Ahmedabad se seedha aapke ghar tak. Best deals aur trusted products ka ek hi thikana.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-yellow-400">Quick Links</h3>
          <ul className="text-white/60 space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer transition">About Us</li>
            <li className="hover:text-white cursor-pointer transition">Contact: Khodiyar Nagar, Ahmedabad</li>
            <li className="hover:text-white cursor-pointer transition">Privacy Policy</li>
          </ul>
        </div>

        {/* Social & Support */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-yellow-400">Follow Us</h3>
          <p className="text-white/60 text-sm">Hamare naye updates ke liye jude rahein.</p>
          <div className="flex gap-4">
            <span className="bg-white/10 p-2 rounded-lg hover:bg-white/20 cursor-pointer transition">FB</span>
            <span className="bg-white/10 p-2 rounded-lg hover:bg-white/20 cursor-pointer transition">IG</span>
            <span className="bg-white/10 p-2 rounded-lg hover:bg-white/20 cursor-pointer transition">YT</span>
          </div>
        </div>
      </GlassCard>
      <p className="text-center text-white/20 text-xs mt-8">© 2026 ShopIndia. Made with ❤️ by Tarun Gohil</p>
    </footer>
  );
};

export default Footer;