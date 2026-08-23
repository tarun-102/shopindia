import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase"; 
import { doc, updateDoc, getDoc } from "firebase/firestore";
import notify from '../components/ui/LuxuryToast';
import Modal from '../components/ui/Modal';
import { formatPrice } from "../utils/priceFormatter";
import { getUserOrders, subscribeUserOrders, cancelOrderInDB, updateOrderStatusInDB } from "../services/productservices";
import { onAuthStateChanged } from "firebase/auth";
import { useSelector } from "react-redux";
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
  Plus
} from "lucide-react";

const Profile = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setLoading(true);
        unsubscribeOrders();
        unsubscribeOrders = subscribeUserOrders(
          user.uid,
          (nextOrders) => {
            setOrders(nextOrders);
            setLoading(false);
          },
          () => setLoading(false)
        );
      } else {
        setCurrentUser(null);
        unsubscribeOrders();
        setLoading(false);
      }
    });
    window.scrollTo(0, 0);
    return () => {
      unsubscribe();
      unsubscribeOrders();
    };
  }, []);

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
      const wallet = (userSnap.exists() && userSnap.data().wallet) || { balance: 0 };
      const newBalance = (wallet.balance || 0) + amount;
      await updateDoc(userRef, { "wallet.balance": newBalance });
      notify.success("Wallet Top-up Successful! 💳", `₹${formatPrice(amount)} added to your balance`);
      setShowAddMoneyModal(false);
    } catch (err) {
      console.error(err);
      notify.error("Top-up Failed", "Could not add money to wallet.");
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          const rawStatus = (order.status || "").toLowerCase();
          
          if (rawStatus.includes("pending")) {
            const orderTime = new Date(order.date).getTime();
            if (!isNaN(orderTime) && Date.now() - orderTime > 40000) {
              const nextStatus = "Assigning Delivery Partner 🟡";
              updateOrderStatusInDB(order.id, nextStatus);
              return { ...order, status: nextStatus };
            }
          }
          return order;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchOrders = async (uid) => {
    setLoading(true);
    const data = await getUserOrders(uid);
    setOrders(data);
    setLoading(false);
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
      if (currentUser?.uid) fetchOrders(currentUser.uid);
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

  if (!currentUser && loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
          Loading Profile...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 min-h-[85vh] transition-colors duration-300">
      
      {/* Confirmation Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl p-6 rounded-2xl max-w-md w-full text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cancel Order?</h3>
            <p className="text-gray-500 dark:text-slate-400 mb-6 text-xs sm:text-sm">
              Are you sure you want to cancel this order? Any prepaid amount (UPI / Card / Wallet) will be instantly refunded to your ShopIndia Wallet.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setConfirmDialog({ show: false, orderId: null })}
                className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
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
      <div className="bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-md text-white font-black uppercase">
              {currentUser?.displayName ? currentUser.displayName.charAt(0) : currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  {currentUser?.displayName || "ShopIndia Customer"}
                </h1>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                  {userRole}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                {currentUser?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddMoney}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Wallet Money</span>
            </button>
          </div>
        </div>

        {/* ROLE-SPECIFIC SHORTCUT CARDS (ADMIN / DELIVERY) */}
        {(userRole === "admin" || userRole === "deliveryboy") && (
          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userRole === "admin" && (
              <Link
                to="/admin"
                className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white">
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
                className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-600 text-white">
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

      {/* Orders Section Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
        <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Package size={20} className="text-emerald-500" />
          <span>My Order History ({orders.length})</span>
        </h2>
      </div>

      {/* Orders List Section */}
      {loading ? (
        <div className="text-center text-xs text-emerald-600 dark:text-emerald-400 py-12 font-semibold animate-pulse">
          Fetching your orders... ⏳
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-200 dark:border-slate-800">
          <span className="text-4xl block mb-2 opacity-60">🛍️</span>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No Orders Yet</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            You haven't placed any orders yet. Discover great deals in our store!
          </p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => {
            const rawStatus = (order.status || "").toLowerCase();
            const isPending = rawStatus.includes("pending");
            const isAssigning = rawStatus.includes("assigning");
            
            return (
              <div 
                key={order.id} 
                className="p-4 sm:p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-3"
              >
                {/* Order Meta Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>Order ID:</span>
                      <span className="font-mono text-gray-900 dark:text-white font-bold bg-gray-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[11px]">
                        {order.id}
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500">
                      Placed on: {new Date(order.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                      rawStatus.includes("cancelled") ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30" :
                      isPending ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30" :
                      isAssigning ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30" :
                      rawStatus.includes("delivered") ? "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/30" :
                      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
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

                {/* Delivery OTP Notice (If Out for Delivery) */}
                {order.status?.toLowerCase().includes("out for delivery") && order.otp && (
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                    <KeyRound size={16} />
                    <span>Delivery OTP for Rider:</span>
                    <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 tracking-wider bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300">
                      {order.otp}
                    </span>
                  </div>
                )}

                {/* Purchased Items List */}
                <div className="space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-slate-850 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 bg-white rounded-lg p-1 shrink-0 border flex items-center justify-center overflow-hidden">
                          <img src={item.image || item.thumbnail} alt={item.title} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{item.title}</p>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400">
                            ₹{formatPrice(item.price)} × <span className="font-bold text-emerald-600">{item.quantity}</span>
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-gray-900 dark:text-white shrink-0">
                        ₹{formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-800 text-xs font-bold">
                  <span className="text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Paid</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-white font-bold text-xs disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-xs disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Money Modal */}
      <Modal show={showAddMoneyModal} title="Add Money to Wallet" onClose={() => setShowAddMoneyModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Amount (₹)</label>
            <input 
              type="number" 
              value={addMoneyAmount} 
              onChange={(e) => setAddMoneyAmount(e.target.value)} 
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white font-bold text-sm outline-none focus:border-emerald-500" 
            />
          </div>
          <div className="flex gap-2.5 justify-end pt-2">
            <button 
              onClick={() => setShowAddMoneyModal(false)} 
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={submitAddMoney} 
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md cursor-pointer"
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