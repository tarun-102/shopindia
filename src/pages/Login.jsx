import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Loader from "../components/ui/Loader";
import ErrorBox from "../components/ui/ErrorBox";
import { loginUser } from "../services/auth/authService";
import { LogIn, Sparkles } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8 transition-colors duration-300">
      <div className="p-6 sm:p-8 w-full max-w-md bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-lg">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl mx-auto mb-3 shadow-md shadow-emerald-500/20">
            S
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Sign in to your ShopIndia account</p>
        </div>
        
        {error && (
          <div className="mb-4">
            <ErrorBox message={error} />
          </div>
        )}

        {loading ? (
          <div className="py-8">
            <Loader />
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 p-3 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">
                Password
              </label>
              <input
                type="password"
                name="password"
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 p-3 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-500/20 text-xs sm:text-sm uppercase tracking-wider transition-all mt-2"
            >
              Sign In
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Sign Up Free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;