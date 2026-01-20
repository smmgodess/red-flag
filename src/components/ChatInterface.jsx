import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { TimerBar } from './game/TimerBar';
import { EnergyMeter } from './game/EnergyMeter';
import { CoinAnimation } from './game/CoinAnimation';
import { HapticFeedback } from './game/HapticFeedback';

export default function ChatInterface({ persona, onBack, messages, onSendMessage, onRevealRedFlag, isTyping }) {
  const [inputText, setInputText] = React.useState('');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [redFlagDetected, setRedFlagDetected] = useState(false);
  const messagesEndRef = useRef(null);

  const { 
    consumeEnergy, 
    currentEnergy, 
    isPremiumActive,
    addCoins 
  } = useGameStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]); 

  const handleSend = (e) => {
    e.preventDefault();
    
    // Check energy for non-premium users
    if (!isPremiumActive && !consumeEnergy()) {
      setShowRechargeModal(true);
      return;
    }
    
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
      
      // Random red flag detection for gamification
      if (Math.random() < 0.1) { // 10% chance
        setRedFlagDetected(true);
        addCoins(50); // Reward for detecting red flag
        setTimeout(() => setRedFlagDetected(false), 2000);
      }
    }
  };

  const handleRevealRedFlagClick = () => {
    setRedFlagDetected(true);
    onRevealRedFlag();
    setTimeout(() => setRedFlagDetected(false), 2000);
  };

  return (
    <HapticFeedback trigger={redFlagDetected}>
      <div className="flex flex-col h-full bg-slate-50 relative min-h-0">
        {/* TIMER BAR */}
        <TimerBar />
        
        {/* HEADER - Sticky header */}
        <div className="sticky top-0 bg-white px-4 py-3 shadow-sm border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
              ←
            </button>
            <div className="relative">
              <img src={persona.avatar} alt={persona.name} className="w-10 h-10 rounded-full object-cover" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">{persona.name}</h2>
              <p className="text-xs text-purple-600 font-medium">
                {isTyping ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <EnergyMeter />
            <button 
              onClick={handleRevealRedFlagClick}
              className="px-3 py-1 bg-red-50 text-red-500 text-xs font-bold rounded-full border border-red-100 animate-pulse"
            >
              🚩 REPORT
            </button>
          </div>
        </div>

        {/* MESSAGES AREA - Add min-h-0 for flex children scrolling in Safari */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 bg-slate-50 min-h-0 message-container">
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                   <img src={persona.avatar} className="w-8 h-8 rounded-full mr-2 self-end mb-1" alt="avatar" />
                )}
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm break-words ${
                  isUser 
                    ? 'bg-purple-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
                }`}>
                  {msg.text}
                  <p className={`text-[10px] mt-1 ${isUser ? 'text-purple-200' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            );
          })}

          {/* TYPING BUBBLES ANIMATION */}
          {isTyping && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
               <img src={persona.avatar} className="w-8 h-8 rounded-full mr-2 self-end mb-1" alt="avatar" />
               <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-none py-3 px-4 shadow-sm flex items-center gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* INPUT - Fixed to bottom with safe area insets */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-40 w-full max-w-[414px] mx-auto safe-area-inset-bottom">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className={`flex-1 bg-slate-100 border-none rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${
                !isPremiumActive && currentEnergy <= 0 ? 'opacity-50 blur-sm' : ''
              }`}
              disabled={!isPremiumActive && currentEnergy <= 0}
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || isTyping || (!isPremiumActive && currentEnergy <= 0)}
              className="bg-purple-600 text-white p-3 rounded-full font-bold shadow-lg disabled:opacity-50 disabled:shadow-none hover:scale-105 transition-all"
            >
              ➤
            </button>
          </form>
        </div>
      </div>
      
      {/* COIN ANIMATION */}
      <CoinAnimation />
    </HapticFeedback>
  );
}