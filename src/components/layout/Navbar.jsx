import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import GlassCard from "../ui/GlassCard"; 
import { logoutUser } from "../../services/auth/authService";

// 🔥 Redux aur Firebase ke naye imports
import { useSelector, useDispatch } from "react-redux";
import { auth } from "../../services/firebase"; // Apna firebase ka path check kar lena
import { onAuthStateChanged } from "firebase/auth";
import { loginUserRedux, logoutUserRedux } from "../../store/slices/authSlice"; // Path check kar lena

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Redux mein data bhejney ke liye

  const user = useSelector((state) => state.auth.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 🕵️‍♂️ YAHAN HUMNE JASOOS KO NAVBAR MEIN HI FIT KAR DIYA
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Login hote hi data Redux mein bhejo
        dispatch(loginUserRedux({
          uid: currentUser.uid,
          email: currentUser.email,
        }));
      } else {
        dispatch(logoutUserRedux());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  const handleLogout = async () => {
    await logoutUser();
    setIsMenuOpen(false); 
    navigate("/login");
  };

  const closeMenu = () => setIsMenuOpen(false); 

  return(
    <div className="px-4 pt-4 relative z-50">
        <GlassCard className="px-6 py-4 flex justify-between items-center">
          <h1 
            onClick={() => navigate("/")} 
            className="text-2xl font-bold tracking-wide cursor-pointer text-white">
              Shopindia
          </h1>
          
          <div className="hidden md:flex gap-6 text-lg items-center">
            <NavLink to="/"
              className={({isActive}) => isActive ? "text-yellow-400 font-semibold" : "text-white hover:text-yellow-300 transition"} 
            >Home</NavLink>
          
            {user ? (
              <>
                <NavLink 
                  to="/cart" 
                  className={({ isActive }) => isActive ? "text-yellow-400 font-semibold" : "text-white hover:text-yellow-300 transition"}
                >
                  Cart 🛒
                </NavLink>

                <NavLink 
                  to="/profile" 
                  className={({ isActive }) => isActive ? "text-yellow-400 font-semibold" : "text-white hover:text-yellow-300 transition"}
                >
                  Profile 👤
                </NavLink>

                <button 
                  onClick={handleLogout}
                  className="bg-red-500/80 text-white px-5 py-1.5 rounded-full hover:bg-red-500 transition font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
             <>
               <NavLink 
                to="/login" 
                className="bg-white/20 text-white px-5 py-1.5 rounded-full hover:bg-white/30 transition"
              >
                Login
              </NavLink>
              <NavLink 
                to="/signup" 
                className="bg-yellow-400 text-black px-5 py-1.5 rounded-full hover:bg-yellow-500 transition font-bold"
              >
                Sign up
              </NavLink>
             </>
            )}
          </div> {/* Desktop Menu */}

          {/* mobile menu button */}
          <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="text-2xl text-white focus:outline-none"
              >
                {isMenuOpen ? "✖️" : "☰"} 
              </button>
          </div>
        </GlassCard>

        {isMenuOpen && (
        <div className="absolute top-20 left-4 right-4 md:hidden">
          <GlassCard className="flex flex-col gap-4 p-5 text-lg">
            <NavLink to="/" onClick={closeMenu} className="text-white hover:text-yellow-300 transition">Home</NavLink>
            
            {user ? (
              <>
                <NavLink to="/cart" onClick={closeMenu} className="text-white hover:text-yellow-300 transition">Cart 🛒</NavLink>
                <NavLink to="/profile" onClick={closeMenu} className="text-white hover:text-yellow-300 transition">Profile 👤</NavLink>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500/80 text-white px-4 py-2 rounded-xl text-center font-semibold mt-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={closeMenu} className="bg-white/20 text-white px-4 py-2 rounded-xl text-center mt-2">Login</NavLink>
                <NavLink to="/signup" onClick={closeMenu} className="bg-yellow-400 text-black px-4 py-2 rounded-xl text-center font-bold">Sign up</NavLink>
              </>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  )
}

export default Navbar;