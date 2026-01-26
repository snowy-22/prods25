/**
 * Operation History Service
 * Google Docs-level undo/redo system with live updates
 * Enhanced with producer tracking and admin capabilities
 */

import { createClient } from './supabase/client';
import { ContentItem } from './initial-content';

// Types
export interface Operation {
  id: string;
  user_id: string;
  session_id: string;
  device_id?: string;
  canvas_id: string;
  folder_id?: string;
  operation_type: OperationType;
  target_table: string;
  target_id: string;
  target_title?: string;
  previous_state: any;
  next_state: any;
  changes_diff?: any;
  affected_fields?: string[];
  batch_id?: string;
  batch_sequence?: number;
  is_undone: boolean;
  undone_at?: string;
  sync_status: 'pending' | 'synced' | 'conflict' | 'resolved';
  // Producer tracking
  producer_type?: ProducerType;
  producer_id?: string;
  producer_context?: ProducerContext;
  permission_used?: string;
  security_level?: SecurityLevel;
  created_at: string;
}

export type OperationType = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'move' 
  | 'resize' 
  | 'reorder'
  | 'style_change' 
  | 'batch_update' 
  | 'undo' 
  | 'redo' 
  | 'restore';

export type ProducerType = 
  | 'user'       // Direct user action
  | 'admin'      // Admin action on behalf of user
  | 'system'     // Automated system action
  | 'ai'         // AI assistant action
  | 'api'        // External API call
  | 'migration'  // Data migration
  | 'sync'       // Cross-device sync
  | 'scheduler'  // Scheduled task
  | 'trigger';   // Database trigger

export type SecurityLevel = 'low' | 'normal' | 'elevated' | 'critical';

export interface ProducerContext {
  source?: string;           // 'canvas', 'ai-assistant', 'admin-panel', 'api-endpoint'
  tool_name?: string;        // For AI: the tool that was used
  function_name?: string;    // For API: the function called
  request_id?: string;       // For tracking across services
  parent_operation_id?: string; // For chained operations
  metadata?: Record<string, any>;
}

export interface UndoRedoResult {
  success: boolean;
  target_table?: string;
  target_id?: string;
  restore_state?: any;
  operation_type?: OperationType;
  error?: string;
}

export interface GroupOperation {
  id: string;
  group_id: string;
  group_type: string;
  group_name?: string;
  operation_id: string;
  actor_user_id: string;
  actor_name?: string;
  actor_avatar_url?: string;
  operation_summary: string;
  operation_icon: string;
  is_visible: boolean;
  privacy_level: 'public' | 'group' | 'admin' | 'private';
  reaction_counts: Record<string, number>;
  comment_count: number;
  created_at: string;
}

export interface AdminOperationTracking {
  id: string;
  operation_id: string;
  user_id: string;
  user_email?: string;
  user_display_name?: string;
  user_subscription_tier?: string;
  operation_category: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  affected_users_count: number;
  data_size_bytes?: number;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  flagged: boolean;
  flag_reason?: string;
  created_at: string;
}

// Session Management
let currentSessionId: string | null = null;
let deviceId: string | null = null;

export function getSessionId(): string {
  if (!currentSessionId) {
    currentSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('operation_session_id', currentSessionId);
    }
  }
  return currentSessionId;
}

export function getDeviceId(): string {
  if (!deviceId) {
    if (typeof window !== 'undefined') {
      deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('device_id', deviceId);
      }
    } else {
      deviceId = `server-${Date.now()}`;
    }
  }
  return deviceId;
}

// Undo/Redo Stack Management
const undoStack: Operation[] = [];
const redoStack: Operation[] = [];
const MAX_STACK_SIZE = 100;

export function getUndoStack(): Operation[] {
  return [...undoStack];
}

export function getRedoStack(): Operation[] {
  return [...redoStack];
}

export function canUndo(): boolean {
  return undoStack.length > 0;
}

export function canRedo(): boolean {
  return redoStack.length > 0;
}

