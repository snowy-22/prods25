# 🔐 Admin System Quick Reference

## Admin Credentials

```
Email: admin@tv25.app
Email: doruk@tv25.app
Role: super_admin (all permissions)
```

Both accounts have full administrative access to all features.

---

## Admin Panel URL

```
https://yourdomain.com/admin
```

Automatically redirects to login if not authenticated.

---

## Main Features

### 1. Dashboard (`/admin`)
- Guest visitor statistics
- Real-time session count
- Action tracking
- Conversion metrics

### 2. Users (`/admin/users`)
- List all users
- View user details
- Change user roles
- Ban/unban users

### 3. Guest Analytics (`/admin/guest-analytics`)
- **Overview Tab**: Total sessions, unique visitors, actions, conversion rate
- **Actions Tab**: All tracked actions with timestamps
- **Sessions Tab**: Recent visitor sessions with duration
- **Conversion Tab**: Signup funnel visualization

---

## Role Levels (from lowest to highest)

| Role | Permissions | Use Case |
|------|-------------|----------|
| **user** | Basic access | Regular users |
| **analyst** | View analytics only | Data analysis |
| **moderator** | Moderate content, ban users | Community management |
| **admin** | User management, analytics | Admin operations |
| **super_admin** | Full access to all features | Platform owner |

---

## API Endpoints

### Authentication
```bash
POST /api/admin/verify
```
Body: `{ "email": "admin@tv25.app", "password": "demo" }`  
Returns: `{ "token": "...", "role": "super_admin", "expiresIn": "24h" }`

### Users
```bash
GET /api/admin/users
Headers: x-admin-email: admin@tv25.app
```
Returns: List of all users with roles and ban status

```bash
POST /api/admin/user-role
Headers: x-admin-email: admin@tv25.app
Body: { "userId": "...", "newRole": "moderator" }
```

```bash
POST /api/admin/user-ban
Headers: x-admin-email: admin@tv25.app
Body: { "userId": "...", "reason": "..." }
```

```bash
DELETE /api/admin/user-ban
Headers: x-admin-email: admin@tv25.app
Body: { "userId": "..." }
```

---

## Guest Analytics Tracking

Tracked events on guest canvas page:
- Page visits
- Content clicks
- Video play/pause
- Share attempts
- Comment attempts
- Tab changes
- Social interactions

All tracked in real-time and accessible from Admin > Guest Analytics.

---

## Quick Admin Tasks

### Check Total Visitors
1. Go to `/admin`
2. Look at "Toplam Ziyaretçi Oturumu" card

### View Recent User Sessions
1. Go to `/admin/guest-analytics`
2. Click "Sessions" tab
3. See list of recent visitor sessions

### Ban a User
1. Go to `/admin/users`
2. Find user in list
3. Click "Ban" button
4. Enter reason
5. User is immediately blocked

### Change User Role
1. Go to `/admin/users`
2. Select user
3. Choose new role from dropdown
4. Confirm change
5. Action logged to audit trail

### Export Analytics
1. Go to `/admin/guest-analytics`
2. Click "Export" button
3. Download as CSV or JSON

---

## Audit Trail

All admin actions automatically logged:
- User role changes
- User bans/unbans
- Analytics exports
- Permission changes

View in database: `admin_audit_logs` table

**Fields:**
- `admin_id` - Admin who made change
- `action` - Type of action
- `target_user_id` - User affected
- `details` - Change details
- `timestamp` - When it happened

---

## Permissions by Role

### super_admin
- ✅ users:read, users:write, users:delete
- ✅ content:moderate, content:create
- ✅ analytics:read, analytics:write
- ✅ admin:manage, admin:create_token
- ✅ All other permissions

### admin
- ✅ users:read, users:write
- ✅ content:moderate, content:create
- ✅ analytics:read, analytics:write
- ✅ notifications:send
- ✅ reports:view
- ✅ export:data

### moderator
- ✅ content:moderate, content:create
- ✅ users:read
- ✅ notifications:send
- ❌ users:write, users:delete
- ❌ admin:manage

### analyst
- ✅ analytics:read
- ✅ reports:view
- ❌ All write/delete permissions

### user
- ✅ content:create
- ❌ Admin features

---

## Troubleshooting

**Can't access admin panel?**
- Make sure you're logged in
- Verify your email is admin@tv25.app or doruk@tv25.app
- Check browser console for errors

**Analytics not showing?**
- Ensure guest-canvas page was visited
- Check Supabase tables exist
- Verify network requests complete

**API returning 401/403?**
- Include `x-admin-email` header in all requests
- Verify admin email is in predefined list
- Check JWT token not expired

---

## Resources

📖 **Full Documentation**: See `ADMIN_SETUP_COMPLETE.md`

💻 **Code Files**:
- Admin Security: `src/lib/admin-security.ts`
- Guest Analytics: `src/lib/guest-analytics.ts`
- Admin Pages: `src/app/admin/`
- API Endpoints: `src/app/api/admin/`

🔗 **Links**:
- Admin Dashboard: `/admin`
- Guest Canvas: `/guest-canvas`
- Landing Page: `/`

---

**Last Updated**: January 21, 2026  
**Version**: 1.0
