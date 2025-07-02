-- Migration to fix column naming for memorial stories
-- This adds the missing passed_away_year column and ensures consistency

-- Add the passed_away_year column if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS passed_away_year TEXT;

-- If year_of_passing exists, copy its data to passed_away_year and then drop it
DO $$
BEGIN
  -- Check if year_of_passing column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'projects' AND column_name = 'year_of_passing') THEN
    
    -- Copy data from year_of_passing to passed_away_year
    UPDATE projects 
    SET passed_away_year = year_of_passing::TEXT 
    WHERE year_of_passing IS NOT NULL;
    
    -- Drop the old column
    ALTER TABLE projects DROP COLUMN year_of_passing;
  END IF;
END $$;

-- Ensure is_deceased column exists
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_deceased BOOLEAN DEFAULT FALSE;

-- Add index for better performance on memorial story queries
CREATE INDEX IF NOT EXISTS idx_projects_is_deceased ON projects(is_deceased);
CREATE INDEX IF NOT EXISTS idx_projects_passed_away_year ON projects(passed_away_year);
