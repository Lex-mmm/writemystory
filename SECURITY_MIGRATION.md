# Security Fixes for Supabase Database

This document explains how to fix the security warnings from Supabase's database linter.

## Issues Found

1. **Security Definer View** - `user_subscription_details` view using SECURITY DEFINER
2. **RLS Disabled** - Row Level Security not enabled on `answers`, `questions`, and `projects` tables

## Step 1: Apply SQL Security Fixes

Run the SQL script `security-fixes.sql` in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `lib/security-fixes.sql`
4. Execute the script

This will:
- Enable RLS on all public tables
- Create comprehensive RLS policies
- Fix the security definer view
- Add proper indexes for performance
- Set up audit columns and triggers

## Step 2: Update Your API Routes

After applying the SQL fixes, you need to update your API routes to work with RLS. Here's how:

### Before (without RLS):
```typescript
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET() {
  const { data } = await supabaseAdmin
    .from('projects')
    .select('*');
  return Response.json(data);
}
```

### After (with RLS):
```typescript
import { withRLS } from '../../../lib/rlsHelper';

export const GET = withRLS(async (client, userId) => {
  const { data } = await client
    .from('projects')
    .select('*');
  return Response.json(data);
});
```

## Step 3: Update Frontend Authentication

Ensure your frontend sends proper authorization headers:

```typescript
const token = await getIdToken();
const response = await fetch('/api/stories', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Step 4: Test the Changes

1. **Test API endpoints** - Ensure they still work with proper authentication
2. **Test unauthorized access** - Verify that requests without proper auth are rejected
3. **Test cross-user access** - Ensure users can't access other users' data

## Step 5: Verify Security Fixes

After applying the fixes, run the Supabase linter again to confirm all security issues are resolved:

1. Go to Settings → Database in your Supabase dashboard
2. Look for the database linter results
3. All security warnings should be resolved

## What Changed

### RLS Policies Created

- **Projects**: Users can only access their own projects
- **Questions**: Users can only access questions for their projects  
- **Answers**: Users can only access answers for their projects
- **Service Role**: Backend can perform operations on behalf of users

### Security Improvements

- Removed `SECURITY DEFINER` from views
- Added comprehensive RLS policies
- Added user context management
- Added audit columns and triggers
- Improved database indexes for RLS performance

### New Helper Functions

- `set_current_user_id()` - Sets user context for RLS
- `withRLS()` - Middleware for API routes
- `executeWithUserContext()` - Helper for user-scoped operations

## Migration Checklist

- [ ] Apply `security-fixes.sql` to database
- [ ] Update API routes to use RLS helpers
- [ ] Test authentication flows
- [ ] Verify linter warnings are resolved
- [ ] Test that users can only access their own data
- [ ] Deploy changes to production

## Notes

- The service role can still perform admin operations when needed
- All user-facing operations now respect RLS policies
- Performance should be similar due to proper indexing
- Backup your database before applying changes

## Troubleshooting

If you encounter issues after applying the fixes:

1. **"Policy violation" errors**: Check that user context is properly set
2. **Unauthorized errors**: Verify JWT tokens are valid and being sent
3. **Performance issues**: Check that indexes are properly created
4. **Function not found**: Ensure the `set_current_user_id` function was created

For help, check the Supabase documentation on RLS: https://supabase.com/docs/guides/auth/row-level-security
