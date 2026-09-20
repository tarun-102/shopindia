import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Loader from "../components/ui/Loader";
import ErrorBox from "../components/ui/ErrorBox";
import { loginUser } from "../services/auth/authService";
import notify from "../components/ui/LuxuryToast";
import { LogIn, Zap, Lock, Mail } from "lucide-react";

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
      notify.success("Welcome Back! 👋", `Logged in as ${formData.email}`);
      if (response.role === "admin") {
        navigate("/admin");
      } else if (response.role === "deliveryboy") {
        navigate("/delivery");
      } else {
        navigate("/");
      }
    } else {
      setError(response.error);
      notify.error("Login Failed", response.error || "Please check your email and password.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8 transition-colors duration-300">
      <div className="p-6 sm:p-9 w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-500/25">
            <Zap size={26} className="fill-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sign in to your ShopIndia account</p>
        </div>
        
        {error && (
          <div>
            <ErrorBox message={error} />
          </div>
        )}

        {loading ? (
          <div className="py-8">
            <Loader />
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                Email Address
              </label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-3 rounded-2xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                <Mail size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                Password
              </label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-3 rounded-2xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                <Lock size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-indigo-500/25 text-xs sm:text-sm uppercase tracking-wider transition-all mt-2 active:scale-95 cursor-pointer"
            >
              Sign In 🚀
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
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