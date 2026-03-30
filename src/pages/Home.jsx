import { useState } from "react"; 
import { useLoaderData } from "react-router-dom";
import ProductCard from "../components/ui/ProductCard";
import CategoryCard from "../components/ui/CategoryCard";
import { category } from "../utils/categories"; 

const Home = () => {
  const products = useLoaderData();
  
  
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  // Top 4 products
  const topProducts = products.slice(0, 4);

  
  const displayedCategories = showAllCategories ? category : category.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-16">

      {/* ================= HERO ================= */}
      <section className="bg-white/10 rounded-2xl p-10 text-center shadow-xl border border-white/10">
        <h1 className="text-4xl font-bold mb-3 text-yellow-400">
          Welcome to ShopIndia.in
        </h1>
        <p className="text-white/70 font-semibold tracking-wide">
          Best Deals • Fast Delivery • Trusted Store
        </p>
      </section>

      {/* ================= TOP SELLING ================= */}
      <section>
        <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-2">
          🔥 Top Selling Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {topProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section>
        <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-2">
          📂 Shop By Category
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 transition-all duration-500">
          {/* 🔥 UPDATE: ab 'category' ki jagah 'displayedCategories' par map chalega */}
          {displayedCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>

        {/* 🔥 NAYA: SHOW MORE / SHOW LESS BUTTON */}
        <div className="flex justify-center mt-8">
          <button 
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-2 px-6 rounded-full transition-all shadow-lg flex items-center gap-2"
          >
            {showAllCategories ? "Show Less ⬆️" : "See All Categories ⬇️"}
          </button>
        </div>
      </section>

      {/* ================= ALL PRODUCTS ================= */}
      <section>
        <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-2">
          🛍️ All Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;