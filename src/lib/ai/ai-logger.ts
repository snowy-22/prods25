/**
 * AI Usage Logging System
 * 
 * Tüm AI kullanımlarını, tool çağrılarını ve sonuçlarını loglar.
 * Güvenlik, maliyet takibi ve debugging için kullanılır.
 * 
 * ÖRNEK KULLANIM:
 * 
 * ```typescript
 * // AI isteği başlatma
 * const logId = await logAIRequest(userId, 'assistant', { 
 *   prompt: 'YouTube'da React dersleri bul',
 *   conversationId: 'conv-123'
 * });
 * 
 * // Tool kullanımı loglama
 * await logToolCall(logId, 'youtubeSearch', { 
 *   query: 'React tutorials' 
 * });
 * 
 * // Başarılı sonuç
 * await updateAIRequestStatus(logId, 'success', {
 *   response: '3 video buldum',
 *   tokensUsed: 450
 * });
 * ```
 */

import { createClient } from '@/lib/supabase/client';

export type AIFlowType = 
  | 'assistant'           // Genel AI asistan
  | 'analyze-item'        // Ürün analizi
  | 'analyze-content'     // İçerik analizi
  | 'suggest-styles'      // Stil önerileri
  | 'youtube-search'      // YouTube arama
  | 'web-scraper';        // Web scraping

export type AIToolName =
  | 'youtubeSearch'       // YouTube videoları ara
  | 'pageScraper'         // Web sayfası içeriğini çek
  | 'highlightElement'    // UI elementini vurgula
  | 'addPlayerTool'       // Canvas'a player ekle
  | 'fetchYoutubeMeta'    // YouTube metadata çek
  | 'analyzeItem'         // Ürün/görsel analizi
  | 'analyzeContent'      // İçerik koleksiyonu analizi
  | 'suggestFrameStyles'; // Frame stilleri öner

export interface AIRequestLog {
  id: string;
  user_id: string;
  flow_type: AIFlowType;
  prompt?: string;
  conversation_id?: string;
  request_params?: Record<string, any>;
  tool_calls?: AIToolCallLog[];
  response?: string;
  tokens_used?: number;
  model_name?: string;
  status: 'pending' | 'success' | 'error';
  error_message?: string;
  started_at: number;
  completed_at?: number;
  duration_ms?: number;
  ip_address?: string;
  user_agent?: string;
}

export interface AIToolCallLog {
  tool_name: AIToolName;
  input: Record<string, any>;
  output?: any;
  error?: string;
  duration_ms?: number;
  timestamp: number;
}

/**
 * AI isteği başlatıldığında çağrılır
 * Unique ID döner, sonraki loglamalar için kullanılır
 */
