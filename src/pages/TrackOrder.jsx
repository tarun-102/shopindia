import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { db, auth } from "../services/firebase";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { formatPrice } from "../utils/priceFormatter";
import { 
  getOrderTrackingNumber, 
  getOrderCarrier, 
  getUserOrders 
} from "../services/productservices";
import { downloadInvoicePDF } from "../utils/invoicePdfGenerator";
import InvoiceModal from "../components/ui/InvoiceModal";
import notify from "../components/ui/LuxuryToast";
import { 
  Truck, 
  Search, 
  Package, 
  Check, 
  XCircle, 
  Copy, 
  Download, 
  FileText, 
  MapPin, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from "lucide-react";

const TrackOrder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("id") || searchParams.get("awb") || searchParams.get("q") || "";

  const [inputVal, setInputVal] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState({ show: false, order: null });

  // Track authentication state & load recent orders for 1-click quick-select
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const list = await getUserOrders(user.uid);
          setUserOrders(list.slice(0, 4));
        } catch (e) {
          console.warn("Failed to load user orders:", e);
        }
      }
    });
    return () => unsub();
  }, []);

  // Auto-search if query param present
  useEffect(() => {
    if (initialQuery.trim()) {
      handleSearch(initialQuery.trim());
    }
  }, [initialQuery]);

  const handleSearch = async (searchTerm) => {
    const term = (searchTerm || inputVal).trim();
    if (!term) {
      notify.error("Input Required", "Please enter an Order ID or AWB Tracking Number.");
      return;
    }

    setLoading(true);
    setNotFound(false);
    setSearchedOrder(null);
    setHasSearched(true);

    // Clean tracking search query (strip leading #)
    const cleanTerm = term.replace(/^#/, "");

    try {
      // 1. Direct Document ID Lookup
      let matchedDoc = null;
      try {
        const directDocRef = doc(db, "orders", cleanTerm);
        const directSnap = await getDoc(directDocRef);
        if (directSnap.exists()) {
          matchedDoc = { id: directSnap.id, ...directSnap.data() };
        }
      } catch (err) {
        // Continue to collection queries if direct lookup doesn't match ID format
      }

      // 2. Search by AWB / Tracking Number
      if (!matchedDoc) {
        const awbQuery = query(
          collection(db, "orders"),
          where("trackingNumber", "==", cleanTerm),
          limit(1)
        );
        const awbSnap = await getDocs(awbQuery);
        if (!awbSnap.empty) {
          matchedDoc = { id: awbSnap.docs[0].id, ...awbSnap.docs[0].data() };
        }
      }

      // 3. Fallback: Prefix / Substring match in recent active orders
      if (!matchedDoc) {
        const allRecentQuery = query(collection(db, "orders"), limit(50));
        const allRecentSnap = await getDocs(allRecentQuery);
        const termLower = cleanTerm.toLowerCase();
        
        const found = allRecentSnap.docs.find(d => {
          const data = d.data();
          const orderId = d.id.toLowerCase();
          const awb = getOrderTrackingNumber({ id: d.id, ...data }).toLowerCase();
          return orderId.includes(termLower) || awb.includes(termLower);
        });

        if (found) {
          matchedDoc = { id: found.id, ...found.data() };
        }
      }

      if (matchedDoc) {
        setSearchedOrder(matchedDoc);
        setNotFound(false);
        setSearchParams({ q: cleanTerm });
      } else {
        setSearchedOrder(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error("Tracking lookup error:", err);
      notify.error("Lookup Failed", "Unable to retrieve tracking info. Please check your network.");
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getStep = (order) => {
    if (!order) return 1;
    const s = String(order.status || "").toLowerCase();
    const stage = Number(order.orderStage);
    if (s.includes("cancel") || stage === -1) return -1;
    if (stage > 0) return stage;
    if (s.includes("delivered") || s.includes("delivered ✅")) return 5;
    if (s.includes("out for delivery")) return 4;
    if (s.includes("dispatched") || s.includes("partner assigned") || s.includes("shipped") || s.includes("picked up") || s.includes("on the way")) return 3;
    if (s.includes("packed") || s.includes("shipping")) return 2;
    return 1;
  };

  const currentStep = getStep(searchedOrder);
  const isCancelled = currentStep === -1;
  const trackingNumber = searchedOrder ? getOrderTrackingNumber(searchedOrder) : "";
  const carrier = searchedOrder ? getOrderCarrier(searchedOrder) : "ShopIndia Prime Express";

  return (
    <div className="space-y-6 md:space-y-8 pb-16 max-w-4xl mx-auto min-h-[80vh] transition-colors">
      
      {/* Official Tax Invoice Modal */}
      <InvoiceModal
        show={invoiceModal.show}
        onClose={() => setInvoiceModal({ show: false, order: null })}
        order={invoiceModal.order}
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-[#0a1020] to-purple-950 text-white border border-indigo-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
              <Truck size={13} className="text-indigo-400" />
              <span>ShopIndia Prime Live Dispatch</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Shipment & Order Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Track live package dispatch, fulfillment center packaging, and delivery executive milestones in real time.
            </p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-3xl shadow-inner">
            📦
          </div>
        </div>

        {/* Real-time Search Box */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="relative z-10 mt-6 flex flex-col sm:flex-row gap-2"
        >
          <div className="flex-1 flex items-center bg-white dark:bg-black/80 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-700 shadow-inner focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <Search size={18} className="text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter Order ID (e.g. DZlenamv...) or AWB (e.g. SIP135...IN)"
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => { setInputVal(""); setSearchedOrder(null); setHasSearched(false); }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white px-2 font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Track Package</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Quick Order Selector Chips for Logged-In User */}
        {userOrders.length > 0 && (
          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-bold">Your Recent Shipments:</span>
            {userOrders.map((ord) => {
              const awb = getOrderTrackingNumber(ord);
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => { setInputVal(ord.id); handleSearch(ord.id); }}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>#{ord.id.slice(0, 6)}</span>
                  <span className="text-[10px] text-indigo-300">({awb.slice(0, 9)}...)</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* State: Not Found */}
      {hasSearched && notFound && (
        <div className="p-10 text-center bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 animate-fade-in">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center text-2xl mx-auto shadow-inner">
            ⚠️
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            No Active Consignment Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            We couldn't find an order matching <span className="font-mono font-bold text-slate-800 dark:text-slate-200">"{inputVal}"</span>. Please check for typos or view your orders page.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/orders"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Go to My Orders
            </Link>
          </div>
        </div>
      )}

      {/* State: Matching Order Found */}
      {searchedOrder && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Main Shipment Status Card */}
          <div className="bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
            
            {/* Top Bar: Carrier & AWB */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Truck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      {carrier}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official Consignment Express Delivery
                  </p>
                </div>
              </div>

              {/* AWB Pill with Copy Button */}
              <div className="flex items-center gap-2 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 px-3 py-1.5 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">AWB:</span>
                <span className="font-mono font-black text-xs text-indigo-700 dark:text-indigo-300">
                  {trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(trackingNumber);
                    notify.info("Tracking ID Copied! 📋", trackingNumber);
                  }}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                  title="Copy AWB Number"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            {/* Order Metadata Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Order ID</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white truncate block">
                  #{searchedOrder.id}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Destination</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">
                  {searchedOrder.shipping?.pincode ? `PIN: ${searchedOrder.shipping.pincode}` : "Destination on record"}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Payment</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase truncate block">
                  {searchedOrder.paymentMethod || "Prepaid"}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Amount</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 truncate block text-sm">
                  ₹{formatPrice(searchedOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* LIVE 5-STAGE VERTICAL TRACKING TIMELINE */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Live Dispatch Journey
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    Real-Time GPS Synced
                  </span>
                </div>
                <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-xl border ${
                  isCancelled ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30" :
                  currentStep === 5 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" :
                  currentStep === 4 ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 animate-pulse" :
                  "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                }`}>
                  {searchedOrder.status}
                </span>
              </div>

              {isCancelled ? (
                /* Cancelled Order Timeline */
                <div className="space-y-0 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md shadow-emerald-500/30">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                      <div className="w-0.5 h-10 bg-rose-400 dark:bg-rose-600 my-1"></div>
                    </div>
                    <div className="pb-4 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Order Confirmed</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Placed on {new Date(searchedOrder.date).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shadow-md shadow-rose-500/30">
                        <XCircle size={15} className="stroke-[2.5]" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">Order Cancelled</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Refund of ₹{formatPrice(searchedOrder.totalAmount)} credited back to customer wallet.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* 5-Stage Active Order Timeline */
                <div className="space-y-0 pt-1">
                  {[
                    {
                      num: 1,
                      title: "Order Confirmed",
                      sub: new Date(searchedOrder.date).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }),
                      info: currentStep === 1 ? "Warehouse packaging in progress (Auto-packs in 1 min)" : "Order verified and confirmed by ShopIndia Prime"
                    },
                    {
                      num: 2,
                      title: "Shipping Order 📦",
                      sub: currentStep >= 2 ? (searchedOrder.packedAt ? "Shipping initiated & AWB attached" : "Item packaged and labeled") : "Awaiting shipping initiation",
                      info: currentStep >= 2 ? "Package prepared and shipping initiated with official ShopIndia Prime AWB label" : "Preparing package for courier partner handover"
                    },
                    {
                      num: 3,
                      title: "Your Order is on the Way 🚚",
                      sub: currentStep >= 3 ? `${carrier} • In Transit` : "Pending pickup by logistics partner from hub",
                      info: currentStep >= 3 ? "ShopIndia Prime Delivery partner has accepted your package and is on the way" : "Consignment waiting for delivery boy pickup"
                    },
                    {
                      num: 4,
                      title: "Out for Delivery 🛵",
                      sub: currentStep >= 4 ? "Delivery partner is on the way to your doorstep" : "Pending arrival at destination local delivery hub",
                      info: currentStep >= 4 ? "Please verify package before sharing 4-digit OTP with rider" : "Package will arrive on scheduled delivery slot",
                      hasOtp: currentStep >= 4 && searchedOrder.otp
                    },
                    {
                      num: 5,
                      title: "Delivered 🎉",
                      sub: currentStep >= 5 ? (searchedOrder.deliveredAt ? new Date(searchedOrder.deliveredAt).toLocaleString('en-IN') : "Delivered") : "Expected in 1-2 business days",
                      info: currentStep >= 5 ? "Package delivered safely to recipient" : "Standard doorstep delivery with OTP verification",
                      isDelivered: currentStep >= 5
                    }
                  ].map((stage, idx, arr) => {
                    const isDone = currentStep > stage.num || (currentStep === 5 && stage.num === 5);
                    const isCurrent = currentStep === stage.num && currentStep !== 5;
                    const isLast = idx === arr.length - 1;

                    return (
                      <div key={stage.num} className="flex items-start gap-3 sm:gap-4">
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                            isDone 
                              ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                              : isCurrent 
                              ? "bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-blue-600/30 animate-pulse" 
                              : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-700"
                          }`}>
                            {isDone ? <Check size={15} className="stroke-[3]" /> : stage.num}
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 h-10 sm:h-12 my-1 transition-all ${
                              currentStep > stage.num 
                                ? "bg-emerald-500" 
                                : "bg-slate-200 dark:bg-slate-800"
                            }`}></div>
                          )}
                        </div>

                        <div className="pb-4 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <h4 className={`text-xs sm:text-sm font-black ${
                              isDone || isCurrent 
                                ? "text-slate-900 dark:text-white" 
                                : "text-slate-400 dark:text-slate-600"
                            }`}>
                              {stage.title}
                            </h4>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                              {stage.sub}
                            </span>
                          </div>
                          <p className={`text-[11px] mt-0.5 leading-relaxed ${
                            isCurrent ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-500 dark:text-slate-400"
                          }`}>
                            {stage.info}
                          </p>

                          {stage.hasOtp && (
                            <div className="mt-2 inline-flex items-center gap-2 p-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                              <span className="font-bold">🔐 Delivery OTP:</span>
                              <span className="font-mono font-black text-sm tracking-widest bg-blue-600 text-white px-2 py-0.5 rounded-lg shadow-sm">
                                {searchedOrder.otp}
                              </span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400">Share with rider only upon delivery</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Package Items & Actions */}
            <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Package Contents ({(searchedOrder.items || []).length} items):
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                  {(searchedOrder.items || []).map(i => `${i.title} (${i.quantity || 1}x)`).join(", ")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    downloadInvoicePDF(searchedOrder);
                    notify.success("Tax Invoice Downloaded! 📥");
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInvoiceModal({ show: true, order: searchedOrder })}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                >
                  <FileText size={13} />
                  <span>View Bill</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Helpful Info Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Truck size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">ShopIndia Prime Express</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Official dedicated courier fleet</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">OTP Verified Handover</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Zero stolen or false deliveries</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
            <RotateCcw size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">7-Day Easy Returns</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Instant wallet credit on pickup</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TrackOrder;
