import { useState, useEffect, useMemo } from "react"; 
import { useLoaderData, useSearchParams, Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ui/ProductCard";
import CategoryCard from "../components/ui/CategoryCard";
import { category } from "../utils/categories"; 
import { getTopSellingProducts } from "../services/productservices"; 
import HeroSlider from "../components/ui/HeroSlider";
import { 
  Flame, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  CreditCard, 
  ChevronRight,
  ArrowUpDown,
  Search,
  X,
  SlidersHorizontal
} from "lucide-react";

const Home = () => {
  const products = useLoaderData() || [];
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("search")?.trim().toLowerCase() || "";
  
  const [sortBy, setSortBy] = useState("default");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [topProducts, setTopProducts] = useState([]);
  const [isLoadingTopProducts, setIsLoadingTopProducts] = useState(true);

  // Filter & Sort Products
  const visibleProducts = useMemo(() => {
    let result = searchQuery
      ? products.filter((product) => `${product.title} ${product.category} ${product.description}`.toLowerCase().includes(searchQuery))
      : products;

    if (sortBy === "price-low") {
      result = [...result].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price-high") {
      result = [...result].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === "discount") {
      result = [...result].sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0));
    } else if (sortBy === "rating") {
      result = [...result].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    return result;
  }, [products, searchQuery, sortBy]);

  // Reset page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const displayedCategories = showAllCategories ? category : category.slice(0, 8);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearSearch = () => {
    navigate("/");
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-12 transition-colors duration-300">

      {/* ================= IF SEARCH QUERY ACTIVE -> PRIORITIZE SEARCH RESULTS AT THE TOP ================= */}
      {searchQuery ? (
        <section className="space-y-5 animate-fade-in pt-1">
          
          {/* Search Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Search size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-xl font-black text-gray-900 dark:text-white">
                    Search Results for <span className="text-emerald-600 dark:text-emerald-400">"{searchQuery}"</span>
                  </h1>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Found <span className="font-bold text-gray-900 dark:text-white">{visibleProducts.length}</span> matching products
                </p>
              </div>
            </div>

            {/* Sort Dropdown & Clear Search Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs flex-1 sm:flex-none">
                <SlidersHorizontal size={14} className="text-gray-400 shrink-0" />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer text-xs"
                >
                  <option value="default" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Featured</option>
                  <option value="price-low" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Price: Low to High</option>
                  <option value="price-high" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Price: High to Low</option>
                  <option value="discount" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Highest Discount</option>
                  <option value="rating" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Customer Rating</option>
                </select>
              </div>

              <button
                onClick={clearSearch}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                <X size={14} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Results Grid */}
          {visibleProducts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-200 dark:border-slate-800 max-w-lg mx-auto">
              <span className="text-5xl block mb-3 opacity-60">🔍</span>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">No products matched "{searchQuery}"</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Check for typos or try searching with a more general keyword.
              </p>
              <button 
                onClick={clearSearch} 
                className="mt-4 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                View All Products
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {paginatedProducts.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>

              {/* Pagination */}
              {visibleProducts.length > productsPerPage && (
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                    Showing Page <span className="text-emerald-600 dark:text-emerald-400 font-bold">{displayedPage}</span> of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(Math.max(displayedPage - 1, 1))}
                      disabled={displayedPage === 1}
                      className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-white font-bold text-xs disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => handlePageChange(Math.min(displayedPage + 1, totalPages))}
                      disabled={displayedPage === totalPages}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-xs disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </section>
      ) : (
        /* ================= STANDARD HOMEPAGE VIEW (WHEN NOT SEARCHING) ================= */
        <>
          {/* 1. Mobile App Category Quick-Rail */}
          <section className="w-full -mx-3 sm:mx-0 px-3 sm:px-0">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar pt-1">
              {category.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.value}`}
                    className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-center p-2 group-hover:border-emerald-500 dark:group-hover:border-emerald-400 group-hover:shadow-md transition-all">
                      {Icon ? (
                        <Icon size={26} className="text-gray-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                      ) : (
                        <span className="text-xl">🛍️</span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-center max-w-[68px] truncate">
                      {cat.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 2. Deals Hero Slider */}
          <HeroSlider />

          {/* 3. Trust Features Strip */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 shadow-sm">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Free Fast Shipping</h4>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">On all orders across India</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 shadow-sm">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">100% Genuine</h4>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">Directly from verified brands</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 shadow-sm">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <RefreshCw size={20} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">7-Day Easy Returns</h4>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">Hassle-free refunds & exchange</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-800 shadow-sm">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <CreditCard size={20} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Secure Checkout</h4>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">UPI, Cards, Wallet & COD</p>
              </div>
            </div>
          </section>

          {/* 4. Top Selling Deals */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                  <Flame size={20} />
                </div>
                <h2 className="text-base sm:text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                  Top Selling Deals
                </h2>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Limited Time Offers
              </span>
            </div>
            
            {isLoadingTopProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-gray-100 dark:bg-slate-850 animate-pulse"></div>
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5">
                {topProducts.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            ) : null}
          </section>

          {/* 5. Popular Categories */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-base sm:text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                  Explore Popular Categories
                </h2>
              </div>
              <button 
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{showAllCategories ? "Show Less" : "View All"}</span>
                <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
              {displayedCategories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </section>

          {/* 6. All Products Catalog with Sorting Controls */}
          <section id="all-products-section" className="space-y-4 scroll-mt-24">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛍️</span>
                <h2 className="text-base sm:text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                  All Products
                </h2>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                  <SlidersHorizontal size={13} className="text-gray-400" />
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer text-xs"
                  >
                    <option value="default" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Featured</option>
                    <option value="price-low" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Price: Low to High</option>
                    <option value="price-high" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Price: High to Low</option>
                    <option value="discount" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Highest Discount</option>
                    <option value="rating" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Customer Rating</option>
                  </select>
                </div>
              </div>
            </div>
            
            {visibleProducts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-200 dark:border-slate-800">
                <span className="text-5xl block mb-3 opacity-60">🛍️</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No products currently available</h3>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {paginatedProducts.map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
                </div>

                {/* Pagination */}
                {visibleProducts.length > productsPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-4 py-3 bg-white dark:bg-slate-900/90 rounded-xl border border-gray-200 dark:border-slate-800 gap-3 shadow-sm">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 font-medium">
                      Showing Page <span className="text-emerald-600 dark:text-emerald-400 font-bold">{displayedPage}</span> of {totalPages}
                    </span>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handlePageChange(Math.max(displayedPage - 1, 1))}
                        disabled={displayedPage === 1}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(Math.min(displayedPage + 1, totalPages))}
                        disabled={displayedPage === totalPages}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs shadow-md"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

    </div>
  );
};

export default Home;