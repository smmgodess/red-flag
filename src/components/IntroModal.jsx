import React from 'react';

export default function IntroModal({ onStart }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚩</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Digital Lust
          </h1>
          <p className="text-slate-600 mt-2">Digital Lust Dating Experience</p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <p className="text-slate-800 text-center text-lg font-medium">
              Welcome to the ultimate dating simulation! 🎯
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">How to Play:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="text-slate-800 font-medium">Swipe through profiles</p>
                  <p className="text-slate-600 text-sm">Right to like, Left to pass</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="text-slate-800 font-medium">Spot the red flags</p>
                  <p className="text-slate-600 text-sm">Each profile has warning signs</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="text-slate-800 font-medium">Chat and detect lies</p>
                  <p className="text-slate-600 text-sm">Can you identify the manipulators?</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <span className="text-amber-600 text-lg">⚠️</span>
              <p className="text-amber-800 text-sm font-medium">
                These personas are designed to be manipulative. Stay sharp!
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onStart}
          className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 text-lg shadow-lg"
        >
          Start Matching
        </button>
      </div>
    </div>
  );
}