export async function logAIRequest(
  userId: string,
  flowType: AIFlowType,
  options?: {
    prompt?: string;
    conversationId?: string;
    requestParams?: Record<string, any>;
    modelName?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<string> {
  try {
    const supabase = createClient();
    const logId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const log: AIRequestLog = {
      id: logId,
      user_id: userId,
      flow_type: flowType,
      prompt: options?.prompt,
      conversation_id: options?.conversationId,
      request_params: options?.requestParams,
      model_name: options?.modelName || 'gemini-1.5-flash',
      status: 'pending',
      started_at: Date.now(),
      ip_address: options?.ipAddress || (typeof window === 'undefined' ? 'server' : 'client'),
      user_agent: options?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      tool_calls: [],
    };

    // Database'e kaydet
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert([log]);

    if (error) {
      console.error('Failed to log AI request:', error);
    }

    // Ayrıca console'a da yazdır (development için)
    console.log('🤖 AI Request Started:', {
      id: logId,
      flowType,
      prompt: options?.prompt?.substring(0, 50) + '...',
      userId,
    });

    return logId;
  } catch (error) {
    console.error('AI request logging error:', error);
    return 'error-' + Date.now();
  }
}

/**
 * AI tool çağrıldığında loglama
 * Tool'un ne yaptığını, hangi parametrelerle çağrıldığını kaydeder
 */
export async function logToolCall(
  requestId: string,
  toolName: AIToolName,
  input: Record<string, any>,
  output?: any,
  error?: string,
  durationMs?: number
): Promise<void> {
  try {
    const supabase = createClient();

    const toolLog: AIToolCallLog = {
      tool_name: toolName,
      input,
      output,
      error,
      duration_ms: durationMs,
      timestamp: Date.now(),
    };

    // Mevcut log'u güncelle - tool_calls array'ine ekle
    const { data: existingLog } = await supabase
      .from('ai_usage_logs')
      .select('tool_calls')
      .eq('id', requestId)
      .single();

    const existingCalls = (existingLog?.tool_calls as AIToolCallLog[]) || [];
    
    const { error: updateError } = await supabase
      .from('ai_usage_logs')
      .update({
        tool_calls: [...existingCalls, toolLog],
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Failed to log tool call:', updateError);
    }

    // Console log
    console.log(`🔧 AI Tool Called [${requestId}]:`, {
      tool: toolName,
      input: JSON.stringify(input).substring(0, 100) + '...',
      hasOutput: !!output,
      hasError: !!error,
      duration: durationMs ? `${durationMs}ms` : undefined,
    });
  } catch (error) {
    console.error('Tool call logging error:', error);
  }
}

/**
 * AI isteği tamamlandığında status güncelleme
 */
export async function updateAIRequestStatus(
  requestId: string,
  status: 'success' | 'error',
  options?: {
    response?: string;
    tokensUsed?: number;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    const supabase = createClient();
    const completedAt = Date.now();

    // Başlangıç zamanını al
    const { data: existingLog } = await supabase
      .from('ai_usage_logs')
      .select('started_at')
      .eq('id', requestId)
      .single();

    const durationMs = existingLog ? completedAt - existingLog.started_at : undefined;

    const updates = {
      status,
      response: options?.response,
      tokens_used: options?.tokensUsed,
      error_message: options?.errorMessage,
      completed_at: completedAt,
      duration_ms: durationMs,
    };

    const { error } = await supabase
      .from('ai_usage_logs')
      .update(updates)
      .eq('id', requestId);

    if (error) {
      console.error('Failed to update AI request status:', error);
    }

    // Console log
    console.log(`${status === 'success' ? '✅' : '❌'} AI Request ${status} [${requestId}]:`, {
      duration: durationMs ? `${durationMs}ms` : undefined,
      tokens: options?.tokensUsed,
      error: options?.errorMessage,
    });
  } catch (error) {
    console.error('AI status update error:', error);
  }
}

/**
 * Kullanıcının AI kullanım istatistiklerini getir
 */
export async function getUserAIStats(
  userId: string,
  options?: {
    startDate?: number;
    endDate?: number;
  }
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  avgDuration: number;
  topTools: Array<{ tool: AIToolName; count: number }>;
  topFlows: Array<{ flow: AIFlowType; count: number }>;
}> {
  try {
    const supabase = createClient();

    let query = supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', userId);

    if (options?.startDate) {
      query = query.gte('started_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('started_at', options.endDate);
    }

    const { data: logs } = await query;

    if (!logs || logs.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokensUsed: 0,
        avgDuration: 0,
        topTools: [],
        topFlows: [],
      };
    }

    const totalRequests = logs.length;
    const successfulRequests = logs.filter(l => l.status === 'success').length;
    const failedRequests = logs.filter(l => l.status === 'error').length;
    const totalTokensUsed = logs.reduce((sum, l) => sum + (l.tokens_used || 0), 0);
    const avgDuration = logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / totalRequests;

    // Tool kullanım sayıları
    const toolCounts: Record<string, number> = {};
    logs.forEach(log => {
      (log.tool_calls as AIToolCallLog[] || []).forEach(tc => {
        toolCounts[tc.tool_name] = (toolCounts[tc.tool_name] || 0) + 1;
      });
    });

    const topTools = Object.entries(toolCounts)
      .map(([tool, count]) => ({ tool: tool as AIToolName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Flow kullanım sayıları
    const flowCounts: Record<string, number> = {};
    logs.forEach(log => {
      flowCounts[log.flow_type] = (flowCounts[log.flow_type] || 0) + 1;
    });

    const topFlows = Object.entries(flowCounts)
      .map(([flow, count]) => ({ flow: flow as AIFlowType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalTokensUsed,
      avgDuration,
      topTools,
      topFlows,
    };
  } catch (error) {
    console.error('Failed to get AI stats:', error);
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      avgDuration: 0,
      topTools: [],
      topFlows: [],
    };
  }
}

/**
 * AI kullanım loglarını getir (admin/debug için)
 */
export async function getAILogs(
  userId: string,
  options?: {
    flowType?: AIFlowType;
    status?: 'pending' | 'success' | 'error';
    limit?: number;
    offset?: number;
  }
): Promise<AIRequestLog[]> {
  try {
    const supabase = createClient();

    let query = supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (options?.flowType) {
      query = query.eq('flow_type', options.flowType);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get AI logs:', error);
      return [];
    }

    return data as AIRequestLog[];
  } catch (error) {
    console.error('Failed to get AI logs:', error);
    return [];
  }
}
