import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/auth/authService";
import { useSelector, useDispatch } from "react-redux";
import { logoutUserRedux } from "../../store/slices/authSlice"; 
import useTheme from "../../hooks/useTheme";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); 

  const user = useSelector((state) => state.auth.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isAdminUser = user?.role === "admin";
  const isDeliveryBoy = user?.role === "deliveryboy";
  const { theme, toggleTheme } = useTheme();

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
    <div className="px-4 pt-4 md:pt-6 relative z-50 transition-all duration-500">
        
        {/* PREMIUM MAIN NAVBAR CARD */}
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center bg-white/70 dark:bg-[#0a0f16]/70 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-[2rem] transition-all duration-500">
          
          {/* Logo */}
          <h1 
            onClick={() => navigate("/")} 
            className="text-2xl font-black tracking-widest cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500 bg-clip-text text-transparent uppercase drop-shadow-sm hover:scale-105 transition-transform duration-300"
          >
            ShopIndia
          </h1>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-2 lg:gap-4 text-[13px] font-black uppercase tracking-widest items-center">
            
            <NavLink to="/" className={({isActive}) => `px-4 py-2 rounded-xl transition-all duration-300 ${isActive ? "bg-emerald-50 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"}`}>
              Home
            </NavLink>
          
            {user ? (
              <>
                <NavLink to="/cart" className={({ isActive }) => `px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${isActive ? "bg-emerald-50 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                  Cart <span className="text-lg leading-none">🛒</span>
                </NavLink>

                <NavLink to="/profile" className={({ isActive }) => `px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${isActive ? "bg-emerald-50 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                  Profile <span className="text-lg leading-none">👤</span>
                </NavLink>

                <NavLink to="/wallet" className={({ isActive }) => `px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${isActive ? "bg-emerald-50 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                  Wallet <span className="text-lg leading-none">💼</span>
                </NavLink>

                {isAdminUser && (
                  <NavLink to="/admin" className={({ isActive }) => `px-4 py-2 rounded-xl transition-all duration-300 ${isActive ? "bg-emerald-50 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                    Admin
                  </NavLink>
                )}
                
                {isDeliveryBoy && (
                  <NavLink to="/delivery" className={({ isActive }) => `px-4 py-2 rounded-xl transition-all duration-300 ${isActive ? "bg-emerald-50 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                    Delivery
                  </NavLink>
                )}

                <div className="h-6 w-[1px] bg-gray-300 dark:bg-white/10 mx-2"></div>

                {/* Theme Toggle - Premium Animated Button */}
                <button 
                  onClick={toggleTheme} 
                  aria-label="Toggle theme"
                  className="relative p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 shadow-inner group overflow-hidden" 
                >
                  <div className={`transform transition-transform duration-500 ${theme === 'dark' ? 'rotate-0' : '-rotate-90 scale-0 opacity-0 absolute'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
                    </svg>
                  </div>
                  <div className={`transform transition-transform duration-500 ${theme === 'light' ? 'rotate-0' : 'rotate-90 scale-0 opacity-0 absolute'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                      <circle cx="12" cy="12" r="4" fill="currentColor" />
                      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/>
                      </g>
                    </svg>
                  </div>
                </button>

                {/* Logout Button - Sleek styling */}
                <button 
                  onClick={handleLogout}
                  className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-rose-500/20 active:scale-95"
                >
                  Logout
                </button>
              </>
            ) : (
             <div className="flex items-center gap-3">
               {/* Theme Toggle for logged out users */}
               <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 transition-all duration-300">
                  {theme === 'dark' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-400"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-500"><circle cx="12" cy="12" r="4" fill="currentColor" /><g stroke="currentColor" strokeWidth="1.5"><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></g></svg>
                  )}
                </button>

               <NavLink to="/login" className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white px-6 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm active:scale-95">
                Login
               </NavLink>
               <NavLink to="/signup" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-2.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 active:scale-95 border border-emerald-400/50">
                Sign up
               </NavLink>
             </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center gap-3">
              {/* Theme Toggle on mobile navbar */}
              <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 transition-all duration-300">
                {theme === 'dark' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-400"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-500"><circle cx="12" cy="12" r="4" fill="currentColor" /><g stroke="currentColor" strokeWidth="1.5"><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></g></svg>
                )}
              </button>

              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 focus:outline-none active:scale-90 transition-all duration-300"
              >
                {isMenuOpen ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                )} 
              </button>
          </div>
        </div>

        {/* PREMIUM MOBILE MENU DROPDOWN */}
        {isMenuOpen && (
        <div className="absolute top-[85px] left-4 right-4 md:hidden z-40 origin-top animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col p-3 text-[13px] font-black uppercase tracking-widest bg-white/95 dark:bg-[#0a0f16]/95 backdrop-blur-3xl border border-gray-200/50 dark:border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] rounded-[2rem] overflow-hidden">
            
            <NavLink to="/" onClick={closeMenu} className="px-5 py-4 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all">Home</NavLink>
            
            {user ? (
              <>
                <div className="h-[1px] w-full bg-gray-100 dark:bg-white/5 my-1"></div>
                <NavLink to="/cart" onClick={closeMenu} className="px-5 py-4 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex justify-between">Cart <span className="text-lg">🛒</span></NavLink>
                <NavLink to="/profile" onClick={closeMenu} className="px-5 py-4 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex justify-between">Profile <span className="text-lg">👤</span></NavLink>
                <NavLink to="/wallet" onClick={closeMenu} className="px-5 py-4 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex justify-between">Wallet <span className="text-lg">💼</span></NavLink>
                
                {isAdminUser && (
                  <NavLink to="/admin" onClick={closeMenu} className="px-5 py-4 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 transition-all mt-2">Admin Dashboard</NavLink>
                )}
                
                {isDeliveryBoy && (
                  <NavLink to="/delivery" onClick={closeMenu} className="px-5 py-4 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 transition-all mt-2">Delivery Panel</NavLink>
                )}
                
                <div className="p-2 mt-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 px-4 py-4 rounded-xl text-center transition-all shadow-sm active:scale-95"
                  >
                    LOGOUT
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-3 p-2 mt-2">
                <NavLink to="/login" onClick={closeMenu} className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white px-4 py-4 rounded-xl text-center transition-all active:scale-95">Login</NavLink>
                <NavLink to="/signup" onClick={closeMenu} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-4 rounded-xl text-center shadow-lg shadow-emerald-500/20 transition-all active:scale-95 border border-emerald-400/50">Sign up</NavLink>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Navbar;