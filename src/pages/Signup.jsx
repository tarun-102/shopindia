import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <GlassCard className="p-10 w-full max-w-md border-white/10 shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-white mb-2">Join ShopIndia!</h2>
          <p className="text-white/50">Create your account to start shopping</p>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-white/70 text-sm ml-1 font-semibold">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Tarun Gohil" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-yellow-400 transition-all"
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/70 text-sm ml-1 font-semibold">Email Address</label>
            <input 
              type="email" 
              placeholder="tarun@example.com" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-yellow-400 transition-all"
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/70 text-sm ml-1 font-semibold">Password</label>
            <input 
              type="password" 
              placeholder="Create a strong password" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-yellow-400 transition-all"
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/70 text-sm ml-1 font-semibold">Confirm Password</label>
            <input 
              type="password" 
              placeholder="Repeat your password" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-yellow-400 transition-all"
              required 
            />
          </div>

          <button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-yellow-500/20 uppercase tracking-widest mt-4">
            Create Account 🚀
          </button>
        </form>

        <p className="text-center text-white/40 mt-8 text-sm">
          Already have an account?{" "}
          <span 
            onClick={() => navigate('/login')}
            className="text-yellow-400 cursor-pointer hover:underline font-bold"
          >
            Login Here
          </span>
        </p>
      </GlassCard>
    </div>
  );
};

export default Signup;