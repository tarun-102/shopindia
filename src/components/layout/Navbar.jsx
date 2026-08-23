import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { logoutUser } from "../../services/auth/authService";
import { useSelector, useDispatch } from "react-redux";
import { logoutUserRedux } from "../../store/slices/authSlice"; 
import useTheme from "../../hooks/useTheme";
import { getAllProducts } from "../../services/productservices";
import { formatPrice } from "../../utils/priceFormatter";
import { 
  Home as HomeIcon, 
  ShoppingCart, 
  UserRound, 
  WalletCards, 
  Search, 
  Menu, 
  X, 
  ShieldCheck, 
  Truck, 
  LayoutGrid, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronRight,
  Sparkles,
  Package,
  Star
} from "lucide-react";
import { category } from "../../utils/categories";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch(); 
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const user = useSelector((state) => state.auth.user);
  const cartQuantity = useSelector((state) => state.cart.totalQuantity);
  const isAdminUser = user?.role === "admin";
  const isDeliveryBoy = user?.role === "deliveryboy";
  const { theme, toggleTheme } = useTheme();

  // Pre-load products list for instant auto-suggestions
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const prods = await getAllProducts();
        setAllProducts(prods || []);
      } catch (err) {
        console.error("Navbar products preload error:", err);
      }
    };
    loadProducts();
  }, []);

  // Filter live search suggestions
  const searchSuggestions = searchQuery.trim().length >= 1
    ? allProducts
        .filter((p) => `${p.title} ${p.category}`.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
    setIsSearchFocused(false);
  }, [location.pathname]);

  // Handle outside click to close search suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      dispatch(logoutUserRedux());
    }
    setIsDrawerOpen(false);
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      setIsSearchFocused(false);
      if (searchQuery.trim()) {
        navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate("/");
      }
    }
  };

  const handleSelectProductSuggestion = (productId) => {
    setIsSearchFocused(false);
    setSearchQuery("");
    navigate(`/product/${productId}`);
  };

  return (
    <>
      {/* ================= DESKTOP & MOBILE APP HEADER ================= */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#0b111a]/90 backdrop-blur-xl border-b border-gray-200/80 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-3 md:gap-8">
            
            {/* Left: Mobile Menu Trigger + Brand Logo */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open navigation menu"
                className="md:hidden p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                <Menu size={22} />
              </button>

              <div 
                onClick={() => navigate("/")}
                className="cursor-pointer flex items-center gap-1.5 group select-none"
              >
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  S
                </div>
                <div className="flex flex-col">
                  <span className="text-lg md:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent uppercase">
                    ShopIndia
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold -mt-1 hidden sm:block">
                    India's Store
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Desktop Search Bar with Live Suggestions Dropdown */}
            <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-xl relative">
              <div className="w-full flex items-center bg-gray-100/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-inner focus-within:border-emerald-500 dark:focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                <Search size={18} className="text-gray-400 dark:text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onKeyDown={handleSearchSubmit}
                  placeholder="Search products, brands, deals..."
                  className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(""); navigate("/"); }}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white px-1.5 font-bold"
                  >
                    ✕
                  </button>
                )}
                <button
                  onClick={handleSearchSubmit}
                  className="ml-2 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  Search
                </button>
              </div>

              {/* Desktop Live Auto-Suggestions Dropdown */}
              {isSearchFocused && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in space-y-1">
                  <p className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">Quick Product Matches</p>
                  {searchSuggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectProductSuggestion(item.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={item.thumbnail} 
                          alt={item.title} 
                          className="w-10 h-10 object-contain rounded-lg bg-gray-50 dark:bg-slate-850 p-1 border border-gray-100 dark:border-slate-750 shrink-0" 
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-gray-400 dark:text-slate-500">{item.category}</span>
                        </div>
                      </div>
                      <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                        ₹{formatPrice(item.price)}
                      </span>
                    </div>
                  ))}
                  <div 
                    onClick={handleSearchSubmit}
                    className="mt-1 pt-2 border-t border-gray-100 dark:border-slate-800 text-center py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    See all results for "{searchQuery}" →
                  </div>
                </div>
              )}
            </div>

            {/* Right: Actions (Desktop Navigation Links + Theme + User) */}
            <div className="hidden md:flex items-center gap-1.5 lg:gap-3 text-[13px] font-bold">
              <NavLink 
                to="/" 
                className={({ isActive }) => `px-3.5 py-2 rounded-xl transition-all ${
                  isActive 
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black" 
                    : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                }`}
              >
                Home
              </NavLink>

              {/* Admin Panel Badge Link */}
              {isAdminUser && (
                <NavLink 
                  to="/admin" 
                  className={({ isActive }) => `px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    isActive 
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                      : "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100"
                  }`}
                >
                  <ShieldCheck size={16} />
                  <span>Admin Panel</span>
                </NavLink>
              )}

              {/* Delivery Portal Badge Link */}
              {isDeliveryBoy && (
                <NavLink 
                  to="/delivery" 
                  className={({ isActive }) => `px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    isActive 
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                      : "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-300 hover:bg-amber-100"
                  }`}
                >
                  <Truck size={16} />
                  <span>Delivery Portal</span>
                </NavLink>
              )}

              {user ? (
                <>
                  <NavLink 
                    to="/profile" 
                    className={({ isActive }) => `px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                      isActive 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black" 
                        : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Package size={16} />
                    <span>Orders</span>
                  </NavLink>

                  <NavLink 
                    to="/wallet" 
                    className={({ isActive }) => `px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                      isActive 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black" 
                        : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <WalletCards size={16} />
                    <span>Wallet</span>
                  </NavLink>

                  <NavLink 
                    to="/cart" 
                    className={({ isActive }) => `relative px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                      isActive 
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                        : "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-white hover:bg-gray-200"
                    }`}
                  >
                    <ShoppingCart size={17} />
                    <span>Cart</span>
                    {cartQuantity > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                        {cartQuantity}
                      </span>
                    )}
                  </NavLink>

                  <div className="h-5 w-[1px] bg-gray-200 dark:bg-slate-800 mx-1"></div>

                  <button 
                    onClick={toggleTheme} 
                    aria-label="Toggle theme"
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-700" />}
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="p-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={17} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleTheme} 
                    aria-label="Toggle theme"
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-700" />}
                  </button>

                  <NavLink 
                    to="/login" 
                    className="px-4 py-2 rounded-xl text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Login
                  </NavLink>

                  <NavLink 
                    to="/signup" 
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    Sign Up
                  </NavLink>
                </div>
              )}
            </div>

            {/* Mobile Header Right: Theme & Cart */}
            <div className="flex md:hidden items-center gap-1.5">
              <button 
                onClick={toggleTheme} 
                aria-label="Toggle theme"
                className="p-2 rounded-xl text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-slate-700" />}
              </button>

              <NavLink 
                to="/cart" 
                aria-label="View Cart"
                className="relative p-2 rounded-xl text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ShoppingCart size={21} />
                {cartQuantity > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center px-1 shadow-sm">
                    {cartQuantity}
                  </span>
                )}
              </NavLink>
            </div>

          </div>

          {/* Mobile Search Bar with Auto-suggestions */}
          <div ref={mobileSearchRef} className="md:hidden pb-3 relative">
            <div className="flex items-center bg-gray-100/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-inner focus-within:border-emerald-500 dark:focus-within:border-emerald-400">
              <Search size={16} className="text-gray-400 dark:text-slate-500 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={handleSearchSubmit}
                placeholder="Search products, brands, deals..."
                className="w-full bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none"
              />
              {searchQuery ? (
                <button 
                  onClick={() => { setSearchQuery(""); navigate("/"); }}
                  className="text-xs text-gray-400 px-1 font-bold"
                >
                  ✕
                </button>
              ) : (
                <button
                  onClick={handleSearchSubmit}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-1"
                >
                  Go
                </button>
              )}
            </div>

            {/* Mobile Auto-Suggestions Dropdown */}
            {isSearchFocused && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-fade-in space-y-1">
                {searchSuggestions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectProductSuggestion(item.id)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-850 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={item.thumbnail} 
                        alt={item.title} 
                        className="w-8 h-8 object-contain rounded bg-gray-50 dark:bg-slate-800 p-0.5 border shrink-0" 
                      />
                      <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {item.title}
                      </p>
                    </div>
                    <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      ₹{formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ================= MOBILE APP SLIDE-OUT DRAWER ================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          ></div>

          <aside className="fixed inset-y-0 left-0 w-[82%] max-w-[320px] bg-white dark:bg-[#0c131d] shadow-2xl flex flex-col justify-between z-10 border-r border-gray-200 dark:border-slate-800 overflow-y-auto">
            
            <div>
              {/* Drawer User Header */}
              <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative">
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-3 mt-1">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black border border-white/30 shadow-inner">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : "G"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">
                      {user?.displayName || (user ? "Valued Customer" : "Welcome, Guest")}
                    </h3>
                    <p className="text-xs text-emerald-100 truncate">
                      {user?.email || "Sign in to access all features"}
                    </p>
                    {user && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                        <Sparkles size={10} />
                        {isAdminUser ? "Admin Access" : isDeliveryBoy ? "Delivery Partner" : "Member"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* SPECIAL ROLE ACCESS BANNER (ADMIN / DELIVERY) */}
              {isAdminUser && (
                <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50">
                  <NavLink
                    to="/admin"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm shadow-md shadow-indigo-500/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={20} className="text-amber-300" />
                      <div>
                        <p className="font-black leading-tight">Admin Control Panel</p>
                        <p className="text-[10px] text-indigo-200 font-medium">Manage Products, Orders & Stock</p>
                      </div>
                    </div>
                    <ChevronRight size={18} />
                  </NavLink>
                </div>
              )}

              {isDeliveryBoy && (
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/50">
                  <NavLink
                    to="/delivery"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-md shadow-amber-500/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck size={20} />
                      <div>
                        <p className="font-black leading-tight">Delivery Portal</p>
                        <p className="text-[10px] text-amber-100 font-medium">Manage active dispatches & OTPs</p>
                      </div>
                    </div>
                    <ChevronRight size={18} />
                  </NavLink>
                </div>
              )}

              {/* Main Navigation Links */}
              <div className="p-3 space-y-1">
                <p className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Navigation
                </p>

                <NavLink
                  to="/"
                  onClick={() => setIsDrawerOpen(false)}
                  className={({ isActive }) => `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                    isActive 
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                      : "text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HomeIcon size={18} />
                    <span>Home Store</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </NavLink>

                <NavLink
                  to="/cart"
                  onClick={() => setIsDrawerOpen(false)}
                  className={({ isActive }) => `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                    isActive 
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                      : "text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={18} />
                    <span>Shopping Cart</span>
                  </div>
                  {cartQuantity > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black">
                      {cartQuantity}
                    </span>
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </NavLink>

                <NavLink
                  to={user ? "/profile" : "/login"}
                  onClick={() => setIsDrawerOpen(false)}
                  className={({ isActive }) => `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                    isActive 
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                      : "text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserRound size={18} />
                    <span>My Orders & Profile</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </NavLink>

                <NavLink
                  to={user ? "/wallet" : "/login"}
                  onClick={() => setIsDrawerOpen(false)}
                  className={({ isActive }) => `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                    isActive 
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                      : "text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <WalletCards size={18} />
                    <span>ShopIndia Wallet</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </NavLink>

                <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                  <p className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    Explore Categories
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 px-1 py-1">
                    {category.slice(0, 6).map((cat) => (
                      <NavLink
                        key={cat.id}
                        to={`/category/${cat.value}`}
                        onClick={() => setIsDrawerOpen(false)}
                        className="flex items-center gap-1.5 p-2 rounded-lg bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 truncate"
                      >
                        <span>{cat.name}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 space-y-3">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-bold text-xs text-gray-800 dark:text-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
                  <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700">
                  {theme}
                </span>
              </button>

              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs shadow-sm hover:bg-rose-500 hover:text-white transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <NavLink
                    to="/login"
                    onClick={() => setIsDrawerOpen(false)}
                    className="py-2.5 text-center rounded-xl bg-gray-100 dark:bg-slate-800 font-bold text-xs text-gray-800 dark:text-white"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/signup"
                    onClick={() => setIsDrawerOpen(false)}
                    className="py-2.5 text-center rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    Register
                  </NavLink>
                </div>
              )}
            </div>

          </aside>
        </div>
      )}

      {/* ================= MOBILE BOTTOM APP NAVIGATION BAR ================= */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b111a]/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-slate-800 px-2 pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(0,0,0,0.06)] transition-colors"
        aria-label="Mobile Navigation"
      >
        <div className="mx-auto grid grid-cols-5 items-center text-center">
          
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-all ${
              isActive 
                ? "text-emerald-600 dark:text-emerald-400 scale-105" 
                : "text-gray-500 dark:text-slate-400"
            }`}
          >
            <HomeIcon size={20} />
            <span>Home</span>
          </NavLink>

          <button 
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold text-gray-500 dark:text-slate-400 transition-all hover:text-emerald-600"
          >
            <LayoutGrid size={20} />
            <span>Menu</span>
          </button>

          {isAdminUser ? (
            <NavLink 
              to="/admin" 
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-all ${
                isActive 
                  ? "text-indigo-600 dark:text-indigo-400 scale-105" 
                  : "text-indigo-500 dark:text-indigo-400"
              }`}
            >
              <div className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                <ShieldCheck size={18} />
              </div>
              <span className="font-black">Admin</span>
            </NavLink>
          ) : isDeliveryBoy ? (
            <NavLink 
              to="/delivery" 
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-all ${
                isActive 
                  ? "text-amber-600 dark:text-amber-400 scale-105" 
                  : "text-amber-500 dark:text-amber-400"
              }`}
            >
              <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <Truck size={18} />
              </div>
              <span className="font-black">Delivery</span>
            </NavLink>
          ) : (
            <NavLink 
              to={user ? "/wallet" : "/signup"} 
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-all ${
                isActive 
                  ? "text-emerald-600 dark:text-emerald-400 scale-105" 
                  : "text-gray-500 dark:text-slate-400"
              }`}
            >
              <WalletCards size={20} />
              <span>{user ? "Wallet" : "Join"}</span>
            </NavLink>
          )}

          <NavLink 
            to="/cart" 
            className={({ isActive }) => `relative flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-all ${
              isActive 
                ? "text-emerald-600 dark:text-emerald-400 scale-105" 
                : "text-gray-500 dark:text-slate-400"
            }`}
          >
            <div className="relative">
              <ShoppingCart size={20} />
              {cartQuantity > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center px-0.5">
                  {cartQuantity}
                </span>
              )}
            </div>
            <span>Cart</span>
          </NavLink>

          <NavLink 
            to={user ? "/profile" : "/login"} 
            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition-all ${
              isActive 
                ? "text-emerald-600 dark:text-emerald-400 scale-105" 
                : "text-gray-500 dark:text-slate-400"
            }`}
          >
            <UserRound size={20} />
            <span>{user ? "Account" : "Login"}</span>
          </NavLink>

        </div>
      </nav>
    </>
  );
};

export default Navbar;