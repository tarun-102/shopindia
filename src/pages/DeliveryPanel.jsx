import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import { subscribeDeliveryOrders, updateOrderStatusInDB, assignOrderToDeliveryBoy } from "../services/productservices";

const DeliveryPanel = () => {
  // ---------------------------------------------------------------------------
  // Component State
  // ---------------------------------------------------------------------------
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Tab state: 'available' for incoming/active orders, 'history' for completed
  const [activeTab, setActiveTab] = useState("available"); 
  
  // Action notifications
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 6;

  // Authentication & Routing
  const user = useSelector((state) => state.auth.user);
  const role = useSelector((state) => state.auth.role);
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Effects & Subscriptions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError("Authentication required to view delivery assignments.");
      return;
    }

    if (role !== "deliveryboy") {
      navigate("/");
      return;
    }

    // Subscribe to real-time order updates
    const unsubscribe = subscribeDeliveryOrders(
      user.uid,
      (deliveryOrders) => {
        setOrders(deliveryOrders);
        setError("");
        setLoading(false);
      },
      (err) => {
        console.error("Delivery subscription error:", err);
        setError(err?.message || "Failed to establish real-time connection.");
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user, role, navigate]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Assigns an available order to the current delivery personnel and updates status to "Out for Delivery".
   */
  const handleAcceptOrder = async (orderId) => {
    if (!user?.uid) return;
    setActionMessage("");
    setActionError("");

    const result = await assignOrderToDeliveryBoy(orderId, user.uid);
    if (result.success) {
      // 🔥 Automatically update status to "Out for Delivery 🚚" when accepted
      await updateOrderStatusInDB(orderId, "Out for Delivery 🚚");
      setActionMessage("Order accepted successfully! Status changed to Out for Delivery.");
    } else {
      setActionError(result.error || "Assignment failed. Please try again.");
    }
  };

  /**
   * Updates the order status to delivered upon successful handover.
   */
  const handleMarkDelivered = async (orderId) => {
    setActionMessage("");
    setActionError("");
    const success = await updateOrderStatusInDB(orderId, "Delivered ✅");
    if (success) {
      setActionMessage("Order status successfully updated to Delivered.");
    } else {
      setActionError("Failed to update order status. Please verify your connection.");
    }
  };

  // ---------------------------------------------------------------------------
  // Data Filtering & Pagination
  // ---------------------------------------------------------------------------
  
  const filteredOrders = orders.filter((order) => {
    const status = order.status || "";

    if (activeTab === "available") {
      // Show orders that are past the pending stage and unassigned, OR active orders assigned to this driver
      const isReadyForDispatch = (status.includes("Assigning") || status.includes("Confirmed") || status.includes("🟢") || status.includes("🟡")) && !order.assignedTo;
      const isMyActiveDelivery = order.assignedTo === user?.uid && !status.includes("Delivered");
      
      return isReadyForDispatch || isMyActiveDelivery;
    } else {
      // Show completed delivery history for current user
      return order.assignedTo === user?.uid && (status.includes("Delivered") || status.includes("✅"));
    }
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-[85vh]">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Delivery Portal
          </h1>
          <p className="text-gray-400 text-sm mt-2">Manage incoming dispatches and track delivery history.</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-inner">
          <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
            🛵
          </div>
          <span className="font-semibold text-sm text-white">{user?.email || "Delivery Partner"}</span>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 border-b border-white/10 pb-6">
        <button
          onClick={() => { setActiveTab("available"); setCurrentPage(1); }}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
            activeTab === "available"
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20 scale-105 border border-transparent"
              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
          }`}
        >
          📦 Active Dispatches
        </button>
        <button
          onClick={() => { setActiveTab("history"); setCurrentPage(1); }}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
            activeTab === "history"
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20 scale-105 border border-transparent"
              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
          }`}
        >
          ✅ Delivery History
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 gap-5">
           <div className="relative flex justify-center items-center">
               <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-500/20 border-t-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
               <div className="absolute w-4 h-4 bg-teal-400 rounded-full animate-pulse shadow-lg shadow-teal-500/60"></div>
           </div>
           <span className="text-emerald-400/80 text-sm font-semibold tracking-[0.2em] animate-pulse">
               CONNECTING TO SERVER...
           </span>
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <p className="text-rose-400 font-bold">{error}</p>
        </div>
      ) : (
        <div className="animate-fade-in space-y-6">
          
          {/* Action Notifications */}
          {(actionMessage || actionError) && (
            <div className={`rounded-2xl p-4 flex items-center gap-3 border backdrop-blur-md shadow-lg ${
              actionError 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <span className="text-xl">{actionError ? '⚠️' : '✅'}</span>
              <p className="font-semibold text-sm">{actionError || actionMessage}</p>
            </div>
          )}

          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 shadow-inner">
              <span className="text-6xl block mb-4 opacity-50 grayscale">📭</span>
              <h3 className="text-xl font-bold text-white mb-2">No Records Found</h3>
              <p className="text-gray-400">
                {activeTab === "available" 
                  ? "There are no pending dispatches available at this moment." 
                  : "Your completed delivery history is currently empty."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paginatedOrders.map((order) => {
                  const isAssignedToMe = order.assignedTo === user?.uid;
                  const canAccept = !order.assignedTo;

                  return (
                    <div key={order.id} className="bg-black/30 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl hover:border-emerald-500/30 transition-colors relative overflow-hidden group">
                      
                      {/* Customer Info Block */}
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 mb-5">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl shadow-inner">
                          {(order.shipping?.name || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-bold text-lg tracking-wide">{order.shipping?.name || "Customer"}</p>
                          <p className="text-sm text-emerald-400/80 font-medium">
                            {order.userEmail || order.shipping?.email || `ID: ${order.userId?.substring(0,8)}...`}
                          </p>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Order ID</p>
                          <p className="text-sm text-gray-200 font-mono truncate">{order.id}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Status</p>
                          <span className={`inline-flex px-3 py-1 rounded-md text-xs font-black uppercase border ${
                            order.status?.includes("Delivered") 
                              ? "bg-teal-500/10 text-teal-400 border-teal-500/30" 
                              : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Shipping & Items Layout */}
                      <div className="grid sm:grid-cols-2 gap-5 mb-6">
                        <div className="space-y-2">
                          <p className="text-white font-bold text-sm uppercase tracking-widest">Destination</p>
                          <div className="text-sm text-gray-400 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                            <p>{order.shipping?.address || "Address not provided"}</p>
                            <p className="mt-1 font-semibold text-emerald-400">PIN: {order.shipping?.pincode || "N/A"}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-white font-bold text-sm uppercase tracking-widest">Package Contents</p>
                          <div className="grid gap-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="bg-white/5 p-2.5 rounded-xl text-xs text-gray-300 font-medium border border-white/5 flex items-center gap-2 truncate">
                                <span className="text-emerald-400 font-bold">{item.quantity || 1}×</span> 
                                {item.title || item.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Area */}
                      <div className="pt-5 border-t border-white/10 flex justify-end">
                        {canAccept && (
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                          >
                            Accept Dispatch 🚚
                          </button>
                        )}

                        {isAssignedToMe && !order.status?.includes("Delivered") && (
                          <button
                            onClick={() => handleMarkDelivered(order.id)}
                            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                          >
                            Confirm Delivery ✅
                          </button>
                        )}

                        {order.status?.includes("Delivered") && (
                          <div className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 font-bold text-sm text-center">
                            Completed Successfully
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination UI */}
              {filteredOrders.length > 0 && (
                <div className="flex items-center justify-between px-6 py-5 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-sm text-gray-400 font-medium">
                    Page {currentPage} of {totalPages} <span className="hidden sm:inline">&bull; Total Records: {filteredOrders.length}</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-5 py-2 rounded-xl bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition font-bold text-sm"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-5 py-2 rounded-xl bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition font-bold text-sm"
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
    </div>
  );
};

export default DeliveryPanel;