import { useState, useEffect } from "react"; 
import { useLoaderData } from "react-router-dom";
import ProductCard from "../components/ui/ProductCard";
import CategoryCard from "../components/ui/CategoryCard";
import { category } from "../utils/categories"; 
import { getTopSellingProducts } from "../services/productservices"; // Imported real top-selling function

const Home = () => {
  const products = useLoaderData();
  
  // ---------------------------------------------------------------------------
  // Component States
  // ---------------------------------------------------------------------------
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Real Top Products State
  const [topProducts, setTopProducts] = useState([]);
  const [isLoadingTopProducts, setIsLoadingTopProducts] = useState(true);
  
  // ---------------------------------------------------------------------------
  // Data Fetching & Slicing Logic
  // ---------------------------------------------------------------------------
  
  // Fetch real top selling products based on actual order history
  useEffect(() => {
    const fetchTopSellers = async () => {
      setIsLoadingTopProducts(true);
      const realTopSellers = await getTopSellingProducts();
      
      // Fallback to random/first 4 products if no orders exist in DB yet
      if (realTopSellers && realTopSellers.length > 0) {
        setTopProducts(realTopSellers.slice(0, 4));
      } else {
        setTopProducts(products.slice(0, 4));
      }
      setIsLoadingTopProducts(false);
    };

    fetchTopSellers();
  }, [products]);
  
  // Category toggle logic
  const displayedCategories = showAllCategories ? category : category.slice(0, 5);

  // Pagination configuration for All Products
  const productsPerPage = 8; 
  const totalPages = Math.max(1, Math.ceil(products.length / productsPerPage));
  const paginatedProducts = products.slice(
    (currentPage - 1) * productsPerPage, 
    currentPage * productsPerPage
  );

  // Scroll handler for pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const productsSection = document.getElementById("all-products-section");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-16 min-h-screen">

      {/* ----------------------------------------------------------------------
          Hero Section
      ---------------------------------------------------------------------- */}
      <section className="bg-gradient-to-r from-emerald-500/10 via-[#0a0f16] to-teal-500/10 rounded-[2.5rem] p-12 text-center shadow-[0_20px_60px_rgba(16,185,129,0.05)] border border-emerald-500/20 backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-lg bg-emerald-500/20 blur-[100px] pointer-events-none"></div>
        
        <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-sm relative z-10">
          Welcome to ShopIndia
        </h1>
        <p className="text-gray-300 font-medium tracking-wide max-w-2xl mx-auto text-lg relative z-10">
          Best deals • Fast delivery • Trusted service
          <br className="hidden md:block" /> 
          Shop from anywhere with absolute confidence.
        </p>
      </section>

      {/* ----------------------------------------------------------------------
          Top Selling Section (Real Data Integrated)
      ---------------------------------------------------------------------- */}
      <section>
        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
          <span className="text-3xl">🔥</span>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest">
            Top Selling Products
          </h2>
        </div>
        
        {isLoadingTopProducts ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-400"></div>
          </div>
        ) : topProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {topProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : null}
      </section>

      {/* ----------------------------------------------------------------------
          Categories Section
      ---------------------------------------------------------------------- */}
      <section>
        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
          <span className="text-3xl">📂</span>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest">
            Shop By Category
          </h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 transition-all duration-500">
          {displayedCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>

        {category.length > 5 && (
          <div className="flex justify-center mt-10">
            <button 
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 hover:text-emerald-300 font-bold py-3 px-8 rounded-xl transition-all shadow-lg flex items-center gap-3"
            >
              <span>{showAllCategories ? "Show Less" : "See All Categories"}</span>
              <span className="text-xl">{showAllCategories ? "↑" : "↓"}</span>
            </button>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------------
          All Products Section (Paginated)
      ---------------------------------------------------------------------- */}
      <section id="all-products-section" className="scroll-mt-24">
        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
          <span className="text-3xl">🛍️</span>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest">
            All Products
          </h2>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-gray-400 font-medium">No products currently available in the store.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>

            {/* Pagination Controls */}
            {products.length > productsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-12 px-6 py-4 bg-white/5 rounded-2xl border border-white/10 gap-4">
                <span className="text-sm text-gray-400 font-medium">
                  Page <span className="text-emerald-400">{currentPage}</span> of {totalPages} 
                  <span className="ml-2 hidden sm:inline-block">({products.length} Items Total)</span>
                </span>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all font-bold text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all font-bold text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

    </div>
  );
};

export default Home;