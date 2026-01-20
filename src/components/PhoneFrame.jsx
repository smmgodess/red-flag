import React from 'react';

const PhoneFrame = ({ children }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="relative w-full max-w-[414px] h-[calc(100vh-2rem)] mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        {/* Phone notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-xl z-50"></div>
        
        {/* Content area with safe insets */}
        <div className="h-full flex flex-col overflow-hidden">
          {/* Status bar area */}
          <div className="h-6 flex items-center justify-between px-4 pt-6 pb-2 text-xs text-gray-600">
            <span>9:41</span>
            <div className="flex items-center space-x-1">
              <span className="text-xs">📶</span>
              <span className="text-xs">🔋</span>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 overflow-hidden relative">
            {children}
          </div>
          
          {/* Home indicator */}
          <div className="h-2 flex justify-center items-center pb-2">
            <div className="w-1/3 h-1 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneFrame;
