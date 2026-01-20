import React from 'react';

export default function UpgradeModal({ onClose, onUpgrade }) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl max-w-md w-full p-8 shadow-2xl border border-yellow-600/30 relative overflow-hidden">
        {/* Premium Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-amber-600/10 rounded-3xl"></div>
        
        {/* Header */}
        <div className="relative text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">👑</span>
          </div>
          <h1 className="text-2xl font-bold text-yellow-500 tracking-wider">
            ACCESS DENIED
          </h1>
          <p className="text-gray-400 text-sm mt-2">CLEARANCE REQUIRED</p>
        </div>

        {/* The Offer */}
        <div className="relative space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-4">
              Unlock THE APEX PASS to:
            </h2>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 rounded-2xl border border-yellow-600/20">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="text-white font-semibold">UNLIMITED Chat Slots</p>
                <p className="text-gray-400 text-sm">Juggle 10+ dates at once</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 rounded-2xl border border-yellow-600/20">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="text-white font-semibold">DECODE SIGNALS</p>
                <p className="text-gray-400 text-sm">See exactly who likes you</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 rounded-2xl border border-yellow-600/20">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="text-white font-semibold">PRIORITY QUEUE</p>
                <p className="text-gray-400 text-sm">Personas reply 2x faster</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center p-6 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 rounded-2xl border border-yellow-600/30">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-500 line-through text-lg">$19.99</span>
              <span className="text-yellow-500 font-bold text-2xl">$9.99</span>
            </div>
            <p className="text-yellow-400 text-sm font-medium animate-pulse">Limited Time</p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onUpgrade}
          className="w-full mt-8 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 text-lg shadow-lg animate-pulse"
        >
          INSTANT UPGRADE
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-500 hover:text-gray-400 text-sm font-medium transition-colors"
        >
          No thanks, I prefer staying single
        </button>
      </div>
    </div>
  );
}
