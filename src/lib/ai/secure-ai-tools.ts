'use server';

/**
 * @fileoverview Secure AI Tool Wrapper
 * 
 * Provides a security layer for AI tool operations including:
 * - Permission checking before execution
 * - Operation recording with producer_type: 'ai'
 * - Audit logging for AI actions
 * - Rate limiting for AI operations
 */

import { z } from 'zod';
import { recordOperation, OperationType, ProducerType, SecurityLevel } from '@/lib/operation-service';
import { hasPermission, type UserRole } from '@/lib/security/rbac';
import { logAuditAction } from '@/lib/security/audit-logger';
import { createClient } from '@/lib/supabase/server';

// Permission type for AI operations
type AIPermission = 'content:create' | 'content:update' | 'content:delete' | 'content:read';

// Types
export interface SecureToolContext {
  userId: string;
  sessionId?: string;
  canvasId?: string;
  folderId?: string;
  conversationId?: string;
}

export interface SecureToolOptions {
  requiredPermission?: AIPermission;
  operationType?: OperationType;
  targetTable?: string;
  securityLevel?: SecurityLevel;
  skipRecording?: boolean;
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
}

export interface SecureToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  permissionDenied?: boolean;
  rateLimited?: boolean;
  operationId?: string;
}

// Rate limit tracking (in-memory, per-user)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for AI operations
 */
function checkRateLimit(
  userId: string, 
  toolName: string, 
  options: { maxCalls: number; windowMs: number }
): boolean {
  const key = `${userId}:${toolName}`;
  const now = Date.now();
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + options.windowMs });
    return true;
  }
  
  if (current.count >= options.maxCalls) {
    return false;
  }
  
  current.count++;
  return true;
}

/**
 * Wrap an AI tool with security checks and operation recording
 */
