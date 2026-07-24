import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import Loader from "../components/ui/Loader";
import ErrorBox from "../components/ui/ErrorBox";
import { loginUser } from "../services/auth/authService";

const Login = () => {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Component States
  // ---------------------------------------------------------------------------
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------
  
  /**
   * Updates state dynamically based on input field changes.
   */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Handles user authentication and role-based routing.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const response = await loginUser(formData.email, formData.password);
    
    if (response.success) {
      if (response.role === "admin") {
        navigate("/admin");
      } else if (response.role === "deliveryboy") {
        navigate("/delivery");
      } else {
        navigate("/");
      }
    } else {
      setError(response.error);
    }
    
    setLoading(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <GlassCard className="p-8 md:p-10 w-full max-w-md border-white/10 shadow-2xl bg-[#111827]/80 backdrop-blur-2xl rounded-[2rem]">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Welcome Back!</h2>
          <p className="text-gray-400 text-sm">Login to your ShopIndia account</p>
        </div>
        
        {/* Error Boundary */}
        {error && (
          <div className="mb-6">
            <ErrorBox message={error} />
          </div>
        )}

        {/* Form & Loading State */}
        {loading ? (
          <div className="py-10">
            <Loader />
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-gray-300 text-xs uppercase font-bold tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                placeholder="e.g. user@example.com"
                className="w-full bg-black/40 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-300 text-xs uppercase font-bold tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black py-4 rounded-xl hover:from-emerald-500 hover:to-teal-400 hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg shadow-emerald-500/30 uppercase tracking-widest mt-2"
            >
              Sign In
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <p className="text-center text-gray-400 mt-8 text-sm font-medium">
          Don't have an account?{" "}
          <span
            className="text-emerald-400 font-bold cursor-pointer hover:text-emerald-300 transition-colors"
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