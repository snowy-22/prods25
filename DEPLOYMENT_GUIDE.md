# 🚀 CanvasFlow - Deployment & Migration Guide

## 📦 Quick Start

### 1. Supabase Database Setup

#### Run the Migration
```sql
-- Connect to your Supabase SQL Editor
-- Copy and paste the entire contents of:
supabase/migrations/20250301_complete_schema.sql

-- Execute the migration
-- Verify 13 tables created:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

#### Expected Tables
```
✅ achievements
✅ analytics_events
✅ api_keys
✅ audit_logs
✅ content_items
✅ gdpr_data_requests
✅ page_views
✅ profiles
✅ purchases
✅ reservations
✅ user_achievements
✅ users
✅ verification_chain
```

### 2. Environment Variables

Create `.env.local`:

```env
# Supabase - REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Config - REQUIRED
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development

# Stripe - OPTIONAL (for e-commerce)
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...

# Security - OPTIONAL (for encryption features)
ENCRYPTION_KEY=your-32-byte-hex-key-here

# Philips Hue - OPTIONAL
HUE_BRIDGE_IP=192.168.1.100
HUE_USERNAME=your-hue-username
```

### 3. OAuth Setup (Supabase)

#### Google OAuth
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google
3. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
4. Get Client ID & Secret from Google Cloud Console
5. Paste into Supabase

#### GitHub OAuth
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable GitHub
3. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
4. Create OAuth App on GitHub
5. Paste Client ID & Secret into Supabase

### 4. Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3001
```

### 5. Production Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add environment variables in Vercel Dashboard
# Project Settings → Environment Variables
```

## 🗃️ Database Schema Overview

### Core Tables

#### `users`
Extended user profiles with roles, preferences, and metadata.
```sql
- id (UUID, FK to auth.users)
- username (TEXT, UNIQUE)
- email (TEXT)
- role (TEXT: user|moderator|admin|super_admin)
- preferences (JSONB)
- created_at, updated_at
```

#### `content_items`
Universal content storage: spaces, devices, widgets, folders, media.
```sql
- id (TEXT, PK)
- user_id (UUID, FK to users)
- type (TEXT: space|device|widget|folder|video|...)
- title, content, icon
- x, y, width, height (layout properties)
- space_type, address, container_inventory (for spaces)
- metadata (JSONB) - for device properties, widget data
- children (JSONB) - for folders
```

#### `profiles`
Social features: followers, likes, posts.
```sql
- id (UUID, FK to auth.users)
- username (UNIQUE)
- follower_count, following_count
- like_count, comment_count, item_count
- is_verified
```

### Gamification

#### `achievements`
Achievement definitions.
```sql
- id (TEXT, PK)
- title, description
- category, tier (bronze|silver|gold|platinum)
- points, icon
- criteria (JSONB)
```

#### `user_achievements`
Awarded achievements per user.
```sql
- user_id + achievement_id (UNIQUE)
- awarded_at
- progress
```

#### `verification_chain`
Blockchain-style achievement verification.
```sql
- block_hash, previous_hash, signature
- timestamp
```

### E-Commerce

#### `reservations`
Item reservations with expiry.
```sql
- user_id, item_id, item_name
- quantity, total_price
- status (pending|confirmed|cancelled|expired)
- expires_at, confirmation_code
```

#### `purchases`
Completed purchases with Stripe integration.
```sql
- user_id, reservation_id
- payment_status, stripe_payment_intent_id
- confirmation_code
```

### Analytics & Security

#### `analytics_events`
User behavior tracking.
```sql
- event_type, event_data (JSONB)
- session_id, user_agent, ip_address
```

#### `audit_logs`
Security audit trail.
```sql
- action, resource_type, resource_id
- changes (JSONB)
- severity (low|medium|high|critical)
```

#### `gdpr_data_requests`
GDPR compliance: data export/deletion.
```sql
- request_type (export|deletion)
- status, data_url
- scheduled_deletion_at (30-day grace period)
```

## 🔐 Row Level Security (RLS)

All tables have RLS enabled. Key policies:

### Users & Profiles
- ✅ Users can view/update own profile
- ✅ Profiles are publicly viewable

### Content Items
- ✅ Users can view/create/update/delete own items
- ✅ Only deletable items can be deleted (`is_deletable = true`)

### Achievements
- ✅ Public read (everyone can see achievements)
- ✅ Users can view own earned achievements

### Reservations & Purchases
- ✅ Users can only view/create own reservations
- ✅ Users can only view/create own purchases

### Analytics (Write-Only)
- ✅ Anyone can create events (for tracking)
- ✅ Only admins can read (requires service role)

## 📊 Performance Indexes

28 indexes created for optimal query performance:

**High-Impact Indexes:**
- `content_items(user_id)` - 90% of queries filter by user
- `content_items(type)` - Widget/space type filtering
- `content_items(assigned_space_id)` - Device-to-space mapping
- `user_achievements(user_id, achievement_id)` - Achievement lookups
- `reservations(user_id, status)` - Active reservation queries
- `analytics_events(user_id, event_type, created_at)` - Time-series analytics

## 🔧 Triggers & Functions

### Auto-Update Timestamps
```sql
-- Trigger on UPDATE for:
- users.updated_at
- content_items.updated_at
- profiles.updated_at
- reservations.updated_at
```

### Auto-Create Profile on Signup
```sql
CREATE TRIGGER on_auth_user_created
-- Creates users + profiles entries when Supabase auth.users row inserted
```

## 🌐 API Routes

### Authentication
- `POST /api/auth/callback` - OAuth callback handler

### Content Management
- `POST /api/content/sync-folder` - Sync content items

### Achievements
- `GET /api/achievements` - List achievements
- `POST /api/achievements` - Award achievement

### E-Commerce
- `POST /api/ecommerce` - Create reservation/purchase
- `GET /api/ecommerce?userId={id}` - Get user orders

### Analytics
- `POST /api/analytics` - Log event
- `GET /api/analytics` - Query analytics (admin)

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/user-role` - Change user role
- `POST /api/admin/user-ban` - Ban/unban user

