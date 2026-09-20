import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/priceFormatter";
import { useDispatch } from "react-redux";
import { addToCart } from "../../store/slices/CartSlice";
import notify from "./LuxuryToast";
import { ShoppingCart, Star, Zap, Heart, Check } from "lucide-react";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("shopindia_wishlist") || "[]");
      setIsWishlisted(saved.includes(product.id));
    } catch (e) {}
  }, [product.id]);

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      let saved = JSON.parse(localStorage.getItem("shopindia_wishlist") || "[]");
      if (saved.includes(product.id)) {
        saved = saved.filter(id => id !== product.id);
        setIsWishlisted(false);
        notify.info("Removed from Wishlist", `${product.title} removed from saved list.`);
      } else {
        saved.push(product.id);
        setIsWishlisted(true);
        notify.success("Added to Wishlist! ❤️", `${product.title} saved for later.`);
      }
      localStorage.setItem("shopindia_wishlist", JSON.stringify(saved));
    } catch (e) {}
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (Number(product.stock || 0) <= 0) {
      notify.error("Out of Stock", "This product is currently out of stock.");
      return;
    }

    dispatch(addToCart(product));
    notify.cart(product.title, product.price);
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const sellingPrice = Number(product.price || product.mrp || 0);
  const mrpPrice = Number(product.mrp || product.price || 0);
  const discountPercent = Number(product.discount || product.discountPercentage || 0);
  const inStock = Number(product.stock || 0) > 0;

  return (
    <div className="group relative bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between">
      
      {/* Clickable Image Container */}
      <Link to={`/product/${product.id}`} className="block relative bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-850 dark:to-slate-900 p-4 aspect-square flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
        
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shadow-sm z-10">
            {discountPercent}% OFF
          </span>
        )}

        {/* Category Pill */}
        <span className="absolute top-2.5 right-11 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md backdrop-blur-sm z-10 border border-slate-200/60 dark:border-slate-700 hidden sm:block">
          {product.category || "General"}
        </span>

        {/* Wishlist Heart Button */}
        <button
          onClick={toggleWishlist}
          aria-label="Save to Wishlist"
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-all z-10 cursor-pointer ${
            isWishlisted 
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-110' 
              : 'bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-rose-500 hover:scale-110 shadow-sm'
          }`}
        >
          <Heart size={14} className={isWishlisted ? "fill-white" : ""} />
        </button>

        {/* Product Image */}
        <img
          src={product.thumbnail || "https://placehold.co/300x300/png?text=Product"}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300 drop-shadow-sm"
        />

        {/* Out of Stock Overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-rose-600 text-white text-xs font-black uppercase px-3 py-1 rounded-xl tracking-wider shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Information Body */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 space-y-2.5">
        <div className="space-y-1">
          
          {/* Star Rating */}
          <div className="flex items-center gap-1 text-amber-400 text-[11px] font-bold">
            <Star size={12} fill="currentColor" />
            <span className="text-slate-900 dark:text-white">{product.rating || "4.8"}</span>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-normal">(Verified)</span>
          </div>

          {/* Title */}
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 transition-colors leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Price & Action Button Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          
          {/* Price Box */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                ₹{formatPrice(sellingPrice)}
              </span>
              {mrpPrice > sellingPrice && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 line-through font-semibold">
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
            className={`p-2 sm:px-3.5 sm:py-2 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-md ${
              isAdded 
                ? 'bg-emerald-600 shadow-emerald-500/25' 
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25'
            }`}
          >
            {isAdded ? (
              <>
                <Check size={14} className="stroke-[3]" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>

        </div>
      </div>

    </div>
  );
};

export default ProductCard;