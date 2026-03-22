import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import {registerUser} from "../services/auth/authService" ;
import { use, useState } from "react";
import Loader from "../components/ui/Loader";
import ErrorBox from "../components/ui/ErrorBox";
const Signup = () => {
  const navigate = useNavigate();

  const [formData,setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [loading,setLoading] = useState(false)
//form handle 

  const handleChange = (e) =>{
    setFormData({...formData, [e.target.name]: e.target.value })
  }

  const handleSignup = async (e) =>{
    e.preventDefault();
    setError("");

    if(formData.password !== formData.confirmPassword) {
      return setError("Not match Confirm Password")
    }
    setLoading(true)

    const response = await registerUser(formData.name, formData.email, formData.password)

    if(response.success){
      alert("Account successfully Created")
      navigate('/login')
    } else {
      setError(response.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <GlassCard className="p-10 w-full max-w-md border-white/10 shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-white mb-2">Join ShopIndia!</h2>
          <p className="text-white/50">Create your account to start shopping</p>
        </div>
      {error && <ErrorBox message={error} /> }

      {loading ? (
        <Loader /> 
      ) : (
                <form className="space-y-5" onSubmit={handleSignup}>
          <div className="space-y-2">
            <label className="text-white/70 text-sm ml-1 font-semibold">Full Name</label>
            <input 
              type="text" 
              name="name"
              placeholder="e.g. Aman SHah" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-yellow-400 transition-all"
              onChange={handleChange}
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/70 text-sm ml-1 font-semibold">Email Address</label>
            <input 
              type="email" 
              name="email"
              placeholder="aman@example.com" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-yellow-400 transition-all"
              onChange={handleChange}
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/70 text-sm ml-1 font-semibold">Password</label>
            <input 
              type="password" 
              name="password"
              placeholder="Create a strong password" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-yellow-400 transition-all"

              onChange={handleChange}
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/70 text-sm ml-1 font-semibold">Confirm Password</label>
            <input 
              type="password" 
              name="confirmPassword"
              placeholder="Repeat your password" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-yellow-400 transition-all"
              onChange={handleChange}
              required 
            />
          </div>

          <button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-yellow-500/20 uppercase tracking-widest mt-4" type="submit" >
            Create Account 🚀
          </button>
        </form>
      ) }


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