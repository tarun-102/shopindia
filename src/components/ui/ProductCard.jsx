import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/priceFormatter";
import { useDispatch } from "react-redux";
import { addToCart } from "../../store/slices/CartSlice";
import notify from "./LuxuryToast";
import { ShoppingCart, Star, Zap } from "lucide-react";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (Number(product.stock || 0) <= 0) {
      notify.error("Out of Stock", "This product is currently out of stock.");
      return;
    }

    dispatch(addToCart(product));
    notify.cart(product.title, product.price);
  };

  const sellingPrice = Number(product.price || product.mrp || 0);
  const mrpPrice = Number(product.mrp || product.price || 0);
  const discountPercent = Number(product.discount || product.discountPercentage || 0);
  const inStock = Number(product.stock || 0) > 0;

  return (
    <div className="group relative bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between">
      
      {/* Clickable Image Container */}
      <Link to={`/product/${product.id}`} className="block relative bg-gradient-to-b from-white via-slate-50 to-gray-100 dark:from-slate-850 dark:to-slate-900 p-4 aspect-square flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-slate-800/60">
        
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md shadow-sm z-10">
            {discountPercent}% OFF
          </span>
        )}

        {/* Category Pill */}
        <span className="absolute top-2.5 right-2.5 bg-gray-100/90 dark:bg-slate-800/90 text-gray-600 dark:text-slate-300 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded backdrop-blur-sm z-10">
          {product.category || "General"}
        </span>

        {/* Product Image */}
        <img
          src={product.thumbnail || "https://placehold.co/300x300/png?text=Product"}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300 drop-shadow-sm"
        />

        {/* Out of Stock Overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-rose-600 text-white text-xs font-black uppercase px-3 py-1 rounded-lg tracking-wider shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Information Body */}
      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 space-y-2">
        <div className="space-y-1">
          
          {/* Star Rating */}
          <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold">
            <Star size={12} fill="currentColor" />
            <span>{product.rating || "4.8"}</span>
            <span className="text-gray-400 dark:text-slate-500 text-[10px] font-normal">(Verified)</span>
          </div>

          {/* Title */}
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-2 transition-colors leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Price & Action Button Footer */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          
          {/* Price Box */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                ₹{formatPrice(sellingPrice)}
              </span>
              {mrpPrice > sellingPrice && (
                <span className="text-[11px] text-gray-400 dark:text-slate-500 line-through">
                  ₹{formatPrice(mrpPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Add To Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            aria-label="Add to cart"
            className="p-2 sm:px-3 sm:py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl shadow-sm shadow-emerald-500/20 font-bold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShoppingCart size={15} />
            <span className="hidden sm:inline">Add</span>
          </button>

        </div>
      </div>

    </div>
  );
};

export default ProductCard;