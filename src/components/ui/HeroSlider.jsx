import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { getAllProducts } from "../../services/productservices";

const HeroSlider = () => {
  const [sliderProducts, setSliderProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  if (sliderProducts.length === 0) {
      return (
          <div className="min-h-[350px] flex items-center justify-center bg-gray-50 rounded-[1.5rem] md:rounded-[2.5rem]">
              <p className="text-gray-500 font-medium animate-pulse">Loading amazing deals...</p>
          </div>
      );
  }

  return (
    <section className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950 dark:via-[#0a0f16] dark:to-teal-950 rounded-[1.5rem] md:rounded-[2.5rem] p-4 py-8 md:p-12 shadow-2xl dark:shadow-[0_10px_40px_rgba(16,185,129,0.05)] border border-gray-200/80 dark:border-emerald-500/10 backdrop-blur-3xl relative overflow-hidden transition-colors duration-500 flex items-center justify-center min-h-[480px] md:min-h-[500px]">
      
      {/* Background Animated Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-3xl bg-emerald-400/10 dark:bg-emerald-500/10 blur-[80px] md:blur-[100px] pointer-events-none rounded-full animate-pulse"></div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-center">
        
        {/* Left Arrow (Hidden on Mobile) */}
        <button 
          onClick={prevSlide}
          className="absolute left-0 z-30 p-2 md:p-3 rounded-full bg-white/40 dark:bg-black/40 hover:bg-white/70 dark:hover:bg-black/70 backdrop-blur-md text-emerald-700 dark:text-emerald-400 transition-all focus:outline-none hidden sm:block shadow-md hover:scale-110"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>

        {/* Slides Container - Height optimized for vertical stacking on mobile */}
        <div className="w-full relative overflow-visible h-[420px] sm:h-[400px] md:h-[450px]">
          {sliderProducts.map((product, index) => {
            return (
              <div 
                key={product.id}
                className={`transition-all duration-700 ease-in-out absolute inset-0 w-full flex flex-col-reverse md:flex-row items-center justify-center md:justify-between gap-4 sm:gap-8 md:gap-12 px-2 sm:px-8 md:px-16 ${
                  index === currentIndex ? "opacity-100 translate-x-0 relative z-20" : "opacity-0 translate-x-16 hidden pointer-events-none"
                }`}
              >
                {/* Left Side: Text Content (Niche on mobile) */}
                <div className="text-center md:text-left w-full md:w-1/2 flex flex-col items-center md:items-start justify-center mt-2 md:mt-0">
                  
                  {product.discount && (
                    <span className="inline-block px-3 py-1 md:px-5 md:py-1.5 mb-2 md:mb-6 text-[10px] sm:text-xs md:text-sm font-bold text-emerald-800 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-full shadow-sm border border-emerald-200 dark:border-emerald-700/50">
                      🔥 UP TO {product.discount}% OFF
                    </span>
                  )}
                  
                  <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black mb-1.5 md:mb-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-300 dark:via-teal-200 dark:to-cyan-300 bg-clip-text text-transparent drop-shadow-sm leading-tight capitalize px-2 md:px-0">
                    {product.name}
                  </h1>
                  
                  <p className="text-gray-600 dark:text-gray-300 font-medium tracking-wide text-xs sm:text-sm md:text-lg leading-relaxed max-w-[280px] sm:max-w-md line-clamp-2 md:line-clamp-3">
                    {product.description || "Discover the best deals and premium quality products."}
                  </p>

                  {product.price && (
                    <div className="mt-2 md:mt-4 text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
                      ₹{product.price}
                    </div>
                  )}

                  <button 
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="mt-4 md:mt-8 px-6 py-2 md:px-8 md:py-3 text-sm md:text-base bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full font-bold shadow-lg shadow-emerald-500/30 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300"
                  >
                    Explore Now
                  </button>
                </div>

                {/* Right Side: PERFECT SHAPE IMAGE CONTAINER (Upar on mobile) */}
                <div className="w-full md:w-1/2 flex justify-center items-center relative group cursor-pointer mt-4 md:mt-0" onClick={() => navigate(`/product/${product.id}`)}>
                  
                  {/* Glowing Aura */}
                  <div className="absolute inset-0 bg-emerald-300/30 dark:bg-teal-400/20 blur-xl md:blur-2xl rounded-full scale-75 group-hover:scale-110 transition-transform duration-700"></div>
                  
                  {/* UNIFORM SHAPE BOX - Mobile me w-48 h-48, Desktop me w-[320px] */}
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-[320px] md:h-[320px] bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-[1.5rem] md:rounded-[3rem] border border-white/60 dark:border-gray-700 shadow-xl md:shadow-2xl flex items-center justify-center p-4 md:p-6 transition-all duration-500 group-hover:bg-white/60 dark:group-hover:bg-gray-800/60 group-hover:shadow-emerald-500/20">
                    
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
      <div className="absolute bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 md:space-x-3 z-30">
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