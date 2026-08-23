import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { getAllProducts } from "../../services/productservices";
import { formatPrice } from "../../utils/priceFormatter";
import notify from "./LuxuryToast";
import { useDispatch } from "react-redux";
import { addToCart } from "../../store/slices/CartSlice";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Truck, 
  ArrowRight,
  Star,
  Clock,
  CheckCircle2,
  ShoppingCart
} from "lucide-react";

const HeroSlider = () => {
  const [sliderProducts, setSliderProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate(); 
  const dispatch = useDispatch();
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchTopDiscountProducts = async () => {
      try {
        const products = await getAllProducts();
        if (products && products.length > 0) {
          const sortedProducts = [...products]
            .sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0))
            .slice(0, 5); 
          setSliderProducts(sortedProducts);
        }
      } catch (error) {
        console.error("Error fetching slider products:", error);
      }
    };

    fetchTopDiscountProducts();
  }, []);

  // Auto slide interval
  useEffect(() => {
    if (sliderProducts.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sliderProducts.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sliderProducts.length, isPaused]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % sliderProducts.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? sliderProducts.length - 1 : prev - 1));
  };

  const handleTouchStart = (event) => setTouchStartX(event.touches[0].clientX);
  
  const handleTouchEnd = (event) => {
    if (touchStartX === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 40) {
      if (distance < 0) nextSlide();
      else prevSlide();
    }
    setTouchStartX(null);
  };

  const handleInstantBuy = (product) => {
    if (Number(product.stock || 0) <= 0) {
      notify.error("Out of Stock", "This item is currently sold out.");
      return;
    }
    dispatch(addToCart(product));
    notify.cart(product.title, product.price);
    navigate("/cart");
  };

  if (sliderProducts.length === 0) {
    return (
      <div className="w-full h-48 sm:h-64 md:h-80 rounded-2xl md:rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-500/10 dark:from-slate-900 dark:to-slate-850 flex items-center justify-center border border-gray-200/80 dark:border-slate-800 animate-pulse">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
          <Sparkles className="animate-spin" size={18} />
          <span>Curating exclusive deals for you...</span>
        </div>
      </div>
    );
  }

  const currentProduct = sliderProducts[currentIndex];
  const sellingPrice = Number(currentProduct?.price || currentProduct?.mrp || 0);
  const mrpPrice = Number(currentProduct?.mrp || currentProduct?.price || 0);
  const discountPercent = Number(currentProduct?.discount || 0);

  return (
    <div 
      className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-emerald-500/20 dark:border-slate-800 shadow-xl transition-all duration-300 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Gradient & Ambient Glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 dark:from-[#041a13] dark:via-[#071924] dark:to-[#090f18]"></div>
      
      {/* Ambient Mesh Orbs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-400/25 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none"></div>

      {/* Slide Content Layout */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10 text-white min-h-[280px] sm:min-h-[320px] md:min-h-[360px] flex items-center">
        <div className="w-full grid grid-cols-12 gap-3 sm:gap-6 md:gap-8 items-center">
          
          {/* Left Column: Offer Details & Buttons */}
          <div className="col-span-7 sm:col-span-7 md:col-span-7 flex flex-col justify-center space-y-2 sm:space-y-3.5">
            
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-md">
                <Flame size={12} className="text-red-600 animate-bounce" />
                <span>Deal of the Day</span>
              </span>
              {discountPercent > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Product Title */}
            <h2 
              onClick={() => navigate(`/product/${currentProduct.id}`)}
              className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight line-clamp-2 cursor-pointer hover:text-emerald-300 transition-colors drop-shadow"
            >
              {currentProduct.title || currentProduct.name}
            </h2>

            {/* Short Tagline / Description */}
            <p className="text-slate-200/90 text-xs sm:text-sm line-clamp-2 max-w-md font-medium">
              {currentProduct.description || "Premium certified product available at guaranteed lowest price."}
            </p>

            {/* Price & Rating Display */}
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 pt-0.5">
              <span className="text-xl sm:text-3xl md:text-4xl font-black text-amber-300 drop-shadow">
                ₹{formatPrice(sellingPrice)}
              </span>
              {mrpPrice > sellingPrice && (
                <span className="text-xs sm:text-base text-slate-300/80 line-through font-semibold">
                  ₹{formatPrice(mrpPrice)}
                </span>
              )}
              <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold text-amber-300 border border-white/10">
                <Star size={12} fill="currentColor" />
                <span>4.8</span>
              </div>
            </div>

            {/* Deal Claim Meter */}
            <div className="hidden sm:block max-w-xs space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-emerald-200">
                <span>⚡ Selling Fast</span>
                <span>85% Claimed</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full w-[85%]"></div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => handleInstantBuy(currentProduct)}
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-400/25 transition-all transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Zap size={15} className="fill-current text-slate-950" />
                <span>Buy Now</span>
              </button>

              <button
                onClick={() => navigate(`/product/${currentProduct.id}`)}
                className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Details</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>

          {/* Right Column: Studio-Grade Clean Showcase Pedestal */}
          <div 
            onClick={() => navigate(`/product/${currentProduct.id}`)}
            className="col-span-5 sm:col-span-5 md:col-span-5 flex justify-center items-center cursor-pointer group/img relative"
          >
            {/* Ambient Radial Backlight */}
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl transform group-hover/img:scale-110 transition-transform duration-500"></div>

            {/* Pure Clean White Studio Frame — Eliminates awkward white JPG square border */}
            <div className="relative w-full max-w-[140px] sm:max-w-[200px] md:max-w-[260px] aspect-square rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white via-slate-50 to-gray-100 p-3 sm:p-5 shadow-2xl border-2 border-white/80 flex items-center justify-center overflow-hidden transform group-hover/img:scale-105 group-hover/img:-rotate-1 transition-all duration-500">
              
              {/* Quality Guarantee Tag inside showcase */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm z-10 hidden sm:block">
                100% Genuine
              </div>

              <img
                src={currentProduct.thumbnail || currentProduct.imageUrl || currentProduct.image || "https://placehold.co/400x400/png?text=Product"}
                alt={currentProduct.title || currentProduct.name}
                className="w-full h-full object-contain drop-shadow-md group-hover/img:scale-110 transition-transform duration-500"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Slide Navigation Arrows */}
      <button 
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 border border-white/20"
      >
        <ChevronLeft size={22} />
      </button>

      <button 
        onClick={nextSlide}
        aria-label="Next Slide"
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 border border-white/20"
      >
        <ChevronRight size={22} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5 sm:space-x-2">
        {sliderProducts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "w-6 sm:w-8 bg-amber-400 shadow-md" 
                : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

    </div>
  );
};

export default HeroSlider;