import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addToCart, removeFromCart, clearCart } from '../store/slices/CartSlice';
import GlassCard from "../components/ui/GlassCard";
import { formatPrice } from "../utils/priceFormatter";
import { useNavigate } from "react-router-dom";

// Firebase imports
import { auth } from "../services/firebase"; 
import { placeOrderInDB } from "../services/productservices";
import { onAuthStateChanged } from "firebase/auth";

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const totalAmount = useSelector((state) => state.cart.totalAmount);
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [placedOrderInfo, setPlacedOrderInfo] = useState(null);
  const [shippingData, setShippingData] = useState({ name: "", address: "", pincode: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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

    setIsProcessing(true);

    setTimeout(async () => {
      const newOrder = {
        userId: currentUser.uid,
        items: cartItems,
        totalAmount: totalAmount,
        paymentMethod,
        status: "Pending ⏳", // 🔥 Naya order "Pending ⏳" status ke sath save hoga taaki 1-minute cancel window aur delivery boy request work kare
        date: new Date().toISOString(),
        shipping: {
          name: shippingData.name,
          address: shippingData.address,
          pincode: shippingData.pincode,
        },
      };

      const orderId = await placeOrderInDB(newOrder); // Database save
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

      dispatch(clearCart()); // Cart clear
      setShippingData({ name: "", address: "", pincode: "" });
      setIsProcessing(false);
      setOrderSuccess(true);

      setTimeout(() => {
        navigate('/profile'); 
      }, 5000); 

    }, 2000); 
  };

  if (orderSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in px-4 text-center">
        <div className="w-28 h-28 bg-green-500/95 rounded-full flex items-center justify-center text-6xl animate-pulse shadow-[0_0_60px_rgba(16,185,129,0.45)]">
          🎉
        </div>
        <h2 className="text-4xl font-black text-white mt-8 mb-2">Order Confirmed!</h2>
        <p className="text-gray-300 text-lg max-w-xl">
          Your payment was successful and the order has been placed.
          We are now preparing it for delivery.
        </p>

        <div className="mt-10 w-full max-w-3xl bg-black/50 border border-white/10 rounded-3xl p-8 text-left shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-4">Receipt</h3>
          <div className="grid gap-3 text-sm text-gray-300">
            <div className="flex justify-between"><span>Order ID</span><span className="text-white font-semibold">{createdOrderId}</span></div>
            <div className="flex justify-between"><span>Payment Method</span><span className="text-white font-semibold">{placedOrderInfo?.paymentMethod === 'card' ? 'Credit / Debit Card' : placedOrderInfo?.paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}</span></div>
            <div className="flex justify-between"><span>Amount Paid</span><span className="text-green-400 font-bold">₹ {formatPrice(placedOrderInfo?.totalAmount || 0)}</span></div>
            <div className="flex justify-between"><span>Order Date</span><span className="text-white/80">{placedOrderInfo?.createdAt}</span></div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-white font-semibold mb-2">Shipping Address</p>
              <p>{placedOrderInfo?.shipping?.name}</p>
              <p>{placedOrderInfo?.shipping?.address}</p>
              <p>PIN: {placedOrderInfo?.shipping?.pincode}</p>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-white font-semibold mb-2">Items</p>
              <div className="space-y-2">
                {placedOrderInfo?.items?.map((item) => (
                  <div key={item.id} className="flex justify-between bg-white/5 p-3 rounded-2xl">
                    <span>{item.quantity}× {item.title}</span>
                    <span className="font-semibold">₹ {formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-yellow-400 mt-6 font-semibold">Redirecting to your orders page... 🚀</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 relative">
      <h2 className="text-4xl font-black text-white mb-10 tracking-tight">
        Your ShopIndia Cart 🛒
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* LEFT SIDE: Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.length === 0 ? (
            <GlassCard className="p-20 text-center">
              <p className="text-white/40 text-xl mb-6">Your Cart is empty...</p>
              <button 
                onClick={() => navigate('/')}
                className="bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition-all"
              >
                Continue Shopping
              </button>
            </GlassCard>
          ) : (
            cartItems.map((item) => (
              <GlassCard key={item.id} className="p-6 flex flex-col sm:flex-row items-center gap-6 border-white/10 hover:border-white/20 transition-all">
                <div className="w-24 h-24 bg-white/5 rounded-2xl p-2 flex-shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-white font-bold text-lg line-clamp-1">{item.title}</h3>
                  <p className="text-yellow-400 font-black text-xl mt-1">₹ {formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                  <button onClick={() => dispatch(removeFromCart(item.id))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/50 font-bold text-xl">−</button>
                  <span className="text-white font-black text-lg w-6 text-center">{item.quantity}</span>
                  <button onClick={() => dispatch(addToCart(item))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-green-500/50 font-bold text-xl">+</button>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-white/40 text-xs uppercase font-bold tracking-widest">Subtotal</p>
                  <p className="text-white font-black">₹ {formatPrice(item.totalPrice)}</p>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* RIGHT SIDE: Summary */}
        {cartItems.length > 0 && (
          <div className="space-y-6">
            <GlassCard className="p-8 border-yellow-400/20 sticky top-24">
              <h3 className="text-2xl font-black text-white mb-6">Order Summary 🧾</h3>
              
              <form className="space-y-4" onSubmit={handlePlaceOrder}>
                <div className="space-y-3">
                  <p className="text-white/60 text-sm font-bold ml-1">Delivery Address</p>
                  <input 
                    type="text" 
                    name="name"
                    value={shippingData.name}
                    onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                    placeholder="Recipient Name" 
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400 transition" 
                    required 
                  />
                  <textarea 
                    name="address"
                    value={shippingData.address}
                    onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                    placeholder="House No., Street, Landmark" 
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white h-24 outline-none focus:border-yellow-400 transition" 
                    required 
                  ></textarea>
                  <input 
                    type="text" 
                    name="pincode"
                    value={shippingData.pincode}
                    onChange={(e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value })}
                    placeholder="Pincode" 
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400 transition" 
                    required 
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-white/60 text-sm font-bold ml-1">Payment Method</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`rounded-2xl px-4 py-3 border transition ${paymentMethod === "card" ? "border-yellow-400 bg-yellow-400/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                    >
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`rounded-2xl px-4 py-3 border transition ${paymentMethod === "upi" ? "border-yellow-400 bg-yellow-400/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                    >
                      UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`rounded-2xl px-4 py-3 border transition ${paymentMethod === "cod" ? "border-yellow-400 bg-yellow-400/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                    >
                      Cash on Delivery
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6 space-y-3">
                  <div className="flex justify-between text-white/60">
                    <span>Items ({totalQuantity}):</span>
                    <span>₹ {formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Delivery:</span>
                    <span className="text-green-400 font-bold uppercase text-xs">Free</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-2xl pt-2">
                    <span>Total:</span>
                    <span className="text-yellow-400">₹ {formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full font-black py-5 rounded-2xl uppercase tracking-widest mt-4 transition-all shadow-xl ${
                    isProcessing 
                    ? 'bg-gray-500 text-white cursor-not-allowed scale-100' 
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:scale-[1.02] active:scale-[0.98] shadow-yellow-500/20'
                  }`}
                >
                  {isProcessing ? "Processing Payment... 💳" : `Pay with ${paymentMethod === 'card' ? 'Card' : paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery'}`}
                </button>
              </form>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;