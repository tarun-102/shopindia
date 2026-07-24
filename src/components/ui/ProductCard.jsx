import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux"; 
import { addToCart } from "../../store/slices/CartSlice"; 
import { formatPrice } from "../../utils/priceFormatter";

function ProductCard({ product }) {
  const dispatch = useDispatch();

  // CUSTOM ALERT STATE
  const [alertData, setAlertData] = useState({ show: false, message: "", icon: "" });

  const showCustomAlert = (message, icon) => {
    setAlertData({ show: true, message, icon });
    setTimeout(() => {
      setAlertData({ show: false, message: "", icon: "" });
    }, 3500); 
  };

  // Button Click Handler
  const handleAddToCart = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    dispatch(addToCart(product)); 
    showCustomAlert("Product added successfully", "🛒"); 
  };

  return (
    <>
      {/* CUSTOM EMERALD GLASS ALERT */}
      {alertData.show && (
        <div className="fixed top-24 right-5 md:right-10 z-50 animate-bounce">
          <div className="bg-[#0a0f16]/90 backdrop-blur-xl border border-emerald-500/40 shadow-[0_8px_32px_0_rgba(16,185,129,0.25)] px-6 py-3.5 rounded-2xl flex items-center gap-3 text-white">
            <span className="text-2xl">{alertData.icon}</span>
            <p className="font-semibold text-sm md:text-base text-emerald-300 tracking-wide">{alertData.message}</p>
          </div>
        </div>
      )}

      <Link to={`/product/${product.id}`} className="block h-full group">
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-3.5 flex flex-col justify-between h-full transition-all duration-400 hover:border-emerald-500/50 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.2)] hover:-translate-y-1.5 relative overflow-hidden">
          
          {/* Subtle Top Glow on Hover */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div>
            {/* Image Container - Clean White Stage */}
            <div className="relative h-52 w-full mb-5 rounded-xl bg-white flex items-center justify-center p-4 overflow-hidden border border-gray-100">
              <img
                src={product.thumbnail} 
                alt={product.title}
              
                className="h-full w-full object-contain mix-blend-multiply transform group-hover:scale-110 transition-transform duration-500 ease-out"
              />
              
              {/* Refined Category Badge */}
              {product.category && (
                <span className="absolute top-2 left-2 bg-[#0a0f16]/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest backdrop-blur-md shadow-sm">
                  {product.category}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-[15px] mb-1.5 line-clamp-2 text-gray-200 group-hover:text-emerald-400 transition-colors duration-200 px-1">
              {product.title}
            </h3>

            {/* Price */}
            <div className="mt-1 px-1">
              <p className="text-emerald-400 font-black text-xl tracking-tight drop-shadow-sm">
                ₹ {formatPrice(product.price)}
              </p>
            </div>
          </div>

          {/* Premium Gradient Button */}
          <button 
            onClick={handleAddToCart} 
            className="mt-5 w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 py-2.5 rounded-xl hover:from-emerald-500 hover:to-teal-400 active:scale-95 transition-all duration-300 font-bold text-sm flex items-center justify-center gap-2 group/btn border border-emerald-400/20"  
          >
            <span>Add to Cart</span>
            <span className="transform group-hover/btn:translate-x-1 group-hover/btn:scale-110 transition-all duration-300">🛒</span>
          </button>
        </div>
      </Link>
    </>
  );
}

export default ProductCard;