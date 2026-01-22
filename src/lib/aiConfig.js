const ACTOR_MODEL = 'deepseek/deepseek-chat';
const DIRECTOR_MODEL = 'openai/gpt-4o-mini';
const BACKUP_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

async function openRouterChat({ apiKey, model, messages, temperature = 0.7, maxTokens = 150 }) {
  if (!apiKey) {
    throw new Error('MODEL_NOT_CONFIGURED');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Red Flag Dating App'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API Error:', response.status, errorText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || 'brb, battery dying.',
    model: model
  };
}

async function safeGenerate({ apiKey, model, prompt, fallbackModel }) {
  try {
    return await openRouterChat({
      apiKey,
      model,
      messages: prompt.messages,
      temperature: prompt.temperature || 0.7,
      maxTokens: prompt.max_tokens || 150
    });
  } catch (error) {
    console.error(`Error with ${model}:`, error);

    if (fallbackModel && fallbackModel !== model) {
      console.log(`Falling back to ${fallbackModel}`);
      return safeGenerate({ apiKey, model: fallbackModel, prompt, fallbackModel: null });
    }

    return {
      text: 'brb, battery dying.',
      model: model
    };
  }
}

export { safeGenerate };

export async function generateElaraReply({ apiKey, persona, messages, longTermMemories = [] }) {
  const { generateSystemPrompt, trimMessagesToBudget } = await import('../utils/aiPrompt');

  const systemPrompt = generateSystemPrompt(persona, longTermMemories);
  const trimmed = trimMessagesToBudget({ messages, maxTurns: 15, maxInputTokens: 4096 });

  const convo = trimmed.map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text
  }));

  const useDirector = String(process.env.REACT_APP_USE_DIRECTOR || 'false') === 'true';

  let directorNotes = '';
  if (useDirector) {
    const director = await safeGenerate({
      apiKey,
      model: DIRECTOR_MODEL,
      prompt: {
        messages: [
          { role: 'system', content: 'You are the Director. Output 3-6 short bullet instructions for how the character should respond next. Do not write the reply.' },
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