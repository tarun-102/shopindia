import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase"; 
import { doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import notify from '../components/ui/LuxuryToast';
import Modal from '../components/ui/Modal';
import { formatPrice } from "../utils/priceFormatter";
import { getUserOrders, subscribeUserOrders, cancelOrderInDB, updateOrderStatusInDB, getAllProducts } from "../services/productservices";
import { onAuthStateChanged } from "firebase/auth";
import { useSelector, useDispatch } from "react-redux";
import { addToCart } from "../store/slices/CartSlice";
import { Link } from "react-router-dom";
import { 
  Package, 
  ShieldCheck, 
  Truck, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  KeyRound,
  Plus,
  Heart,
  ShoppingCart,
  ChevronRight,
  Zap,
  ArrowRight,
  Check
} from "lucide-react";

const Profile = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("orders"); // 'orders' | 'wishlist'
  
  // Wishlist state
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const dispatch = useDispatch();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 4;

  const [shownOtps, setShownOtps] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, orderId: null });
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState(500);

  const authState = useSelector((state) => state.auth);
  const userRole = authState?.role || "customer";

  useEffect(() => {
    let unsubscribeOrders = () => {};
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setLoading(true);
        unsubscribeOrders();
        
        try {
          const data = await getUserOrders(user.uid);
          setOrders(data || []);
        } catch (e) {
          console.error(e);
        }
        setLoading(false);

        // Load Wishlist items
        loadWishlist();
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    window.scrollTo(0, 0);
    return () => {
      unsubscribe();
      unsubscribeOrders();
    };
  }, []);

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
      notify.info("Removed from Wishlist", "Item removed from your saved list.");
    } catch (e) {}
  };

  const handleAddMoney = async () => {
    setShowAddMoneyModal(true);
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
        note: "Wallet Top-up",
        date: new Date().toISOString()
      };

      await updateDoc(userRef, { 
        "wallet.balance": newBalance,
        "wallet.transactions": arrayUnion(newTx)
      });

      notify.success("Wallet Top-up Successful! 💳", `₹${formatPrice(amount)} added to your balance`);
      setShowAddMoneyModal(false);
    } catch (err) {
      console.error(err);
      notify.error("Top-up Failed", "Could not add money to wallet.");
    }
  };

  const triggerCancelOrder = (orderId) => {
    setConfirmDialog({ show: true, orderId });
  };

  const canCancelOrder = (order) => {
    if (!order) return false;
    const rawStatus = (order.status || "").toLowerCase();
    if (rawStatus.includes("cancelled") || rawStatus.includes("delivered")) return false;
    const orderTime = new Date(order.date).getTime();
    if (isNaN(orderTime)) return false;
    return Date.now() - orderTime <= 60000;
  };

  const executeCancelOrder = async () => {
    const orderId = confirmDialog.orderId;
    setConfirmDialog({ show: false, orderId: null });

    const result = await cancelOrderInDB(orderId, { userId: currentUser?.uid });
    if (result.success) {
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: "Cancelled 🔴" } : order
      ));
      
      if (result.refunded) {
        notify.refund(result.refundAmount, orderId);
      } else {
        notify.info("Order Cancelled", `Order #${orderId.slice(0,6)} cancelled successfully`);
      }
      if (currentUser?.uid) {
        const refreshed = await getUserOrders(currentUser.uid);
        setOrders(refreshed);
      }
    } else {
      notify.error("Cancellation Failed", result.error || "Unable to cancel order.");
    }
  };

  useEffect(() => {
    orders.forEach((order) => {
      if (order.otp && order.status?.toLowerCase().includes("out for delivery")) {
        if (!shownOtps.includes(order.id)) {
          notify.info(`Delivery OTP: ${order.otp}`, `Share this code with rider for Order #${order.id.slice(0,6)}`);
          setShownOtps((s) => [...s, order.id]);
        }
      }
    });
  }, [orders]);

  const totalPages = Math.max(1, Math.ceil(orders.length / ordersPerPage));
  const paginatedOrders = orders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  // Helper to determine active step in live order tracking
  const getOrderStep = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('cancel')) return -1;
    if (s.includes('delivered') || s.includes('delivered ✅')) return 4;
    if (s.includes('out for delivery')) return 3;
    if (s.includes('assigning') || s.includes('confirmed')) return 2;
    return 1; // Pending
  };

  if (!currentUser && loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Loading Profile...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 min-h-[85vh] transition-colors duration-300 pb-12">
      
      {/* Confirmation Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 rounded-3xl max-w-md w-full text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cancel Order?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-xs sm:text-sm">
              Are you sure you want to cancel this order? Any prepaid amount (UPI / Card / Wallet / Split) will be instantly refunded to your ShopIndia Wallet.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setConfirmDialog({ show: false, orderId: null })}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                No, Keep It
              </button>
              <button 
                onClick={executeCancelOrder}
                className="flex-1 bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Yes, Cancel & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 md:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-md text-white font-black uppercase shadow-indigo-500/25">
              {currentUser?.displayName ? currentUser.displayName.charAt(0) : currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {currentUser?.displayName || "ShopIndia Customer"}
                </h1>
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                  {userRole}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {currentUser?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddMoney}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              <span>Add Wallet Money</span>
            </button>
          </div>
        </div>

        {/* ROLE-SPECIFIC SHORTCUT CARDS (ADMIN / DELIVERY) */}
        {(userRole === "admin" || userRole === "deliveryboy") && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userRole === "admin" && (
              <Link
                to="/admin"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-indigo-950 dark:text-indigo-200">Admin Control Center</h4>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-400">Manage catalog, inventory, and analytics</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  Open →
                </span>
              </Link>
            )}

            {userRole === "deliveryboy" && (
              <Link
                to="/delivery"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-sm">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-200">Delivery Partner Portal</h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">View active dispatches and verify OTP</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                  Open →
                </span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Profile Section Tabs: Orders Tracker vs Wishlist */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "orders"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
          }`}
        >
          <Package size={16} />
          <span>My Orders & Live Tracker ({orders.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab("wishlist"); loadWishlist(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "wishlist"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
          }`}
        >
          <Heart size={16} />
          <span>Saved Wishlist ({wishlistProducts.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: ORDERS WITH LIVE TRACKING STEPPER ================= */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-xs text-indigo-600 dark:text-indigo-400 py-12 font-semibold animate-pulse">
              Fetching your orders... ⏳
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800">
              <span className="text-4xl block mb-2 opacity-60">🛍️</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Orders Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                You haven't placed any orders yet. Discover our top deals!
              </p>
              <Link
                to="/"
                className="inline-block px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedOrders.map((order) => {
                const rawStatus = (order.status || "").toLowerCase();
                const step = getOrderStep(order.status);
                const isCancelled = step === -1;
                
                return (
                  <div 
                    key={order.id} 
                    className="p-4 sm:p-5 bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span>Order ID:</span>
                          <span className="font-mono text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-[11px]">
                            {order.id}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Placed on: {new Date(order.date).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                          isCancelled ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30" :
                          step === 4 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" :
                          step === 3 ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30" :
                          "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                        }`}>
                          {order.status || "Pending ⏳"}
                        </span>

                        {canCancelOrder(order) && (
                          <button 
                            onClick={() => triggerCancelOrder(order.id)}
                            className="text-[10px] bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 font-bold py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel & Refund ✖️
                          </button>
                        )}
                      </div>
                    </div>

                    {/* LIVE VISUAL TRACKER STEPPER */}
                    {!isCancelled && (
                      <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <span className={step >= 1 ? "text-indigo-600 dark:text-indigo-400 font-black" : ""}>1. Placed</span>
                          <span className={step >= 2 ? "text-indigo-600 dark:text-indigo-400 font-black" : ""}>2. Assigned</span>
                          <span className={step >= 3 ? "text-indigo-600 dark:text-indigo-400 font-black" : ""}>3. Out for Delivery</span>
                          <span className={step >= 4 ? "text-emerald-600 dark:text-emerald-400 font-black" : ""}>4. Delivered</span>
                        </div>

                        {/* Progress Bar Line */}
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${
                              step === 4 
                                ? 'bg-emerald-500' 
                                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse'
                            }`}
                            style={{ width: `${step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Delivery OTP Notice (If Out for Delivery) */}
                    {order.status?.toLowerCase().includes("out for delivery") && order.otp && (
                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                        <div className="flex items-center gap-2">
                          <KeyRound size={18} className="text-emerald-600" />
                          <span>Delivery OTP for Rider:</span>
                        </div>
                        <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-300 tracking-widest bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-emerald-300 shadow-sm">
                          {order.otp}
                        </span>
                      </div>
                    )}

                    {/* Purchased Items List */}
                    <div className="space-y-2">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 bg-white dark:bg-slate-900 rounded-xl p-1 shrink-0 border flex items-center justify-center overflow-hidden">
                              <img src={item.image || item.thumbnail} alt={item.title} className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.title}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                ₹{formatPrice(item.price)} × <span className="font-bold text-indigo-600">{item.quantity}</span>
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white shrink-0">
                            ₹{formatPrice(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total & Payment Method */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paid via:</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                          {order.paymentMethod === 'split' ? '⚡ Split Payment' : order.paymentMethod}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Total:</span>
                        <span className="text-base font-black text-indigo-600 dark:text-indigo-400">₹{formatPrice(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs disabled:opacity-40 cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs disabled:opacity-40 cursor-pointer shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: WISHLIST / SAVED ITEMS ================= */}
      {activeTab === "wishlist" && (
        <div className="space-y-4">
          {wishlistProducts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800">
              <span className="text-4xl block mb-2 opacity-60">❤️</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Your Wishlist is Empty</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                Tap the heart icon on any product card to save it for later!
              </p>
              <Link
                to="/"
                className="inline-block px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Browse Deals
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {wishlistProducts.map((p) => (
                <div key={p.id} className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.thumbnail} alt={p.title} className="w-14 h-14 object-contain rounded-2xl bg-slate-50 dark:bg-slate-850 p-1 border border-slate-200 dark:border-slate-750 shrink-0" />
                    <div className="min-w-0 space-y-0.5">
                      <Link to={`/product/${p.id}`} className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate block hover:text-indigo-600">
                        {p.title}
                      </Link>
                      <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">₹{formatPrice(p.price)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        dispatch(addToCart(p));
                        notify.cart(p.title, p.price);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <ShoppingCart size={13} />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => handleRemoveWishlist(p.id)}
                      className="text-[10px] text-rose-500 hover:underline font-semibold text-center cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Money Modal */}
      <Modal show={showAddMoneyModal} title="Add Money to Wallet" onClose={() => setShowAddMoneyModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Amount (₹)</label>
            <input 
              type="number" 
              value={addMoneyAmount} 
              onChange={(e) => setAddMoneyAmount(e.target.value)} 
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-indigo-500" 
            />
          </div>
          <div className="flex gap-2.5 justify-end pt-2">
            <button 
              onClick={() => setShowAddMoneyModal(false)} 
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={submitAddMoney} 
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              Add Money
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;