import { useSelector, useDispatch } from "react-redux";
import { addToCart,removeFromCart,clearCart } from '../store/slices/cartSlice';
import GlassCard from "../components/ui/GlassCard";
import { formatPrice } from "../utils/priceFormatter";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  // Redux store se data nikal rahe hain
  const cartItems = useSelector((state) => state.cart.items);
  const totalAmount = useSelector((state) => state.cart.totalAmount);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      <h2 className="text-4xl font-black text-white mb-10 tracking-tight">
        Your ShopIndia Cart 🛒
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* 1. LEFT SIDE: Cart Items List */}
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
                {/* Product Image */}
                <div className="w-24 h-24 bg-white/5 rounded-2xl p-2 flex-shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                </div>

                {/* Product Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-white font-bold text-lg line-clamp-1">{item.title}</h3>
                  <p className="text-yellow-400 font-black text-xl mt-1">
                    ₹ {formatPrice(item.price)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                  <button 
                    onClick={() => dispatch(removeFromCart(item.id))}
                    className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-red-500/50 transition-colors font-bold text-xl"
                  >
                    −
                  </button>
                  <span className="text-white font-black text-lg w-6 text-center">
                    {item.quantity}
                  </span>
                  <button 
                    onClick={() => dispatch(addToCart(item))}
                    className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-green-500/50 transition-colors font-bold text-xl"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal for Item */}
                <div className="text-right hidden sm:block">
                  <p className="text-white/40 text-xs uppercase font-bold tracking-widest">Subtotal</p>
                  <p className="text-white font-black">₹ {formatPrice(item.totalPrice)}</p>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* 2. RIGHT SIDE: Delivery & Summary */}
        <div className="space-y-6">
          <GlassCard className="p-8 border-yellow-400/20 sticky top-24">
            <h3 className="text-2xl font-black text-white mb-6">Order Summary 🧾</h3>
            
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-3">
                <p className="text-white/60 text-sm font-bold ml-1">Delivery Address</p>
                <input 
                  type="text" 
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
                  <span>Items ({useSelector(state => state.cart.totalQuantity)}):</span>
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
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-yellow-500/20 uppercase tracking-widest mt-4"
              >
                Place Order ⚡
              </button>
            </form>
          </GlassCard>

          <p className="text-center text-white/30 text-xs">
            Safe & Secure Payments • ShopIndia Verified Store
          </p>
        </div>

      </div>
    </div>
  );
};

export default Cart;