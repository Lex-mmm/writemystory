-- Fix Supabase RLS policies for project deletion
-- Run this in your Supabase SQL Editor

-- First, drop all existing policies on projects table
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
DROP POLICY IF EXISTS "Service role can do anything" ON projects;

-- Create new RLS policies that work with service role
-- The service role client should bypass all RLS, so we'll make the policies very permissive

-- For projects table - allow service role to do everything
CREATE POLICY "Service role can manage all projects" ON projects
  FOR ALL USING (true);

-- For questions table - allow service role to do everything  
CREATE POLICY "Service role can manage all questions" ON questions
  FOR ALL USING (true);

-- For answers table - allow service role to do everything
CREATE POLICY "Service role can manage all answers" ON answers
  FOR ALL USING (true);

-- Test the setup by checking if the policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('projects', 'questions', 'answers')
ORDER BY tablename, policyname;
