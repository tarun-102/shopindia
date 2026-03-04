import { useLoaderData } from "react-router-dom";
import ProductCard from "../components/ui/ProductCard";
import CategoryCard from "../components/ui/CategoryCard";
import { category } from "../utils/categories";


const Home = () => {

  const products = useLoaderData();
    
  
  // Top 4 products
  const topProducts = products.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto space-y-16">

      {/* ================= HERO ================= */}
      <section className="bg-white/10 rounded-2xl p-10 text-center">

        <h1 className="text-4xl font-bold mb-3">
          Welcome to ShopIndia.in
        </h1>

        <p className="text-white/70">
          Best Deals • Fast Delivery • Trusted Store
        </p>

      </section>

      {/* ================= TOP SELLING ================= */}
      <section>

        <h2 className="text-2xl font-bold mb-6">
          🔥 Top Selling Products
        </h2>

        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-4
          gap-6
        ">

          {topProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}

        </div>

      </section>

      {/* ================= CATEGORIES ================= */}
      <section>

        <h2 className="text-2xl font-bold mb-6">
          📂 Shop By Category
        </h2>

        <div className="
          grid
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-5
          gap-6
        ">

          {category.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}

        </div>

      </section>

      {/* ================= ALL PRODUCTS ================= */}
      <section>

        <h2 className="text-2xl font-bold mb-6">
          🛍️ All Products
        </h2>

        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          gap-6
        ">

          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}

        </div>

      </section>

    </div>
  );
};

export default Home;