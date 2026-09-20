import { useState, useEffect } from "react"; 
import { useLoaderData, useNavigate } from "react-router-dom";
import { updateProductInDB } from "../services/productservices";
import { formatPrice } from "../utils/priceFormatter";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/CartSlice";
import notify from "../components/ui/LuxuryToast";
import { 
  Star, 
  ShoppingCart, 
  Zap, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles,
  ArrowLeft,
  Heart,
  Check,
  CreditCard
} from "lucide-react";

const ProductDetails = () => {
  const product = useLoaderData();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [reviewName, setReviewName] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviewList, setReviewList] = useState(product?.review || []);

  useEffect(() => {
    setReviewList(product?.review || []);
    try {
      const saved = JSON.parse(localStorage.getItem("shopindia_wishlist") || "[]");
      setIsWishlisted(saved.includes(product?.id));
    } catch (e) {}
  }, [product?.id, product?.review]);

  const toggleWishlist = () => {
    try {
      let saved = JSON.parse(localStorage.getItem("shopindia_wishlist") || "[]");
      if (saved.includes(product.id)) {
        saved = saved.filter(id => id !== product.id);
        setIsWishlisted(false);
        notify.info("Removed from Wishlist", `${product.title} removed from saved items.`);
      } else {
        saved.push(product.id);
        setIsWishlisted(true);
        notify.success("Added to Wishlist! ❤️", `${product.title} saved for later.`);
      }
      localStorage.setItem("shopindia_wishlist", JSON.stringify(saved));
    } catch (e) {}
  };

  const handleAddToCart = () => {
    if (Number(product.stock || 0) <= 0) {
      notify.error("Out of Stock", "This product is currently unavailable.");
      return;
    }
    dispatch(addToCart(product));
    notify.cart(product.title, product.price);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newReview = {
      reviewName: reviewName,
      rating: Number(rating),
      comment: comment,
      date: new Date().toISOString(),
    };

    const updatedReview = [newReview, ...reviewList];
    setReviewList(updatedReview);
    await updateProductInDB(product.id, { review: updatedReview });

    setReviewName("");
    setRating("5");
    setComment("");
    setIsSubmitting(false);

    notify.success("Review Posted! ✨", "Thank you for sharing your feedback with the community.");
  };

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Product not found.</p>
        <button onClick={() => navigate("/")} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold cursor-pointer">
          Go Back Home
        </button>
      </div>
    );
  }

  const inStock = Number(product.stock || 0) > 0;
  const sellingPrice = Number(product.price || product.mrp || 0);
  const mrpPrice = Number(product.mrp || product.price || 0);
  const discountPercent = Number(product.discount || product.discountPercentage || 0);

  return (
    <div className="space-y-8 md:space-y-12 pb-10 transition-colors duration-300">
      
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to catalog</span>
        </button>

        <button
          onClick={toggleWishlist}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isWishlisted 
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-500/30' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-rose-500'
          }`}
        >
          <Heart size={14} className={isWishlisted ? "fill-current" : ""} />
          <span>{isWishlisted ? "Wishlisted" : "Save for Later"}</span>
        </button>
      </div>

      {/* Main Product Showcase Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 md:p-9 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start">
          
          {/* Left Column: Product Image in Clean Studio Frame */}
          <div className="md:col-span-5 flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-850 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 aspect-square shadow-inner relative group">
            <img
              src={product.thumbnail || "https://placehold.co/500x500/png?text=Product"}
              alt={product.title}
              className="max-h-[380px] w-full object-contain drop-shadow-md group-hover:scale-108 transition-transform duration-300"
            />
          </div>

          {/* Right Column: Metadata & Buy Box */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Category & Rating */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-black tracking-wider uppercase">
                {product.category || "General"}
              </span>
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-200 dark:border-amber-500/20">
                <Star size={12} fill="currentColor" />
                <span>{product.rating || "4.8"} (Verified Ratings)</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {product.title}
            </h1>

            {/* Price Box */}
            <div className="space-y-1 py-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                  ₹{formatPrice(sellingPrice)}
                </span>
                {mrpPrice > sellingPrice && (
                  <span className="text-sm sm:text-base text-slate-400 dark:text-slate-500 line-through font-semibold">
                    ₹{formatPrice(mrpPrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-black px-2.5 py-0.5 rounded-lg shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Inclusive of all applicable taxes.</p>
            </div>

            {/* In Stock Badge */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${inStock ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className={`text-xs font-bold ${inStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {inStock ? (product.stock < 10 ? `Hurry! Only ${product.stock} items left in stock` : 'In Stock · Ready for Fast Dispatch') : 'Currently Out of Stock'}
              </span>
            </div>

            {/* Description */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">About this item</h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {product.description || "Premium quality product curated by ShopIndia with fast nationwide delivery."}
              </p>
            </div>

            {/* Trust Points */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850">
                <Truck size={18} className="mx-auto text-indigo-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">Free Delivery</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850">
                <RefreshCw size={18} className="mx-auto text-cyan-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">7-Day Returns</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850">
                <ShieldCheck size={18} className="mx-auto text-emerald-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">100% Genuine</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <ShoppingCart size={16} />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={() => {
                  if (!inStock) return;
                  dispatch(addToCart(product));
                  notify.cart(product.title, product.price);
                  navigate('/cart');
                }}
                disabled={!inStock}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Zap size={16} className="fill-current text-white" />
                <span>Buy Now</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Review Submission & List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Write Review Form */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Leave Customer Feedback ✍️</h3>

          <form onSubmit={handleReviewSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Your Name</label>
              <input
                type="text"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="5" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">⭐⭐⭐⭐⭐ 5 Stars (Excellent)</option>
                <option value="4" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">⭐⭐⭐⭐ 4 Stars (Good)</option>
                <option value="3" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">⭐⭐⭐ 3 Stars (Average)</option>
                <option value="2" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">⭐⭐ 2 Stars (Poor)</option>
                <option value="1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">⭐ 1 Star (Terrible)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your thoughts on this product..."
                rows="3"
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm outline-none focus:border-indigo-500 resize-none"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Post Review"}
            </button>
          </form>
        </div>

        {/* Customer Reviews List */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer Reviews ({reviewList.length})</h3>

          {reviewList.length === 0 ? (
            <p className="text-slate-400 text-xs py-8 text-center">No reviews yet. Be the first to share your experience!</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {reviewList.map((rev, index) => (
                <div key={index} className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                        {rev.reviewName?.charAt(0) || "U"}
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{rev.reviewName || "Customer"}</span>
                    </div>
                    <span className="text-amber-400 text-xs">{"★".repeat(Math.round(rev.rating || 5))}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 pl-9 leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ProductDetails;