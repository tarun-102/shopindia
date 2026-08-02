import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductsByCategory } from "../services/productservices";
import ProductCard from "../components/ui/ProductCard";

const CategoryPage = () => {
  const { categoryName } = useParams(); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products whenever the category in the URL changes
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      const data = await getProductsByCategory(categoryName);
      setProducts(data);
      setLoading(false);
    };
    
    fetchCategoryProducts();
    window.scrollTo(0, 0);
  }, [categoryName]); 

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8 min-h-[80vh] transition-colors duration-500">
      
      {/* Category Header Area */}
      <div className="flex items-center gap-5 border-b border-gray-200 dark:border-white/10 pb-6 transition-colors">
        <Link 
          to="/" 
          className="w-11 h-11 bg-white dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/40 rounded-xl flex items-center justify-center transition-all shadow-sm"
          title="Go Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-500 bg-clip-text text-transparent">
          {categoryName ? categoryName.replace(/-/g, " ") : "Category"}
        </h1>
      </div>

      {/* Dynamic Content Rendering */}
      {loading ? (
        // Premium Loading State
        <div className="flex flex-col justify-center items-center py-24 gap-5">
           <div className="relative flex justify-center items-center">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-200 dark:border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] dark:shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
              <div className="absolute w-4 h-4 bg-teal-500 dark:bg-teal-400 rounded-full animate-pulse shadow-lg shadow-teal-500/60"></div>
           </div>
           <span className="text-emerald-700 dark:text-emerald-400/80 text-sm font-semibold tracking-[0.2em] animate-pulse">
              LOADING PRODUCTS...
           </span>
        </div>
      ) : products.length === 0 ? (
        // Premium Empty State
        <div className="text-center py-24 bg-white dark:bg-[#111827]/80 backdrop-blur-2xl rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-xl mx-auto max-w-3xl transition-colors">
          <span className="text-7xl block mb-6 opacity-80 grayscale">📦</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No products found</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            We couldn't find any products in the <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{categoryName.replace(/-/g, " ")}</span> category right now. 
            Please check back later or explore other items.
          </p>
          <Link 
            to="/" 
            className="inline-block mt-8 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-800 dark:text-white border border-gray-200 dark:border-white/10 font-bold px-8 py-3 rounded-xl transition-all shadow-sm"
          >
            Browse All Categories
          </Link>
        </div>
      ) : (
        // Product Grid Layout
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;