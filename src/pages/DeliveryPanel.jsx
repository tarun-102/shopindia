import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  subscribeDeliveryOrders, 
  assignOrderToDeliveryBoy, 
  cancelDeliveryAssignment, 
  verifyOrderOTP, 
  regenerateOrderOTP,
  startDeliveryRun,
  getOrderTrackingNumber,
  getOrderCarrier
} from "../services/productservices";
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
  Split,
  Copy,
  Navigation,
  Loader2
} from "lucide-react";

const getOrderStatus = (order) => String(order?.status || "").toLowerCase();

const DeliveryPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [activeTab, setActiveTab] = useState("available"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);
  const [startingDeliveryId, setStartingDeliveryId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [releaseOrderId, setReleaseOrderId] = useState(null);
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

  const handleStartDelivery = async (orderId) => {
    if (!user?.uid || startingDeliveryId) return;
    setStartingDeliveryId(orderId);
    
    const result = await startDeliveryRun(orderId, user.uid);
    setStartingDeliveryId(null);

    if (result.success) {
      notify.success("Delivery Run Started! 🛵", `Order marked Out for Delivery. Customer OTP is: ${result.otp}`);
    } else {
      notify.error("Could Not Start Run", result.error || "Failed to mark order out for delivery.");
    }
  };

  const handleMarkDelivered = async (orderId) => {
    setOtpModal({ show: true, orderId, otp: "" });
  };

  const handleCancelDelivery = async (orderId) => {
    if (!user?.uid || cancellingOrderId) return;

    setReleaseOrderId(null);
    setCancellingOrderId(orderId);
    const result = await cancelDeliveryAssignment(orderId, user.uid);
    setCancellingOrderId(null);

    if (result.success) {
      notify.success("Delivery Released", "This order is available for another delivery partner.");
    } else {
      notify.error("Release Failed", result.error || "Could not release this delivery.");
    }
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
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpVerifiedSuccess, setOtpVerifiedSuccess] = useState(false);

  const submitOtp = async () => {
    if (!otpModal.orderId || isVerifyingOtp) return;
    if (!otpModal.otp || otpModal.otp.trim().length !== 4) {
      notify.error("Invalid Code", "Please enter a valid 4-digit OTP provided by customer.");
      return;
    }

    setIsVerifyingOtp(true);
    const result = await verifyOrderOTP(otpModal.orderId, otpModal.otp.trim());
    
    if (result.success) {
      setOtpVerifiedSuccess(true);
      notify.success("Delivery Completed! 🎉", "OTP verified and order marked as Delivered.");
      setTimeout(() => {
        setIsVerifyingOtp(false);
        setOtpVerifiedSuccess(false);
        setOtpModal({ show: false, orderId: null, otp: "" });
      }, 850);
    } else {
      setIsVerifyingOtp(false);
      notify.error("Incorrect OTP", result.error || "OTP code mismatch. Please check with customer.");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const status = getOrderStatus(order);
    if (status.includes('cancel')) return false;

    if (activeTab === "available") {
      const isAvailableForPickup = (!order.assignedTo && !status.includes("delivered") && (status.includes("dispatched") || status.includes("packed") || status.includes("shipping") || status.includes("pending") || status.includes("confirmed") || status.includes("assigning")));
      const isMyActiveDelivery = order.assignedTo === user?.uid && !status.includes("delivered");
      return isAvailableForPickup || isMyActiveDelivery;
    } else {
      return order.assignedTo === user?.uid && status.includes("delivered");
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
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">ShopIndia Prime consignment pickup, Out for Delivery run control & customer OTP verification.</p>
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
          📦 Active Deliveries & Pickup Queue ({orders.filter((order) => (!order.assignedTo && !getOrderStatus(order).includes("delivered") && (getOrderStatus(order).includes("dispatched") || getOrderStatus(order).includes("packed") || getOrderStatus(order).includes("shipping") || getOrderStatus(order).includes("confirmed"))) || (order.assignedTo === user?.uid && !getOrderStatus(order).includes("delivered"))).length})
        </button>
        <button
          onClick={() => { setActiveTab("history"); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
              : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800"
          }`}
        >
          ✅ Completed Delivery History ({orders.filter((order) => order.assignedTo === user?.uid && getOrderStatus(order).includes("delivered")).length})
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
              const canAccept = !order.assignedTo && !getOrderStatus(order).includes("delivered");
              const isOutForDelivery = getOrderStatus(order).includes("out for delivery");
              const isBeingAccepted = acceptingOrderId === order.id;
              const isBeingCancelled = cancellingOrderId === order.id;
              const isStartingRun = startingDeliveryId === order.id;
              const trackingId = getOrderTrackingNumber(order);
              const carrier = getOrderCarrier(order);

              return (
                <div 
                  key={order.id} 
                  className="bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{order.shipping?.name || "Customer"}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">ID: #{order.id?.slice(0, 8)}</p>
                        <span className="text-gray-300 dark:text-slate-700">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(trackingId);
                            notify.info("Tracking ID Copied! 📋", trackingId);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                          title="Click to copy AWB Tracking ID"
                        >
                          <Truck size={12} />
                          <span>AWB: {trackingId}</span>
                          <Copy size={10} />
                        </button>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${
                      isOutForDelivery 
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 animate-pulse"
                        : isAssignedToMe
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-700"
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Payment Details Pill (Showing Single or Split) */}
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-xl border border-gray-200/60 dark:border-slate-700">
                    <span className="text-gray-500 dark:text-slate-400">Total Amount:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₹{formatPrice(order.totalAmount)}</span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                      {order.paymentMethod === 'split' ? '⚡ Split Payment' : order.paymentMethod?.toUpperCase()}
                    </span>
                  </div>

                  {/* Address Box */}
                  <div className="space-y-1.5 text-xs text-gray-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-gray-200/60 dark:border-slate-700">
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
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isBeingAccepted ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Claiming...</span>
                          </>
                        ) : (
                          <>
                            <Truck size={13} />
                            <span>Claim & Pickup Consignment 📦</span>
                          </>
                        )}
                      </button>
                    )}

                    {isAssignedToMe && !getOrderStatus(order).includes("delivered") && (
                      <>
                        {!isOutForDelivery ? (
                          <button
                            onClick={() => handleStartDelivery(order.id)}
                            disabled={isStartingRun}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Navigation size={13} className={isStartingRun ? "animate-spin" : ""} />
                            <span>{isStartingRun ? "Starting Run..." : "Start Delivery Run (Mark Out for Delivery) 🛵"}</span>
                          </button>
                        ) : (
                          <>
                            <div className="w-full mb-1 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 text-xs flex items-center justify-between font-bold">
                              <span className="flex items-center gap-1.5">
                                <Navigation size={14} className="text-blue-500" />
                                <span>🛵 Out for Delivery: Ask customer for 4-digit OTP upon arrival</span>
                              </span>
                            </div>
                            <button
                              onClick={() => handleRegenerateOtp(order.id)}
                              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                            >
                              New OTP 🔁
                            </button>
                            <button
                              onClick={() => handleMarkDelivered(order.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-colors cursor-pointer"
                            >
                              Verify OTP & Deliver ✅
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setReleaseOrderId(order.id)}
                          disabled={isBeingCancelled}
                          className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-500/30 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isBeingCancelled ? "Releasing..." : "Release Order"}
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
      <Modal 
        show={otpModal.show} 
        title="Verify Customer Handover OTP" 
        onClose={() => !isVerifyingOtp && setOtpModal({ show: false, orderId: null, otp: "" })}
      >
        <div className="space-y-4">
          {otpVerifiedSuccess ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-2 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">OTP Verified Successfully!</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Order marked as Delivered & Inventory synchronized.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Enter 4-digit secret code from Customer
                </label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4} 
                  autoFocus
                  disabled={isVerifyingOtp}
                  value={otpModal.otp} 
                  onChange={(e) => setOtpModal(s => ({ ...s, otp: e.target.value.replace(/\D/g, '') }))} 
                  placeholder="••••"
                  className={`w-full mt-2 px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                    isVerifyingOtp 
                      ? "border-amber-400 dark:border-amber-500 animate-pulse bg-amber-500/5" 
                      : "border-gray-300 dark:border-slate-700"
                  } text-gray-900 dark:text-white font-mono text-center text-3xl font-black tracking-[0.5em] outline-none focus:border-emerald-500 transition-all`} 
                />
              </div>

              {isVerifyingOtp && (
                <div className="flex items-center justify-center gap-2 py-1 text-xs text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying OTP with ShopIndia secure database...</span>
                </div>
              )}

              <div className="flex gap-2.5 justify-end pt-2">
                <button 
                  type="button"
                  disabled={isVerifyingOtp}
                  onClick={() => setOtpModal({ show: false, orderId: null, otp: "" })} 
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={submitOtp} 
                  disabled={isVerifyingOtp || otpModal.otp.length !== 4}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Verify & Complete Delivery ✅</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal show={Boolean(releaseOrderId)} title="Release this order?" onClose={() => setReleaseOrderId(null)}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            This order will become available for another delivery partner. It will not be marked as delivered or refunded.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setReleaseOrderId(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Keep Order
            </button>
            <button
              onClick={() => handleCancelDelivery(releaseOrderId)}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer"
            >
              Release Order
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeliveryPanel;