-- Create user_sessions table to store user state
CREATE TABLE IF NOT EXISTS user_sessions (
                                             id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_view TEXT DEFAULT 'swipe',
    active_persona_id TEXT,
    matches JSONB DEFAULT '[]'::jsonb,
    available_skins JSONB DEFAULT '[]'::jsonb,
    current_script_index INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
    );

-- Create index for faster lookups
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own session"
    ON user_sessions FOR SELECT
                                    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session"
    ON user_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session"
    ON user_sessions FOR UPDATE
                                           USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own session"
    ON user_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Add match_data column to user_matches table to store full match object
ALTER TABLE user_matches ADD COLUMN IF NOT EXISTS match_data JSONB;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_sessions
CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE user_sessions IS 'Stores user session state for persistence across page reloads';