import { Link } from "react-router-dom";

const CategoryCard = ({ category }) => {
  // Extracting the icon component dynamically
  const Icon = category.icon;

  return (
    <Link 
      to={`/category/${category.value}`} 
      className="group relative overflow-hidden bg-white/50 dark:bg-[#111827]/40 border border-gray-200/80 dark:border-white/5 backdrop-blur-2xl rounded-[2rem] p-6 flex flex-col items-center justify-center gap-5 transition-all duration-500 hover:-translate-y-2 hover:bg-white dark:hover:bg-[#111827]/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.25)] cursor-pointer text-center"
    >
      {/* Subtle Background Glow that fades in on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 dark:to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      {/* Premium Icon Container - Apple-like Circle with 3D inner shadow */}
      <div className="relative z-10">
        
        {/* Animated Magic Glow exactly behind the icon */}
        <div className="absolute inset-0 bg-emerald-400/40 blur-[25px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150 pointer-events-none"></div>
        
        <div className="relative w-20 h-20 flex items-center justify-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] group-hover:border-emerald-300 dark:group-hover:border-emerald-500/50 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/20 transition-all duration-500">
          {Icon && (
            <div className="text-gray-500 dark:text-white/60 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transform group-hover:scale-110 transition-all duration-500">
              {/* Increased strokeWidth for a bolder, premium look */}
              <Icon size={34} strokeWidth={2} />
            </div>
          )}
        </div>
      </div>
      
      {/* Category Name */}
      <h3 className="text-gray-700 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-bold text-[14px] md:text-[15px] tracking-wide transition-colors duration-300 z-10 leading-snug px-2">
        {category.name}
      </h3>

      {/* Elegant Arrow indicator (Slides in on hover) */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-500">
        <span className="text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#111827] shadow-md dark:shadow-none p-1.5 rounded-full flex items-center justify-center border border-gray-100 dark:border-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
};

export default CategoryCard;