// Main Operation Recording
export async function recordOperation(
  userId: string,
  operationType: OperationType,
  targetTable: string,
  targetId: string,
  previousState: any,
  nextState: any,
  options: {
    targetTitle?: string;
    canvasId?: string;
    folderId?: string;
    batchId?: string;
    // Producer tracking options
    producerType?: ProducerType;
    producerId?: string;
    producerContext?: ProducerContext;
    permissionUsed?: string;
    securityLevel?: SecurityLevel;
    // Achievement tracking
    checkAchievements?: boolean;
  } = {}
): Promise<Operation | null> {
  const supabase = createClient();
  
  const sessionId = getSessionId();
  const deviceIdValue = getDeviceId();
  
  // Calculate changes diff
  const changesDiff: Record<string, any> = {};
  const affectedFields: string[] = [];
  
  if (previousState && nextState) {
    Object.keys(nextState).forEach(key => {
      if (JSON.stringify(previousState[key]) !== JSON.stringify(nextState[key])) {
        changesDiff[key] = nextState[key];
        affectedFields.push(key);
      }
    });
  }
  
  // Determine security level based on operation
  const securityLevel = options.securityLevel || determineSecurityLevel(operationType, targetTable);
  
  const operation: Partial<Operation> = {
    user_id: userId,
    session_id: sessionId,
    device_id: deviceIdValue,
    canvas_id: options.canvasId || 'default',
    folder_id: options.folderId,
    operation_type: operationType,
    target_table: targetTable,
    target_id: targetId,
    target_title: options.targetTitle,
    previous_state: previousState,
    next_state: nextState,
    changes_diff: Object.keys(changesDiff).length > 0 ? changesDiff : undefined,
    affected_fields: affectedFields.length > 0 ? affectedFields : undefined,
    batch_id: options.batchId,
    is_undone: false,
    sync_status: 'pending',
    // Producer tracking
    producer_type: options.producerType || 'user',
    producer_id: options.producerId,
    producer_context: options.producerContext,
    permission_used: options.permissionUsed,
    security_level: securityLevel
  };
  
  const { data, error } = await supabase
    .from('operation_history')
    .insert(operation)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to record operation:', error);
    return null;
  }
  
  // Add to local undo stack
  undoStack.push(data);
  if (undoStack.length > MAX_STACK_SIZE) {
    undoStack.shift();
  }
  
  // Clear redo stack on new operation
  redoStack.length = 0;
  
  // Trigger achievement check asynchronously (don't wait)
  if (options.checkAchievements !== false) {
    import('./achievement-tracker').then(({ checkAchievementsAfterOperation }) => {
      checkAchievementsAfterOperation(userId, operationType, targetTable).catch(console.error);
    }).catch(() => {
      // Silently fail if achievement tracker is not available
    });
  }
  
  return data;
}

// Determine security level based on operation type
function determineSecurityLevel(operationType: OperationType, targetTable: string): SecurityLevel {
  // Critical operations
  if (operationType === 'delete' && targetTable === 'folders') return 'critical';
  if (targetTable === 'user_roles' || targetTable === 'permissions') return 'critical';
  
  // Elevated operations
  if (operationType === 'delete') return 'elevated';
  if (operationType === 'batch_update') return 'elevated';
  if (targetTable === 'user_settings') return 'elevated';
  
  // Normal operations
  if (operationType === 'create' || operationType === 'update') return 'normal';
  
  return 'low';
}

// Batch Operations
let currentBatchId: string | null = null;

export function startBatch(): string {
  currentBatchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return currentBatchId;
}

export function endBatch(): void {
  currentBatchId = null;
}

export function getCurrentBatchId(): string | null {
  return currentBatchId;
}

// Undo Operation
export async function undoLastOperation(userId: string): Promise<UndoRedoResult> {
  const supabase = createClient();
  
  const lastOperation = undoStack.pop();
  if (!lastOperation) {
    return { success: false, error: 'Nothing to undo' };
  }
  
  const { data, error } = await supabase
    .rpc('undo_operation', {
      p_operation_id: lastOperation.id,
      p_user_id: userId
    });
  
  if (error) {
    // Put back on stack if failed
    undoStack.push(lastOperation);
    return { success: false, error: error.message };
  }
  
  // Add to redo stack
  redoStack.push(lastOperation);
  if (redoStack.length > MAX_STACK_SIZE) {
    redoStack.shift();
  }
  
  return data as UndoRedoResult;
}