### Payments (Stripe)
- `POST /api/payments` - Create checkout session
- `POST /api/payments/webhook` - Stripe webhook

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check Supabase URL and keys
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection in browser console
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const { data } = await supabase.from('users').select('count')
```

### RLS Policy Errors
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Test policy as specific user
SET ROLE authenticated;
SET request.jwt.claims.sub = 'user-uuid-here';
SELECT * FROM content_items; -- Should only return user's items
```

### Migration Already Run
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Drop all tables (CAUTION: DATA LOSS)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
-- Then re-run migration
```

## 📈 Monitoring

### Recommended Tools
- **Error Tracking:** Sentry
- **Analytics:** Plausible / Google Analytics
- **Performance:** Vercel Analytics
- **Database:** Supabase Dashboard → Performance

### Key Metrics to Track
- User signups per day
- Active users (DAU/MAU)
- Content items created
- Achievements earned
- Reservation → Purchase conversion
- API response times
- Database query performance

## 🔄 Backup Strategy

### Supabase Automatic Backups
- Daily automated backups (Pro plan)
- Point-in-time recovery

### Manual Export
```bash
# Export database
npx supabase db dump -f backup.sql

# Export storage (if using Supabase Storage)
npx supabase storage download --all
```

## 🚀 Launch Day Checklist

- [ ] Supabase migration complete
- [ ] RLS policies tested
- [ ] OAuth providers configured (Google, GitHub)
- [ ] Environment variables set in Vercel
- [ ] Domain connected
- [ ] SSL certificate active
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics tracking enabled
- [ ] Backup strategy confirmed
- [ ] Team notified
- [ ] Marketing materials ready

---

**Need Help?**
- 📧 Email: support@canvasflow.app
- 📖 Docs: [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)
- 🔧 Migrations: [supabase/migrations/](./supabase/migrations/)
