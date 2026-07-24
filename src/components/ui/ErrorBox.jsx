const ErrorBox = ({ message }) => {
  return (
    <div className="flex justify-center items-center py-12 px-4 w-full">
      <div className="bg-rose-500/10 border border-rose-500/30 backdrop-blur-xl rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 max-w-lg w-full shadow-lg shadow-rose-500/5 animate-fade-in">
        
        {/* Alert Warning Icon */}
        <div className="bg-rose-500/20 p-3 rounded-full text-rose-400 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        {/* Error Message Details */}
        <div className="text-center sm:text-left">
          <h3 className="text-rose-400 font-bold text-lg tracking-wide mb-1">
            Error
          </h3>
          <p className="text-rose-200/80 text-sm leading-relaxed">
            {message || "An unexpected error occurred. Please try again."}
          </p>
        </div>

      </div>
    </div>
  );
};

export default ErrorBox;