import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const CategoryCard = ({ category }) => {
  const Icon = category.icon;

  return (
    <Link 
      to={`/category/${category.value}`} 
      className="group bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 transition-all duration-300 hover:border-emerald-500/50 dark:hover:border-emerald-400/40 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          {Icon ? (
            <Icon size={22} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <span className="text-lg">🛍️</span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
            {category.name}
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">Explore deals</p>
        </div>
      </div>

      <div className="p-1 rounded-lg text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0">
        <ChevronRight size={16} />
      </div>
    </Link>
  );
};

export default CategoryCard;