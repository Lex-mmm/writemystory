-- Security fixes for Supabase database (Safe version)
-- This script addresses the security warnings from Supabase linter
-- and handles missing tables gracefully

-- 1. Enable Row Level Security (RLS) on existing public tables
DO $$
BEGIN
    -- Enable RLS on projects table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on projects table';
    ELSE
        RAISE NOTICE 'Projects table does not exist, skipping RLS';
    END IF;

    -- Enable RLS on questions table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
        ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on questions table';
    ELSE
        RAISE NOTICE 'Questions table does not exist, skipping RLS';
    END IF;

    -- Enable RLS on answers table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'answers') THEN
        ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on answers table';
    ELSE
        RAISE NOTICE 'Answers table does not exist, skipping RLS';
    END IF;
END $$;

-- 2. Drop the existing security definer view and recreate safely (only if user_subscriptions exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions') THEN
        -- Drop existing view
        DROP VIEW IF EXISTS user_subscription_details;
        
        -- Create a safer view without SECURITY DEFINER
        CREATE OR REPLACE VIEW user_subscription_details AS
        SELECT 
          us.id,
          us.user_id,
          us.customer_id,
          us.subscription_id,
          us.plan,
          us.interval,
          us.status,
          us.current_period_start,
          us.current_period_end,
          us.canceled_at,
          us.created_at,
          us.updated_at,
          CASE 
            WHEN us.status = 'active' AND us.current_period_end > NOW() THEN true
            ELSE false
          END as is_active,
          CASE 
            WHEN us.current_period_end < NOW() + INTERVAL '7 days' THEN true
            ELSE false
          END as expires_soon
        FROM user_subscriptions us;
        
        RAISE NOTICE 'User subscription view recreated safely';
    ELSE
        RAISE NOTICE 'User_subscriptions table does not exist, skipping view creation';
    END IF;
END $$;

-- 3. Create comprehensive RLS policies for projects table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        -- Create policies for projects
        DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
        CREATE POLICY "Users can view their own projects" ON projects
          FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

        DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
        CREATE POLICY "Users can insert their own projects" ON projects
          FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

        DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
        CREATE POLICY "Users can update their own projects" ON projects
          FOR UPDATE USING (user_id = current_setting('app.current_user_id', true))
          WITH CHECK (user_id = current_setting('app.current_user_id', true));

        DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
        CREATE POLICY "Users can delete their own projects" ON projects
          FOR DELETE USING (user_id = current_setting('app.current_user_id', true));

        -- Service role policy for projects
        DROP POLICY IF EXISTS "Service role can manage all projects" ON projects;
        CREATE POLICY "Service role can manage all projects" ON projects
          FOR ALL USING (current_setting('role') = 'service_role')
          WITH CHECK (current_setting('role') = 'service_role');

        RAISE NOTICE 'RLS policies created for projects table';
    END IF;
END $$;

-- 4. Create RLS policies for questions table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        
        DROP POLICY IF EXISTS "Users can view questions for their projects" ON questions;
        CREATE POLICY "Users can view questions for their projects" ON questions
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = questions.story_id 
              AND projects.user_id = current_setting('app.current_user_id', true)
            )
          );

        DROP POLICY IF EXISTS "System can insert questions" ON questions;
        CREATE POLICY "System can insert questions" ON questions
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = questions.story_id 
              AND projects.user_id = current_setting('app.current_user_id', true)
            )
          );

        DROP POLICY IF EXISTS "Users can update questions for their projects" ON questions;
        CREATE POLICY "Users can update questions for their projects" ON questions
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = questions.story_id 
              AND projects.user_id = current_setting('app.current_user_id', true)
            )
          ) WITH CHECK (
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = questions.story_id 
              AND projects.user_id = current_setting('app.current_user_id', true)
            )
          );

        DROP POLICY IF EXISTS "Users can delete questions for their projects" ON questions;
        CREATE POLICY "Users can delete questions for their projects" ON questions
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = questions.story_id 
              AND projects.user_id = current_setting('app.current_user_id', true)
            )
          );

        -- Service role policy for questions
        DROP POLICY IF EXISTS "Service role can manage all questions" ON questions;
        CREATE POLICY "Service role can manage all questions" ON questions
          FOR ALL USING (current_setting('role') = 'service_role')
          WITH CHECK (current_setting('role') = 'service_role');

        RAISE NOTICE 'RLS policies created for questions table';
    END IF;
