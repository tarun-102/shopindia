import React, { useState, useEffect } from "react";
import { formatPrice } from "../../utils/priceFormatter";
import { 
  ShieldCheck, 
  Lock, 
  X, 
  QrCode, 
  CreditCard, 
  Building2, 
  Wallet, 
  Truck, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Smartphone
} from "lucide-react";

const RazorpayModal = ({
  show,
  onClose,
  amount,
  orderDetails,
  walletBalance = 0,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState("upi"); // 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod'
  const [status, setStatus] = useState("ready"); // 'ready' | 'processing' | 'otp' | 'success'
  
  // UPI Form State
  const [upiId, setUpiId] = useState("");
  const [countdown, setCountdown] = useState(299); // 5 min timer

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // Netbanking Form State
  const [selectedBank, setSelectedBank] = useState("HDFC");

  // OTP State
  const [mockOtp, setMockOtp] = useState("849201");
  const [inputOtp, setInputOtp] = useState("");
  const [paymentId, setPaymentId] = useState("");

  useEffect(() => {
    if (show) {
      setStatus("ready");
      setCountdown(299);
      setInputOtp("");
      const randId = `pay_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      setPaymentId(randId);
    }
  }, [show]);

  // Timer countdown for QR Code
  useEffect(() => {
    if (!show || status !== "ready") return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [show, status]);

  if (!show) return null;

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Detect card network
  const getCardNetwork = (num) => {
    const clean = num.replace(/\s+/g, "");
    if (clean.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(clean)) return "Mastercard";
    if (/^(60|65|81|82)/.test(clean)) return "RuPay";
    return "Card";
  };

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length > 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExpiry(val);
  };

  const triggerPaymentFlow = () => {
    if (activeTab === "cod") {
      setStatus("processing");
      setTimeout(() => {
        setStatus("success");
        setTimeout(() => {
          onSuccess({ paymentMethod: "cod", paymentId: `cod_${Date.now()}` });
        }, 1200);
      }, 1000);
      return;
    }

    setStatus("processing");
    setTimeout(() => {
      // Show simulated bank OTP step
      setStatus("otp");
    }, 1400);
  };

  const handleVerifyOtp = () => {
    setStatus("processing");
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        const details = { method: activeTab };
        if (activeTab === "netbanking" && selectedBank) details.bank = selectedBank;
        if (activeTab === "card" && cardNumber) details.cardNetwork = getCardNetwork(cardNumber);
        if (activeTab === "upi" && upiId) details.upiId = upiId;

        onSuccess({
          paymentMethod: activeTab === "wallet" ? "wallet" : "razorpay",
          paymentId: paymentId || `pay_${Date.now()}`,
          razorpayDetails: details
        });
      }, 1400);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#070e1b] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* ShopIndia Authentic Navy Header */}
        <div className="bg-[#0c2340] text-white px-5 py-4 flex items-center justify-between border-b border-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-lg text-white shadow-md">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm tracking-tight text-white">ShopIndia Retail Pvt. Ltd.</h3>
                <span className="p-0.5 rounded-full bg-emerald-500 text-white" title="ShopIndia Verified Merchant">
                  <ShieldCheck size={12} className="stroke-[3]" />
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 font-medium flex items-center gap-1">
                <span>ShopIndia Direct Secure Pay</span>
                <span>•</span>
                <span className="font-mono text-emerald-400">256-bit SSL</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-blue-300 block">Amount to Pay</span>
              <span className="text-lg font-black text-white font-mono">₹{formatPrice(amount)}</span>
            </div>
            {status === "ready" && (
              <button 
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Cancel Payment"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Processing State Overlay */}
        {status === "processing" && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                <Lock size={20} />
              </div>
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Connecting Securely to Bank Gateway...</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Authorizing 256-bit encrypted transaction with {activeTab === "netbanking" ? selectedBank : "ShopIndia Secure Banking Gateway"}. Please do not refresh.
              </p>
            </div>
          </div>
        )}

        {/* Bank OTP Simulator State */}
        {status === "otp" && (
          <div className="p-6 sm:p-8 space-y-5 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Smartphone size={16} className="text-blue-600" />
                <span>Simulated Bank SMS Alert:</span>
              </div>
              <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                "HDFC Bank: OTP for txn of ₹{formatPrice(amount)} at ShopIndia is <span className="font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border">{mockOtp}</span>. Valid for 10 mins."
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Enter 6-Digit Bank OTP</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter OTP"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center font-mono text-xl font-bold tracking-widest text-slate-900 dark:text-white outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setInputOtp(mockOtp)}
                  className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  ⚡ Auto-fill Test OTP
                </button>
              </div>
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={inputOtp.length < 4}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              <span>Verify & Authorize Payment</span>
            </button>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 size={36} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400">Payment Authorized Successfully!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Transaction ID: {paymentId}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-bold mt-2">
                Placing your order and generating official GST Tax Invoice...
              </p>
            </div>
          </div>
        )}

        {/* Ready State: Razorpay Payment Tabs & Forms */}
        {status === "ready" && (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            
            {/* Left Method Tabs */}
            <div className="w-full md:w-44 bg-slate-50 dark:bg-[#040810] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-2 flex md:flex-col gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: "upi", label: "UPI & QR", icon: QrCode },
                { id: "card", label: "Cards", icon: CreditCard },
                { id: "netbanking", label: "NetBanking", icon: Building2 },
                { id: "wallet", label: "Wallet", icon: Wallet },
                { id: "cod", label: "Cash on Del.", icon: Truck }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Tab Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              
              {/* TAB 1: UPI & QR Code */}
              {activeTab === "upi" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40">
                    {/* Simulated Dynamic Razorpay QR Code */}
                    <div className="relative p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0">
                      <div className="w-28 h-28 bg-slate-900 rounded-xl p-1.5 flex flex-col justify-between relative overflow-hidden">
                        {/* QR Grid pattern simulation */}
                        <div className="flex justify-between">
                          <div className="w-7 h-7 border-4 border-white bg-black"></div>
                          <div className="w-7 h-7 border-4 border-white bg-black"></div>
                        </div>
                        <div className="text-center font-mono font-black text-[9px] text-white tracking-widest py-1 bg-blue-600 rounded">
                          SHOPINDIA
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="w-7 h-7 border-4 border-white bg-black"></div>
                          <div className="w-6 h-6 border-2 border-white flex items-center justify-center text-[7px] text-white font-bold">
                            ₹
                          </div>
                        </div>
                        {/* Laser Scanner Line */}
                        <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse top-1/2 -translate-y-1/2"></div>
                      </div>
                    </div>

                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                        Scan & Pay via any UPI App
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">GPay, PhonePe, Paytm, CRED</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        QR Code expires in <span className="font-mono font-bold text-rose-500">{formatTimer(countdown)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Or Pay with UPI ID / VPA</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                      />
                    </div>
                    {/* Quick UPI Handle Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["@okhdfcbank", "@okaxis", "@paytm", "@ibl"].map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => setUpiId(`customer${handle}`)}
                          className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Cards */}
              {activeTab === "card" && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Card Number</label>
                      <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                        {getCardNetwork(cardNumber)}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4532 8901 2345 6789"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="12/28"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        placeholder="•••"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: NetBanking */}
              {activeTab === "netbanking" && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Select Bank</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "HDFC", name: "HDFC Bank", color: "text-blue-700" },
                      { id: "SBI", name: "State Bank of India", color: "text-cyan-700" },
                      { id: "ICICI", name: "ICICI Bank", color: "text-orange-700" },
                      { id: "AXIS", name: "Axis Bank", color: "text-rose-700" },
                      { id: "KOTAK", name: "Kotak Mahindra", color: "text-red-700" },
                      { id: "PNB", name: "Punjab National", color: "text-amber-700" }
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBank(b.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedBank === b.id
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-black shadow-sm"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 text-xs"
                        }`}
                      >
                        <span className="block text-xs font-black">{b.id}</span>
                        <span className="text-[10px] text-slate-500 truncate block mt-0.5">{b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ShopIndia Wallet */}
              {activeTab === "wallet" && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase">ShopIndia Wallet Balance</span>
                      <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                        ₹{formatPrice(walletBalance)}
                      </p>
                    </div>
                    <span className="text-3xl">👛</span>
                  </div>
                  {walletBalance < amount ? (
                    <p className="text-xs text-rose-600 font-bold">
                      ⚠️ Insufficient wallet balance. You need ₹{formatPrice(amount - walletBalance)} more. Please use UPI or Cards.
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ Instant 1-click debit from your verified ShopIndia wallet balance.
                    </p>
                  )}
                </div>
              )}

              {/* TAB 5: Cash on Delivery */}
              {activeTab === "cod" && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Truck size={18} className="text-emerald-600" />
                    <span>Pay Cash on Delivery</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pay via cash, UPI, or card directly to our ShopIndia Prime Express delivery partner upon parcel doorstep arrival.
                  </p>
                </div>
              )}

              {/* Bottom Pay Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={triggerPaymentFlow}
                  disabled={activeTab === "wallet" && walletBalance < amount}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  <Lock size={16} />
                  <span>
                    {activeTab === "cod" ? "Confirm Order with Cash on Delivery" : `Pay ₹${formatPrice(amount)} Securely`}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* ShopIndia Trust Badges Footer */}
              <div className="flex items-center justify-center gap-3 pt-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Lock size={11} />
                  <span>256-bit Encryption</span>
                </span>
                <span>•</span>
                <span>RBI Compliant</span>
                <span>•</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">ShopIndia Direct Secure Pay</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RazorpayModal;

