# 🚨 CRITICAL SECURITY INCIDENT - Supabase Service Role Key Leak

## Incident Details
- **Date**: January 20, 2026
- **Severity**: CRITICAL ⚠️
- **Secret Type**: Supabase Service Role JWT
- **Repository**: snowy-22/prods25
- **Detection**: GitGuardian / GitHub Secret Scanning
- **Status**: ✅ Removed from codebase

## Exposed Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1a3plcHRlb21lbmlrZWVsem5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEyNTU3NCwiZXhwIjoyMDgyNzAxNTc0fQ.m6MmqRhGaJHRUOdO_NzOVdXx50KSkm4SgT2mppOhNpI
```

## Immediate Actions Required ⚡

### 1. Rotate Service Role Key (URGENT - Do this NOW!)
1. Go to: https://app.supabase.com/project/qukzepteomenikeelzno/settings/api
2. Scroll to **Service Role** section
3. Click **"Reset service_role secret"**
4. Copy the new key
5. Update `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=<new-key-here>
   ```

### 2. Check Security Logs
1. Go to: https://app.supabase.com/project/qukzepteomenikeelzno/logs/auth-logs
2. Filter for suspicious activity:
   - Unusual API calls
   - Unauthorized data access
   - Unexpected admin operations
3. Document any anomalies

### 3. Review Database Access
```sql
-- Check recent connections
SELECT * FROM pg_stat_activity 
WHERE usename = 'supabase_admin'
ORDER BY backend_start DESC
LIMIT 50;

-- Check for unauthorized schema changes
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 4. Update GitHub Secret Alert
1. Go to: https://github.com/snowy-22/prods25/security/secret-scanning
2. Mark the alert as **"Revoked"**
3. Confirm key has been rotated

## What Was Compromised?
The exposed Service Role Key grants **FULL ADMIN ACCESS** to:
- ✅ All database tables (bypass RLS policies)
- ✅ User authentication data
- ✅ Storage buckets
- ✅ Edge Functions
- ✅ Realtime subscriptions

## Timeline
- **09:43 UTC** - Service key exposed in commit `b0db973`
- **~11:00 UTC** - GitGuardian detected leak
- **~11:30 UTC** - Security fix committed (`af70059`)
- **Pending** - Key rotation in Supabase dashboard

## Files Affected (Fixed)
- ✅ `upload-migrations.mjs` - Now uses env vars
- ✅ `upload-migrations-guide.mjs` - Credentials removed
- ✅ Git history - Credentials removed from latest commit

## Prevention Measures Implemented
1. ✅ Environment variable validation in scripts
2. ✅ Added `.env.local` requirement documentation
3. ✅ Scripts fail if env vars missing
4. 🔄 Need to add pre-commit hooks to scan for secrets

## Recommended Next Steps

### Short-term (Do Today)
- [ ] Rotate service role key in Supabase dashboard
- [ ] Check security logs for unauthorized access
- [ ] Update all local `.env.local` files with new key
- [ ] Verify no other secrets in repository

### Medium-term (This Week)
- [ ] Set up pre-commit hooks with `git-secrets` or `truffleHog`
- [ ] Enable GitHub secret scanning alerts
- [ ] Review all environment variables in codebase
- [ ] Audit RLS policies to minimize service role usage

### Long-term (This Month)
- [ ] Implement secret management (e.g., Vault, AWS Secrets Manager)
- [ ] Create security checklist for new developers
- [ ] Set up automated security scanning in CI/CD
- [ ] Regular security audits

## References
- [Supabase Service Role Security](https://supabase.com/docs/guides/database/postgres/roles)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Git History Rewriting](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## Contact
If you notice ANY suspicious activity:
1. Immediately rotate all API keys
2. Contact Supabase support: https://supabase.com/support
3. Review GitHub audit log: https://github.com/snowy-22/prods25/settings/audit-log

---
**Status**: 🔴 OPEN - Waiting for key rotation
**Last Updated**: January 20, 2026
