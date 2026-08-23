import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addToCart, removeFromCart, clearCart } from '../store/slices/CartSlice';
import { formatPrice } from "../utils/priceFormatter";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../services/firebase"; 
import { placeOrderInDB } from "../services/productservices";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import notify from '../components/ui/LuxuryToast';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Wallet, 
  ShieldCheck, 
  Truck,
  CheckCircle2,
  Split,
  Sparkles,
  Info
} from "lucide-react";

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const totalAmount = useSelector((state) => state.cart.totalAmount);
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card', 'upi', 'wallet', 'split', 'cod'
  const [placedOrderInfo, setPlacedOrderInfo] = useState(null);
  const [shippingData, setShippingData] = useState({ name: "", address: "", pincode: "" });
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [upiId, setUpiId] = useState("");

  // Split Payment Allocations
  const [splitAmounts, setSplitAmounts] = useState({
    wallet: 0,
    upi: 0,
    card: 0,
    cod: 0
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().wallet) {
            const bal = userSnap.data().wallet.balance || 0;
            setWalletBalance(bal);
          }
        } catch (err) {
          console.error("Failed to fetch wallet balance:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // When totalAmount or split method changes, auto-fill default split recommendation
  useEffect(() => {
    if (paymentMethod === "split") {
      const walletPortion = Math.min(walletBalance, totalAmount);
      const remaining = Math.max(0, totalAmount - walletPortion);
      setSplitAmounts({
        wallet: walletPortion,
        upi: remaining,
        card: 0,
        cod: 0
      });
    }
  }, [paymentMethod, totalAmount, walletBalance]);

  const allocatedTotal = 
    Number(splitAmounts.wallet || 0) + 
    Number(splitAmounts.upi || 0) + 
    Number(splitAmounts.card || 0) + 
    Number(splitAmounts.cod || 0);

  const remainingToAllocate = totalAmount - allocatedTotal;

  const handleSplitPreset = (type) => {
    if (type === "wallet-upi") {
      const w = Math.min(walletBalance, totalAmount);
      setSplitAmounts({ wallet: w, upi: totalAmount - w, card: 0, cod: 0 });
    } else if (type === "wallet-card") {
      const w = Math.min(walletBalance, totalAmount);
      setSplitAmounts({ wallet: w, upi: 0, card: totalAmount - w, cod: 0 });
    } else if (type === "upi-card-equal") {
      const half = Math.floor(totalAmount / 2);
      setSplitAmounts({ wallet: 0, upi: half, card: totalAmount - half, cod: 0 });
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      notify.error("Cart is Empty", "Add items to your cart before proceeding to checkout.");
      return;
    }

    if (!currentUser) {
      notify.error("Login Required", "Please log in to your account to place an order.");
      navigate('/login');
      return;
    }

    if (!shippingData.name || !shippingData.address || !shippingData.pincode) {
      notify.error("Incomplete Address", "Please fill in all shipping details.");
      return;
    }

    // Validation for Single vs Split
    if (paymentMethod === "card") {
      if (!cardDetails.number || cardDetails.number.length < 16 || !cardDetails.expiry || !cardDetails.cvv) {
        notify.error("Invalid Card Details", "Please enter a valid 16-digit card number, expiry, and CVV.");
        return;
      }
    }

    if (paymentMethod === "upi") {
      if (!upiId || !upiId.includes("@")) {
        notify.error("Invalid UPI ID", "Please enter a valid UPI ID (e.g. username@okhdfcbank).");
        return;
      }
    }

    if (paymentMethod === "wallet") {
      if (walletBalance < totalAmount) {
        notify.error("Insufficient Wallet Balance", `You need ₹${formatPrice(totalAmount - walletBalance)} more in your wallet.`);
        return;
      }
    }

    if (paymentMethod === "split") {
      if (Math.abs(remainingToAllocate) > 0.01) {
        notify.error("Split Amount Mismatch", `Total allocated amount must equal ₹${formatPrice(totalAmount)}. Remaining: ₹${formatPrice(remainingToAllocate)}`);
        return;
      }
      if (splitAmounts.wallet > walletBalance) {
        notify.error("Wallet Limit Exceeded", `You only have ₹${formatPrice(walletBalance)} available in wallet.`);
        return;
      }
      if (splitAmounts.card > 0) {
        if (!cardDetails.number || cardDetails.number.length < 16 || !cardDetails.expiry || !cardDetails.cvv) {
          notify.error("Card Details Required", `Please provide card details for the ₹${formatPrice(splitAmounts.card)} split portion.`);
          return;
        }
      }
      if (splitAmounts.upi > 0) {
        if (!upiId || !upiId.includes("@")) {
          notify.error("UPI ID Required", `Please provide a valid UPI ID for the ₹${formatPrice(splitAmounts.upi)} split portion.`);
          return;
        }
      }
    }

    setIsProcessing(true);

    setTimeout(async () => {
      // 1. Process Wallet Deduction (for 100% wallet or split wallet portion)
      let walletDeductAmount = 0;
      if (paymentMethod === "wallet") {
        walletDeductAmount = totalAmount;
      } else if (paymentMethod === "split" && splitAmounts.wallet > 0) {
        walletDeductAmount = Number(splitAmounts.wallet);
      }

      if (walletDeductAmount > 0) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          const wallet = (userSnap.exists() && userSnap.data().wallet) || { balance: 0, transactions: [] };
          if ((wallet.balance || 0) < walletDeductAmount) {
            notify.error("Insufficient Balance", "Your ShopIndia wallet has insufficient funds.");
            setIsProcessing(false);
            return;
          }
          
          const newBal = (wallet.balance || 0) - walletDeductAmount;
          const debitTx = {
            type: "debit",
            amount: walletDeductAmount,
            note: paymentMethod === 'split' ? `Order Split Payment (${new Date().toLocaleDateString()})` : `Order Payment (${new Date().toLocaleDateString()})`,
            date: new Date().toISOString()
          };

          await updateDoc(userRef, { 
            "wallet.balance": newBal,
            "wallet.transactions": arrayUnion(debitTx)
          });
        } catch (err) {
          console.error("Wallet deduction failed:", err);
          notify.error("Payment Failed", "Could not process wallet deduction.");
          setIsProcessing(false);
          return;
        }
      }

      // 2. Build Final Order Document
      const newOrder = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: cartItems,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        paymentBreakdown: paymentMethod === 'split' ? { ...splitAmounts } : null,
        status: "Pending ⏳", 
        date: new Date().toISOString(),
        shipping: {
          name: shippingData.name,
          address: shippingData.address,
          pincode: shippingData.pincode,
          email: currentUser.email
        },
      };

      const orderId = await placeOrderInDB(newOrder); 
      
      if (orderId) {
        setCreatedOrderId(orderId);
        setPlacedOrderInfo({
          orderId,
          paymentMethod,
          paymentBreakdown: paymentMethod === 'split' ? { ...splitAmounts } : null,
          items: cartItems,
          totalAmount,
          shipping: { ...shippingData },
          createdAt: new Date().toLocaleString(),
        });
      }

      dispatch(clearCart()); 
      setShippingData({ name: "", address: "", pincode: "" });
      setIsProcessing(false);
      setOrderSuccess(true);
      notify.success("Order Placed Successfully! 🎉", `Order #${orderId ? orderId.slice(0,6) : ''} confirmed.`);

      setTimeout(() => {
        navigate('/profile'); 
      }, 3500); 

    }, 1200); 
  };

  if (orderSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center py-10 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20 animate-bounce">
          🎉
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-4 mb-1">Order Placed Successfully!</h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-md">
          Your payment was verified. An assigned delivery partner will dispatch your package shortly.
        </p>

        <div className="mt-6 w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 text-left shadow-md space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800 text-xs">
            <span className="text-gray-500 dark:text-slate-400">Order ID:</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white">{createdOrderId}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800 text-xs">
            <span className="text-gray-500 dark:text-slate-400">Total Paid:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₹{formatPrice(placedOrderInfo?.totalAmount || 0)}</span>
          </div>

          {placedOrderInfo?.paymentMethod === 'split' && placedOrderInfo?.paymentBreakdown && (
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">Multi-Payment Split Details:</span>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {placedOrderInfo.paymentBreakdown.wallet > 0 && <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded font-semibold text-gray-800 dark:text-white">Wallet: ₹{formatPrice(placedOrderInfo.paymentBreakdown.wallet)}</span>}
                {placedOrderInfo.paymentBreakdown.upi > 0 && <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded font-semibold text-gray-800 dark:text-white">UPI: ₹{formatPrice(placedOrderInfo.paymentBreakdown.upi)}</span>}
                {placedOrderInfo.paymentBreakdown.card > 0 && <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded font-semibold text-gray-800 dark:text-white">Card: ₹{formatPrice(placedOrderInfo.paymentBreakdown.card)}</span>}
                {placedOrderInfo.paymentBreakdown.cod > 0 && <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded font-semibold text-gray-800 dark:text-white">COD: ₹{formatPrice(placedOrderInfo.paymentBreakdown.cod)}</span>}
              </div>
            </div>
          )}

          <div className="text-xs">
            <span className="text-gray-500 dark:text-slate-400 block mb-1">Deliver To:</span>
            <p className="font-bold text-gray-900 dark:text-white">{placedOrderInfo?.shipping?.name}</p>
            <p className="text-gray-600 dark:text-slate-300">{placedOrderInfo?.shipping?.address} - PIN {placedOrderInfo?.shipping?.pincode}</p>
          </div>
        </div>

        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-6 animate-pulse">
          Redirecting to Orders in a moment... 🚀
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-12 transition-colors duration-300">
      
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-800 pb-3 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
          <ShoppingCart size={22} className="text-emerald-500" />
          <span>Shopping Cart ({totalQuantity})</span>
        </h1>
        {cartItems.length > 0 && (
          <button 
            onClick={() => dispatch(clearCart())}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-7 space-y-3">
          {cartItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
              <span className="text-5xl block mb-3 opacity-60">🛍️</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Cart is Empty</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-5">Looks like you haven't added any items yet.</p>
              <button 
                onClick={() => navigate('/')}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Explore Top Deals
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 bg-white dark:bg-slate-850 rounded-xl p-1.5 shrink-0 border border-gray-100 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                    <img src={item.image || item.thumbnail} alt={item.title} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">{item.title}</h3>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">₹{formatPrice(item.price)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-1">
                    <button 
                      onClick={() => dispatch(removeFromCart(item.id))} 
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white flex items-center justify-center font-bold text-xs shadow-sm hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-7 text-center font-black text-xs text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => dispatch(addToCart(item))} 
                      disabled={item.stock > 0 && item.quantity >= item.stock}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-white flex items-center justify-center font-bold text-xs shadow-sm hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Checkout & Summary */}
        {cartItems.length > 0 && (
          <div className="lg:col-span-5 bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2.5">
              Order Summary & Shipping
            </h3>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              
              {/* Address Form */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Delivery Details</label>
                <input 
                  type="text" 
                  name="name"
                  value={shippingData.name}
                  onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                  placeholder="Full Name of Recipient" 
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500" 
                  required 
                />
                <textarea 
                  name="address"
                  value={shippingData.address}
                  onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                  placeholder="Street, Building, Landmark..." 
                  rows="2"
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500 resize-none" 
                  required 
                ></textarea>
                <input 
                  type="text" 
                  name="pincode"
                  value={shippingData.pincode}
                  onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                  placeholder="6-Digit Postal PIN" 
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500" 
                  required 
                />
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Payment Option</label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% Safe & Encrypted</span>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: "card", label: "Card" },
                    { id: "upi", label: "UPI" },
                    { id: "wallet", label: "Wallet" },
                    { id: "split", label: "⚡ Split" },
                    { id: "cod", label: "COD" }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        paymentMethod === m.id 
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-md" 
                          : "bg-slate-50 dark:bg-slate-850 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* ================= MULTI-METHOD SPLIT PAYMENT UI ================= */}
                {paymentMethod === "split" && (
                  <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-emerald-500/40 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <Split size={15} />
                        <span>Multi-Payment Split Allocation</span>
                      </div>
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                        Math.abs(remainingToAllocate) < 0.01 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-amber-500 text-slate-950'
                      }`}>
                        {Math.abs(remainingToAllocate) < 0.01 ? '✓ Balanced' : `Remaining: ₹${formatPrice(remainingToAllocate)}`}
                      </span>
                    </div>

                    {/* Quick Split Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSplitPreset("wallet-upi")}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] font-bold text-gray-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                      >
                        Wallet (₹{formatPrice(Math.min(walletBalance, totalAmount))}) + UPI
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSplitPreset("wallet-card")}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] font-bold text-gray-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                      >
                        Wallet + Card
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSplitPreset("upi-card-equal")}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] font-bold text-gray-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                      >
                        50% UPI + 50% Card
                      </button>
                    </div>

                    {/* Split Sliders / Inputs */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      
                      {/* Wallet Input */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-750 space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 dark:text-slate-400">
                          <span>Wallet (Max ₹{formatPrice(walletBalance)}):</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={splitAmounts.wallet}
                            max={walletBalance}
                            onChange={(e) => setSplitAmounts({ ...splitAmounts, wallet: Math.min(walletBalance, Number(e.target.value) || 0) })}
                            className="w-full bg-transparent font-bold text-gray-900 dark:text-white outline-none"
                          />
                        </div>
                      </div>

                      {/* UPI Input */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-750 space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 dark:text-slate-400">
                          <span>UPI / QR:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={splitAmounts.upi}
                            onChange={(e) => setSplitAmounts({ ...splitAmounts, upi: Number(e.target.value) || 0 })}
                            className="w-full bg-transparent font-bold text-gray-900 dark:text-white outline-none"
                          />
                        </div>
                      </div>

                      {/* Card Input */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-750 space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 dark:text-slate-400">
                          <span>Card Amount:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={splitAmounts.card}
                            onChange={(e) => setSplitAmounts({ ...splitAmounts, card: Number(e.target.value) || 0 })}
                            className="w-full bg-transparent font-bold text-gray-900 dark:text-white outline-none"
                          />
                        </div>
                      </div>

                      {/* COD Input */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-750 space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 dark:text-slate-400">
                          <span>COD on Delivery:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={splitAmounts.cod}
                            onChange={(e) => setSplitAmounts({ ...splitAmounts, cod: Number(e.target.value) || 0 })}
                            className="w-full bg-transparent font-bold text-gray-900 dark:text-white outline-none"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Card Fields (If Card or Split with Card > 0) */}
                {(paymentMethod === "card" || (paymentMethod === "split" && splitAmounts.card > 0)) && (
                  <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2">
                    <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase">Card Credentials</p>
                    <input 
                      type="text" 
                      maxLength="19"
                      placeholder="Card Number (4242 4242 ...)" 
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-2 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        maxLength="5"
                        placeholder="MM/YY" 
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        className="w-1/2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-2 rounded-lg text-xs text-gray-900 dark:text-white outline-none"
                      />
                      <input 
                        type="password" 
                        maxLength="4"
                        placeholder="CVV" 
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        className="w-1/2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-2 rounded-lg text-xs text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* UPI Fields (If UPI or Split with UPI > 0) */}
                {(paymentMethod === "upi" || (paymentMethod === "split" && splitAmounts.upi > 0)) && (
                  <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2 text-center">
                    <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase text-left">UPI Identifier</p>
                    <input 
                      type="text" 
                      placeholder="Enter UPI ID (e.g. yourname@oksbi)" 
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-2.5 rounded-lg text-xs text-gray-900 dark:text-white outline-none text-center font-semibold"
                    />
                  </div>
                )}

                {/* Wallet Info */}
                {paymentMethod === "wallet" && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Available Wallet Balance:</span>
                      <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₹{formatPrice(walletBalance)}</p>
                    </div>
                    {walletBalance < totalAmount && (
                      <span className="text-rose-500 font-bold text-[11px]">Short of ₹{formatPrice(totalAmount - walletBalance)}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Price Calculation */}
              <div className="border-t border-gray-100 dark:border-slate-800 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500 dark:text-slate-400">
                  <span>Subtotal ({totalQuantity} items):</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-slate-400">
                  <span>Standard Delivery:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-slate-800">
                  <span>Total Payable:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-base">₹{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? "Processing Order... ⏳" : `Confirm & Pay ₹${formatPrice(totalAmount)}`}
              </button>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Cart;