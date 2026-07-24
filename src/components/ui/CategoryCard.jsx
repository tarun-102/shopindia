import { Link } from "react-router-dom";

const CategoryCard = ({ category }) => {
  return (
    <Link 
      to={`/category/${category.value}`} 
      className="group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 backdrop-blur-xl rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer text-center"
    >
      {/* Background Soft Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"></div>

      {/* Icon with Bounce & Tilt Animation */}
      <div className="text-5xl md:text-6xl transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 drop-shadow-lg z-10">
        {category.icon}
      </div>
      
      {/* Category Name */}
      <h3 className="text-gray-300 group-hover:text-emerald-400 font-bold text-sm md:text-base tracking-wider uppercase transition-colors duration-300 z-10 drop-shadow-md">
        {category.name}
      </h3>

      {/* Added Feature: Small Arrow indicator that appears on hover */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
        <span className="text-emerald-400 bg-emerald-400/10 p-1.5 rounded-full flex items-center justify-center backdrop-blur-sm border border-emerald-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
};

export default CategoryCard;