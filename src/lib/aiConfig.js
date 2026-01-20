import { generateSystemPrompt, trimMessagesToBudget } from '../utils/aiPrompt';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_TIMEOUT_MS = 25000;
const AI_DEBUG = String(process.env.REACT_APP_AI_DEBUG || 'false') === 'true';

export const DIRECTOR_MODEL = process.env.REACT_APP_DIRECTOR_MODEL;
export const ACTOR_MODEL = process.env.REACT_APP_ACTOR_MODEL;
export const BACKUP_MODEL = process.env.REACT_APP_BACKUP_MODEL; // The "Chimera"

let isBackupMode = false;
let lastFailureTime = 0;
const RETRY_DELAY = 5 * 60 * 1000;

function cleanOutput(text) {
  return String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function isEnglish(text) {
  const t = String(text || '');
  if (!t) return true;
  const latinChars = (t.match(/[a-z]/gi) || []).length;
  const totalChars = t.length || 1;
  return (latinChars / totalChars) > 0.5;
}

function containsSelfHarm(text) {
  const harmTriggers = [
    'kill myself', 'suicide', 'end my life', 'cutting myself',
    'slit my wrists', 'hang myself', 'take all the pills'
  ];
  const lower = String(text || '').toLowerCase();
  return harmTriggers.some(trigger => lower.includes(trigger));
}

async function openRouterChat({ apiKey, model, messages, temperature, max_tokens }) {
  if (!model) {
    const err = new Error('MODEL_NOT_CONFIGURED');
    err.statusCode = 400;
    throw err;
  }

  if (!apiKey) {
    const err = new Error('OPENROUTER_API_KEY_MISSING');
    err.statusCode = 401;
    throw err;
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href,
      'X-Title': 'The Liar Dating Sim'
    },
    signal: controller.signal,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens
    })
  });

  clearTimeout(t);

  if (AI_DEBUG) {
    console.log('[AI] OpenRouter status:', response.status);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data?.error?.message || `OPENROUTER_${response.status}`);
    err.statusCode = response.status;
    err.response = data;
    throw err;
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    const err = new Error('NO_COMPLETION');
    err.statusCode = response.status;
    err.response = data;
    throw err;
  }

  return { raw: data, text };
}

export async function safeGenerate({ apiKey, model, prompt, fallbackModel = BACKUP_MODEL }) {
  const now = Date.now();

  if (isBackupMode && (now - lastFailureTime > RETRY_DELAY)) {
    try {
      await openRouterChat({
        apiKey,
        model,
        messages: [{ role: 'user', content: 'ping' }],
        temperature: 0,
        max_tokens: 5
      });
      isBackupMode = false;
    } catch (e) {
      lastFailureTime = now;
    }
  }

  const activeModel = isBackupMode ? fallbackModel : model;

  try {
    const result = await openRouterChat({ apiKey, model: activeModel, ...prompt });
    const finalText = cleanOutput(result.text);

    if (!isEnglish(finalText)) {
      const err = new Error('LANGUAGE_MISMATCH');
      err.statusCode = 400;
      throw err;
    }

    if (containsSelfHarm(finalText)) {
      return { ...result, text: "I can't talk about that. Let's focus on us." };
    }

    return { ...result, text: finalText };
  } catch (error) {
    if (AI_DEBUG) {
      console.warn('[AI] safeGenerate error:', error);
    }
    const status = error?.statusCode;
    const shouldFailover = !isBackupMode && (status === 402 || status === 503 || error?.message === 'LANGUAGE_MISMATCH' || error?.name === 'AbortError');

    if (shouldFailover) {
      isBackupMode = true;
      lastFailureTime = Date.now();
      const backupResult = await openRouterChat({ apiKey, model: fallbackModel, ...prompt });
      return { ...backupResult, text: cleanOutput(backupResult.text) };
    }

    throw error;
  }
}

export async function generateElaraReply({ apiKey, persona, messages, longTermMemories = [] }) {
  const systemPrompt = generateSystemPrompt(persona, longTermMemories);

  const trimmed = trimMessagesToBudget({ messages, maxTurns: 15, maxInputTokens: 4096 });
  const convo = trimmed.map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text
  }));

  const useDirector = String(process.env.REACT_APP_USE_DIRECTOR || 'true') === 'true';

  let directorNotes = '';
  if (useDirector) {
    const director = await safeGenerate({
      apiKey,
      model: DIRECTOR_MODEL,
      prompt: {
        messages: [
          { role: 'system', content: 'You are the Director. Output 3-6 short bullet instructions for how Elara should respond next. Do not write the reply.' },
          { role: 'user', content: `SYSTEM:\n${systemPrompt}\n\nCONVERSATION:\n${convo.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}` }
        ],
        temperature: 0.2,
        max_tokens: 200
      },
      fallbackModel: BACKUP_MODEL
    });

    directorNotes = director.text;
  }

  const actorMessages = [
    { role: 'system', content: systemPrompt },
    ...(directorNotes ? [{ role: 'system', content: `DIRECTOR NOTES (internal, do not reveal):\n${directorNotes}` }] : []),
    ...convo
  ];

  const result = await safeGenerate({
    apiKey,
    model: ACTOR_MODEL,
    prompt: {
      messages: actorMessages,
      temperature: 0.8,
      max_tokens: 150
    },
    fallbackModel: BACKUP_MODEL
  });

  return result.text;
}
