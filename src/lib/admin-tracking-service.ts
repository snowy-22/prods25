/**
 * Admin Operation Tracking Service
 * Real-time monitoring, historical review, and reporting
 */

import { createClient } from './supabase/client';

// Types - Producer System Integration
export type ProducerType = 'user' | 'admin' | 'system' | 'ai' | 'api' | 'migration' | 'sync' | 'scheduler' | 'trigger';

export type OperationType = 
  | 'item_create'
  | 'item_update'
  | 'item_delete'
  | 'item_move'
  | 'item_resize'
  | 'item_style'
  | 'folder_create'
  | 'folder_update'
  | 'folder_delete'
  | 'batch_operation'
  | 'undo'
  | 'redo';

export interface AdminTracking {
  id: string;
  operation_id: string;
  user_id: string;
  user_email?: string;
  user_display_name?: string;
  user_subscription_tier?: string;
  operation_type: OperationType;
  operation_category: OperationCategory;
  producer_type: ProducerType;
  producer_id?: string;
  ai_session_id?: string;
  api_client_id?: string;
  admin_action_on_behalf_of?: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  affected_users_count: number;
  data_size_bytes?: number;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  flagged_for_review: boolean;
  flagged: boolean;
  flag_reason?: string;
  is_live: boolean;
  ip_address?: string;
  user_agent?: string;
  tracked_at: string;
  visibility: 'admin' | 'super_admin' | 'public';
  created_at: string;
}

export type OperationCategory = 
  | 'content'
  | 'style'
  | 'layout'
  | 'collaboration'
  | 'settings'
  | 'admin'
  | 'security'
  | 'billing'
  | 'api'
  | 'ai_interaction';

export type ThreatStatus = 'new' | 'investigating' | 'mitigated' | 'false_positive' | 'escalated';
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityThreat {
  id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  threat_type: ThreatType;
  threat_level: ThreatSeverity;
  severity: ThreatSeverity; // Alias for component compatibility
  status: ThreatStatus;
  threat_description?: string;
  threat_data?: Record<string, any>;
  source?: string;
  request_path?: string;
  request_method?: string;
  detection_method?: string;
  confidence_score?: number;
  action_taken: 'none' | 'logged' | 'warned' | 'blocked' | 'banned' | 'reported';
  block_duration_minutes?: number;
  blocked_until?: string;
  investigated: boolean;
  detected_at: string;
  created_at: string;
}

export type ThreatType = 
  | 'rate_limit_exceeded'
  | 'suspicious_pattern'
  | 'injection_attempt'
  | 'unauthorized_access'
  | 'brute_force'
  | 'data_exfiltration'
  | 'privilege_escalation'
  | 'api_abuse'
  | 'bot_activity'
  | 'other';

export interface AdminDashboardStats {
  totalOperations24h: number;
  totalUsers24h: number;
  flaggedOperations: number;
  criticalThreats: number;
  operationsByCategory: Record<OperationCategory, number>;
  operationsByHour: { hour: number; count: number }[];
  topUsers: { user_id: string; user_email: string; operation_count: number }[];
  recentThreats: SecurityThreat[];
}

// Load Admin Tracking Data
export async function loadAdminTracking(
  options: {
    limit?: number;
    offset?: number;
    category?: OperationCategory;
    impactLevel?: string;
    flaggedOnly?: boolean;
    userId?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<AdminTracking[]> {
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
    console.error('Failed to load admin tracking:', error);
    return [];
  }
  
  return data || [];
}

// Flag an operation
export async function flagOperation(
  operationId: string,
  adminId: string,
  reason: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('admin_operation_tracking')
    .update({
      flagged: true,
      flag_reason: reason,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', operationId);
  
  if (error) {
    console.error('Failed to flag operation:', error);
    return false;
  }
  
  return true;
}

// Add review notes
export async function addReviewNotes(
  operationId: string,
  adminId: string,
  notes: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('admin_operation_tracking')
    .update({
      review_notes: notes,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', operationId);
  
  if (error) {
    console.error('Failed to add review notes:', error);
    return false;
  }
  
  return true;
}

// Load Security Threats
export async function loadSecurityThreats(
  options: {
    limit?: number;
    threatType?: ThreatType;
    threatLevel?: string;
    uninvestigatedOnly?: boolean;
  } = {}
): Promise<SecurityThreat[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('security_threat_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options.limit || 50);
  
  if (options.threatType) {
    query = query.eq('threat_type', options.threatType);
  }
  
  if (options.threatLevel) {
    query = query.eq('threat_level', options.threatLevel);
  }
  
  if (options.uninvestigatedOnly) {
    query = query.eq('investigated', false);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to load security threats:', error);
    return [];
  }
  
  return data || [];
}

// Mark threat as investigated
export async function investigateThreat(
  threatId: string,
  adminId: string,
  notes: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('security_threat_log')
    .update({
      investigated: true,
      investigated_by: adminId,
      investigated_at: new Date().toISOString(),
      investigation_notes: notes
    })
    .eq('id', threatId);
  
  if (error) {
    console.error('Failed to investigate threat:', error);
    return false;
  }
  
  return true;
}

// Get Dashboard Stats
export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  const supabase = createClient();
  
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  try {
    // Get total operations in 24h
    const { count: totalOperations } = await supabase
      .from('admin_operation_tracking')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());
    
    // Get unique users in 24h
    const { data: uniqueUsers } = await supabase
      .from('admin_operation_tracking')
      .select('user_id')
      .gte('created_at', yesterday.toISOString());
    
    const uniqueUserIds = new Set(uniqueUsers?.map(u => u.user_id) || []);
    
    // Get flagged operations count
    const { count: flaggedCount } = await supabase
      .from('admin_operation_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('flagged', true);
    
    // Get critical threats count
    const { count: criticalThreats } = await supabase
      .from('security_threat_log')
      .select('*', { count: 'exact', head: true })
      .eq('threat_level', 'critical')
      .eq('investigated', false);
    
    // Get recent threats
    const { data: recentThreats } = await supabase
      .from('security_threat_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Get top users
    const { data: topUsersData } = await supabase
      .from('admin_operation_tracking')
      .select('user_id, user_email')
      .gte('created_at', yesterday.toISOString());
    
    const userCounts: Record<string, { email: string; count: number }> = {};
    topUsersData?.forEach(u => {
      if (!userCounts[u.user_id]) {
        userCounts[u.user_id] = { email: u.user_email || 'Unknown', count: 0 };
      }
      userCounts[u.user_id].count++;
    });
    
    const topUsers = Object.entries(userCounts)
      .map(([user_id, data]) => ({
        user_id,
        user_email: data.email,
        operation_count: data.count
      }))
      .sort((a, b) => b.operation_count - a.operation_count)
      .slice(0, 10);
    
    return {
      totalOperations24h: totalOperations || 0,
      totalUsers24h: uniqueUserIds.size,
      flaggedOperations: flaggedCount || 0,
      criticalThreats: criticalThreats || 0,
      operationsByCategory: {} as Record<OperationCategory, number>,
      operationsByHour: [],
      topUsers,
      recentThreats: (recentThreats || []) as SecurityThreat[]
    };
  } catch (error) {
    console.error('Failed to get admin dashboard stats:', error);
    return null;
  }
}

// Subscribe to Live Operations
export function subscribeToLiveOperations(
  onOperation: (tracking: AdminTracking) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel('admin-live-ops')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_operation_tracking'
      },
      (payload) => {
        onOperation(payload.new as AdminTracking);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to Security Threats
export function subscribeToSecurityThreats(
  onThreat: (threat: SecurityThreat) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel('admin-threats')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'security_threat_log'
      },
      (payload) => {
        onThreat(payload.new as SecurityThreat);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// Generate Report
export async function generateOperationReport(
  startDate: string,
  endDate: string,
  options: {
    format?: 'json' | 'csv';
    includeUserDetails?: boolean;
    categories?: OperationCategory[];
  } = {}
): Promise<any> {
  const supabase = createClient();
  
  let query = supabase
    .from('admin_operation_tracking')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });
  
  if (options.categories && options.categories.length > 0) {
    query = query.in('operation_category', options.categories);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to generate report:', error);
    return null;
  }
  
  const report = {
    generatedAt: new Date().toISOString(),
    dateRange: { startDate, endDate },
    totalOperations: data?.length || 0,
    operationsByCategory: {} as Record<string, number>,
    operationsByImpact: {} as Record<string, number>,
    flaggedOperations: data?.filter(d => d.flagged).length || 0,
    data: options.format === 'csv' ? convertToCSV(data || []) : data
  };
  
  // Calculate aggregates
  data?.forEach(op => {
    report.operationsByCategory[op.operation_category] = 
      (report.operationsByCategory[op.operation_category] || 0) + 1;
    
    if (op.impact_level) {
      report.operationsByImpact[op.impact_level] = 
        (report.operationsByImpact[op.impact_level] || 0) + 1;
    }
  });
  
  return report;
}

function convertToCSV(data: AdminTracking[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const value = (item as any)[header];
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value || '');
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// Export service with all capabilities
export const adminTrackingService = {
  // Core operations
  loadOperations: loadAdminTracking,
  loadTracking: loadAdminTracking,
  flagOperation,
  addReviewNotes,
  
  // Security
  loadThreats: loadSecurityThreats,
  investigateThreat,
  
  // Dashboard & Stats
  getDashboardStats: getAdminDashboardStats,
  
  // Real-time subscriptions
  subscribeToOperations: subscribeToLiveOperations,
  subscribeToThreats: subscribeToSecurityThreats,
  
  // Reporting
  generateReport: generateOperationReport
};

export default adminTrackingService;
