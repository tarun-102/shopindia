import { NavLink } from "react-router-dom";
import GlassCard from "../ui/GlassCard";

const Navbar = () => {
  return (
    <div className="px-6 pt-4">

      <GlassCard className="px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <h1 className="text-2xl font-bold tracking-wide">
          Shopvora 💎
        </h1>

        {/* Menu */}
        <div className="flex gap-6 text-lg">

          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-yellow-400 font-semibold"
                : "hover:text-yellow-300 transition"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) =>
              isActive
                ? "text-yellow-400 font-semibold"
                : "hover:text-yellow-300 transition"
            }
          >
            Cart 🛒
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive
                ? "text-yellow-400 font-semibold"
                : "hover:text-yellow-300 transition"
            }
          >
            Profile 👤
          </NavLink>

          <NavLink
            to="/login"
            className="bg-white/20 px-4 py-1 rounded-full hover:bg-white/30 transition"
          >
            Login
          </NavLink>

            <NavLink
              to="/signup"
              className="bg-white/20 px-4 py-1 rounded-full hover:bg-white/30 transition"
            >Sign up</NavLink>
        </div>

      </GlassCard>

    </div>
  );
};

export default Navbar;
