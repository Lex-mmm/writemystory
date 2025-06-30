-- Supabase SQL schema updates for WhatsApp integration

-- Create story_team_members table
CREATE TABLE IF NOT EXISTS story_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT, -- Optional: link to auth.users if they sign up
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('author', 'family', 'friend', 'collaborator')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contacted TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_story_team_members_story_id ON story_team_members(story_id);
CREATE INDEX IF NOT EXISTS idx_story_team_members_phone ON story_team_members(phone_number);
CREATE INDEX IF NOT EXISTS idx_story_team_members_role ON story_team_members(role);

-- Create media_answers table for handling media attachments
CREATE TABLE IF NOT EXISTS media_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('audio', 'image', 'video', 'document')),
  file_size INTEGER,
  duration INTEGER, -- for audio/video in seconds
  transcription TEXT, -- for audio files (can be added later via AI)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_answers_answer_id ON media_answers(answer_id);
CREATE INDEX IF NOT EXISTS idx_media_answers_type ON media_answers(media_type);

-- Enable RLS (Row Level Security) for new tables
ALTER TABLE story_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_team_members
CREATE POLICY "Users can view team members for their stories" ON story_team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = story_team_members.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can manage team members for their stories" ON story_team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = story_team_members.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

-- RLS policies for media_answers
CREATE POLICY "Users can view media for their stories" ON media_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM answers
      JOIN projects ON answers.story_id = projects.id
      WHERE answers.id = media_answers.answer_id
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "System can insert media answers" ON media_answers
  FOR INSERT WITH CHECK (true); -- Allow system to insert media

-- Create a function to automatically send questions via WhatsApp when inserted
CREATE OR REPLACE FUNCTION notify_whatsapp_question()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called by the application, not automatically
  -- Just log that a question was created
  RAISE NOTICE 'New question created: % for story: %', NEW.id, NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new questions (optional, for logging)
DROP TRIGGER IF EXISTS trigger_new_question ON questions;
CREATE TRIGGER trigger_new_question
  AFTER INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION notify_whatsapp_question();

-- Create a view for easy question-story-team member lookups
CREATE OR REPLACE VIEW question_recipients AS
SELECT 
  q.id as question_id,
  q.story_id,
  q.question,
  q.category,
  q.created_at as question_created_at,
  p.person_name,
  p.subject_type,
  p.user_id as story_owner,
  stm.id as team_member_id,
  stm.name as member_name,
  stm.phone_number,
  stm.role,
  stm.status
FROM questions q
JOIN projects p ON q.story_id = p.id
JOIN story_team_members stm ON p.id = stm.story_id
WHERE stm.status = 'active' 
AND stm.role IN ('author', 'family');

-- Update answers table to include skip functionality
ALTER TABLE answers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'answered' CHECK (status IN ('answered', 'skipped'));
ALTER TABLE answers ADD COLUMN IF NOT EXISTS skip_reason TEXT;

-- Update questions table to track status
ALTER TABLE questions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'skipped'));
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_answers_status ON answers(status);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

-- Payment and subscription tables
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  subscription_id TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL,
  interval TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  customer_id TEXT,
  subscription_id TEXT,
  plan TEXT NOT NULL,
  interval TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);

-- RLS policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can view their own checkout sessions" ON checkout_sessions
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

-- Sample data for testing (remove in production)
-- INSERT INTO story_team_members (story_id, name, phone_number, role) VALUES
-- ('some-story-uuid', 'Test Family Member', '+31612345678', 'family'),
-- ('some-story-uuid', 'Test Author', '+31687654321', 'author');
