const GlassCard = ({ children, className = "", hoverEffect = false }) => {
    return (
        <div
            className={`
                backdrop-blur-2xl rounded-[2rem] transition-all duration-500
                bg-white/70 dark:bg-white/5 
                border border-white/60 dark:border-white/10 
                shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
                ${hoverEffect ? "hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_15px_40px_rgba(16,185,129,0.2)] hover:border-emerald-400/50 dark:hover:border-emerald-500/40" : ""} 
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default GlassCard;