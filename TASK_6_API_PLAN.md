# Task 6: API Route Handlers

**Status**: 🚀 STARTING

## Overview
Create Next.js API routes for all advanced features with authentication, validation, and Supabase integration.

## API Routes to Create

### 1. Profile Slugs API
**Endpoint**: `/api/profile-slugs`

Routes:
- `POST /api/profile-slugs` - Create new profile slug
- `GET /api/profile-slugs` - List user's profile slugs
- `GET /api/profile-slugs/[slugId]` - Get specific profile slug
- `PUT /api/profile-slugs/[slugId]` - Update profile slug
- `DELETE /api/profile-slugs/[slugId]` - Delete profile slug
- `GET /api/profile-slugs/public/[slug]` - Get public profile by slug

### 2. Message Groups API
**Endpoint**: `/api/message-groups`

Routes:
- `POST /api/message-groups` - Create new group
- `GET /api/message-groups` - List user's groups
- `GET /api/message-groups/[groupId]` - Get group details
- `PUT /api/message-groups/[groupId]` - Update group
- `DELETE /api/message-groups/[groupId]` - Delete group
- `POST /api/message-groups/[groupId]/members` - Add member
- `DELETE /api/message-groups/[groupId]/members/[userId]` - Remove member

### 3. Calls API
**Endpoint**: `/api/calls`

Routes:
- `POST /api/calls` - Initiate call
- `GET /api/calls` - List user's calls
- `GET /api/calls/[callId]` - Get call details
- `PUT /api/calls/[callId]` - Update call (status, participants)
- `DELETE /api/calls/[callId]` - End call
- `POST /api/calls/[callId]/participants` - Add participant
- `DELETE /api/calls/[callId]/participants/[userId]` - Remove participant

### 4. Meetings API
**Endpoint**: `/api/meetings`

Routes:
- `POST /api/meetings` - Create meeting
- `GET /api/meetings` - List meetings
- `GET /api/meetings/[meetingId]` - Get meeting details
- `PUT /api/meetings/[meetingId]` - Update meeting
- `DELETE /api/meetings/[meetingId]` - Delete meeting
- `POST /api/meetings/[meetingId]/participants` - Add participant
- `DELETE /api/meetings/[meetingId]/participants/[userId]` - Remove participant
- `POST /api/meetings/[meetingId]/recording/start` - Start recording
- `POST /api/meetings/[meetingId]/recording/stop` - Stop recording

### 5. Social Groups API
**Endpoint**: `/api/social-groups`

Routes:
- `POST /api/social-groups` - Create group
- `GET /api/social-groups` - List groups
- `GET /api/social-groups/[groupId]` - Get group details
- `PUT /api/social-groups/[groupId]` - Update group
- `DELETE /api/social-groups/[groupId]` - Delete group
- `POST /api/social-groups/[groupId]/posts` - Create post
- `POST /api/social-groups/[groupId]/invite` - Invite user
- `POST /api/social-groups/[groupId]/join-request` - Request to join
- `POST /api/social-groups/[groupId]/join-request/[requestId]/approve` - Approve join
- `POST /api/social-groups/[groupId]/join-request/[requestId]/reject` - Reject join

## Implementation Pattern

### Error Handling Structure
```typescript
try {
  // Validate input
  // Check authentication
  // Execute operation via Supabase
  // Return response
} catch (error) {
  if (error.code === 'PGRST') {
    return Response.json({ error: 'Database error' }, { status: 500 })
  }
  return Response.json({ error: error.message }, { status: 400 })
}
```

### Required Middleware
- Authentication (JWT from Supabase)
- Authorization (row-level security)
- Input validation (Zod schemas)
- Error handling
- Logging

## Files to Create
1. `src/app/api/profile-slugs/route.ts` - List & Create
2. `src/app/api/profile-slugs/[id]/route.ts` - Get, Update, Delete
3. `src/app/api/profile-slugs/public/[slug]/route.ts` - Public read
4. `src/app/api/message-groups/route.ts` - List & Create
5. `src/app/api/message-groups/[id]/route.ts` - Get, Update, Delete
6. `src/app/api/message-groups/[id]/members/route.ts` - Member management
7. `src/app/api/calls/route.ts` - List & Create
8. `src/app/api/calls/[id]/route.ts` - Get, Update, Delete
9. `src/app/api/calls/[id]/participants/route.ts` - Participant management
10. `src/app/api/meetings/route.ts` - List & Create
11. `src/app/api/meetings/[id]/route.ts` - Get, Update, Delete
12. `src/app/api/meetings/[id]/participants/route.ts` - Participant management
13. `src/app/api/meetings/[id]/recording/route.ts` - Recording management
14. `src/app/api/social-groups/route.ts` - List & Create
15. `src/app/api/social-groups/[id]/route.ts` - Get, Update, Delete
16. `src/app/api/social-groups/[id]/posts/route.ts` - Post management
17. `src/app/api/social-groups/[id]/invites/route.ts` - Invite management
18. `src/app/api/social-groups/[id]/join-requests/route.ts` - Join request management

## Authentication Strategy
- Verify JWT from Authorization header
- Extract user ID from JWT
- Use Supabase RLS for authorization
- Return 401 for missing/invalid token
- Return 403 for unauthorized access

## Database Integration
- Use Supabase client with row-level security
- All queries filtered by user_id
- Timestamps auto-managed by database
- Validation at both API and database level

## Status
- ⏳ Ready to implement
- ⏳ Estimated: 30-40 routes
- ⏳ Focus on CRUD operations with proper error handling
