import { useDispatch } from "react-redux";
import { addToCart } from "../../store/slices/CartSlice";
import toast from 'react-hot-toast';
import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/priceFormatter";

function ProductCard({ product }) {
  const dispatch = useDispatch();
  
  const inStock = Number(product.stock || 0) > 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) {
      toast.error('Out of stock — cannot add this item to cart', {
        className: 'dark:bg-[#111827] dark:text-white dark:border-white/10 bg-white text-gray-900 border-gray-200'
      });
      return;
    }
    dispatch(addToCart(product));
    toast.success('🛒 Product added to cart', {
      className: 'dark:bg-[#111827] dark:text-white dark:border-white/10 bg-white text-gray-900 border-gray-200'
    });
  };

  // Pricing calculations
  const sellingPrice = Number(product.price || product.mrp || 0);
  const mrpPrice = Number(product.mrp || product.price || 0);
  const discountPercent = Number(product.discount || 0);

  return (
    <div className="group bg-white/80 dark:bg-[#0a0f16]/60 backdrop-blur-xl border border-gray-200/60 dark:border-white/5 rounded-[1rem] md:rounded-[2rem] p-3 md:p-4 flex flex-col justify-between h-full transition-all duration-500 hover:border-emerald-500/50 dark:hover:border-emerald-500/30 shadow-sm hover:shadow-[0_10px_40px_-15px_rgba(16,185,129,0.2)] hover:-translate-y-2 relative overflow-hidden">

      {/* Subtle Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/20 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      <div>
        {/* Responsive Image Container */}
        <Link to={`/product/${product.id}`} className="block">
          <div className="relative h-36 sm:h-48 md:h-56 w-full mb-3 md:mb-5 rounded-[0.8rem] md:rounded-[1.5rem] bg-gray-50 dark:bg-gradient-to-br dark:from-white dark:to-gray-100 flex items-center justify-center p-3 md:p-6 overflow-hidden shadow-inner border border-gray-100 dark:border-none">
            <img
              src={product.thumbnail}
              alt={product.title}
              className="h-full w-full object-contain mix-blend-multiply transform group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 ease-out"
            />

            {/* Category Badge */}
            {product.category && (
              <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-white/90 dark:bg-white/80 backdrop-blur-md text-gray-800 dark:text-black text-[7px] md:text-[9px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg uppercase tracking-widest shadow-sm border border-gray-200 dark:border-none">
                {product.category}
              </span>
            )}

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <span className="absolute top-2 right-2 md:top-3 md:right-3 bg-rose-500 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </Link>

        {/* Title */}
        <h3 className="font-semibold text-xs md:text-[16px] leading-tight md:leading-snug mb-1 md:mb-2 line-clamp-2 text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
          {product.title}
        </h3>

        {/* Price & Stock Container */}
        <div className="mt-2 flex flex-row items-end justify-between gap-1 md:gap-3">
          <div>
            <p className="hidden md:block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Price</p>
            <div className="flex items-baseline gap-2">
              <p className="text-gray-900 dark:text-white font-black text-lg md:text-2xl tracking-tight drop-shadow-sm leading-none">
                ₹{formatPrice(sellingPrice)}
              </p>
              {mrpPrice > sellingPrice && (
                <p className="text-gray-400 dark:text-gray-500 line-through text-xs md:text-sm font-semibold">
                  ₹{formatPrice(mrpPrice)}
                </p>
              )}
            </div>
          </div>

          <div className={`flex items-center gap-1 px-1.5 md:px-2.5 py-1 rounded border ${inStock ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-rose-500 dark:bg-rose-400'}`}></span>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              {inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!inStock}
        className={`mt-4 md:mt-6 w-full relative overflow-hidden rounded-lg md:rounded-xl py-2 md:py-3.5 flex items-center justify-center gap-1.5 font-black text-[10px] md:text-sm uppercase tracking-widest transition-all duration-300 border
          ${inStock
            ? 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-800 dark:text-white hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-95'
            : 'bg-gray-50 dark:bg-black/20 border-gray-100 dark:border-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
      >
        <span className="relative z-10">{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
        {inStock && <span className="relative z-10 transform group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300 text-xs md:text-base">🛍️</span>}
        
        {inStock && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>}
      </button>
    </div>
  );
}

export default ProductCard;