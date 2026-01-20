import React from 'react';

export default function RevealModal({ persona, onClose, onUpgrade }) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚩</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600">
            RED FLAG DETECTED
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Persona Info */}
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl">
            <img 
              src={persona.avatar} 
              alt={persona.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            />
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{persona.name}</h3>
              <p className="text-slate-600 text-sm">{persona.job}</p>
            </div>
          </div>

          {/* Red Flag Reveal */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="text-center mb-4">
              <p className="text-red-800 font-bold text-lg uppercase tracking-wider">
                {persona.red_flag_title}
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-red-100">
              <p className="text-slate-700 text-center font-medium">
                💡 <span className="italic">{persona.red_flag_clue}</span>
              </p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <span className="text-amber-600 text-lg">⚠️</span>
              <p className="text-amber-800 text-sm font-medium">
                You've uncovered the truth! This persona was designed to be manipulative.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mt-8">
          <button
            onClick={onClose}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-2xl transition-all"
          >
            Keep Chatting
          </button>
          
          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
          >
            Unlock All Truths ($4.99)
          </button>
        </div>
      </div>
    </div>
  );
}
