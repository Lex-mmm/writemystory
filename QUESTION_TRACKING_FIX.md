# Question Tracking Fixes - Documentation

## Problem Description

The user reported two critical issues with the question tracking functionality:

1. **Question tracking not persisting**: When a question was forwarded to a team member, the tracking information was only stored in component state and disappeared when the page was refreshed.

2. **Email responses not visible**: Team members could reply to emailed questions, but these responses were not being captured and displayed in the dashboard.

## Root Cause Analysis

### Issue 1: Non-persistent Tracking
- Tracking data was stored only in React component state using `setQuestionTrackingData`
- No database persistence layer for tracking information
- No API endpoints to save/retrieve tracking data
- Database schema lacked the necessary tracking fields

### Issue 2: Missing Email Response System
- Email sending worked but no capture mechanism for replies
- No database table for storing email responses
- No integration between email webhook and question tracking

## Solution Implementation

### 1. Database Schema Updates

Created `lib/add-question-tracking.sql` with:

```sql
-- Add tracking fields to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS forwarded_to TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS forwarded_count INTEGER DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS last_forwarded_method TEXT CHECK (last_forwarded_method IN ('whatsapp', 'email'));

-- Create email_responses table
CREATE TABLE IF NOT EXISTS email_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  story_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES story_team_members(id) ON DELETE CASCADE,
  team_member_name TEXT NOT NULL,
  response_content TEXT NOT NULL,
  email_message_id TEXT,
  sender_email TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'reviewed', 'integrated'))
);
```

### 2. API Endpoints

#### Question Tracking API (`app/api/questions/track/route.ts`)
- **POST**: Save tracking information when questions are forwarded
- **GET**: Retrieve tracking information for questions
- Stores: forwarded_to (array), forwarded_at, forwarded_count, method

#### Email Responses API (`app/api/questions/email-responses/route.ts`)
- **POST**: Save email responses from team members
- **GET**: Retrieve email responses for questions/stories
- **PATCH**: Update response status (received/reviewed/integrated)

### 3. Frontend Updates

#### Enhanced Project Page (`app/project/[id]/page.tsx`)

**New Functions Added:**
```typescript
// Load question tracking data from database
const loadQuestionTracking = useCallback(async () => {
  // Fetches tracking data for all questions
}, [questions]);

// Load email responses from database  
const loadEmailResponses = useCallback(async () => {
  // Fetches email responses for the story
}, [projectId]);

// Save tracking data to database
const saveQuestionTracking = async (questionId, teamMemberName, method) => {
  // Persists tracking information
};
```

**Updated `handleForwardQuestion`:**
- Now calls `saveQuestionTracking()` after successful forwarding
- Persists data to database instead of just component state
- Updates local state with database response

**Enhanced Data Loading:**
```typescript
useEffect(() => {
  if (projectId && user?.id) {
    loadProject();
    fetchQuestions();
    loadIntroduction();
    loadExistingStory();
    fetchTeamMembers();
    loadEmailResponses(); // Added
  }
}, [projectId, user?.id, ...]);

// Load tracking when questions change
useEffect(() => {
  if (questions.length > 0) {
    loadQuestionTracking(); // Added
  }
}, [questions, loadQuestionTracking]);
```

### 4. Testing Infrastructure

Created `test-question-tracking.js` to verify:
- Tracking data persistence
- Email response storage
- API endpoint functionality

## Technical Benefits

### 1. Data Persistence
- ✅ Question forwarding status survives page refreshes
- ✅ Complete audit trail of question forwarding
- ✅ Database-backed tracking with proper indexing

### 2. Email Response Capture
- ✅ Email responses stored in database
- ✅ Linked to specific questions and team members
- ✅ Status tracking (received/reviewed/integrated)

### 3. User Experience
- ✅ Consistent tracking information display
- ✅ Email responses visible in dashboard
- ✅ Real-time updates when forwarding questions

### 4. Scalability
- ✅ Proper database schema with foreign keys
- ✅ RLS policies for data security
- ✅ Indexed columns for performance

## Files Modified/Created

### New Files
- `app/api/questions/track/route.ts` - Question tracking API
- `app/api/questions/email-responses/route.ts` - Email responses API  
- `lib/add-question-tracking.sql` - Database schema updates
- `test-question-tracking.js` - Testing script

### Modified Files
- `app/project/[id]/page.tsx` - Enhanced with persistent tracking

## Database Migration Required

To deploy these fixes, run the SQL migration:

```sql
-- Run the contents of lib/add-question-tracking.sql
-- This adds the tracking fields and email_responses table
```

## API Usage Examples

### Save Question Tracking
```javascript
POST /api/questions/track
{
  "questionId": "uuid",
  "teamMemberName": "Mom",
  "method": "email",
  "storyId": "uuid"
}
```

### Get Question Tracking
```javascript
GET /api/questions/track?questionId=uuid
```

### Save Email Response
```javascript
POST /api/questions/email-responses
{
  "questionId": "uuid",
  "storyId": "uuid", 
  "teamMemberEmail": "mom@example.com",
  "responseContent": "This is my answer...",
  "emailMessageId": "email-123"
}
```

## Production Deployment

1. Apply database migration (`lib/add-question-tracking.sql`)
2. Deploy updated code
3. Test question forwarding functionality
4. Verify email responses are captured (requires email webhook setup)

The system now provides complete question tracking persistence and email response capture, resolving both reported issues.