// Redo Operation
export async function redoLastOperation(userId: string): Promise<UndoRedoResult> {
  const supabase = createClient();
  
  const lastRedo = redoStack.pop();
  if (!lastRedo) {
    return { success: false, error: 'Nothing to redo' };
  }
  
  const { data, error } = await supabase
    .rpc('redo_operation', {
      p_operation_id: lastRedo.id,
      p_user_id: userId
    });
  
  if (error) {
    // Put back on stack if failed
    redoStack.push(lastRedo);
    return { success: false, error: error.message };
  }
  
  // Add back to undo stack
  undoStack.push(lastRedo);
  
  return data as UndoRedoResult;
}

// Load Operation History
export async function loadOperationHistory(
  userId: string,
  options: {
    sessionId?: string;
    canvasId?: string;
    limit?: number;
    includeUndone?: boolean;
  } = {}
): Promise<Operation[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('operation_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(options.limit || 50);
  
  if (options.sessionId) {
    query = query.eq('session_id', options.sessionId);
  }
  
  if (options.canvasId) {
    query = query.eq('canvas_id', options.canvasId);
  }
  
  if (!options.includeUndone) {
    query = query.eq('is_undone', false);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to load operation history:', error);
    return [];
  }
  
  return data || [];
}

// Load Group Operation History
export async function loadGroupOperationHistory(
  groupId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<GroupOperation[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('group_operation_history')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
  
  if (error) {
    console.error('Failed to load group operation history:', error);
    return [];
  }
  
  return data || [];
}

// Subscribe to Real-time Operations
export function subscribeToOperations(
  userId: string,
  onOperation: (operation: Operation) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`operations-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'operation_history',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onOperation(payload.new as Operation);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to Group Operations
export function subscribeToGroupOperations(
  groupId: string,
  onOperation: (operation: GroupOperation) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`group-ops-${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_operation_history',
        filter: `group_id=eq.${groupId}`
      },
      (payload) => {
        onOperation(payload.new as GroupOperation);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// Convenience wrappers for common operations
export const operationService = {
  // Canvas item operations
  async createItem(userId: string, item: ContentItem, folderId?: string) {
    return recordOperation(
      userId,
      'create',
      'canvas_items',
      item.id,
      null,
      item,
      { targetTitle: item.title, folderId }
    );
  },
  
  async updateItem(userId: string, itemId: string, previousState: Partial<ContentItem>, nextState: Partial<ContentItem>, title?: string) {
    return recordOperation(
      userId,
      'update',
      'canvas_items',
      itemId,
      previousState,
      nextState,
      { targetTitle: title }
    );
  },
  
  async deleteItem(userId: string, item: ContentItem) {
    return recordOperation(
      userId,
      'delete',
      'canvas_items',
      item.id,
      item,
      null,
      { targetTitle: item.title }
    );
  },
  
  async moveItem(userId: string, itemId: string, from: { x: number; y: number }, to: { x: number; y: number }, title?: string) {
    return recordOperation(
      userId,
      'move',
      'canvas_items',
      itemId,
      { x: from.x, y: from.y },
      { x: to.x, y: to.y },
      { targetTitle: title }
    );
  },
  
  async resizeItem(userId: string, itemId: string, from: { width: number; height: number }, to: { width: number; height: number }, title?: string) {
    return recordOperation(
      userId,
      'resize',
      'canvas_items',
      itemId,
      { width: from.width, height: from.height },
      { width: to.width, height: to.height },
      { targetTitle: title }
    );
  },
  
  async styleChange(userId: string, itemId: string, previousStyles: any, newStyles: any, title?: string) {
    return recordOperation(
      userId,
      'style_change',
      'canvas_items',
      itemId,
      previousStyles,
      newStyles,
      { targetTitle: title }
    );
  },
  
  // Undo/Redo
  undo: undoLastOperation,
  redo: redoLastOperation,
  
  // Stack info
  canUndo,
  canRedo,
  getUndoStack,
  getRedoStack,
  
  // History
  loadHistory: loadOperationHistory,
  loadGroupHistory: loadGroupOperationHistory,
  
  // Subscriptions
  subscribe: subscribeToOperations,
  subscribeToGroup: subscribeToGroupOperations,
  
  // Batch operations
  startBatch,
  endBatch,
  getCurrentBatchId,
  
  // Admin functions
  loadAdminOperations: loadAdminOperationTracking,
  subscribeToAdminOperations: subscribeToAdminOperations,
  flagOperation: flagOperationForReview,
  reviewOperation: reviewAdminOperation,
  
  // Permission functions
  checkPermission: checkUserPermission,
  getUserPermissions: getUserPermissionsSummary,
  assignRole: assignUserRole,
  revokeRole: revokeUserRole
};

// =====================================================
// ADMIN OPERATION TRACKING
// =====================================================

export async function loadAdminOperationTracking(
  options: {
    limit?: number;
    offset?: number;
    category?: string;
    impactLevel?: string;
    flaggedOnly?: boolean;
    userId?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<AdminOperationTracking[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('admin_operation_tracking')
    .select('*')
    .order('created_at', { ascending: false })
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);
  
  if (options.category) {
    query = query.eq('operation_category', options.category);
  }
  
  if (options.impactLevel) {
    query = query.eq('impact_level', options.impactLevel);
  }
  
  if (options.flaggedOnly) {
    query = query.eq('flagged', true);
  }
  
  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }
  
  if (options.startDate) {
    query = query.gte('created_at', options.startDate);
  }
  
  if (options.endDate) {
    query = query.lte('created_at', options.endDate);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to load admin operations:', error);
    return [];
  }
  
  return data || [];
}

export function subscribeToAdminOperations(
  onOperation: (operation: AdminOperationTracking) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel('admin-operations')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_operation_tracking'
      },
      (payload) => {
        onOperation(payload.new as AdminOperationTracking);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function flagOperationForReview(
  operationId: string,
  reason: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('admin_operation_tracking')
    .update({
      flagged: true,
      flag_reason: reason
    })
    .eq('operation_id', operationId);
  
  if (error) {
    console.error('Failed to flag operation:', error);
    return false;
  }
  
  return true;
}

export async function reviewAdminOperation(
  operationId: string,
  reviewerId: string,
  notes: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('admin_operation_tracking')
    .update({
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes
    })
    .eq('operation_id', operationId);
  
  if (error) {
    console.error('Failed to review operation:', error);
    return false;
  }
  
  return true;
}

// =====================================================
// PERMISSION SYSTEM
// =====================================================

export interface PermissionCheckResult {
  allowed: boolean;
  permission: string;
  source: string;
  scope_type: string;
  scope_id: string | null;
  checked_at: string;
}

export interface UserPermissionsSummary {
  user_id: string;
  roles: Array<{
    role_key: string;
    role_name: string;
    priority: number;
    is_admin: boolean;
    scope_type: string;
    scope_id: string | null;
    expires_at: string | null;
  }>;
  permissions: string[];
  overrides: Array<{
    permission: string;
    granted: boolean;
    scope_type: string;
    scope_id: string | null;
    expires_at: string | null;
  }>;
}

export async function checkUserPermission(
  userId: string,
  permissionKey: string,
  scopeType: string = 'global',
  scopeId: string | null = null
): Promise<PermissionCheckResult> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('check_permission', {
      p_user_id: userId,
      p_permission_key: permissionKey,
      p_scope_type: scopeType,
      p_scope_id: scopeId
    });
  
  if (error) {
    console.error('Failed to check permission:', error);
    return {
      allowed: false,
      permission: permissionKey,
      source: 'error',
      scope_type: scopeType,
      scope_id: scopeId,
      checked_at: new Date().toISOString()
    };
  }
  
  return data as PermissionCheckResult;
}

export async function getUserPermissionsSummary(
  userId: string
): Promise<UserPermissionsSummary | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('get_user_permissions', {
      p_user_id: userId
    });
  
  if (error) {
    console.error('Failed to get user permissions:', error);
    return null;
  }
  
  return data as UserPermissionsSummary;
}

export async function assignUserRole(
  targetUserId: string,
  roleKey: string,
  options: {
    scopeType?: string;
    scopeId?: string;
    expiresAt?: string;
    notes?: string;
  } = {}
): Promise<{ success: boolean; error?: string; assignment_id?: string }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('assign_role', {
      p_target_user_id: targetUserId,
      p_role_key: roleKey,
      p_scope_type: options.scopeType || 'global',
      p_scope_id: options.scopeId || null,
      p_expires_at: options.expiresAt || null,
      p_notes: options.notes || null
    });
  
  if (error) {
    console.error('Failed to assign role:', error);
    return { success: false, error: error.message };
  }
  
  return data as { success: boolean; error?: string; assignment_id?: string };
}

export async function revokeUserRole(
  targetUserId: string,
  roleKey: string,
  options: {
    scopeType?: string;
    scopeId?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('revoke_role', {
      p_target_user_id: targetUserId,
      p_role_key: roleKey,
      p_scope_type: options.scopeType || 'global',
      p_scope_id: options.scopeId || null
    });
  
  if (error) {
    console.error('Failed to revoke role:', error);
    return { success: false, error: error.message };
  }
  
  return data as { success: boolean; error?: string };
}

// =====================================================
// AI OPERATION HELPERS
// For recording AI assistant actions with proper producer tracking
// =====================================================

export async function recordAIOperation(
  userId: string,
  operationType: OperationType,
  targetTable: string,
  targetId: string,
  previousState: any,
  nextState: any,
  aiContext: {
    toolName: string;
    functionName?: string;
    requestId?: string;
    targetTitle?: string;
  }
): Promise<Operation | null> {
  return recordOperation(
    userId,
    operationType,
    targetTable,
    targetId,
    previousState,
    nextState,
    {
      targetTitle: aiContext.targetTitle,
      producerType: 'ai',
      producerId: 'ai-assistant',
      producerContext: {
        source: 'ai-assistant',
        tool_name: aiContext.toolName,
        function_name: aiContext.functionName,
        request_id: aiContext.requestId
      },
      securityLevel: 'normal'
    }
  );
}

// =====================================================
// API OPERATION HELPERS
// For recording external API actions
// =====================================================

export async function recordAPIOperation(
  userId: string,
  operationType: OperationType,
  targetTable: string,
  targetId: string,
  previousState: any,
  nextState: any,
  apiContext: {
    endpoint: string;
    method: string;
    requestId?: string;
    targetTitle?: string;
  }
): Promise<Operation | null> {
  return recordOperation(
    userId,
    operationType,
    targetTable,
    targetId,
    previousState,
    nextState,
    {
      targetTitle: apiContext.targetTitle,
      producerType: 'api',
      producerId: apiContext.endpoint,
      producerContext: {
        source: 'api-endpoint',
        function_name: `${apiContext.method} ${apiContext.endpoint}`,
        request_id: apiContext.requestId
      },
      securityLevel: 'elevated'
    }
  );
}

// =====================================================
// ADMIN OPERATION HELPERS
// For recording admin actions on behalf of users
// =====================================================

export async function recordAdminOperation(
  adminId: string,
  targetUserId: string,
  operationType: OperationType,
  targetTable: string,
  targetId: string,
  previousState: any,
  nextState: any,
  adminContext: {
    reason: string;
    targetTitle?: string;
  }
): Promise<Operation | null> {
  return recordOperation(
    targetUserId, // Operation is recorded for the target user
    operationType,
    targetTable,
    targetId,
    previousState,
    nextState,
    {
      targetTitle: adminContext.targetTitle,
      producerType: 'admin',
      producerId: adminId,
      producerContext: {
        source: 'admin-panel',
        metadata: {
          admin_id: adminId,
          reason: adminContext.reason
        }
      },
      permissionUsed: 'admin.operations.revert',
      securityLevel: 'critical'
    }
  );
}

export default operationService;
