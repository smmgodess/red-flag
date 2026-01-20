import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding'; // New Onboarding
import SwipeDeck from './components/SwipeDeck';
import ChatList from './components/ChatList';
import ChatInterface from './components/ChatInterface';
import RevealModal from './components/RevealModal';
import UpgradeModal from './components/UpgradeModal';
import ResurrectionModal from './components/ResurrectionModal';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast'; // <--- IMPORT THE NEW TOAST
import MatchModal from './components/MatchModal'; // <--- IMPORT MATCH MODAL
import { getDeepSeekReply } from './utils/aiLogic'; // Import new function
import { userService } from './services/userService'; // Import user service for data logging
import { useGameStore } from './store/gameStore'; // Import game store
import rawData from './data/personas.json';

function App() {
  // --- PATCH START ---
  // Initialize activePersona. 
  // Change 'default' to whatever mode you want to start in (e.g., 'user', 'admin', 'matchmaker')
  const [activePersona, setActivePersona] = useState(null); 
  // --- PATCH END ---

  // Initialize game store
  const { initialize, updatePremiumStatus, addCoins } = useGameStore();

  // TODO: Move to .env for production
  const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
  
  const [view, setView] = useState('intro');
  const [activePersonaId, setActivePersonaId] = useState(null);
  const [typingPersonaId, setTypingPersonaId] = useState(null); // Typing indicator state

  // NEW ONBOARDING STATE
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userProfile, setUserProfile] = useState(null); // Stores Name, Gender, Avatar
  const [userId, setUserId] = useState(() => {
    // Generate or retrieve user ID from localStorage
    let id = localStorage.getItem('userId');
    if (!id) {
      id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', id);
    }
    return id;
  });
  const [revealPersona, setRevealPersona] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showResurrection, setShowResurrection] = useState(false);
  const [fadingMatch, setFadingMatch] = useState(null);
  
  // NEW STATE FOR TOASTS
  const [toast, setToast] = useState(null); // { message: string, type: string }
  const [newMatch, setNewMatch] = useState(null); // Stores match for popup

  // LOGIC STATE
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [availableSkins, setAvailableSkins] = useState([]); // Start empty, fill after onboarding
  const [matches, setMatches] = useState([]);
  
  // --- HELPER TO SHOW TOASTS ---
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Check for ghosting (4-hour decay)
  useEffect(() => {
    const checkGhosting = () => {
      const now = Date.now();
      const fourHours = 4 * 60 * 60 * 1000;
      setMatches(prev => prev.map(match => {
        if (match.last_interaction && (now - match.last_interaction) > fourHours && !match.is_fading) {
          return { ...match, is_fading: true };
        }
        return match;
      }));
    };
    const interval = setInterval(checkGhosting, 60000);
    return () => clearInterval(interval);
  }, []);

  // 2. CHECK LOCAL STORAGE
  useEffect(() => {
    // Initialize game store
    initialize();
    
    // We don't check 'hasSeenIntro' anymore because we want Onboarding to run if userProfile is missing
    const premiumStatus = localStorage.getItem('isPremium');
    if (premiumStatus === 'true') {
      setIsPremium(true);
      // Set premium expiry for demo (24 hours from now)
      const expiry = Date.now() + (24 * 60 * 60 * 1000);
      updatePremiumStatus(expiry);
    }
  }, []);

  // --- NEW: ONBOARDING COMPLETE ---
  const handleOnboardingComplete = (data) => {
    console.log("Onboarding Complete:", data);
    setUserProfile(data);
    setShowOnboarding(false);

    // Save user profile to Supabase
    userService.upsertUserProfile({
      id: userId,
      name: data.name,
      gender: data.gender,
      interestedIn: data.interestedIn,
      avatar: data.avatar
    });

    // FILTER SKINS BASED ON GENDER PREFERENCE
    let filteredSkins = rawData.skins;

    // If they didn't pick "everyone", filter by gender
    if (data.interestedIn !== 'everyone') {
      filteredSkins = rawData.skins.filter(s => s.gender === data.interestedIn);
    }

    // Fallback if filter is too strict or empty (prevent empty deck)
    if (filteredSkins.length === 0) {
      showToast("⚠️ Expanding search criteria...", "info");
      setAvailableSkins(rawData.skins);
    } else {
      setAvailableSkins(filteredSkins);
    }

    setView('swipe');
  };

  // --- THE SKIN-WALKER LOGIC ---
  const handleLike = (skin) => {
    if (!isPremium && matches.length >= 3) {
      setShowUpgrade(true);
      return;
    }

    // Log swipe action to Supabase
    userService.logSwipe(userId, skin.id, 'like');

    const scriptIndex = currentScriptIndex % rawData.scripts.length;
    const scriptToInject = rawData.scripts[scriptIndex];

    const newMatchObj = {
      id: Date.now().toString(),
      ...skin,
      ...scriptToInject,
      messages: scriptToInject.initial_messages,
      last_interaction: Date.now(),
      is_fading: false,
      original_skin_name: skin.name
    };

    setMatches(prev => [...prev, newMatchObj]);
    setAvailableSkins(prev => prev.filter(s => s.id !== skin.id));
    setCurrentScriptIndex(prev => prev + 1);

    // Log match to Supabase
    userService.logMatch(userId, newMatchObj.id);

    // --- THE FIX ---
    // Don't show toast. Show big screen.
    setNewMatch(newMatchObj); 
  };

  const handlePass = (skin) => {
    // Log swipe action to Supabase
    userService.logSwipe(userId, skin.id, 'pass');
    
    setAvailableSkins(prev => prev.filter(s => s.id !== skin.id));
  };

  const handleDeckEmpty = () => {
    if (!isPremium && matches.length < 3) {
      showToast("♻️ Recycling nearby singles...", "info"); // <--- PRETTY TOAST
      // Refill with correct gender preference
      let filteredSkins = rawData.skins;
      if (userProfile && userProfile.interestedIn !== 'everyone') {
        filteredSkins = rawData.skins.filter(s => s.gender === userProfile.interestedIn);
      }
      setAvailableSkins(filteredSkins.length > 0 ? filteredSkins : rawData.skins);
    } else {
      setView('list');
    }
  };

  const handleSelectChat = (id) => {
    const match = matches.find(m => m.id === id);
    if (match && match.is_fading) {
      setShowResurrection(true);
      setFadingMatch(match);
      return;
    }
    setMatches(prev => prev.map(m => m.id === id ? { ...m, last_interaction: Date.now() } : m));
    setActivePersonaId(id);
    setActivePersona(match); // Set the active persona object
    setView('chat');
  };

  const handleBack = () => {
    setView('list');
    setActivePersona(null); // Clear active persona when going back
  };

  const handleSendMessage = async (personaId, message) => {
    // 1. Add User Message immediately
    const newMessage = { 
        sender: 'user', 
        text: message, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    // Log user message to Supabase
    userService.logMessage(userId, personaId, message, 'user');
    
    // Update State (User Message)
    setMatches(prev => prev.map(p => {
       if (p.id === personaId) return { ...p, messages: [...p.messages, newMessage], last_interaction: Date.now() };
       return p;
    }));

    // 2. Set Typing Indicator ON (The Anxiety)
    setTypingPersonaId(personaId);

    // 3. Get the Real Response from Xiaomi
    const persona = matches.find(p => p.id === personaId);
    
    // We send the current message history + the new message
    const currentMessages = [...persona.messages, newMessage];

    // CALL THE API
    // We don't await immediately because we want to enforce a minimum "reading time" delay
    const apiPromise = getDeepSeekReply(OPENROUTER_API_KEY, currentMessages, persona);
    
    // Calculate a "Human" delay based on message length, or min 2 seconds
    const minDelay = 2000;
    const humanDelay = new Promise(resolve => setTimeout(resolve, minDelay));

    // Wait for BOTH the API and Timer (so it doesn't reply instantly if API is fast)
    const [aiText] = await Promise.all([apiPromise, humanDelay]);

    // 4. Add AI Reply
    const reply = { 
        sender: persona.name.toLowerCase(),
        text: aiText, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    // Log AI message to Supabase
    userService.logMessage(userId, personaId, aiText, 'ai');
    
    setMatches(prev => prev.map(p => {
        if (p.id === personaId) return { ...p, messages: [...p.messages, reply] };
        return p;
    }));
    
    setTypingPersonaId(null); // STOP TYPING
  };

   const handleUpgrade = () => setShowUpgrade(true);
   const handleUpgradeComplete = () => { 
       setIsPremium(true); 
       setShowUpgrade(false); 
       localStorage.setItem('isPremium', 'true'); 
       
       // Set premium expiry for 24 hours
       const expiry = Date.now() + (24 * 60 * 60 * 1000);
       updatePremiumStatus(expiry);
       
       // Add coins for upgrade
       addCoins(100);
       
       showToast("👑 UPGRADE SUCCESSFUL. WELCOME TO APEX.", "premium");
   };
   const handleCloseUpgrade = () => setShowUpgrade(false);
   const handleRevealRedFlag = (persona) => { setRevealPersona(persona); };
   const handleCloseReveal = () => setRevealPersona(null);

   // --- FIX: DEFINING THE MISSING FUNCTION ---
   const handleUnlockTruth = () => {
       if (isPremium) {
           showToast("Truth Revealed! (Check their profile)", "success");
           handleCloseReveal();
           // Logic to actually reveal truth would go here
       } else {
           setShowUpgrade(true);
       }
   };
   
   const handleResurrectMatch = () => {
    if (!fadingMatch) return;
    setMatches(prev => prev.map(m => m.id === fadingMatch.id ? { ...m, is_fading: false, last_interaction: Date.now(), is_premium: true } : m));
    setShowResurrection(false); 
    setFadingMatch(null);
    showToast("Connection Restored!", "success");
   };

   const handleLetGo = () => {
    if (!fadingMatch) return;
    setMatches(prev => prev.filter(m => m.id !== fadingMatch.id));
    setShowResurrection(false); 
    setFadingMatch(null);
   };
   const handleCloseResurrection = () => { setShowResurrection(false); setFadingMatch(null); };

   const handleViewChange = (newView) => setView(newView);
   const handleRefreshSearch = () => { 
      let filteredSkins = rawData.skins;
      if (userProfile && userProfile.interestedIn !== 'everyone') {
        filteredSkins = rawData.skins.filter(s => s.gender === userProfile.interestedIn);
      }
      setAvailableSkins(filteredSkins.length > 0 ? filteredSkins : rawData.skins);
      setView('swipe'); 
      showToast("Searching area...", "info");
   };

   // --- MATCH MODAL HANDLERS ---
   const handleCloseMatchModal = () => {
       setNewMatch(null);
       // If harem is full after closing match screen, THEN warn them
       if (!isPremium && matches.length >= 3) {
           showToast("Harem Full! Check your inbox.", "info");
           setView('list');
       }
   };

   const handleGoToChatFromModal = () => {
      if (!newMatch) return;
      const matchId = newMatch.id;
      setNewMatch(null);
      handleSelectChat(matchId);
   };

  return (
    // 1. OUTER BACKGROUND (The "Desk")
    <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4 font-sans">
      
      {/* 2. THE PHONE CHASSIS (iPhone 14 Pro Dimensions) */}
      <div className="relative w-[375px] h-[812px] bg-black rounded-[50px] shadow-2xl border-[8px] border-gray-800 overflow-hidden ring-4 ring-black">
        
        {/* 3. THE NOTCH (Dynamic Island) */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-b-[20px] z-[50]"></div>

        {/* 4. THE SCREEN CONTENT */}
        <div className="w-full h-full bg-slate-50 relative overflow-y-auto no-scrollbar phone-screen">
          
          {/* Toast Notification Layer */}
          <div className="absolute top-12 left-0 right-0 z-[60] px-4 pointer-events-none">
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          </div>

          {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
          
          <MatchModal 
            match={newMatch} 
            userAvatar={userProfile?.avatar} 
            onClose={handleCloseMatchModal}
            onChat={handleGoToChatFromModal}
          />

          {!showOnboarding && view === 'swipe' && (
            <div className="pt-12 pb-20 h-full"> {/* Added Padding for Notch & Nav */}
              <SwipeDeck
                personas={availableSkins}
                onLike={handleLike}
                onPass={handlePass}
                onDeckEmpty={handleDeckEmpty}
                isPremium={isPremium}
                onRefresh={handleRefreshSearch}
                currentMatches={matches}
              />
            </div>
          )}

          {!showOnboarding && view === 'list' && (
             <div className="pt-12 pb-20 h-full">
                <ChatList 
                  personas={matches} 
                  onSelectChat={handleSelectChat} 
                  onUpgrade={handleUpgrade}
                  isPremium={isPremium}
                />
             </div>
          )}

          {!showOnboarding && view === 'chat' && activePersona && (
            <div className="pt-10 h-full bg-white">
              <ChatInterface 
                persona={activePersona} 
                onBack={handleBack}
                messages={activePersona.messages}
                onSendMessage={(message) => handleSendMessage(activePersona.id, message)}
                onRevealRedFlag={() => handleRevealRedFlag(activePersona)}
                isTyping={typingPersonaId === activePersona.id}
              />
            </div>
          )}

          {/* Navigation Bar (Fixed to bottom of phone) */}
          {!showOnboarding && view !== 'chat' && (
            <div className="absolute bottom-0 w-full z-40">
               <BottomNav currentView={view} onViewChange={handleViewChange} />
            </div>
          )}

          {/* Modals */}
          {revealPersona && <RevealModal persona={revealPersona} onClose={handleCloseReveal} onUpgrade={handleUnlockTruth} />}
          {showResurrection && fadingMatch && <ResurrectionModal match={fadingMatch} onClose={handleCloseResurrection} onResurrect={handleResurrectMatch} onLetGo={handleLetGo} />}
          {showUpgrade && <UpgradeModal onClose={handleCloseUpgrade} onUpgrade={handleUpgradeComplete} />}
        </div>
      </div>
    </div>
  );
}

export default App;
