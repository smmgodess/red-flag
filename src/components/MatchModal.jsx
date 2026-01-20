import React from 'react';

export default function MatchModal({ match, userAvatar, onClose, onChat }) {
  if (!match) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm text-center">
        
        {/* THE DOPAMINE TEXT */}
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 italic mb-8 transform -rotate-6 animate-pulse">
          IT'S A MATCH!
        </h1>

        {/* THE AVATARS */}
        <div className="flex justify-center items-center gap-4 mb-10">
            {/* USER AVATAR (Now High Quality) */}
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-800 overflow-hidden shadow-2xl transform -rotate-12">
                <img 
                   src={userAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"} 
                   alt="You" 
                   className="w-full h-full object-cover"
                />
            </div>
            
            {/* Heart Icon in Middle */}
            <div className="text-4xl animate-bounce">💜</div>

            {/* Their Avatar */}
            <div className="w-24 h-24 rounded-full border-4 border-purple-500 overflow-hidden shadow-2xl shadow-purple-500/50 transform rotate-12">
                <img src={match.avatar} alt={match.name} className="w-full h-full object-cover"/>
            </div>
        </div>

        <p className="text-white text-lg font-medium mb-8">
          <span className="text-purple-400 font-bold">{match.name}</span> likes you too.
        </p>

        {/* BUTTONS */}
        <div className="space-y-4">
            <button 
                onClick={onChat}
                className="w-full py-4 bg-white text-purple-900 font-black rounded-full text-lg shadow-xl hover:scale-105 transition-transform"
            >
                SEND MESSAGE
            </button>

            <button 
                onClick={onClose}
                className="w-full py-4 border-2 border-white/30 text-white font-bold rounded-full text-lg hover:bg-white/10 transition-colors"
            >
                KEEP SWIPING
            </button>
        </div>
      </div>
    </div>
  );
}
