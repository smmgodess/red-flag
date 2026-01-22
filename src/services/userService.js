import { supabase } from '../utils/supabase'

const openRouterEmbed = async (apiKey, text) => {
  if (!apiKey) return null
  try {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text
      })
    })
    if (!response.ok) return null
    const data = await response.json()
    return data?.data?.[0]?.embedding || null
  } catch (error) {
    console.error('Embedding error:', error)
    return null
  }
}

export const userService = {
  async ensureSignedIn() {
    try {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.user?.id) return { success: true, userId: data.session.user.id }

      const { data: anonData, error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      return { success: true, userId: anonData?.user?.id }
    } catch (error) {
      console.error('Error ensuring auth session:', error)
      return { success: false, error, userId: null }
    }
  },

  // Create or update user profile
  async upsertUserProfile(userData) {
    try {
      const auth = await this.ensureSignedIn()
      if (!auth.success || !auth.userId) throw new Error('NO_AUTH')

      const { data, error } = await supabase
          .from('user_profiles')
          .upsert({
            id: auth.userId, // Use Supabase auth ID instead of local userId
            name: userData.name,
            gender: userData.gender,
            interested_in: userData.interestedIn,
            avatar: userData.avatar,
            updated_at: new Date().toISOString()
          })
          .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error saving user profile:', error)
      return { success: false, error }
    }
  },

  // Log user swipe action
  async logSwipe(userId, personaId, action) {
    try {
      const auth = await this.ensureSignedIn()
      if (!auth.success || !auth.userId) return { success: false }

      const { data, error } = await supabase
          .from('user_swipes')
          .insert({
            user_id: auth.userId, // Use Supabase auth ID
            persona_id: personaId,
            action: action,
            timestamp: new Date().toISOString()
          })
          .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error logging swipe:', error)
      return { success: false, error }
    }
  },

  // Log user match
  async logMatch(userId, personaId) {
    try {
      const auth = await this.ensureSignedIn()
      if (!auth.success || !auth.userId) return { success: false }

      const { data, error } = await supabase
          .from('user_matches')
          .insert({
            user_id: auth.userId, // Use Supabase auth ID
            persona_id: personaId,
            matched_at: new Date().toISOString(),
            is_premium: false
          })
          .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error logging match:', error)
      return { success: false, error }
    }
  },

  // Log chat message
  async logMessage(userId, personaId, message, sender) {
    console.log('🔍 logMessage called:', { userId, personaId, message, sender });
    try {
      const auth = await this.ensureSignedIn()
      console.log('🔍 Auth result:', auth);
      if (!auth.success || !auth.userId) {
        console.log('❌ Auth failed, returning early');
        return { success: false }
      }

      const payload = {
        user_id: auth.userId,
        persona_id: personaId,
        message: message,
        sender: sender,
        timestamp: new Date().toISOString()
      };
      console.log('🔍 Inserting payload:', payload);

      const { data, error } = await supabase
          .from('chat_messages')
          .insert(payload)
          .select()

      if (error) {
        console.log('❌ Supabase error:', error);
        throw error;
      }
      console.log('✅ Message logged successfully:', data);
      return { success: true, data }
    } catch (error) {
      console.error('Error logging message:', error)
      return { success: false, error }
    }
  },

  // Get user statistics
  async getUserStats(userId) {
    try {
      const auth = await this.ensureSignedIn()
      if (!auth.success || !auth.userId) return { success: false }

      const { data: swipes, error: swipeError } = await supabase
          .from('user_swipes')
          .select('action')
          .eq('user_id', auth.userId)

      const { data: matches, error: matchError } = await supabase
          .from('user_matches')
          .select('*')
          .eq('user_id', auth.userId)

      if (swipeError || matchError) throw swipeError || matchError

      const stats = {
        totalSwipes: swipes?.length || 0,
        likes: swipes?.filter(s => s.action === 'like').length || 0,
        passes: swipes?.filter(s => s.action === 'pass').length || 0,
        totalMatches: matches?.length || 0
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return { success: false, error }
    }
  },

  async storeAiMemory(userId, personaId, summary, apiKey) {
    try {
      const auth = await this.ensureSignedIn()
      if (!auth.success || !auth.userId) throw auth.error || new Error('NO_AUTH')

      const embedding = apiKey ? await openRouterEmbed(apiKey, summary) : null
      const { data, error } = await supabase
          .from('ai_memories')
          .insert({
            user_id: auth.userId,
            content: summary,
            embedding,
            metadata: { persona_id: personaId },
            created_at: new Date().toISOString()
          })
          .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error storing AI memory:', error)
      return { success: false, error }
    }
  },

  async getRecentMemories(userId, personaId, limit = 3) {
    try {
      const auth = await this.ensureSignedIn()
      if (!auth.success || !auth.userId) return { success: false, data: [] }

      const { data, error } = await supabase
          .from('ai_memories')
          .select('content, created_at')
          .eq('user_id', auth.userId)
          .order('created_at', { ascending: false })
          .limit(limit)

      if (error) throw error
      return { success: true, data: (data || []).map(r => r.content) }
    } catch (error) {
      console.error('Error fetching AI memories:', error)
      return { success: false, error, data: [] }
    }
  },

  async getRelevantMemories(userId, personaId, queryText, limit = 3, apiKey) {
    try {
      const auth = await this.ensureSignedIn()
      if (!auth.success || !auth.userId) return await this.getRecentMemories(userId, personaId, limit)

      const queryEmbedding = apiKey ? await openRouterEmbed(apiKey, queryText) : null
      if (!queryEmbedding) return await this.getRecentMemories(userId, personaId, limit)

      const { data, error } = await supabase
          .rpc('match_ai_memories', {
            query_embedding: queryEmbedding,
            match_threshold: 0.7,
            match_count: limit
          })

      if (error) {
        return await this.getRecentMemories(userId, personaId, limit)
      }
      return { success: true, data: (data || []).map(r => r.content) }
    } catch (error) {
      console.error('Error fetching relevant AI memories:', error)
      return await this.getRecentMemories(userId, personaId, limit)
    }
  }
}