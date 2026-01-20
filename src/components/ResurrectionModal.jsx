import React from 'react';

export default function ResurrectionModal({ match, onClose, onResurrect, onLetGo }) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-red-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👻</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            CONNECTION LOST
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Match Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl">
            <img 
              src={match.avatar} 
              alt={match.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            />
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{match.name}</h3>
              <p className="text-gray-600 text-sm">{match.job}</p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <p className="text-red-800 text-center font-medium">
              {match.name} lost interest. He is swiping on other girls.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onResurrect}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 text-lg shadow-lg"
          >
            Boost Profile to Front of Queue ($0.99)
          </button>
          
          <button
            onClick={onLetGo}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-2xl transition-all"
          >
            Let him go
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-600 text-sm font-medium transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
