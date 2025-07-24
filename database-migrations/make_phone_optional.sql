-- Migration: Make phone_number optional in story_team_members table
-- This allows team members to be added with only email contact method

-- Remove NOT NULL constraint from phone_number column
ALTER TABLE story_team_members ALTER COLUMN phone_number DROP NOT NULL;

-- Add a check constraint to ensure at least one contact method is provided
-- This ensures either phone_number OR email is provided (or both)
ALTER TABLE story_team_members ADD CONSTRAINT check_contact_method 
CHECK (phone_number IS NOT NULL OR email IS NOT NULL);

-- Update any existing records that might have issues (shouldn't be any, but just in case)
-- This is just a safety check
DO $$
BEGIN
    -- Check if there are any records with both phone_number and email as NULL
    IF EXISTS (
        SELECT 1 FROM story_team_members 
        WHERE phone_number IS NULL AND email IS NULL
    ) THEN
        RAISE NOTICE 'Found records with no contact methods - these need manual review';
    END IF;
END $$;
