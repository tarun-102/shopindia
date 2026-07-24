import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/CartSlice";
import GlassCard from "../components/ui/GlassCard";
import { updateProductInDB } from "../services/productservices";
import { formatPrice } from "../utils/priceFormatter";

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
  const [alertIcon, setAlertIcon] = useState({ show: false, message: "", icon: "" });

  // Sync reviews when product changes
  useEffect(() => {
    setReviewList(product.review || []);
  }, [product.id, product.review]);

  // ---------------------------------------------------------------------------
  // Custom Alert Notification Trigger
  // ---------------------------------------------------------------------------
  const showCustomAlert = (message, icon) => {
    setAlertIcon({
      show: true,
      message,
      icon,
    });
    setTimeout(() => {
      setAlertIcon({
        show: false,
        message: "",
        icon: "",
      });
    }, 4000);
  };

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  const handleAddToCart = () => {
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
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-16 relative">
      
      {/* Floating Custom Toast Notification */}
      {alertIcon.show && (
        <div className="fixed top-24 right-5 md:right-10 z-50 animate-bounce">
          <div className="bg-[#111827]/95 backdrop-blur-2xl border border-emerald-500/40 shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-3 text-white">
            <span className="text-2xl">{alertIcon.icon}</span>
            <p className="font-semibold tracking-wide text-emerald-300">{alertIcon.message}</p>
          </div>
        </div>
      )}

      {/* Main Product Showcase Card */}
      <GlassCard className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-[#111827]/80 backdrop-blur-2xl border-white/10 rounded-[2.5rem] shadow-2xl">

        {/* Left Column: Product Image with Zoom Effect */}
        <div className="group overflow-hidden bg-white rounded-3xl p-8 flex justify-center items-center relative border border-gray-100 shadow-inner">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="rounded-2xl max-h-[450px] object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out"
          />
        </div>

        {/* Right Column: Product Metadata & Actions */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              {product.category}
            </span>
            <div className="bg-teal-500 text-white px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
              {product.rating || "5.0"} ★
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {product.title}
          </h1>

          <p className="text-gray-300 text-base md:text-lg leading-relaxed border-l-4 border-emerald-500 pl-4 bg-white/5 py-3 rounded-r-2xl">
            {product.description}
          </p>

          <div className="space-y-1">
            <p className="text-gray-500 text-sm line-through">M.R.P.: ₹ {formatPrice(product.price + 50)}</p>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-emerald-400">
                ₹ {formatPrice(product.price)}
              </span>
              <span className="text-teal-400 font-bold text-sm bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20">
                Save {product.discountPercentage || 15}%
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <button
              onClick={handleAddToCart}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm"
            >
              Add to Cart 🛒
            </button>

            <button
              onClick={() => {
                dispatch(addToCart(product));
                navigate('/cart');
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black py-4 rounded-xl hover:from-emerald-500 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-2"
            >
              Buy Now ⚡
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Review Submission Form Section */}
      <section>
        <GlassCard className="p-8 md:p-10 border-white/10 bg-[#111827]/80 backdrop-blur-2xl rounded-[2rem]">
          <h2 className="text-2xl font-black text-white mb-6">Leave Your Review ✍️</h2>

          <form className="space-y-5" onSubmit={handleReviewSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                type="text"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="Your Name"
                className="bg-black/40 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                required
              />
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="bg-black/40 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                <option value="5" className="bg-gray-900">⭐⭐⭐⭐⭐ (Excellent)</option>
                <option value="4" className="bg-gray-900">⭐⭐⭐⭐ (Good)</option>
                <option value="3" className="bg-gray-900">⭐⭐⭐ (Average)</option>
                <option value="2" className="bg-gray-900">⭐⭐ (Poor)</option>
                <option value="1" className="bg-gray-900">⭐ (Terrible)</option>
              </select>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              className="w-full bg-black/40 border border-gray-700 p-4 rounded-xl text-white h-32 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
              required
            ></textarea>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-10 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting... ⏳" : "Submit Review"}
            </button>
          </form>
        </GlassCard>
      </section>

      {/* Customer Reviews List Section */}
      <div className="space-y-8">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-3xl font-black text-white">
            Customer Reviews 🗣️
          </h2>
        </div>

        {reviewList.length === 0 ? (
          <p className="text-gray-400 italic text-lg text-center py-12 bg-white/5 rounded-3xl border border-white/5">
            No reviews yet. Be the first to review this product! 🚀
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviewList.map((rev, index) => (
              <GlassCard key={index} className="p-6 bg-[#111827]/60 backdrop-blur-xl border-white/10 hover:border-emerald-500/40 transition-colors rounded-2xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex justify-center items-center text-lg font-black text-emerald-400 uppercase">
                    {rev.reviewName ? rev.reviewName.charAt(0) : "U"}
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">{rev.reviewName}</p>
                    <p className="text-amber-400 text-xs tracking-wider">{"★".repeat(Math.round(rev.rating))}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm italic leading-relaxed">"{rev.comment}"</p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;