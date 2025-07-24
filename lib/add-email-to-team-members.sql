-- Add email field to story_team_members table
ALTER TABLE story_team_members ADD COLUMN IF NOT EXISTS email TEXT;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_story_team_members_email ON story_team_members(email);

-- Update the question_recipients view to include email
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
  stm.email,
  stm.role,
  stm.status
FROM questions q
JOIN projects p ON q.story_id = p.id
JOIN story_team_members stm ON p.id = stm.story_id
WHERE stm.status = 'active' 
AND stm.role IN ('author', 'family');
