import { supabase } from '../utils/supabase'

// User profile operations
export const userService = {
  // Create or update user profile
  async upsertUserProfile(userData) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userData.id,
          name: userData.name,
          gender: userData.gender,
          interested_in: userData.interestedIn,
          avatar: userData.avatar,
          created_at: new Date().toISOString(),
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
      const { data, error } = await supabase
        .from('user_swipes')
        .insert({
          user_id: userId,
          persona_id: personaId,
          action: action, // 'like' or 'pass'
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
      const { data, error } = await supabase
        .from('user_matches')
        .insert({
          user_id: userId,
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
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          persona_id: personaId,
          message: message,
          sender: sender, // 'user' or 'ai'
          timestamp: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error logging message:', error)
      return { success: false, error }
    }
  },

  // Get user statistics
  async getUserStats(userId) {
    try {
      const { data: swipes, error: swipeError } = await supabase
        .from('user_swipes')
        .select('action')
        .eq('user_id', userId)
      
      const { data: matches, error: matchError } = await supabase
        .from('user_matches')
        .select('*')
        .eq('user_id', userId)

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
  }
}
