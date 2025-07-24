-- Add table for storing email replies from team members
CREATE TABLE IF NOT EXISTS story_question_responses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  question_id TEXT NOT NULL,
  story_id TEXT NOT NULL,
  responder_email TEXT NOT NULL,
  responder_name TEXT,
  response_content TEXT NOT NULL,
  email_message_id TEXT, -- For tracking email thread
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'received' -- 'received', 'reviewed', 'integrated'
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_story_question_responses_question_id ON story_question_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_story_question_responses_story_id ON story_question_responses(story_id);
CREATE INDEX IF NOT EXISTS idx_story_question_responses_email ON story_question_responses(responder_email);
CREATE INDEX IF NOT EXISTS idx_story_question_responses_created_at ON story_question_responses(created_at);
