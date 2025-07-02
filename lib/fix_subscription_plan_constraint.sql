-- Fix subscription plan constraint to include 'admin_comp' plan
-- Execute this in your Supabase SQL Editor

-- Drop the existing check constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- Add the updated check constraint with 'admin_comp' plan
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check 
  CHECK (plan IN ('free', 'starter', 'comfort', 'deluxe', 'admin_comp'));

-- Verify the constraint was updated
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'subscriptions'::regclass 
AND conname = 'subscriptions_plan_check';
