import { create } from 'zustand';

// Game progression phases
const PHASES = {
  THE_HOOK: {
    levelRange: [1, 3],
    msgCost: 0,
    lossPenalty: 0,
    refillSpeedMultiplier: 10.0,
    description: "Infinite play. Get them addicted to the chat interface."
  },
  THE_HABIT: {
    levelRange: [4, 7],
    msgCost: 2,
    lossPenalty: 25,
    refillSpeedMultiplier: 1.0,
    description: "Friction introduced. 50 messages per bar. Losing hurts (25% drain)."
  },
  THE_STARVE: {
    levelRange: [8, 10],
    msgCost: 5,
    lossPenalty: 100,
    refillSpeedMultiplier: 0.25,
    description: "Whale territory. Losing = Instant Energy Zero. Refill takes 4 hours. Forces payment."
  }
};

export const useGameStore = create((set, get) => ({
  // Energy System
  currentEnergy: 100,
  maxEnergy: 100,
  lastEnergyRegen: Date.now(),

  // Progression System
  currentLevel: 1,
  lossStreak: 0,
  totalGamesPlayed: 0,
  totalGamesWon: 0,
  isPayingUser: false,

  // Timer System
  premiumExpiry: null,
  isPremiumActive: false,

  // Visual Feedback
  coins: 100,
  showCoinAnimation: false,
  coinAnimationAmount: 0,

  // Mercy System
  mercyGiftClaimed: false,
  lastMercyGiftTime: null,

  // Get current phase based on level
  getCurrentPhase: () => {
    const state = get();
    const level = state.currentLevel;

    if (level >= 1 && level <= 3) return PHASES.THE_HOOK;
    if (level >= 4 && level <= 7) return PHASES.THE_HABIT;
    if (level >= 8 && level <= 10) return PHASES.THE_STARVE;

    return PHASES.THE_STARVE; // Default to hardest phase
  },

  // Get message cost based on current phase
  getMessageCost: () => {
    const state = get();
    if (state.isPremiumActive) return 0;

    const phase = state.getCurrentPhase();
    return phase.msgCost;
  },

  // Actions
  consumeEnergy: () => {
    const state = get();
    if (state.isPremiumActive) return true; // Unlimited energy for premium

    const cost = state.getMessageCost();

    // THE_HOOK phase - free messages
    if (cost === 0) return true;

    if (state.currentEnergy < cost) {
      // Trigger zero energy event
      state.logEvent('energy_drained_to_zero');
      state.checkMercyAlgorithm();
      return false;
    }

    set({ currentEnergy: Math.max(0, state.currentEnergy - cost) });
    state.save();
    return true;
  },

  regenerateEnergy: () => {
    const state = get();
    if (state.isPremiumActive) return; // No regen needed for premium
    if (state.currentEnergy >= state.maxEnergy) return; // Already full

    const now = Date.now();
    const timeSinceLastRegen = now - state.lastEnergyRegen;
    const phase = state.getCurrentPhase();

    // Base refill: 1 energy per 5 minutes (300 seconds)
    const baseRegenInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    const adjustedRegenInterval = baseRegenInterval / phase.refillSpeedMultiplier;

    if (timeSinceLastRegen >= adjustedRegenInterval) {
      const energyToAdd = Math.floor(timeSinceLastRegen / adjustedRegenInterval);

      set({
        currentEnergy: Math.min(state.currentEnergy + energyToAdd, state.maxEnergy),
        lastEnergyRegen: now
      });
      state.save();
    }
  },

  // Handle game loss
  handleGameLoss: () => {
    const state = get();
    if (state.isPremiumActive) return;

    const phase = state.getCurrentPhase();
    const penaltyAmount = Math.floor((state.maxEnergy * phase.lossPenalty) / 100);

    set({
      currentEnergy: Math.max(0, state.currentEnergy - penaltyAmount),
      lossStreak: state.lossStreak + 1,
      totalGamesPlayed: state.totalGamesPlayed + 1
    });

    if (state.currentEnergy === 0) {
      state.logEvent('energy_drained_to_zero');
      state.checkMercyAlgorithm();
    }

    state.save();
  },

  // Handle game win
  handleGameWin: () => {
    const state = get();

    set({
      lossStreak: 0,
      totalGamesPlayed: state.totalGamesPlayed + 1,
      totalGamesWon: state.totalGamesWon + 1
    });

    // Level up logic
    if (state.totalGamesWon % 3 === 0 && state.currentLevel < 10) {
      set({ currentLevel: state.currentLevel + 1 });
    }

    state.save();
  },

  // Mercy Algorithm
  checkMercyAlgorithm: () => {
    const state = get();

    const shouldTriggerMercy =
        state.lossStreak >= 3 &&
        state.currentEnergy === 0 &&
        !state.isPayingUser &&
        !state.mercyGiftClaimed;

    if (shouldTriggerMercy) {
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      // Only give mercy once per day
      if (!state.lastMercyGiftTime || state.lastMercyGiftTime < oneDayAgo) {
        set({
          currentEnergy: 15,
          mercyGiftClaimed: true,
          lastMercyGiftTime: now,
          lossStreak: 0
        });

        state.logEvent('mercy_gift_claimed');
        state.save();

        return {
          triggered: true,
          message: "🍀 Lucky Find! You found a backup battery. +15 Energy."
        };
      }
    }

    return { triggered: false };
  },

  // Refill energy (for purchases/ads)
  refillEnergy: (amount = null) => {
    const state = get();
    const refillAmount = amount || state.maxEnergy;

    set({
      currentEnergy: Math.min(state.currentEnergy + refillAmount, state.maxEnergy),
      mercyGiftClaimed: false
    });

    state.save();
  },

  // Watch ad for energy
  watchAdForEnergy: () => {
    const state = get();
    const adReward = 20; // 20 energy per ad

    set({
      currentEnergy: Math.min(state.currentEnergy + adReward, state.maxEnergy)
    });

    state.logEvent('ad_watch_complete');
    state.save();

    return adReward;
  },

  updatePremiumStatus: (expiry) => {
    const now = Date.now();
    const isActive = expiry && expiry > now;

    set({
      premiumExpiry: expiry,
      isPremiumActive: isActive,
      isPayingUser: true
    });

    state.save();
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

    state.save();
  },

  spendCoins: (amount) => {
    const state = get();
    if (state.coins < amount) return false;

    set({ coins: state.coins - amount });
    state.save();
    return true;
  },

  // Event logging (for Supabase integration)
  logEvent: (eventName, metadata = {}) => {
    const state = get();

    const event = {
      event_name: eventName,
      timestamp: new Date().toISOString(),
      user_level: state.currentLevel,
      current_energy: state.currentEnergy,
      loss_streak: state.lossStreak,
      is_paying_user: state.isPayingUser,
      ...metadata
    };

    // Store events in localStorage for now (can be synced to Supabase later)
    const events = JSON.parse(localStorage.getItem('gameEvents') || '[]');
    events.push(event);
    localStorage.setItem('gameEvents', JSON.stringify(events.slice(-100))); // Keep last 100 events

    // Check for churn risk
    if (eventName === 'energy_drained_to_zero' && state.lossStreak >= 2) {
      state.logEvent('churn_risk_detected', { risk_level: 'high' });
    }
  },

  // Get time until next energy point
  getTimeUntilNextEnergy: () => {
    const state = get();
    if (state.isPremiumActive || state.currentEnergy >= state.maxEnergy) {
      return null;
    }

    const now = Date.now();
    const timeSinceLastRegen = now - state.lastEnergyRegen;
    const phase = state.getCurrentPhase();
    const baseRegenInterval = 5 * 60 * 1000;
    const adjustedRegenInterval = baseRegenInterval / phase.refillSpeedMultiplier;

    const timeUntilNext = Math.max(0, adjustedRegenInterval - timeSinceLastRegen);

    return {
      milliseconds: timeUntilNext,
      minutes: Math.floor(timeUntilNext / (1000 * 60)),
      seconds: Math.floor((timeUntilNext % (1000 * 60)) / 1000)
    };
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
      currentLevel: state.currentLevel,
      lossStreak: state.lossStreak,
      totalGamesPlayed: state.totalGamesPlayed,
      totalGamesWon: state.totalGamesWon,
      isPayingUser: state.isPayingUser,
      premiumExpiry: state.premiumExpiry,
      isPremiumActive: state.isPremiumActive,
      coins: state.coins,
      mercyGiftClaimed: state.mercyGiftClaimed,
      lastMercyGiftTime: state.lastMercyGiftTime
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