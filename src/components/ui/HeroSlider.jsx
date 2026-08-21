import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { getAllProducts } from "../../services/productservices";

const HeroSlider = () => {
  const [sliderProducts, setSliderProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchTopDiscountProducts = async () => {
      try {
        const products = await getAllProducts();
        
        const sortedProducts = products
          .sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0))
          .slice(0, 5); 

        setSliderProducts(sortedProducts);
      } catch (error) {
        console.error("Error fetching slider products:", error);
      }
    };

    fetchTopDiscountProducts();
  }, []);

  useEffect(() => {
    if (sliderProducts.length <= 1) return; 
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sliderProducts.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [sliderProducts.length]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % sliderProducts.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? sliderProducts.length - 1 : prev - 1));
  const handleTouchStart = (event) => setTouchStartX(event.touches[0].clientX);
  const handleTouchEnd = (event) => {
    if (touchStartX === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 45) {
      if (distance < 0) nextSlide();
      else prevSlide();
    }
    setTouchStartX(null);
  };

  if (sliderProducts.length === 0) {
      return (
          <div className="min-h-[350px] flex items-center justify-center bg-gray-50 rounded-[1.5rem] md:rounded-[2.5rem]">
              <p className="text-gray-500 font-medium animate-pulse">Loading amazing deals...</p>
          </div>
      );
  }

  return (
    <section
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="bg-gradient-to-br from-orange-50 via-gray-50 to-sky-50 dark:from-[#321507] dark:via-[#111827] dark:to-[#082f49] rounded-2xl md:rounded-[2.5rem] p-3 py-4 md:p-10 shadow-xl dark:shadow-[0_10px_40px_rgba(14,165,233,0.14)] border border-orange-200/80 dark:border-orange-500/20 relative overflow-hidden transition-colors duration-500"
    >
      
      {/* Background Animated Glow */}
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-300/25 dark:bg-orange-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-sky-300/25 dark:bg-sky-500/10 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-center">
        
        {/* Left Arrow (Hidden on Mobile) */}
        <button 
          onClick={prevSlide}
          className="absolute left-0 z-30 p-2 md:p-3 rounded-full bg-white/40 dark:bg-black/40 hover:bg-white/70 dark:hover:bg-black/70 backdrop-blur-md text-emerald-700 dark:text-emerald-400 transition-all focus:outline-none hidden sm:block shadow-md hover:scale-110"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>

        {/* Slides Container - Height optimized for vertical stacking on mobile */}
        <div className="w-full relative min-h-[530px] sm:min-h-[500px] md:min-h-[390px]">
          {sliderProducts.map((product, index) => {
            return (
              <div 
                key={product.id}
                  className={`transition-all duration-700 ease-in-out w-full flex flex-col-reverse md:flex-row items-center justify-center md:justify-between gap-3 sm:gap-8 md:gap-12 px-1 sm:px-8 md:px-16 ${
                  index === currentIndex ? "opacity-100 translate-x-0" : "hidden"
                }`}
              >
                {/* Left Side: Text Content (Niche on mobile) */}
                <div className="text-center md:text-left w-full md:w-1/2 flex flex-col items-center md:items-start justify-center pt-1 pb-8 md:py-8 md:mt-0">
                  
                  {product.discount && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 md:px-5 md:py-1.5 mb-2 md:mb-5 text-[10px] sm:text-xs md:text-sm font-black text-white bg-orange-500 rounded-md shadow-sm uppercase tracking-wide">
                      Deal of the day · {product.discount}% off
                    </span>
                  )}
                  
                  <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black mb-1.5 md:mb-6 text-emerald-700 dark:text-emerald-300 drop-shadow-sm leading-tight capitalize px-2 md:px-0">
                    {product.name}
                  </h1>
                  
                  <p className="text-gray-600 dark:text-gray-300 font-medium tracking-wide text-xs sm:text-sm md:text-lg leading-relaxed max-w-[280px] sm:max-w-md line-clamp-2 md:line-clamp-3">
                    {product.description || "Discover the best deals and premium quality products."}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-300 md:text-xs">
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-white">4.5 ★</span>
                    <span>Free delivery</span>
                    <span className="text-sky-600 dark:text-sky-300">Easy returns</span>
                  </div>

                  {product.price && (
                    <div className="mt-2 md:mt-4 text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
                      ₹{product.price}
                    </div>
                  )}

                  <button 
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="mt-4 md:mt-7 px-7 py-2.5 md:px-8 md:py-3 text-sm md:text-base bg-[#2874f0] hover:bg-[#1d5fca] text-white rounded-lg font-bold shadow-lg shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300"
                  >
                    Buy now →
                  </button>
                </div>

                {/* Right Side: PERFECT SHAPE IMAGE CONTAINER (Upar on mobile) */}
                <div className="w-full md:w-1/2 flex justify-center items-center relative group cursor-pointer mt-1 md:mt-0" onClick={() => navigate(`/product/${product.id}`)}>
                  
                  {/* Glowing Aura */}
                  <div className="absolute inset-0 bg-emerald-300/30 dark:bg-teal-400/20 blur-xl md:blur-2xl rounded-full scale-75 group-hover:scale-110 transition-transform duration-700"></div>
                  
                  {/* UNIFORM SHAPE BOX - Mobile me w-48 h-48, Desktop me w-[320px] */}
                  <div className="relative w-40 h-40 sm:w-56 sm:h-56 md:w-[300px] md:h-[300px] bg-white/90 dark:bg-white/10 backdrop-blur-md rounded-2xl md:rounded-[3rem] border border-white/80 dark:border-gray-700 shadow-xl md:shadow-2xl flex items-center justify-center p-4 md:p-6 transition-all duration-500 group-hover:bg-white dark:group-hover:bg-gray-800/60 group-hover:shadow-sky-500/20">
                    
                    {/* The Image inside the perfect box */}
                    <img 
                      src={product.imageUrl || product.image || product.thumbnail || "https://placehold.co/400x400/png?text=No+Image"} 
                      alt={product.name} 
                      className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] md:drop-shadow-[0_15px_25px_rgba(0,0,0,0.15)] transform transition-all duration-500 ease-out group-hover:scale-110 md:group-hover:scale-125 group-hover:-rotate-3 md:group-hover:-rotate-6 group-hover:-translate-y-2 md:group-hover:-translate-y-4 group-hover:drop-shadow-[0_20px_30px_rgba(16,185,129,0.3)]"
                    />
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Right Arrow (Hidden on Mobile) */}
        <button 
          onClick={nextSlide}
          className="absolute right-0 z-30 p-2 md:p-3 rounded-full bg-white/40 dark:bg-black/40 hover:bg-white/70 dark:hover:bg-black/70 backdrop-blur-md text-emerald-700 dark:text-emerald-400 transition-all focus:outline-none hidden sm:block shadow-md hover:scale-110"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>

      </div>

      {/* Dots Indicator - Mobile par thoda upar rakha hai taaki button me touch na ho */}
      <div className="mt-2 md:mt-5 flex justify-center space-x-2 md:space-x-3 relative z-30">
        {sliderProducts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 md:h-2.5 rounded-full transition-all duration-500 ${
              index === currentIndex ? "bg-gradient-to-r from-emerald-500 to-teal-500 w-6 md:w-8 shadow-md shadow-emerald-500/50" : "bg-gray-300 dark:bg-gray-600 w-2 md:w-2.5 hover:bg-emerald-300"
            }`}
          ></button>
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;