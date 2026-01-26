/**
 * User Permission Service
 * Manages user permissions, roles, and templates
 */

import { createClient } from './supabase/client';

// Types
export interface UserPermission {
  id: string;
  user_id: string;
  permission_template_id?: string;
  custom_permissions: Record<string, boolean>;
  feature_flags: Record<string, any>;
  tier_overrides: Record<string, any>;
  granted_by?: string;
  granted_at?: string;
  expires_at?: string;
  revoked_at?: string;
  revoke_reason?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionTemplate {
  id: string;
  template_name: string;
  display_name: string;
  description?: string;
  tier: 'guest' | 'free' | 'starter' | 'pro' | 'enterprise' | 'admin';
  permissions: Record<string, boolean>;
  feature_flags: Record<string, any>;
  limits: Record<string, number>;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Default permission keys
export const PERMISSION_KEYS = {
  // Canvas Operations
  CANVAS_CREATE: 'canvas.create',
  CANVAS_EDIT: 'canvas.edit',
  CANVAS_DELETE: 'canvas.delete',
  CANVAS_SHARE: 'canvas.share',
  CANVAS_COLLABORATE: 'canvas.collaborate',
  
  // Content Operations
  CONTENT_UPLOAD: 'content.upload',
  CONTENT_DOWNLOAD: 'content.download',
  CONTENT_EMBED: 'content.embed',
  
  // AI Features
  AI_CHAT: 'ai.chat',
  AI_ANALYZE: 'ai.analyze',
  AI_GENERATE: 'ai.generate',
  AI_ADVANCED: 'ai.advanced',
  AI_MCP_FUNCTIONS: 'ai.mcp_functions',
  
  // Social Features
  SOCIAL_POST: 'social.post',
  SOCIAL_COMMENT: 'social.comment',
  SOCIAL_LIKE: 'social.like',
  SOCIAL_FOLLOW: 'social.follow',
  SOCIAL_MESSAGE: 'social.message',
  
  // Group/Org Features
  GROUP_CREATE: 'group.create',
  GROUP_MANAGE: 'group.manage',
  GROUP_INVITE: 'group.invite',
  ORG_CREATE: 'org.create',
  ORG_MANAGE: 'org.manage',
  
  // Admin Features
  ADMIN_VIEW: 'admin.view',
  ADMIN_USERS: 'admin.users',
  ADMIN_CONTENT: 'admin.content',
  ADMIN_SETTINGS: 'admin.settings',
  ADMIN_SECURITY: 'admin.security',
  
  // Premium Features
  PREMIUM_EXPORT: 'premium.export',
  PREMIUM_ANALYTICS: 'premium.analytics',
  PREMIUM_PRIORITY: 'premium.priority',
  PREMIUM_CUSTOM_DOMAIN: 'premium.custom_domain'
} as const;

// Load permission templates
export async function loadPermissionTemplates(): Promise<PermissionTemplate[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('permission_templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) {
    console.error('Failed to load permission templates:', error);
    return [];
  }
  
  return data || [];
}

// Get default template for tier
export async function getDefaultTemplate(tier: string): Promise<PermissionTemplate | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('permission_templates')
    .select('*')
    .eq('tier', tier)
    .eq('is_default', true)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}

// Load user's active permission
export async function loadUserPermission(userId: string): Promise<UserPermission | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('revoked_at', null)
    .single();
  
  if (error) {
    return null;
  }
  
  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    await revokePermission(data.id, 'Expired');
    return null;
  }
  
  return data;
}

// Load user's effective permissions (merged with template)
export async function getEffectivePermissions(userId: string): Promise<{
  permissions: Record<string, boolean>;
  features: Record<string, any>;
  limits: Record<string, number>;
  tier: string;
}> {
  const userPerm = await loadUserPermission(userId);
  
  // If no user permission, use guest template
  if (!userPerm) {
    const guestTemplate = await getDefaultTemplate('guest');
    return {
      permissions: guestTemplate?.permissions || {},
      features: guestTemplate?.feature_flags || {},
      limits: guestTemplate?.limits || {},
      tier: 'guest'
    };
  }
  
  // Load template if assigned
  let template: PermissionTemplate | null = null;
  if (userPerm.permission_template_id) {
    const supabase = createClient();
    const { data } = await supabase
      .from('permission_templates')
      .select('*')
      .eq('id', userPerm.permission_template_id)
      .single();
    template = data;
  }
  
  // Merge template with custom permissions
  const permissions = {
    ...(template?.permissions || {}),
    ...userPerm.custom_permissions
  };
  
  const features = {
    ...(template?.feature_flags || {}),
    ...userPerm.feature_flags
  };
  
  const limits = {
    ...(template?.limits || {}),
    ...userPerm.tier_overrides
  };
  
  return {
    permissions,
    features,
    limits,
    tier: template?.tier || 'free'
  };
}

