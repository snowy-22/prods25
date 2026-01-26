# Supabase Realtime Setup Guide

## Current Status
✅ Vercel build fixed (commit: e037e0c)
✅ Fresh package-lock.json with @types/react
✅ Realtime migration created (commit: bbd1b97)

## How to Enable Realtime in Supabase

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard
2. Select your project `prods25`
3. Go to **SQL Editor**
4. Open the migration file: `supabase/migrations/20260126_enable_realtime_all_tables.sql`
5. Copy all SQL commands
6. Paste into Supabase SQL Editor
7. Click **Run** to execute

### Option 2: Using Supabase CLI
```bash
# If you have supabase CLI installed locally
supabase link --project-ref qukzepteomenikeelzno
supabase migration up
```

### Option 3: Manual Individual Table Setup
If you prefer to enable realtime table by table through the Supabase dashboard:

1. Go to **Database** → **Publications**
2. Find `supabase_realtime` publication
3. Click **Add Table**
4. Select each table you want to enable realtime for:
   - canvas_items
   - social_posts
   - messages
   - conversations
   - likes
   - comments
   - And all others from the migration file

## What This Does

The migration enables **Supabase Realtime** for all major tables in your application:

### Canvas & Content (Live Updates)
- `canvas_items` - Real-time canvas item changes
- `tabs` - Tab synchronization across devices
- `layout_states` - Layout updates

### Social & Engagement (Live Feed)
- `social_posts` - New posts appear instantly
- `social_post_comments` - Comments show in real-time
- `social_post_reactions` - Like/reaction counts update
- `likes` - Engagement metrics live

### Collaboration (Team Work)
- `folder_collaborators` - Collaborator status
- `presence_states` - Who's editing what
- `collaboration_events` - Real-time collaboration events

### Messaging (Live Chat)
- `messages` - Instant messaging
- `conversations` - Chat list updates
- `calls` - Call status changes

### Marketplace & Inventory
- `marketplace_listings` - Product updates
- `orders` - Order status changes
- `inventory_items` - Stock updates

### And 20+ more tables!

## Testing Realtime

### In Your Next.js App:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Subscribe to canvas items changes
supabase
  .channel('public:canvas_items')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'canvas_items' },
    (payload) => {
      console.log('Canvas item changed:', payload)
      // Update UI here
    }
  )
  .subscribe()
```

### Quick Test in Browser Console:
```javascript
// This requires supabase client to be initialized globally
window.supabase.channel('public:social_posts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'social_posts' }, 
    (payload) => console.log('Social post update:', payload))
  .subscribe()
```

## Vercel Build Status

The Vercel build issue has been **FIXED**:
- ✅ Added @types/react as devDependency
- ✅ Regenerated package-lock.json
- ✅ Local build: 93/93 pages successful
- ✅ Latest commit: e037e0c

**Next Vercel build should succeed automatically.**

## Project Info
- **Repository**: snowy-22/prods25
- **Branch**: main
- **Supabase Project**: prods25 (ref: qukzepteomenikeelzno)
- **Region**: West EU (Ireland)
- **Latest Commits**:
  - bbd1b97 - feat: Add comprehensive Supabase realtime configuration
  - e037e0c - fix: Regenerate package-lock.json with @types/react
  - 8ec8749 - fix: Add @types/react devDependency
