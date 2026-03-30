import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductsByCategory } from "../services/productservices";
import ProductCard from "../components/ui/ProductCard";

const CategoryPage = () => {
  
  const { categoryName } = useParams(); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8">
      
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <Link to="/" className="text-gray-400 hover:text-yellow-400 transition text-2xl">
          ← Back
        </Link>
        <h1 className="text-3xl font-black text-white uppercase tracking-wider">
          {categoryName.replace("-", " ")}
        </h1>
      </div>

      {loading ? (
        <div className="text-center text-yellow-400 text-2xl font-bold py-20 animate-pulse">
          Loading Products... ⏳
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
          <span className="text-6xl block mb-4">😢</span>
          <h2 className="text-2xl font-bold text-white mb-2">No products found!</h2>
          <p className="text-gray-400">Not Product Added </p>
        </div>
      ) : (
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