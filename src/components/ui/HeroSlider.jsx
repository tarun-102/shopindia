import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Flame, Sparkles, Zap, ShieldCheck, Truck, Star } from "lucide-react";

const HERO_SLIDES = [
  {
    id: 1,
    tag: "MEGA LAUNCH 2026",
    tagIcon: "🔥",
    offer: "UP TO 70% OFF",
    title: "Next-Gen Flagship Tech & AMOLED Devices",
    subtitle: "Experience hyper-speed 5G performance, cinematic AMOLED displays, AI smartwatches and premium wireless gear.",
    category: "smartphones",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=1600&auto=format&fit=crop",
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
    title: "Studio Acoustics & Active Noise Cancellation",
    subtitle: "Lossless Hi-Res audio drivers with 40-hour wireless playback, spatial 3D immersion and ultra-plush comfort.",
    category: "audio",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1600&auto=format&fit=crop",
    features: [
      { icon: "🚚", label: "Free Express Delivery" },
      { icon: "🛡️", label: "100% Original Tech" },
      { icon: "⭐", label: "4.9★ Top Rated" }
    ]
  },
  {
    id: 3,
    tag: "PRO BATTLESTATION",
    tagIcon: "⚡",
    offer: "NO COST EMI",
    title: "RTX Mechanical Rigs & 240Hz Pro Displays",
    subtitle: "Engineered for elite esports precision with liquid cooling, tactile mechanical key switches and zero input latency.",
    category: "laptops",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop",
    features: [
      { icon: "🚚", label: "Free Express Delivery" },
      { icon: "🛡️", label: "100% Original Tech" },
      { icon: "⭐", label: "4.9★ Top Rated" }
    ]
  },
  {
    id: 4,
    tag: "DAILY PANTRY & FOOD",
    tagIcon: "🍏",
    offer: "FLAT 5% GST EXEMPT DEALS",
    title: "Fresh Farm Groceries & Gourmet Pantry",
    subtitle: "Stock up on premium whole foods, aromatic spices, organic staples and cold-pressed cooking oils with instant delivery.",
    category: "groceries",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format&fit=crop",
    features: [
      { icon: "🚚", label: "Same-Day Dispatch" },
      { icon: "🌿", label: "100% Farm Fresh" },
      { icon: "⭐", label: "4.9★ Freshness Guarantee" }
    ]
  },
  {
    id: 5,
    tag: "COUTURE & CHRONOGRAPHS",
    tagIcon: "✨",
    offer: "TRENDING DEALS",
    title: "Luxury Timepieces & Contemporary Fashion",
    subtitle: "Make an unforgettable statement with handcrafted automatic chronographs, fine tailoring and designer accessories.",
    category: "mens-clothing",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1600&auto=format&fit=crop",
    features: [
      { icon: "🚚", label: "Free Express Delivery" },
      { icon: "🛡️", label: "100% Genuine Brand" },
      { icon: "⭐", label: "4.9★ Top Rated" }
    ]
  },
  {
    id: 6,
    tag: "SMART LIVING EXPO",
    tagIcon: "🏡",
    offer: "EXTRA ₹1500 CASHBACK",
    title: "Intelligent Home & Modern Appliances",
    subtitle: "Upgrade every room with robotic vacuum sweepers, digital air fryers, touch-sensor appliances and ambient LED lighting.",
    category: "home-appliances",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1600&auto=format&fit=crop",
    features: [
      { icon: "🚚", label: "Free Express Delivery" },
      { icon: "🛡️", label: "Brand Warranty" },
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
    <div className="relative w-full">
      {/* Ambient glow behind hero banner for a premium, non-boxy presence */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-pink-500/15 rounded-2xl sm:rounded-3xl blur-xl opacity-70 -z-10 pointer-events-none"></div>

      {/* Hero Banner Container: Fluid edge-to-edge on mobile, sleek rounded-2xl on desktop */}
      <div 
        className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl bg-[#090d16] border border-slate-800/40 shadow-xl select-none group transform-gpu"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Images with smooth GPU-accelerated cross-fade */}
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out will-change-transform ${
              idx === currentIndex ? "opacity-100 z-0" : "opacity-0 pointer-events-none"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              loading={idx === 0 ? "eager" : "lazy"}
              className="w-full h-full object-cover object-center sm:object-right md:object-center transform scale-102 group-hover:scale-100 transition-transform duration-700"
            />
          </div>
        ))}

        {/* Cinematic Studio Gradient: Text visibility on left with full photo brilliance on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/75 to-black/25 md:to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 z-10 pointer-events-none"></div>

        {/* Content Area */}
        <div className="relative z-20 min-h-[340px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[480px] flex flex-col justify-between p-5 sm:p-9 md:p-12 lg:p-14">
          
          {/* Top Badges & Main Typography */}
          <div className="space-y-3 sm:space-y-4 max-w-2xl pt-1">
            
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-[11px] sm:text-xs font-bold backdrop-blur-sm shadow-sm">
                <span>{currentSlide.tagIcon}</span>
                <span>{currentSlide.tag}</span>
              </span>

              <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
                {currentSlide.offer}
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[46px] font-black text-white leading-[1.12] tracking-tight drop-shadow-md">
              {currentSlide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-slate-200/90 text-xs sm:text-sm md:text-base font-normal max-w-xl leading-relaxed">
              {currentSlide.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => navigate(`/category/${currentSlide.category}`)}
                className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Collection</span>
                <ArrowRight size={15} />
              </button>

              <button
                onClick={scrollToDeals}
                className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-sm transition-all transform active:scale-95 cursor-pointer"
              >
                View Deals
              </button>
            </div>
          </div>

          {/* Bottom Features Strip */}
          <div className="pt-5 sm:pt-7 flex flex-wrap items-center gap-2 sm:gap-2.5">
            {currentSlide.features.map((feat, idx) => (
              <div 
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/50 text-slate-200 text-[11px] sm:text-xs font-medium backdrop-blur-sm shadow-sm"
              >
                <span>{feat.icon}</span>
                <span className={feat.label.includes("Rated") || feat.label.includes("Guarantee") ? "text-amber-300 font-bold" : ""}>
                  {feat.label}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* Micro Circular Nav Arrows */}
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/15 flex items-center justify-center transition-all shadow-md backdrop-blur-sm cursor-pointer hover:scale-105 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/15 flex items-center justify-center transition-all shadow-md backdrop-blur-sm cursor-pointer hover:scale-105 active:scale-95"
        >
          <ChevronRight size={20} />
        </button>

        {/* Sleek Pagination Bar */}
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? "w-6 sm:w-8 bg-indigo-500 shadow-sm"
                  : "w-2 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default HeroSlider;
