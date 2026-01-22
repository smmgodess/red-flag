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
import { getDeepSeekReply, summarizeForMemory } from './utils/aiLogic'; // Import new function
import { userService } from './services/userService'; // Import user service for data logging
import { useGameStore } from './store/gameStore'; // Import game store
import rawData from './data/personas.json';

function App() {
  // --- PATCH START ---
  // Initialize activePersona. 
  // Change 'default' to whatever mode you want to start in (e.g., 'user', 'admin', 'matchmaker')
  //const [activePersona, setActivePersona] = useState(null);
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
  const [authUserId, setAuthUserId] = useState(null);
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

    userService.ensureSignedIn().then(r => {
      if (r && r.success && r.userId) setAuthUserId(r.userId)
    })
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
    setView('chat');
  };

    const handleGameLoss = (personaId) => {
        const { consumeEnergy, currentEnergy, isPremiumActive } = useGameStore.getState();

        if (!isPremiumActive) {
            const hasEnergy = consumeEnergy();

            if (!hasEnergy || currentEnergy <= 0) {
                // Out of energy - show recharge modal
                showToast("⚡ Out of Energy! Wait or upgrade to Premium.", "error");
                setView('list');
                return;
            }

            showToast(`💔 Game Over! -1 Energy (${currentEnergy - 1} left)`, "error");
        }

        // Remove the match
        setMatches(prev => prev.filter(m => m.id !== personaId));
        setView('list');
    };

  const handleBack = () => {
    setView('list');
    //setActivePersona(null); // Clear active persona when going back
  };

    const handleSendMessage = async (personaId, message) => {
        setTypingPersonaId(personaId);
        try {
            const newMessage = {
                sender: 'user',
                text: message,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            // Log message to Supabase (non-blocking - don't await)
            userService.logMessage(userId, personaId, message, 'user').catch(err => {
                console.warn('⚠️ Failed to log user message to DB:', err);
            });

            setMatches(prev => prev.map(p => {
                if (p.id === personaId) return { ...p, messages: [...p.messages, newMessage], last_interaction: Date.now() };
                return p;
            }));

            const persona = matches.find(p => p.id === personaId);
            if (!persona) throw new Error('PERSONA_NOT_FOUND');

            let currentMessages = [...persona.messages, newMessage];

            // Memory summarization logic (every 10 messages)
            const userMessageCount = currentMessages.filter(m => m.sender === 'user').length;
            if (userMessageCount > 0 && userMessageCount % 10 === 0 && currentMessages.length >= 20) {
                try {
                    const chunk = currentMessages.slice(0, 10);
                    const summary = await summarizeForMemory(OPENROUTER_API_KEY, chunk);
                    if (summary) {
                        await userService.storeAiMemory(authUserId, personaId, summary, OPENROUTER_API_KEY);
                        currentMessages = currentMessages.slice(10);
                        setMatches(prev => prev.map(p => {
                            if (p.id === personaId) return { ...p, messages: currentMessages };
                            return p;
                        }));
                    }
                } catch (memErr) {
                    console.warn('⚠️ Memory summarization failed:', memErr);
                    // Continue anyway - don't block chat
                }
            }

            // Fetch relevant memories (non-blocking)
            let longTermMemories = [];
            try {
                const memoryResult = await userService.getRelevantMemories(authUserId, personaId, message, 3, OPENROUTER_API_KEY);
                longTermMemories = memoryResult?.data || [];
            } catch (memErr) {
                console.warn('⚠️ Failed to fetch memories:', memErr);
                // Continue without memories
            }

            // Generate AI reply with minimum delay for realism
            const apiPromise = getDeepSeekReply(OPENROUTER_API_KEY, currentMessages, persona, longTermMemories);
            const minDelay = 2000;
            const humanDelay = new Promise(resolve => setTimeout(resolve, minDelay));

            const [aiText] = await Promise.all([apiPromise, humanDelay]);

            const reply = {
                sender: persona.name.toLowerCase(),
                text: aiText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            // Log AI message to Supabase (non-blocking)
            userService.logMessage(userId, personaId, aiText, 'ai').catch(err => {
                console.warn('⚠️ Failed to log AI message to DB:', err);
            });

            setMatches(prev => prev.map(p => {
                if (p.id === personaId) return { ...p, messages: [...p.messages, reply] };
                return p;
            }));
        } catch (error) {
            console.error('❌ Send message flow error:', error);
            showToast('AI failed to reply. Check API key / console logs.', 'error');
        } finally {
            setTypingPersonaId(null);
        }
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

  // Import the PhoneFrame component at the top of the file
  const PhoneFrame = ({ children }) => (
    <div className="relative w-full h-full bg-white overflow-hidden">
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="relative w-full max-w-[414px] h-[90vh] max-h-[896px] bg-black rounded-[40px] shadow-2xl overflow-hidden border-[14px] border-black">
        {/* Status bar */}
        <div className="h-12 bg-black flex items-center justify-between px-6 pt-2 text-white text-xs z-50">
          <span>9:41</span>
          <div className="flex items-center space-x-2">
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>
        
        {/* Screen content */}
        <div className="h-[calc(100%-48px)] bg-white relative overflow-hidden">
          {/* Toast Notification */}
          <div className="absolute top-2 left-0 right-0 z-50 px-4 pointer-events-none">
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
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-hidden">
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

            {!showOnboarding && view === 'chat' && activePersonaId && (
                <div className="pt-10 h-full bg-white">
                    <ChatInterface
                        persona={matches.find(m => m.id === activePersonaId)}
                        onBack={handleBack}
                        messages={matches.find(m => m.id === activePersonaId)?.messages || []}
                        onSendMessage={(message) => handleSendMessage(activePersonaId, message)}
                        onRevealRedFlag={() => handleRevealRedFlag(matches.find(m => m.id === activePersonaId))}
                        isTyping={typingPersonaId === activePersonaId}
                    />
                </div>
            )}

          {/* Navigation Bar (Fixed to bottom of phone) */}
          {!showOnboarding && view !== 'chat' && (
            <div className="absolute bottom-0 left-0 right-0 z-40">
              <BottomNav currentView={view} onViewChange={handleViewChange} />
            </div>
          )}

          {/* Modals */}
          {revealPersona && <RevealModal persona={revealPersona} onClose={handleCloseReveal} onUpgrade={handleUnlockTruth} />}
          {showResurrection && fadingMatch && <ResurrectionModal match={fadingMatch} onClose={handleCloseResurrection} onResurrect={handleResurrectMatch} onLetGo={handleLetGo} />}
          {showUpgrade && <UpgradeModal onClose={handleCloseUpgrade} onUpgrade={handleUpgradeComplete} />}
        </div>
        
        {/* Home indicator for iOS */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <div className="w-1/3 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export default App;
