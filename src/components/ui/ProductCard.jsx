import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux"; 
import { addToCart } from "../../store/slices/CartSlice"; 
import GlassCard from "./GlassCard";
import { formatPrice } from "../../utils/priceFormatter";

function ProductCard({ product }) {
  const dispatch = useDispatch();

  //  CUSTOM ALERT STATE
  const [alertData, setAlertData] = useState({ show: false, message: "", icon: "" });

  const showCustomAlert = (message, icon) => {
    setAlertData({ show: true, message, icon });
    setTimeout(() => {
      setAlertData({ show: false, message: "", icon: "" });
    }, 5000); 
  };

  //  Button Click Handler
  const handleAddToCart = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    dispatch(addToCart(product)); 
    showCustomAlert("Product added successfully", "🛒"); 
  };

  return (
    <>
      {/*  CUSTOM GLASS ALERT  */}
      {alertData.show && (
        <div className="fixed top-24 right-5 md:right-10 z-50 animate-bounce">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] px-6 py-4 rounded-2xl flex items-center gap-3 text-white">
            <span className="text-2xl">{alertData.icon}</span>
            <p className="font-bold tracking-wide">{alertData.message}</p>
          </div>
        </div>
      )}
      {/* ==================================================== */}

      <Link to={`/product/${product.id}`} className="block h-full">
        <GlassCard className="p-4 hover:scale-105 transition-transform duration-300 flex flex-col justify-between h-full">
          <div>
            <img
              src={product.thumbnail} 
              alt={product.title}
              className="h-40 w-full object-contain mb-4 rounded-lg bg-white/5"
            />
            <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-white">
              {product.title}
            </h3>
            <p className="text-yellow-400 font-bold text-lg">
              ₹ {formatPrice(product.price)}
            </p>
          </div>

          <button 
            onClick={handleAddToCart} 
            className="mt-4 w-full bg-white/10 border border-white/20 py-2 rounded-lg hover:bg-yellow-400 hover:text-black transition-all font-medium"  
          >
            Add to Cart 🛒
          </button>
        </GlassCard>
      </Link>
    </>
  );
}

export default ProductCard;