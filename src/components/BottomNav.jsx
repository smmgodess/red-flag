import React from 'react';

export default function BottomNav({ currentView, onViewChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        <button
          onClick={() => onViewChange('swipe')}
          className={`flex flex-col items-center p-3 rounded-lg transition-all ${
            currentView === 'swipe' 
              ? 'text-purple-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {currentView === 'swipe' && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full"></div>
            )}
          </div>
          <span className="text-xs mt-1 font-medium">Swipe</span>
        </button>

        <button
          onClick={() => onViewChange('list')}
          className={`flex flex-col items-center p-3 rounded-lg transition-all ${
            currentView === 'list' || currentView === 'chat'
              ? 'text-purple-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {(currentView === 'list' || currentView === 'chat') && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full"></div>
            )}
          </div>
          <span className="text-xs mt-1 font-medium">Chat</span>
        </button>
      </div>
    </div>
  );
}
