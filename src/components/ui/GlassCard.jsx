const GlassCard = ({ children, className = "" }) => {
    return (
        <div
            className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl ${className}`}
        >
            {children}
            
        </div>
    )
}

export default GlassCard;