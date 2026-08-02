import { useState, useEffect } from "react"; 
import { useLoaderData, useNavigate } from "react-router-dom";
import ProductCard from "../components/ui/ProductCard";
import GlassCard from "../components/ui/GlassCard";
import { updateProductInDB } from "../services/productservices";
import { formatPrice } from "../utils/priceFormatter";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/CartSlice";
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const product = useLoaderData();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ---------------------------------------------------------------------------
  // Component States
  // ---------------------------------------------------------------------------
  const [reviewName, setReviewName] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reviewList, setReviewList] = useState(product.review || []);

  // Sync reviews when product changes
  useEffect(() => {
    setReviewList(product.review || []);
  }, [product.id, product.review]);

  // ---------------------------------------------------------------------------
  // Custom Alert Notification Trigger
  // ---------------------------------------------------------------------------
  const showCustomAlert = (message, icon) => {
    toast.success(`${icon || ''} ${message}`, {
      className: 'dark:bg-[#111827] dark:text-white dark:border-white/10 bg-white text-gray-900 border-gray-200 shadow-lg'
    });
  };

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  const handleAddToCart = () => {
    if (Number(product.stock || 0) <= 0) {
      toast.error('This product is out of stock and cannot be added to cart.');
      return;
    }
    dispatch(addToCart(product));
    showCustomAlert(`${product.title} added to cart successfully`, "🛒");
  };

  /**
   * Handles review submission, updates database, and refreshes local state.
   */
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

    showCustomAlert("Thank you for your feedback!", "✨");
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-16 relative transition-colors duration-500">
      
      {/* Main Product Showcase Card */}
      <GlassCard className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white/90 dark:bg-[#111827]/80 backdrop-blur-2xl border-gray-200 dark:border-white/10 rounded-[2.5rem] shadow-xl dark:shadow-2xl">

        {/* Left Column: Product Image with Zoom Effect */}
        <div className="group overflow-hidden bg-gray-50 dark:bg-white rounded-3xl p-8 flex justify-center items-center relative border border-gray-200 dark:border-gray-100 shadow-inner">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="rounded-2xl max-h-[450px] object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out"
          />
        </div>

        {/* Right Column: Product Metadata & Actions */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm">
              {product.category}
            </span>
            <div className="bg-teal-600 dark:bg-teal-500 text-white px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
              {product.rating || "5.0"} ★
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
            {product.title}
          </h1>

          <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg leading-relaxed border-l-4 border-emerald-500 pl-4 bg-gray-50 dark:bg-white/5 py-3 rounded-r-2xl shadow-sm">
            {product.description}
          </p>

          <div className="space-y-1">
            <p className="text-gray-400 text-sm line-through">M.R.P.: ₹ {formatPrice((product.price || 0) + 50)}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                ₹ {formatPrice(product.price)}
              </span>
              <span className="text-teal-700 dark:text-teal-400 font-bold text-sm bg-teal-50 dark:bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-200 dark:border-teal-500/20">
                Save {product.discountPercentage || 15}%
              </span>
              <span className={`text-xs uppercase font-bold px-3 py-1 rounded-full shadow-sm ${Number(product.stock || 0) > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20'}`}>
                {Number(product.stock || 0) > 0 ? `In stock: ${product.stock}` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <button
              onClick={handleAddToCart}
              disabled={Number(product.stock || 0) <= 0}
              className={`bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm ${Number(product.stock || 0) <= 0 ? 'text-gray-400 cursor-not-allowed opacity-60 hover:bg-gray-100 dark:hover:bg-white/5' : 'text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10'}`}
            >
              {Number(product.stock || 0) <= 0 ? 'Out of Stock' : 'Add to Cart 🛒'}
            </button>

            <button
              onClick={() => {
                if (Number(product.stock || 0) <= 0) {
                  toast.error('This product is out of stock and cannot be purchased.');
                  return;
                }
                dispatch(addToCart(product));
                navigate('/cart');
              }}
              disabled={Number(product.stock || 0) <= 0}
              className={`bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black py-4 rounded-xl transition-all shadow-md dark:shadow-lg dark:shadow-emerald-500/30 flex justify-center items-center gap-2 ${Number(product.stock || 0) <= 0 ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:from-emerald-500 hover:to-teal-400'}`}
            >
              {Number(product.stock || 0) <= 0 ? 'Unavailable' : 'Buy Now ⚡'}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Review Submission Form Section */}
      <section>
        <GlassCard className="p-8 md:p-10 border-gray-200 dark:border-white/10 bg-white/90 dark:bg-[#111827]/80 backdrop-blur-2xl rounded-[2rem] shadow-xl dark:shadow-2xl">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Leave Your Review ✍️</h2>

          <form className="space-y-5" onSubmit={handleReviewSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                type="text"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="Your Name"
                className="bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-gray-700 p-4 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-sm"
                required
              />
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-gray-700 p-4 rounded-xl text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-sm"
              >
                <option value="5" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">⭐⭐⭐⭐⭐ (Excellent)</option>
                <option value="4" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">⭐⭐⭐⭐ (Good)</option>
                <option value="3" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">⭐⭐⭐ (Average)</option>
                <option value="2" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">⭐⭐ (Poor)</option>
                <option value="1" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">⭐ (Terrible)</option>
              </select>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-gray-700 p-4 rounded-xl text-gray-900 dark:text-white h-32 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none shadow-sm"
              required
            ></textarea>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-10 py-4 rounded-xl transition-all shadow-md dark:shadow-lg dark:shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting... ⏳" : "Submit Review"}
            </button>
          </form>
        </GlassCard>
      </section>

      {/* Customer Reviews List Section */}
      <div className="space-y-8">
        <div className="border-b border-gray-200 dark:border-white/10 pb-4">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">
            Customer Reviews 🗣️
          </h2>
        </div>

        {reviewList.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic text-lg text-center py-12 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
            No reviews yet. Be the first to review this product! 🚀
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviewList.map((rev, index) => (
              <GlassCard key={index} className="p-6 bg-white dark:bg-[#111827]/60 backdrop-blur-xl border-gray-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-colors rounded-2xl shadow-md dark:shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-full flex justify-center items-center text-lg font-black text-emerald-600 dark:text-emerald-400 uppercase shadow-inner">
                    {rev.reviewName ? rev.reviewName.charAt(0) : "U"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-base">{rev.reviewName}</p>
                    <p className="text-amber-500 dark:text-amber-400 text-xs tracking-wider">{"★".repeat(Math.round(rev.rating))}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm italic leading-relaxed">"{rev.comment}"</p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;