-- Create moderation_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('answer', 'story', 'question')),
    action VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'flag', 'remove', 'restore')),
    reason TEXT,
    admin_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_moderation_logs_content ON moderation_logs (content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin ON moderation_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs (created_at DESC);

-- Add RLS policy
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Policy for service role access only (admin functions)
CREATE POLICY "Enable all access for service role" ON moderation_logs
FOR ALL USING (auth.role() = 'service_role');
