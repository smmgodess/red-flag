-- 1. Enable Vector Extension (Critical)
create extension if not exists vector;

-- 2. Create Memory Vault
create table public.ai_memories (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  content text not null,
  embedding vector(1536), -- DeepSeek/OpenAI standard dimension
  metadata jsonb default '{}'::jsonb, -- Store "emotional_tag", "topic"
  created_at timestamptz default now()
);

-- 3. Enable Security (RLS)
alter table public.ai_memories enable row level security;

-- 4. Create Policy (Users see ONLY their own memories)
create policy "Users can read own memories"
  on public.ai_memories
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own memories"
  on public.ai_memories
  for insert
  with check (auth.uid() = user_id);

-- 5. Create Search Function (RPC)
-- This allows AI to say: "Find memories related to 'gambling'"
create or replace function match_ai_memories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
stable
as $$
begin
  return query
  select
    am.id,
    am.content,
    am.metadata,
    1 - (am.embedding <=> query_embedding) as similarity
  from public.ai_memories am
  where 1 - (am.embedding <=> query_embedding) > match_threshold
  -- RLS is automatically applied here, but explicit filter is safer for RPC
  and am.user_id = auth.uid()
  order by am.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 6. Create Index (Speed Optimization)
-- Essential once we pass 1,000 rows. HNSW is faster than IVFFlat.
create index on public.ai_memories using hnsw (embedding vector_cosine_ops);
