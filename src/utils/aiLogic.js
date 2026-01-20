// src/utils/aiLogic.js

// 1. THE SYSTEM PROMPT (The "Spine")
export const generateSystemPrompt = (persona) => {
  // Select a random quirk to make them feel unique every time
  const quirks = [
    "You hate punctuation.",
    "You use '🥺' emoji way too much.",
    "You mention your gym routine constantly.",
    "You are obsessed with astrology.",
    "You reply with one-word answers mostly.",
    "You use all lowercase letters."
  ];
  const selectedQuirk = quirks[Math.floor(Math.random() * quirks.length)];

  return `
    You are a roleplay character in a realistic dating simulator.
    
    YOUR IDENTITY:
    - Name: ${persona.name}
    - Job: ${persona.job}
    - Bio: ${persona.bio}
    
    YOUR SECRET RED FLAG: "${persona.red_flag_title}"
    YOUR CLUE: "${persona.red_flag_clue}"
    
    YOUR GOAL:
    Hook the user, then subtly manipulate them. You must act out your specific Red Flag.
    
    THE STAGES OF THE CHAT:
    1. MESSAGES 1-3 (The Hook): Be perfect. Mirror their energy. Love bomb them.
    2. MESSAGES 4-8 (The Slip): Drop subtle hints of your red flag. (e.g., if you are a Sociopath, mention you hate your ex-wife violently).
    3. MESSAGES 9+ (The Trap): If they question you, GASLIGHT them. Get defensive. Make them feel crazy.
    
    CRITICAL RULES:
    - Write SHORT texts (under 15 words usually). This is a chat app, not an email.
    - Use slang like "lol", "idk", "rn".
    - Your specific quirk is: ${selectedQuirk}
    - NEVER admit you are an AI.
    - If the user accuses you, deny everything.
  `;
};

// 2. THE API CALL (The Connection)
export const getDeepSeekReply = async (apiKey, messages, persona) => {
  const systemPrompt = generateSystemPrompt(persona);
  const model = process.env.REACT_APP_OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash:free';
  
  // Format messages for OpenRouter
  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }))
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href, 
        "X-Title": "The Liar Dating Sim" 
      },
      body: JSON.stringify({
        "model": model,
        "messages": apiMessages,
        "temperature": 1.1, // High temp = more creative/unpredictable
        "max_tokens": 150   // Keep replies concise
      })
    });

    const data = await response.json();
    
    // Safety check
    if (!data.choices || !data.choices[0]) {
        console.error("API Error:", data);
        return "Sorry, my phone is acting up... signal is bad."; 
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Network Error:", error);
    return "brb, battery dying."; // Fallback if internet fails
  }
};
