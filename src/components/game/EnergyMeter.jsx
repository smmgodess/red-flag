import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export const EnergyMeter = () => {
  const { 
    currentEnergy, 
    maxEnergy, 
    lastEnergyRegen, 
    isPremiumActive,
    regenerateEnergy 
  } = useGameStore();
  
  const [nextRegenTime, setNextRegenTime] = useState('');

  useEffect(() => {
    if (isPremiumActive) return;

    const calculateNextRegen = () => {
      const now = Date.now();
      const timeSinceLastRegen = now - lastEnergyRegen;
      const regenInterval = 30 * 60 * 1000; // 30 minutes
      const timeUntilNextRegen = Math.max(0, regenInterval - timeSinceLastRegen);
      
      const minutes = Math.floor(timeUntilNextRegen / (1000 * 60));
      const seconds = Math.floor((timeUntilNextRegen % (1000 * 60)) / 1000);
      
      setNextRegenTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateNextRegen();
    const interval = setInterval(calculateNextRegen, 1000);

    return () => clearInterval(interval);
  }, [lastEnergyRegen, isPremiumActive]);

  if (isPremiumActive) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
        <span className="text-white font-bold text-sm">∞</span>
        <span className="text-white font-bold text-xs">UNLIMITED</span>
      </div>
    );
  }

  const energyPercentage = (currentEnergy / maxEnergy) * 100;
  const isLow = currentEnergy <= 2;

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-600">
        <span className="text-yellow-400 text-lg">⚡</span>
        <span className={`font-bold text-sm ${isLow ? 'text-red-400' : 'text-white'}`}>
          {currentEnergy}/{maxEnergy}
        </span>
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {isLow && <span className="text-red-400">Low Energy! </span>}
          Next energy in: {nextRegenTime}
        </div>
        </div>
      </div>
    );
};
