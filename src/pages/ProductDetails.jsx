import { useLoaderData, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux"; // Redux hook
import { cartActions } from "../store/slices/CartSlice";
import GlassCard from "../components/ui/GlassCard";
import { formatPrice } from "../utils/priceFormatter";

const ProductDetails = () => {
  const product = useLoaderData();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux function to add item
  const handleAddToCart = () => {
    dispatch(cartActions.addToCart(product));
    alert(`${product.title} has been added to your ShopIndia cart! 🛒`);
  };

  const extraReviews = [
    { reviewerName: "Rahul Sharma", rating: 5, comment: "Value for money! Ahmedabad mein 2 din mein delivery mil gayi.", date: new Date().toISOString() },
    { reviewerName: "Priya Patel", rating: 4, comment: "Quality is top notch. ShopIndia is best.", date: new Date().toISOString() }
  ];

  const allReviews = product.reviews ? [...product.reviews, ...extraReviews] : extraReviews;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12">
      
      {/* Main Product Section */}
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
              {product.rating} ★
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
                Save {product.discountPercentage}%
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <button 
              onClick={handleAddToCart} // Using Redux logic here
              className="bg-white/10 border border-white/20 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all flex justify-center items-center gap-2"
            >
              Add to Cart 🛒
            </button>
            
            <button 
              onClick={() => {
                handleAddToCart(); // Add to cart first
                navigate('/cart'); // Then go to cart
              }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black py-4 rounded-2xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-xl shadow-yellow-500/20 flex justify-center items-center gap-2"
            >
              Buy Now ⚡
            </button>
          </div>
        </div>
      </GlassCard>

      {/* ================= NEW: GLASS EFFECT REVIEW FORM ================= */}
      <section>
        <GlassCard className="p-8 border-white/10">
          <h2 className="text-2xl font-black text-white mb-6">Leave Your Review ✍️</h2>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            alert("This review will be saved to Firebase soon!");
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Your Name" 
                className="bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400 transition"
                required
              />
              <select className="bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400 transition">
                <option value="5" className="bg-gray-900">⭐⭐⭐⭐⭐ (Excellent)</option>
                <option value="4" className="bg-gray-900">⭐⭐⭐⭐ (Good)</option>
                <option value="3" className="bg-gray-900">⭐⭐⭐ (Average)</option>
              </select>
            </div>
            <textarea 
              placeholder="What did you like or dislike about this product?" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white h-32 outline-none focus:border-yellow-400 transition"
              required
            ></textarea>
            <button className="bg-yellow-400 text-black font-black px-10 py-3 rounded-xl hover:bg-yellow-300 transition-all">
              Submit Real Review
            </button>
          </form>
        </GlassCard>
      </section>

      {/* Reviews Section */}
      <div className="space-y-8">
        <h2 className="text-3xl font-black text-white border-b border-white/10 pb-4">
          Customer Reviews 🗣️
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allReviews.map((rev, index) => (
            <GlassCard key={index} className="p-6 hover:border-yellow-400/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex justify-center items-center text-xl font-bold text-yellow-400">
                  {rev.reviewerName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{rev.reviewerName}</p>
                  <p className="text-yellow-500 text-xs">{"★".repeat(Math.round(rev.rating))}</p>
                </div>
              </div>
              <p className="text-white/70 text-sm italic leading-relaxed">"{rev.comment}"</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;