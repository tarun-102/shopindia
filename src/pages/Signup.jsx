import { useState } from "react"; 
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import Loader from "../components/ui/Loader";
import ErrorBox from "../components/ui/ErrorBox";
import { registerUser } from "../services/auth/authService";

const Signup = () => {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Component States
  // ---------------------------------------------------------------------------
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /**
   * Updates form state dynamically on input change.
   */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Handles user registration, form validation, and routing.
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    
    setLoading(true);

    const response = await registerUser(formData.name, formData.email, formData.password);

    if (response.success) {
      alert("Account successfully created!");
      navigate('/login');
    } else {
      setError(response.error);
    }
    
    setLoading(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10 transition-colors duration-500">
      <GlassCard className="p-8 md:p-10 w-full max-w-md border-gray-200 dark:border-white/10 shadow-xl dark:shadow-2xl bg-white/90 dark:bg-[#111827]/80 backdrop-blur-2xl rounded-[2rem]">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Create Your Account</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Register now to access exclusive offers and fast checkout.</p>
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
          <form className="space-y-5" onSubmit={handleSignup}>
            <div className="space-y-2">
              <label className="text-gray-600 dark:text-gray-300 text-xs uppercase font-bold tracking-widest ml-1">Full Name</label>
              <input 
                type="text" 
                name="name"
                placeholder="e.g. Niraj Katariya" 
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-gray-700 p-4 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                onChange={handleChange}
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-600 dark:text-gray-300 text-xs uppercase font-bold tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                name="email"
                placeholder="user@example.com" 
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-gray-700 p-4 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                onChange={handleChange}
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-600 dark:text-gray-300 text-xs uppercase font-bold tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                name="password"
                placeholder="Create a strong password" 
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-gray-700 p-4 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                onChange={handleChange}
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-600 dark:text-gray-300 text-xs uppercase font-bold tracking-widest ml-1">Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                placeholder="Repeat your password" 
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-gray-700 p-4 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                onChange={handleChange}
                required 
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black py-4 rounded-xl hover:from-emerald-500 hover:to-teal-400 hover:-translate-y-0.5 active:scale-95 transition-all shadow-md dark:shadow-lg dark:shadow-emerald-500/30 uppercase tracking-widest mt-4"
            >
              Create Account 🚀
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8 text-sm font-medium">
          Already have an account?{" "}
          <span 
            onClick={() => navigate('/login')}
            className="text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            Login Here
          </span>
        </p>
      </GlassCard>
    </div>
  );
};

export default Signup;