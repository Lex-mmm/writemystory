-- Fix subscription status constraint to include 'incomplete' status
-- Execute this in your Supabase SQL Editor

-- Drop the existing check constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- Add the updated check constraint with 'incomplete' status
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('active', 'inactive', 'canceled', 'trialing', 'past_due', 'unpaid', 'incomplete'));

-- Verify the constraint was updated
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'subscriptions'::regclass 
AND conname = 'subscriptions_status_check';
