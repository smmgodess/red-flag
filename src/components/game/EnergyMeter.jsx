import { useGameStore } from '../../store/gameStore';
import React, { useEffect, useState } from 'react';

export const EnergyMeter = () => {
  const {
    currentEnergy,
    maxEnergy,
    isPremiumActive,
    getTimeUntilNextEnergy,
    getCurrentPhase,
    currentLevel
  } = useGameStore();

  const [nextRegenTime, setNextRegenTime] = useState('');
  const [phase, setPhase] = useState(null);

  useEffect(() => {
    if (isPremiumActive) return;

    const updateTimer = () => {
      const timeData = getTimeUntilNextEnergy();
      const currentPhase = getCurrentPhase();

      setPhase(currentPhase);

      if (timeData && currentEnergy < maxEnergy) {
        const { minutes, seconds } = timeData;
        setNextRegenTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setNextRegenTime('FULL');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isPremiumActive, currentEnergy, maxEnergy, getTimeUntilNextEnergy, getCurrentPhase]);

  if (isPremiumActive) {
    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
          <span className="text-white font-bold text-sm">∞</span>
          <span className="text-white font-bold text-xs">UNLIMITED</span>
        </div>
    );
  }

  const energyPercentage = (currentEnergy / maxEnergy) * 100;
  const isLow = currentEnergy <= 20;
  const isCritical = currentEnergy === 0;

  return (
      <div className="relative group">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
            isCritical
                ? 'bg-red-900 border-red-500 animate-pulse'
                : isLow
                    ? 'bg-orange-900 border-orange-500'
                    : 'bg-gray-800 border-gray-600'
        }`}>
        <span className={`text-lg ${isCritical ? 'animate-bounce' : ''}`}>
          {isCritical ? '🔋' : '⚡'}
        </span>
          <div className="flex flex-col">
          <span className={`font-bold text-xs ${
              isCritical ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-white'
          }`}>
            {currentEnergy}/{maxEnergy}
          </span>
            {phase && (
                <span className="text-[8px] text-gray-400 uppercase tracking-wide">
              Lvl {currentLevel}
            </span>
            )}
          </div>
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
            {isCritical ? (
                <div className="text-center">
                  <span className="text-red-400 font-bold">Battery Dead!</span>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Next energy: {nextRegenTime}
                  </div>
                </div>
            ) : (
                <div>
                  {isLow && <span className="text-orange-400">Low Energy! </span>}
                  <div className="text-[10px] text-gray-400">
                    Next +1 in: {nextRegenTime}
                  </div>
                  {phase && (
                      <div className="text-[10px] text-purple-400 mt-1 border-t border-gray-700 pt-1">
                        Phase: {phase.levelRange[0]}-{phase.levelRange[1]} • Cost: {phase.msgCost || 'FREE'}
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>
  );
};