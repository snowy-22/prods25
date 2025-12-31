-- Security and Compliance Database Tables
-- These tables support the security features implemented in the application

-- Profiles Table
-- Extends auth.users with role and profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'user', 'moderator', 'admin', 'super_admin'
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Audit Logs Table
-- Tracks all important user actions for security and compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- User Consents Table
-- Tracks user consent preferences for GDPR compliance
CREATE TABLE IF NOT EXISTS user_consents (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at BIGINT,
  revoked_at BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, consent_type)
);

CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);

-- User Deletion Requests Table
-- Tracks GDPR right to be forgotten requests with grace period
CREATE TABLE IF NOT EXISTS user_deletion_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  scheduled_deletion_date TIMESTAMP NOT NULL,
  requested_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deletion_requests_user_id ON user_deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_status ON user_deletion_requests(status);

-- API Keys Table
-- Stores encrypted API keys for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  encrypted_key TEXT NOT NULL,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_whitelist TEXT[], -- JSON array of allowed IPs
  scopes TEXT[] DEFAULT ARRAY['read']
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- Security Events Table
-- Logs suspicious activities and security-related events
CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);

-- Session Management Table
-- Tracks active sessions for security
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Login Attempts Table
-- Tracks login attempts for failed login detection
CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  reason VARCHAR(255), -- failure reason if unsuccessful
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at DESC);

-- Data Encryption Keys Table
-- Manages encryption keys for encrypted fields
CREATE TABLE IF NOT EXISTS encryption_keys (
  id BIGSERIAL PRIMARY KEY,
  key_id VARCHAR(255) UNIQUE NOT NULL,
  encrypted_key TEXT NOT NULL,
  algorithm VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rotated_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_encryption_keys_key_id ON encryption_keys(key_id);

-- Row-Level Security (RLS) Policies

-- Enable RLS on all security tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Audit Logs Policies
-- Users can view their own audit logs, admins can view all
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- API Keys Policies
-- Users can only view and manage their own API keys
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Security Events Policies
-- Only admins can view security events
CREATE POLICY "Admins can view security events"
  ON security_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- User Sessions Policies
-- Users can view their own sessions, admins can view all
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Functions for Security Management

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION check_user_permission(
  user_id UUID,
  action TEXT,
  resource TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Super admin always has permission
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Admin can do most things except super admin actions
  IF user_role = 'admin' AND action != 'manage_super_admin' THEN
    RETURN true;
  END IF;
  
  -- Moderator can delete content and view analytics
  IF user_role = 'moderator' AND action IN ('delete_content', 'view_analytics') THEN
    RETURN true;
  END IF;
  
  -- Regular users can create/read/update/delete their own resources
  IF action IN ('create', 'read', 'update', 'delete') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = false 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to detect suspicious login attempts
CREATE OR REPLACE FUNCTION detect_suspicious_logins()
RETURNS TABLE(email VARCHAR, ip_address INET, failure_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.email,
    la.ip_address,
    COUNT(*) as failure_count
  FROM login_attempts la
  WHERE la.success = false
    AND la.created_at > NOW() - INTERVAL '15 minutes'
  GROUP BY la.email, la.ip_address
  HAVING COUNT(*) >= 5;
END;
$$ LANGUAGE plpgsql;

-- Triggers and Automatic Maintenance

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deletion_requests_updated_at
  BEFORE UPDATE ON user_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON user_consents TO authenticated;
GRANT INSERT, UPDATE ON user_consents TO authenticated;
GRANT SELECT ON api_keys TO authenticated;
GRANT INSERT, UPDATE, DELETE ON api_keys TO authenticated;

-- Grant admin-only access
GRANT SELECT ON security_events TO authenticated;
GRANT SELECT ON login_attempts TO authenticated;
GRANT SELECT ON user_sessions TO authenticated;
