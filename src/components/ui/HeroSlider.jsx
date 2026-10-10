import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Flame, Sparkles, Zap, ShieldCheck, Truck, Star } from "lucide-react";

const HERO_SLIDES = [
  {
    id: 1,
    tag: "MEGA LAUNCH 2026",
    tagIcon: "🔥",
    offer: "UP TO 70% OFF",
    title: "Next-Gen Smart Living & Flagship Tech",
    subtitle: "Upgrade your everyday life with ultra-responsive AMOLED smartwatches, AI gadgets & premium accessories.",
    category: "smartphones",
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1600&auto=format&fit=crop",
    features: [
      { icon: "🚚", label: "Free Express Delivery" },
      { icon: "🛡️", label: "100% Original Tech" },
      { icon: "⭐", label: "4.9★ Top Rated" }
    ]
  },
  {
    id: 2,
    tag: "SOUND REVOLUTION",
    tagIcon: "🎧",
    offer: "FLAT 55% OFF",
    title: "Pure Studio Sound & Active Noise Cancellation",
    subtitle: "Feel every bassline with lossless Hi-Res acoustics, 40-hour wireless playtime and 360° spatial immersion.",
    category: "audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1600&auto=format&fit=crop",
    features: [
      { icon: "🚚", label: "Free Express Delivery" },
      { icon: "🛡️", label: "100% Original Tech" },
      { icon: "⭐", label: "4.9★ Top Rated" }
    ]
  },
  {
    id: 3,
    tag: "ULTIMATE GAMING FEST",
    tagIcon: "⚡",
    offer: "NO COST EMI",
    title: "Elite Mechanical Rigs & RTX Pro Laptops",
    subtitle: "Dominate every battlefield with 240Hz ultra-low latency displays, liquid cooling & tactile mechanical precision.",
    category: "gaming",
    image: "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?q=80&w=1600&auto=format&fit=crop",
    features: [
      { icon: "🚚", label: "Free Express Delivery" },
      { icon: "🛡️", label: "100% Original Tech" },
      { icon: "⭐", label: "4.9★ Top Rated" }
    ]
  },
  {
    id: 4,
    tag: "COUTURE & LIFESTYLE",
    tagIcon: "✨",
    offer: "TRENDING DEALS",
    title: "Contemporary Apparel & Designer Watches",
    subtitle: "Redefine your signature style with premium luxury fabrics, chronographs & handcrafted leather footwear.",
    category: "mens-clothing",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop",
    features: [
      { icon: "🚚", label: "Free Express Delivery" },
      { icon: "🛡️", label: "100% Original Tech" },
      { icon: "⭐", label: "4.9★ Top Rated" }
    ]
  },
  {
    id: 5,
    tag: "SMART LIVING EXPO",
    tagIcon: "🏡",
    offer: "EXTRA ₹1500 CASHBACK",
    title: "Intelligent Appliances & Home Makeover",
    subtitle: "Make everyday routines effortless with smart automated vacuums, modern kitchen essentials & air fryers.",
    category: "home-appliances",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1600&auto=format&fit=crop",
    features: [
      { icon: "🚚", label: "Free Express Delivery" },
      { icon: "🛡️", label: "100% Original Tech" },
      { icon: "⭐", label: "4.9★ Top Rated" }
    ]
  }
];

const HeroSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Auto-advance slides every 5.5s
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  };

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const distance = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 40) {
      if (distance < 0) nextSlide();
      else prevSlide();
    }
    setTouchStartX(null);
  };

  const scrollToDeals = () => {
    const dealsElem = document.getElementById("top-deals-section");
    if (dealsElem) {
      dealsElem.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollBy({ top: 520, behavior: "smooth" });
    }
  };

  const currentSlide = HERO_SLIDES[currentIndex];

  return (
    <div 
      className="relative w-full overflow-hidden rounded-3xl md:rounded-[32px] bg-black border border-slate-800/80 shadow-2xl transition-all select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Images with smooth cross-fade */}
      {HERO_SLIDES.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? "opacity-100 z-0" : "opacity-0 pointer-events-none"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center sm:object-right md:object-center transform scale-105 group-hover:scale-100 transition-transform duration-1000"
          />
        </div>
      ))}

      {/* Cinematic Studio Gradient Overlay — Ensures 100% clear text visibility on left and photo visibility on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-black/40 md:to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 z-10 pointer-events-none"></div>

      {/* Content Area */}
      <div className="relative z-20 min-h-[360px] sm:min-h-[420px] md:min-h-[460px] lg:min-h-[490px] flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-14">
        
        {/* Top Badges & Main Typography */}
        <div className="space-y-3 sm:space-y-4 max-w-2xl pt-2">
          
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-[11px] sm:text-xs font-bold backdrop-blur-md shadow-sm">
              <span>{currentSlide.tagIcon}</span>
              <span>{currentSlide.tag}</span>
            </span>

            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
              {currentSlide.offer}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[50px] font-black text-white leading-[1.1] tracking-tight drop-shadow-md">
            {currentSlide.title}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-xs sm:text-sm md:text-base font-normal max-w-xl leading-relaxed">
            {currentSlide.subtitle}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate(`/category/${currentSlide.category}`)}
              className="px-6 sm:px-7 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Collection</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={scrollToDeals}
              className="px-6 sm:px-7 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all transform active:scale-95 cursor-pointer"
            >
              View Deals
            </button>
          </div>
        </div>

        {/* Bottom Features Strip */}
        <div className="pt-6 sm:pt-8 flex flex-wrap items-center gap-2 sm:gap-3">
          {currentSlide.features.map((feat, idx) => (
            <div 
              key={idx}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-200 text-[11px] sm:text-xs font-medium backdrop-blur-md shadow-sm"
            >
              <span>{feat.icon}</span>
              <span className={feat.label.includes("Rated") ? "text-amber-300 font-bold" : ""}>
                {feat.label}
              </span>
            </div>
          ))}
        </div>

      </div>

      {/* Circular Nav Arrow: Left */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 flex items-center justify-center transition-all shadow-xl backdrop-blur-md cursor-pointer hover:scale-110 active:scale-95"
      >
        <ChevronLeft size={22} />
      </button>

      {/* Circular Nav Arrow: Right */}
      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 flex items-center justify-center transition-all shadow-xl backdrop-blur-md cursor-pointer hover:scale-110 active:scale-95"
      >
        <ChevronRight size={22} />
      </button>

      {/* Pagination Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIndex
                ? "w-7 sm:w-8 bg-blue-500 shadow-md shadow-blue-500/50"
                : "w-2 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

    </div>
  );
};

export default HeroSlider;