const Loader = () => {
    return (
        <div className="flex flex-col justify-center items-center h-60 gap-5 w-full">
            {/* Spinner Container */}
            <div className="relative flex justify-center items-center">
                {/* Outer Spinning Ring */}
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-500/20 border-t-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
                
                {/* Inner Pulsing Core */}
                <div className="absolute w-4 h-4 bg-teal-400 rounded-full animate-pulse shadow-lg shadow-teal-500/60"></div>
            </div>
            
            {/* Loading Text */}
            <span className="text-emerald-400/80 text-sm font-semibold tracking-[0.2em] animate-pulse">
                LOADING...
            </span>
        </div>
    );
}

export default Loader;