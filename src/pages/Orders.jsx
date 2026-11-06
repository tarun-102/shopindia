import { useEffect, useState, useMemo } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { formatPrice } from "../utils/priceFormatter";
import { 
  getUserOrders, 
  subscribeUserOrders, 
  markOrderPacked, 
  cancelOrderInDB, 
  requestReturnInDB, 
  getOrderTrackingNumber, 
  getOrderCarrier 
} from "../services/productservices";
import InvoiceModal from "../components/ui/InvoiceModal";
import { downloadInvoicePDF } from "../utils/invoicePdfGenerator";
import notify from "../components/ui/LuxuryToast";
import { 
  Package, 
  Truck, 
  KeyRound, 
  Check, 
  XCircle, 
  RotateCcw, 
  FileText, 
  Download, 
  ShieldCheck, 
  Search, 
  ArrowLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy
} from "lucide-react";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'delivered' | 'cancelled'
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  const [shownOtps, setShownOtps] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, orderId: null });
  const [invoiceModal, setInvoiceModal] = useState({ show: false, order: null });
  const [returnModal, setReturnModal] = useState({ show: false, order: null, reason: "Defective / Not Working", comment: "" });
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let orderUnsub = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setLoading(true);
        orderUnsub = subscribeUserOrders(user.uid, (data) => {
          setOrders(data || []);
          setLoading(false);
        }, (err) => {
          console.error("Error subscribing to orders:", err);
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setLoading(false);
        navigate("/login");
      }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
    return () => {
      unsubscribeAuth();
      orderUnsub();
    };
  }, [navigate]);

  // Auto-pack timer: checks for any Stage 1 order reaching 1 minute age
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      orders.forEach((order) => {
        if (!order?.id) return;
        const s = String(order.status || "").toLowerCase();
        if (s.includes("cancel") || s.includes("return")) return;
        const stage = Number(order.orderStage || (s.includes("packed") ? 2 : 1));
        if (stage === 1) {
          const time = new Date(order.date).getTime();
          if (time > 0 && now - time >= 60000) {
            markOrderPacked(order.id).catch((e) => console.warn(e));
          }
        }
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [orders]);

  // Delivery OTP Alert for Out for Delivery
  useEffect(() => {
    orders.forEach((order) => {
      if (order.otp && order.status?.toLowerCase().includes("out for delivery")) {
        if (!shownOtps.includes(order.id)) {
          notify.info(`Delivery OTP: ${order.otp}`, `Share this code with rider for Order #${order.id.slice(0, 6)}`);
          setShownOtps((s) => [...s, order.id]);
        }
      }
    });
  }, [orders, shownOtps]);

  // Helper to determine step in ShopIndia Prime 5-stage vertical timeline
  const getOrderStep = (status, orderStage) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("cancel") || orderStage === -1 || Number(orderStage) === -1) return -1;
    if (orderStage !== undefined && orderStage !== null && Number(orderStage) > 0) return Number(orderStage);
    if (s.includes("delivered") || s.includes("delivered ✅")) return 5;
    if (s.includes("out for delivery")) return 4;
    if (s.includes("dispatched") || s.includes("partner assigned") || s.includes("shipped") || s.includes("picked up") || s.includes("on the way")) return 3;
    if (s.includes("packed") || s.includes("shipping")) return 2;
    return 1;
  };

  const canCancelOrder = (order) => {
    if (!order) return false;
    const rawStatus = (order.status || "").toLowerCase();
    if (rawStatus.includes("cancelled") || rawStatus.includes("delivered")) return false;
    const orderTime = new Date(order.date).getTime();
    if (isNaN(orderTime)) return false;
    return Date.now() - orderTime <= 60000;
  };

  const triggerCancelOrder = (orderId) => {
    setConfirmDialog({ show: true, orderId });
  };

  const executeCancelOrder = async () => {
    const orderId = confirmDialog.orderId;
    setConfirmDialog({ show: false, orderId: null });

    const result = await cancelOrderInDB(orderId, { userId: currentUser?.uid });
    if (result.success) {
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: "Cancelled 🔴", orderStage: -1 } : order
      ));
      
      if (result.refunded) {
        notify.refund(result.refundAmount, orderId);
      } else {
        notify.info("Order Cancelled", `Order #${orderId.slice(0, 6)} cancelled successfully`);
      }
      if (currentUser?.uid) {
        const refreshed = await getUserOrders(currentUser.uid);
        setOrders(refreshed);
      }
    } else {
      notify.error("Cancellation Failed", result.error || "Unable to cancel order.");
    }
  };

  const canReturnOrder = (order) => {
    if (!order) return false;
    const rawStatus = (order.status || "").toLowerCase();
    if (!rawStatus.includes("delivered")) return false;
    if (rawStatus.includes("return") || order.returnRequest?.status) return false;
    const hasReturnable = order.items?.some(i => i.isReturnable !== false);
    if (!hasReturnable) return false;

    const baseTime = new Date(order.deliveredAt || order.date).getTime();
    if (isNaN(baseTime)) return false;
    return (Date.now() - baseTime) <= (7 * 24 * 60 * 60 * 1000);
  };

  const handleOpenReturnModal = (order) => {
    setReturnModal({
      show: true,
      order,
      reason: "Defective / Not Working",
      comment: ""
    });
  };

  const submitReturnRequest = async () => {
    if (!returnModal.order || !currentUser) return;
    setReturnSubmitting(true);
    const result = await requestReturnInDB(returnModal.order.id, {
      reason: returnModal.reason,
      comment: returnModal.comment,
      userId: currentUser.uid
    });
    setReturnSubmitting(false);

    if (result.success) {
      notify.success("Return Request Submitted 🔄", "Admin will verify and refund your order to wallet.");
      setReturnModal({ show: false, order: null, reason: "Defective / Not Working", comment: "" });
      const refreshed = await getUserOrders(currentUser.uid);
      setOrders(refreshed);
    } else {
      notify.error("Return Failed", result.error || "Unable to submit return request.");
    }
  };

  // Filtered & Searched Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        order.id.toLowerCase().includes(q) ||
        order.items?.some(item => (item.title || "").toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const raw = (order.status || "").toLowerCase();
      if (statusFilter === "active") {
        return !raw.includes("delivered") && !raw.includes("cancel");
      }
      if (statusFilter === "delivered") {
        return raw.includes("delivered");
      }
      if (statusFilter === "cancelled") {
        return raw.includes("cancel") || raw.includes("return");
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  const activeCount = orders.filter(o => !o.status?.toLowerCase().includes("delivered") && !o.status?.toLowerCase().includes("cancel")).length;
  const deliveredCount = orders.filter(o => o.status?.toLowerCase().includes("delivered")).length;
  const cancelledCount = orders.filter(o => o.status?.toLowerCase().includes("cancel") || o.status?.toLowerCase().includes("return")).length;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[65vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Loading Orders...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 min-h-[85vh] transition-colors pb-12 max-w-5xl mx-auto">
      
      {/* Cancellation Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 rounded-3xl max-w-md w-full text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">Cancel Order?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-xs sm:text-sm">
              Are you sure you want to cancel this order? Any prepaid amount will be instantly credited back to your ShopIndia Wallet.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setConfirmDialog({ show: false, orderId: null })}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Keep Order
              </button>
              <button 
                onClick={executeCancelOrder}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Cancel & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Return Request Modal */}
      {returnModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 rounded-3xl max-w-lg w-full text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">7-Day Return Request</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Order ID: #{returnModal.order?.id?.slice(0, 8)}</p>
                </div>
              </div>
              <button 
                onClick={() => setReturnModal({ show: false, order: null, reason: "Defective / Not Working", comment: "" })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Reason for Return</label>
                <select
                  value={returnModal.reason}
                  onChange={(e) => setReturnModal({ ...returnModal, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white font-semibold outline-none"
                >
                  <option value="Defective / Not Working">Defective or Not Working</option>
                  <option value="Wrong Item Received">Received Different Product</option>
                  <option value="Damaged in Transit">Package Damaged in Delivery</option>
                  <option value="Quality Not as Expected">Item Quality Not as Expected</option>
                  <option value="Changed Mind">Changed Mind (Unopened Package)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Comments / Notes</label>
                <textarea
                  value={returnModal.comment}
                  onChange={(e) => setReturnModal({ ...returnModal, comment: e.target.value })}
                  rows={3}
                  placeholder="Provide any additional details for fast admin review..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b14] text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-[11px] leading-relaxed">
                ℹ️ Once approved by admin, full order amount of ₹{formatPrice(returnModal.order?.totalAmount)} will be refunded directly to your ShopIndia Wallet.
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setReturnModal({ show: false, order: null, reason: "Defective / Not Working", comment: "" })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={submitReturnRequest}
                disabled={returnSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {returnSubmitting ? "Submitting..." : "Submit Return 🔄"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Tax Invoice Modal */}
      <InvoiceModal
        show={invoiceModal.show}
        onClose={() => setInvoiceModal({ show: false, order: null })}
        order={invoiceModal.order}
      />

      {/* Mobile-First Header with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0c1220] p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            title="Back to Account"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                My Orders & Live Tracking
              </h1>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                {orders.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track live ShopIndia Prime dispatches, download GST tax invoices and manage 7-day returns.
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <span>Continue Shopping</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Search & Filter Strip (Mobile-Optimized) */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search orders by item or Order ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm font-medium outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {[
            { id: "all", label: `All (${orders.length})` },
            { id: "active", label: `Active (${activeCount})` },
            { id: "delivered", label: `Delivered (${deliveredCount})` },
            { id: "cancelled", label: `Cancelled (${cancelledCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-4xl block mb-2 opacity-60">🛍️</span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Orders Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {searchQuery ? `No orders matched "${searchQuery}".` : "You haven't placed any orders matching this filter."}
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Browse Deals
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => {
            const step = getOrderStep(order.status, order.orderStage);
            const isCancelled = step === -1;
            const trackingId = getOrderTrackingNumber(order);
            const carrier = getOrderCarrier(order);

            return (
              <div 
                key={order.id} 
                className="p-4 sm:p-5 bg-white dark:bg-[#0c1220] rounded-2xl md:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4"
              >
                {/* ShopIndia Prime AWB Tracking Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Truck size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{carrier}</span>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                      AWB: {trackingId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(trackingId);
                      notify.info("Tracking ID Copied! 📋", trackingId);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[11px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-colors cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>Copy AWB</span>
                  </button>
                </div>

                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>Order ID:</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-[11px]">
                        #{order.id}
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
                      order.status?.includes("Returned & Refunded") ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" :
                      order.status?.includes("Return Requested") ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30" :
                      step === 5 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" :
                      step === 4 ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 animate-pulse" :
                      "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                    }`}>
                      {order.status || "Pending ⏳"}
                    </span>

                    {/* Instant Download GST Tax Invoice Button */}
                    <button
                      onClick={() => {
                        downloadInvoicePDF(order);
                        notify.success("Tax Invoice PDF downloaded! 📥");
                      }}
                      className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold py-1 px-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer active:scale-95 shadow-sm"
                      title="Instant Download Official GST Tax Invoice (.pdf)"
                    >
                      <Download size={12} />
                      <span>Download Bill 📥</span>
                    </button>

                    {/* View Invoice Modal Button */}
                    <button
                      onClick={() => setInvoiceModal({ show: true, order })}
                      className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold py-1 px-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                      title="View Official GST Tax Invoice"
                    >
                      <FileText size={12} />
                      <span>View Bill 📄</span>
                    </button>

                    {/* 7-Day Return Button */}
                    {canReturnOrder(order) && (
                      <button
                        onClick={() => handleOpenReturnModal(order)}
                        className="inline-flex items-center gap-1 text-[10px] bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-bold py-1 px-2.5 rounded-lg border border-cyan-200 dark:border-cyan-800 transition-colors cursor-pointer"
                        title="Eligible for 7-Day Product Return Policy"
                      >
                        <RotateCcw size={12} />
                        <span>Return (7-Day) 🔄</span>
                      </button>
                    )}

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

                {/* Return Request Banner if active */}
                {order.returnRequest && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs">
                    <div className="flex items-center gap-2">
                      <RotateCcw size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-200">
                          Return Status: {order.returnRequest.status || order.status}
                        </span>
                        {order.returnRequest.reason && (
                          <span className="text-amber-700 dark:text-amber-400 ml-2">
                            • Reason: {order.returnRequest.reason}
                          </span>
                        )}
                      </div>
                    </div>
                    {order.returnRequest.rejectionReason && (
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                        Rejection Note: {order.returnRequest.rejectionReason}
                      </span>
                    )}
                  </div>
                )}

                {/* SHOPINDIA PRIME VERTICAL 5-STAGE ORDER TRACKING TIMELINE */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-slate-800/80">
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Truck size={14} className="text-indigo-600 dark:text-indigo-400" />
                      ShopIndia Live Tracking
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {isCancelled ? "Order Cancelled" : step === 5 ? "Delivered" : "In Transit"}
                    </span>
                  </div>

                  {isCancelled ? (
                    /* Cancelled Order Timeline */
                    <div className="space-y-0 pt-1">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs ring-4 ring-emerald-500/20">
                            <Check size={13} className="stroke-[3]" />
                          </div>
                          <div className="w-0.5 h-8 bg-rose-400 dark:bg-rose-600 my-1"></div>
                        </div>
                        <div className="pb-3 min-w-0">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Order Confirmed</h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Placed on {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs ring-4 ring-rose-500/20">
                            <XCircle size={14} className="stroke-[2.5]" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">Order Cancelled</h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Refund of ₹{formatPrice(order.totalAmount)} credited back to your ShopIndia Wallet
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Active Order 5-Step Vertical Timeline */
                    <div className="space-y-0 pt-1">
                      {[
                        {
                          num: 1,
                          title: "Order Confirmed",
                          sub: new Date(order.date).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }),
                          info: step === 1 ? "Order confirmed. Warehouse packaging in progress (Auto-packs in 1 min)" : "Your order has been verified and confirmed by ShopIndia"
                        },
                        {
                          num: 2,
                          title: "Shipping Order 📦",
                          sub: step >= 2 ? (order.packedAt || order.shippingStartedAt ? "Shipping initiated & AWB attached" : "Item prepared & labeled") : "Awaiting shipping initiation",
                          info: step >= 2 ? "Package prepared and shipping initiated with official ShopIndia Prime AWB label" : "Preparing package for courier partner handover"
                        },
                        {
                          num: 3,
                          title: "Your Order is on the Way 🚚",
                          sub: step >= 3 ? (order.acceptedAt || order.dispatchedAt ? `${carrier} • In Transit` : `${carrier} picked up consignment`) : "Pending delivery partner pickup from hub",
                          info: step >= 3 ? "ShopIndia Prime Delivery partner has accepted your package and is on the way" : "Package ready for courier partner handover"
                        },
                        {
                          num: 4,
                          title: "Out for Delivery 🛵",
                          sub: step >= 4 ? "Delivery partner is on the way to your doorstep" : "Pending arrival at local delivery hub",
                          info: step >= 4 ? "Please verify package before sharing 4-digit OTP with rider" : "Package will arrive on scheduled delivery slot",
                          hasOtp: step >= 4 && order.otp
                        },
                        {
                          num: 5,
                          title: "Delivered ✅",
                          sub: step >= 5 ? (order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Delivered") : "Expected in 1-2 business days",
                          info: step >= 5 ? "Package delivered safely to recipient" : "Standard doorstep delivery with OTP verification",
                          isDelivered: step >= 5
                        }
                      ].map((s, idx, arr) => {
                        const isDone = step > s.num || (step === 5 && s.num === 5);
                        const isCurrent = step === s.num && step !== 5;
                        const isLast = idx === arr.length - 1;

                        return (
                          <div key={s.num} className="flex items-start gap-3">
                            {/* Left Column: Connected Circular Node */}
                            <div className="flex flex-col items-center shrink-0">
                              {isDone ? (
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs ring-4 ring-emerald-500/20 shadow-sm">
                                  <Check size={13} className="stroke-[3]" />
                                </div>
                              ) : isCurrent ? (
                                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-indigo-500/30 animate-pulse shadow-md shadow-indigo-600/30">
                                  <span className="w-2 h-2 rounded-full bg-white"></span>
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center text-[10px] font-black">
                                  {s.num}
                                </div>
                              )}

                              {!isLast && (
                                <div
                                  className={`w-0.5 my-1 transition-colors duration-300 ${
                                    isDone && (step > s.num || step === 5)
                                      ? "bg-emerald-500"
                                      : "bg-slate-200 dark:bg-slate-800"
                                  }`}
                                  style={{ minHeight: "34px" }}
                                />
                              )}
                            </div>

                            {/* Right Column: Step details */}
                            <div className={`flex-1 min-w-0 ${!isLast ? "pb-3" : "pb-0"}`}>
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <h5 className={`text-xs sm:text-sm font-bold ${
                                  isDone || isCurrent ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                                }`}>
                                  {s.title}
                                </h5>
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                  {s.sub}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {s.info}
                              </p>

                              {/* OTP code inside Step 4 */}
                              {s.hasOtp && (
                                <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                                    <KeyRound size={15} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>Delivery OTP for Rider:</span>
                                  </div>
                                  <span className="font-mono text-sm sm:text-base font-black tracking-widest text-emerald-700 dark:text-emerald-200 bg-white dark:bg-slate-900 px-3 py-0.5 rounded-lg border border-emerald-400 shadow-sm">
                                    {order.otp}
                                  </span>
                                </div>
                              )}

                              {/* 7-Day Return badge inside Step 5 */}
                              {s.isDelivered && (
                                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300 font-bold">
                                  <ShieldCheck size={13} className="text-indigo-600 dark:text-indigo-400" />
                                  <span>7-Day Product Return & Replacement Policy Protected</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Purchased Items List */}
                <div className="space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-[#070b14] p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-white dark:bg-white rounded-xl p-1 shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
                          <img src={item.image || item.thumbnail} alt={item.title} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              ₹{formatPrice(item.price)} × <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.quantity}</span>
                            </span>
                            {item.gstRate !== undefined && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                GST {item.gstRate}%
                              </span>
                            )}
                            {item.isReturnable && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                7-Day Return ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white shrink-0">
                        ₹{formatPrice(item.totalPrice || (item.price * (item.quantity || 1)))}
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
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
  );
};

export default Orders;

