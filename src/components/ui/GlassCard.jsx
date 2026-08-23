const GlassCard = ({ children, className = "", hoverEffect = false }) => {
    return (
        <div
            className={`
                backdrop-blur-xl rounded-2xl transition-all duration-300
                bg-white/90 dark:bg-slate-900/90 
                border border-gray-200/80 dark:border-slate-800 
                shadow-sm dark:shadow-md
                ${hoverEffect ? "hover:-translate-y-0.5 hover:shadow-lg hover:border-emerald-500/50 dark:hover:border-emerald-500/40" : ""} 
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default GlassCard;