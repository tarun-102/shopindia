import { useState } from "react"; 
import { useNavigate, Link } from "react-router-dom";
import Loader from "../components/ui/Loader";
import ErrorBox from "../components/ui/ErrorBox";
import { registerUser } from "../services/auth/authService";
import notify from "../components/ui/LuxuryToast";
import { UserPlus, Zap, User, Mail, Lock } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      notify.error("Password Mismatch", "Both password fields must be identical.");
      return;
    }
    
    setLoading(true);

    const response = await registerUser(formData.name, formData.email, formData.password);

    if (response.success) {
      notify.success("Account Created! 🎉", "Welcome to ShopIndia. Please login to continue.");
      navigate('/login');
    } else {
      setError(response.error);
      notify.error("Registration Failed", response.error || "Could not register account.");
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Join ShopIndia for instant split payments and rewards</p>
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
          <form className="space-y-3.5" onSubmit={handleSignup}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Full Name</label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl focus-within:border-indigo-500">
                <User size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  placeholder="e.g. Tarun Gohil" 
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Email Address</label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl focus-within:border-indigo-500">
                <Mail size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  placeholder="name@example.com" 
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Password</label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl focus-within:border-indigo-500">
                <Lock size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  placeholder="Create a secure password" 
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Confirm Password</label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl focus-within:border-indigo-500">
                <Lock size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  placeholder="Re-enter password" 
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-indigo-500/25 text-xs sm:text-sm uppercase tracking-wider transition-all mt-2 active:scale-95 cursor-pointer"
            >
              Create Account 🚀
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link 
              to="/login"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Login Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;