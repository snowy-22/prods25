// Audit Logging System
// Tracks important user actions for security and compliance

import { createClient } from '@/lib/supabase/client';

export type AuditAction = 
  | 'user.login'
  | 'user.logout'
  | 'user.signup'
  | 'user.password_change'
  | 'user.role_change'
  | 'item.create'
  | 'item.read'
  | 'item.update'
  | 'item.delete'
  | 'item.share'
  | 'chat.create'
  | 'chat.message_send'
  | 'chat.delete'
  | 'settings.update'
  | 'permission.denied'
  | 'export.data'
  | 'delete.account';

export interface AuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: number;
  status: 'success' | 'failure';
}

/**
 * Log an action to the audit trail
 * This is used for compliance, security monitoring, and debugging
 */
export async function logAuditAction(
  userId: string,
  action: AuditAction,
  resourceType: string,
  options?: {
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    status?: 'success' | 'failure';
  }
): Promise<void> {
  try {
    const supabase = createClient();

    // Get client IP if not provided
    const ipAddress = options?.ipAddress || 
      (typeof window === 'undefined' ? 'server' : 'client');

    const auditLog = {
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: options?.resourceId,
      details: options?.details,
      ip_address: ipAddress,
      user_agent: options?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      timestamp: Date.now(),
      status: options?.status || 'success',
    };

    // Insert into audit_logs table
    const { error } = await supabase
      .from('audit_logs')
      .insert([auditLog]);

    if (error) {
      console.error('Failed to log audit action:', error);
    }
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - audit logging should not break functionality
  }
}

/**
 * Get audit logs for a specific user
 * Only admins can view other users' logs
 */
export async function getAuditLogs(
  userId: string,
  options?: {
    action?: AuditAction;
    resourceType?: string;
    limit?: number;
    offset?: number;
  }
): Promise<AuditLog[]> {
  try {
    const supabase = createClient();

    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId);

    if (options?.action) {
      query = query.eq('action', options.action);
    }

    if (options?.resourceType) {
      query = query.eq('resource_type', options.resourceType);
    }

    query = query
      .order('timestamp', { ascending: false })
      .limit(options?.limit || 50)
      .range((options?.offset || 0), ((options?.offset || 0) + (options?.limit || 50) - 1));

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Get recent suspicious activities
 * Useful for security monitoring
 */
export async function getSuspiciousActivities(
  options?: {
    limit?: number;
  }
): Promise<AuditLog[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('status', 'failure')
      .or('action.in.(user.login,permission.denied)')
      .order('timestamp', { ascending: false })
      .limit(options?.limit || 100);

    if (error) {
      console.error('Failed to fetch suspicious activities:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching suspicious activities:', error);
    return [];
  }
}

/**
 * Get audit statistics for a time period
 */
export async function getAuditStats(
  startTime: number,
  endTime: number
): Promise<{
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  actionsByType: Record<AuditAction, number>;
}> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('timestamp', startTime)
      .lte('timestamp', endTime);

    if (error) {
      console.error('Failed to fetch audit stats:', error);
      return {
        totalActions: 0,
        successfulActions: 0,
        failedActions: 0,
        actionsByType: {} as Record<AuditAction, number>,
      };
    }

    const logs = data || [];
    const actionsByType: Record<string, number> = {};

    logs.forEach(log => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
    });

    return {
      totalActions: logs.length,
      successfulActions: logs.filter(l => l.status === 'success').length,
      failedActions: logs.filter(l => l.status === 'failure').length,
      actionsByType: actionsByType as Record<AuditAction, number>,
    };
  } catch (error) {
    console.error('Error calculating audit stats:', error);
    return {
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      actionsByType: {} as Record<AuditAction, number>,
    };
  }
}