export async function executeSecureTool<TInput, TOutput>(
  toolName: string,
  input: TInput,
  executor: (input: TInput) => Promise<TOutput>,
  context: SecureToolContext,
  options: SecureToolOptions = {}
): Promise<SecureToolResult<TOutput>> {
  const {
    requiredPermission,
    operationType = 'update',
    targetTable = 'ai_operations',
    securityLevel = 'normal',
    skipRecording = false,
    rateLimit
  } = options;
  
  const startTime = Date.now();
  
  try {
    // 1. Check rate limit
    if (rateLimit) {
      const allowed = checkRateLimit(context.userId, toolName, rateLimit);
      if (!allowed) {
        // Log rate limit via console (audit log doesn't support custom actions)
        console.warn(`[AI Security] Rate limited: ${toolName} for user ${context.userId}`);
        
        return {
          success: false,
          error: 'Rate limit exceeded for AI operations',
          rateLimited: true
        };
      }
    }
    
    // 2. Check permissions if required
    if (requiredPermission) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          error: 'Authentication required',
          permissionDenied: true
        };
      }
      
      // Get user role from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const userRole = (profile?.role || 'user') as UserRole;
      
      // Map AI permission to RBAC format
      const [action, resource] = requiredPermission.split(':');
      if (!hasPermission(userRole, action, resource)) {
        await logAuditAction(context.userId, 'permission.denied', 'ai_tool', {
          resourceId: toolName,
          details: { 
            toolName, 
            requiredPermission,
            userRole 
          }
        });
        
        return {
          success: false,
          error: `Permission '${requiredPermission}' required for this AI operation`,
          permissionDenied: true
        };
      }
    }
    
    // 3. Execute the tool
    const result = await executor(input);
    
    const duration = Date.now() - startTime;
    
    // 4. Record operation if not skipped
    let operationId: string | undefined;
    
    if (!skipRecording) {
      const opResult = await recordOperation(
        context.userId,
        operationType,
        targetTable,
        toolName,
        null, // previousState - AI tools typically don't have previous state
        { 
          input, 
          output: result,
          duration 
        },
        {
          canvasId: context.canvasId,
          folderId: context.folderId,
          targetTitle: `AI Tool: ${toolName}`,
          producerType: 'ai' as ProducerType,
          producerId: context.sessionId || context.conversationId,
          producerContext: {
            source: 'ai-assistant',
            tool_name: toolName,
            request_id: context.sessionId,
            metadata: {
              conversation_id: context.conversationId,
              execution_time: duration
            }
          },
          securityLevel
        }
      );
      operationId = opResult?.id;
    }
    
    // 5. Log successful execution
    console.log(`[AI Security] Tool executed: ${toolName}, duration: ${duration}ms`);
    
    return {
      success: true,
      data: result,
      operationId
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error
    console.error(`[AI Security] Tool error: ${toolName}`, errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Create a secure wrapper for an AI tool definition
 * For use with Genkit ai.defineTool
 */
export function createSecureToolExecutor<TInput extends z.ZodType, TOutput extends z.ZodType>(
  toolName: string,
  inputSchema: TInput,
  outputSchema: TOutput,
  executor: (input: z.infer<TInput>) => Promise<z.infer<TOutput>>,
  options: SecureToolOptions & { getContext: () => SecureToolContext | null }
) {
  return async (input: z.infer<TInput>): Promise<z.infer<TOutput>> => {
    const context = options.getContext();
    
    if (!context) {
      console.warn(`No security context for AI tool: ${toolName}`);
      // Execute without security wrapper if no context
      return executor(input);
    }
    
    const result = await executeSecureTool(
      toolName,
      input,
      executor,
      context,
      options
    );
    
    if (!result.success) {
      throw new Error(result.error || 'AI tool execution failed');
    }
    
    return result.data!;
  };
}

// Pre-configured tool options for common AI operations
export const AI_TOOL_CONFIGS = {
  // Read-only tools (lower security)
  search: {
    operationType: 'read' as OperationType,
    securityLevel: 'low' as SecurityLevel,
    rateLimit: { maxCalls: 30, windowMs: 60000 }
  },
  
  // Content analysis
  analyze: {
    operationType: 'read' as OperationType,
    securityLevel: 'normal' as SecurityLevel,
    rateLimit: { maxCalls: 20, windowMs: 60000 }
  },
  
  // Content creation
  create: {
    operationType: 'create' as OperationType,
    securityLevel: 'normal' as SecurityLevel,
    requiredPermission: 'content:create' as AIPermission,
    rateLimit: { maxCalls: 10, windowMs: 60000 }
  },
  
  // Content modification
  modify: {
    operationType: 'update' as OperationType,
    securityLevel: 'elevated' as SecurityLevel,
    requiredPermission: 'content:update' as AIPermission,
    rateLimit: { maxCalls: 15, windowMs: 60000 }
  },
  
  // Content deletion
  delete: {
    operationType: 'delete' as OperationType,
    securityLevel: 'critical' as SecurityLevel,
    requiredPermission: 'content:delete' as AIPermission,
    rateLimit: { maxCalls: 5, windowMs: 60000 }
  },
  
  // Style changes
  style: {
    operationType: 'style_change' as OperationType,
    securityLevel: 'low' as SecurityLevel,
    rateLimit: { maxCalls: 30, windowMs: 60000 }
  }
};

/**
 * Track AI session context for operation correlation
 */
export class AISessionTracker {
  private sessionId: string;
  private userId: string;
  private conversationId?: string;
  private canvasId?: string;
  private folderId?: string;
  private toolCallCount = 0;
  
  constructor(userId: string, options?: {
    sessionId?: string;
    conversationId?: string;
    canvasId?: string;
    folderId?: string;
  }) {
    this.userId = userId;
    this.sessionId = options?.sessionId || crypto.randomUUID();
    this.conversationId = options?.conversationId;
    this.canvasId = options?.canvasId;
    this.folderId = options?.folderId;
  }
  
  getContext(): SecureToolContext {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      conversationId: this.conversationId,
      canvasId: this.canvasId,
      folderId: this.folderId
    };
  }
  
  incrementToolCall() {
    this.toolCallCount++;
  }
  
  getToolCallCount() {
    return this.toolCallCount;
  }
  
  setCanvasId(canvasId: string) {
    this.canvasId = canvasId;
  }
  
  setFolderId(folderId: string) {
    this.folderId = folderId;
  }
}

/**
 * Helper to wrap existing Genkit tools with security
 */
export function wrapGenkitTool<TInput, TOutput>(
  originalTool: {
    name: string;
    run: (input: TInput) => Promise<TOutput>;
  },
  getContext: () => SecureToolContext | null,
  config?: SecureToolOptions
) {
  const wrappedRun = async (input: TInput): Promise<TOutput> => {
    const context = getContext();
    
    if (!context) {
      return originalTool.run(input);
    }
    
    const result = await executeSecureTool(
      originalTool.name,
      input,
      originalTool.run,
      context,
      config
    );
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.data!;
  };
  
  return {
    ...originalTool,
    run: wrappedRun
  };
}
