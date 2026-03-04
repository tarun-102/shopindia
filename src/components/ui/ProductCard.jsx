import GlassCard from "./GlassCard";
import { formatPrice } from "../../utils/priceFormatter";
import { Link } from "react-router-dom";



function ProductCard({ product }) {

  return (
    <Link to={`/product/${product.id}`}>
          <GlassCard className="p-4 hover:scale-105 transition-transform duration-300 flex flex-col justify-between h-full">
      <div>
        <img
          src={product.thumbnail} 
          alt={product.title}
          className="h-40 w-full object-contain mb-4 rounded-lg"
        />
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-white">
          {product.title}
        </h3>
        <p className="text-yellow-400 font-bold text-lg">
          ₹ {formatPrice(product.price)}
        </p>
      </div>

      <button className="mt-4 w-full bg-white/10 border border-white/20 py-2 rounded-lg hover:bg-yellow-400 hover:text-black transition-all font-medium"  >
        Add to Cart 🛒
      </button>
    </GlassCard>
    </Link>
  );
}

export default ProductCard;