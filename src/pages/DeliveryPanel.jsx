import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { subscribeDeliveryOrders, updateOrderStatusInDB, assignOrderToDeliveryBoy, verifyOrderOTP, regenerateOrderOTP } from "../services/productservices";
import notify from '../components/ui/LuxuryToast';
import Modal from '../components/ui/Modal';
import { formatPrice } from "../utils/priceFormatter";
import { 
  Truck, 
  Package, 
  MapPin, 
  CheckCircle2, 
  KeyRound, 
  RefreshCw, 
  Clock, 
  User,
  ShieldAlert,
  Split
} from "lucide-react";

const DeliveryPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [activeTab, setActiveTab] = useState("available"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);
  const ordersPerPage = 6;

  const user = useSelector((state) => state.auth.user);
  const role = useSelector((state) => state.auth.role);
  const navigate = useNavigate();

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

  const handleAcceptOrder = async (orderId) => {
    if (!user?.uid || acceptingOrderId) return;
    setAcceptingOrderId(orderId);
    
    const result = await assignOrderToDeliveryBoy(orderId, user.uid);
    setAcceptingOrderId(null);

    if (result.success) {
      notify.success("Order Accepted! 🚚", "You are assigned to deliver this package. Check details below.");
    } else {
      notify.error("Assignment Failed", result.error || "Order may have been claimed by another partner.");
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
      notify.info("New OTP Generated 🔐", `Code: ${res.otp}`);
    } else {
      notify.error("Failed", res.error || 'Could not regenerate OTP');
    }
  };

  const [otpModal, setOtpModal] = useState({ show: false, orderId: null, otp: "" });

  const submitOtp = async () => {
    if (!otpModal.orderId) return;
    if (!otpModal.otp || otpModal.otp.trim().length !== 4) {
      notify.error("Invalid Code", "Please enter a valid 4-digit OTP provided by customer.");
      return;
    }

    const result = await verifyOrderOTP(otpModal.orderId, otpModal.otp.trim());
    if (result.success) {
      notify.success("Delivery Completed! 🎉", "OTP verified and order marked as Delivered.");
      setOtpModal({ show: false, orderId: null, otp: "" });
    } else {
      notify.error("Incorrect OTP", result.error || "OTP code mismatch. Please check with customer.");
    }
  };

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

  return (
    <div className="space-y-6 md:space-y-8 pb-10 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-5 rounded-2xl md:rounded-3xl shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
            <Truck size={24} className="text-amber-500" />
            <span>Delivery Partner Portal</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Instant order dispatch locking & OTP customer verification.</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-xs font-bold shadow-sm">
          <User size={14} />
          <span>{user?.email}</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => { setActiveTab("available"); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "available"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
              : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800"
          }`}
        >
          📦 Active Dispatches ({orders.filter(o => !o.status?.includes("Delivered")).length})
        </button>
        <button
          onClick={() => { setActiveTab("history"); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
              : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800"
          }`}
        >
          ✅ Delivery History
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-16 text-xs text-amber-600 font-bold animate-pulse">
          Connecting to delivery dispatch stream... 🛵
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 text-xs font-bold">
          {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-200 dark:border-slate-800">
          <span className="text-4xl block mb-2 opacity-60">📭</span>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">No Assignments Found</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {activeTab === "available" ? "No orders are currently waiting for dispatch." : "No completed deliveries recorded yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedOrders.map((order) => {
              const isAssignedToMe = order.assignedTo === user?.uid;
              const canAccept = !order.assignedTo;
              const isBeingAccepted = acceptingOrderId === order.id;

              return (
                <div 
                  key={order.id} 
                  className="bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{order.shipping?.name || "Customer"}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">Order ID: {order.id}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {order.status}
                    </span>
                  </div>

                  {/* Payment Details Pill (Showing Single or Split) */}
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-gray-200/60 dark:border-slate-750">
                    <span className="text-gray-500 dark:text-slate-400">Total Amount:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₹{formatPrice(order.totalAmount)}</span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                      {order.paymentMethod === 'split' ? '⚡ Split Payment' : order.paymentMethod?.toUpperCase()}
                    </span>
                  </div>

                  {/* Address Box */}
                  <div className="space-y-1.5 text-xs text-gray-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-gray-200/60 dark:border-slate-750">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-slate-200">{order.shipping?.address || "Address not specified"}</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">PIN Code: {order.shipping?.pincode || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1 text-xs">
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Package Items:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {order.items?.map((item, idx) => (
                        <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700">
                          {item.quantity}× {item.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex flex-wrap justify-end gap-2">
                    {canAccept && (
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={isBeingAccepted}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isBeingAccepted ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Claiming...</span>
                          </>
                        ) : (
                          <>
                            <span>Accept Dispatch 🚚</span>
                          </>
                        )}
                      </button>
                    )}

                    {isAssignedToMe && !order.status?.includes("Delivered") && (
                      <>
                        <button
                          onClick={() => handleRegenerateOtp(order.id)}
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-gray-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                        >
                          New OTP 🔁
                        </button>
                        <button
                          onClick={() => handleMarkDelivered(order.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-colors cursor-pointer"
                        >
                          Verify OTP & Deliver ✅
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
              <span className="text-xs text-gray-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-gray-800 dark:text-white font-bold text-xs disabled:opacity-30 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs disabled:opacity-30 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OTP Verification Modal */}
      <Modal show={otpModal.show} title="Verify Customer OTP" onClose={() => setOtpModal({ show: false, orderId: null, otp: "" })}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Enter 4-digit code provided by Customer</label>
            <input 
              type="text" 
              maxLength={4} 
              value={otpModal.otp} 
              onChange={(e) => setOtpModal(s => ({ ...s, otp: e.target.value.replace(/\D/g, '') }))} 
              placeholder="••••"
              className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white font-mono text-center text-2xl font-black tracking-widest outline-none focus:border-emerald-500" 
            />
          </div>
          <div className="flex gap-2.5 justify-end pt-2">
            <button 
              onClick={() => setOtpModal({ show: false, orderId: null, otp: "" })} 
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={submitOtp} 
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              Verify & Complete Delivery
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeliveryPanel;