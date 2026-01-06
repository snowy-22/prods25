-- ===================================================================
-- REFERRAL SYSTEM - Complete Database Schema
-- Double-hash mechanism, QR codes, rewards, multi-device sync
-- ===================================================================

-- 1. REFERRAL CODES TABLE
-- Stores timestamped and hashed referral codes for each user
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(255) NOT NULL UNIQUE, -- First hash (timestamp + user_id)
  double_hash VARCHAR(255), -- Second hash when code is used
  qr_data TEXT, -- QR code data URL
  usage_count INT DEFAULT 0,
  max_uses INT DEFAULT NULL, -- NULL = unlimited
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT NULL, -- Optional expiration
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_usage CHECK (usage_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON public.referral_codes(is_active) WHERE is_active = true;

-- 2. USER REFERRALS TABLE
-- Tracks who referred whom and relationship status
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Who sent the invite
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Who accepted
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  code_used VARCHAR(255) NOT NULL,
  double_hash VARCHAR(255) NOT NULL, -- Double hash applied at usage
  
  -- Auto-friend & follow options
  auto_friend BOOLEAN DEFAULT true,
  auto_follow BOOLEAN DEFAULT true,
  is_friend BOOLEAN DEFAULT false,
  is_following BOOLEAN DEFAULT false,
  is_followed_back BOOLEAN DEFAULT false,
  
  -- Verification & rewards
  referee_verified BOOLEAN DEFAULT false, -- Email verified
  referee_first_login BOOLEAN DEFAULT false, -- First login completed
  rewards_claimed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT unique_referral UNIQUE(referrer_id, referee_id),
  CONSTRAINT no_self_referral CHECK (referrer_id != referee_id)
);

CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referee ON public.user_referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON public.user_referrals(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_verified ON public.user_referrals(referee_verified) WHERE referee_verified = true;

-- 3. REFERRAL REWARDS TABLE
-- Track rewards given for referrals
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.user_referrals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL, -- 'signup', 'first_login', 'email_verified', 'custom'
  reward_category VARCHAR(50) NOT NULL, -- 'achievement', 'points', 'badge', 'item'
  reward_value JSONB NOT NULL, -- { "achievementId": "...", "points": 100, etc }
  
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON public.referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral ON public.referral_rewards(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_unclaimed ON public.referral_rewards(is_claimed) WHERE is_claimed = false;

-- 4. REFERRAL SETTINGS TABLE
-- User preferences for referral sharing
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sharing preferences
  allow_qr_sharing BOOLEAN DEFAULT true,
  allow_url_sharing BOOLEAN DEFAULT true,
  auto_friend_referrals BOOLEAN DEFAULT true,
  auto_follow_referrals BOOLEAN DEFAULT true,
  
  -- Privacy
  show_referral_count BOOLEAN DEFAULT true,
  show_referee_list BOOLEAN DEFAULT false,
  
  -- Notifications
  notify_on_referral BOOLEAN DEFAULT true,
  notify_on_reward BOOLEAN DEFAULT true,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_referral_settings_user ON public.referral_settings(user_id);

-- 5. DEVICE SESSIONS TABLE
-- Multi-device and real-time sync support
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address INET,
  
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Real-time sync
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT unique_device_session UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON public.device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_active ON public.device_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_device_sessions_last_active ON public.device_sessions(last_active_at DESC);

-- 6. SYNC EVENTS TABLE
-- Track cross-device synchronization events
CREATE TABLE IF NOT EXISTS public.sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_session_id UUID REFERENCES public.device_sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'tab_opened', 'content_updated', 'settings_changed'
  event_data JSONB NOT NULL,
  synced_to_devices UUID[], -- Array of device_session_ids that received sync
  
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sync_events_user ON public.sync_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_device ON public.sync_events(device_session_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_created ON public.sync_events(created_at DESC);

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;

-- Referral Codes Policies (wrapped in DO blocks for idempotency)
DO $$
BEGIN
  CREATE POLICY "Users can view their own referral codes"
    ON public.referral_codes FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Users can create their own referral codes"
    ON public.referral_codes FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Users can update their own referral codes"
    ON public.referral_codes FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

-- User Referrals Policies
DO $$
BEGIN
  CREATE POLICY "Users can view referrals they're involved in"
    ON public.user_referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "System can create referrals"
    ON public.user_referrals FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Users can update their own referral status"
    ON public.user_referrals FOR UPDATE
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

-- Referral Rewards Policies
DO $$
BEGIN
  CREATE POLICY "Users can view their own rewards"
    ON public.referral_rewards FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "System can create rewards"
    ON public.referral_rewards FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Users can claim their own rewards"
    ON public.referral_rewards FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

-- Referral Settings Policies
DO $$
BEGIN
  CREATE POLICY "Users can view their own settings"
    ON public.referral_settings FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Users can manage their own settings"
    ON public.referral_settings FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

-- Device Sessions Policies
DO $$
BEGIN
  CREATE POLICY "Users can view their own devices"
    ON public.device_sessions FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Users can manage their own devices"
    ON public.device_sessions FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

-- Sync Events Policies
DO $$
BEGIN
  CREATE POLICY "Users can view their own sync events"
    ON public.sync_events FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Users can create sync events"
    ON public.sync_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

-- ===================================================================
-- FUNCTIONS & TRIGGERS
-- ===================================================================

-- Auto-create referral settings on user signup
CREATE OR REPLACE FUNCTION public.create_default_referral_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.referral_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_user_created_referral_settings ON auth.users;
EXCEPTION WHEN UNDEFINED_OBJECT THEN NULL;
END;
$$;

CREATE TRIGGER on_user_created_referral_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_referral_settings();

-- Auto-generate default referral code on user signup
CREATE OR REPLACE FUNCTION public.generate_default_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  v_code VARCHAR(255);
BEGIN
  -- Generate a unique code (will be properly hashed by application)
  v_code := encode(gen_random_bytes(8), 'base64');
  v_code := regexp_replace(v_code, '[^a-zA-Z0-9]', '', 'g');
  v_code := upper(substring(v_code, 1, 12));
  
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, v_code)
  ON CONFLICT (code) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_user_created_referral_code ON auth.users;
EXCEPTION WHEN UNDEFINED_OBJECT THEN NULL;
END;
$$;

CREATE TRIGGER on_user_created_referral_code
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_default_referral_code();

-- Update device session last_active on sync event
CREATE OR REPLACE FUNCTION public.update_device_last_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.device_session_id IS NOT NULL THEN
    UPDATE public.device_sessions
    SET last_active_at = now(),
        last_sync_at = now()
    WHERE id = NEW.device_session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_sync_event_update_device ON public.sync_events;
EXCEPTION WHEN UNDEFINED_OBJECT THEN NULL;
END;
$$;

CREATE TRIGGER on_sync_event_update_device
  AFTER INSERT ON public.sync_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_device_last_active();

-- ===================================================================
-- REAL-TIME PUBLICATIONS
-- ===================================================================

-- Enable real-time for referral updates
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_referrals;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_rewards;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.device_sessions;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_events;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END;
$$;

-- ===================================================================
-- COMMENTS
-- ===================================================================

COMMENT ON TABLE public.referral_codes IS 'User-generated referral codes with double-hash mechanism';
COMMENT ON TABLE public.user_referrals IS 'Tracks referral relationships and auto-friend/follow settings';
COMMENT ON TABLE public.referral_rewards IS 'Rewards distributed for successful referrals';
COMMENT ON TABLE public.referral_settings IS 'User preferences for referral system';
COMMENT ON TABLE public.device_sessions IS 'Multi-device session tracking for real-time sync';
COMMENT ON TABLE public.sync_events IS 'Cross-device synchronization event log';
