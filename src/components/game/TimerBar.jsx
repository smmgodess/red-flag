import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export const TimerBar = () => {
  const { premiumExpiry, isPremiumActive } = useGameStore();
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!premiumExpiry || isPremiumActive) return;

    const calculateTimeRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, premiumExpiry - now);
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [premiumExpiry, isPremiumActive]);

  if (isPremiumActive) {
    return (
      <div className="w-full h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">∞ PREMIUM</span>
        </div>
      </div>
    );
  }

  if (!premiumExpiry || timeRemaining <= 0) {
    return (
      <div className="w-full h-2 bg-red-600 rounded-full overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">EXPIRED</span>
        </div>
      </div>
    );
  }

  const totalMinutes = Math.floor(timeRemaining / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const percentage = Math.max(0, (timeRemaining / (24 * 60 * 60 * 1000)) * 100); // Assume 24h expiry

  const getBarColor = () => {
    if (percentage < 10) return 'bg-red-500';
    if (percentage < 30) return 'bg-orange-500';
    if (percentage < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden relative">
      <motion.div
        className={`h-full ${getBarColor()} transition-colors duration-300`}
        initial={{ width: '0%' }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: "linear" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white drop-shadow-lg">
          {hours}h {minutes}m
        </span>
      </div>
    </div>
  );
};
