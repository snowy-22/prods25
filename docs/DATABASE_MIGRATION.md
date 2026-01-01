# Database Migration Guide

## 🚀 Quick Start

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire contents of `docs/supabase_schema.sql`
5. Paste and click **Run**
6. Verify with: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';`

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Push schema to database
supabase db push
```

### Option 3: GitHub Actions (Automated)

This repository includes automated database sync via GitHub Actions.

**Setup:**

1. Add secrets to your GitHub repository:
   - `SUPABASE_ACCESS_TOKEN` - Get from Supabase Dashboard > Settings > API
   - `SUPABASE_DB_PASSWORD` - Your database password
   - `SUPABASE_PROJECT_ID` - Your project reference ID

2. Push changes to `docs/supabase_schema.sql`

3. GitHub Actions will automatically deploy the schema

## 📊 Database Structure

### Core Tables

1. **items** - Content items (videos, folders, widgets)
2. **profiles** - User profiles and settings
3. **follows** - User follow relationships
4. **organizations** - Company/community pages
5. **organization_members** - Organization membership
6. **organization_follows** - Organization followers

### Feature Tables

7. **comments** - User comments with threading
8. **analyses** - AI analysis results
9. **ratings** - Content ratings (stars, priority, etc.)
10. **spaces** - Device grouping and organization
11. **devices** - Multi-screen device management
12. **shared_items** - Content sharing with permissions
13. **notifications** - User notifications
14. **guest_sessions** - Temporary guest access (24h)

## 🔒 Row Level Security (RLS)

All tables have RLS enabled except `guest_sessions` (token-based auth).

**Default Policies:**

- **Items**: Owner can CRUD, public read if shared
- **Profiles**: Owner update, public read
- **Comments**: User CRUD on own, public read
- **Analyses**: Private to user
- **Shared Items**: Complex (owner + shared_with + public)
- **Devices**: Owner-only access
- **Notifications**: User-only access

## 📈 Performance Indexes

The schema includes optimized indexes for:

- Parent-child relationships (items tree)
- User lookups (username, email)
- Social queries (follows, followers)
- Multi-device queries (spaces, devices, online status)
- Unread notifications

## 🧪 Testing the Migration

Run this query after migration:

```sql
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'items', 'profiles', 'follows', 'organizations',
        'organization_members', 'organization_follows',
        'comments', 'analyses', 'ratings', 'spaces',
        'devices', 'shared_items', 'notifications', 'guest_sessions'
    );
    
    RAISE NOTICE 'Tables created: % / 14', table_count;
END $$;
```

Expected output: `Tables created: 14 / 14`

## 🛠️ Maintenance

### Clean Up Expired Guest Sessions

Manually run:

```sql
SELECT cleanup_expired_guest_sessions();
```

Or schedule with pg_cron (requires extension):

```sql
SELECT cron.schedule(
    'cleanup-guest-sessions',
    '0 2 * * *', -- Every day at 2 AM
    $$SELECT cleanup_expired_guest_sessions();$$
);
```

### Get User Statistics

```sql
SELECT * FROM get_user_stats('user-uuid-here');
```

Returns:
- `follower_count`
- `following_count`
- `items_count`
- `comments_count`

## 🔄 Syncing with Vercel

### Environment Variables

Add to Vercel project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Auto-Deploy Workflow

1. Push schema changes to GitHub
2. GitHub Actions runs migration
3. Vercel rebuilds with new schema
4. Zero downtime deployment ✨

## 📝 Troubleshooting

### "relation does not exist" error

- Check if tables are created: `\dt` in psql
- Verify schema is in `public` schema
- Run migration again

### RLS policy errors

- Check user authentication
- Verify `auth.uid()` matches owner_id
- Review policy conditions in `pg_policies`

### Guest session issues

- Confirm `guest_sessions` table exists
- Check session token is valid
- Verify expiration timestamp

## 🎯 Next Steps

1. ✅ Run migration (Dashboard or CLI)
2. ✅ Test guest login flow
3. ✅ Verify RLS policies
4. ✅ Set up GitHub Actions
5. ✅ Configure Vercel env vars
6. ✅ Test production deployment

## 🆘 Support

If you encounter issues:

1. Check Supabase logs: Dashboard > Logs
2. Verify table structure: `\d table_name` in psql
3. Test queries manually in SQL Editor
4. Review RLS policies: `SELECT * FROM pg_policies;`

---

**Last Updated:** December 2024  
**Schema Version:** 2.0  
**Compatible With:** Supabase PostgreSQL 15+
