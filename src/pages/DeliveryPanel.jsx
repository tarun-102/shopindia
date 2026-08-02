import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import { subscribeDeliveryOrders, updateOrderStatusInDB, assignOrderToDeliveryBoy, verifyOrderOTP, regenerateOrderOTP } from "../services/productservices";
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';

const DeliveryPanel = () => {
  // ---------------------------------------------------------------------------
  // Component State
  // ---------------------------------------------------------------------------
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Tab state: 'available' for incoming/active orders, 'history' for completed
  const [activeTab, setActiveTab] = useState("available"); 
  
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

  const handleAcceptOrder = async (orderId) => {
    if (!user?.uid) return;
    const result = await assignOrderToDeliveryBoy(orderId, user.uid);
    if (result.success) {
      toast.success("Order accepted and marked Out for Delivery.");
    } else {
      toast.error(result.error || "Assignment failed. Please try again.");
    }
  };

  const handleMarkDelivered = async (orderId) => {
    setOtpModal({ show: true, orderId, otp: "" });
  };

  const handleRegenerateOtp = async (orderId) => {
    if (!user?.uid) return;
    setLoading(true);
    const res = await regenerateOrderOTP(orderId, user.uid);
    setLoading(false);
    if (res.success) {
      toast.success(`New OTP generated: ${res.otp}`);
    } else {
      toast.error(res.error || 'Failed to regenerate OTP');
    }
  };

  const [otpModal, setOtpModal] = useState({ show: false, orderId: null, otp: "" });

  const submitOtp = async () => {
    if (!otpModal.orderId) return;
    if (!otpModal.otp || otpModal.otp.trim().length !== 4) {
      toast.error("Please enter a valid 4-digit OTP.");
      return;
    }

    const result = await verifyOrderOTP(otpModal.orderId, otpModal.otp.trim());
    if (result.success) {
      toast.success("OTP verified — order marked as Delivered.");
      setOtpModal({ show: false, orderId: null, otp: "" });
    } else {
      toast.error(result.error || "OTP verification failed. Delivery not completed.");
    }
  };

  // ---------------------------------------------------------------------------
  // Data Filtering & Pagination
  // ---------------------------------------------------------------------------
  
  const filteredOrders = orders.filter((order) => {
    const status = order.status || "";

    if (status.toLowerCase().includes('cancel')) return false;

    if (activeTab === "available") {
      const isPendingOrReady = (status.includes("pending") || status.includes("Assigning") || status.includes("Confirmed") || status.includes("🟢") || status.includes("🟡")) && !order.assignedTo;
      const isMyActiveDelivery = order.assignedTo === user?.uid && !status.includes("Delivered");

      return isPendingOrReady || isMyActiveDelivery;
    } else {
      return order.assignedTo === user?.uid && (status.includes("Delivered") || status.includes("✅"));
    }
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-[85vh] transition-colors duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-500 bg-clip-text text-transparent">
            Delivery Portal
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Manage incoming dispatches and track delivery history.</p>
        </div>
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-sm dark:shadow-inner">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/25 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            🛵
          </div>
          <span className="font-semibold text-sm text-gray-800 dark:text-white">{user?.email || "Delivery Partner"}</span>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 border-b border-gray-200 dark:border-white/10 pb-6">
        <button
          onClick={() => { setActiveTab("available"); setCurrentPage(1); }}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-md ${
            activeTab === "available"
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20 scale-105 border border-transparent"
              : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5"
          }`}
        >
          📦 Active Dispatches
        </button>
        <button
          onClick={() => { setActiveTab("history"); setCurrentPage(1); }}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-md ${
            activeTab === "history"
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20 scale-105 border border-transparent"
              : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5"
          }`}
        >
          ✅ Delivery History
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 gap-5">
           <div className="relative flex justify-center items-center">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-200 dark:border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] dark:shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
              <div className="absolute w-4 h-4 bg-teal-500 dark:bg-teal-400 rounded-full animate-pulse shadow-lg shadow-teal-500/60"></div>
           </div>
           <span className="text-emerald-700 dark:text-emerald-400/80 text-sm font-semibold tracking-[0.2em] animate-pulse">
              CONNECTING TO SERVER...
           </span>
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl">
          <p className="text-rose-600 dark:text-rose-400 font-bold">{error}</p>
        </div>
      ) : (
        <div className="animate-fade-in space-y-6">
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 shadow-inner">
              <span className="text-6xl block mb-4 opacity-50 grayscale">📭</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Records Found</h3>
              <p className="text-gray-500 dark:text-gray-400">
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
                    <div key={order.id} className="bg-white dark:bg-black/30 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-sm dark:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-500/30 transition-colors relative overflow-hidden group">
                      
                      {/* Customer Info Block */}
                      <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 mb-5 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xl shadow-inner">
                          {(order.shipping?.name || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white font-bold text-lg tracking-wide">{order.shipping?.name || "Customer"}</p>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400/80 font-medium">
                            {order.userEmail || order.shipping?.email || `ID: ${order.userId?.substring(0,8)}...`}
                          </p>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-gray-200 dark:border-white/5">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Order ID</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-mono truncate">{order.id}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-gray-200 dark:border-white/5">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Status</p>
                          <span className={`inline-flex px-3 py-1 rounded-md text-xs font-black uppercase border ${
                            order.status?.includes("Delivered") 
                              ? "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/30" 
                              : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Shipping & Items Layout */}
                      <div className="grid sm:grid-cols-2 gap-5 mb-6">
                        <div className="space-y-2">
                          <p className="text-gray-900 dark:text-white font-bold text-sm uppercase tracking-widest">Destination</p>
                          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <p>{order.shipping?.address || "Address not provided"}</p>
                            <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">PIN: {order.shipping?.pincode || "N/A"}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-gray-900 dark:text-white font-bold text-sm uppercase tracking-widest">Package Contents</p>
                          <div className="grid gap-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="bg-gray-50 dark:bg-white/5 p-2.5 rounded-xl text-xs text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-white/5 flex items-center gap-2 truncate shadow-sm">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.quantity || 1}×</span> 
                                {item.title || item.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Area */}
                      <div className="pt-5 border-t border-gray-200 dark:border-white/10 flex flex-wrap justify-end gap-2">
                        {canAccept && (
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
                          >
                            Accept Dispatch 🚚
                          </button>
                        )}

                        {isAssignedToMe && !order.status?.includes("Delivered") && (
                          <button
                            onClick={() => handleMarkDelivered(order.id)}
                            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-md transition-all active:scale-95"
                          >
                            Confirm Delivery ✅
                          </button>
                        )}

                        {isAssignedToMe && !order.status?.includes("Delivered") && (
                          <button
                            onClick={() => handleRegenerateOtp(order.id)}
                            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-300 font-bold text-sm hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition shadow-sm"
                          >
                            Regenerate OTP 🔁
                          </button>
                        )}

                        {order.status?.includes("Delivered") && (
                          <div className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 text-teal-700 dark:text-teal-400 font-bold text-sm text-center">
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
                <div className="flex items-center justify-between px-6 py-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-inner">
                  <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Page {currentPage} of {totalPages} <span className="hidden sm:inline">&bull; Total Records: {filteredOrders.length}</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 md:px-5 py-2 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-transparent text-gray-700 dark:text-white disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/20 transition font-bold text-xs md:text-sm shadow-sm"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 md:px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 text-white disabled:opacity-50 hover:brightness-110 transition font-bold text-xs md:text-sm shadow-sm dark:shadow-lg"
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
      <Modal show={otpModal.show} title="Enter Delivery OTP" onClose={() => setOtpModal({ show: false, orderId: null, otp: "" })}>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">4-digit OTP</label>
            <input type="text" maxLength={4} value={otpModal.otp} onChange={(e) => setOtpModal(s => ({ ...s, otp: e.target.value.replace(/\D/g, '') }))} className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setOtpModal({ show: false, orderId: null, otp: "" })} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white font-bold">Cancel</button>
            <button onClick={submitOtp} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold shadow-sm">Verify & Deliver</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeliveryPanel;