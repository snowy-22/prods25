-- User Canvas Data Sync
-- Real-time cloud storage for user libraries and canvas settings

-- Table for storing user's canvas state (tabs, layout, settings)
CREATE TABLE IF NOT EXISTS user_canvas_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('tabs', 'layout', 'settings', 'expanded_items')),
  data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, data_type)
);

-- Index for fast user lookups
CREATE INDEX idx_user_canvas_data_user_id ON user_canvas_data(user_id);
CREATE INDEX idx_user_canvas_data_type ON user_canvas_data(user_id, data_type);
CREATE INDEX idx_user_canvas_data_updated ON user_canvas_data(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE user_canvas_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/write their own data
CREATE POLICY "Users can manage their own canvas data"
  ON user_canvas_data
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamps
CREATE TRIGGER update_user_canvas_data_updated_at
  BEFORE UPDATE ON user_canvas_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for live sync
ALTER PUBLICATION supabase_realtime ADD TABLE user_canvas_data;

-- Table for user preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_mode TEXT DEFAULT 'grid',
  new_tab_behavior TEXT DEFAULT 'chrome-style',
  startup_behavior TEXT DEFAULT 'last-session',
  grid_mode_state JSONB,
  ui_settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for user preferences
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for preferences
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for preferences
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_preferences;

-- Comments
COMMENT ON TABLE user_canvas_data IS 'Stores user canvas state with real-time sync support';
COMMENT ON TABLE user_preferences IS 'Stores user UI preferences and settings';
COMMENT ON COLUMN user_canvas_data.data_type IS 'Type of data: tabs, layout, settings, expanded_items';
COMMENT ON COLUMN user_canvas_data.version IS 'Version number for optimistic locking';
COMMENT ON COLUMN user_canvas_data.device_id IS 'Optional device identifier for conflict resolution';
