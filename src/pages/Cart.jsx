import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addToCart, removeFromCart, clearCart } from '../store/slices/CartSlice';
import { formatPrice } from "../utils/priceFormatter";
import { useNavigate } from "react-router-dom";

// Firebase and Service Imports
import { auth, db } from "../services/firebase"; 
import { placeOrderInDB } from "../services/productservices";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const totalAmount = useSelector((state) => state.cart.totalAmount);
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Component States
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [placedOrderInfo, setPlacedOrderInfo] = useState(null);
  const [shippingData, setShippingData] = useState({ name: "", address: "", pincode: "" });
  
  // Wallet Balance & Payment Details States
  const [walletBalance, setWalletBalance] = useState(0);
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [upiId, setUpiId] = useState("");

  // Authenticate current user on mount and fetch wallet balance
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().wallet) {
            setWalletBalance(userSnap.data().wallet.balance || 0);
          }
        } catch (err) {
          console.error("Failed to fetch wallet balance:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) return alert("Cart is empty!");

    if (!currentUser) {
      alert("Please login to place an order!");
      navigate('/login');
      return;
    }

    if (!shippingData.name || !shippingData.address || !shippingData.pincode) {
      alert("Please enter complete shipping details before placing your order.");
      return;
    }

    // Validation for Card Payment
    if (paymentMethod === "card") {
      if (!cardDetails.number || cardDetails.number.length < 16 || !cardDetails.expiry || !cardDetails.cvv) {
        alert("Please enter valid card details (16-digit card number, expiry, and CVV).");
        return;
      }
    }

    // Validation for UPI Payment
    if (paymentMethod === "upi") {
      if (!upiId || !upiId.includes("@")) {
        alert("Please enter a valid UPI ID (e.g., username@okhdfcbank).");
        return;
      }
    }

    setIsProcessing(true);

    setTimeout(async () => {
      if (paymentMethod === "wallet") {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          const wallet = (userSnap.exists() && userSnap.data().wallet) || { balance: 0 };
          if ((wallet.balance || 0) < totalAmount) {
            alert("Insufficient wallet balance. Please choose another payment method or top-up your wallet.");
            setIsProcessing(false);
            return;
          }
          await updateDoc(userRef, { "wallet.balance": (wallet.balance || 0) - totalAmount });
          try {
            const { addWalletTransaction } = await import("../services/walletService");
            await addWalletTransaction(currentUser.uid, { type: "debit", amount: totalAmount, note: `Order Payment (${new Date().toLocaleDateString()})`, meta: { orderAutoRecord: true } });
          } catch (err) {
            console.warn("Failed to record wallet transaction:", err);
          }
        } catch (err) {
          console.error("Wallet deduction failed:", err);
          alert("Failed to process wallet payment. Please try again.");
          setIsProcessing(false);
          return;
        }
      }

      const newOrder = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: cartItems,
        totalAmount: totalAmount,
        paymentMethod,
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

      setTimeout(() => {
        navigate('/profile'); 
      }, 5000); 

    }, 2000); 
  };

  // Render Order Success Screen
  if (orderSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in px-4 text-center mt-10">
        <div className="w-28 h-28 bg-emerald-500/20 border-4 border-emerald-500 rounded-full flex items-center justify-center text-6xl animate-pulse shadow-[0_0_60px_rgba(16,185,129,0.4)]">
          🎉
        </div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white mt-8 mb-2">Order Confirmed!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl">
          Your payment was successful and the order has been placed.
          It will be assigned to a delivery partner shortly.
        </p>

        <div className="mt-10 w-full max-w-3xl bg-white dark:bg-[#0a0f16]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[2rem] p-8 text-left shadow-2xl transition-colors">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><span>🧾</span> Official Receipt</h3>
          <div className="grid gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5">
              <span>Order ID</span><span className="text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">{createdOrderId}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5">
              <span>Payment Method</span>
              <span className="text-gray-900 dark:text-white font-semibold uppercase tracking-wider">
                {placedOrderInfo?.paymentMethod === 'card' ? 'Credit / Debit Card' : placedOrderInfo?.paymentMethod === 'upi' ? 'UPI Payment' : placedOrderInfo?.paymentMethod === 'wallet' ? 'Wallet Balance' : 'Cash on Delivery'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5">
              <span>Amount Paid</span><span className="text-emerald-600 dark:text-emerald-400 font-black text-lg">₹ {formatPrice(placedOrderInfo?.totalAmount || 0)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5">
              <span>Order Date</span><span className="text-gray-500 dark:text-white/80">{placedOrderInfo?.createdAt}</span>
            </div>
            
            <div className="pt-4 mt-2">
              <p className="text-gray-900 dark:text-white font-bold mb-3 uppercase tracking-widest text-xs text-gray-500">Shipping Details</p>
              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-200 dark:border-white/5">
                <p className="text-gray-900 dark:text-white font-semibold text-base">{placedOrderInfo?.shipping?.name}</p>
                <p className="mt-1 text-gray-600 dark:text-gray-300">{placedOrderInfo?.shipping?.address}</p>
                <p className="text-gray-600 dark:text-gray-300">PIN: {placedOrderInfo?.shipping?.pincode}</p>
                <p className="mt-1 text-emerald-600 dark:text-emerald-400/80">{currentUser?.email}</p>
              </div>
            </div>
            
            <div className="pt-4">
              <p className="text-gray-900 dark:text-white font-bold mb-3 uppercase tracking-widest text-xs text-gray-500">Purchased Items</p>
              <div className="space-y-3">
                {placedOrderInfo?.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-200 dark:border-white/5">
                    <span className="font-medium text-gray-700 dark:text-gray-200"><span className="text-emerald-600 dark:text-emerald-400 font-bold mr-2">{item.quantity}×</span> {item.title}</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹ {formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-emerald-600 dark:text-emerald-400 mt-8 font-bold animate-pulse">Redirecting to your orders page... 🚀</p>
      </div>
    );
  }

  // Render Cart View
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 relative transition-colors duration-500">
      <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-10 tracking-tight uppercase">
        Your Cart <span className="text-emerald-500 dark:text-emerald-400">🛒</span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* LEFT PANEL: Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.length === 0 ? (
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-20 text-center shadow-xl">
              <span className="text-6xl block mb-6">🛍️</span>
              <p className="text-gray-600 dark:text-white/60 text-2xl font-bold mb-8">Your Cart is empty</p>
              <button 
                onClick={() => navigate('/')}
                className="bg-emerald-500 text-white font-bold px-10 py-4 rounded-xl hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 transition-all"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="bg-white dark:bg-black/35 backdrop-blur-xl p-5 md:p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 border border-gray-200 dark:border-white/5 hover:border-emerald-500/30 transition-all shadow-sm dark:shadow-lg group">
                <div className="w-28 h-28 bg-gray-50 dark:bg-white rounded-2xl p-3 flex-shrink-0 border border-gray-200 dark:border-gray-700 shadow-inner overflow-hidden flex items-center justify-center">
                  <img src={item.image || item.thumbnail} alt={item.title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                  <p className="text-emerald-600 dark:text-emerald-400 font-black text-xl mt-2">₹ {formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-4 bg-gray-100 dark:bg-white/5 p-2 rounded-2xl border border-gray-200 dark:border-white/10">
                  <button onClick={() => dispatch(removeFromCart(item.id))} className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 hover:bg-rose-500 hover:text-white text-gray-700 dark:text-gray-300 font-black text-xl transition-colors shadow-sm">−</button>
                  <span className="text-gray-900 dark:text-white font-black text-lg w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => dispatch(addToCart(item))}
                    disabled={item.stock > 0 && item.quantity >= item.stock}
                    className={`w-10 h-10 rounded-xl bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 font-black text-xl transition-colors shadow-sm ${item.stock > 0 && item.quantity >= item.stock ? 'opacity-40 cursor-not-allowed' : 'hover:bg-emerald-500 hover:text-white'}`}
                  >
                    +
                  </button>
                </div>
                <div className="text-right hidden sm:block w-24">
                  <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">Subtotal</p>
                  <p className="text-gray-900 dark:text-white font-black text-lg">₹ {formatPrice(item.totalPrice)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT PANEL: Order Summary & Checkout Form */}
        {cartItems.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#111827]/90 backdrop-blur-2xl p-8 rounded-[2rem] border border-gray-200 dark:border-emerald-500/20 shadow-xl dark:shadow-2xl sticky top-24 transition-colors">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-white/10 pb-4">Order Summary</h3>
              
              <form className="space-y-6" onSubmit={handlePlaceOrder}>
                {/* Shipping Details Input */}
                <div className="space-y-4">
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs uppercase font-black tracking-widest">Delivery Address</p>
                  <input 
                    type="text" 
                    name="name"
                    value={shippingData.name}
                    onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                    placeholder="Recipient Full Name" 
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-gray-700 p-4 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition shadow-sm" 
                    required 
                  />
                  <textarea 
                    name="address"
                    value={shippingData.address}
                    onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                    placeholder="House No., Street, Area, Landmark" 
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-gray-700 p-4 rounded-xl text-gray-900 dark:text-white h-24 outline-none focus:border-emerald-500 transition resize-none shadow-sm" 
                    required 
                  ></textarea>
                  <input 
                    type="text" 
                    name="pincode"
                    value={shippingData.pincode}
                    onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                    placeholder="6-Digit Pincode" 
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-gray-700 p-4 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition shadow-sm" 
                    required 
                  />
                </div>

                {/* Payment Options Selection */}
                <div className="space-y-4 pt-2">
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs uppercase font-black tracking-widest">Payment Method</p>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`rounded-xl px-2 py-3 text-sm font-bold border transition-all ${paymentMethod === "card" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-white shadow-inner" : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black/30 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}
                    >
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`rounded-xl px-2 py-3 text-sm font-bold border transition-all ${paymentMethod === "upi" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-white shadow-inner" : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black/30 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}
                    >
                      UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`rounded-xl px-2 py-3 text-sm font-bold border transition-all ${paymentMethod === "cod" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-white shadow-inner" : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black/30 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}
                    >
                      C.O.D
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("wallet")}
                      className={`rounded-xl px-2 py-3 text-sm font-bold border transition-all ${paymentMethod === "wallet" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-white shadow-inner" : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black/30 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}
                    >
                      Wallet
                    </button>
                  </div>

                  {/* DYNAMIC PAYMENT EXPANSION FIELDS */}
                  {paymentMethod === "card" && (
                    <div className="bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-gray-200 dark:border-white/10 space-y-3 animate-fade-in">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Enter Card Details</p>
                      <input 
                        type="text" 
                        maxLength="19"
                        placeholder="Card Number (4242 4242 ...)" 
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-gray-700 p-3 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:border-emerald-500"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          maxLength="5"
                          placeholder="MM/YY" 
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          className="w-1/2 bg-white dark:bg-black/50 border border-gray-300 dark:border-gray-700 p-3 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:border-emerald-500"
                        />
                        <input 
                          type="password" 
                          maxLength="4"
                          placeholder="CVV" 
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          className="w-1/2 bg-white dark:bg-black/50 border border-gray-300 dark:border-gray-700 p-3 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <div className="bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-gray-200 dark:border-white/10 space-y-3 text-center animate-fade-in">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Scan QR or Enter UPI ID</p>
                      <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl shadow-inner flex items-center justify-center border">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=shopindia@ybl&am=${totalAmount}&pn=ShopIndia`} 
                          alt="UPI QR Code" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Enter UPI ID (e.g. name@paytm)" 
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-gray-700 p-3 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:border-emerald-500 text-center"
                      />
                    </div>
                  )}

                  {paymentMethod === "wallet" && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 flex justify-between items-center animate-fade-in">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Available Wallet</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹ {formatPrice(walletBalance)}</p>
                      </div>
                      {walletBalance < totalAmount && (
                        <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded border border-rose-200 dark:border-rose-500/20">Short of ₹{formatPrice(totalAmount - walletBalance)}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Pricing Totals calculation */}
                <div className="pt-6 border-t border-gray-100 dark:border-white/10 space-y-4">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400 font-medium">
                    <span>Items ({totalQuantity}):</span>
                    <span className="text-gray-900 dark:text-white">₹ {formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400 font-medium">
                    <span>Delivery Fee:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black uppercase text-sm tracking-wide bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-900 dark:text-white font-black text-3xl pt-4 border-t border-gray-100 dark:border-white/5">
                    <span>Total:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">₹ {formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {/* Checkout Submission Button */}
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full font-black py-4 text-lg rounded-xl uppercase tracking-widest mt-6 transition-all shadow-xl flex justify-center items-center gap-3 ${
                    isProcessing 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-95'
                  }`}
                >
                  {isProcessing ? "Processing... ⏳" : `Pay ₹${formatPrice(totalAmount)}`}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;