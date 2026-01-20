# MEMORY ARCHITECTURE

1. **Dependency:** Do NOT rely on infinite context windows.
2. **Limit:** Cap the active message history sent to the LLM at the last 15 turns.
3. **Max Input Tokens:** 4,096 tokens.

## Sliding Window Limit

- Never exceed the max input token budget for the active chat.
- If the history grows too large, trim older turns before calling the LLM.

## Compression Loop

- Trigger: Every 10 user messages.
- Action:
  - Take the oldest 10 messages.
  - Send them to a cheap model to summarize key facts about the user.
  - Store the summary in `ai_memories`.
  - Remove the raw messages from the active message array (or archive).

## Injection Prompt

SYSTEM PROMPT: You are Elara.

LONG TERM MEMORY (Retrieved from DB):
- User has a dog named Roger.
- User hates his boss.
- User is insecure about money.

CURRENT CONVERSATION (Last 10 msgs):
- User: "I had a bad day."
- Elara: ...

## Retrieval Logic

- On every message, embed the user's input.
- Query `ai_memories` for similar vectors (threshold > 0.7).
- Inject the top 3 relevant memories into the system prompt before generating the next reply.
