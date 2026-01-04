-- AI Usage Logs Table
-- Tüm AI kullanımlarını, tool çağrılarını ve sonuçlarını loglar

-- AI kullanım logları tablosu
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  flow_type TEXT NOT NULL CHECK (flow_type IN ('assistant', 'analyze-item', 'analyze-content', 'suggest-styles', 'youtube-search', 'web-scraper')),
  prompt TEXT,
  conversation_id TEXT,
  request_params JSONB,
  tool_calls JSONB DEFAULT '[]'::jsonb,
  response TEXT,
  tokens_used INTEGER,
  model_name TEXT DEFAULT 'gemini-1.5-flash',
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'error')),
  error_message TEXT,
  started_at BIGINT NOT NULL,
  completed_at BIGINT,
  duration_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_flow_type ON ai_usage_logs(flow_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_status ON ai_usage_logs(status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_started_at ON ai_usage_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_conversation_id ON ai_usage_logs(conversation_id) WHERE conversation_id IS NOT NULL;

-- Updated_at otomatik güncellemesi için trigger
CREATE OR REPLACE FUNCTION update_ai_usage_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_usage_logs_updated_at
  BEFORE UPDATE ON ai_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_usage_logs_updated_at();

-- Row Level Security (RLS) - Kullanıcılar sadece kendi loglarını görebilir
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi loglarını görebilir
CREATE POLICY ai_usage_logs_select_policy ON ai_usage_logs
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Kullanıcılar kendi loglarını ekleyebilir (server-side insert için)
CREATE POLICY ai_usage_logs_insert_policy ON ai_usage_logs
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Kullanıcılar kendi loglarını güncelleyebilir (status update için)
CREATE POLICY ai_usage_logs_update_policy ON ai_usage_logs
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Adminler tüm logları görebilir (opsiyonel)
CREATE POLICY ai_usage_logs_admin_policy ON ai_usage_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'super_admin')
    )
  );

-- AI kullanım istatistikleri için view (performans optimizasyonu)
CREATE OR REPLACE VIEW ai_usage_stats AS
SELECT
  user_id,
  DATE_TRUNC('day', TO_TIMESTAMP(started_at / 1000)) as date,
  flow_type,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'success') as successful_requests,
  COUNT(*) FILTER (WHERE status = 'error') as failed_requests,
  SUM(tokens_used) as total_tokens,
  AVG(duration_ms) as avg_duration_ms,
  AVG(tokens_used) as avg_tokens_per_request,
  jsonb_agg(DISTINCT tool_calls) FILTER (WHERE tool_calls IS NOT NULL) as all_tool_calls
FROM ai_usage_logs
GROUP BY user_id, DATE_TRUNC('day', TO_TIMESTAMP(started_at / 1000)), flow_type;

-- Kullanıcının AI quota'sını kontrol etmek için function
CREATE OR REPLACE FUNCTION check_ai_quota(
  p_user_id TEXT,
  p_period_hours INTEGER DEFAULT 24,
  p_max_requests INTEGER DEFAULT 100
)
RETURNS JSONB AS $$
DECLARE
  v_request_count INTEGER;
  v_result JSONB;
BEGIN
  -- Son X saatteki istek sayısını say
  SELECT COUNT(*)
  INTO v_request_count
  FROM ai_usage_logs
  WHERE user_id = p_user_id
    AND started_at >= EXTRACT(EPOCH FROM (NOW() - (p_period_hours || ' hours')::INTERVAL)) * 1000;
  
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'period_hours', p_period_hours,
    'max_requests', p_max_requests,
    'current_requests', v_request_count,
    'remaining_requests', p_max_requests - v_request_count,
    'quota_exceeded', v_request_count >= p_max_requests,
    'reset_at', TO_TIMESTAMP(EXTRACT(EPOCH FROM (NOW() + (p_period_hours || ' hours')::INTERVAL)))
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- En çok kullanılan tool'ları getiren function
CREATE OR REPLACE FUNCTION get_top_tools(
  p_user_id TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  tool_name TEXT,
  usage_count BIGINT,
  avg_duration_ms NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH tool_stats AS (
    SELECT
      jsonb_array_elements(tool_calls) ->> 'tool_name' as tool,
      (jsonb_array_elements(tool_calls) ->> 'duration_ms')::INTEGER as duration,
      CASE
        WHEN jsonb_array_elements(tool_calls) ->> 'error' IS NULL THEN 1
        ELSE 0
      END as is_success
    FROM ai_usage_logs
    WHERE user_id = p_user_id
      AND tool_calls IS NOT NULL
      AND jsonb_array_length(tool_calls) > 0
  )
  SELECT
    tool::TEXT,
    COUNT(*)::BIGINT as usage_count,
    AVG(duration)::NUMERIC as avg_duration_ms,
    (SUM(is_success)::NUMERIC / COUNT(*)::NUMERIC * 100) as success_rate
  FROM tool_stats
  GROUP BY tool
  ORDER BY usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının AI maliyet tahminini hesaplayan function (Gemini fiyatlandırması)
CREATE OR REPLACE FUNCTION calculate_ai_cost(
  p_user_id TEXT,
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  v_total_tokens BIGINT;
  v_cost_usd NUMERIC;
  v_result JSONB;
BEGIN
  -- Gemini 1.5 Flash fiyatı: $0.075 per 1M input tokens, $0.30 per 1M output tokens
  -- Basitlik için ortalama $0.15 per 1M token kullanalım
  
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO v_total_tokens
  FROM ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at BETWEEN p_start_date AND p_end_date
    AND tokens_used IS NOT NULL;
  
  v_cost_usd := (v_total_tokens::NUMERIC / 1000000) * 0.15;
  
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'period_start', p_start_date,
    'period_end', p_end_date,
    'total_tokens', v_total_tokens,
    'estimated_cost_usd', ROUND(v_cost_usd, 4),
    'estimated_cost_try', ROUND(v_cost_usd * 34, 2) -- $1 ≈ ₺34
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Örnek kullanım:
-- SELECT check_ai_quota('user-123', 24, 100);
-- SELECT * FROM get_top_tools('user-123', 5);
-- SELECT calculate_ai_cost('user-123');
