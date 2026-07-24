const GlassCard = ({ children, className = "", hoverEffect = false }) => {
    return (
        <div
            className={`
                bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl 
                shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] 
                ${hoverEffect ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/20 hover:border-emerald-500/40" : ""} 
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default GlassCard;