# Security Implementation Guide

## Overview
This guide covers the security features implemented in CanvasFlow, including authentication, authorization, data protection, and compliance.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│          (React Components, Next.js Pages)              │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              Security Middleware                         │
│  (Auth, RateLimit, Permission, CORS, Validation)       │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│           Security Services Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   RBAC   │  │ Encryption│  │ AuditLog │            │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ RateLimit│  │   GDPR   │  │ Middleware│            │
│  └──────────┘  └──────────┘  └──────────┘             │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│          Data Layer (Supabase + RLS)                    │
│  - Row-Level Security Policies                          │
│  - Encrypted Fields                                     │
│  - Audit Logging Triggers                               │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. RBAC (Role-Based Access Control)
**File**: `src/lib/security/rbac.ts`

#### Roles
- **user**: Basic user - can create/manage own items and chat
- **moderator**: Content moderation - can delete content, view analytics
- **admin**: Full admin access - can manage users and settings
- **super_admin**: System administrator - unlimited access

#### Usage
```typescript
import { hasPermission, canManageUsers } from '@/lib/security/rbac';

// Check specific permission
if (hasPermission(userRole, 'delete', 'chat')) {
  // Allow deletion
}

// Check capability
if (canManageUsers(userRole)) {
  // Show user management UI
}
```

#### Permission Matrix
| Role | Create | Read | Update | Delete | Manage Users | View Analytics |
|------|--------|------|--------|--------|--------------|----------------|
| User | Own ✓ | ✓ | Own ✓ | Own ✓ | ✗ | ✗ |
| Moderator | Own ✓ | ✓ | Own ✓ | ✓ | ✗ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Super Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 2. Audit Logging
**File**: `src/lib/security/audit-logger.ts`

Tracks all important user actions for security monitoring and compliance.

#### Tracked Actions
- User authentication (login, logout, signup)
- Data operations (create, read, update, delete)
- Sharing and access changes
- Permission denials
- GDPR requests (export, deletion)

#### Usage
```typescript
import { logAuditAction } from '@/lib/security/audit-logger';

// Log an action
await logAuditAction(userId, 'item.delete', 'item', {
  resourceId: itemId,
  details: { reason: 'user requested' },
  status: 'success'
});

// Query logs
const logs = await getAuditLogs(userId, {
  action: 'item.delete',
  limit: 50
});
```

#### Schema
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  action VARCHAR(255),
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp BIGINT,
  status VARCHAR(20)
);
```

### 3. Data Encryption
**File**: `src/lib/security/encryption.ts`

Provides encryption/decryption utilities for sensitive data.

#### Features
- AES-256-GCM authenticated encryption
- Secure hashing with salt
- Sensitive data masking
- Secure token generation

#### Usage
```typescript
import { encryptData, decryptData, hashData } from '@/lib/security/encryption';

// Encrypt sensitive data
const encrypted = encryptData(sensitiveText);
const decrypted = decryptData(encrypted);

// Hash passwords/API keys
const hashedPassword = hashData(password);

