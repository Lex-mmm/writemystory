-- Quick verification query to check if email_responses table exists
-- Run this in your Supabase SQL editor or database client

-- Check if the email_responses table exists
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'email_responses' 
ORDER BY ordinal_position;

-- Check if tracking fields were added to questions table
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name IN ('forwarded_to', 'forwarded_at', 'forwarded_count', 'last_forwarded_method')
ORDER BY ordinal_position;
