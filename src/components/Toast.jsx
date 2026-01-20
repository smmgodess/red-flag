import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Styles based on type (success, error, or info)
  const styles = {
    info: "bg-slate-800 text-white border-purple-500",
    success: "bg-green-600 text-white border-green-400",
    error: "bg-red-600 text-white border-red-400",
    premium: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black border-yellow-200 font-bold"
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-sm px-4 pointer-events-none">
      <div className={`${styles[type]} px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-center border-2 animate-bounce-in`}>
        <span className="text-sm drop-shadow-md">{message}</span>
      </div>
    </div>
  );
}
