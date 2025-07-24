-- Add tracking fields to questions table for question forwarding
-- This will allow persistent tracking of question forwarding status

-- Add tracking columns if they don't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS forwarded_to TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS forwarded_count INTEGER DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS last_forwarded_method TEXT CHECK (last_forwarded_method IN ('whatsapp', 'email'));

-- Add indexes for better performance on tracking queries
CREATE INDEX IF NOT EXISTS idx_questions_forwarded_at ON questions(forwarded_at);
CREATE INDEX IF NOT EXISTS idx_questions_forwarded_count ON questions(forwarded_count);

-- Create email_responses table to track team member email replies
CREATE TABLE IF NOT EXISTS email_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  story_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES story_team_members(id) ON DELETE CASCADE,
  team_member_name TEXT NOT NULL,
  response_content TEXT NOT NULL,
  email_message_id TEXT, -- For tracking email threads
  sender_email TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'reviewed', 'integrated'))
);

-- Add indexes for email_responses
CREATE INDEX IF NOT EXISTS idx_email_responses_question_id ON email_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_email_responses_story_id ON email_responses(story_id);
CREATE INDEX IF NOT EXISTS idx_email_responses_team_member_id ON email_responses(team_member_id);
CREATE INDEX IF NOT EXISTS idx_email_responses_received_at ON email_responses(received_at);
CREATE INDEX IF NOT EXISTS idx_email_responses_status ON email_responses(status);

-- Enable RLS for email_responses
ALTER TABLE email_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_responses
CREATE POLICY "Users can view email responses for their stories" ON email_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = email_responses.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "System can insert email responses" ON email_responses
  FOR INSERT WITH CHECK (true); -- Allow system to insert responses

CREATE POLICY "Users can update email responses for their stories" ON email_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = email_responses.story_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

-- Service role access for email_responses
CREATE POLICY "Service role can manage all email responses" ON email_responses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON email_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_responses TO service_role;

-- Create a view for easier email response queries
CREATE OR REPLACE VIEW email_responses_with_details AS
SELECT 
  er.id,
  er.question_id,
  er.story_id,
  er.team_member_id,
  er.team_member_name,
  er.response_content,
  er.email_message_id,
  er.sender_email,
  er.received_at,
  er.created_at,
  er.updated_at,
  er.status,
  q.question,
  q.category as question_category,
  p.person_name,
  p.subject_type,
  stm.name as team_member_full_name,
  stm.email as team_member_email
FROM email_responses er
JOIN questions q ON er.question_id = q.id
JOIN projects p ON er.story_id = p.id
LEFT JOIN story_team_members stm ON er.team_member_id = stm.id;

-- Add comment for documentation
COMMENT ON TABLE email_responses IS 'Stores email responses from team members to questions';
COMMENT ON COLUMN questions.forwarded_to IS 'JSON array of team member names who received this question';
COMMENT ON COLUMN questions.forwarded_at IS 'Last time this question was forwarded';
COMMENT ON COLUMN questions.forwarded_count IS 'Number of times this question has been forwarded';
COMMENT ON COLUMN questions.last_forwarded_method IS 'Last method used to forward this question (whatsapp or email)';
