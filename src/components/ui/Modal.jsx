import React from 'react';

const Modal = ({ show, title, children, onClose }) => {
  if (!show) return null;
  
  return (
    // Premium Backdrop with Blur and Fade-in Animation
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in">
      
      {/* Modal Card - Glassmorphism Light/Dark Mode */}
      <div className="w-full max-w-md bg-white/95 dark:bg-[#0b1220]/90 backdrop-blur-3xl border border-gray-200/60 dark:border-white/10 rounded-[2rem] p-6 md:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] transform scale-100 animate-in zoom-in-95 duration-300 mx-4 transition-colors">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-wide transition-colors">
            {title}
          </h3>
          
          {/* Premium Interactive Close Button */}
          <button 
            onClick={onClose} 
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all duration-300 active:scale-90 focus:outline-none"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Children/Body Content */}
        <div className="text-gray-700 dark:text-gray-300 transition-colors">
          {children}
        </div>
        
      </div>
    </div>
  );
};

export default Modal;