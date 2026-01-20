import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const HapticFeedback = ({ trigger, children }) => {
  const [isShaking, setIsShaking] = useState(false);

  const shakeScreen = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 300);
    
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  React.useEffect(() => {
    if (trigger) {
      shakeScreen();
    }
  }, [trigger]);

  return (
    <motion.div
      animate={isShaking ? {
        x: [-10, 10, -10, 10, -5, 5, 0],
        transition: { duration: 0.3 }
      } : {}}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};
