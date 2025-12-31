// Role-Based Access Control (RBAC) System
// Manages user roles and permissions across the application

export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

export interface RolePermission {
  action: string;
  resource: string;
  effect: 'allow' | 'deny';
}

export interface RoleConfig {
  role: UserRole;
  displayName: string;
  description: string;
  permissions: RolePermission[];
  canManageUsers: boolean;
  canDeleteContent: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
}

// Define role hierarchy and permissions
export const ROLE_PERMISSIONS: Record<UserRole, RoleConfig> = {
  user: {
    role: 'user',
    displayName: 'Kullanıcı',
    description: 'Temel kullanıcı rolü',
    permissions: [
      { action: 'create', resource: 'item', effect: 'allow' },
      { action: 'read', resource: 'item', effect: 'allow' },
      { action: 'update', resource: 'item', effect: 'allow' },
      { action: 'delete', resource: 'item', effect: 'allow' },
      { action: 'share', resource: 'item', effect: 'allow' },
      { action: 'create', resource: 'chat', effect: 'allow' },
      { action: 'read', resource: 'chat', effect: 'allow' },
      { action: 'delete', resource: 'chat', effect: 'allow' },
    ],
    canManageUsers: false,
    canDeleteContent: false,
    canViewAnalytics: false,
    canManageSettings: true,
  },
  moderator: {
    role: 'moderator',
    displayName: 'Moderatör',
    description: 'İçerik moderasyon rolü',
    permissions: [
      ...ROLE_PERMISSIONS.user.permissions,
      { action: 'delete', resource: 'chat', effect: 'allow' },
      { action: 'flag', resource: 'content', effect: 'allow' },
      { action: 'read', resource: 'analytics', effect: 'allow' },
    ],
    canManageUsers: false,
    canDeleteContent: true,
    canViewAnalytics: true,
    canManageSettings: true,
  },
  admin: {
    role: 'admin',
    displayName: 'Yönetici',
    description: 'Tam yönetim erişimi',
    permissions: [
      { action: '*', resource: '*', effect: 'allow' },
    ],
    canManageUsers: true,
    canDeleteContent: true,
    canViewAnalytics: true,
    canManageSettings: true,
  },
  super_admin: {
    role: 'super_admin',
    displayName: 'Süper Yönetici',
    description: 'Sistem yöneticisi (tüm izinler)',
    permissions: [
      { action: '*', resource: '*', effect: 'allow' },
    ],
    canManageUsers: true,
    canDeleteContent: true,
    canViewAnalytics: true,
    canManageSettings: true,
  },
};

/**
 * Check if a user role has permission for an action on a resource
 */
export function hasPermission(
  role: UserRole,
  action: string,
  resource: string
): boolean {
  const roleConfig = ROLE_PERMISSIONS[role];
  if (!roleConfig) return false;

  // Check for wildcard permissions
  const hasWildcard = roleConfig.permissions.some(
    p => p.action === '*' && p.resource === '*' && p.effect === 'allow'
  );

  if (hasWildcard) return true;

  // Check for specific permission
  return roleConfig.permissions.some(
    p =>
      (p.action === '*' || p.action === action) &&
      (p.resource === '*' || p.resource === resource) &&
      p.effect === 'allow'
  );
}

/**
 * Check if user can manage users (add, remove, change roles)
 */
export function canManageUsers(role: UserRole): boolean {
  return ROLE_PERMISSIONS[role].canManageUsers;
}

/**
 * Check if user can delete content
 */
export function canDeleteContent(role: UserRole): boolean {
  return ROLE_PERMISSIONS[role].canDeleteContent;
}

/**
 * Check if user can view analytics
 */
export function canViewAnalytics(role: UserRole): boolean {
  return ROLE_PERMISSIONS[role].canViewAnalytics;
}

/**
 * Check if user can manage settings
 */
export function canManageSettings(role: UserRole): boolean {
  return ROLE_PERMISSIONS[role].canManageSettings;
}

/**
 * Get all available roles for role assignment
 * Super admins can assign any role, admins can assign up to admin, others cannot assign
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  const roleHierarchy: Record<UserRole, number> = {
    user: 0,
    moderator: 1,
    admin: 2,
    super_admin: 3,
  };

  const userLevel = roleHierarchy[userRole];

  return Object.keys(ROLE_PERMISSIONS).filter(role => {
    const roleLevel = roleHierarchy[role as UserRole];
    return roleLevel < userLevel;
  }) as UserRole[];
}

/**
 * Get role configuration with all details
 */
export function getRoleConfig(role: UserRole): RoleConfig | null {
  return ROLE_PERMISSIONS[role] || null;
}

/**
 * Check if one role outranks another
 */
export function roleOutranks(role1: UserRole, role2: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    user: 0,
    moderator: 1,
    admin: 2,
    super_admin: 3,
  };

  return hierarchy[role1] > hierarchy[role2];
}
