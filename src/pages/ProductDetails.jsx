import { useEffect, useState } from "react";
import { data, useLoaderData, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/CartSlice"
import  GlassCard  from "../components/ui/GlassCard"
import { updateProductInDB } from "../services/productservices";
import { formatPrice } from "../utils/priceFormatter";

const ProductDetails = () => {

  const product = useLoaderData();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [reviewName, setReviewNmae] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("")
  const [isSubmiting, setIsSubmiting] = useState(false)

  const [reviewList, setReviewList] = useState(product.review || [])

  const [alertIcon, setAlertIcon] = useState({ show: false, message: "", icon: "" })

  useEffect(() => {
    setReviewList(product.review || [])
  }, [product.id, product.review])

  const showCustomAleart = (message, icon) => {
    setAlertIcon({
      show: true,
      message,
      icon
    });
    setTimeout(() => {
      setAlertIcon({
        show: false,
        message: "",
        icon: ""
      })
    },5000)
  }

  const handleAddToCart = () => {
    dispatch(addToCart(product))
    showCustomAleart(`${product.title} Add cart successfully `, "🛒")
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmiting(true);

    const newReview = {
      reviewName: reviewName,
      rating: Number(rating),
      comment: comment,
      data: new Date().toISOString()
    }

    const updatedReview = [newReview, ...reviewList];
    setReviewList(updatedReview)
    await updateProductInDB(product.id, { review: updatedReview });

    setReviewNmae("")
    setRating("");
    setComment("")
    setIsSubmiting(false);

    showCustomAleart("Thanks For your Feedback")
  }


  return (
    <div className="max-w-6xl mx-auto p-4  md:p-10 space-y-12  relative">
      {
        alertIcon.show && (
          <div className=" fixed top-24  right-5  md:right-10  z-50 animate-bounce ">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] px-6 py-4 rounded-2xl flex items-center gap-3 text-white">
              <span className="text-2xl">{alertIcon.icon}</span>
              <p className="font-bold tracking-wide">{alertIcon.message}</p>
            </div>
          </div>
        )
      }

      <GlassCard className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left: Image with Zoom Effect */}
        <div className="group overflow-hidden bg-white/5 rounded-3xl p-6 flex justify-center items-center">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="rounded-2xl shadow-2xl max-h-[450px] object-contain group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              {product.category}
            </span>
            <div className="bg-green-500 text-white px-2 py-0.5 rounded text-sm font-bold flex items-center gap-1">
              {product.rating || "5.0"} ★
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {product.title}
          </h1>

          <p className="text-white/60 text-base md:text-lg leading-relaxed border-l-4 border-yellow-400 pl-4">
            {product.description}
          </p>

          <div className="space-y-1">
            <p className="text-white/40 text-sm line-through">M.R.P.: ₹ {formatPrice(product.price + 50)}</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-yellow-400">
                ₹ {formatPrice(product.price)}
              </span>
              <span className="text-green-400 font-bold text-sm">
                Save {product.discountPercentage || 15}%
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <button
              onClick={handleAddToCart}
              className="bg-white/10 border border-white/20 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all flex justify-center items-center gap-2"
            >
              Add to Cart 🛒
            </button>

            <button
              onClick={() => {
                dispatch(addToCart(product));
                navigate('/cart');
              }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black py-4 rounded-2xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-xl shadow-yellow-500/20 flex justify-center items-center gap-2"
            >
              Buy Now ⚡
            </button>
          </div>
        </div>
      </GlassCard>
      {/* REVIEWS FORM */}
      <section>
        <GlassCard className="p-8 border-white/10">
          <h2 className="text-2xl font-black text-white mb-6">Leave Your Review ✍️</h2>

          <form className="space-y-4" onSubmit={handleReviewSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={reviewName}
                onChange={(e) => setReviewNmae(e.target.value)}
                placeholder="Your Name"
                className="bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400 transition"
                required
              />
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400 transition"
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
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white h-32 outline-none focus:border-yellow-400 transition"
              required
            ></textarea>
            <button
              type="submit"
              disabled={isSubmiting}
              className="bg-yellow-400 text-black font-black px-10 py-3 rounded-xl hover:bg-yellow-300 transition-all disabled:opacity-50"
            >
              {isSubmiting ? "Submitting... ⏳" : "Submit Real Review"}
            </button>
          </form>
        </GlassCard>
      </section>

      {/* REVIEWS LIST */}
      <div className="space-y-8">
        <h2 className="text-3xl font-black text-white border-b border-white/10 pb-4">
          Customer Reviews 🗣️
        </h2>

        {reviewList.length === 0 ? (
          <p className="text-gray-400 italic text-lg text-center py-8">
            No reviews yet. Be the first to review this product! 🚀
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviewList.map((rev, index) => (
              <GlassCard key={index} className="p-6 hover:border-yellow-400/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex justify-center items-center text-xl font-bold text-yellow-400 uppercase">
                    {rev.reviewName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{rev.reviewName}</p>
                    <p className="text-yellow-500 text-xs">{"★".repeat(Math.round(rev.rating))}</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm italic leading-relaxed">"{rev.comment}"</p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetails;