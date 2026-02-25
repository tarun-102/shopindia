import GlassCard from "./GlassCard"

function CategoryCard({category}) {
  return (
    <GlassCard className="p-4 text-center cursor-pointer hover:scale-105 transition">
        <div className="text-4xl mb-2">
            {category.icon}
        </div>
          <p className="font-semibold">
        {category.name}
      </p>
    </GlassCard>
  )
}

export default CategoryCard