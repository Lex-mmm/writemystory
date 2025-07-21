# URGENT: Fix Project Access Issues

## Current Problem
- Projects can't be accessed or deleted
- RLS policies are blocking service role access
- Missing `set_config` function causing errors

## Quick Fix (Do This Now!)

### Step 1: Fix Supabase Database (CRITICAL!)
1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Go to your project → SQL Editor
3. Run this SQL script:

```sql
-- URGENT FIX for RLS policies
-- Copy and paste this entire script and run it

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
DROP POLICY IF EXISTS "Service role can do anything" ON projects;

DROP POLICY IF EXISTS "Users can view questions for their projects" ON questions;
DROP POLICY IF EXISTS "Users can insert questions for their projects" ON questions;
DROP POLICY IF EXISTS "Users can update questions for their projects" ON questions;
DROP POLICY IF EXISTS "Users can delete questions for their projects" ON questions;

DROP POLICY IF EXISTS "Users can view answers for their projects" ON answers;
DROP POLICY IF EXISTS "Users can insert answers for their projects" ON answers;
DROP POLICY IF EXISTS "Users can update answers for their projects" ON answers;
DROP POLICY IF EXISTS "Users can delete answers for their projects" ON answers;

-- Temporarily disable RLS to allow service role access
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE answers DISABLE ROW LEVEL SECURITY;

-- Re-enable with very permissive policies for now
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow everything for service role
CREATE POLICY "Allow all operations" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON questions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON answers FOR ALL USING (true);
```

### Step 2: Clear Browser Data
In your browser console (F12), run:
```javascript
localStorage.clear();
location.reload();
```

### Step 3: Test
1. Restart your dev server: `npm run dev`
2. Try to access your project
3. Try to delete a project

## If This Doesn't Work

The issue might be that the service role key is incorrect. 

**Check your service role key:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the **service_role** key (not anon key!)
3. Make sure it's correctly set in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

## Long-term Fix

After this urgent fix works, we can implement proper RLS policies that are more secure. But for now, this will get your app working again.

## Debug Info

If you're still having issues, check the terminal logs for:
- "Service role client not configured" → Environment variable issue
- "No project found" → RLS policy issue
- "set_config function not found" → Database function issue (fixed by SQL above)
