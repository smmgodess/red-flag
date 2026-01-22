
import ChatList from './components/ChatList';
import ResurrectionModal from './components/ResurrectionModal';
import rawData from './data/personas.json';
import UpgradeModal from './components/UpgradeModal';
import ChatInterface from './components/ChatInterface';
import RevealModal from './components/RevealModal';
import SwipeDeck from './components/SwipeDeck';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import Onboarding from './components/Onboarding';
import MatchModal from './components/MatchModal';
import { userService } from './services/userService';
import { useGameStore } from './store/gameStore';
import { getDeepSeekReply, summarizeForMemory } from './utils/aiLogic';
import React, { useState, useEffect } from 'react';

function App() {
    // Initialize game store
    const { initialize, updatePremiumStatus, addCoins } = useGameStore();

    // TODO: Move to .env for production
    const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;

    const [view, setView] = useState('intro');
    const [activePersonaId, setActivePersonaId] = useState(null);
    const [typingPersonaId, setTypingPersonaId] = useState(null);

    // ONBOARDING STATE
    const [showOnboarding, setShowOnboarding] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [userId, setUserId] = useState(() => {
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

    // TOAST & MATCH STATE
    const [toast, setToast] = useState(null);
    const [newMatch, setNewMatch] = useState(null);

    // LOGIC STATE
    const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
    const [availableSkins, setAvailableSkins] = useState([]);
    const [matches, setMatches] = useState([]);

    // NEW: Loading state for session restoration
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    // HELPER TO SHOW TOASTS
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

    // INITIALIZE AND LOAD SESSION
    useEffect(() => {
        const loadUserSession = async () => {
            try {
                // Initialize game store
                initialize();

                // Ensure user is signed in
                const authResult = await userService.ensureSignedIn();
                if (authResult && authResult.success && authResult.userId) {
                    setAuthUserId(authResult.userId);
                } else {
                    console.error('Failed to authenticate user');
                    setIsLoadingSession(false);
                    return;
                }

                // Check if user has completed onboarding
                const profileResult = await userService.getUserProfile();

                if (profileResult.success && profileResult.data) {
                    // User has completed onboarding
                    setUserProfile({
                        name: profileResult.data.name,
                        gender: profileResult.data.gender,
                        interestedIn: profileResult.data.interested_in,
                        avatar: profileResult.data.avatar
                    });
                    setShowOnboarding(false);

                    // Load user session state
                    const sessionResult = await userService.getUserSession();
                    console.log('📦 Session restoration result:', sessionResult);

                    if (sessionResult.success && sessionResult.data) {
                        const session = sessionResult.data;

                        // Restore view state
                        setView(session.current_view || 'swipe');
                        setActivePersonaId(session.active_persona_id);
                        setCurrentScriptIndex(session.current_script_index || 0);
                        setIsPremium(session.is_premium || false);

                        if (session.is_premium) {
                            const expiry = Date.now() + (24 * 60 * 60 * 1000);
                            updatePremiumStatus(expiry);
                        }

                        // Restore matches with chat history
                        if (session.matches && session.matches.length > 0) {
                            console.log('🔄 Restoring matches:', session.matches.length);
                            const matchesWithHistory = await Promise.all(
                                session.matches.map(async (match) => {
                                    // First, try to get chat history from database
                                    const chatResult = await userService.getChatHistory(match.id);

                                    let messages = [];

                                    if (chatResult.success && chatResult.data && chatResult.data.length > 0) {
                                        // Convert DB messages to app format
                                        messages = chatResult.data.map(msg => ({
                                            sender: msg.sender === 'user' ? 'user' : match.name.toLowerCase(),
                                            text: msg.message,
                                            timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                        }));
                                        console.log(`✅ Restored ${messages.length} messages from DB for ${match.name}`);
                                    } else if (match.messages && match.messages.length > 0) {
                                        // Fallback: Use messages stored in session
                                        messages = match.messages;
                                        console.log(`✅ Restored ${messages.length} messages from session for ${match.name}`);
                                    } else if (match.initial_messages && match.initial_messages.length > 0) {
                                        // Last resort: Use initial messages from match data
                                        messages = match.initial_messages;
                                        console.log(`ℹ️ Using initial messages for ${match.name}`);
                                    }

                                    return {
                                        ...match,
                                        messages,
                                        last_interaction: match.last_interaction || Date.now(),
                                        is_fading: match.is_fading || false
                                    };
                                })
                            );
                            setMatches(matchesWithHistory);
                            console.log('✅ All matches restored with messages');
                        }

                        // Restore available skins
                        if (session.available_skins && session.available_skins.length > 0) {
                            console.log('✅ Restored available skins:', session.available_skins.length);
                            setAvailableSkins(session.available_skins);
                        } else {
                            // Filter skins based on user preference
                            let filteredSkins = rawData.skins;
                            if (profileResult.data.interested_in !== 'everyone') {
                                filteredSkins = rawData.skins.filter(
                                    s => s.gender === profileResult.data.interested_in
                                );
                            }
                            setAvailableSkins(filteredSkins.length > 0 ? filteredSkins : rawData.skins);
                        }

                        showToast("Welcome back! 👋", "success");
                    } else {
                        console.log('ℹ️ No saved session found, starting fresh');
                        // No saved session, start fresh
                        let filteredSkins = rawData.skins;
                        if (profileResult.data.interested_in !== 'everyone') {
                            filteredSkins = rawData.skins.filter(
                                s => s.gender === profileResult.data.interested_in
                            );
                        }
                        setAvailableSkins(filteredSkins.length > 0 ? filteredSkins : rawData.skins);
                        setView('swipe');
                    }
                } else {
                    // User needs to complete onboarding
                    setShowOnboarding(true);
                }

                // Check premium status from localStorage as fallback
                const premiumStatus = localStorage.getItem('isPremium');
                if (premiumStatus === 'true' && !isPremium) {
                    setIsPremium(true);
                    const expiry = Date.now() + (24 * 60 * 60 * 1000);
                    updatePremiumStatus(expiry);
                }

            } catch (error) {
                console.error('Error loading user session:', error);
                showToast("Failed to load session. Starting fresh.", "error");
            } finally {
                setIsLoadingSession(false);
            }
        };

        loadUserSession();
    }, [initialize, updatePremiumStatus, isPremium]);

    // AUTO-SAVE SESSION STATE

// Replace the AUTO-SAVE SESSION STATE useEffect (around line 172-192) with this improved version:

// AUTO-SAVE SESSION STATE
    useEffect(() => {
        if (!authUserId || isLoadingSession || showOnboarding) return;

        const saveSession = async () => {
            try {
                console.log('💾 Auto-saving session...', {
                    view,
                    activePersonaId,
                    matchesCount: matches.length,
                    skinsCount: availableSkins.length
                });

                const result = await userService.saveUserSession({
                    currentView: view,
                    activePersonaId,
                    matches,
                    availableSkins,
                    currentScriptIndex,
                    isPremium
                });

                if (result.success) {
                    console.log('✅ Session saved successfully');
                } else {
                    console.error('❌ Session save failed:', result.error);
                }
            } catch (error) {
                console.error('❌ Error auto-saving session:', error);
            }
        };

        // Debounce saves (wait 1 second after last change)
        const timeoutId = setTimeout(saveSession, 1000);
        return () => clearTimeout(timeoutId);
    }, [authUserId, isLoadingSession, showOnboarding, view, activePersonaId, matches, availableSkins, currentScriptIndex, isPremium]);

// ADD: Save session before page unload
    useEffect(() => {
        const handleBeforeUnload = async () => {
            if (!authUserId || showOnboarding) return;

            // Use sendBeacon for reliable save on page close
            const sessionData = {
                currentView: view,
                activePersonaId,
                matches,
                availableSkins,
                currentScriptIndex,
                isPremium
            };

            try {
                await userService.saveUserSession(sessionData);
                console.log('💾 Session saved on page unload');
            } catch (error) {
                console.error('❌ Failed to save on unload:', error);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [authUserId, showOnboarding, view, activePersonaId, matches, availableSkins, currentScriptIndex, isPremium]);

    // ONBOARDING COMPLETE
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

        // Filter skins based on gender preference
        let filteredSkins = rawData.skins;
        if (data.interestedIn !== 'everyone') {
            filteredSkins = rawData.skins.filter(s => s.gender === data.interestedIn);
        }

        if (filteredSkins.length === 0) {
            showToast("⚠️ Expanding search criteria...", "info");
            setAvailableSkins(rawData.skins);
        } else {
            setAvailableSkins(filteredSkins);
        }

        setView('swipe');
    };

    // LIKE HANDLER
    const handleLike = (skin) => {
        if (!isPremium && matches.length >= 3) {
            setShowUpgrade(true);
            return;
        }

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

        // Log match to Supabase with full match data
        userService.logMatch(userId, newMatchObj.id, newMatchObj);

        setNewMatch(newMatchObj);
    };

    const handlePass = (skin) => {
        userService.logSwipe(userId, skin.id, 'pass');
        setAvailableSkins(prev => prev.filter(s => s.id !== skin.
            id));
    };

    const handleDeckEmpty = () => {
        if (!isPremium && matches.length < 3) {
            showToast("♻️ Recycling nearby singles...", "info");
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
                showToast("⚡ Out of Energy! Wait or upgrade to Premium.", "error");
                setView('list');
                return;
            }

            showToast(`💔 Game Over! -1 Energy (${currentEnergy - 1} left)`, "error");
        }

        setMatches(prev => prev.filter(m => m.id !== personaId));
        setView('list');
    };

    const handleBack = () => {
        setView('list');
    };

    const handleSendMessage = async (personaId, message) => {
        setTypingPersonaId(personaId);
        try {
            const newMessage = {
                sender: 'user',
                text: message,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            // Update UI immediately
            setMatches(prev => prev.map(p => {
                if (p.id === personaId) {
                    const updatedMessages = [...p.messages, newMessage];
                    return {
                        ...p,
                        messages: updatedMessages,
                        last_interaction: Date.now()
                    };
                }
                return p;
            }));

            // Log user message to Supabase (await to ensure it's saved)
            try {
                const logResult = await userService.logMessage(authUserId, personaId, message, 'user');
                if (logResult.success) {
                    console.log('✅ User message saved to DB');
                } else {
                    console.warn('⚠️ Failed to save user message:', logResult.error);
                }
            } catch (err) {
                console.error('❌ Error saving user message:', err);
            }

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
                }
            }

            // Fetch relevant memories (non-blocking)
            let longTermMemories = [];
            try {
                const memoryResult = await userService.getRelevantMemories(authUserId, personaId, message, 3, OPENROUTER_API_KEY);
                longTermMemories = memoryResult?.data || [];
            } catch (memErr) {
                console.warn('⚠️ Failed to fetch memories:', memErr);
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

            // Update UI with AI reply
            setMatches(prev => prev.map(p => {
                if (p.id === personaId) {
                    return { ...p, messages: [...p.messages, reply] };
                }
                return p;
            }));

            // Log AI message to Supabase (await to ensure it's saved)
            try {
                const aiLogResult = await userService.logMessage(authUserId, personaId, aiText, 'ai');
                if (aiLogResult.success) {
                    console.log('✅ AI message saved to DB');
                } else {
                    console.warn('⚠️ Failed to save AI message:', aiLogResult.error);
                }
            } catch (err) {
                console.error('❌ Error saving AI message:', err);
            }

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

        const expiry = Date.now() + (24 * 60 * 60 * 1000);
        updatePremiumStatus(expiry);

        addCoins(100);

        showToast("👑 UPGRADE SUCCESSFUL. WELCOME TO APEX.", "premium");
    };

    const handleCloseUpgrade = () => setShowUpgrade(false);
    const handleRevealRedFlag = (persona) => { setRevealPersona(persona); };
    const handleCloseReveal = () => setRevealPersona(null);

    const handleUnlockTruth = () => {
        if (isPremium) {
            showToast("Truth Revealed! (Check their profile)", "success");
            handleCloseReveal();
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

    const handleCloseMatchModal = () => {
        setNewMatch(null);
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

    // Show loading screen while restoring session
    if (isLoadingSession) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="relative w-full max-w-[414px] h-[90vh] max-h-[896px] bg-black rounded-[40px] shadow-2xl overflow-hidden border-[14px] border-black">
                    <div className="h-12 bg-black flex items-center justify-between px-6 pt-2 text-white text-xs z-50">
                        <span>9:41</span>
                        <div className="flex items-center space-x-2">
                            <span>📶</span>
                            <span>🔋</span>
                        </div>
                    </div>
                    <div className="h-[calc(100%-48px)] bg-white flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading your session...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                            <BottomNav currentView="swipe" onViewChange={handleViewChange} />
                        </div>
                    )}

                    {!showOnboarding && view === 'list' && (
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-hidden">
                                <ChatList
                                    personas={matches}
                                    onSelectChat={handleSelectChat}
                                    onRefreshSearch={handleRefreshSearch}
                                    onUpgrade={handleUpgrade}
                                    isPremium={isPremium}
                                />
                            </div>
                            <BottomNav currentView="list" onViewChange={handleViewChange} />
                        </div>
                    )}

                    {!showOnboarding && view === 'chat' && activePersonaId && (
                        <ChatInterface
                            persona={matches.find(p => p.id === activePersonaId)}
                            onBack={handleBack}
                            messages={matches.find(p => p.id === activePersonaId)?.messages || []}
                            onSendMessage={(text) => handleSendMessage(activePersonaId, text)}
                            onRevealRedFlag={() => handleRevealRedFlag(matches.find(p => p.id === activePersonaId))}
                            isTyping={typingPersonaId === activePersonaId}
                        />
                    )}

                    {showUpgrade && (
                        <UpgradeModal
                            onClose={handleCloseUpgrade}
                            onUpgrade={handleUpgradeComplete}
                        />
                    )}

                    {revealPersona && (
                        <RevealModal
                            persona={revealPersona}
                            onClose={handleCloseReveal}
                            onUpgrade={handleUnlockTruth}
                        />
                    )}

                    {showResurrection && fadingMatch && (
                        <ResurrectionModal
                            match={fadingMatch}
                            onClose={handleCloseResurrection}
                            onResurrect={handleResurrectMatch}
                            onLetGo={handleLetGo}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;