// Mask sensitive info
const masked = maskSensitiveData('test@example.com', 'email');
// Returns: test...@example.com
```

#### Encryption Algorithm
- **Algorithm**: AES-256-GCM (Advanced Encryption Standard)
- **Key Size**: 256 bits
- **IV**: 16 random bytes
- **Format**: `iv:ciphertext:authTag` (hex-encoded)

### 4. Rate Limiting
**File**: `src/lib/security/rate-limiter.ts`

Prevents abuse by limiting request frequency.

#### Presets
- **auth**: 5 requests per 15 minutes
- **api**: 100 requests per 15 minutes
- **public**: 1000 requests per 15 minutes
- **sensitive**: 10 requests per 60 minutes

#### Usage
```typescript
import { withRateLimit, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limiter';

// Apply rate limiting to API route
export const POST = withRateLimit(handler, RATE_LIMIT_PRESETS.auth);

// Manual checking
if (checkRateLimit(key, config)) {
  return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
}
```

### 5. GDPR Compliance
**File**: `src/lib/security/gdpr.ts`

Implements GDPR requirements: data portability, right to deletion, consent management.

#### Features
- **Data Export**: Portable JSON/CSV export of all user data
- **Right to Deletion**: 30-day grace period for account deletion
- **Data Anonymization**: Irreversible anonymization option
- **Consent Management**: Track user consent for different features

#### Usage
```typescript
import { 
  exportUserData, 
  requestUserDeletion, 
  updateUserConsent,
  hasConsentFor 
} from '@/lib/security/gdpr';

// Export user data (GDPR Article 20)
const data = await exportUserData(userId, 'json');

// Request account deletion (GDPR Article 17)
const { deletionDate } = await requestUserDeletion(userId);

// Manage consents
await updateUserConsent(userId, 'analytics', true);

// Check if user has consent before tracking
if (await hasConsentFor(userId, 'analytics')) {
  // Track event
}
```

### 6. Security Middleware
**File**: `src/lib/security/middleware.ts`

Composable middleware for API route protection.

#### Available Middleware
- **withAuth**: Verify user session
- **withRateLimit**: Apply rate limiting
- **withPermission**: Check user permissions
- **withCors**: Handle cross-origin requests
- **withSecurityHeaders**: Add security headers
- **withValidation**: Validate request input

#### Usage
```typescript
import { withMiddleware, withAuth, withRateLimit, withPermission } from '@/lib/security/middleware';

export const POST = withMiddleware(
  handler,
  [
    withAuth,
    withRateLimit,
    (h) => withPermission(h, 'create', 'item')
  ]
);
```

#### Security Headers Applied
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Implementation Checklist

### Backend Setup
- [ ] Run SQL schema migrations (`docs/security_schema.sql`)
- [ ] Set environment variables:
  ```env
  ENCRYPTION_KEY=<32-byte-hex-key>
  ENCRYPTION_SALT=<random-salt>
  NEXT_PUBLIC_APP_URL=<your-domain>
  ```
- [ ] Enable RLS policies in Supabase
- [ ] Configure CORS allowed origins

### API Routes Protection
- [ ] Wrap all `/api/*` routes with `withAuth`
- [ ] Apply `withRateLimit` based on endpoint sensitivity
- [ ] Use `withPermission` for resource-specific actions
- [ ] Add `withValidation` for POST/PUT requests
- [ ] Include `withSecurityHeaders` for responses

### Application Code
- [ ] Log important user actions with `logAuditAction`
- [ ] Check permissions before rendering UI
- [ ] Encrypt sensitive data in transit
- [ ] Validate user input on both client and server
- [ ] Implement GDPR controls in settings

### Monitoring
- [ ] Set up audit log review dashboard
- [ ] Monitor suspicious login attempts
- [ ] Track API rate limit violations
- [ ] Review security event alerts

## Environment Variables

Required environment variables for security features:

```env
# Encryption
ENCRYPTION_KEY=<your-256-bit-key-in-hex>
ENCRYPTION_SALT=<your-salt>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

## Security Best Practices

### 1. Authentication
- ✓ Use Supabase auth with strong password requirements
- ✓ Enable MFA/2FA for sensitive operations
- ✓ Implement session timeout (15 minutes recommended)
- ✓ Store sessions securely (HttpOnly, Secure, SameSite cookies)

### 2. Authorization
- ✓ Always check permissions server-side
- ✓ Never trust client-side permission checks
- ✓ Use RLS policies on database queries
- ✓ Log permission denials for security monitoring

### 3. Data Protection
- ✓ Encrypt sensitive data at rest
- ✓ Use HTTPS/TLS for all data in transit
- ✓ Implement field-level encryption for PII
- ✓ Securely delete data (not just marked as deleted)

### 4. Input Validation
- ✓ Validate on both client and server
- ✓ Sanitize user input to prevent XSS
- ✓ Use parameterized queries (Supabase handles this)
- ✓ Limit file upload sizes

### 5. API Security
- ✓ Use API keys for service-to-service auth
- ✓ Implement rate limiting
- ✓ Monitor unusual access patterns
- ✓ Use API versioning

### 6. Deployment Security
- ✓ Keep dependencies updated
- ✓ Use environment variables for secrets
- ✓ Enable Vercel DDoS protection
- ✓ Set up security monitoring/alerts
- ✓ Regular security audits

## Threat Model

### Protected Against
1. **Brute Force Attacks**: Rate limiting on auth endpoints
2. **SQL Injection**: Parameterized queries via Supabase
3. **XSS Attacks**: Input validation and CSP headers
4. **Unauthorized Access**: RLS + RBAC permissions
5. **Data Theft**: Encryption + audit logging
6. **Session Hijacking**: HttpOnly secure cookies
7. **CSRF**: SameSite cookie attributes
8. **DDoS**: Vercel infrastructure + rate limiting

### Known Limitations
- In-memory rate limiting doesn't persist across server restarts (use Redis for production)
- Encryption key rotation requires manual migration
- Some advanced threat protections (IDS/IPS) deferred to infrastructure level

## Monitoring & Alerting

### Key Metrics to Monitor
```typescript
// Suspicious login attempts
SELECT * FROM login_attempts 
WHERE success = false 
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY email HAVING COUNT(*) >= 5;

// Failed permission checks
SELECT * FROM security_events
WHERE severity = 'critical'
AND resolved = false;

// High rate limit violations
SELECT ip_address, COUNT(*) as violations
FROM audit_logs
WHERE status = 'rate_limited'
GROUP BY ip_address
ORDER BY violations DESC;
```

### Alert Conditions
- Multiple failed login attempts from same IP (≥5 in 15 min)
- Permission denials for suspicious patterns
- Unusual data exports or deletions
- API key compromise indicators
- GDPR deletion request spikes

## Testing Security

### Unit Tests
```typescript
// Test RBAC
expect(hasPermission('user', 'delete', 'chat')).toBe(false);
expect(hasPermission('admin', 'delete', 'chat')).toBe(true);

// Test encryption
const encrypted = encryptData('test');
expect(decryptData(encrypted)).toBe('test');

// Test rate limiting
checkRateLimit('key1', preset);
checkRateLimit('key1', preset);
expect(checkRateLimit('key1', preset)).toBe(true); // 3rd is blocked
```

### Integration Tests
- Test API routes with different user roles
- Verify audit logs are created correctly
- Test GDPR export/deletion workflows
- Verify encryption key rotation

## Incident Response

### If Security Breach is Suspected
1. **Immediate**: Disable affected user accounts
2. **Assessment**: Review audit logs for affected data
3. **Notification**: Contact affected users (GDPR requirement)
4. **Remediation**: Rotate encryption keys, reset sessions
5. **Analysis**: Review incident with security team

## References

- OWASP Top 10: https://owasp.org/Top10/
- GDPR Compliance: https://gdpr.eu/
- Supabase Security: https://supabase.com/docs/guides/security
- Next.js Security: https://nextjs.org/docs/guides/security

## Support & Updates

For security questions or to report vulnerabilities:
- Email: security@canvasflow.local
- Do not create public issues for security vulnerabilities
- Responsible disclosure appreciated
