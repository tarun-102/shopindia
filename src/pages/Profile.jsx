import GlassCard from "../components/ui/GlassCard";
const Profile = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-32 h-32 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-5xl font-black text-black shadow-xl">
          T
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black text-white">Tarun Gohil</h1>
          <p className="text-white/50 italic">BCA Student | ShopIndia Customer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-yellow-400 font-bold mb-4">Account Details 👤</h3>
          <p className="text-white/70">Email: tarun.dev@example.com</p>
          <p className="text-white/70">Location: Ahmedabad, Gujarat</p>
        </GlassCard>
        
        <GlassCard className="p-6">
          <h3 className="text-yellow-400 font-bold mb-4">Total Orders 📦</h3>
          <p className="text-white/70 text-3xl font-black">0</p>
          <p className="text-white/40 text-sm italic mt-1">Start shopping to see orders!</p>
        </GlassCard>
      </div>
    </div>
  );
};

export default Profile;