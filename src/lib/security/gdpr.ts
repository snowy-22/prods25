// GDPR Compliance Utilities
// Handles data export, deletion, and consent management

import { createClient } from '@/lib/supabase/client';

export interface GDPRDataExport {
  profile: any;
  items: any[];
  chatHistory: any[];
  auditLogs: any[];
  exportDate: string;
  exportFormat: 'json' | 'csv';
}

export interface ConsentRecord {
  userId: string;
  consentType: 'marketing' | 'analytics' | 'personalization' | 'data_processing';
  granted: boolean;
  grantedAt?: number;
  revokedAt?: number;
}

/**
 * Export all user data for GDPR compliance
 * Returns user data in portable format
 */
export async function exportUserData(userId: string, format: 'json' | 'csv' = 'json'): Promise<GDPRDataExport> {
  const supabase = createClient();

  try {
    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Fetch all user items
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId);

    // Fetch chat history
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId);

    // Fetch audit logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId);

    const exportData: GDPRDataExport = {
      profile: profile || {},
      items: items || [],
      chatHistory: chatHistory || [],
      auditLogs: auditLogs || [],
      exportDate: new Date().toISOString(),
      exportFormat: format,
    };

    return exportData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw new Error('Failed to export user data');
  }
}

/**
 * Permanently delete all user data
 * This is irreversible and should require explicit user confirmation
 */
export async function deleteUserData(userId: string, reason?: string): Promise<void> {
  const supabase = createClient();

  try {
    // Log deletion request for compliance
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'delete.account',
        resource_type: 'user',
        details: { reason },
        status: 'success',
      });

    // Delete chat messages
    await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);

    // Delete items
    await supabase
      .from('items')
      .delete()
      .eq('user_id', userId);

    // Delete user shares (other users' items shared with this user)
    await supabase
      .from('item_shares')
      .delete()
      .eq('shared_with_user_id', userId);

    // Delete user profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    // Note: Keep audit logs for compliance even after deletion
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw new Error('Failed to delete user data');
  }
}

/**
 * Manage user consent preferences
 */
export async function updateUserConsent(
  userId: string,
  consentType: ConsentRecord['consentType'],
  granted: boolean
): Promise<void> {
  const supabase = createClient();

  try {
    const now = Date.now();

    await supabase
      .from('user_consents')
      .upsert({
        user_id: userId,
        consent_type: consentType,
        granted,
        granted_at: granted ? now : null,
        revoked_at: !granted ? now : null,
      });

    // Log consent change
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'user.settings_change',
        resource_type: 'consent',
        details: { consentType, granted },
        status: 'success',
      });
  } catch (error) {
    console.error('Error updating consent:', error);
    throw new Error('Failed to update consent preferences');
  }
}

/**
 * Get user's current consent preferences
 */
export async function getUserConsent(userId: string): Promise<Record<string, boolean>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('user_consents')
      .select('consent_type, granted')
      .eq('user_id', userId);

    if (error) throw error;

    const consents: Record<string, boolean> = {};
    data?.forEach(record => {
      consents[record.consent_type] = record.granted;
    });

    return consents;
  } catch (error) {
    console.error('Error fetching user consent:', error);
    return {};
  }
}

/**
 * Anonymize user data instead of complete deletion
 * Useful for keeping historical data while removing personal identifiers
 */
export async function anonymizeUserData(userId: string): Promise<void> {
  const supabase = createClient();

  try {
    const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Anonymize profile
    await supabase
      .from('profiles')
      .update({
        email: `${anonymousId}@anonymous.local`,
        name: 'Anonymous User',
        avatar_url: null,
      })
      .eq('id', userId);

    // Anonymize chat messages
    await supabase
      .from('chat_messages')
      .update({
        content: '[Anonymized message]',
        user_id: anonymousId,
      })
      .eq('user_id', userId);

    // Keep items but remove sensitive metadata
    await supabase
      .from('items')
      .update({
        user_id: anonymousId,
      })
      .eq('user_id', userId);

    // Log anonymization
    await supabase
      .from('audit_logs')
      .insert({
        user_id: anonymousId,
        action: 'user.anonymized',
        resource_type: 'user',
        status: 'success',
      });
  } catch (error) {
    console.error('Error anonymizing user data:', error);
    throw new Error('Failed to anonymize user data');
  }
}

/**
 * Check if user has necessary consents for a feature
 */
export async function hasConsentFor(userId: string, feature: 'analytics' | 'personalization' | 'marketing'): Promise<boolean> {
  const consents = await getUserConsent(userId);

  const consentMap: Record<string, string> = {
    analytics: 'analytics',
    personalization: 'personalization',
    marketing: 'marketing',
  };

  const requiredConsent = consentMap[feature];
  return consents[requiredConsent] === true;
}

/**
 * Get user's right to be forgotten request status
 */
export async function getUserDeletionRequestStatus(userId: string): Promise<{
  requested: boolean;
  requestedAt?: number;
  status: 'pending' | 'processing' | 'completed' | 'none';
}> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('user_deletion_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error?.code === 'PGRST116') {
      // No deletion request found
      return { requested: false, status: 'none' };
    }

    if (error) throw error;

    return {
      requested: true,
      requestedAt: new Date(data.created_at).getTime(),
      status: data.status,
    };
  } catch (error) {
    console.error('Error checking deletion request:', error);
    return { requested: false, status: 'none' };
  }
}

/**
 * Request user data deletion with 30-day grace period
 * Compliant with GDPR "right to be forgotten"
 */
export async function requestUserDeletion(userId: string): Promise<{ deletionDate: string }> {
  const supabase = createClient();

  try {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30); // 30-day grace period

    await supabase
      .from('user_deletion_requests')
      .insert({
        user_id: userId,
        status: 'pending',
        scheduled_deletion_date: deletionDate.toISOString(),
      });

    // Log deletion request
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'user.deletion_requested',
        resource_type: 'user',
        details: { deletionDate: deletionDate.toISOString() },
        status: 'success',
      });

    return { deletionDate: deletionDate.toISOString() };
  } catch (error) {
    console.error('Error requesting user deletion:', error);
    throw new Error('Failed to request account deletion');
  }
}

/**
 * Cancel a pending deletion request
 */
export async function cancelDeletionRequest(userId: string): Promise<void> {
  const supabase = createClient();

  try {
    await supabase
      .from('user_deletion_requests')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'pending');

    // Log cancellation
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'user.deletion_cancelled',
        resource_type: 'user',
        status: 'success',
      });
  } catch (error) {
    console.error('Error cancelling deletion request:', error);
    throw new Error('Failed to cancel deletion request');
  }
}
