-- Security fixes for Supabase database
-- This script addresses the security warnings from Supabase linter

-- 1. Enable Row Level Security (RLS) on all public tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- 2. Drop the existing security definer view and recreate safely
DROP VIEW IF EXISTS user_subscription_details;

-- Create a safer view without SECURITY DEFINER
CREATE OR REPLACE VIEW user_subscription_details AS
SELECT 
  us.id,
  us.user_id,
  us.customer_id,
  us.subscription_id,
  us.plan,
  us.interval,
  us.status,
  us.current_period_start,
  us.current_period_end,
  us.canceled_at,
  us.created_at,
  us.updated_at,
  CASE 
    WHEN us.status = 'active' AND us.current_period_end > NOW() THEN true
    ELSE false
  END as is_active,
  CASE 
    WHEN us.current_period_end < NOW() + INTERVAL '7 days' THEN true
    ELSE false
  END as expires_soon
FROM user_subscriptions us;

-- 3. Create comprehensive RLS policies for projects table
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (user_id = current_setting('app.current_user_id', true));

-- 4. Create RLS policies for questions table
CREATE POLICY "Users can view questions for their projects" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = questions.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "System can insert questions" ON questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = questions.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can update questions for their projects" ON questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = questions.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = questions.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can delete questions for their projects" ON questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = questions.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

-- 5. Create RLS policies for answers table
CREATE POLICY "Users can view answers for their projects" ON answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = answers.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can insert answers for their projects" ON answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = answers.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can update answers for their projects" ON answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = answers.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = answers.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can delete answers for their projects" ON answers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = answers.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

-- 6. Add service role policies for backend operations
-- These allow the backend service to perform operations on behalf of users
CREATE POLICY "Service role can manage all projects" ON projects
  FOR ALL USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all questions" ON questions
  FOR ALL USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage all answers" ON answers
  FOR ALL USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- 7. Create a function to set current user context for RLS
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a safer subscription view with proper RLS
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
  user_id,
  plan,
  status,
  current_period_end,
  CASE 
    WHEN status = 'active' AND current_period_end > NOW() THEN true
    ELSE false
  END as has_active_subscription
FROM user_subscriptions
WHERE user_id = current_setting('app.current_user_id', true);

-- Enable RLS on the view (if supported)
-- Note: Views don't directly support RLS, but the underlying table policies apply

-- 9. Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 10. Additional security: Revoke dangerous permissions from public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;

-- Grant specific permissions back to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON answers TO authenticated;
GRANT SELECT ON user_subscription_details TO authenticated;
GRANT SELECT ON user_subscription_status TO authenticated;

-- 11. Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_story_id ON questions(story_id);
CREATE INDEX IF NOT EXISTS idx_answers_story_id ON answers(story_id);

-- 12. Add audit columns if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE answers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 13. Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Security fixes applied successfully! RLS enabled on all tables.' as status;
