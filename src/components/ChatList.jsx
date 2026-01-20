import React from 'react';

export default function ChatList({ personas, onSelectChat, onUpgrade, isPremium }) {
  // SAFETY CHECK: If personas is undefined or not an array, render nothing (prevents crash)
  if (!personas || !Array.isArray(personas)) {
    return <div className="p-4 text-white">No matches yet. Swipe to find love!</div>;
  }

  return (
    <div className="h-full bg-slate-50 text-slate-800 p-4 overflow-y-auto pb-20">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 text-purple-900 tracking-tight">Messages</h1>
      
      {/* The Whale Trap (Renamed for Simplicity) */}
      <div 
        onClick={onUpgrade}
        className="flex items-center p-4 mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 cursor-pointer shadow-sm hover:shadow-md transition-all"
      >
        <div className="relative w-12 h-12 mr-4">
           <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 animate-ping"></div>
           <div className="relative w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center border-2 border-yellow-400 text-yellow-600 font-bold">
             3
           </div>
        </div>
        <div>
          {/* SIMPLIFIED COPY HERE */}
          <h3 className="font-bold text-slate-800">Secret Likes</h3>
          <p className="text-xs text-yellow-600 font-medium">3 people want to meet you</p>
        </div>
        <button className="ml-auto text-xs bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold">
          SEE THEM
        </button>
      </div>

      {/* The Chat List */}
      <div className="space-y-2">
        {personas.map((p) => (
          <div 
            key={p.id} 
            onClick={() => onSelectChat(p.id)}
            className={`flex items-center p-3 rounded-2xl border transition-all cursor-pointer ${
              p.is_fading 
                ? 'bg-gray-100 border-gray-200 opacity-60 grayscale' 
                : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-md'
            }`}
          >
            <div className="relative">
              <img 
                src={p.avatar} 
                alt={p.name} 
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" 
              />
              {p.is_fading && (
                 <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                   <span className="text-xs text-white">⌛</span>
                 </div>
              )}
            </div>
            
            <div className="flex-1 ml-4 overflow-hidden">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-slate-800 text-lg">
                  {p.name} 
                  {p.is_premium && <span className="ml-1 text-xs text-yellow-500">🔥</span>}
                </h3>
                <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                   {p.messages && p.messages.length > 0 
                     ? p.messages[p.messages.length - 1].timestamp 
                     : 'Now'}
                </span>
              </div>
              <p className={`text-sm truncate ${p.is_fading ? 'text-slate-400 italic' : 'text-slate-500'}`}>
                {p.is_fading 
                  ? "Connection lost..." 
                  : (p.messages && p.messages.length > 0 
                      ? p.messages[p.messages.length - 1].text 
                      : "Matched! Say hi.")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
