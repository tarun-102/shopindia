import { Link } from "react-router-dom";

const CategoryCard = ({ category }) => {
  return (
    
    <Link 
      to={`/category/${category.value}`} 
      className="bg-white/10 hover:bg-white/20 border border-white/10 hover:border-yellow-400 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 shadow-xl cursor-pointer text-center"
    >
      <span className="text-4xl md:text-5xl">{category.icon}</span>
      <h3 className="text-white font-bold text-sm md:text-base tracking-wide">
        {category.name}
      </h3>
    </Link>
  );
};

export default CategoryCard;