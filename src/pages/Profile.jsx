import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase"; 
import { doc, updateDoc, getDoc } from "firebase/firestore";
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import GlassCard from "../components/ui/GlassCard";
import { formatPrice } from "../utils/priceFormatter";
import { getUserOrders, cancelOrderInDB, updateOrderStatusInDB } from "../services/productservices";
import { onAuthStateChanged } from "firebase/auth";

const Profile = () => {
  // ---------------------------------------------------------------------------
  // Component States
  // ---------------------------------------------------------------------------
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 3;

  // Track OTP toasts already shown this session
  const [shownOtps, setShownOtps] = useState([]);

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    orderId: null,
  });

  // Wallet Modal States
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState(500);

  // ---------------------------------------------------------------------------
  // Effects & Subscriptions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchOrders(user.uid);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    window.scrollTo(0, 0);
    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------------------------
  // Wallet Top-up
  // ---------------------------------------------------------------------------
  const handleAddMoney = async () => {
    setShowAddMoneyModal(true);
  };

  const submitAddMoney = async () => {
    if (!currentUser) return;
    const amount = Number(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount entered.");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      const wallet = (userSnap.exists() && userSnap.data().wallet) || { balance: 0 };
      const newBalance = (wallet.balance || 0) + amount;
      await updateDoc(userRef, { "wallet.balance": newBalance });
      toast.success(`₹${amount} added to wallet. New balance: ₹${newBalance}`);
      setShowAddMoneyModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add money to wallet.");
    }
  };

  /**
   * Periodic check interval: after 40 seconds, automatically transitions 
   * pending orders to "Assigning Delivery Partner 🟡" and updates the database.
   */
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

  // ---------------------------------------------------------------------------
  // Data Fetching & Actions
  // ---------------------------------------------------------------------------
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
    
    if (!rawStatus.includes("pending")) return false;
    
    const orderTime = new Date(order.date).getTime();
    if (isNaN(orderTime)) return false;
    return Date.now() - orderTime <= 40000;
  };

  const executeCancelOrder = async () => {
    const orderId = confirmDialog.orderId;
    setConfirmDialog({ show: false, orderId: null });

    const result = await cancelOrderInDB(orderId, { userId: currentUser?.uid });
    if (result.success) {
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: "Cancelled 🔴" } : order
      ));
      toast.success("Order Cancelled Successfully");
    } else {
      toast.error(result.error || "Unable to cancel order.");
    }
  };

  useEffect(() => {
    orders.forEach((order) => {
      if (order.otp && order.status?.toLowerCase().includes("out for delivery")) {
        if (!shownOtps.includes(order.id)) {
          toast(`Delivery OTP for order ${order.id.slice(0,6)}: ${order.otp}`, { icon: '🔐', duration: 10000 });
          setShownOtps((s) => [...s, order.id]);
        }
      }
    });
  }, [orders]);

  // ---------------------------------------------------------------------------
  // Pagination Calculations
  // ---------------------------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(orders.length / ordersPerPage));
  const paginatedOrders = orders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  if (!currentUser && loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-5">
        <div className="relative flex justify-center items-center">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-200 dark:border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]"></div>
            <div className="absolute w-4 h-4 bg-teal-500 dark:bg-teal-400 rounded-full animate-pulse shadow-lg shadow-teal-500/60"></div>
        </div>
        <span className="text-emerald-700 dark:text-emerald-400/90 text-sm font-bold tracking-[0.25em] animate-pulse">
            LOADING PROFILE...
        </span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 relative min-h-[85vh] transition-colors duration-500">
      
      {/* Confirmation Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 dark:bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 shadow-2xl p-8 rounded-3xl max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Cancel Order?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed text-sm">
              Are you sure you want to cancel this order? Cancellations are only permitted within 40 seconds of placement.
            </p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setConfirmDialog({ show: false, orderId: null })}
                className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white font-bold py-3 rounded-xl transition shadow-sm"
              >
                No, Keep It
              </button>
              <button 
                onClick={executeCancelOrder}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-500/30 transition"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Profile Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-500/10 via-white dark:via-[#111827] to-teal-500/10 border border-emerald-500/20 p-8 md:p-10 backdrop-blur-2xl shadow-xl dark:shadow-2xl transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-center sm:text-left">
          <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center text-4xl md:text-5xl shadow-xl border-2 border-white/20 text-white font-black uppercase shadow-emerald-500/20">
            {currentUser?.displayName ? currentUser.displayName.charAt(0) : "U"}
          </div>
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-black tracking-[0.2em] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 rounded-full shadow-sm">
              Verified Customer
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mt-2">
              {currentUser?.displayName || "ShopIndia Member"}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 font-medium text-sm md:text-base">
              {currentUser?.email}
            </p>
            <div className="mt-3">
              <button
                onClick={handleAddMoney}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm shadow-sm transition-colors"
              >
                Add Money to Wallet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-3">
          <span>📦</span> My Order History
        </h2>
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg shadow-sm">
          Total Orders: {orders.length}
        </span>
      </div>

      {/* Orders List Section */}
      {loading ? (
        <div className="text-center text-emerald-600 dark:text-emerald-400 text-lg py-16 animate-pulse font-semibold">
          Fetching your orders... ⏳
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#111827]/80 backdrop-blur-2xl rounded-3xl border border-gray-200 dark:border-white/5 shadow-xl transition-colors">
          <span className="text-6xl block mb-4 opacity-50 grayscale">🛒</span>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Orders Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">You haven't placed any orders with us yet. Explore our store and find amazing deals!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {paginatedOrders.map((order) => {
            const rawStatus = (order.status || "").toLowerCase();
            const isPending = rawStatus.includes("pending");
            const isAssigning = rawStatus.includes("assigning");
            
            return (
              <div 
                key={order.id} 
                className={`p-6 md:p-8 border-l-4 transition-all duration-300 bg-white dark:bg-[#111827]/85 backdrop-blur-2xl rounded-[2rem] shadow-sm dark:shadow-xl border border-gray-200 dark:border-white/5 hover:border-emerald-400 dark:hover:border-emerald-500/30 group ${
                  rawStatus.includes("cancelled") ? "border-l-rose-500 opacity-75" : 
                  isPending ? "border-l-amber-400" : 
                  isAssigning ? "border-l-blue-400" : "border-l-emerald-500"
                }`}
              >
                
                {/* Order Meta Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-100 dark:border-white/10 pb-5 mb-6">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span>Order ID:</span>
                      <span className="text-gray-800 dark:text-white font-mono bg-gray-100 dark:bg-black/40 px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/5">{order.id}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Placed on: <span className="text-gray-700 dark:text-gray-200 font-semibold">
                        {new Date(order.date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </p>
                  </div>
                  
                  <div className="text-left md:text-right flex flex-col items-start md:items-end gap-3">
                    {/* Status Badge */}
                    <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm flex items-center gap-1.5 ${
                      rawStatus.includes("cancelled") ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30" :
                      isPending ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 animate-pulse" :
                      isAssigning ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 animate-pulse" :
                      rawStatus.includes("delivered") ? "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/30" :
                      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                    }`}>
                      <span>{order.status || "Pending ⏳"}</span>
                    </div>
                    
                    {/* Cancellation Action */}
                    {canCancelOrder(order) ? (
                      <button 
                        onClick={() => triggerCancelOrder(order.id)}
                        className="text-xs bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500 border border-rose-200 dark:border-rose-500/30 hover:border-rose-300 dark:hover:border-rose-500 text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-white font-bold py-1.5 px-3.5 rounded-xl transition-all shadow-sm"
                      >
                        Cancel Order ✖️
                      </button>
                    ) : isPending ? (
                      <span className="text-[11px] text-gray-400 font-medium py-1">
                        Cancellation window expired
                      </span>
                    ) : null}

                    {/* Show OTP to customer when order is out for delivery */}
                    {order.status?.toLowerCase().includes("out for delivery") && order.otp && (
                      <div className="mt-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-lg text-emerald-600 dark:text-emerald-300 font-bold shadow-sm">
                        Delivery OTP: <span className="ml-2 text-gray-900 dark:text-white font-mono">{order.otp}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchased Items Grid */}
                <div className="space-y-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-gray-200 dark:border-white/5 hover:border-emerald-300 dark:hover:border-emerald-500/20 transition-colors shadow-sm">
                      <div className="w-16 h-16 bg-white rounded-xl p-1.5 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700 shadow-inner overflow-hidden">
                        <img 
                          src={item.image || item.thumbnail} 
                          alt={item.title} 
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base line-clamp-1">{item.title}</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
                          ₹ {formatPrice(item.price)} <span className="mx-1 text-gray-400 dark:text-white/30">&times;</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.quantity}</span>
                        </p>
                      </div>
                      <div className="font-black text-gray-900 dark:text-white text-base md:text-lg">
                        ₹ {formatPrice(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                  
                  {/* Order Total Section */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-white/5 mt-4">
                     <span className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">Total Amount Paid</span>
                     <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      ₹ {formatPrice(order.totalAmount)}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#111827]/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-lg transition-colors">
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
              Page <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currentPage}</span> of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 md:px-5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/10 transition font-bold text-xs md:text-sm shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 md:px-5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/10 transition font-bold text-xs md:text-sm shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal show={showAddMoneyModal} title="Add Money to Wallet" onClose={() => setShowAddMoneyModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Amount (INR)</label>
            <input type="number" value={addMoneyAmount} onChange={(e) => setAddMoneyAmount(e.target.value)} className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowAddMoneyModal(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white font-bold">Cancel</button>
            <button onClick={submitAddMoney} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold shadow-sm">Add Money</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;