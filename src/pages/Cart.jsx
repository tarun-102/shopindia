import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addToCart, removeFromCart, clearCart } from '../store/slices/CartSlice';
import GlassCard from "../components/ui/GlassCard"; 
import { formatPrice } from "../utils/priceFormatter";
import { useNavigate } from "react-router-dom";

// Firebase and Service Imports
import { auth } from "../services/firebase"; 
import { placeOrderInDB } from "../services/productservices";
import { onAuthStateChanged } from "firebase/auth";

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

  // Authenticate current user on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Handles the order placement process, validates user session and input,
   * and dispatches the order to the database with a Pending status.
   */
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

    setIsProcessing(true);

    // Simulated processing delay for UI experience
    setTimeout(async () => {
      // Construct the order object with Pending status for the 40-second window
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

      // Save order to Firestore
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

      // Reset cart and form states
      dispatch(clearCart()); 
      setShippingData({ name: "", address: "", pincode: "" });
      setIsProcessing(false);
      setOrderSuccess(true);

      // Auto-redirect to user profile/orders after success
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
        <h2 className="text-4xl font-black text-white mt-8 mb-2">Order Confirmed!</h2>
        <p className="text-gray-400 text-lg max-w-xl">
          Your payment was successful and the order has been placed.
          It will be assigned to a delivery partner shortly.
        </p>

        <div className="mt-10 w-full max-w-3xl bg-[#0a0f16]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-left shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><span>🧾</span> Official Receipt</h3>
          <div className="grid gap-4 text-sm text-gray-300">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span>Order ID</span><span className="text-white font-mono bg-white/5 px-3 py-1 rounded-lg">{createdOrderId}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span>Payment Method</span><span className="text-white font-semibold uppercase tracking-wider">{placedOrderInfo?.paymentMethod === 'card' ? 'Credit / Debit Card' : placedOrderInfo?.paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span>Amount Paid</span><span className="text-emerald-400 font-black text-lg">₹ {formatPrice(placedOrderInfo?.totalAmount || 0)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span>Order Date</span><span className="text-white/80">{placedOrderInfo?.createdAt}</span>
            </div>
            
            <div className="pt-4 mt-2">
              <p className="text-white font-bold mb-3 uppercase tracking-widest text-xs text-gray-500">Shipping Details</p>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-white font-semibold text-base">{placedOrderInfo?.shipping?.name}</p>
                <p className="mt-1">{placedOrderInfo?.shipping?.address}</p>
                <p>PIN: {placedOrderInfo?.shipping?.pincode}</p>
                <p className="mt-1 text-emerald-400/80">{currentUser?.email}</p>
              </div>
            </div>
            
            <div className="pt-4">
              <p className="text-white font-bold mb-3 uppercase tracking-widest text-xs text-gray-500">Purchased Items</p>
              <div className="space-y-3">
                {placedOrderInfo?.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="font-medium text-gray-200"><span className="text-emerald-400 font-bold mr-2">{item.quantity}×</span> {item.title}</span>
                    <span className="font-bold text-white">₹ {formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-emerald-400 mt-8 font-bold animate-pulse">Redirecting to your orders page... 🚀</p>
      </div>
    );
  }

  // Render Cart View
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 relative">
      <h2 className="text-3xl md:text-4xl font-black text-white mb-10 tracking-tight uppercase">
        Your Cart <span className="text-emerald-400">🛒</span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* LEFT PANEL: Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-20 text-center shadow-xl">
              <span className="text-6xl block mb-6">🛍️</span>
              <p className="text-white/60 text-2xl font-bold mb-8">Your Cart is empty</p>
              <button 
                onClick={() => navigate('/')}
                className="bg-emerald-500 text-white font-bold px-10 py-4 rounded-xl hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 transition-all"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="bg-black/30 backdrop-blur-xl p-5 md:p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 border border-white/5 hover:border-emerald-500/30 transition-all shadow-lg group">
                <div className="w-28 h-28 bg-white rounded-2xl p-3 flex-shrink-0 border border-gray-700 shadow-inner overflow-hidden flex items-center justify-center">
                  <img src={item.image || item.thumbnail} alt={item.title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-white font-bold text-lg line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                  <p className="text-emerald-400 font-black text-xl mt-2">₹ {formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                  <button onClick={() => dispatch(removeFromCart(item.id))} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500/80 hover:text-white text-gray-300 font-black text-xl transition-colors">−</button>
                  <span className="text-white font-black text-lg w-6 text-center">{item.quantity}</span>
                  <button onClick={() => dispatch(addToCart(item))} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-emerald-500/80 hover:text-white text-gray-300 font-black text-xl transition-colors">+</button>
                </div>
                <div className="text-right hidden sm:block w-24">
                  <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-1">Subtotal</p>
                  <p className="text-white font-black text-lg">₹ {formatPrice(item.totalPrice)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT PANEL: Order Summary & Checkout Form */}
        {cartItems.length > 0 && (
          <div className="space-y-6">
            <div className="bg-[#111827]/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-emerald-500/20 shadow-2xl sticky top-24">
              <h3 className="text-2xl font-black text-white mb-8 border-b border-white/10 pb-4">Order Summary</h3>
              
              <form className="space-y-6" onSubmit={handlePlaceOrder}>
                {/* Shipping Details Input */}
                <div className="space-y-4">
                  <p className="text-emerald-400 text-xs uppercase font-black tracking-widest">Delivery Address</p>
                  <input 
                    type="text" 
                    name="name"
                    value={shippingData.name}
                    onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                    placeholder="Recipient Full Name" 
                    className="w-full bg-black/40 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" 
                    required 
                  />
                  <textarea 
                    name="address"
                    value={shippingData.address}
                    onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                    placeholder="House No., Street, Area, Landmark" 
                    className="w-full bg-black/40 border border-gray-700 p-4 rounded-xl text-white h-24 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none" 
                    required 
                  ></textarea>
                  <input 
                    type="text" 
                    name="pincode"
                    value={shippingData.pincode}
                    onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                    placeholder="6-Digit Pincode" 
                    className="w-full bg-black/40 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" 
                    required 
                  />
                </div>

                {/* Payment Options Selection */}
                <div className="space-y-4 pt-2">
                  <p className="text-emerald-400 text-xs uppercase font-black tracking-widest">Payment Method</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`rounded-xl px-2 py-3 text-sm font-bold border transition-all ${paymentMethod === "card" ? "border-emerald-500 bg-emerald-500/20 text-white shadow-inner" : "border-gray-700 bg-black/30 text-gray-400 hover:bg-white/5"}`}
                    >
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`rounded-xl px-2 py-3 text-sm font-bold border transition-all ${paymentMethod === "upi" ? "border-emerald-500 bg-emerald-500/20 text-white shadow-inner" : "border-gray-700 bg-black/30 text-gray-400 hover:bg-white/5"}`}
                    >
                      UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`rounded-xl px-2 py-3 text-sm font-bold border transition-all ${paymentMethod === "cod" ? "border-emerald-500 bg-emerald-500/20 text-white shadow-inner" : "border-gray-700 bg-black/30 text-gray-400 hover:bg-white/5"}`}
                    >
                      C.O.D
                    </button>
                  </div>
                </div>

                {/* Pricing Totals calculation */}
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex justify-between text-gray-400 font-medium">
                    <span>Items ({totalQuantity}):</span>
                    <span className="text-white">₹ {formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-medium">
                    <span>Delivery Fee:</span>
                    <span className="text-emerald-400 font-black uppercase text-sm tracking-wide bg-emerald-500/10 px-2 py-0.5 rounded">Free</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-3xl pt-4 border-t border-white/5">
                    <span>Total:</span>
                    <span className="text-emerald-400">₹ {formatPrice(totalAmount)}</span>
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