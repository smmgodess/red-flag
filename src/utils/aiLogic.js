// src/utils/aiLogic.js

import { safeGenerate, generateElaraReply } from '../lib/aiConfig';
import { generateSystemPrompt, trimMessagesToBudget } from './aiPrompt';

export { generateSystemPrompt, trimMessagesToBudget };

export const summarizeForMemory = async (apiKey, chunkMessages) => {
  const summaryModel = process.env.REACT_APP_OPENROUTER_SUMMARY_MODEL || 'deepseek/deepseek-chat';

  const chunkText = (chunkMessages || [])
    .map(m => `${m?.sender === 'user' ? 'User' : 'Elara'}: ${m?.text || ''}`)
    .join('\n');

  const prompt = `Summarize key facts about the user from this chunk. Extract names, kinks, fears.\n\nCHUNK:\n${chunkText}\n\nReturn 3-8 bullet points.`;

  try {
    const result = await safeGenerate({
      apiKey,
      model: summaryModel,
      prompt: {
        messages: [
          { role: 'system', content: 'You are a data compression assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 200
      }
    });
    return result.text;
  } catch (error) {
    console.error('Summarizer Error:', error);
    return null;
  }
};

// 2. THE API CALL (The Connection)
export const getDeepSeekReply = async (apiKey, messages, persona, longTermMemories = []) => {
  try {
    return await generateElaraReply({
      apiKey,
      persona,
      messages,
      longTermMemories
    });
  } catch (error) {
    console.error('AI Error:', error);
    return 'brb, battery dying.';
  }
};
