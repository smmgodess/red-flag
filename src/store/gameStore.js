import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Energy System
  currentEnergy: 10,
  maxEnergy: 10,
  lastEnergyRegen: Date.now(),
  
  // Timer System
  premiumExpiry: null,
  isPremiumActive: false,
  
  // Visual Feedback
  coins: 100,
  showCoinAnimation: false,
  coinAnimationAmount: 0,
  
  // Actions
  consumeEnergy: () => {
    const state = get();
    if (state.isPremiumActive) return true; // Unlimited energy for premium
    
    if (state.currentEnergy <= 0) return false;
    
    set({ currentEnergy: state.currentEnergy - 1 });
    return true;
  },
  
  regenerateEnergy: () => {
    const state = get();
    if (state.isPremiumActive) return; // No regen needed for premium
    
    const now = Date.now();
    const timeSinceLastRegen = now - state.lastEnergyRegen;
    const regenInterval = 30 * 60 * 1000; // 30 minutes
    
    if (timeSinceLastRegen >= regenInterval && state.currentEnergy < state.maxEnergy) {
      set({
        currentEnergy: Math.min(state.currentEnergy + 1, state.maxEnergy),
        lastEnergyRegen: now
      });
    }
  },
  
  updatePremiumStatus: (expiry) => {
    const now = Date.now();
    const isActive = expiry && expiry > now;
    
    set({
      premiumExpiry: expiry,
      isPremiumActive: isActive
    });
  },
  
  addCoins: (amount) => {
    const state = get();
    set({
      coins: state.coins + amount,
      showCoinAnimation: true,
      coinAnimationAmount: amount
    });
    
    // Hide animation after 2 seconds
    setTimeout(() => {
      set({ showCoinAnimation: false });
    }, 2000);
  },
  
  spendCoins: (amount) => {
    const state = get();
    if (state.coins < amount) return false;
    
    set({ coins: state.coins - amount });
    return true;
  },
  
  // Initialize from localStorage
  initialize: () => {
    const saved = localStorage.getItem('gameStore');
    if (saved) {
      const data = JSON.parse(saved);
      set(data);
    }
    
    // Check energy regen on load
    get().regenerateEnergy();
  },
  
  // Save to localStorage
  save: () => {
    const state = get();
    localStorage.setItem('gameStore', JSON.stringify({
      currentEnergy: state.currentEnergy,
      maxEnergy: state.maxEnergy,
      lastEnergyRegen: state.lastEnergyRegen,
      premiumExpiry: state.premiumExpiry,
      isPremiumActive: state.isPremiumActive,
      coins: state.coins
    }));
  }
}));

// Auto-save every 30 seconds
setInterval(() => {
  useGameStore.getState().save();
}, 30000);

// Auto-regenerate energy every minute
setInterval(() => {
  useGameStore.getState().regenerateEnergy();
}, 60000);
