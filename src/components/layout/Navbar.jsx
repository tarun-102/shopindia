import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import GlassCard from "../ui/GlassCard"; 
import { logoutUser } from "../../services/auth/authService";
import { useSelector, useDispatch } from "react-redux";
import { logoutUserRedux } from "../../store/slices/authSlice"; 

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); 

  const user = useSelector((state) => state.auth.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isAdminUser = user?.role === "admin";
  const isDeliveryBoy = user?.role === "deliveryboy";

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      dispatch(logoutUserRedux());
    }
    setIsMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = () => setIsMenuOpen(false); 

  return(
    <div className="px-4 pt-4 relative z-50">
        <GlassCard className="px-6 py-4 flex justify-between items-center bg-[#111827]/80 backdrop-blur-2xl border-white/10 shadow-lg">
          
          {/* Logo */}
          <h1 
            onClick={() => navigate("/")} 
            className="text-2xl font-black tracking-widest cursor-pointer bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent uppercase"
          >
            ShopIndia
          </h1>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-6 text-sm font-bold uppercase tracking-wider items-center">
            <NavLink to="/"
              className={({isActive}) => isActive ? "text-emerald-400 drop-shadow-sm" : "text-gray-300 hover:text-emerald-300 transition-colors"} 
            >
              Home
            </NavLink>
          
            {user ? (
              <>
                <NavLink 
                  to="/cart" 
                  className={({ isActive }) => isActive ? "text-emerald-400 drop-shadow-sm" : "text-gray-300 hover:text-emerald-300 transition-colors"}
                >
                  Cart 🛒
                </NavLink>

                <NavLink 
                  to="/profile" 
                  className={({ isActive }) => isActive ? "text-emerald-400 drop-shadow-sm" : "text-gray-300 hover:text-emerald-300 transition-colors"}
                >
                  Profile 👤
                </NavLink>

                <NavLink 
                  to="/wallet" 
                  className={({ isActive }) => isActive ? "text-emerald-400 drop-shadow-sm" : "text-gray-300 hover:text-emerald-300 transition-colors"}
                >
                  Wallet 💼
                </NavLink>

                {/* Wallet UI intentionally hidden from main nav — wallet page available at /wallet */}

                {isAdminUser && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => isActive ? "text-emerald-400 drop-shadow-sm" : "text-gray-300 hover:text-emerald-300 transition-colors"}
                  >
                    Admin
                  </NavLink>
                )}
                
                {isDeliveryBoy && (
                  <NavLink
                    to="/delivery"
                    className={({ isActive }) => isActive ? "text-emerald-400 drop-shadow-sm" : "text-gray-300 hover:text-emerald-300 transition-colors"}
                  >
                    Delivery
                  </NavLink>
                )}

                <button 
                  onClick={handleLogout}
                  className="bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Logout
                </button>
              </>
            ) : (
             <>
               <NavLink 
                to="/login" 
                className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl hover:bg-white/10 transition-all active:scale-95"
              >
                Login
              </NavLink>
              <NavLink 
                to="/signup" 
                className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-2.5 rounded-xl hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                Sign up
              </NavLink>
             </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="text-2xl text-emerald-400 focus:outline-none transition-transform"
              >
                {isMenuOpen ? "✖️" : "☰"} 
              </button>
          </div>
        </GlassCard>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
        <div className="absolute top-24 left-4 right-4 md:hidden animate-fade-in">
          <GlassCard className="flex flex-col gap-4 p-6 text-sm font-bold uppercase tracking-wider bg-[#111827]/95 backdrop-blur-3xl border-white/10 shadow-2xl">
            <NavLink to="/" onClick={closeMenu} className="text-gray-300 hover:text-emerald-400 transition-colors">Home</NavLink>
            
            {user ? (
              <>
                <NavLink to="/cart" onClick={closeMenu} className="text-gray-300 hover:text-emerald-400 transition-colors">Cart 🛒</NavLink>
                <NavLink to="/profile" onClick={closeMenu} className="text-gray-300 hover:text-emerald-400 transition-colors">Profile 👤</NavLink>
                <NavLink to="/wallet" onClick={closeMenu} className="text-gray-300 hover:text-emerald-400 transition-colors">Wallet 💼</NavLink>
                
                {isAdminUser && (
                  <NavLink to="/admin" onClick={closeMenu} className="text-gray-300 hover:text-emerald-400 transition-colors">Admin Dashboard</NavLink>
                )}
                
                {isDeliveryBoy && (
                  <NavLink to="/delivery" onClick={closeMenu} className="text-gray-300 hover:text-emerald-400 transition-colors">Delivery Panel</NavLink>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-center mt-4 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                <NavLink to="/login" onClick={closeMenu} className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-center transition-all">Login</NavLink>
                <NavLink to="/signup" onClick={closeMenu} className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-4 py-3 rounded-xl text-center shadow-lg shadow-emerald-500/20 transition-all">Sign up</NavLink>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  )
}

export default Navbar;