import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductsByCategory } from "../services/productservices";
import ProductCard from "../components/ui/ProductCard";
import { ArrowLeft, Sparkles } from "lucide-react";

const CategoryPage = () => {
  const { categoryName } = useParams(); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      const data = await getProductsByCategory(categoryName);
      setProducts(data || []);
      setLoading(false);
    };
    
    fetchCategoryProducts();
    window.scrollTo(0, 0);
  }, [categoryName]); 

  const formattedCategoryTitle = categoryName ? categoryName.replace(/-/g, " ") : "Category";

  return (
    <div className="space-y-6 md:space-y-8 pb-12 transition-colors duration-300">
      
      {/* Category Header Area */}
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-slate-800 pb-4">
        <Link 
          to="/" 
          className="p-2 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl transition-colors shadow-sm"
          title="Go Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white capitalize">
            {formattedCategoryTitle}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {products.length} Products available in this collection
          </p>
        </div>
      </div>

      {/* Dynamic Content Rendering */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
          <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
            Loading products...
          </span>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-200 dark:border-slate-800 max-w-lg mx-auto">
          <span className="text-5xl block mb-3 opacity-60">📦</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">No products found</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            We currently don't have items in the <span className="text-emerald-600 dark:text-emerald-400 font-bold capitalize">{formattedCategoryTitle}</span> category.
          </p>
          <Link 
            to="/" 
            className="inline-block mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-all"
          >
            Browse All Categories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;