// Check single permission
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const { permissions } = await getEffectivePermissions(userId);
  return permissions[permission] === true;
}

// Check multiple permissions (AND)
export async function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
  const effective = await getEffectivePermissions(userId);
  return permissions.every(p => effective.permissions[p] === true);
}

// Check multiple permissions (OR)
export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
  const effective = await getEffectivePermissions(userId);
  return permissions.some(p => effective.permissions[p] === true);
}

// Grant permission to user
export async function grantPermission(
  userId: string,
  templateId: string | null,
  customPermissions: Record<string, boolean> = {},
  options: {
    grantedBy?: string;
    expiresAt?: string;
    featureFlags?: Record<string, any>;
    tierOverrides?: Record<string, any>;
  } = {}
): Promise<UserPermission | null> {
  const supabase = createClient();
  
  // Revoke any existing active permission
  await supabase
    .from('user_permissions')
    .update({ is_active: false, revoked_at: new Date().toISOString(), revoke_reason: 'Replaced by new permission' })
    .eq('user_id', userId)
    .eq('is_active', true);
  
  // Create new permission
  const { data, error } = await supabase
    .from('user_permissions')
    .insert({
      user_id: userId,
      permission_template_id: templateId,
      custom_permissions: customPermissions,
      feature_flags: options.featureFlags || {},
      tier_overrides: options.tierOverrides || {},
      granted_by: options.grantedBy,
      granted_at: new Date().toISOString(),
      expires_at: options.expiresAt,
      is_active: true
    })
    .select()
    .single();
  
  if (error) {
    console.error('Failed to grant permission:', error);
    return null;
  }
  
  return data;
}

// Revoke permission
export async function revokePermission(
  permissionId: string,
  reason?: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('user_permissions')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoke_reason: reason
    })
    .eq('id', permissionId);
  
  return !error;
}

// Update custom permissions
export async function updateCustomPermissions(
  userId: string,
  permissions: Record<string, boolean>
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('user_permissions')
    .update({
      custom_permissions: permissions,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('is_active', true);
  
  return !error;
}

// Add single permission
export async function addPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const userPerm = await loadUserPermission(userId);
  if (!userPerm) return false;
  
  const newPermissions = {
    ...userPerm.custom_permissions,
    [permission]: true
  };
  
  return updateCustomPermissions(userId, newPermissions);
}

// Remove single permission
export async function removePermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const userPerm = await loadUserPermission(userId);
  if (!userPerm) return false;
  
  const newPermissions = {
    ...userPerm.custom_permissions,
    [permission]: false
  };
  
  return updateCustomPermissions(userId, newPermissions);
}

// Admin: List all users with permissions
export async function listUsersWithPermissions(
  options: {
    tier?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ users: UserPermission[]; total: number }> {
  const supabase = createClient();
  
  let query = supabase
    .from('user_permissions')
    .select('*, permission_templates(*)', { count: 'exact' });
  
  if (options.active !== undefined) {
    query = query.eq('is_active', options.active);
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }
  
  const { data, count, error } = await query;
  
  if (error) {
    console.error('Failed to list users with permissions:', error);
    return { users: [], total: 0 };
  }
  
  return { users: data || [], total: count || 0 };
}

// Admin: Create permission template
export async function createPermissionTemplate(
  template: Omit<PermissionTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<PermissionTemplate | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('permission_templates')
    .insert(template)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create permission template:', error);
    return null;
  }
  
  return data;
}

// Admin: Update permission template
export async function updatePermissionTemplate(
  templateId: string,
  updates: Partial<PermissionTemplate>
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('permission_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId);
  
  return !error;
}

// Hook for React components
export function usePermissions(userId: string | null) {
  // This would typically use React hooks
  // For now, return a sync wrapper
  return {
    check: async (permission: string) => {
      if (!userId) return false;
      return hasPermission(userId, permission);
    },
    checkAll: async (permissions: string[]) => {
      if (!userId) return false;
      return hasAllPermissions(userId, permissions);
    },
    checkAny: async (permissions: string[]) => {
      if (!userId) return false;
      return hasAnyPermission(userId, permissions);
    },
    getEffective: async () => {
      if (!userId) return null;
      return getEffectivePermissions(userId);
    }
  };
}

// Export service
export const permissionService = {
  KEYS: PERMISSION_KEYS,
  loadTemplates: loadPermissionTemplates,
  getDefaultTemplate,
  loadUserPermission,
  getEffective: getEffectivePermissions,
  has: hasPermission,
  hasAll: hasAllPermissions,
  hasAny: hasAnyPermission,
  grant: grantPermission,
  revoke: revokePermission,
  update: updateCustomPermissions,
  add: addPermission,
  remove: removePermission,
  listUsers: listUsersWithPermissions,
  createTemplate: createPermissionTemplate,
  updateTemplate: updatePermissionTemplate,
  usePermissions
};

export default permissionService;
