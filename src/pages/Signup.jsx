import { useState } from "react"; 
import { useNavigate, Link } from "react-router-dom";
import Loader from "../components/ui/Loader";
import ErrorBox from "../components/ui/ErrorBox";
import { registerUser } from "../services/auth/authService";
import toast from 'react-hot-toast';

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
      return setError("Passwords do not match.");
    }
    
    setLoading(true);

    const response = await registerUser(formData.name, formData.email, formData.password);

    if (response.success) {
      toast.success("Account created successfully!");
      navigate('/login');
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
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Create Account</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Join ShopIndia for exclusive member perks</p>
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
          <form className="space-y-3.5" onSubmit={handleSignup}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">Full Name</label>
              <input 
                type="text" 
                name="name"
                placeholder="e.g. Tarun Gohil" 
                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 p-3 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
                onChange={handleChange}
                required 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">Email Address</label>
              <input 
                type="email" 
                name="email"
                placeholder="name@example.com" 
                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 p-3 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
                onChange={handleChange}
                required 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">Password</label>
              <input 
                type="password" 
                name="password"
                placeholder="Create a secure password" 
                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 p-3 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
                onChange={handleChange}
                required 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                placeholder="Re-enter password" 
                className="w-full bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 p-3 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
                onChange={handleChange}
                required 
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-500/20 text-xs sm:text-sm uppercase tracking-wider transition-all mt-2"
            >
              Create Account 🚀
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link 
              to="/login"
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
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