END $$;

-- 5. Create RLS policies for answers table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'answers') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        
        DROP POLICY IF EXISTS "Users can view answers for their projects" ON answers;
        CREATE POLICY "Users can view answers for their projects" ON answers
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = answers.story_id 
              AND projects.user_id = current_setting('app.current_user_id', true)
            )
          );

        DROP POLICY IF EXISTS "Users can insert answers for their projects" ON answers;
        CREATE POLICY "Users can insert answers for their projects" ON answers
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = answers.story_id 
              AND projects.user_id = current_setting('app.current_user_id', true)
            )
          );

        DROP POLICY IF EXISTS "Users can update answers for their projects" ON answers;
        CREATE POLICY "Users can update answers for their projects" ON answers
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = answers.story_id 
              AND projects.user_id = current_setting('app.current_user_id', true)
            )
          ) WITH CHECK (
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = answers.story_id 
              AND projects.user_id = current_setting('app.current_user_id', true)
            )
          );

        DROP POLICY IF EXISTS "Users can delete answers for their projects" ON answers;
        CREATE POLICY "Users can delete answers for their projects" ON answers
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = answers.story_id 
              AND projects.user_id = current_setting('app.current_user_id', true)
            )
          );

        -- Service role policy for answers
        DROP POLICY IF EXISTS "Service role can manage all answers" ON answers;
        CREATE POLICY "Service role can manage all answers" ON answers
          FOR ALL USING (current_setting('role') = 'service_role')
          WITH CHECK (current_setting('role') = 'service_role');

        RAISE NOTICE 'RLS policies created for answers table';
    END IF;
END $$;

-- 6. Create a function to set current user context for RLS
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create a safer subscription view with proper RLS (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions') THEN
        CREATE OR REPLACE VIEW user_subscription_status AS
        SELECT 
          user_id,
          plan,
          status,
          current_period_end,
          CASE 
            WHEN status = 'active' AND current_period_end > NOW() THEN true
            ELSE false
          END as has_active_subscription
        FROM user_subscriptions
        WHERE user_id = current_setting('app.current_user_id', true);
        
        RAISE NOTICE 'User subscription status view created';
    END IF;
END $$;

-- 8. Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. Additional security: Revoke dangerous permissions from public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;

-- Grant specific permissions back to authenticated users for existing tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON questions TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'answers') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON answers TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'user_subscription_details') THEN
        GRANT SELECT ON user_subscription_details TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'user_subscription_status') THEN
        GRANT SELECT ON user_subscription_status TO authenticated;
    END IF;
END $$;

-- 10. Create indexes for better RLS performance (only for existing tables)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
        RAISE NOTICE 'Index created on projects.user_id';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
        CREATE INDEX IF NOT EXISTS idx_questions_story_id ON questions(story_id);
        RAISE NOTICE 'Index created on questions.story_id';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'answers') THEN
        CREATE INDEX IF NOT EXISTS idx_answers_story_id ON answers(story_id);
        RAISE NOTICE 'Index created on answers.story_id';
    END IF;
END $$;

-- 11. Add audit columns if they don't exist (only for existing tables)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'answers') THEN
        ALTER TABLE answers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 12. Create update triggers for updated_at columns (only for existing tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
        CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
        DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
        CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'answers') THEN
        DROP TRIGGER IF EXISTS update_answers_updated_at ON answers;
        CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Success message
SELECT 'Security fixes applied successfully! RLS enabled on existing tables.' as status;
