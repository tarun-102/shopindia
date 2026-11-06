import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase"; 
import { doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import notify from "../components/ui/LuxuryToast";
import { formatPrice } from "../utils/priceFormatter";
import { getUserOrders, getAllProducts } from "../services/productservices";
import { addToCart } from "../store/slices/CartSlice";
import { logoutUser } from "../services/auth/authService";
import { logoutUserRedux } from "../store/slices/authSlice";
import { 
  User, 
  Package, 
  Wallet, 
  Heart, 
  Truck, 
  ShieldCheck, 
  Plus, 
  ChevronRight, 
  MapPin, 
  Phone, 
  Mail, 
  LogOut, 
  Sparkles, 
  Clock, 
  ShoppingCart,
  Trash2,
  Edit2,
  Check,
  CreditCard,
  ExternalLink
} from "lucide-react";

const Profile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview"); // 'overview' | 'wishlist' | 'address'

  // Wallet Top-up Modal
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState(500);

  // Saved Address Edit State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "382350"
  });

  const authState = useSelector((state) => state.auth);
  const userRole = authState?.role || "customer";
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setLoading(true);

        try {
          // Fetch user document from Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            if (data.shippingAddress) {
              setAddressForm({
                name: data.shippingAddress.name || user.displayName || "",
                phone: data.shippingAddress.phone || "",
                address: data.shippingAddress.address || "",
                city: data.shippingAddress.city || "Ahmedabad",
                state: data.shippingAddress.state || "Gujarat",
                pincode: data.shippingAddress.pincode || "382350"
              });
            } else {
              setAddressForm(prev => ({
                ...prev,
                name: user.displayName || ""
              }));
            }
          }

          // Fetch orders count for quick badge
          const orders = await getUserOrders(user.uid);
          setOrdersCount(orders.length);
          const active = orders.filter(o => 
            !o.status?.toLowerCase().includes("delivered") && 
            !o.status?.toLowerCase().includes("cancel")
          ).length;
          setActiveOrdersCount(active);

        } catch (e) {
          console.error("Error loading profile:", e);
        }

        // Load Wishlist
        loadWishlist();
        setLoading(false);
      } else {
        setCurrentUser(null);
        setLoading(false);
        navigate("/login");
      }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
    return () => unsubscribe();
  }, [navigate]);

  const loadWishlist = async () => {
    try {
      const savedIds = JSON.parse(localStorage.getItem("shopindia_wishlist") || "[]");
      if (savedIds.length > 0) {
        const allProds = await getAllProducts();
        const filtered = allProds.filter(p => savedIds.includes(p.id));
        setWishlistProducts(filtered);
      } else {
        setWishlistProducts([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveWishlist = (productId) => {
    try {
      let saved = JSON.parse(localStorage.getItem("shopindia_wishlist") || "[]");
      saved = saved.filter(id => id !== productId);
      localStorage.setItem("shopindia_wishlist", JSON.stringify(saved));
      setWishlistProducts(prev => prev.filter(p => p.id !== productId));
      notify.info("Removed from Wishlist", "Item removed from your saved collection.");
    } catch (e) {}
  };

  const handleAddToCartFromWishlist = (product) => {
    dispatch(addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.thumbnail || product.image,
      gstRate: product.gstRate !== undefined ? product.gstRate : 18,
      isReturnable: product.isReturnable !== false
    }));
    notify.success("Added to Cart 🛒", `${product.title} added to your shopping bag.`);
  };

  const submitAddMoney = async () => {
    if (!currentUser) return;
    const amount = Number(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) {
      notify.error("Invalid Amount", "Please enter a valid rupee amount.");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      const wallet = (userSnap.exists() && userSnap.data().wallet) || { balance: 0, transactions: [] };
      const newBalance = (wallet.balance || 0) + amount;
      
      const newTx = {
        type: "credit",
        amount: amount,
        note: "Instant Wallet Top-up",
        date: new Date().toISOString()
      };

      await updateDoc(userRef, { 
        "wallet.balance": newBalance,
        "wallet.transactions": arrayUnion(newTx)
      });

      setUserData(prev => ({
        ...prev,
        wallet: {
          ...(prev?.wallet || {}),
          balance: newBalance,
          transactions: [...(prev?.wallet?.transactions || []), newTx]
        }
      }));

      notify.success("Wallet Top-up Successful! 💳", `₹${formatPrice(amount)} added to your balance`);
      setShowAddMoneyModal(false);
    } catch (err) {
      console.error(err);
      notify.error("Top-up Failed", "Could not complete wallet top-up.");
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        shippingAddress: addressForm
      });
      setUserData(prev => ({ ...prev, shippingAddress: addressForm }));
      setIsEditingAddress(false);
      notify.success("Address Saved", "Your delivery details have been updated.");
    } catch (err) {
      console.error(err);
      notify.error("Update Failed", "Could not save address details.");
    }
  };

  const handleLogout = async () => {
    const res = await logoutUser();
    if (res.success) {
      dispatch(logoutUserRedux());
      notify.info("Signed Out", "You have been logged out successfully.");
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[65vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Loading Account...
        </span>
      </div>
    );
  }

  const walletBalance = userData?.wallet?.balance || 0;

  return (
    <div className="space-y-4 md:space-y-6 min-h-[85vh] transition-colors pb-12 max-w-4xl mx-auto">
      
      {/* Wallet Add Money Modal */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 rounded-3xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CreditCard size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Top-up ShopIndia Wallet</h3>
              </div>
              <button 
                onClick={() => setShowAddMoneyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Amount to Add (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    min="10"
                    value={addMoneyAmount}
                    onChange={(e) => setAddMoneyAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-white font-bold text-base outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Select Chips */}
              <div className="flex gap-2">
                {[200, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAddMoneyAmount(amt)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      Number(addMoneyAmount) === amt
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:border-emerald-500/40"
                    }`}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                ⚡ Wallet money can be used for instant 1-click checkout and automated monthly bonus rewards.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowAddMoneyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitAddMoney}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 shadow-md transition-all cursor-pointer active:scale-95"
              >
                Add Money 💳
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Mobile-First Profile Header Card */}
      <div className="p-4 sm:p-6 bg-white dark:bg-[#0c1220] rounded-2xl md:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
          
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg text-white font-black uppercase shadow-indigo-500/25 shrink-0">
              {currentUser?.displayName ? currentUser.displayName.charAt(0) : currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : "U"}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {currentUser?.displayName || "ShopIndia Customer"}
                </h1>
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                  {userRole}
                </span>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                <Mail size={13} className="text-slate-400" />
                <span>{currentUser?.email}</span>
              </p>
            </div>
          </div>

          {/* Wallet Balance Capsule */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#070b14] p-2.5 sm:p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Wallet Balance</span>
              <span className="font-mono text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                ₹{formatPrice(walletBalance)}
              </span>
            </div>
            <button
              onClick={() => setShowAddMoneyModal(true)}
              className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
              title="Add Money"
            >
              <Plus size={16} />
            </button>
          </div>

        </div>

        {/* Quick Stats Rail */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center">
          <Link
            to="/orders"
            className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 transition-colors group cursor-pointer"
          >
            <span className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 block group-hover:scale-105 transition-transform">
              {ordersCount}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400">
              {activeOrdersCount > 0 ? `${activeOrdersCount} Active Orders` : "Total Orders"}
            </span>
          </Link>

          <button
            onClick={() => setActiveView("wishlist")}
            className="p-2.5 rounded-xl bg-pink-50/60 dark:bg-pink-950/20 hover:bg-pink-100 dark:hover:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 transition-colors group cursor-pointer"
          >
            <span className="text-lg sm:text-xl font-black text-pink-600 dark:text-pink-400 block group-hover:scale-105 transition-transform">
              {wishlistProducts.length}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400">
              Saved Wishlist
            </span>
          </button>

          <Link
            to="/wallet"
            className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 transition-colors group cursor-pointer"
          >
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 block group-hover:scale-105 transition-transform">
              ₹{formatPrice(walletBalance)}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400">
              Passbook & Pay
            </span>
          </Link>
        </div>
      </div>

      {/* Role Portals (Admin & Delivery Partner shortcuts) */}
      {(userRole === "admin" || userRole === "deliveryboy") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {userRole === "admin" && (
            <Link
              to="/admin"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-indigo-950 dark:text-indigo-200">Admin Control Center</h4>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-400">Manage catalog, GST rates & stock</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {userRole === "deliveryboy" && (
            <Link
              to="/delivery"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-sm">
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-200">Delivery Partner Portal</h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">Verify customer OTP & mark dispatches</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* 2. Main Mobile Navigation Cards */}
      <div className="bg-white dark:bg-[#0c1220] rounded-2xl md:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        
        {/* Dedicated Orders Page Link */}
        <Link
          to="/orders"
          className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-[#070b14] transition-colors group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Package size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  My Orders & Live Tracking
                </h4>
                {activeOrdersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black animate-pulse">
                    {activeOrdersCount} In Transit
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ShopIndia Prime vertical tracker, OTP codes & 1-click tax invoices
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>View Orders</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Saved Delivery Address Item */}
        <div className="p-4 hover:bg-slate-50 dark:hover:bg-[#070b14] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <MapPin size={20} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Saved Delivery Address
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {addressForm.address ? `${addressForm.address}, ${addressForm.city} - ${addressForm.pincode}` : "No default address saved yet"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditingAddress(!isEditingAddress)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
            >
              <Edit2 size={13} />
              <span>{isEditingAddress ? "Cancel" : "Edit"}</span>
            </button>
          </div>

          {/* Address Edit Form Inline Drawer */}
          {isEditingAddress && (
            <form onSubmit={handleSaveAddress} className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Street Address / Landmark</label>
                <input
                  type="text"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  required
                  placeholder="House/Flat No, Apartment, Street Road"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">City</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Wishlist Link */}
        <div 
          onClick={() => setActiveView(activeView === "wishlist" ? "overview" : "wishlist")}
          className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-[#070b14] transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Heart size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Saved Wishlist
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
                  {wishlistProducts.length} items
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Products you heart for easy 1-click cart transfer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400">
            <span>{activeView === "wishlist" ? "Hide" : "View"}</span>
            <ChevronRight size={16} className={`transition-transform ${activeView === "wishlist" ? "rotate-90" : "group-hover:translate-x-1"}`} />
          </div>
        </div>

        {/* ShopIndia Wallet Link */}
        <Link
          to="/wallet"
          className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-[#070b14] transition-colors group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wallet size={20} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                ShopIndia Wallet & Passbook
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Available: ₹{formatPrice(walletBalance)} • Instant refunds & monthly bonus
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>Passbook</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

      </div>

      {/* 3. Inline Wishlist Section (When toggled) */}
      {activeView === "wishlist" && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#0c1220] rounded-2xl md:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-pink-500" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Saved Wishlist ({wishlistProducts.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveView("overview")}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Close
            </button>
          </div>

          {wishlistProducts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <p>Your wishlist is currently empty.</p>
              <Link to="/" className="mt-2 inline-block font-bold text-indigo-600 hover:underline">
                Explore Deals
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wishlistProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-[#070b14] border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.thumbnail} alt={p.title} className="w-12 h-12 object-contain rounded-xl bg-white dark:bg-white p-1 border shrink-0" />
                    <div className="min-w-0">
                      <Link to={`/product/${p.id}`} className="font-bold text-xs text-slate-900 dark:text-white truncate block hover:text-indigo-600">
                        {p.title}
                      </Link>
                      <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400">₹{formatPrice(p.price)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAddToCartFromWishlist(p)}
                      className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
                      title="Move to Cart"
                    >
                      <ShoppingCart size={14} />
                    </button>
                    <button
                      onClick={() => handleRemoveWishlist(p.id)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Logout Bar */}
      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3.5 bg-rose-50/80 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-sm"
        >
          <LogOut size={16} />
          <span>Sign Out of ShopIndia</span>
        </button>
      </div>

    </div>
  );
};

export default Profile;
