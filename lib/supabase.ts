// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we're in a build environment
const isBuild = process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (!isBuild) {
    console.error('Missing Supabase environment variables. Please check your configuration.');
  }
}

// Create client with fallback values for build time
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !isBuild,
    autoRefreshToken: !isBuild
  },
  global: {
    headers: {
      'x-application-name': 'writemystory-frontend'
    }
  }
});

// Add a function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Add a simple connection check function
export async function checkSupabaseConnection() {
  try {
    if (!isSupabaseConfigured()) {
      console.error('Supabase credentials not configured');
      return false;
    }

    // Simple query to check connection - try projects table first
    const { error } = await supabase.from('projects').select('id').limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, try to create it
      console.log('Projects table does not exist, attempting to create...');
      await createTables();
      return true;
    }
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
}

// Function to create tables if they don't exist
export async function createTables() {
  try {
    console.log('Creating database tables...');
    
    // Create projects table
    const { error: projectsError } = await supabase.rpc('create_projects_table_if_not_exists');
    if (projectsError && !projectsError.message.includes('already exists')) {
      console.error('Error creating projects table:', projectsError);
    }
    
    // Create questions table  
    const { error: questionsError } = await supabase.rpc('create_questions_table_if_not_exists');
    if (questionsError && !questionsError.message.includes('already exists')) {
      console.error('Error creating questions table:', questionsError);
    }
    
    // Create answers table
    const { error: answersError } = await supabase.rpc('create_answers_table_if_not_exists');
    if (answersError && !answersError.message.includes('already exists')) {
      console.error('Error creating answers table:', answersError);
    }
    
    console.log('Database tables created successfully');
    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
}

// Database initialization function - run this once to create tables
export async function initializeDatabase() {
  try {
    await createTables();
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

/*
IMPORTANT: Run these SQL commands in your Supabase SQL editor to create the required tables and functions:

-- Function to create projects table
CREATE OR REPLACE FUNCTION create_projects_table_if_not_exists()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    person_name TEXT,
    subject_type TEXT NOT NULL,
    period_type TEXT NOT NULL,
    writing_style TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    progress INTEGER DEFAULT 15,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
  
  -- Enable RLS (Row Level Security)
  ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
  DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;  
  DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
  
  -- Create RLS policies that work with our auth system
  CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

  CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

  CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));
END;
$$ LANGUAGE plpgsql;

-- Function to create questions table
CREATE OR REPLACE FUNCTION create_questions_table_if_not_exists()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    type TEXT DEFAULT 'open',
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_questions_story_id ON questions(story_id);
  
  -- Enable RLS
  ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view questions for their projects" ON questions;
  DROP POLICY IF EXISTS "Users can insert questions for their projects" ON questions;
  
  -- Create policies
  CREATE POLICY "Users can view questions for their projects" ON questions
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = questions.story_id 
        AND projects.user_id = current_setting('app.current_user_id', true)
      )
    );

  CREATE POLICY "Users can insert questions for their projects" ON questions
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = questions.story_id 
        AND projects.user_id = current_setting('app.current_user_id', true)
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create answers table  
CREATE OR REPLACE FUNCTION create_answers_table_if_not_exists()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    story_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_answers_story_id ON answers(story_id);
  CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
  
  -- Enable RLS
  ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view answers for their projects" ON answers;
  DROP POLICY IF EXISTS "Users can insert answers for their projects" ON answers;
  DROP POLICY IF EXISTS "Users can update answers for their projects" ON answers;
  
  -- Create policies
  CREATE POLICY "Users can view answers for their projects" ON answers
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = answers.story_id 
        AND projects.user_id = current_setting('app.current_user_id', true)
      )
    );

  CREATE POLICY "Users can insert answers for their projects" ON answers
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = answers.story_id 
        AND projects.user_id = current_setting('app.current_user_id', true)
      )
    );

  CREATE POLICY "Users can update answers for their projects" ON answers
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = answers.story_id 
        AND projects.user_id = current_setting('app.current_user_id', true)
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Now run the functions to create the tables
SELECT create_projects_table_if_not_exists();
SELECT create_questions_table_if_not_exists();
SELECT create_answers_table_if_not_exists();
*/
