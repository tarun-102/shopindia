import GlassCard from "../components/ui/GlassCard";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../services/auth/authService";
import Loader from "../components/ui/Loader";
import ErrorBox from "../components/ui/ErrorBox";
import { EmailAuthCredential } from "firebase/auth";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // handle
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const response = await loginUser(formData.email, formData.password);
    if (response.success) {
      if(response.role === "admin"){
        navigate("/admin")
      }else{
        navigate("/");
      }
      
    } else {
      setError(response.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <GlassCard className="p-10 w-full max-w-md border-white/10 shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-white mb-2">Welcome Back!</h2>
          <p className="text-white/50">Login to your ShopIndia account</p>
        </div>
        {error && <ErrorBox message={error} />}

        {loading ? (
          <Loader />
        ) : (
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-white/70 text-sm ml-1 font-semibold">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                placeholder="tarun@example.com"
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-yellow-400 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/70 text-sm ml-1 font-semibold">
                Password
              </label>
              <input
                type="password"
                name="password"
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-yellow-400 transition-all"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-yellow-500/20 uppercase tracking-widest">
              Login Now 🚀
            </button>
          </form>
        )}

        <p className="text-center text-white/40 mt-8 text-sm">
          Don't have an account?{" "}
          <span
            className="text-yellow-400 cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>
      </GlassCard>
    </div>
  );
};

export default Login;
