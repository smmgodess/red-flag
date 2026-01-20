import React, { useState, useEffect, useRef } from 'react';

export default function SwipeDeck({ personas, onLike, onPass, onDeckEmpty, isPremium, onRefresh, currentMatches }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentPersona = personas[currentIndex];
  const cardRef = useRef(null);
  const [dragStartX, setDragStartX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  const handleSwipe = (direction) => {
    if (isAnimating || !currentPersona) return;
    
    setIsAnimating(true);
    
    setTimeout(() => {
      if (direction === 'like') {
        onLike(currentPersona);
      } else {
        onPass(currentPersona);
      }
      
      if (currentIndex >= personas.length - 1) {
        onDeckEmpty();
      } else {
        setCurrentIndex(currentIndex + 1);
      }
      setIsAnimating(false);
    }, 300);
  };

  // Mouse drag controls
  const handleMouseDown = (e) => {
    if (isAnimating || !currentPersona) return;
    setDragStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || dragStartX === null) return;
    
    const deltaX = e.clientX - dragStartX;
    const threshold = 100; // Minimum drag distance to trigger swipe
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        handleSwipe('like');
      } else {
        handleSwipe('pass');
      }
      setIsDragging(false);
      setDragStartX(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartX(null);
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e) => {
    if (isAnimating || !currentPersona) return;
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    const threshold = 50; // Lower threshold for touch
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        handleSwipe('like');
      } else {
        handleSwipe('pass');
      }
      setTouchStartX(null);
    }
  };

  const handleTouchEnd = () => setTouchStartX(null);

  // Global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStartX]);

  // Touch event listeners
  useEffect(() => {
    if (touchStartX !== null) {
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [touchStartX]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isAnimating || !currentPersona) return;
      
      switch(event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handleSwipe('pass');
          break;
        case 'ArrowRight':
        case ' ':
          event.preventDefault();
          handleSwipe('like');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnimating, currentPersona, currentIndex, personas, onLike, onPass, onDeckEmpty]);

  if (!currentPersona || personas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-8">
        {/* Radar Animation */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-purple-200 rounded-full animate-ping"></div>
          <div className="absolute inset-0 w-32 h-32 bg-purple-300 rounded-full animate-pulse"></div>
          <div className="absolute inset-4 w-24 h-24 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute inset-8 w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">📡</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Scanning Area...</h2>
        <p className="text-slate-600 mb-6 text-center">No new profiles nearby.</p>
        
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-2xl hover:from-purple-700 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95"
        >
          Refresh Search
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      {/* Slots Counter */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-md border border-slate-200">
          <p className="text-sm font-medium text-slate-700">
            Slots: {currentMatches?.length || 0}/3
          </p>
        </div>
      </div>

      {/* Card Container */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <div className="relative w-full max-w-sm h-[70vh] mx-auto"> 
          {/* Background cards */}
          {personas.slice(currentIndex + 1, currentIndex + 3).map((persona, index) => (
            <div
              key={persona.id}
              className="absolute top-0 left-0 w-full h-full bg-white rounded-3xl shadow-2xl"
              style={{
                transform: `translateY(${(index + 1) * 8}px) scale(${1 - (index + 1) * 0.05})`,
                zIndex: 10 - index,
              }}
            />
          ))}

          {/* Current Card - FIX OVERLAY ISSUES */}
          <div
            ref={cardRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform cursor-grab active:cursor-grabbing ${
              isAnimating ? 'opacity-0 scale-95 rotate-3' : 'opacity-100 scale-100'
            }`}
            style={{ 
              zIndex: 10,
              touchAction: 'pan-y', // PREVENT DEFAULT TOUCH BEHAVIOR
            }}
          >
            {/* Full Bleed Image */}
            <div className="relative w-full h-full">
              <img
                src={currentPersona.avatar}
                alt={currentPersona.name}
                className="w-full h-full object-cover"
              />
              
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Fixed text overlay positioning */}
              <div className="absolute bottom-0 left-0 right-0 p-6 pb-16"> {/* INCREASED PADDING */}
                <div className="flex items-end justify-between text-white">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold">{currentPersona.name}, {currentPersona.age}</h2>
                    <p className="text-white/90 text-sm mt-1">{currentPersona.swipe_card.distance}</p>
                    <p className="text-white/80 text-xs mt-1">{currentPersona.job}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/90 text-sm font-medium">{currentPersona.swipe_card.anthem}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Flexbox based */}
      <div className="w-full px-6 pb-6 pt-4">
        <div className="flex justify-center gap-8">
          <button
            onClick={() => handleSwipe('pass')}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl active:shadow-md transition-all border-2 border-red-500/20 hover:border-red-500/40"
            aria-label="Pass"
          >
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => handleSwipe('like')}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl active:shadow-md transition-all border-2 border-purple-500/20 hover:border-purple-500/40"
            aria-label="Like"
          >
            <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Keyboard Instructions */}
      <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
        <p className="text-xs text-slate-500 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full inline-block shadow-sm">
          Use ← → to swipe {isPremium && " • Unlimited"}
        </p>
      </div>
    </div>
  );
}