-- Add story_previews table for storing generated story drafts
CREATE TABLE IF NOT EXISTS story_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'edited', 'finalized')),
  word_count INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add introductions table for storing user's initial story input
CREATE TABLE IF NOT EXISTS introductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_story_previews_project_id ON story_previews(project_id);
CREATE INDEX IF NOT EXISTS idx_story_previews_user_id ON story_previews(user_id);
CREATE INDEX IF NOT EXISTS idx_story_previews_status ON story_previews(status);
CREATE INDEX IF NOT EXISTS idx_introductions_project_id ON introductions(project_id);
CREATE INDEX IF NOT EXISTS idx_introductions_user_id ON introductions(user_id);

-- Enable RLS (Row Level Security) for new tables
ALTER TABLE story_previews ENABLE ROW LEVEL SECURITY;
ALTER TABLE introductions ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_previews
CREATE POLICY "Users can view their own story previews" ON story_previews
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can manage their own story previews" ON story_previews
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- RLS policies for introductions
CREATE POLICY "Users can view their own introductions" ON introductions
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can manage their own introductions" ON introductions
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Add some additional columns to projects table if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_deceased BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS year_of_passing INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_detail JSONB;
