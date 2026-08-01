import React from 'react';

const Modal = ({ show, title, children, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-[#0b1220] border border-white/8 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✖</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
