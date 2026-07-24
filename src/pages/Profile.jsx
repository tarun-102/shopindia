import { useEffect, useState } from "react";
import { auth } from "../services/firebase"; 
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

  // Toast Notification State
  const [alertData, setAlertData] = useState({ show: false, message: "", icon: "" });

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    orderId: null,
  });

  // ---------------------------------------------------------------------------
  // Helper Functions
  // ---------------------------------------------------------------------------
  const showCustomAlert = (message, icon) => {
    setAlertData({ show: true, message, icon });
    setTimeout(() => {
      setAlertData({ show: false, message: "", icon: "" });
    }, 3500); 
  };

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

  /**
   * Periodic check interval: after 40 seconds, automatically transitions 
   * pending orders to "Assigning Delivery Partner 🟡" and updates the database.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          const rawStatus = (order.status || "").toLowerCase();
          
          // 🔥 FIXED: Case-insensitive check for pending status
          if (rawStatus.includes("pending")) {
            const orderTime = new Date(order.date).getTime();
            // 40 seconds elapsed check (40000 milliseconds)
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
    
    // 🔥 FIXED: Case-insensitive check for showing the cancel button
    if (!rawStatus.includes("pending")) return false;
    
    const orderTime = new Date(order.date).getTime();
    if (isNaN(orderTime)) return false;
    // 40 seconds cancellation window limit
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
      showCustomAlert("Order Cancelled Successfully", "🚫");
    } else {
      showCustomAlert(result.error || "Unable to cancel order.", "⚠️");
    }
  };

  // ---------------------------------------------------------------------------
  // Pagination Calculations
  // ---------------------------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(orders.length / ordersPerPage));
  const paginatedOrders = orders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  if (!currentUser && loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[75vh] gap-5">
        <div className="relative flex justify-center items-center">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-500/20 border-t-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]"></div>
            <div className="absolute w-4 h-4 bg-teal-400 rounded-full animate-pulse shadow-lg shadow-teal-500/60"></div>
        </div>
        <span className="text-emerald-400/90 text-sm font-bold tracking-[0.25em] animate-pulse">
            LOADING PROFILE...
        </span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 relative min-h-[85vh]">
      
      {/* Toast Notification Alert */}
      {alertData.show && (
        <div className="fixed top-24 right-5 md:right-10 z-[100] animate-bounce">
          <div className="bg-[#111827]/95 backdrop-blur-2xl border border-emerald-500/40 shadow-[0_10px_40px_rgba(16,185,129,0.2)] px-6 py-4 rounded-2xl flex items-center gap-3 text-white">
            <span className="text-2xl">{alertData.icon}</span>
            <p className="font-semibold tracking-wide text-emerald-300">{alertData.message}</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#111827] border border-white/10 shadow-2xl p-8 rounded-3xl max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-black text-white mb-2">Cancel Order?</h3>
            <p className="text-gray-400 mb-8 leading-relaxed text-sm">
              Are you sure you want to cancel this order? Cancellations are only permitted within 40 seconds of placement.
            </p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setConfirmDialog({ show: false, orderId: null })}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition"
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
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-500/10 via-[#111827] to-teal-500/10 border border-emerald-500/20 p-8 md:p-10 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-center sm:text-left">
          <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center text-4xl md:text-5xl shadow-xl border-2 border-white/20 text-black font-black uppercase shadow-emerald-500/20">
            {currentUser?.displayName ? currentUser.displayName.charAt(0) : "U"}
          </div>
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-black tracking-[0.2em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Verified Customer
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white mt-2">
              {currentUser?.displayName || "ShopIndia Member"}
            </h1>
            <p className="text-gray-300 font-medium text-sm md:text-base">
              {currentUser?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
          <span>📦</span> My Order History
        </h2>
        <span className="text-xs font-bold text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
          Total Orders: {orders.length}
        </span>
      </div>

      {/* Orders List Section */}
      {loading ? (
        <div className="text-center text-emerald-400 text-lg py-16 animate-pulse font-semibold">
          Fetching your orders... ⏳
        </div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center bg-[#111827]/80 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-xl">
          <span className="text-6xl block mb-4 opacity-50 grayscale">🛒</span>
          <h3 className="text-2xl font-bold text-white mb-2">No Orders Yet</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">You haven't placed any orders with us yet. Explore our store and find amazing deals!</p>
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
                className={`p-6 md:p-8 border-l-4 transition-all duration-300 bg-[#111827]/85 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/5 hover:border-emerald-500/30 group ${
                  rawStatus.includes("cancelled") ? "border-l-rose-500 opacity-75" : 
                  isPending ? "border-l-amber-400" : 
                  isAssigning ? "border-l-blue-400" : "border-l-emerald-500"
                }`}
              >
                
                {/* Order Meta Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/10 pb-5 mb-6">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <span>Order ID:</span>
                      <span className="text-white font-mono bg-black/40 px-2.5 py-1 rounded-md border border-white/5">{order.id}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Placed on: <span className="text-gray-200 font-semibold">
                        {new Date(order.date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </p>
                  </div>
                  
                  <div className="text-left md:text-right flex flex-col items-start md:items-end gap-3">
                    {/* Status Badge */}
                    <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm flex items-center gap-1.5 ${
                      rawStatus.includes("cancelled") ? "bg-rose-500/10 text-rose-400 border-rose-500/30" :
                      isPending ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse" :
                      isAssigning ? "bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse" :
                      rawStatus.includes("delivered") ? "bg-teal-500/10 text-teal-400 border-teal-500/30" :
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}>
                      <span>{order.status || "Pending ⏳"}</span>
                    </div>
                    
                    {/* Cancellation Action */}
                    {canCancelOrder(order) ? (
                      <button 
                        onClick={() => triggerCancelOrder(order.id)}
                        className="text-xs bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white font-bold py-1.5 px-3.5 rounded-xl transition-all"
                      >
                        Cancel Order ✖️
                      </button>
                    ) : isPending ? (
                      <span className="text-[11px] text-gray-500 font-medium py-1">
                        Cancellation window expired
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Purchased Items Grid */}
                <div className="space-y-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-colors">
                      <div className="w-16 h-16 bg-white rounded-xl p-1.5 flex items-center justify-center shrink-0 border border-gray-700 shadow-inner overflow-hidden">
                        <img 
                          src={item.image || item.thumbnail} 
                          alt={item.title} 
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-100 text-sm md:text-base line-clamp-1">{item.title}</h4>
                        <p className="text-gray-400 text-xs md:text-sm mt-1">
                          ₹ {formatPrice(item.price)} <span className="mx-1 text-white/30">&times;</span> <span className="text-emerald-400 font-bold">{item.quantity}</span>
                        </p>
                      </div>
                      <div className="font-black text-white text-base md:text-lg">
                        ₹ {formatPrice(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                  
                  {/* Order Total Section */}
                  <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                     <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Total Amount Paid</span>
                     <p className="text-2xl font-black text-emerald-400">
                      ₹ {formatPrice(order.totalAmount)}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#111827]/80 backdrop-blur-xl rounded-2xl border border-white/10 text-white shadow-lg">
            <span className="text-sm text-gray-400 font-medium">
              Page <span className="text-emerald-400">{currentPage}</span> of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition font-bold text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition font-bold text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;