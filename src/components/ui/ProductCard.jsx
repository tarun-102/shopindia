import { useState } from "react";
import toast from 'react-hot-toast';
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux"; 
import { addToCart } from "../../store/slices/CartSlice"; 
import { formatPrice } from "../../utils/priceFormatter";

function ProductCard({ product }) {
  const dispatch = useDispatch();

  // Using react-hot-toast for premium notifications

  // Button Click Handler
  const handleAddToCart = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if (Number(product.stock || 0) <= 0) {
      toast.error('Out of stock — cannot add this item to cart');
      return;
    }
    dispatch(addToCart(product)); 
    toast.success('🛒 Product added to cart');
  };

  return (
    <>
      {/* Notifications handled by react-hot-toast */}

      <div className="group bg-[#111827] border border-gray-800 rounded-2xl p-3.5 flex flex-col justify-between h-full transition-all duration-400 hover:border-emerald-500/50 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.2)] hover:-translate-y-1.5 relative overflow-hidden">
          
          {/* Subtle Top Glow on Hover */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div>
            {/* Image Container - Clean White Stage */}
            <Link to={`/product/${product.id}`} className="block">
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
            </Link>

            {/* Title */}
            <h3 className="font-semibold text-[15px] mb-1.5 line-clamp-2 text-gray-200 group-hover:text-emerald-400 transition-colors duration-200 px-1">
              {product.title}
            </h3>

            {/* Price */}
            <div className="mt-1 px-1 flex items-center justify-between gap-3">
              <p className="text-emerald-400 font-black text-xl tracking-tight drop-shadow-sm">
                ₹ {formatPrice(product.price)}
              </p>
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${Number(product.stock || 0) > 0 ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'}`}>
                {Number(product.stock || 0) > 0 ? `Stock ${product.stock}` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Premium Gradient Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={Number(product.stock || 0) <= 0}
            className={`mt-5 w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 py-2.5 rounded-xl active:scale-95 transition-all duration-300 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-400/20 ${Number(product.stock || 0) <= 0 ? 'opacity-50 cursor-not-allowed grayscale hover:from-emerald-600 hover:to-teal-500' : 'hover:from-emerald-500 hover:to-teal-400'}`}
          >
            <span>{Number(product.stock || 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
            <span className="transform group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300">🛒</span>
          </button>
        </div>
    </>
  );
}

export default ProductCard;