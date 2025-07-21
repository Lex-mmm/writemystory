# Fix Project Deletion Issue - Step by Step Instructions

## Problem
Projects are not being properly deleted from Supabase due to RLS (Row Level Security) policies blocking the service role from performing deletions.

## Solution Summary
1. Fix Supabase RLS policies to allow service role access
2. Update backend to use service role client for deletions
3. Ensure proper environment variables are set
4. Clear corrupted localStorage data

## Steps to Fix

### 1. Update Supabase RLS Policies
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `fix-supabase-rls.sql` and run it
4. This will create proper RLS policies that allow both user access and service role bypass

### 2. Verify Environment Variables
Make sure your `.env.local` file contains all these keys (copy from `.env.template`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

### 3. Get Your Supabase Keys
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the Project URL → use as `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "anon/public" key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy the "service_role" key → use as `SUPABASE_SERVICE_ROLE_KEY`

### 4. Clear Browser Data (Important!)
In your browser's developer console, run:
```javascript
Object.keys(localStorage).forEach(k => k.startsWith('story-') && localStorage.removeItem(k));
localStorage.removeItem('deletedProjects');
location.reload();
```

Or use the "Clear All Project Data & Reload" button in the development debug section.

### 5. Test the Fix
1. Restart your development server: `npm run dev`
2. Create a new project
3. Try to delete the project
4. Check that:
   - The project disappears from the dashboard immediately
   - The project is removed from the Supabase database
   - The project does not reappear after refreshing

## What Was Fixed
- **Backend**: Now uses `supabaseAdmin` (service role client) for deletions, bypassing RLS
- **RLS Policies**: Updated to allow service role access while maintaining user security
- **Frontend**: Added localStorage cleanup and better deleted project tracking
- **Environment**: Added missing `SUPABASE_SERVICE_ROLE_KEY` requirement

## Why It Broke
The security updates you made added RLS policies that prevented the service role from accessing the database properly. The service role should bypass RLS entirely, but the policies were too restrictive.

## Debugging
If it still doesn't work:
1. Check the browser Network tab for the DELETE request response
2. Check your server logs for detailed error messages
3. Verify the service role key is correct in your environment variables
4. Run the SQL script again to ensure RLS policies are correct
