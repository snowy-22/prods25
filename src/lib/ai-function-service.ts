/**
 * AI MCP Function Call Service
 * Secure AI function management with rate limiting
 */

import { createClient } from './supabase/client';

// Types
export interface AIFunction {
  id: string;
  function_name: string;
  function_description?: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  security_level: 'low' | 'medium' | 'high' | 'critical';
  requires_permission?: string;
  requires_role?: string[];
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  log_inputs: boolean;
  log_outputs: boolean;
  is_enabled: boolean;
  is_deprecated: boolean;
  deprecated_message?: string;
  version: string;
  created_at: string;
}

export interface AIFunctionCall {
  id: string;
  user_id: string;
  session_id?: string;
  conversation_id?: string;
  function_id?: string;
  function_name: string;
  input_params?: Record<string, any>;
  output_result?: Record<string, any>;
  error_message?: string;
  status: 'pending' | 'executing' | 'success' | 'error' | 'timeout' | 'blocked';
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  was_rate_limited: boolean;
  ai_provider?: string;
  ai_model?: string;
  created_at: string;
}

export interface FunctionCallResult {
  success: boolean;
  call_id?: string;
  error?: string;
  retry_after_seconds?: number;
}

// Load Available AI Functions
export async function loadAIFunctions(): Promise<AIFunction[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('ai_function_registry')
    .select('*')
    .eq('is_enabled', true)
    .order('function_name');
  
  if (error) {
    console.error('Failed to load AI functions:', error);
    return [];
  }
  
  return data || [];
}

// Check if user can call a function
export async function canCallFunction(
  userId: string,
  functionName: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('can_call_ai_function', {
      p_user_id: userId,
      p_function_name: functionName
    });
  
  if (error) {
    return { allowed: false, reason: error.message };
  }
  
  return { allowed: data === true };
}

// Log AI Function Call (with rate limit check)
export async function logFunctionCall(
  userId: string,
  functionName: string,
  inputParams: Record<string, any>,
  options: {
    sessionId?: string;
    conversationId?: string;
    aiProvider?: string;
    aiModel?: string;
  } = {}
): Promise<FunctionCallResult> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('log_ai_function_call', {
      p_user_id: userId,
      p_function_name: functionName,
      p_session_id: options.sessionId || null,
      p_input_params: inputParams,
      p_ai_provider: options.aiProvider || 'unknown',
      p_ai_model: options.aiModel || null
    });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return data as FunctionCallResult;
}

// Update Function Call Result
export async function updateFunctionCallResult(
  callId: string,
  result: {
    status: 'success' | 'error' | 'timeout';
    output?: Record<string, any>;
    errorMessage?: string;
    executionTimeMs?: number;
  }
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('ai_function_calls')
    .update({
      status: result.status,
      output_result: result.output,
      error_message: result.errorMessage,
      execution_time_ms: result.executionTimeMs,
      completed_at: new Date().toISOString()
    })
    .eq('id', callId);
  
  if (error) {
    console.error('Failed to update function call result:', error);
    return false;
  }
  
  return true;
}

// Load Function Call History
export async function loadFunctionCallHistory(
  userId: string,
  options: {
    limit?: number;
    functionName?: string;
    status?: string;
  } = {}
): Promise<AIFunctionCall[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('ai_function_calls')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(options.limit || 50);
  
  if (options.functionName) {
    query = query.eq('function_name', options.functionName);
  }
  
  if (options.status) {
    query = query.eq('status', options.status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to load function call history:', error);
    return [];
  }
  
  return data || [];
}

// Execute AI Function with Full Security
export async function executeAIFunction<TInput, TOutput>(
  userId: string,
  functionName: string,
  input: TInput,
  executor: (input: TInput) => Promise<TOutput>,
  options: {
    sessionId?: string;
    conversationId?: string;
    aiProvider?: string;
    aiModel?: string;
    timeout?: number;
  } = {}
): Promise<{ success: boolean; result?: TOutput; error?: string; callId?: string }> {
  // 1. Check permission
  const permission = await canCallFunction(userId, functionName);
  if (!permission.allowed) {
    return { success: false, error: permission.reason || 'Not authorized' };
  }
  
  // 2. Log the call (rate limit check happens here)
  const logResult = await logFunctionCall(userId, functionName, input as any, options);
  if (!logResult.success) {
    return { 
      success: false, 
      error: logResult.error || 'Rate limit exceeded',
      callId: logResult.call_id
    };
  }
  
  const callId = logResult.call_id!;
  const startTime = Date.now();
  
  try {
    // 3. Execute with timeout
    const timeoutMs = options.timeout || 30000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Function execution timeout')), timeoutMs);
    });
    
    const result = await Promise.race([
      executor(input),
      timeoutPromise
    ]);
    
    const executionTime = Date.now() - startTime;
    
    // 4. Update result
    await updateFunctionCallResult(callId, {
      status: 'success',
      output: result as any,
      executionTimeMs: executionTime
    });
    
    return { success: true, result, callId };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = errorMessage.includes('timeout');
    
    await updateFunctionCallResult(callId, {
      status: isTimeout ? 'timeout' : 'error',
      errorMessage,
      executionTimeMs: executionTime
    });
    
    return { success: false, error: errorMessage, callId };
  }
}

// MCP Tool Definition Helper
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      required?: boolean;
    }>;
    required?: string[];
  };
}

// Convert AI Function to MCP Tool Definition
export function toMCPTool(fn: AIFunction): MCPToolDefinition {
  return {
    name: fn.function_name,
    description: fn.function_description || '',
    inputSchema: {
      type: 'object',
      properties: fn.input_schema.properties || {},
      required: fn.input_schema.required || []
    }
  };
}

// Load MCP Tool Definitions
export async function loadMCPTools(): Promise<MCPToolDefinition[]> {
  const functions = await loadAIFunctions();
  return functions.map(toMCPTool);
}

// Security Validation
export function validateInput(
  schema: Record<string, any>,
  input: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = schema.required || [];
  const properties = schema.properties || {};
  
  // Check required fields
  for (const field of required) {
    if (!(field in input) || input[field] === undefined || input[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate field types
  for (const [key, value] of Object.entries(input)) {
    if (key in properties) {
      const prop = properties[key];
      const actualType = typeof value;
      
      if (prop.type === 'string' && actualType !== 'string') {
        errors.push(`Field ${key} must be a string`);
      } else if (prop.type === 'number' && actualType !== 'number') {
        errors.push(`Field ${key} must be a number`);
      } else if (prop.type === 'boolean' && actualType !== 'boolean') {
        errors.push(`Field ${key} must be a boolean`);
      } else if (prop.type === 'array' && !Array.isArray(value)) {
        errors.push(`Field ${key} must be an array`);
      }
      
      // Check enum
      if (prop.enum && !prop.enum.includes(value)) {
        errors.push(`Field ${key} must be one of: ${prop.enum.join(', ')}`);
      }
    }
  }
  
  // SQL Injection prevention
  for (const value of Object.values(input)) {
    if (typeof value === 'string') {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
        /(--)|(;)|(\/\*)/,
        /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i
      ];
      
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          errors.push('Potentially malicious input detected');
          break;
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// Export service
export const aiFunctionService = {
  loadFunctions: loadAIFunctions,
  canCall: canCallFunction,
  logCall: logFunctionCall,
  updateResult: updateFunctionCallResult,
  loadHistory: loadFunctionCallHistory,
  execute: executeAIFunction,
  toMCPTool,
  loadMCPTools,
  validateInput
};

export default aiFunctionService;
