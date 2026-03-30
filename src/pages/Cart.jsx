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
  const [orderSuccess, setOrderSuccess] = useState(false); // 🔥 NAYA: Big Success Screen ke liye
  const [currentUser, setCurrentUser] = useState(null);

  
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

    setIsProcessing(true); // Processing button

    
    setTimeout(async () => {
      const newOrder = {
        userId: currentUser.uid, 
        items: cartItems,
        totalAmount: totalAmount,
        status: "Order Confirmed 🟢",
        date: new Date().toISOString()
      };

      await placeOrderInDB(newOrder); // Database  save
      dispatch(clearCart()); // Cart vlear
      
      setIsProcessing(false); 
      setOrderSuccess(true); // 🔥 BIG SUCCESS SCREEN 
      
      
      setTimeout(() => {
        navigate('/profile'); 
      }, 5000); 

    }, 2000); 
  };

  
  if (orderSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
        <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center text-6xl animate-bounce shadow-[0_0_50px_rgba(34,197,94,0.6)]">
          ✅
        </div>
        <h2 className="text-4xl font-black text-white mt-8 mb-2">Payment Successful!</h2>
        <p className="text-gray-400 text-lg">Your order has been securely placed.</p>
        <p className="text-yellow-400 mt-6 animate-pulse">Redirecting to your orders... 🚀</p>
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
                  {/* 🔥 FIX: Asli User ka Naam yahan apne aap aayega! */}
                  <input 
                    type="text" 
                    defaultValue={currentUser?.displayName || ""} 
                    placeholder="Full Name" 
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400 transition" 
                    required 
                  />
                  <textarea 
                    placeholder="House No., Area, Landmark (Ahmedabad)" 
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white h-24 outline-none focus:border-yellow-400 transition" 
                    required 
                  ></textarea>
                  <input 
                    type="text" 
                    placeholder="Pincode" 
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400 transition" 
                    required 
                  />
                </div>

                <div className="pt-6 border-t border-white/10 mt-6 space-y-3">
                  <div className="flex justify-between text-white/60">
                    {/* 🔥 Hook error wala issue yahan fixed hai */}
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
                  {isProcessing ? "Processing Payment... 💳" : "Pay Securely ⚡"}
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