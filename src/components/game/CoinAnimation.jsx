import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export const CoinAnimation = () => {
  const { showCoinAnimation, coinAnimationAmount } = useGameStore();

  return (
    <AnimatePresence>
      {showCoinAnimation && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: [0, -50, -100, -150],
            scale: [0.5, 1.2, 1, 0.8]
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ 
            duration: 2,
            ease: "easeOut",
            times: [0, 0.1, 0.5, 1]
          }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-lg shadow-lg">
            <span>🪙</span>
            <span>+{coinAnimationAmount}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
