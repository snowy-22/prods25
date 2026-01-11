


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."add_search_history"("p_user_id" "uuid", "p_search_type" "text", "p_query" "text", "p_results_count" integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_history_id UUID;
BEGIN
  INSERT INTO search_history (user_id, search_type, query, results_count)
  VALUES (p_user_id, p_search_type, p_query, p_results_count)
  RETURNING id INTO v_history_id;

  RETURN v_history_id;
END;
$$;


ALTER FUNCTION "public"."add_search_history"("p_user_id" "uuid", "p_search_type" "text", "p_query" "text", "p_results_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_default_user_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (NEW.id, 'user', TRUE)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."assign_default_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_expire_roles"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Expire global roles
  UPDATE public.user_roles
  SET is_active = FALSE
  WHERE expires_at < NOW() AND is_active = TRUE;
  
  -- Expire organization roles
  UPDATE public.organization_roles
  SET is_active = FALSE
  WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$;


ALTER FUNCTION "public"."auto_expire_roles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_order_total"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.subtotal IS NOT NULL THEN
    NEW.total = NEW.subtotal + NEW.tax + NEW.shipping - COALESCE(NEW.discount, 0);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_order_total"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_org"("check_user_id" "uuid", "check_org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_roles
    WHERE user_id = check_user_id
    AND organization_id = check_org_id
    AND role IN ('owner', 'admin')
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;


ALTER FUNCTION "public"."can_manage_org"("check_user_id" "uuid", "check_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_permission"("user_id" "uuid", "action" "text", "resource" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."check_user_permission"("user_id" "uuid", "action" "text", "resource" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_sessions"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = false 
  WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_sessions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_trash"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Move to recovery log before deletion
  INSERT INTO recovery_logs (id, trash_item_id, user_id, action, timestamp)
  SELECT gen_random_uuid()::text, id, user_id, 'expired', NOW()
  FROM trash_items
  WHERE expires_at <= NOW() AND permanent_delete_at IS NULL;
  
  -- Delete expired trash items
  DELETE FROM trash_items
  WHERE expires_at <= NOW() AND permanent_delete_at IS NULL;
  
  -- Clean up old recovery logs (keep 1 year)
  DELETE FROM recovery_logs
  WHERE timestamp < NOW() - INTERVAL '1 year';
  
  -- Clean up old broadcast sessions (keep 3 months)
  DELETE FROM broadcast_sessions
  WHERE ended_at IS NOT NULL AND ended_at < NOW() - INTERVAL '3 months';
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_trash"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_typing_indicators"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM public.typing_indicators WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_typing_indicators"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_interactions"("p_retention_days" integer DEFAULT 90) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM interaction_history
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_interactions"("p_retention_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_snapshots"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM widget_snapshots
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY widget_data_id ORDER BY created_at DESC) AS rn
      FROM widget_snapshots
    ) ranked
    WHERE ranked.rn > 20
  );
END;
$$;


ALTER FUNCTION "public"."cleanup_old_snapshots"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_auto_snapshot"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_old_checksum TEXT;
  v_new_checksum TEXT;
BEGIN
  -- Checksum'ları karşılaştır
  v_old_checksum := OLD.checksum;
  v_new_checksum := NEW.checksum;
  
  -- Eğer veri önemli ölçüde değiştiyse snapshot oluştur
  IF v_old_checksum IS NULL OR v_old_checksum != v_new_checksum THEN
    INSERT INTO widget_snapshots (
      widget_data_id,
      user_id,
      snapshot_data,
      snapshot_reason
    ) VALUES (
      NEW.id,
      NEW.user_id,
      OLD.data,
      'before-change'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_auto_snapshot"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_auto_snapshot"() IS 'Create automatic snapshots before significant data changes';



CREATE OR REPLACE FUNCTION "public"."create_default_referral_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.referral_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_referral_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.subscriptions (
    id, user_id, tier, status, price_per_month, storage_limit, api_limit
  ) VALUES (
    gen_random_uuid()::text,
    NEW.id,
    'free',
    'active',
    0,
    10737418240, -- 10 GB in bytes
    100000 -- 100k requests
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_direct_conversation"("other_user_id" "uuid", "org_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  conversation_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if conversation already exists
  SELECT c.id INTO conversation_id
  FROM public.conversations c
  INNER JOIN public.conversation_participants cp1 
    ON cp1.conversation_id = c.id AND cp1.user_id = current_user_id
  INNER JOIN public.conversation_participants cp2 
    ON cp2.conversation_id = c.id AND cp2.user_id = other_user_id
  WHERE c.type = 'direct'
    AND (c.organization_id = org_id OR (c.organization_id IS NULL AND org_id IS NULL))
  LIMIT 1;
  
  -- If not exists, create new
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (type, organization_id)
    VALUES ('direct', org_id)
    RETURNING id INTO conversation_id;
    
    -- Add participants
    INSERT INTO public.conversation_participants (conversation_id, user_id, role)
    VALUES 
      (conversation_id, current_user_id, 'owner'),
      (conversation_id, other_user_id, 'member');
  END IF;
  
  RETURN conversation_id;
END;
$$;


ALTER FUNCTION "public"."create_direct_conversation"("other_user_id" "uuid", "org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_direct_conversation"("other_user_id" "uuid", "org_id" "uuid") IS 'Create or get existing direct conversation between two users';



CREATE OR REPLACE FUNCTION "public"."create_group_conversation"("group_name" "text", "participant_ids" "uuid"[], "org_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  conversation_id UUID;
  current_user_id UUID;
  participant_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Create conversation
  INSERT INTO public.conversations (type, name, organization_id)
  VALUES ('group', group_name, org_id)
  RETURNING id INTO conversation_id;
  
  -- Add creator as owner
  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES (conversation_id, current_user_id, 'owner');
  
  -- Add other participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    IF participant_id != current_user_id THEN
      INSERT INTO public.conversation_participants (conversation_id, user_id, role)
      VALUES (conversation_id, participant_id, 'member')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN conversation_id;
END;
$$;


ALTER FUNCTION "public"."create_group_conversation"("group_name" "text", "participant_ids" "uuid"[], "org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_group_conversation"("group_name" "text", "participant_ids" "uuid"[], "org_id" "uuid") IS 'Create a new group conversation with multiple participants';



CREATE OR REPLACE FUNCTION "public"."create_new_ai_session"("p_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_new_conversation_id UUID;
BEGIN
  UPDATE ai_conversations
  SET is_active = FALSE
  WHERE user_id = p_user_id AND is_active = TRUE;

  INSERT INTO ai_conversations (user_id, title, is_active)
  VALUES (p_user_id, 'AI Asistan', TRUE)
  RETURNING id INTO v_new_conversation_id;

  RETURN v_new_conversation_id;
END;
$$;


ALTER FUNCTION "public"."create_new_ai_session"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detect_suspicious_logins"() RETURNS TABLE("email" character varying, "ip_address" "inet", "failure_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."detect_suspicious_logins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."duplicate_widget_data"("p_source_widget_id" "text", "p_user_id" "uuid", "p_new_widget_id" "text" DEFAULT NULL::"text") RETURNS TABLE("new_widget_id" "text", "snapshot_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_new_widget_id TEXT;
  v_snapshot_count INTEGER;
  v_data widget_data%ROWTYPE;
  v_snapshots widget_snapshots%ROWTYPE;
BEGIN
  -- Source widget'ı bul
  SELECT * INTO v_data
  FROM widget_data
  WHERE widget_id = p_source_widget_id AND user_id = p_user_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Widget not found';
  END IF;
  
  v_new_widget_id := COALESCE(p_new_widget_id, p_source_widget_id || '-copy-' || NOW()::TEXT);
  v_snapshot_count := 0;
  
  -- Yeni widget veri kaydı oluştur
  INSERT INTO widget_data (
    widget_id,
    user_id,
    widget_type,
    data,
    metadata,
    checksum
  ) VALUES (
    v_new_widget_id,
    p_user_id,
    v_data.widget_type,
    v_data.data,
    jsonb_set(v_data.metadata, '{version}', '1'),
    v_data.checksum
  );
  
  -- Tüm snapshot'ları kopyala
  FOR v_snapshots IN
    SELECT * FROM widget_snapshots
    WHERE widget_data_id = v_data.id
  LOOP
    INSERT INTO widget_snapshots (
      widget_data_id,
      user_id,
      snapshot_data,
      snapshot_reason,
      tags
    ) VALUES (
      (SELECT id FROM widget_data WHERE widget_id = v_new_widget_id AND user_id = p_user_id),
      p_user_id,
      v_snapshots.snapshot_data,
      v_snapshots.snapshot_reason,
      v_snapshots.tags
    );
    v_snapshot_count := v_snapshot_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT v_new_widget_id, v_snapshot_count;
END;
$$;


ALTER FUNCTION "public"."duplicate_widget_data"("p_source_widget_id" "text", "p_user_id" "uuid", "p_new_widget_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."duplicate_widget_data"("p_source_widget_id" "text", "p_user_id" "uuid", "p_new_widget_id" "text") IS 'Clone a widget with all its snapshots';



CREATE OR REPLACE FUNCTION "public"."generate_default_referral_code"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_default_referral_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_ai_conversation"("p_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  SELECT id INTO v_conversation_id
  FROM ai_conversations
  WHERE user_id = p_user_id AND is_active = TRUE
  ORDER BY last_message_at DESC
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO ai_conversations (user_id, title)
    VALUES (p_user_id, 'AI Asistan')
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_ai_conversation"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_conversation"("target_user_id" "uuid", "org_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN create_direct_conversation(target_user_id, org_id);
END;
$$;


ALTER FUNCTION "public"."get_or_create_conversation"("target_user_id" "uuid", "org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_or_create_conversation"("target_user_id" "uuid", "org_id" "uuid") IS 'Helper to get or create conversation with target user';



CREATE OR REPLACE FUNCTION "public"."get_popular_presentations"("p_user_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "text", "title" "text", "views" numeric, "completion_rate" numeric, "published_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    COALESCE((p.statistics->>'views')::NUMERIC, 0),
    COALESCE((p.statistics->>'completionRate')::NUMERIC, 0),
    p.published_at
  FROM presentations p
  WHERE p.user_id = p_user_id AND p.is_published = true
  ORDER BY (p.statistics->>'views')::NUMERIC DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_popular_presentations"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_popular_searches"("p_user_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("query" "text", "search_count" bigint, "last_searched" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.query,
    COUNT(*)::BIGINT as search_count,
    MAX(sh.created_at) as last_searched
  FROM search_history sh
  WHERE sh.user_id = p_user_id
  GROUP BY sh.query
  ORDER BY search_count DESC, last_searched DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_popular_searches"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_presentation_full"("p_presentation_id" "text") RETURNS TABLE("id" "text", "user_id" "uuid", "title" "text", "description" "text", "scenes" "jsonb", "settings" "jsonb", "statistics" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.description,
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'duration', s.duration,
        'order', s."order"
      ) ORDER BY s."order"
    ),
    p.settings,
    p.statistics
  FROM presentations p
  LEFT JOIN scenes s ON p.id = s.presentation_id AND s.user_id = p.user_id
  WHERE p.id = p_presentation_id
  GROUP BY p.id, p.user_id, p.title, p.description, p.settings, p.statistics;
END;
$$;


ALTER FUNCTION "public"."get_presentation_full"("p_presentation_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recent_items"("p_user_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "text", "type" "text", "title" "text", "thumbnail" "text", "accessed_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.type,
    ci.title,
    ci.thumbnail,
    ci.accessed_at
  FROM canvas_items ci
  WHERE ci.user_id = p_user_id
    AND ci.is_archived = false
  ORDER BY ci.accessed_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_recent_items"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recent_scenes"("p_user_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "text", "title" "text", "presentation_id" "text", "updated_at" timestamp with time zone, "duration" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.presentation_id,
    s.updated_at,
    s.duration
  FROM scenes s
  WHERE s.user_id = p_user_id
  ORDER BY s.updated_at DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_recent_scenes"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_trash_stats"("p_user_id" "uuid") RETURNS TABLE("total_items" bigint, "total_size_kb" numeric, "oldest_item_days" numeric, "newest_item_days" numeric, "items_expiring_soon" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*),
    COALESCE(SUM(octet_length(content::text)) / 1024, 0),
    COALESCE(EXTRACT(DAY FROM NOW() - MIN(deleted_at)), 0),
    COALESCE(EXTRACT(DAY FROM NOW() - MAX(deleted_at)), 0),
    COUNT(*) FILTER (WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days')
  FROM trash_items
  WHERE user_id = p_user_id AND permanent_delete_at IS NULL;
END;
$$;


ALTER FUNCTION "public"."get_trash_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_org_role"("check_user_id" "uuid", "check_org_id" "uuid", "required_role" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_roles
    WHERE user_id = check_user_id
    AND organization_id = check_org_id
    AND role = required_role
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;


ALTER FUNCTION "public"."has_org_role"("check_user_id" "uuid", "check_org_id" "uuid", "required_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_quick_search_usage"("p_search_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE quick_searches
  SET usage_count = usage_count + 1, updated_at = NOW()
  WHERE id = p_search_id;
END;
$$;


ALTER FUNCTION "public"."increment_quick_search_usage"("p_search_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_shared_folder_access"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.shared_folders 
  SET access_count = access_count + 1, updated_at = NOW()
  WHERE slug = NEW.resource_slug;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_shared_folder_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_widget_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.metadata = jsonb_set(
    NEW.metadata,
    '{version}',
    to_jsonb((COALESCE(OLD.metadata->>'version', '1')::INTEGER + 1))
  );
  NEW.metadata = jsonb_set(
    NEW.metadata,
    '{lastModifiedAt}',
    to_jsonb(NOW()::TEXT)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_widget_version"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."increment_widget_version"() IS 'Automatically increment version number on widget data changes';



CREATE OR REPLACE FUNCTION "public"."is_global_admin"("check_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
    AND role IN ('admin', 'super_admin')
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;


ALTER FUNCTION "public"."is_global_admin"("check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_sync_event"("p_widget_id" "text", "p_user_id" "uuid", "p_event_type" "text", "p_details" "jsonb" DEFAULT NULL::"jsonb", "p_error_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO widget_sync_logs (
    widget_id,
    user_id,
    event_type,
    details,
    error_message
  ) VALUES (
    p_widget_id,
    p_user_id,
    p_event_type,
    p_details,
    p_error_message
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."log_sync_event"("p_widget_id" "text", "p_user_id" "uuid", "p_event_type" "text", "p_details" "jsonb", "p_error_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_sync_event"("p_widget_id" "text", "p_user_id" "uuid", "p_event_type" "text", "p_details" "jsonb", "p_error_message" "text") IS 'Log widget synchronization events for audit trail';



CREATE OR REPLACE FUNCTION "public"."refresh_user_activity_stats"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_stats;
END;
$$;


ALTER FUNCTION "public"."refresh_user_activity_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ai_conversation_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE ai_conversations
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ai_conversation_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_device_last_active"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.device_session_id IS NOT NULL THEN
    UPDATE public.device_sessions
    SET last_active_at = now(),
        last_sync_at = now()
    WHERE id = NEW.device_session_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_device_last_active"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_favorite_interaction"("p_favorite_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE ai_favorites
  SET last_interaction = NOW(), updated_at = NOW()
  WHERE id = p_favorite_id;
END;
$$;


ALTER FUNCTION "public"."update_favorite_interaction"("p_favorite_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_follow_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_follow_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_orders_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_orders_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_organization_follow_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE organizations SET follower_count = follower_count + 1 WHERE id = NEW.organization_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE organizations SET follower_count = follower_count - 1 WHERE id = OLD.organization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_organization_follow_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_organization_member_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE organizations SET member_count = member_count + 1 WHERE id = NEW.organization_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE organizations SET member_count = member_count - 1 WHERE id = OLD.organization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_organization_member_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_comment_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_post_comment_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_like_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_post_like_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "tier" "text",
    "points" integer DEFAULT 0,
    "icon" "text",
    "criteria" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "achievements_tier_check" CHECK (("tier" = ANY (ARRAY['bronze'::"text", 'silver'::"text", 'gold'::"text", 'platinum'::"text"])))
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


COMMENT ON TABLE "public"."achievements" IS 'Available achievements and badges';



CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'AI Asistan'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "is_pinned" boolean DEFAULT false
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_conversations" IS 'AI chat conversations with context tracking';



CREATE TABLE IF NOT EXISTS "public"."ai_favorites" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contact_user_id" "uuid",
    "contact_name" "text" NOT NULL,
    "contact_email" "text",
    "contact_avatar" "text",
    "notes" "text",
    "is_frequent" boolean DEFAULT false,
    "last_interaction" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "sequence_number" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "ai_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_messages" IS 'Individual AI chat messages with tool calls';



CREATE TABLE IF NOT EXISTS "public"."analyses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "analysis_type" "text" NOT NULL,
    "result" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."analyses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_content_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "resource_id" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_title" "text",
    "total_views" integer DEFAULT 0,
    "unique_visitors" integer DEFAULT 0,
    "total_shares" integer DEFAULT 0,
    "total_saves" integer DEFAULT 0,
    "avg_duration" integer DEFAULT 0,
    "last_viewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_content_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "session_id" "text",
    "user_agent" "text",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resource_id" "text",
    "resource_slug" "text"
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."analytics_events" IS 'User analytics and behavior tracking';



CREATE TABLE IF NOT EXISTS "public"."analytics_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "uuid",
    "device_info" "jsonb" DEFAULT '{}'::"jsonb",
    "browser" "text",
    "os" "text",
    "screen_width" integer,
    "screen_height" integer,
    "language" "text",
    "timezone" "text",
    "referrer" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "is_guest" boolean DEFAULT true,
    "ip_address" "text",
    "country_code" "text",
    "city" "text",
    "first_seen_at" timestamp with time zone DEFAULT "now"(),
    "last_seen_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "key_hash" character varying(255) NOT NULL,
    "encrypted_key" "text" NOT NULL,
    "last_used_at" timestamp without time zone,
    "expires_at" timestamp without time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "ip_whitelist" "text"[],
    "scopes" "text"[] DEFAULT ARRAY['read'::"text"]
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."api_keys_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."api_keys_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."api_keys_id_seq" OWNED BY "public"."api_keys"."id";



CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" character varying(255) NOT NULL,
    "resource_type" character varying(100) NOT NULL,
    "resource_id" "uuid",
    "details" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "timestamp" bigint NOT NULL,
    "status" character varying(20) DEFAULT 'success'::character varying NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "severity" "text",
    CONSTRAINT "audit_logs_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_logs" IS 'Security audit trail';



CREATE SEQUENCE IF NOT EXISTS "public"."audit_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_logs_id_seq" OWNED BY "public"."audit_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."belonging_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "belonging_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "from_place_id" "uuid",
    "to_place_id" "uuid",
    "from_container_id" "uuid",
    "to_container_id" "uuid",
    "moved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."belonging_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."belongings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "place_id" "uuid",
    "container_belonging_id" "uuid",
    "name" "text" NOT NULL,
    "category" "text",
    "subcategory" "text",
    "status" "text" DEFAULT 'active'::"text",
    "condition_score" integer DEFAULT 100,
    "value_cents" bigint,
    "currency" "text" DEFAULT 'USD'::"text",
    "serial_number" "text",
    "sku" "text",
    "identifiers" "jsonb" DEFAULT '{}'::"jsonb",
    "warranty" "jsonb" DEFAULT '{}'::"jsonb",
    "insurance" "jsonb" DEFAULT '{}'::"jsonb",
    "depreciation" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "purchased_at" timestamp with time zone,
    "last_seen_at" timestamp with time zone,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "belongings_condition_score_check" CHECK ((("condition_score" >= 0) AND ("condition_score" <= 100))),
    CONSTRAINT "belongings_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'stored'::"text", 'loaned'::"text", 'lost'::"text", 'repair'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."belongings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_history" (
    "id" "text" NOT NULL,
    "subscription_id" "text" NOT NULL,
    "amount" bigint NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invoice_url" "text",
    "billing_period_start" timestamp with time zone NOT NULL,
    "billing_period_end" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "paid_at" timestamp with time zone
);


ALTER TABLE "public"."billing_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."broadcast_sessions" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "presentation_id" "text" NOT NULL,
    "stream_settings" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'idle'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "duration" numeric,
    "viewers" integer DEFAULT 0,
    "peak_viewers" integer DEFAULT 0,
    "comments" integer DEFAULT 0,
    "likes" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "recording_url" "text",
    "replay_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "broadcast_sessions_status_check" CHECK (("status" = ANY (ARRAY['idle'::"text", 'starting'::"text", 'live'::"text", 'paused'::"text", 'ended'::"text"])))
);


ALTER TABLE "public"."broadcast_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."call_participants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "call_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "left_at" timestamp with time zone,
    "is_audio_enabled" boolean DEFAULT true,
    "is_video_enabled" boolean DEFAULT true,
    "is_screen_sharing" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."call_participants" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."call_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calls" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "initiator_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'ringing'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "duration" integer,
    "room_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "calls_status_check" CHECK (("status" = ANY (ARRAY['ringing'::"text", 'ongoing'::"text", 'ended'::"text", 'missed'::"text", 'rejected'::"text"]))),
    CONSTRAINT "calls_type_check" CHECK (("type" = ANY (ARRAY['audio'::"text", 'video'::"text"])))
);

ALTER TABLE ONLY "public"."calls" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."calls" OWNER TO "postgres";


COMMENT ON TABLE "public"."calls" IS 'Audio/Video calls with WebRTC integration';



CREATE TABLE IF NOT EXISTS "public"."canvas_items" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "text",
    "type" "text" NOT NULL,
    "title" "text",
    "content" "text",
    "icon" "text",
    "url" "text",
    "thumbnail" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "x" numeric,
    "y" numeric,
    "width" numeric,
    "height" numeric,
    "grid_span_col" integer,
    "grid_span_row" integer,
    "layout_mode" "text",
    "styles" "jsonb" DEFAULT '{}'::"jsonb",
    "frame_style" "text",
    "border_style" "text",
    "animation_preset" "text",
    "order" integer DEFAULT 0,
    "is_expanded" boolean DEFAULT false,
    "is_pinned" boolean DEFAULT false,
    "is_favorite" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "is_deletable" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "accessed_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "device_id" "text"
);


ALTER TABLE "public"."canvas_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."canvas_items" IS 'Stores all canvas items (folders, lists, grids, content) with real-time sync';



CREATE TABLE IF NOT EXISTS "public"."checkout_sessions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" character varying NOT NULL,
    "customer_id" character varying NOT NULL,
    "price_id" character varying NOT NULL,
    "status" character varying NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."checkout_sessions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."checkout_sessions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."checkout_sessions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."checkout_sessions_id_seq" OWNED BY "public"."checkout_sessions"."id";



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "like_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_items" (
    "id" "text" NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text",
    "content" "text",
    "icon" "text",
    "parent_id" "text",
    "assigned_space_id" "text",
    "is_deletable" boolean DEFAULT true,
    "order" integer DEFAULT 0,
    "x" double precision,
    "y" double precision,
    "width" double precision,
    "height" double precision,
    "grid_span_col" integer,
    "grid_span_row" integer,
    "layout_mode" "text",
    "space_type" "text",
    "space_abbreviation" "text",
    "address" "text",
    "hide_address_in_ui" boolean DEFAULT false,
    "hide_space_type_in_ui" boolean DEFAULT false,
    "container_inventory" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "children" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_items_space_type_check" CHECK (("space_type" = ANY (ARRAY['residential'::"text", 'commercial'::"text", 'industrial'::"text", 'office'::"text", 'warehouse'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."content_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_items" IS 'All user content: spaces, devices, widgets, folders, media files';



CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_read_at" timestamp with time zone,
    "is_muted" boolean DEFAULT false,
    "is_pinned" boolean DEFAULT false,
    CONSTRAINT "conversation_participants_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'moderator'::"text", 'member'::"text"])))
);

ALTER TABLE ONLY "public"."conversation_participants" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_message_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "last_message" "text",
    "organization_id" "uuid",
    "is_organization_wide" boolean DEFAULT false,
    CONSTRAINT "conversations_type_check" CHECK (("type" = ANY (ARRAY['direct'::"text", 'group'::"text"])))
);

ALTER TABLE ONLY "public"."conversations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversations" IS 'Messaging conversations (direct & group) with real-time support';



CREATE TABLE IF NOT EXISTS "public"."device_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" character varying(255) NOT NULL,
    "device_name" character varying(255),
    "device_type" character varying(50),
    "browser" character varying(100),
    "os" character varying(100),
    "ip_address" "inet",
    "is_active" boolean DEFAULT true,
    "last_active_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "sync_enabled" boolean DEFAULT true,
    "last_sync_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."device_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_sessions" IS 'Multi-device session tracking for real-time sync';



CREATE TABLE IF NOT EXISTS "public"."devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "space_id" "uuid",
    "name" "text" NOT NULL,
    "device_type" "text" NOT NULL,
    "browser" "text",
    "os" "text",
    "screen_resolution" "text",
    "is_online" boolean DEFAULT false,
    "last_seen" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discount_codes" (
    "id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "discount_type" "text" NOT NULL,
    "discount_value" bigint NOT NULL,
    "min_order_amount" bigint DEFAULT 0,
    "max_uses" integer DEFAULT '-1'::integer,
    "current_uses" integer DEFAULT 0,
    "per_user_limit" integer DEFAULT 1,
    "valid_from" timestamp with time zone DEFAULT "now"(),
    "valid_until" timestamp with time zone,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "discount_codes_uses_check" CHECK ((("current_uses" <= "max_uses") OR ("max_uses" = '-1'::integer))),
    CONSTRAINT "discount_codes_value_check" CHECK (("discount_value" > 0))
);


ALTER TABLE "public"."discount_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."encrypted_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "encrypted_content" "text" NOT NULL,
    "encryption_key_id" "text" NOT NULL,
    "nonce" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."encrypted_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."encrypted_messages" IS 'End-to-end encrypted messages vault';



CREATE TABLE IF NOT EXISTS "public"."encryption_keys" (
    "id" bigint NOT NULL,
    "key_id" character varying(255) NOT NULL,
    "encrypted_key" "text" NOT NULL,
    "algorithm" character varying(50) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "rotated_at" timestamp without time zone,
    "is_active" boolean DEFAULT true,
    "user_id" "uuid"
);

ALTER TABLE ONLY "public"."encryption_keys" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."encryption_keys" OWNER TO "postgres";


COMMENT ON TABLE "public"."encryption_keys" IS 'Manages per-user encryption keys; RLS enforces owner or admin access';



CREATE SEQUENCE IF NOT EXISTS "public"."encryption_keys_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."encryption_keys_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."encryption_keys_id_seq" OWNED BY "public"."encryption_keys"."id";



CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "no_self_follow" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."frame_style_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" "text" NOT NULL,
    "style_type" "text" NOT NULL,
    "previous_value" "jsonb",
    "new_value" "jsonb" NOT NULL,
    "applied_by" "text" DEFAULT 'user'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "frame_style_history_applied_by_check" CHECK (("applied_by" = ANY (ARRAY['user'::"text", 'ai'::"text", 'preset'::"text", 'system'::"text"]))),
    CONSTRAINT "frame_style_history_style_type_check" CHECK (("style_type" = ANY (ARRAY['frame'::"text", 'border'::"text", 'animation'::"text", 'background'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."frame_style_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."frame_style_history" IS 'History of frame and style changes for undo/redo';



CREATE TABLE IF NOT EXISTS "public"."gdpr_data_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "request_type" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "data_url" "text",
    "scheduled_deletion_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "gdpr_data_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['export'::"text", 'deletion'::"text"]))),
    CONSTRAINT "gdpr_data_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."gdpr_data_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."guest_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_token" "text" NOT NULL,
    "guest_username" "text" NOT NULL,
    "canvas_data" "jsonb" DEFAULT '{}'::"jsonb",
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_accessed" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."guest_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hashtags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag" "text" NOT NULL,
    "usage_count" integer DEFAULT 1,
    "trending_score" double precision DEFAULT 0,
    "last_used_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hashtags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hue_bridges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bridge_id" "text" NOT NULL,
    "ip_address" "inet" NOT NULL,
    "port" integer DEFAULT 443 NOT NULL,
    "username" "text" NOT NULL,
    "name" "text" NOT NULL,
    "is_connected" boolean DEFAULT false,
    "last_sync_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hue_bridges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hue_lights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bridge_id" "uuid" NOT NULL,
    "light_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "state" "jsonb" DEFAULT '{"on": false, "brightness": 0}'::"jsonb" NOT NULL,
    "is_available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "hue_lights_type_check" CHECK (("type" = ANY (ARRAY['color'::"text", 'dimmer'::"text", 'switch'::"text", 'unknown'::"text"])))
);


ALTER TABLE "public"."hue_lights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hue_scenes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bridge_id" "uuid" NOT NULL,
    "scene_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "lights_in_scene" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hue_scenes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hue_syncs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bridge_id" "uuid" NOT NULL,
    "item_id" "text" NOT NULL,
    "light_id" "text" NOT NULL,
    "sync_type" "text" NOT NULL,
    "custom_rule" "jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "hue_syncs_sync_type_check" CHECK (("sync_type" = ANY (ARRAY['brightness'::"text", 'color'::"text", 'on-off'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."hue_syncs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interaction_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" "text" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "duration_ms" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "interaction_history_interaction_type_check" CHECK (("interaction_type" = ANY (ARRAY['click'::"text", 'hover'::"text", 'select'::"text", 'drag'::"text", 'drop'::"text", 'resize'::"text", 'delete'::"text", 'edit'::"text"])))
);


ALTER TABLE "public"."interaction_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."interaction_history" IS 'User interaction tracking for analytics';



CREATE TABLE IF NOT EXISTS "public"."inventory_transactions" (
    "id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "from_status" "text",
    "to_status" "text",
    "amount" bigint,
    "counterparty_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" bigint NOT NULL,
    "invoice_id" character varying NOT NULL,
    "subscription_id" character varying NOT NULL,
    "customer_id" character varying NOT NULL,
    "status" character varying NOT NULL,
    "amount" bigint,
    "amount_due" bigint,
    "amount_paid" bigint,
    "pdf_url" character varying,
    "hosted_invoice_url" character varying,
    "paid_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."invoices_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invoices_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."invoices_id_seq" OWNED BY "public"."invoices"."id";



CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "text" NOT NULL,
    "parent_id" "text",
    "owner_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "url" "text",
    "icon" "text",
    "thumbnail_url" "text",
    "author_name" "text",
    "published_at" "text",
    "view_count" "text",
    "like_count" "text",
    "comment_count" "text",
    "order" integer DEFAULT 0,
    "is_pinned" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."layout_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "view_id" "text" NOT NULL,
    "layout_mode" "text" NOT NULL,
    "grid_columns" integer,
    "grid_rows" integer,
    "viewport_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "zoom_level" numeric DEFAULT 1.0,
    "scroll_position" "jsonb" DEFAULT '{"x": 0, "y": 0}'::"jsonb",
    "visible_items" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "layout_states_layout_mode_check" CHECK (("layout_mode" = ANY (ARRAY['grid'::"text", 'canvas'::"text", 'list'::"text", 'carousel'::"text", 'presentation'::"text"])))
);


ALTER TABLE "public"."layout_states" OWNER TO "postgres";


COMMENT ON TABLE "public"."layout_states" IS 'Current layout state for each view (grid, canvas modes)';



CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."login_attempts" (
    "id" bigint NOT NULL,
    "email" character varying(255) NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "success" boolean NOT NULL,
    "reason" character varying(255),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."login_attempts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."login_attempts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."login_attempts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."login_attempts_id_seq" OWNED BY "public"."login_attempts"."id";



CREATE TABLE IF NOT EXISTS "public"."logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "loading_time_ms" integer,
    "folders_open_time_ms" integer,
    "personal_folders_load_time_ms" integer,
    "device_info" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_listings" (
    "id" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "price" bigint NOT NULL,
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "category" "text",
    "condition" "text" DEFAULT 'good'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "views" integer DEFAULT 0,
    "favorites" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "listed_at" timestamp with time zone DEFAULT "now"(),
    "sold_at" timestamp with time zone,
    "search_vector" "tsvector",
    CONSTRAINT "listings_price_check" CHECK (("price" > 0))
);


ALTER TABLE "public"."marketplace_listings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."marketplace_analytics_view" AS
 SELECT "seller_id",
    "count"(*) AS "total_listings",
    "sum"(
        CASE
            WHEN ("status" = 'active'::"text") THEN 1
            ELSE 0
        END) AS "active_listings",
    "sum"(
        CASE
            WHEN ("status" = 'sold'::"text") THEN 1
            ELSE 0
        END) AS "sold_count",
    "sum"("views") AS "total_views",
    "sum"("favorites") AS "total_favorites",
    "avg"("price") AS "avg_price"
   FROM "public"."marketplace_listings"
  GROUP BY "seller_id";


ALTER VIEW "public"."marketplace_analytics_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_reactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."message_reactions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_reactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."message_reactions" IS 'Emoji reactions to messages';



CREATE TABLE IF NOT EXISTS "public"."message_read_receipts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "read_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_read_receipts" OWNER TO "postgres";


COMMENT ON TABLE "public"."message_read_receipts" IS 'Track when messages are read';



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "sender_name" "text" NOT NULL,
    "sender_avatar" "text",
    "content" "text" NOT NULL,
    "type" "text" DEFAULT 'text'::"text" NOT NULL,
    "media_url" "text",
    "media_type" "text",
    "reply_to" "uuid",
    "is_edited" boolean DEFAULT false,
    "edited_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "attachment_url" "text",
    "attachment_name" "text",
    "attachment_size" bigint,
    "attachment_type" "text",
    "preview_url" "text",
    "reply_to_id" "uuid",
    "forwarded_from_id" "uuid",
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "messages_type_check" CHECK (("type" = ANY (ARRAY['text'::"text", 'image'::"text", 'video'::"text", 'file'::"text", 'audio'::"text", 'location'::"text", 'system'::"text"])))
);

ALTER TABLE ONLY "public"."messages" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."messages" IS 'Enhanced messages with attachments, replies, and forwarding support';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "link" "text",
    "is_read" boolean DEFAULT false,
    "actor_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "text" NOT NULL,
    "order_id" "text" NOT NULL,
    "product_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" bigint NOT NULL,
    "total_price" bigint NOT NULL,
    "variant_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "order_items_price_check" CHECK (("unit_price" > 0)),
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending_payment'::"text" NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "subtotal" bigint NOT NULL,
    "tax" bigint NOT NULL,
    "shipping" bigint NOT NULL,
    "discount" bigint DEFAULT 0 NOT NULL,
    "total" bigint NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "shipping_address" "jsonb" NOT NULL,
    "billing_address" "jsonb",
    "payment_method" "text",
    "payment_id" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "shipped_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    CONSTRAINT "orders_total_check" CHECK (("total" > 0))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."order_summary_view" AS
 SELECT "count"(*) AS "total_orders",
    "count"(DISTINCT "user_id") AS "unique_customers",
    "sum"("total") AS "total_revenue",
    "avg"("total") AS "avg_order_value",
    "max"("created_at") AS "last_order_date"
   FROM "public"."orders"
  WHERE ("status" <> 'cancelled'::"text");


ALTER VIEW "public"."order_summary_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."organization_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "can_manage_members" boolean DEFAULT false,
    "can_manage_content" boolean DEFAULT false,
    "can_post" boolean DEFAULT true,
    "can_comment" boolean DEFAULT true,
    "can_invite" boolean DEFAULT false,
    "can_manage_settings" boolean DEFAULT false,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "organization_roles_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'moderator'::"text", 'member'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."organization_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization_roles" IS 'Organization-specific roles and permissions';



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "cover_url" "text",
    "website" "text",
    "follower_count" integer DEFAULT 0,
    "member_count" integer DEFAULT 1,
    "is_verified" boolean DEFAULT false,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_views" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "page_path" "text" NOT NULL,
    "referrer" "text",
    "session_id" "text",
    "duration_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."page_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" bigint NOT NULL,
    "payment_method_id" character varying NOT NULL,
    "customer_id" character varying NOT NULL,
    "type" character varying NOT NULL,
    "brand" character varying,
    "last4" character varying,
    "exp_month" integer,
    "exp_year" integer,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."payment_methods_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."payment_methods_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."payment_methods_id_seq" OWNED BY "public"."payment_methods"."id";



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "text" NOT NULL,
    "permission" "text" NOT NULL,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "permissions_permission_check" CHECK (("permission" = ANY (ARRAY['view'::"text", 'edit'::"text", 'delete'::"text", 'share'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."permissions" IS 'Fine-grained resource-level permissions';



CREATE TABLE IF NOT EXISTS "public"."places" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" DEFAULT 'space'::"text" NOT NULL,
    "parent_id" "uuid",
    "address" "text",
    "coordinates" "jsonb",
    "timezone" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "places_type_check" CHECK (("type" = ANY (ARRAY['space'::"text", 'room'::"text", 'zone'::"text", 'vehicle'::"text", 'bag'::"text", 'shelf'::"text", 'device'::"text", 'cloud'::"text"])))
);


ALTER TABLE "public"."places" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "content" "text" NOT NULL,
    "like_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "media_urls" "text"[] DEFAULT ARRAY[]::"text"[],
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "visibility" "text" DEFAULT 'public'::"text",
    "is_pinned" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presentations" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "thumbnail" "text",
    "scene_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "total_duration" numeric DEFAULT 0,
    "settings" "jsonb" DEFAULT '{"loop": false, "quality": "high", "autoPlay": false, "loopDelay": 0, "autoPlayDelay": 5000, "analyticsEnabled": true, "recordingEnabled": false}'::"jsonb",
    "stream_id" "text",
    "stream_url" "text",
    "stream_key" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "category" "text",
    "is_draft" boolean DEFAULT true,
    "is_published" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "custom_css" "text",
    "statistics" "jsonb" DEFAULT '{"views": 0, "viewHistory": [], "avgWatchTime": 0, "totalDuration": 0, "completionRate": 0}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    "archived_at" timestamp with time zone
);


ALTER TABLE "public"."presentations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scenes" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "presentation_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "background" "jsonb" DEFAULT '{}'::"jsonb",
    "items" "jsonb" DEFAULT '[]'::"jsonb",
    "width" numeric DEFAULT 1920,
    "height" numeric DEFAULT 1080,
    "aspect_ratio" "text" DEFAULT '16:9'::"text",
    "duration" numeric DEFAULT 5000,
    "auto_advance" boolean DEFAULT true,
    "advance_delay" numeric DEFAULT 0,
    "transition" "jsonb" DEFAULT '{}'::"jsonb",
    "animations" "jsonb" DEFAULT '[]'::"jsonb",
    "order" integer NOT NULL,
    "is_visible" boolean DEFAULT true,
    "is_locked" boolean DEFAULT false,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "accessed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."scenes" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."presentation_stats" AS
 SELECT "p"."id",
    "p"."user_id",
    "p"."title",
    "count"("s"."id") AS "scene_count",
    "sum"(COALESCE("s"."duration", (0)::numeric)) AS "total_duration",
    (("p"."statistics" ->> 'views'::"text"))::numeric AS "view_count",
    (("p"."statistics" ->> 'completionRate'::"text"))::numeric AS "avg_completion_rate",
    "p"."is_published",
    "p"."created_at",
    "p"."updated_at"
   FROM ("public"."presentations" "p"
     LEFT JOIN "public"."scenes" "s" ON (("p"."id" = "s"."presentation_id")))
  GROUP BY "p"."id", "p"."user_id", "p"."title", "p"."statistics", "p"."is_published", "p"."created_at", "p"."updated_at"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."presentation_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" "text" NOT NULL,
    "product_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "sku" "text",
    "price" bigint,
    "inventory" integer DEFAULT 0,
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "variants_inventory_check" CHECK (("inventory" >= 0))
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" bigint NOT NULL,
    "cost" bigint,
    "category" "text",
    "inventory" integer DEFAULT 0,
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "search_vector" "tsvector",
    CONSTRAINT "products_inventory_check" CHECK (("inventory" >= 0)),
    CONSTRAINT "products_price_check" CHECK (("price" > 0))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "website" "text",
    "location" "text",
    "is_verified" boolean DEFAULT false,
    "follower_count" integer DEFAULT 0,
    "following_count" integer DEFAULT 0,
    "post_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "reservation_id" "uuid",
    "item_id" "text" NOT NULL,
    "item_name" "text",
    "quantity" integer DEFAULT 1,
    "total_price" numeric(10,2),
    "payment_method" "text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "stripe_payment_intent_id" "text",
    "confirmation_code" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "purchased_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "purchases_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchases" IS 'Completed purchases';



CREATE TABLE IF NOT EXISTS "public"."quick_searches" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "search_type" "text" NOT NULL,
    "query" "text" NOT NULL,
    "icon" "text" DEFAULT 'search'::"text",
    "color" "text" DEFAULT 'blue'::"text",
    "is_pinned" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "quick_searches_search_type_check" CHECK (("search_type" = ANY (ARRAY['user'::"text", 'content'::"text", 'message'::"text", 'ai'::"text"])))
);


ALTER TABLE "public"."quick_searches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating_type" "text" NOT NULL,
    "rating_value" numeric NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recovery_logs" (
    "id" "text" NOT NULL,
    "trash_item_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "reason" "text",
    "restored_to" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "recovery_logs_action_check" CHECK (("action" = ANY (ARRAY['deleted'::"text", 'restored'::"text", 'permanently_deleted'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."recovery_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code" character varying(255) NOT NULL,
    "double_hash" character varying(255),
    "qr_data" "text",
    "usage_count" integer DEFAULT 0,
    "max_uses" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "valid_usage" CHECK (("usage_count" >= 0))
);


ALTER TABLE "public"."referral_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."referral_codes" IS 'User-generated referral codes with double-hash mechanism';



CREATE TABLE IF NOT EXISTS "public"."referral_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referral_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reward_type" character varying(50) NOT NULL,
    "reward_category" character varying(50) NOT NULL,
    "reward_value" "jsonb" NOT NULL,
    "is_claimed" boolean DEFAULT false,
    "claimed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."referral_rewards" OWNER TO "postgres";


COMMENT ON TABLE "public"."referral_rewards" IS 'Rewards distributed for successful referrals';



CREATE TABLE IF NOT EXISTS "public"."referral_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "allow_qr_sharing" boolean DEFAULT true,
    "allow_url_sharing" boolean DEFAULT true,
    "auto_friend_referrals" boolean DEFAULT true,
    "auto_follow_referrals" boolean DEFAULT true,
    "show_referral_count" boolean DEFAULT true,
    "show_referee_list" boolean DEFAULT false,
    "notify_on_referral" boolean DEFAULT true,
    "notify_on_reward" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."referral_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."referral_settings" IS 'User preferences for referral system';



CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "item_id" "text" NOT NULL,
    "item_name" "text",
    "quantity" integer DEFAULT 1,
    "total_price" numeric(10,2),
    "reservation_date" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "confirmation_code" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reservations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."reservations" OWNER TO "postgres";


COMMENT ON TABLE "public"."reservations" IS 'Item reservations for e-commerce';



CREATE TABLE IF NOT EXISTS "public"."search_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "search_type" "text" NOT NULL,
    "query" "text" NOT NULL,
    "results_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "search_history_search_type_check" CHECK (("search_type" = ANY (ARRAY['user'::"text", 'content'::"text", 'message'::"text", 'ai'::"text"])))
);


ALTER TABLE "public"."search_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."search_history" IS 'User search history for autocomplete and analytics';



CREATE TABLE IF NOT EXISTS "public"."security_events" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "event_type" character varying(100) NOT NULL,
    "severity" character varying(20) NOT NULL,
    "description" "text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "metadata" "jsonb",
    "resolved" boolean DEFAULT false,
    "resolved_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."security_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."security_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."security_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."security_events_id_seq" OWNED BY "public"."security_events"."id";



CREATE TABLE IF NOT EXISTS "public"."shared_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "folder_id" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "access_count" integer DEFAULT 0,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shared_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shared_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "shared_with_user_id" "uuid",
    "shared_with_organization_id" "uuid",
    "permission" "text" DEFAULT 'view'::"text",
    "is_public" boolean DEFAULT false,
    "public_url" "text",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "shared_items_check" CHECK (((("shared_with_user_id" IS NOT NULL) AND ("shared_with_organization_id" IS NULL)) OR (("shared_with_user_id" IS NULL) AND ("shared_with_organization_id" IS NOT NULL)) OR ("is_public" = true)))
);


ALTER TABLE "public"."shared_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."spaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "color" "text",
    "is_public" boolean DEFAULT false,
    "device_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."spaces" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid",
    "user_id" "uuid",
    "movement_type" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "previous_quantity" integer,
    "new_quantity" integer,
    "reference_type" "text",
    "reference_id" "uuid",
    "location_from" "text",
    "location_to" "text",
    "reason" "text",
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "stock_movements_movement_type_check" CHECK (("movement_type" = ANY (ARRAY['in'::"text", 'out'::"text", 'adjustment'::"text", 'return'::"text", 'transfer'::"text"])))
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" character varying NOT NULL,
    "email" character varying NOT NULL,
    "name" character varying,
    "phone" character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_customers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."stripe_customers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."stripe_customers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."stripe_customers_id_seq" OWNED BY "public"."stripe_customers"."id";



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "price_per_month" bigint DEFAULT 0 NOT NULL,
    "billing_cycle" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "next_billing_date" timestamp with time zone,
    "storage_limit" bigint,
    "api_limit" integer,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."subscription_analytics_view" AS
 SELECT "tier",
    "count"(*) AS "subscriber_count",
    "sum"(
        CASE
            WHEN ("status" = 'active'::"text") THEN 1
            ELSE 0
        END) AS "active_count",
    "sum"(
        CASE
            WHEN ("status" = 'cancelled'::"text") THEN 1
            ELSE 0
        END) AS "cancelled_count",
    "sum"("price_per_month") AS "monthly_recurring_revenue"
   FROM "public"."subscriptions"
  GROUP BY "tier";


ALTER VIEW "public"."subscription_analytics_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_session_id" "uuid",
    "event_type" character varying(50) NOT NULL,
    "event_data" "jsonb" NOT NULL,
    "synced_to_devices" "uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."sync_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."sync_events" IS 'Cross-device synchronization event log';



CREATE TABLE IF NOT EXISTS "public"."transition_effects" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "duration" numeric DEFAULT 500,
    "ease" "text" DEFAULT 'ease-in-out'::"text",
    "direction" "text",
    "intensity" numeric,
    "is_preset" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transition_effects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trash_items" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "original_id" "text" NOT NULL,
    "item_type" "text" NOT NULL,
    "title" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "content" "jsonb" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "deleted_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "recovered_at" timestamp with time zone,
    "permanent_delete_at" timestamp with time zone,
    "restoration_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trash_items_item_type_check" CHECK (("item_type" = ANY (ARRAY['item'::"text", 'folder'::"text", 'list'::"text", 'grid'::"text", 'scene'::"text", 'presentation'::"text", 'layout'::"text", 'frame'::"text"])))
);


ALTER TABLE "public"."trash_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."typing_indicators" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "user_name" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:00:05'::interval) NOT NULL
);

ALTER TABLE ONLY "public"."typing_indicators" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."typing_indicators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "achievement_id" "text",
    "awarded_at" timestamp with time zone DEFAULT "now"(),
    "progress" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_achievements" IS 'User-earned achievements';



CREATE MATERIALIZED VIEW "public"."user_activity_stats" AS
 SELECT "ci"."user_id",
    "count"(DISTINCT "ci"."id") AS "total_items",
    "count"(DISTINCT "ci"."id") FILTER (WHERE ("ci"."type" = 'folder'::"text")) AS "folder_count",
    "count"(DISTINCT "ci"."id") FILTER (WHERE ("ci"."type" = 'list'::"text")) AS "list_count",
    "count"(DISTINCT "ci"."id") FILTER (WHERE ("ci"."is_favorite" = true)) AS "favorite_count",
    "count"(DISTINCT "sh"."id") AS "total_searches",
    "count"(DISTINCT "ac"."id") AS "ai_conversation_count",
    "count"(DISTINCT "am"."id") AS "ai_message_count",
    "max"("ci"."accessed_at") AS "last_activity",
    "max"("sh"."created_at") AS "last_search",
    "max"("ac"."last_message_at") AS "last_ai_chat"
   FROM ((("public"."canvas_items" "ci"
     LEFT JOIN "public"."search_history" "sh" ON (("sh"."user_id" = "ci"."user_id")))
     LEFT JOIN "public"."ai_conversations" "ac" ON (("ac"."user_id" = "ci"."user_id")))
     LEFT JOIN "public"."ai_messages" "am" ON (("am"."user_id" = "ci"."user_id")))
  GROUP BY "ci"."user_id"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."user_activity_stats" OWNER TO "postgres";


COMMENT ON MATERIALIZED VIEW "public"."user_activity_stats" IS 'Aggregated user activity statistics';



CREATE TABLE IF NOT EXISTS "public"."user_canvas_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "data_type" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "device_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_canvas_data_data_type_check" CHECK (("data_type" = ANY (ARRAY['tabs'::"text", 'layout'::"text", 'settings'::"text", 'expanded_items'::"text"])))
);


ALTER TABLE "public"."user_canvas_data" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_canvas_data" IS 'Stores user canvas state with real-time sync support';



COMMENT ON COLUMN "public"."user_canvas_data"."data_type" IS 'Type of data: tabs, layout, settings, expanded_items';



COMMENT ON COLUMN "public"."user_canvas_data"."version" IS 'Version number for optimistic locking';



COMMENT ON COLUMN "public"."user_canvas_data"."device_id" IS 'Optional device identifier for conflict resolution';



CREATE TABLE IF NOT EXISTS "public"."user_consents" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "consent_type" character varying(50) NOT NULL,
    "granted" boolean DEFAULT false NOT NULL,
    "granted_at" bigint,
    "revoked_at" bigint,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."user_consents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_consents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_consents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_consents_id_seq" OWNED BY "public"."user_consents"."id";



CREATE TABLE IF NOT EXISTS "public"."user_deletion_requests" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "scheduled_deletion_date" timestamp without time zone NOT NULL,
    "requested_reason" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."user_deletion_requests" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_deletion_requests_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_deletion_requests_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_deletion_requests_id_seq" OWNED BY "public"."user_deletion_requests"."id";



CREATE TABLE IF NOT EXISTS "public"."user_discount_usage" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "discount_code_id" "text" NOT NULL,
    "order_id" "text",
    "used_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_discount_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feeds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "reason" "text" DEFAULT 'following'::"text",
    "feed_score" double precision DEFAULT 0,
    "is_seen" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_feeds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "layout_mode" "text" DEFAULT 'grid'::"text",
    "new_tab_behavior" "text" DEFAULT 'chrome-style'::"text",
    "startup_behavior" "text" DEFAULT 'last-session'::"text",
    "grid_mode_state" "jsonb",
    "ui_settings" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_preferences" IS 'Stores user UI preferences and settings';



CREATE TABLE IF NOT EXISTS "public"."user_referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "referral_code_id" "uuid" NOT NULL,
    "code_used" character varying(255) NOT NULL,
    "double_hash" character varying(255) NOT NULL,
    "auto_friend" boolean DEFAULT true,
    "auto_follow" boolean DEFAULT true,
    "is_friend" boolean DEFAULT false,
    "is_following" boolean DEFAULT false,
    "is_followed_back" boolean DEFAULT false,
    "referee_verified" boolean DEFAULT false,
    "referee_first_login" boolean DEFAULT false,
    "rewards_claimed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "verified_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "no_self_referral" CHECK (("referrer_id" <> "referee_id"))
);


ALTER TABLE "public"."user_referrals" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_referrals" IS 'Tracks referral relationships and auto-friend/follow settings';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "granted_by" "uuid",
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'moderator'::"text", 'admin'::"text", 'super_admin'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_roles" IS 'Global user roles and permissions';



CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" character varying(255) NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "device_info" "jsonb",
    "last_activity" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "expires_at" timestamp without time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_sessions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_sessions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_sessions_id_seq" OWNED BY "public"."user_sessions"."id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "role" "text" DEFAULT 'user'::"text",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'moderator'::"text", 'admin'::"text", 'super_admin'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'User profiles and account information';



CREATE TABLE IF NOT EXISTS "public"."verification_chain" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "achievement_id" "text",
    "block_hash" "text" NOT NULL,
    "previous_hash" "text",
    "signature" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."verification_chain" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."viewport_file_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "file_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "version" integer NOT NULL,
    "snapshot" "jsonb" NOT NULL,
    "content_hash" "text",
    "size_bytes" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."viewport_file_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."viewport_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "path" "text",
    "sort_index" integer DEFAULT 0,
    "content" "jsonb" DEFAULT '{}'::"jsonb",
    "content_text" "text",
    "content_hash" "text",
    "size_bytes" bigint DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "preview_url" "text",
    "is_deleted" boolean DEFAULT false,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "viewport_files_type_check" CHECK (("type" = ANY (ARRAY['folder'::"text", 'canvas'::"text", 'document'::"text", 'asset'::"text", 'link'::"text"])))
);


ALTER TABLE "public"."viewport_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."viewport_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" "text",
    "session_token" "text",
    "client_url" "text",
    "active_file_id" "uuid",
    "viewport_state" "jsonb" DEFAULT '{}'::"jsonb",
    "selection" "jsonb" DEFAULT '{}'::"jsonb",
    "last_event_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '2 days'::interval),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."viewport_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."viewport_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "label" "text",
    "snapshot" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."viewport_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."viewport_state_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '1 day'::interval)
);


ALTER TABLE "public"."viewport_state_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."viewport_workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "mode" "text" DEFAULT 'infinite'::"text" NOT NULL,
    "active_file_id" "uuid",
    "root_file_id" "uuid",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "stats" "jsonb" DEFAULT '{}'::"jsonb",
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "viewport_workspaces_mode_check" CHECK (("mode" = ANY (ARRAY['infinite'::"text", 'square'::"text"])))
);


ALTER TABLE "public"."viewport_workspaces" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."widget_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "widget_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "widget_type" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{"device": null, "browser": null, "version": 1, "lastSyncAt": null, "syncStatus": "synced", "lastModifiedAt": null, "lastModifiedBy": null}'::"jsonb" NOT NULL,
    "checksum" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_sync_status" CHECK ((("metadata" ->> 'syncStatus'::"text") = ANY (ARRAY['synced'::"text", 'pending'::"text", 'error'::"text", 'conflict'::"text"]))),
    CONSTRAINT "valid_widget_type" CHECK (("widget_type" ~ '^[a-z-]+$'::"text"))
);


ALTER TABLE "public"."widget_data" OWNER TO "postgres";


COMMENT ON TABLE "public"."widget_data" IS 'Widget state and data storage with versioning';



CREATE TABLE IF NOT EXISTS "public"."widget_replication_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "widget_data_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" "text" NOT NULL,
    "last_synced_at" timestamp with time zone,
    "version_number" integer DEFAULT 1,
    "status" "text" DEFAULT 'synced'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "widget_replication_status_status_check" CHECK (("status" = ANY (ARRAY['synced'::"text", 'pending'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."widget_replication_status" OWNER TO "postgres";


COMMENT ON TABLE "public"."widget_replication_status" IS 'Multi-device synchronization status tracking';



CREATE TABLE IF NOT EXISTS "public"."widget_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "widget_type" "text" NOT NULL,
    "global_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "user_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "sync_preferences" "jsonb" DEFAULT '{"autoSync": true, "maxSnapshots": 20, "syncInterval": 10000, "keepLocalCopy": true, "backupFrequency": 300000, "conflictResolution": "merge"}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_conflict_resolution" CHECK ((("sync_preferences" ->> 'conflictResolution'::"text") = ANY (ARRAY['client-wins'::"text", 'server-wins'::"text", 'manual'::"text", 'merge'::"text"])))
);


ALTER TABLE "public"."widget_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."widget_settings" IS 'Global and user-specific widget configuration';



CREATE TABLE IF NOT EXISTS "public"."widget_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "widget_data_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_data" "jsonb" NOT NULL,
    "snapshot_reason" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "snapshot_not_empty" CHECK ((("jsonb_array_length"("snapshot_data") > 0) OR ("jsonb_typeof"("snapshot_data") = 'object'::"text"))),
    CONSTRAINT "widget_snapshots_snapshot_reason_check" CHECK (("snapshot_reason" = ANY (ARRAY['auto-save'::"text", 'before-change'::"text", 'user-backup'::"text", 'conflict-resolution'::"text"])))
);


ALTER TABLE "public"."widget_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."widget_snapshots" IS 'Point-in-time backups of widget data for recovery';



CREATE TABLE IF NOT EXISTS "public"."widget_sync_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "widget_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "details" "jsonb",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_sync_log" CHECK (((("event_type" <> 'error'::"text") AND ("error_message" IS NULL)) OR (("event_type" = 'error'::"text") AND ("error_message" IS NOT NULL)))),
    CONSTRAINT "widget_sync_logs_event_type_check" CHECK (("event_type" = ANY (ARRAY['sync'::"text", 'error'::"text", 'conflict'::"text", 'snapshot'::"text", 'restore'::"text"])))
);


ALTER TABLE "public"."widget_sync_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."widget_sync_logs" IS 'Audit trail for all widget synchronization events';



CREATE TABLE IF NOT EXISTS "public"."wishlist_items" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" "text" NOT NULL,
    "status" "text" DEFAULT 'interested'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wishlist_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_keys" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."api_keys_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audit_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."checkout_sessions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."checkout_sessions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."encryption_keys" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."encryption_keys_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."invoices" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."invoices_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."login_attempts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."login_attempts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."payment_methods" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."payment_methods_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."security_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."security_events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."stripe_customers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."stripe_customers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_consents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_consents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_deletion_requests" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_deletion_requests_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_sessions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_sessions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_favorites"
    ADD CONSTRAINT "ai_favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analyses"
    ADD CONSTRAINT "analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_content_stats"
    ADD CONSTRAINT "analytics_content_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_content_stats"
    ADD CONSTRAINT "analytics_content_stats_user_id_resource_id_key" UNIQUE ("user_id", "resource_id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_sessions"
    ADD CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_sessions"
    ADD CONSTRAINT "analytics_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_key_hash_key" UNIQUE ("key_hash");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."belonging_movements"
    ADD CONSTRAINT "belonging_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."belongings"
    ADD CONSTRAINT "belongings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_history"
    ADD CONSTRAINT "billing_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."broadcast_sessions"
    ADD CONSTRAINT "broadcast_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."call_participants"
    ADD CONSTRAINT "call_participants_call_id_user_id_key" UNIQUE ("call_id", "user_id");



ALTER TABLE ONLY "public"."call_participants"
    ADD CONSTRAINT "call_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calls"
    ADD CONSTRAINT "calls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calls"
    ADD CONSTRAINT "calls_room_id_key" UNIQUE ("room_id");



ALTER TABLE ONLY "public"."canvas_items"
    ADD CONSTRAINT "canvas_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_user_id_key" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_sessions"
    ADD CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discount_codes"
    ADD CONSTRAINT "discount_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."discount_codes"
    ADD CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."encrypted_messages"
    ADD CONSTRAINT "encrypted_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."encryption_keys"
    ADD CONSTRAINT "encryption_keys_key_id_key" UNIQUE ("key_id");



ALTER TABLE ONLY "public"."encryption_keys"
    ADD CONSTRAINT "encryption_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_following_id_key" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."frame_style_history"
    ADD CONSTRAINT "frame_style_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gdpr_data_requests"
    ADD CONSTRAINT "gdpr_data_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guest_sessions"
    ADD CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guest_sessions"
    ADD CONSTRAINT "guest_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."hashtags"
    ADD CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hashtags"
    ADD CONSTRAINT "hashtags_tag_key" UNIQUE ("tag");



ALTER TABLE ONLY "public"."hue_bridges"
    ADD CONSTRAINT "hue_bridges_bridge_id_key" UNIQUE ("bridge_id");



ALTER TABLE ONLY "public"."hue_bridges"
    ADD CONSTRAINT "hue_bridges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hue_lights"
    ADD CONSTRAINT "hue_lights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hue_scenes"
    ADD CONSTRAINT "hue_scenes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hue_syncs"
    ADD CONSTRAINT "hue_syncs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interaction_history"
    ADD CONSTRAINT "interaction_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_id_key" UNIQUE ("invoice_id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."layout_states"
    ADD CONSTRAINT "layout_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."layout_states"
    ADD CONSTRAINT "layout_states_user_id_view_id_key" UNIQUE ("user_id", "view_id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_post_id_key" UNIQUE ("user_id", "post_id");



ALTER TABLE ONLY "public"."login_attempts"
    ADD CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logs"
    ADD CONSTRAINT "logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_listings"
    ADD CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_message_id_user_id_emoji_key" UNIQUE ("message_id", "user_id", "emoji");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_read_receipts"
    ADD CONSTRAINT "message_read_receipts_message_id_user_id_key" UNIQUE ("message_id", "user_id");



ALTER TABLE ONLY "public"."message_read_receipts"
    ADD CONSTRAINT "message_read_receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_follows"
    ADD CONSTRAINT "organization_follows_organization_id_user_id_key" UNIQUE ("organization_id", "user_id");



ALTER TABLE ONLY "public"."organization_follows"
    ADD CONSTRAINT "organization_follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_user_id_key" UNIQUE ("organization_id", "user_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_roles"
    ADD CONSTRAINT "organization_roles_organization_id_user_id_key" UNIQUE ("organization_id", "user_id");



ALTER TABLE ONLY "public"."organization_roles"
    ADD CONSTRAINT "organization_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."page_views"
    ADD CONSTRAINT "page_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_payment_method_id_key" UNIQUE ("payment_method_id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_user_id_resource_type_resource_id_permission_key" UNIQUE ("user_id", "resource_type", "resource_id", "permission");



ALTER TABLE ONLY "public"."places"
    ADD CONSTRAINT "places_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."presentations"
    ADD CONSTRAINT "presentations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_confirmation_code_key" UNIQUE ("confirmation_code");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quick_searches"
    ADD CONSTRAINT "quick_searches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quick_searches"
    ADD CONSTRAINT "quick_searches_user_id_name_key" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recovery_logs"
    ADD CONSTRAINT "recovery_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_settings"
    ADD CONSTRAINT "referral_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_settings"
    ADD CONSTRAINT "referral_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_confirmation_code_key" UNIQUE ("confirmation_code");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scenes"
    ADD CONSTRAINT "scenes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_history"
    ADD CONSTRAINT "search_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shared_folders"
    ADD CONSTRAINT "shared_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shared_folders"
    ADD CONSTRAINT "shared_folders_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."shared_items"
    ADD CONSTRAINT "shared_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shared_items"
    ADD CONSTRAINT "shared_items_public_url_key" UNIQUE ("public_url");



ALTER TABLE ONLY "public"."spaces"
    ADD CONSTRAINT "spaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."sync_events"
    ADD CONSTRAINT "sync_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transition_effects"
    ADD CONSTRAINT "transition_effects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trash_items"
    ADD CONSTRAINT "trash_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_conversation_id_user_id_key" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_sessions"
    ADD CONSTRAINT "unique_device_session" UNIQUE ("user_id", "device_id");



ALTER TABLE ONLY "public"."user_referrals"
    ADD CONSTRAINT "unique_referral" UNIQUE ("referrer_id", "referee_id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_achievement_id_key" UNIQUE ("user_id", "achievement_id");



ALTER TABLE ONLY "public"."user_canvas_data"
    ADD CONSTRAINT "user_canvas_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_canvas_data"
    ADD CONSTRAINT "user_canvas_data_user_id_data_type_key" UNIQUE ("user_id", "data_type");



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_consent_type_key" UNIQUE ("user_id", "consent_type");



ALTER TABLE ONLY "public"."user_deletion_requests"
    ADD CONSTRAINT "user_deletion_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_discount_usage"
    ADD CONSTRAINT "user_discount_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_discount_usage"
    ADD CONSTRAINT "user_discount_usage_user_id_order_id_key" UNIQUE ("user_id", "order_id");



ALTER TABLE ONLY "public"."user_feeds"
    ADD CONSTRAINT "user_feeds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_referrals"
    ADD CONSTRAINT "user_referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."verification_chain"
    ADD CONSTRAINT "verification_chain_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viewport_file_versions"
    ADD CONSTRAINT "viewport_file_versions_file_id_version_key" UNIQUE ("file_id", "version");



ALTER TABLE ONLY "public"."viewport_file_versions"
    ADD CONSTRAINT "viewport_file_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viewport_files"
    ADD CONSTRAINT "viewport_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viewport_files"
    ADD CONSTRAINT "viewport_files_workspace_id_parent_id_name_key" UNIQUE ("workspace_id", "parent_id", "name");



ALTER TABLE ONLY "public"."viewport_sessions"
    ADD CONSTRAINT "viewport_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viewport_sessions"
    ADD CONSTRAINT "viewport_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."viewport_snapshots"
    ADD CONSTRAINT "viewport_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viewport_state_events"
    ADD CONSTRAINT "viewport_state_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viewport_workspaces"
    ADD CONSTRAINT "viewport_workspaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viewport_workspaces"
    ADD CONSTRAINT "viewport_workspaces_user_id_name_key" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."widget_data"
    ADD CONSTRAINT "widget_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."widget_data"
    ADD CONSTRAINT "widget_data_widget_id_user_id_key" UNIQUE ("widget_id", "user_id");



ALTER TABLE ONLY "public"."widget_replication_status"
    ADD CONSTRAINT "widget_replication_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."widget_replication_status"
    ADD CONSTRAINT "widget_replication_status_widget_data_id_device_id_key" UNIQUE ("widget_data_id", "device_id");



ALTER TABLE ONLY "public"."widget_settings"
    ADD CONSTRAINT "widget_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."widget_settings"
    ADD CONSTRAINT "widget_settings_user_id_widget_type_key" UNIQUE ("user_id", "widget_type");



ALTER TABLE ONLY "public"."widget_snapshots"
    ADD CONSTRAINT "widget_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."widget_sync_logs"
    ADD CONSTRAINT "widget_sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_user_id_listing_id_key" UNIQUE ("user_id", "listing_id");



CREATE INDEX "hue_bridges_bridge_id_idx" ON "public"."hue_bridges" USING "btree" ("bridge_id");



CREATE INDEX "hue_bridges_user_id_idx" ON "public"."hue_bridges" USING "btree" ("user_id");



CREATE INDEX "hue_lights_bridge_id_idx" ON "public"."hue_lights" USING "btree" ("bridge_id");



CREATE INDEX "hue_lights_user_id_idx" ON "public"."hue_lights" USING "btree" ("user_id");



CREATE INDEX "hue_scenes_bridge_id_idx" ON "public"."hue_scenes" USING "btree" ("bridge_id");



CREATE INDEX "hue_scenes_user_id_idx" ON "public"."hue_scenes" USING "btree" ("user_id");



CREATE INDEX "hue_syncs_bridge_id_idx" ON "public"."hue_syncs" USING "btree" ("bridge_id");



CREATE INDEX "hue_syncs_item_id_idx" ON "public"."hue_syncs" USING "btree" ("item_id");



CREATE INDEX "hue_syncs_user_id_idx" ON "public"."hue_syncs" USING "btree" ("user_id");



CREATE INDEX "idx_achievements_category" ON "public"."achievements" USING "btree" ("category");



CREATE INDEX "idx_achievements_tier" ON "public"."achievements" USING "btree" ("tier");



CREATE INDEX "idx_ai_conversations_pinned" ON "public"."ai_conversations" USING "btree" ("user_id", "is_pinned") WHERE ("is_pinned" = true);



CREATE INDEX "idx_ai_conversations_user" ON "public"."ai_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_ai_conversations_user_id" ON "public"."ai_conversations" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "idx_ai_favorites_frequent" ON "public"."ai_favorites" USING "btree" ("user_id", "is_frequent" DESC);



CREATE INDEX "idx_ai_favorites_user" ON "public"."ai_favorites" USING "btree" ("user_id");



CREATE INDEX "idx_ai_messages_conversation" ON "public"."ai_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_ai_messages_user_id" ON "public"."ai_messages" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_analytics_content_resource_id" ON "public"."analytics_content_stats" USING "btree" ("resource_id");



CREATE INDEX "idx_analytics_content_total_views" ON "public"."analytics_content_stats" USING "btree" ("total_views" DESC);



CREATE INDEX "idx_analytics_content_user_id" ON "public"."analytics_content_stats" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_events_created_at" ON "public"."analytics_events" USING "btree" ("created_at");



CREATE INDEX "idx_analytics_events_event_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_events_resource_id" ON "public"."analytics_events" USING "btree" ("resource_id");



CREATE INDEX "idx_analytics_events_resource_slug" ON "public"."analytics_events" USING "btree" ("resource_slug");



CREATE INDEX "idx_analytics_events_session_id" ON "public"."analytics_events" USING "btree" ("session_id");



CREATE INDEX "idx_analytics_events_user_id" ON "public"."analytics_events" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_sessions_first_seen" ON "public"."analytics_sessions" USING "btree" ("first_seen_at" DESC);



CREATE INDEX "idx_analytics_sessions_is_guest" ON "public"."analytics_sessions" USING "btree" ("is_guest");



CREATE INDEX "idx_analytics_sessions_session_id" ON "public"."analytics_sessions" USING "btree" ("session_id");



CREATE INDEX "idx_analytics_sessions_user_id" ON "public"."analytics_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_api_keys_key_hash" ON "public"."api_keys" USING "btree" ("key_hash");



CREATE INDEX "idx_api_keys_user_id" ON "public"."api_keys" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_resource" ON "public"."audit_logs" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_audit_logs_severity" ON "public"."audit_logs" USING "btree" ("severity");



CREATE INDEX "idx_audit_logs_timestamp" ON "public"."audit_logs" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_belonging_movements_belonging" ON "public"."belonging_movements" USING "btree" ("belonging_id");



CREATE INDEX "idx_belonging_movements_time" ON "public"."belonging_movements" USING "btree" ("moved_at" DESC);



CREATE INDEX "idx_belonging_movements_user" ON "public"."belonging_movements" USING "btree" ("user_id");



CREATE INDEX "idx_belongings_container" ON "public"."belongings" USING "btree" ("container_belonging_id");



CREATE INDEX "idx_belongings_place" ON "public"."belongings" USING "btree" ("place_id");



CREATE INDEX "idx_belongings_status" ON "public"."belongings" USING "btree" ("status");



CREATE INDEX "idx_belongings_user" ON "public"."belongings" USING "btree" ("user_id");



CREATE INDEX "idx_billing_history_status" ON "public"."billing_history" USING "btree" ("status");



CREATE INDEX "idx_billing_history_subscription_id" ON "public"."billing_history" USING "btree" ("subscription_id");



CREATE INDEX "idx_broadcasts_presentation_id" ON "public"."broadcast_sessions" USING "btree" ("presentation_id");



CREATE INDEX "idx_broadcasts_status" ON "public"."broadcast_sessions" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['live'::"text", 'paused'::"text"]));



CREATE INDEX "idx_broadcasts_user_id" ON "public"."broadcast_sessions" USING "btree" ("user_id", "started_at" DESC);



CREATE INDEX "idx_call_participants_call" ON "public"."call_participants" USING "btree" ("call_id");



CREATE INDEX "idx_call_participants_user" ON "public"."call_participants" USING "btree" ("user_id");



CREATE INDEX "idx_calls_conversation" ON "public"."calls" USING "btree" ("conversation_id");



CREATE INDEX "idx_calls_started_at" ON "public"."calls" USING "btree" ("started_at" DESC);



CREATE INDEX "idx_calls_status" ON "public"."calls" USING "btree" ("status");



CREATE INDEX "idx_canvas_items_favorite" ON "public"."canvas_items" USING "btree" ("user_id", "is_favorite") WHERE ("is_favorite" = true);



CREATE INDEX "idx_canvas_items_parent_id" ON "public"."canvas_items" USING "btree" ("parent_id") WHERE ("parent_id" IS NOT NULL);



CREATE INDEX "idx_canvas_items_pinned" ON "public"."canvas_items" USING "btree" ("user_id", "is_pinned") WHERE ("is_pinned" = true);



CREATE INDEX "idx_canvas_items_type" ON "public"."canvas_items" USING "btree" ("user_id", "type");



CREATE INDEX "idx_canvas_items_updated" ON "public"."canvas_items" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "idx_canvas_items_user_id" ON "public"."canvas_items" USING "btree" ("user_id");



CREATE INDEX "idx_content_items_assigned_space_id" ON "public"."content_items" USING "btree" ("assigned_space_id");



CREATE INDEX "idx_content_items_created_at" ON "public"."content_items" USING "btree" ("created_at");



CREATE INDEX "idx_content_items_parent_id" ON "public"."content_items" USING "btree" ("parent_id");



CREATE INDEX "idx_content_items_type" ON "public"."content_items" USING "btree" ("type");



CREATE INDEX "idx_content_items_user_id" ON "public"."content_items" USING "btree" ("user_id");



CREATE INDEX "idx_conversation_participants_conversation" ON "public"."conversation_participants" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_participants_user" ON "public"."conversation_participants" USING "btree" ("user_id");



CREATE INDEX "idx_conversation_participants_user_conversation" ON "public"."conversation_participants" USING "btree" ("user_id", "conversation_id");



CREATE INDEX "idx_conversations_organization" ON "public"."conversations" USING "btree" ("organization_id") WHERE ("organization_id" IS NOT NULL);



CREATE INDEX "idx_conversations_type" ON "public"."conversations" USING "btree" ("type");



CREATE INDEX "idx_conversations_updated_at" ON "public"."conversations" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_deletion_requests_status" ON "public"."user_deletion_requests" USING "btree" ("status");



CREATE INDEX "idx_deletion_requests_user_id" ON "public"."user_deletion_requests" USING "btree" ("user_id");



CREATE INDEX "idx_device_sessions_active" ON "public"."device_sessions" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_device_sessions_last_active" ON "public"."device_sessions" USING "btree" ("last_active_at" DESC);



CREATE INDEX "idx_device_sessions_user" ON "public"."device_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_discount_codes_active" ON "public"."discount_codes" USING "btree" ("active");



CREATE INDEX "idx_discount_codes_code" ON "public"."discount_codes" USING "btree" ("code");



CREATE INDEX "idx_encryption_keys_key_id" ON "public"."encryption_keys" USING "btree" ("key_id");



CREATE INDEX "idx_encryption_keys_user_id" ON "public"."encryption_keys" USING "btree" ("user_id");



CREATE INDEX "idx_follows_follower" ON "public"."follows" USING "btree" ("follower_id");



CREATE INDEX "idx_follows_following" ON "public"."follows" USING "btree" ("following_id");



CREATE INDEX "idx_frame_style_history_item_id" ON "public"."frame_style_history" USING "btree" ("item_id", "created_at" DESC);



CREATE INDEX "idx_frame_style_history_type" ON "public"."frame_style_history" USING "btree" ("user_id", "style_type");



CREATE INDEX "idx_frame_style_history_user_id" ON "public"."frame_style_history" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_hashtags_tag" ON "public"."hashtags" USING "btree" ("tag");



CREATE INDEX "idx_hashtags_trending_score" ON "public"."hashtags" USING "btree" ("trending_score" DESC);



CREATE INDEX "idx_hashtags_usage_count" ON "public"."hashtags" USING "btree" ("usage_count" DESC);



CREATE INDEX "idx_interaction_history_item_id" ON "public"."interaction_history" USING "btree" ("item_id");



CREATE INDEX "idx_interaction_history_type" ON "public"."interaction_history" USING "btree" ("user_id", "interaction_type");



CREATE INDEX "idx_interaction_history_user_id" ON "public"."interaction_history" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_inventory_transactions_item_id" ON "public"."inventory_transactions" USING "btree" ("item_id");



CREATE INDEX "idx_inventory_transactions_timestamp" ON "public"."inventory_transactions" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_inventory_transactions_type" ON "public"."inventory_transactions" USING "btree" ("type");



CREATE INDEX "idx_invoices_customer_id" ON "public"."invoices" USING "btree" ("customer_id");



CREATE INDEX "idx_items_owner_id" ON "public"."items" USING "btree" ("owner_id");



CREATE INDEX "idx_items_parent_id" ON "public"."items" USING "btree" ("parent_id");



CREATE INDEX "idx_items_updated_at" ON "public"."items" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_layout_states_user_id" ON "public"."layout_states" USING "btree" ("user_id");



CREATE INDEX "idx_layout_states_view_id" ON "public"."layout_states" USING "btree" ("view_id");



CREATE INDEX "idx_likes_post_id" ON "public"."likes" USING "btree" ("post_id");



CREATE INDEX "idx_likes_user_id" ON "public"."likes" USING "btree" ("user_id");



CREATE INDEX "idx_login_attempts_created_at" ON "public"."login_attempts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_login_attempts_email" ON "public"."login_attempts" USING "btree" ("email");



CREATE INDEX "idx_login_attempts_ip_address" ON "public"."login_attempts" USING "btree" ("ip_address");



CREATE INDEX "idx_marketplace_category_status" ON "public"."marketplace_listings" USING "btree" ("category", "status");



CREATE INDEX "idx_marketplace_listings_category" ON "public"."marketplace_listings" USING "btree" ("category");



CREATE INDEX "idx_marketplace_listings_created_at" ON "public"."marketplace_listings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_marketplace_listings_seller_id" ON "public"."marketplace_listings" USING "btree" ("seller_id");



CREATE INDEX "idx_marketplace_listings_status" ON "public"."marketplace_listings" USING "btree" ("status");



CREATE INDEX "idx_marketplace_search" ON "public"."marketplace_listings" USING "gin" ("search_vector");



CREATE INDEX "idx_message_reactions_message" ON "public"."message_reactions" USING "btree" ("message_id");



CREATE INDEX "idx_message_reactions_user" ON "public"."message_reactions" USING "btree" ("user_id");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_messages_conversation_created" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_messages_created" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_sender" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_product_id" ON "public"."order_items" USING "btree" ("product_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_orders_user_status" ON "public"."orders" USING "btree" ("user_id", "status");



CREATE INDEX "idx_org_members_org_id" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_org_members_user_id" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_org_roles_active" ON "public"."organization_roles" USING "btree" ("is_active");



CREATE INDEX "idx_org_roles_org_id" ON "public"."organization_roles" USING "btree" ("organization_id");



CREATE INDEX "idx_org_roles_role" ON "public"."organization_roles" USING "btree" ("organization_id", "role");



CREATE INDEX "idx_org_roles_user_id" ON "public"."organization_roles" USING "btree" ("user_id");



CREATE INDEX "idx_organizations_created_by" ON "public"."organizations" USING "btree" ("created_by");



CREATE INDEX "idx_organizations_slug" ON "public"."organizations" USING "btree" ("slug");



CREATE INDEX "idx_page_views_created_at" ON "public"."page_views" USING "btree" ("created_at");



CREATE INDEX "idx_page_views_user_id" ON "public"."page_views" USING "btree" ("user_id");



CREATE INDEX "idx_payment_methods_customer_id" ON "public"."payment_methods" USING "btree" ("customer_id");



CREATE INDEX "idx_permissions_active" ON "public"."permissions" USING "btree" ("is_active", "expires_at");



CREATE INDEX "idx_permissions_resource" ON "public"."permissions" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_permissions_user_id" ON "public"."permissions" USING "btree" ("user_id");



CREATE INDEX "idx_places_parent" ON "public"."places" USING "btree" ("parent_id");



CREATE INDEX "idx_places_type" ON "public"."places" USING "btree" ("type");



CREATE INDEX "idx_places_user" ON "public"."places" USING "btree" ("user_id");



CREATE INDEX "idx_post_comments_created_at" ON "public"."post_comments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_post_comments_post_id" ON "public"."post_comments" USING "btree" ("post_id");



CREATE INDEX "idx_post_comments_user_id" ON "public"."post_comments" USING "btree" ("user_id");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_user_id" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "idx_posts_visibility" ON "public"."posts" USING "btree" ("visibility");



CREATE INDEX "idx_presentation_stats_published" ON "public"."presentation_stats" USING "btree" ("is_published") WHERE ("is_published" = true);



CREATE INDEX "idx_presentation_stats_user" ON "public"."presentation_stats" USING "btree" ("user_id");



CREATE INDEX "idx_presentations_published" ON "public"."presentations" USING "btree" ("user_id", "is_published") WHERE ("is_published" = true);



CREATE INDEX "idx_presentations_updated" ON "public"."presentations" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "idx_presentations_user_id" ON "public"."presentations" USING "btree" ("user_id");



CREATE INDEX "idx_product_variants_product_id" ON "public"."product_variants" USING "btree" ("product_id");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category");



CREATE INDEX "idx_products_search" ON "public"."products" USING "gin" ("search_vector");



CREATE INDEX "idx_products_status" ON "public"."products" USING "btree" ("status");



CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "idx_purchases_created_at" ON "public"."purchases" USING "btree" ("created_at");



CREATE INDEX "idx_purchases_payment_status" ON "public"."purchases" USING "btree" ("payment_status");



CREATE INDEX "idx_purchases_reservation_id" ON "public"."purchases" USING "btree" ("reservation_id");



CREATE INDEX "idx_purchases_user_id" ON "public"."purchases" USING "btree" ("user_id");



CREATE INDEX "idx_quick_searches_pinned" ON "public"."quick_searches" USING "btree" ("user_id", "is_pinned" DESC);



CREATE INDEX "idx_quick_searches_user" ON "public"."quick_searches" USING "btree" ("user_id");



CREATE INDEX "idx_recovery_logs_trash_item" ON "public"."recovery_logs" USING "btree" ("trash_item_id");



CREATE INDEX "idx_recovery_logs_user_id" ON "public"."recovery_logs" USING "btree" ("user_id", "timestamp" DESC);



CREATE INDEX "idx_referral_codes_active" ON "public"."referral_codes" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_referral_codes_code" ON "public"."referral_codes" USING "btree" ("code");



CREATE INDEX "idx_referral_codes_user" ON "public"."referral_codes" USING "btree" ("user_id");



CREATE INDEX "idx_referral_rewards_referral" ON "public"."referral_rewards" USING "btree" ("referral_id");



CREATE INDEX "idx_referral_rewards_unclaimed" ON "public"."referral_rewards" USING "btree" ("is_claimed") WHERE ("is_claimed" = false);



CREATE INDEX "idx_referral_rewards_user" ON "public"."referral_rewards" USING "btree" ("user_id");



CREATE INDEX "idx_referral_settings_user" ON "public"."referral_settings" USING "btree" ("user_id");



CREATE INDEX "idx_replication_status_device" ON "public"."widget_replication_status" USING "btree" ("device_id");



CREATE INDEX "idx_replication_status_user" ON "public"."widget_replication_status" USING "btree" ("user_id");



CREATE INDEX "idx_reservations_confirmation_code" ON "public"."reservations" USING "btree" ("confirmation_code");



CREATE INDEX "idx_reservations_created_at" ON "public"."reservations" USING "btree" ("created_at");



CREATE INDEX "idx_reservations_status" ON "public"."reservations" USING "btree" ("status");



CREATE INDEX "idx_reservations_user_id" ON "public"."reservations" USING "btree" ("user_id");



CREATE INDEX "idx_scenes_presentation_id" ON "public"."scenes" USING "btree" ("presentation_id", "order");



CREATE INDEX "idx_scenes_updated" ON "public"."scenes" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "idx_scenes_user_id" ON "public"."scenes" USING "btree" ("user_id");



CREATE INDEX "idx_search_history_created" ON "public"."search_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_search_history_query" ON "public"."search_history" USING "btree" ("user_id", "query");



CREATE INDEX "idx_search_history_type" ON "public"."search_history" USING "btree" ("user_id", "search_type");



CREATE INDEX "idx_search_history_user" ON "public"."search_history" USING "btree" ("user_id");



CREATE INDEX "idx_search_history_user_id" ON "public"."search_history" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_security_events_created_at" ON "public"."security_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_security_events_resolved" ON "public"."security_events" USING "btree" ("resolved");



CREATE INDEX "idx_security_events_severity" ON "public"."security_events" USING "btree" ("severity");



CREATE INDEX "idx_security_events_user_id" ON "public"."security_events" USING "btree" ("user_id");



CREATE INDEX "idx_shared_folders_expires_at" ON "public"."shared_folders" USING "btree" ("expires_at");



CREATE INDEX "idx_shared_folders_folder_id" ON "public"."shared_folders" USING "btree" ("folder_id");



CREATE INDEX "idx_shared_folders_slug" ON "public"."shared_folders" USING "btree" ("slug");



CREATE INDEX "idx_shared_folders_user_id" ON "public"."shared_folders" USING "btree" ("user_id");



CREATE INDEX "idx_stock_movements_created_at" ON "public"."stock_movements" USING "btree" ("created_at");



CREATE INDEX "idx_stock_movements_movement_type" ON "public"."stock_movements" USING "btree" ("movement_type");



CREATE INDEX "idx_stock_movements_product_id" ON "public"."stock_movements" USING "btree" ("product_id");



CREATE INDEX "idx_stock_movements_user_id" ON "public"."stock_movements" USING "btree" ("user_id");



CREATE INDEX "idx_stripe_customers_user_id" ON "public"."stripe_customers" USING "btree" ("user_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_subscriptions_user_tier" ON "public"."subscriptions" USING "btree" ("user_id", "tier");



CREATE INDEX "idx_sync_events_created" ON "public"."sync_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_sync_events_device" ON "public"."sync_events" USING "btree" ("device_session_id");



CREATE INDEX "idx_sync_events_user" ON "public"."sync_events" USING "btree" ("user_id");



CREATE INDEX "idx_transitions_type" ON "public"."transition_effects" USING "btree" ("type");



CREATE INDEX "idx_transitions_user_id" ON "public"."transition_effects" USING "btree" ("user_id");



CREATE INDEX "idx_trash_items_expires" ON "public"."trash_items" USING "btree" ("expires_at") WHERE ("permanent_delete_at" IS NULL);



CREATE INDEX "idx_trash_items_type" ON "public"."trash_items" USING "btree" ("user_id", "item_type");



CREATE INDEX "idx_trash_items_user_id" ON "public"."trash_items" USING "btree" ("user_id", "deleted_at" DESC);



CREATE INDEX "idx_typing_indicators_conversation" ON "public"."typing_indicators" USING "btree" ("conversation_id");



CREATE INDEX "idx_typing_indicators_expires" ON "public"."typing_indicators" USING "btree" ("expires_at");



CREATE INDEX "idx_user_achievements_achievement_id" ON "public"."user_achievements" USING "btree" ("achievement_id");



CREATE INDEX "idx_user_achievements_awarded_at" ON "public"."user_achievements" USING "btree" ("awarded_at");



CREATE INDEX "idx_user_achievements_user_id" ON "public"."user_achievements" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_user_activity_stats_user_id" ON "public"."user_activity_stats" USING "btree" ("user_id");



CREATE INDEX "idx_user_canvas_data_type" ON "public"."user_canvas_data" USING "btree" ("user_id", "data_type");



CREATE INDEX "idx_user_canvas_data_updated" ON "public"."user_canvas_data" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_user_canvas_data_user_id" ON "public"."user_canvas_data" USING "btree" ("user_id");



CREATE INDEX "idx_user_consents_user_id" ON "public"."user_consents" USING "btree" ("user_id");



CREATE INDEX "idx_user_discount_usage_user_id" ON "public"."user_discount_usage" USING "btree" ("user_id");



CREATE INDEX "idx_user_feeds_is_seen" ON "public"."user_feeds" USING "btree" ("is_seen");



CREATE INDEX "idx_user_feeds_user_id" ON "public"."user_feeds" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_user_preferences_user_id" ON "public"."user_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_user_referrals_code" ON "public"."user_referrals" USING "btree" ("referral_code_id");



CREATE INDEX "idx_user_referrals_referee" ON "public"."user_referrals" USING "btree" ("referee_id");



CREATE INDEX "idx_user_referrals_referrer" ON "public"."user_referrals" USING "btree" ("referrer_id");



CREATE INDEX "idx_user_referrals_verified" ON "public"."user_referrals" USING "btree" ("referee_verified") WHERE ("referee_verified" = true);



CREATE INDEX "idx_user_roles_active" ON "public"."user_roles" USING "btree" ("is_active", "expires_at");



CREATE INDEX "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_user_sessions_expires_at" ON "public"."user_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_user_sessions_token" ON "public"."user_sessions" USING "btree" ("session_token");



CREATE INDEX "idx_user_sessions_user_id" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_users_created_at" ON "public"."users" USING "btree" ("created_at");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_username" ON "public"."users" USING "btree" ("username");



CREATE INDEX "idx_viewport_file_versions_file" ON "public"."viewport_file_versions" USING "btree" ("file_id");



CREATE INDEX "idx_viewport_file_versions_workspace" ON "public"."viewport_file_versions" USING "btree" ("workspace_id");



CREATE INDEX "idx_viewport_files_parent" ON "public"."viewport_files" USING "btree" ("parent_id");



CREATE INDEX "idx_viewport_files_updated" ON "public"."viewport_files" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_viewport_files_user" ON "public"."viewport_files" USING "btree" ("user_id");



CREATE INDEX "idx_viewport_files_workspace" ON "public"."viewport_files" USING "btree" ("workspace_id");



CREATE INDEX "idx_viewport_sessions_updated" ON "public"."viewport_sessions" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_viewport_sessions_user" ON "public"."viewport_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_viewport_sessions_workspace" ON "public"."viewport_sessions" USING "btree" ("workspace_id");



CREATE INDEX "idx_viewport_snapshots_workspace" ON "public"."viewport_snapshots" USING "btree" ("workspace_id");



CREATE INDEX "idx_viewport_state_events_created" ON "public"."viewport_state_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_viewport_state_events_workspace" ON "public"."viewport_state_events" USING "btree" ("workspace_id");



CREATE INDEX "idx_viewport_workspaces_updated" ON "public"."viewport_workspaces" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_viewport_workspaces_user" ON "public"."viewport_workspaces" USING "btree" ("user_id");



CREATE INDEX "idx_widget_data_updated_at" ON "public"."widget_data" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_widget_data_user_id" ON "public"."widget_data" USING "btree" ("user_id");



CREATE INDEX "idx_widget_data_widget_id_user" ON "public"."widget_data" USING "btree" ("widget_id", "user_id");



CREATE INDEX "idx_widget_data_widget_type" ON "public"."widget_data" USING "btree" ("widget_type");



CREATE INDEX "idx_widget_settings_user_id" ON "public"."widget_settings" USING "btree" ("user_id");



CREATE INDEX "idx_widget_settings_widget_type" ON "public"."widget_settings" USING "btree" ("widget_type");



CREATE INDEX "idx_widget_snapshots_created" ON "public"."widget_snapshots" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_widget_snapshots_reason" ON "public"."widget_snapshots" USING "btree" ("snapshot_reason");



CREATE INDEX "idx_widget_snapshots_user_id" ON "public"."widget_snapshots" USING "btree" ("user_id");



CREATE INDEX "idx_widget_snapshots_widget_id" ON "public"."widget_snapshots" USING "btree" ("widget_data_id");



CREATE INDEX "idx_widget_sync_logs_created" ON "public"."widget_sync_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_widget_sync_logs_event_type" ON "public"."widget_sync_logs" USING "btree" ("event_type");



CREATE INDEX "idx_widget_sync_logs_user_id" ON "public"."widget_sync_logs" USING "btree" ("user_id");



CREATE INDEX "idx_wishlist_items_user_id" ON "public"."wishlist_items" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "ai_messages_update_conversation_timestamp" AFTER INSERT ON "public"."ai_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_conversation_timestamp"();



CREATE OR REPLACE TRIGGER "canvas_items_updated_at" BEFORE UPDATE ON "public"."canvas_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "layout_states_updated_at" BEFORE UPDATE ON "public"."layout_states" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "messages_update_conversation_timestamp" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_timestamp"();



CREATE OR REPLACE TRIGGER "on_organization_follow_change" AFTER INSERT OR DELETE ON "public"."organization_follows" FOR EACH ROW EXECUTE FUNCTION "public"."update_organization_follow_counts"();



CREATE OR REPLACE TRIGGER "on_organization_member_change" AFTER INSERT OR DELETE ON "public"."organization_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_organization_member_counts"();



CREATE OR REPLACE TRIGGER "on_sync_event_update_device" AFTER INSERT ON "public"."sync_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_device_last_active"();



CREATE OR REPLACE TRIGGER "orders_calculate_total_trigger" BEFORE INSERT OR UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_order_total"();



CREATE OR REPLACE TRIGGER "orders_updated_at_trigger" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_orders_updated_at"();



CREATE OR REPLACE TRIGGER "presentations_updated_at" BEFORE UPDATE ON "public"."presentations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "scenes_updated_at" BEFORE UPDATE ON "public"."scenes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_belongings_updated" BEFORE UPDATE ON "public"."belongings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_increment_shared_folder_access" AFTER INSERT ON "public"."analytics_events" FOR EACH ROW WHEN ((("new"."event_type" = 'shared_folder_view'::"text") AND ("new"."resource_slug" IS NOT NULL))) EXECUTE FUNCTION "public"."increment_shared_folder_access"();



CREATE OR REPLACE TRIGGER "trg_places_updated" BEFORE UPDATE ON "public"."places" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_update_follow_counts" AFTER INSERT OR DELETE ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "public"."update_follow_counts"();



CREATE OR REPLACE TRIGGER "trg_update_post_comment_count" AFTER INSERT OR DELETE ON "public"."post_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_comment_count"();



CREATE OR REPLACE TRIGGER "trg_update_post_like_count" AFTER INSERT OR DELETE ON "public"."likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_like_count"();



CREATE OR REPLACE TRIGGER "trg_viewport_files_updated" BEFORE UPDATE ON "public"."viewport_files" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_viewport_sessions_updated" BEFORE UPDATE ON "public"."viewport_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_viewport_workspaces_updated" BEFORE UPDATE ON "public"."viewport_workspaces" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_conversation_last_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_last_message"();



CREATE OR REPLACE TRIGGER "update_content_items_updated_at" BEFORE UPDATE ON "public"."content_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_deletion_requests_updated_at" BEFORE UPDATE ON "public"."user_deletion_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reservations_updated_at" BEFORE UPDATE ON "public"."reservations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_canvas_data_updated_at" BEFORE UPDATE ON "public"."user_canvas_data" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_consents_updated_at" BEFORE UPDATE ON "public"."user_consents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "widget_data_auto_snapshot" BEFORE UPDATE ON "public"."widget_data" FOR EACH ROW WHEN (("old"."data" IS DISTINCT FROM "new"."data")) EXECUTE FUNCTION "public"."create_auto_snapshot"();



CREATE OR REPLACE TRIGGER "widget_data_version_increment" BEFORE UPDATE ON "public"."widget_data" FOR EACH ROW EXECUTE FUNCTION "public"."increment_widget_version"();



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_favorites"
    ADD CONSTRAINT "ai_favorites_contact_user_id_fkey" FOREIGN KEY ("contact_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_favorites"
    ADD CONSTRAINT "ai_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analyses"
    ADD CONSTRAINT "analyses_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analyses"
    ADD CONSTRAINT "analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_content_stats"
    ADD CONSTRAINT "analytics_content_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."analytics_sessions"
    ADD CONSTRAINT "analytics_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."belonging_movements"
    ADD CONSTRAINT "belonging_movements_belonging_id_fkey" FOREIGN KEY ("belonging_id") REFERENCES "public"."belongings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."belonging_movements"
    ADD CONSTRAINT "belonging_movements_from_container_id_fkey" FOREIGN KEY ("from_container_id") REFERENCES "public"."belongings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."belonging_movements"
    ADD CONSTRAINT "belonging_movements_from_place_id_fkey" FOREIGN KEY ("from_place_id") REFERENCES "public"."places"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."belonging_movements"
    ADD CONSTRAINT "belonging_movements_to_container_id_fkey" FOREIGN KEY ("to_container_id") REFERENCES "public"."belongings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."belonging_movements"
    ADD CONSTRAINT "belonging_movements_to_place_id_fkey" FOREIGN KEY ("to_place_id") REFERENCES "public"."places"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."belonging_movements"
    ADD CONSTRAINT "belonging_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."belongings"
    ADD CONSTRAINT "belongings_container_belonging_id_fkey" FOREIGN KEY ("container_belonging_id") REFERENCES "public"."belongings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."belongings"
    ADD CONSTRAINT "belongings_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."belongings"
    ADD CONSTRAINT "belongings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_history"
    ADD CONSTRAINT "billing_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."broadcast_sessions"
    ADD CONSTRAINT "broadcast_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_participants"
    ADD CONSTRAINT "call_participants_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."calls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."call_participants"
    ADD CONSTRAINT "call_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calls"
    ADD CONSTRAINT "calls_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calls"
    ADD CONSTRAINT "calls_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."canvas_items"
    ADD CONSTRAINT "canvas_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_items"
    ADD CONSTRAINT "content_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_sessions"
    ADD CONSTRAINT "device_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."encrypted_messages"
    ADD CONSTRAINT "encrypted_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."encrypted_messages"
    ADD CONSTRAINT "encrypted_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."encryption_keys"
    ADD CONSTRAINT "encryption_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."frame_style_history"
    ADD CONSTRAINT "frame_style_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gdpr_data_requests"
    ADD CONSTRAINT "gdpr_data_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hue_bridges"
    ADD CONSTRAINT "hue_bridges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hue_lights"
    ADD CONSTRAINT "hue_lights_bridge_id_fkey" FOREIGN KEY ("bridge_id") REFERENCES "public"."hue_bridges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hue_lights"
    ADD CONSTRAINT "hue_lights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hue_scenes"
    ADD CONSTRAINT "hue_scenes_bridge_id_fkey" FOREIGN KEY ("bridge_id") REFERENCES "public"."hue_bridges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hue_scenes"
    ADD CONSTRAINT "hue_scenes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hue_syncs"
    ADD CONSTRAINT "hue_syncs_bridge_id_fkey" FOREIGN KEY ("bridge_id") REFERENCES "public"."hue_bridges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hue_syncs"
    ADD CONSTRAINT "hue_syncs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interaction_history"
    ADD CONSTRAINT "interaction_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."layout_states"
    ADD CONSTRAINT "layout_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."logs"
    ADD CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."marketplace_listings"
    ADD CONSTRAINT "marketplace_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_read_receipts"
    ADD CONSTRAINT "message_read_receipts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_read_receipts"
    ADD CONSTRAINT "message_read_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_forwarded_from_id_fkey" FOREIGN KEY ("forwarded_from_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_reply_to_fkey" FOREIGN KEY ("reply_to") REFERENCES "public"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_follows"
    ADD CONSTRAINT "organization_follows_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_follows"
    ADD CONSTRAINT "organization_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_roles"
    ADD CONSTRAINT "organization_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organization_roles"
    ADD CONSTRAINT "organization_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."page_views"
    ADD CONSTRAINT "page_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."places"
    ADD CONSTRAINT "places_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."places"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."places"
    ADD CONSTRAINT "places_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presentations"
    ADD CONSTRAINT "presentations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quick_searches"
    ADD CONSTRAINT "quick_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recovery_logs"
    ADD CONSTRAINT "recovery_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "public"."user_referrals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_settings"
    ADD CONSTRAINT "referral_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scenes"
    ADD CONSTRAINT "scenes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_history"
    ADD CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shared_folders"
    ADD CONSTRAINT "shared_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_items"
    ADD CONSTRAINT "shared_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_items"
    ADD CONSTRAINT "shared_items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_items"
    ADD CONSTRAINT "shared_items_shared_with_organization_id_fkey" FOREIGN KEY ("shared_with_organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_items"
    ADD CONSTRAINT "shared_items_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."spaces"
    ADD CONSTRAINT "spaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sync_events"
    ADD CONSTRAINT "sync_events_device_session_id_fkey" FOREIGN KEY ("device_session_id") REFERENCES "public"."device_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sync_events"
    ADD CONSTRAINT "sync_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transition_effects"
    ADD CONSTRAINT "transition_effects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trash_items"
    ADD CONSTRAINT "trash_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."typing_indicators"
    ADD CONSTRAINT "typing_indicators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_canvas_data"
    ADD CONSTRAINT "user_canvas_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_deletion_requests"
    ADD CONSTRAINT "user_deletion_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_discount_usage"
    ADD CONSTRAINT "user_discount_usage_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_discount_usage"
    ADD CONSTRAINT "user_discount_usage_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_discount_usage"
    ADD CONSTRAINT "user_discount_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feeds"
    ADD CONSTRAINT "user_feeds_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feeds"
    ADD CONSTRAINT "user_feeds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_referrals"
    ADD CONSTRAINT "user_referrals_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_referrals"
    ADD CONSTRAINT "user_referrals_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_referrals"
    ADD CONSTRAINT "user_referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_chain"
    ADD CONSTRAINT "verification_chain_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_chain"
    ADD CONSTRAINT "verification_chain_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_file_versions"
    ADD CONSTRAINT "viewport_file_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."viewport_file_versions"
    ADD CONSTRAINT "viewport_file_versions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."viewport_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_file_versions"
    ADD CONSTRAINT "viewport_file_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_file_versions"
    ADD CONSTRAINT "viewport_file_versions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."viewport_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_files"
    ADD CONSTRAINT "viewport_files_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."viewport_files"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."viewport_files"
    ADD CONSTRAINT "viewport_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_files"
    ADD CONSTRAINT "viewport_files_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."viewport_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_sessions"
    ADD CONSTRAINT "viewport_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_sessions"
    ADD CONSTRAINT "viewport_sessions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."viewport_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_snapshots"
    ADD CONSTRAINT "viewport_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_snapshots"
    ADD CONSTRAINT "viewport_snapshots_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."viewport_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_state_events"
    ADD CONSTRAINT "viewport_state_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."viewport_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."viewport_state_events"
    ADD CONSTRAINT "viewport_state_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_state_events"
    ADD CONSTRAINT "viewport_state_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."viewport_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."viewport_workspaces"
    ADD CONSTRAINT "viewport_workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."widget_data"
    ADD CONSTRAINT "widget_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."widget_replication_status"
    ADD CONSTRAINT "widget_replication_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."widget_replication_status"
    ADD CONSTRAINT "widget_replication_status_widget_data_id_fkey" FOREIGN KEY ("widget_data_id") REFERENCES "public"."widget_data"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."widget_settings"
    ADD CONSTRAINT "widget_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."widget_snapshots"
    ADD CONSTRAINT "widget_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."widget_snapshots"
    ADD CONSTRAINT "widget_snapshots_widget_data_id_fkey" FOREIGN KEY ("widget_data_id") REFERENCES "public"."widget_data"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."widget_sync_logs"
    ADD CONSTRAINT "widget_sync_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "API Keys: Users can create own keys" ON "public"."api_keys" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "API Keys: Users can delete own keys" ON "public"."api_keys" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "API Keys: Users can update own keys" ON "public"."api_keys" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "API Keys: Users can view own keys" ON "public"."api_keys" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Achievements are viewable by everyone" ON "public"."achievements" FOR SELECT USING (true);



CREATE POLICY "Admins can manage permissions" ON "public"."permissions" USING ("public"."is_global_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage roles" ON "public"."user_roles" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) AND ("ur"."is_active" = true)))));



CREATE POLICY "Admins can view all logs" ON "public"."logs" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins manage members" ON "public"."organization_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "organization_members"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins update org" ON "public"."organizations" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Anyone can create notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert logs" ON "public"."logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view comments" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view follows" ON "public"."follows" FOR SELECT USING (true);



CREATE POLICY "Anyone can view organization follows" ON "public"."organization_follows" FOR SELECT USING (true);



CREATE POLICY "Anyone can view organization members" ON "public"."organization_members" FOR SELECT USING (true);



CREATE POLICY "Anyone can view organizations" ON "public"."organizations" FOR SELECT USING (true);



CREATE POLICY "Anyone can view ratings" ON "public"."ratings" FOR SELECT USING (true);



CREATE POLICY "Comments viewable by all" ON "public"."post_comments" FOR SELECT USING (true);



CREATE POLICY "Content stats insertable by owner" ON "public"."analytics_content_stats" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Content stats updatable by owner" ON "public"."analytics_content_stats" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Content stats viewable by owner" ON "public"."analytics_content_stats" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Creator deletes org" ON "public"."organizations" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Events insertable by all" ON "public"."analytics_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Events viewable by owner or admin" ON "public"."analytics_events" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_global_admin"("auth"."uid"())));



CREATE POLICY "Follows viewable by all" ON "public"."follows" FOR SELECT USING (true);



CREATE POLICY "Hashtags viewable by all" ON "public"."hashtags" FOR SELECT USING (true);



CREATE POLICY "Likes viewable by all" ON "public"."likes" FOR SELECT USING (true);



CREATE POLICY "Members can update organization" ON "public"."organization_members" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "organization_members_1"."user_id"
   FROM "public"."organization_members" "organization_members_1"
  WHERE (("organization_members_1"."organization_id" = "organization_members_1"."organization_id") AND ("organization_members_1"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Members viewable by all" ON "public"."organization_members" FOR SELECT USING (true);



CREATE POLICY "Org admins can manage roles" ON "public"."organization_roles" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_roles" "or2"
  WHERE (("or2"."organization_id" = "organization_roles"."organization_id") AND ("or2"."user_id" = "auth"."uid"()) AND ("or2"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND ("or2"."is_active" = true)))));



CREATE POLICY "Org roles viewable by members" ON "public"."organization_roles" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."organization_roles" "or2"
  WHERE (("or2"."organization_id" = "organization_roles"."organization_id") AND ("or2"."user_id" = "auth"."uid"()) AND ("or2"."is_active" = true))))));



CREATE POLICY "Organizations viewable by all" ON "public"."organizations" FOR SELECT USING (true);



CREATE POLICY "Owners can manage members" ON "public"."organization_members" USING (("auth"."uid"() IN ( SELECT "organization_members_1"."user_id"
   FROM "public"."organization_members" "organization_members_1"
  WHERE (("organization_members_1"."organization_id" = "organization_members_1"."organization_id") AND ("organization_members_1"."role" = 'owner'::"text")))));



CREATE POLICY "Permissions viewable by owner or admins" ON "public"."permissions" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_global_admin"("auth"."uid"())));



CREATE POLICY "Posts viewable if public or owner" ON "public"."posts" FOR SELECT USING ((("visibility" = 'public'::"text") OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Profiles viewable by all" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public spaces are viewable" ON "public"."spaces" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Sessions insertable by all" ON "public"."analytics_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Sessions updatable by session owner" ON "public"."analytics_sessions" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Sessions viewable by owner or admin" ON "public"."analytics_sessions" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_global_admin"("auth"."uid"())));



CREATE POLICY "Shared folders viewable by all if active" ON "public"."shared_folders" FOR SELECT USING ((("is_active" = true) AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



CREATE POLICY "Stock: Users can create stock movements" ON "public"."stock_movements" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Stock: Users can view own stock movements" ON "public"."stock_movements" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "System can create referrals" ON "public"."user_referrals" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create rewards" ON "public"."referral_rewards" FOR INSERT WITH CHECK (true);



CREATE POLICY "User roles viewable by all authenticated users" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can add favorites" ON "public"."ai_favorites" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can add reactions" ON "public"."message_reactions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can claim their own rewards" ON "public"."referral_rewards" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create AI conversations" ON "public"."ai_conversations" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create AI messages" ON "public"."ai_messages" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create API keys" ON "public"."api_keys" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create analyses" ON "public"."analyses" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create analytics events" ON "public"."analytics_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create comments" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create devices" ON "public"."devices" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can create follows" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can create own GDPR requests" ON "public"."gdpr_data_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own content items" ON "public"."content_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own purchases" ON "public"."purchases" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own reservations" ON "public"."reservations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create page views" ON "public"."page_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create quick searches" ON "public"."quick_searches" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create ratings" ON "public"."ratings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create search history" ON "public"."search_history" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create shared items" ON "public"."shared_items" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can create spaces" ON "public"."spaces" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can create sync events" ON "public"."sync_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own referral codes" ON "public"."referral_codes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete lights from their bridges" ON "public"."hue_lights" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own API keys" ON "public"."api_keys" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own content items" ON "public"."content_items" FOR DELETE USING ((("auth"."uid"() = "user_id") AND ("is_deletable" = true)));



CREATE POLICY "Users can delete own devices" ON "public"."devices" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can delete own follows" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can delete own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own shared items" ON "public"."shared_items" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can delete own spaces" ON "public"."spaces" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can delete scenes from their bridges" ON "public"."hue_scenes" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their favorites" ON "public"."ai_favorites" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own bridges" ON "public"."hue_bridges" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own items" ON "public"."items" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can delete their quick searches" ON "public"."quick_searches" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their search history" ON "public"."search_history" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their syncs" ON "public"."hue_syncs" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can follow organizations" ON "public"."organization_follows" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert lights to their bridges" ON "public"."hue_lights" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert messages in their conversations" ON "public"."messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert scenes to their bridges" ON "public"."hue_scenes" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own bridges" ON "public"."hue_bridges" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own items" ON "public"."items" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can insert their syncs" ON "public"."hue_syncs" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can like posts" ON "public"."likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own canvas data" ON "public"."user_canvas_data" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own devices" ON "public"."device_sessions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own preferences" ON "public"."user_preferences" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own settings" ON "public"."referral_settings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can mark messages as read" ON "public"."message_read_receipts" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can remove their reactions" ON "public"."message_reactions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can send encrypted messages" ON "public"."encrypted_messages" FOR INSERT WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can unfollow organizations" ON "public"."organization_follows" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can unlike posts" ON "public"."likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update lights in their bridges" ON "public"."hue_lights" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own API keys" ON "public"."api_keys" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own content items" ON "public"."content_items" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own devices" ON "public"."devices" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own ratings" ON "public"."ratings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own reservations" ON "public"."reservations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own shared items" ON "public"."shared_items" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can update own spaces" ON "public"."spaces" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can update scenes in their bridges" ON "public"."hue_scenes" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their AI conversations" ON "public"."ai_conversations" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their favorites" ON "public"."ai_favorites" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own bridges" ON "public"."hue_bridges" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own items" ON "public"."items" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can update their own messages" ON "public"."messages" FOR UPDATE USING (("sender_id" = "auth"."uid"())) WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own referral codes" ON "public"."referral_codes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own referral status" ON "public"."user_referrals" FOR UPDATE USING ((("auth"."uid"() = "referrer_id") OR ("auth"."uid"() = "referee_id")));



CREATE POLICY "Users can update their quick searches" ON "public"."quick_searches" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their syncs" ON "public"."hue_syncs" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view encrypted messages in their conversations" ON "public"."encrypted_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "encrypted_messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view items shared with them" ON "public"."shared_items" FOR SELECT USING ((("auth"."uid"() = "owner_id") OR ("auth"."uid"() = "shared_with_user_id") OR ("is_public" = true)));



CREATE POLICY "Users can view lights from their bridges" ON "public"."hue_lights" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view messages in their conversations" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."conversation_id" = "messages"."conversation_id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view others' achievements" ON "public"."user_achievements" FOR SELECT USING (true);



CREATE POLICY "Users can view own API keys" ON "public"."api_keys" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own GDPR requests" ON "public"."gdpr_data_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own achievements" ON "public"."user_achievements" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own content items" ON "public"."content_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own devices" ON "public"."devices" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own purchases" ON "public"."purchases" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own reservations" ON "public"."reservations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own roles" ON "public"."user_roles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own spaces" ON "public"."spaces" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can view reactions" ON "public"."message_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."messages"
     JOIN "public"."conversation_participants" ON (("messages"."conversation_id" = "conversation_participants"."conversation_id")))
  WHERE (("messages"."id" = "message_reactions"."message_id") AND ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view read receipts" ON "public"."message_read_receipts" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view referrals they're involved in" ON "public"."user_referrals" FOR SELECT USING ((("auth"."uid"() = "referrer_id") OR ("auth"."uid"() = "referee_id")));



CREATE POLICY "Users can view scenes from their bridges" ON "public"."hue_scenes" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their AI conversations" ON "public"."ai_conversations" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their AI messages" ON "public"."ai_messages" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their favorites" ON "public"."ai_favorites" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own analyses" ON "public"."analyses" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own bridges" ON "public"."hue_bridges" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own devices" ON "public"."device_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own items" ON "public"."items" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can view their own referral codes" ON "public"."referral_codes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own rewards" ON "public"."referral_rewards" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own settings" ON "public"."referral_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own sync events" ON "public"."sync_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their quick searches" ON "public"."quick_searches" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their search history" ON "public"."search_history" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their syncs" ON "public"."hue_syncs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users create comments" ON "public"."post_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users create own follow" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users create own posts" ON "public"."posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users create own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users create own shared folders" ON "public"."shared_folders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users delete own comments" ON "public"."post_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users delete own follow" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users delete own posts" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users delete own shared folders" ON "public"."shared_folders" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users insert their own viewport events" ON "public"."viewport_state_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users insert their own viewport versions" ON "public"."viewport_file_versions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own AI conversations" ON "public"."ai_conversations" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own AI messages" ON "public"."ai_messages" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own belonging movements" ON "public"."belonging_movements" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own belongings" ON "public"."belongings" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own broadcasts" ON "public"."broadcast_sessions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own canvas items" ON "public"."canvas_items" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own frame style history" ON "public"."frame_style_history" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own interaction history" ON "public"."interaction_history" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own layout states" ON "public"."layout_states" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own places" ON "public"."places" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own presentations" ON "public"."presentations" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own scenes" ON "public"."scenes" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own search history" ON "public"."search_history" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own transitions" ON "public"."transition_effects" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own trash" ON "public"."trash_items" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own viewport files" ON "public"."viewport_files" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own viewport sessions" ON "public"."viewport_sessions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own viewport snapshots" ON "public"."viewport_snapshots" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage their own viewport workspaces" ON "public"."viewport_workspaces" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users read their own viewport events" ON "public"."viewport_state_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users read their own viewport versions" ON "public"."viewport_file_versions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users see own feed" ON "public"."user_feeds" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users update own comments" ON "public"."post_comments" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users update own posts" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users update own shared folders" ON "public"."shared_folders" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view their own logs" ON "public"."recovery_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analyses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_content_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."belonging_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."belongings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."billing_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "billing_history_select_policy" ON "public"."billing_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."subscriptions"
  WHERE (("subscriptions"."id" = "billing_history"."subscription_id") AND ("subscriptions"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."broadcast_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."call_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "call_participants_insert" ON "public"."call_participants" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."calls" "c"
  WHERE (("c"."id" = "call_participants"."call_id") AND ("c"."initiator_id" = "auth"."uid"()))))));



CREATE POLICY "call_participants_select" ON "public"."call_participants" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."call_participants" "cp"
  WHERE (("cp"."call_id" = "call_participants"."call_id") AND ("cp"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."calls" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "calls_insert" ON "public"."calls" FOR INSERT WITH CHECK (("initiator_id" = "auth"."uid"()));



CREATE POLICY "calls_select" ON "public"."calls" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "calls"."conversation_id") AND ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "calls_update" ON "public"."calls" FOR UPDATE USING ((("initiator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."call_participants" "cp"
  WHERE (("cp"."call_id" = "calls"."id") AND ("cp"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."canvas_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkout_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversation_participants_insert" ON "public"."conversation_participants" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "conversation_participants"."conversation_id") AND ("cp"."user_id" = "auth"."uid"()) AND ("cp"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



CREATE POLICY "conversation_participants_select" ON "public"."conversation_participants" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "conversation_participants"."conversation_id") AND ("cp"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_insert" ON "public"."conversations" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("organization_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "conversations"."organization_id") AND ("om"."user_id" = "auth"."uid"())))))));



CREATE POLICY "conversations_select" ON "public"."conversations" FOR SELECT USING (((("organization_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "conversations"."id") AND ("cp"."user_id" = "auth"."uid"()))))) OR (("organization_id" IS NOT NULL) AND (("is_organization_wide" AND (EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "conversations"."organization_id") AND ("om"."user_id" = "auth"."uid"()))))) OR ((NOT "is_organization_wide") AND (EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "conversations"."id") AND ("cp"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "conversations_update" ON "public"."conversations" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "conversations"."id") AND ("cp"."user_id" = "auth"."uid"()) AND ("cp"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))) OR (("organization_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "conversations"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))))));



ALTER TABLE "public"."device_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discount_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "discount_codes_select_policy" ON "public"."discount_codes" FOR SELECT USING ((("active" = true) AND ("valid_until" > "now"())));



ALTER TABLE "public"."encrypted_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."encryption_keys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "encryption_keys_admin_delete" ON "public"."encryption_keys" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "encryption_keys_admin_insert" ON "public"."encryption_keys" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "encryption_keys_admin_select" ON "public"."encryption_keys" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "encryption_keys_admin_update" ON "public"."encryption_keys" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "encryption_keys_delete_owner_or_admin" ON "public"."encryption_keys" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) AND ("ur"."is_active" = true))))));



CREATE POLICY "encryption_keys_insert_owner_or_admin" ON "public"."encryption_keys" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) AND ("ur"."is_active" = true))))));



CREATE POLICY "encryption_keys_select_owner_or_admin" ON "public"."encryption_keys" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) AND ("ur"."is_active" = true))))));



CREATE POLICY "encryption_keys_update_owner_or_admin" ON "public"."encryption_keys" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) AND ("ur"."is_active" = true)))))) WITH CHECK ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) AND ("ur"."is_active" = true))))));



ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."frame_style_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gdpr_data_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guest_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hashtags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hue_bridges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hue_lights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hue_scenes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hue_syncs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interaction_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."layout_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_listings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "marketplace_listings_insert_policy" ON "public"."marketplace_listings" FOR INSERT WITH CHECK (("auth"."uid"() = "seller_id"));



CREATE POLICY "marketplace_listings_select_policy" ON "public"."marketplace_listings" FOR SELECT USING (true);



CREATE POLICY "marketplace_listings_update_policy" ON "public"."marketplace_listings" FOR UPDATE USING (("auth"."uid"() = "seller_id"));



ALTER TABLE "public"."message_reactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "message_reactions_delete" ON "public"."message_reactions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "message_reactions_insert" ON "public"."message_reactions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "message_reactions_select" ON "public"."message_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."conversation_participants" "cp" ON (("cp"."conversation_id" = "m"."conversation_id")))
  WHERE (("m"."id" = "message_reactions"."message_id") AND ("cp"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."message_read_receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_delete" ON "public"."messages" FOR DELETE USING (("sender_id" = "auth"."uid"()));



CREATE POLICY "messages_insert" ON "public"."messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "messages"."conversation_id") AND ("cp"."user_id" = "auth"."uid"()))))));



CREATE POLICY "messages_select" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "messages"."conversation_id") AND ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "messages_update" ON "public"."messages" FOR UPDATE USING (("sender_id" = "auth"."uid"()));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_select_policy" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_insert_policy" ON "public"."orders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "orders_select_policy" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "orders_update_policy" ON "public"."orders" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."organization_follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."page_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."places" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."presentations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_select_policy" ON "public"."products" FOR SELECT USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quick_searches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recovery_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scenes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."search_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shared_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shared_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."spaces" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_select_policy" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "subscriptions_update_policy" ON "public"."subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."sync_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transition_effects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trash_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."typing_indicators" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "typing_indicators_delete" ON "public"."typing_indicators" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "typing_indicators_insert" ON "public"."typing_indicators" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "typing_indicators_select" ON "public"."typing_indicators" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "typing_indicators"."conversation_id") AND ("cp"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_canvas_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_consents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_deletion_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_discount_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feeds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_chain" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."viewport_file_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."viewport_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."viewport_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."viewport_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."viewport_state_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."viewport_workspaces" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."widget_data" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "widget_data_delete" ON "public"."widget_data" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "widget_data_insert" ON "public"."widget_data" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "widget_data_select" ON "public"."widget_data" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "widget_data_update" ON "public"."widget_data" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "widget_replication_insert" ON "public"."widget_replication_status" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "widget_replication_select" ON "public"."widget_replication_status" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."widget_replication_status" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "widget_replication_update" ON "public"."widget_replication_status" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."widget_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "widget_settings_insert" ON "public"."widget_settings" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "widget_settings_select" ON "public"."widget_settings" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "widget_settings_update" ON "public"."widget_settings" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."widget_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "widget_snapshots_delete" ON "public"."widget_snapshots" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "widget_snapshots_insert" ON "public"."widget_snapshots" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "widget_snapshots_select" ON "public"."widget_snapshots" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."widget_sync_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "widget_sync_logs_insert" ON "public"."widget_sync_logs" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "widget_sync_logs_select" ON "public"."widget_sync_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "wishlist_delete_policy" ON "public"."wishlist_items" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "wishlist_insert_policy" ON "public"."wishlist_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."wishlist_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wishlist_select_policy" ON "public"."wishlist_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_search_history"("p_user_id" "uuid", "p_search_type" "text", "p_query" "text", "p_results_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_search_history"("p_user_id" "uuid", "p_search_type" "text", "p_query" "text", "p_results_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_search_history"("p_user_id" "uuid", "p_search_type" "text", "p_query" "text", "p_results_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_default_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_default_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_default_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_expire_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_expire_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_expire_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_order_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_order_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_order_total"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_manage_org"("check_user_id" "uuid", "check_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_manage_org"("check_user_id" "uuid", "check_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_manage_org"("check_user_id" "uuid", "check_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_permission"("user_id" "uuid", "action" "text", "resource" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_permission"("user_id" "uuid", "action" "text", "resource" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_permission"("user_id" "uuid", "action" "text", "resource" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_sessions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_trash"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_trash"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_trash"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_typing_indicators"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_typing_indicators"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_typing_indicators"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_interactions"("p_retention_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_interactions"("p_retention_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_interactions"("p_retention_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_snapshots"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_snapshots"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_snapshots"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_auto_snapshot"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_auto_snapshot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_auto_snapshot"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_referral_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_referral_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_referral_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_direct_conversation"("other_user_id" "uuid", "org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_direct_conversation"("other_user_id" "uuid", "org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_direct_conversation"("other_user_id" "uuid", "org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_group_conversation"("group_name" "text", "participant_ids" "uuid"[], "org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_group_conversation"("group_name" "text", "participant_ids" "uuid"[], "org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_group_conversation"("group_name" "text", "participant_ids" "uuid"[], "org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_new_ai_session"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_new_ai_session"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_new_ai_session"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."detect_suspicious_logins"() TO "anon";
GRANT ALL ON FUNCTION "public"."detect_suspicious_logins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_suspicious_logins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."duplicate_widget_data"("p_source_widget_id" "text", "p_user_id" "uuid", "p_new_widget_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."duplicate_widget_data"("p_source_widget_id" "text", "p_user_id" "uuid", "p_new_widget_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."duplicate_widget_data"("p_source_widget_id" "text", "p_user_id" "uuid", "p_new_widget_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_default_referral_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_default_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_default_referral_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_ai_conversation"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_ai_conversation"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_ai_conversation"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("target_user_id" "uuid", "org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("target_user_id" "uuid", "org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("target_user_id" "uuid", "org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_popular_presentations"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_popular_presentations"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_popular_presentations"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_popular_searches"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_popular_searches"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_popular_searches"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_presentation_full"("p_presentation_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_presentation_full"("p_presentation_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_presentation_full"("p_presentation_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_items"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_items"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_items"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_scenes"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_scenes"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_scenes"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_trash_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_trash_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trash_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_org_role"("check_user_id" "uuid", "check_org_id" "uuid", "required_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_org_role"("check_user_id" "uuid", "check_org_id" "uuid", "required_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_org_role"("check_user_id" "uuid", "check_org_id" "uuid", "required_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_quick_search_usage"("p_search_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_quick_search_usage"("p_search_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_quick_search_usage"("p_search_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_shared_folder_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_shared_folder_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_shared_folder_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_widget_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_widget_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_widget_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_global_admin"("check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_global_admin"("check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_global_admin"("check_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_sync_event"("p_widget_id" "text", "p_user_id" "uuid", "p_event_type" "text", "p_details" "jsonb", "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_sync_event"("p_widget_id" "text", "p_user_id" "uuid", "p_event_type" "text", "p_details" "jsonb", "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_sync_event"("p_widget_id" "text", "p_user_id" "uuid", "p_event_type" "text", "p_details" "jsonb", "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_user_activity_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_user_activity_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_user_activity_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ai_conversation_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ai_conversation_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ai_conversation_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_device_last_active"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_device_last_active"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_device_last_active"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_favorite_interaction"("p_favorite_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_favorite_interaction"("p_favorite_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_favorite_interaction"("p_favorite_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_follow_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_orders_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_orders_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_orders_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_organization_follow_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_organization_follow_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_organization_follow_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_organization_member_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_organization_member_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_organization_member_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_comment_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_comment_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_comment_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_like_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_like_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_like_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_favorites" TO "anon";
GRANT ALL ON TABLE "public"."ai_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_favorites" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON TABLE "public"."analyses" TO "anon";
GRANT ALL ON TABLE "public"."analyses" TO "authenticated";
GRANT ALL ON TABLE "public"."analyses" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_content_stats" TO "anon";
GRANT ALL ON TABLE "public"."analytics_content_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_content_stats" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_sessions" TO "anon";
GRANT ALL ON TABLE "public"."analytics_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON SEQUENCE "public"."api_keys_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."api_keys_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."api_keys_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."belonging_movements" TO "anon";
GRANT ALL ON TABLE "public"."belonging_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."belonging_movements" TO "service_role";



GRANT ALL ON TABLE "public"."belongings" TO "anon";
GRANT ALL ON TABLE "public"."belongings" TO "authenticated";
GRANT ALL ON TABLE "public"."belongings" TO "service_role";



GRANT ALL ON TABLE "public"."billing_history" TO "anon";
GRANT ALL ON TABLE "public"."billing_history" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_history" TO "service_role";



GRANT ALL ON TABLE "public"."broadcast_sessions" TO "anon";
GRANT ALL ON TABLE "public"."broadcast_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."broadcast_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."call_participants" TO "anon";
GRANT ALL ON TABLE "public"."call_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."call_participants" TO "service_role";



GRANT ALL ON TABLE "public"."calls" TO "anon";
GRANT ALL ON TABLE "public"."calls" TO "authenticated";
GRANT ALL ON TABLE "public"."calls" TO "service_role";



GRANT ALL ON TABLE "public"."canvas_items" TO "anon";
GRANT ALL ON TABLE "public"."canvas_items" TO "authenticated";
GRANT ALL ON TABLE "public"."canvas_items" TO "service_role";



GRANT ALL ON TABLE "public"."checkout_sessions" TO "anon";
GRANT ALL ON TABLE "public"."checkout_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."checkout_sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."checkout_sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."checkout_sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."checkout_sessions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."content_items" TO "anon";
GRANT ALL ON TABLE "public"."content_items" TO "authenticated";
GRANT ALL ON TABLE "public"."content_items" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."device_sessions" TO "anon";
GRANT ALL ON TABLE "public"."device_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."device_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."devices" TO "anon";
GRANT ALL ON TABLE "public"."devices" TO "authenticated";
GRANT ALL ON TABLE "public"."devices" TO "service_role";



GRANT ALL ON TABLE "public"."discount_codes" TO "anon";
GRANT ALL ON TABLE "public"."discount_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."discount_codes" TO "service_role";



GRANT ALL ON TABLE "public"."encrypted_messages" TO "anon";
GRANT ALL ON TABLE "public"."encrypted_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."encrypted_messages" TO "service_role";



GRANT ALL ON TABLE "public"."encryption_keys" TO "anon";
GRANT ALL ON TABLE "public"."encryption_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."encryption_keys" TO "service_role";



GRANT ALL ON SEQUENCE "public"."encryption_keys_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."encryption_keys_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."encryption_keys_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."frame_style_history" TO "anon";
GRANT ALL ON TABLE "public"."frame_style_history" TO "authenticated";
GRANT ALL ON TABLE "public"."frame_style_history" TO "service_role";



GRANT ALL ON TABLE "public"."gdpr_data_requests" TO "anon";
GRANT ALL ON TABLE "public"."gdpr_data_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."gdpr_data_requests" TO "service_role";



GRANT ALL ON TABLE "public"."guest_sessions" TO "anon";
GRANT ALL ON TABLE "public"."guest_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."guest_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."hashtags" TO "anon";
GRANT ALL ON TABLE "public"."hashtags" TO "authenticated";
GRANT ALL ON TABLE "public"."hashtags" TO "service_role";



GRANT ALL ON TABLE "public"."hue_bridges" TO "anon";
GRANT ALL ON TABLE "public"."hue_bridges" TO "authenticated";
GRANT ALL ON TABLE "public"."hue_bridges" TO "service_role";



GRANT ALL ON TABLE "public"."hue_lights" TO "anon";
GRANT ALL ON TABLE "public"."hue_lights" TO "authenticated";
GRANT ALL ON TABLE "public"."hue_lights" TO "service_role";



GRANT ALL ON TABLE "public"."hue_scenes" TO "anon";
GRANT ALL ON TABLE "public"."hue_scenes" TO "authenticated";
GRANT ALL ON TABLE "public"."hue_scenes" TO "service_role";



GRANT ALL ON TABLE "public"."hue_syncs" TO "anon";
GRANT ALL ON TABLE "public"."hue_syncs" TO "authenticated";
GRANT ALL ON TABLE "public"."hue_syncs" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_history" TO "anon";
GRANT ALL ON TABLE "public"."interaction_history" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_history" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_transactions" TO "anon";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."layout_states" TO "anon";
GRANT ALL ON TABLE "public"."layout_states" TO "authenticated";
GRANT ALL ON TABLE "public"."layout_states" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT ALL ON TABLE "public"."login_attempts" TO "anon";
GRANT ALL ON TABLE "public"."login_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."login_attempts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."login_attempts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."login_attempts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."login_attempts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."logs" TO "anon";
GRANT ALL ON TABLE "public"."logs" TO "authenticated";
GRANT ALL ON TABLE "public"."logs" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_listings" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_listings" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_analytics_view" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_analytics_view" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_analytics_view" TO "service_role";



GRANT ALL ON TABLE "public"."message_reactions" TO "anon";
GRANT ALL ON TABLE "public"."message_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."message_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."message_read_receipts" TO "anon";
GRANT ALL ON TABLE "public"."message_read_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."message_read_receipts" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."order_summary_view" TO "anon";
GRANT ALL ON TABLE "public"."order_summary_view" TO "authenticated";
GRANT ALL ON TABLE "public"."order_summary_view" TO "service_role";



GRANT ALL ON TABLE "public"."organization_follows" TO "anon";
GRANT ALL ON TABLE "public"."organization_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_follows" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organization_roles" TO "anon";
GRANT ALL ON TABLE "public"."organization_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_roles" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."page_views" TO "anon";
GRANT ALL ON TABLE "public"."page_views" TO "authenticated";
GRANT ALL ON TABLE "public"."page_views" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON SEQUENCE "public"."payment_methods_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."payment_methods_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."payment_methods_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."places" TO "anon";
GRANT ALL ON TABLE "public"."places" TO "authenticated";
GRANT ALL ON TABLE "public"."places" TO "service_role";



GRANT ALL ON TABLE "public"."post_comments" TO "anon";
GRANT ALL ON TABLE "public"."post_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."post_comments" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."presentations" TO "anon";
GRANT ALL ON TABLE "public"."presentations" TO "authenticated";
GRANT ALL ON TABLE "public"."presentations" TO "service_role";



GRANT ALL ON TABLE "public"."scenes" TO "anon";
GRANT ALL ON TABLE "public"."scenes" TO "authenticated";
GRANT ALL ON TABLE "public"."scenes" TO "service_role";



GRANT ALL ON TABLE "public"."presentation_stats" TO "anon";
GRANT ALL ON TABLE "public"."presentation_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."presentation_stats" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."quick_searches" TO "anon";
GRANT ALL ON TABLE "public"."quick_searches" TO "authenticated";
GRANT ALL ON TABLE "public"."quick_searches" TO "service_role";



GRANT ALL ON TABLE "public"."ratings" TO "anon";
GRANT ALL ON TABLE "public"."ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."ratings" TO "service_role";



GRANT ALL ON TABLE "public"."recovery_logs" TO "anon";
GRANT ALL ON TABLE "public"."recovery_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."recovery_logs" TO "service_role";



GRANT ALL ON TABLE "public"."referral_codes" TO "anon";
GRANT ALL ON TABLE "public"."referral_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_codes" TO "service_role";



GRANT ALL ON TABLE "public"."referral_rewards" TO "anon";
GRANT ALL ON TABLE "public"."referral_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."referral_settings" TO "anon";
GRANT ALL ON TABLE "public"."referral_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_settings" TO "service_role";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON TABLE "public"."search_history" TO "anon";
GRANT ALL ON TABLE "public"."search_history" TO "authenticated";
GRANT ALL ON TABLE "public"."search_history" TO "service_role";



GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."security_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."security_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."security_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shared_folders" TO "anon";
GRANT ALL ON TABLE "public"."shared_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."shared_folders" TO "service_role";



GRANT ALL ON TABLE "public"."shared_items" TO "anon";
GRANT ALL ON TABLE "public"."shared_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shared_items" TO "service_role";



GRANT ALL ON TABLE "public"."spaces" TO "anon";
GRANT ALL ON TABLE "public"."spaces" TO "authenticated";
GRANT ALL ON TABLE "public"."spaces" TO "service_role";



GRANT ALL ON TABLE "public"."stock_movements" TO "anon";
GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_customers" TO "anon";
GRANT ALL ON TABLE "public"."stripe_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_customers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stripe_customers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stripe_customers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stripe_customers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_analytics_view" TO "anon";
GRANT ALL ON TABLE "public"."subscription_analytics_view" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_analytics_view" TO "service_role";



GRANT ALL ON TABLE "public"."sync_events" TO "anon";
GRANT ALL ON TABLE "public"."sync_events" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_events" TO "service_role";



GRANT ALL ON TABLE "public"."transition_effects" TO "anon";
GRANT ALL ON TABLE "public"."transition_effects" TO "authenticated";
GRANT ALL ON TABLE "public"."transition_effects" TO "service_role";



GRANT ALL ON TABLE "public"."trash_items" TO "anon";
GRANT ALL ON TABLE "public"."trash_items" TO "authenticated";
GRANT ALL ON TABLE "public"."trash_items" TO "service_role";



GRANT ALL ON TABLE "public"."typing_indicators" TO "anon";
GRANT ALL ON TABLE "public"."typing_indicators" TO "authenticated";
GRANT ALL ON TABLE "public"."typing_indicators" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_stats" TO "service_role";



GRANT ALL ON TABLE "public"."user_canvas_data" TO "anon";
GRANT ALL ON TABLE "public"."user_canvas_data" TO "authenticated";
GRANT ALL ON TABLE "public"."user_canvas_data" TO "service_role";



GRANT ALL ON TABLE "public"."user_consents" TO "anon";
GRANT ALL ON TABLE "public"."user_consents" TO "authenticated";
GRANT ALL ON TABLE "public"."user_consents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_consents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_consents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_consents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_deletion_requests" TO "anon";
GRANT ALL ON TABLE "public"."user_deletion_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."user_deletion_requests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_deletion_requests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_deletion_requests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_deletion_requests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_discount_usage" TO "anon";
GRANT ALL ON TABLE "public"."user_discount_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."user_discount_usage" TO "service_role";



GRANT ALL ON TABLE "public"."user_feeds" TO "anon";
GRANT ALL ON TABLE "public"."user_feeds" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feeds" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_referrals" TO "anon";
GRANT ALL ON TABLE "public"."user_referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."user_referrals" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_sessions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."verification_chain" TO "anon";
GRANT ALL ON TABLE "public"."verification_chain" TO "authenticated";
GRANT ALL ON TABLE "public"."verification_chain" TO "service_role";



GRANT ALL ON TABLE "public"."viewport_file_versions" TO "anon";
GRANT ALL ON TABLE "public"."viewport_file_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."viewport_file_versions" TO "service_role";



GRANT ALL ON TABLE "public"."viewport_files" TO "anon";
GRANT ALL ON TABLE "public"."viewport_files" TO "authenticated";
GRANT ALL ON TABLE "public"."viewport_files" TO "service_role";



GRANT ALL ON TABLE "public"."viewport_sessions" TO "anon";
GRANT ALL ON TABLE "public"."viewport_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."viewport_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."viewport_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."viewport_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."viewport_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."viewport_state_events" TO "anon";
GRANT ALL ON TABLE "public"."viewport_state_events" TO "authenticated";
GRANT ALL ON TABLE "public"."viewport_state_events" TO "service_role";



GRANT ALL ON TABLE "public"."viewport_workspaces" TO "anon";
GRANT ALL ON TABLE "public"."viewport_workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."viewport_workspaces" TO "service_role";



GRANT ALL ON TABLE "public"."widget_data" TO "anon";
GRANT ALL ON TABLE "public"."widget_data" TO "authenticated";
GRANT ALL ON TABLE "public"."widget_data" TO "service_role";



GRANT ALL ON TABLE "public"."widget_replication_status" TO "anon";
GRANT ALL ON TABLE "public"."widget_replication_status" TO "authenticated";
GRANT ALL ON TABLE "public"."widget_replication_status" TO "service_role";



GRANT ALL ON TABLE "public"."widget_settings" TO "anon";
GRANT ALL ON TABLE "public"."widget_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."widget_settings" TO "service_role";



GRANT ALL ON TABLE "public"."widget_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."widget_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."widget_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."widget_sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."widget_sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."widget_sync_logs" TO "service_role";



GRANT ALL ON TABLE "public"."wishlist_items" TO "anon";
GRANT ALL ON TABLE "public"."wishlist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist_items" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







