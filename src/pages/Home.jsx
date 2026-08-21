import { useState, useEffect } from "react"; 
import { useLoaderData, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ui/ProductCard";
import CategoryCard from "../components/ui/CategoryCard";
import { category } from "../utils/categories"; 
import { getTopSellingProducts } from "../services/productservices"; 
import HeroSlider from "../components/ui/HeroSlider";

const Home = () => {
  const products = useLoaderData();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search")?.trim().toLowerCase() || "";
  const visibleProducts = searchQuery
    ? products.filter((product) => `${product.title} ${product.category}`.toLowerCase().includes(searchQuery))
    : products;
  
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [topProducts, setTopProducts] = useState([]);
  const [isLoadingTopProducts, setIsLoadingTopProducts] = useState(true);
  
  const displayedCategories = showAllCategories ? category : category.slice(0, 5);

  useEffect(() => {
    const fetchTopSellers = async () => {
      setIsLoadingTopProducts(true);
      const realTopSellers = await getTopSellingProducts();
      
      if (realTopSellers && realTopSellers.length > 0) {
        setTopProducts(realTopSellers.slice(0, 4));
      } else {
        setTopProducts(products.slice(0, 4));
      }
      setIsLoadingTopProducts(false);
    };
    fetchTopSellers();
  }, [products]);

  const productsPerPage = 8; 
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / productsPerPage));
  const displayedPage = Math.min(currentPage, totalPages);
  const paginatedProducts = visibleProducts.slice(
    (displayedPage - 1) * productsPerPage, 
    displayedPage * productsPerPage
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const productsSection = document.getElementById("all-products-section");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-1 md:p-8 space-y-8 md:space-y-16 min-h-screen transition-colors duration-500">

      {/* Hero Section */}
      <HeroSlider />

      {/* Top Selling Section */}
      <section>
        <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-gray-200 dark:border-white/5 pb-4 transition-colors">
          <span className="text-2xl md:text-3xl">🔥</span>
          <h2 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-widest">
            Top Selling
          </h2>
        </div>
        
        {isLoadingTopProducts ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 dark:border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400"></div>
          </div>
        ) : topProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
            {topProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : null}
      </section>

      {/* Categories Section */}
      <section>
        <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-gray-200 dark:border-white/5 pb-4 transition-colors">
          <span className="text-2xl md:text-3xl">📂</span>
          <h2 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-widest">
            Shop By Category
          </h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 md:gap-6 transition-all duration-500">
          {displayedCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>

        {category.length > 5 && (
          <div className="flex justify-center mt-8 md:mt-10">
            <button 
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold py-3 px-6 md:px-8 rounded-xl transition-all shadow-sm dark:shadow-lg flex items-center gap-2 md:gap-3 text-sm md:text-base"
            >
              <span>{showAllCategories ? "Show Less" : "See All Categories"}</span>
              <span className="text-lg md:text-xl">{showAllCategories ? "↑" : "↓"}</span>
            </button>
          </div>
        )}
      </section>

      {/* All Products Section */}
      <section id="all-products-section" className="scroll-mt-24">
        <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-gray-200 dark:border-white/5 pb-4 transition-colors">
          <span className="text-2xl md:text-3xl">🛍️</span>
          <h2 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-widest">
            All Products
          </h2>
        </div>
        
        {visibleProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 mx-4 md:mx-0 transition-colors">
            <p className="text-gray-500 dark:text-gray-400 font-medium">No products currently available in the store.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {paginatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>

            {/* Pagination Controls */}
            {visibleProducts.length > productsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 md:mt-12 px-4 md:px-6 py-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 gap-4 shadow-sm dark:shadow-none transition-colors">
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Page <span className="text-emerald-600 dark:text-emerald-400 font-bold">{displayedPage}</span> of {totalPages} 
                  <span className="ml-2 inline-block">({visibleProducts.length} Total)</span>
                </span>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handlePageChange(Math.max(displayedPage - 1, 1))}
                    disabled={displayedPage === 1}
                    className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all font-bold text-xs md:text-sm shadow-sm"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.min(displayedPage + 1, totalPages))}
                    disabled={displayedPage === totalPages}
                    className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all font-bold text-xs md:text-sm shadow-sm"
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