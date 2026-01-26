/**
 * Admin Security Middleware
 * 
 * Admin paneli için güvenli kimlik doğrulama ve yetkilendirme.
 * Supabase auth + özel admin token sistemi.
 */

import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

// Admin yetkileri
export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'analyst';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  created_at: string;
  last_login: string;
  is_active: boolean;
}

export type AdminPermission = 
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'users:ban'
  | 'content:read'
  | 'content:write'
  | 'content:delete'
  | 'content:moderate'
  | 'analytics:read'
  | 'analytics:export'
  | 'settings:read'
  | 'settings:write'
  | 'billing:read'
  | 'billing:write'
  | 'admin:manage'
  | 'admin:audit';

// Rol bazlı izinler
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'users:read', 'users:write', 'users:delete', 'users:ban',
    'content:read', 'content:write', 'content:delete', 'content:moderate',
    'analytics:read', 'analytics:export',
    'settings:read', 'settings:write',
    'billing:read', 'billing:write',
    'admin:manage', 'admin:audit'
  ],
  admin: [
    'users:read', 'users:write', 'users:ban',
    'content:read', 'content:write', 'content:moderate',
    'analytics:read', 'analytics:export',
    'settings:read',
    'billing:read',
    'admin:audit'
  ],
  moderator: [
    'users:read', 'users:ban',
    'content:read', 'content:moderate',
    'analytics:read'
  ],
  analyst: [
    'users:read',
    'content:read',
    'analytics:read', 'analytics:export'
  ]
};

// Admin token için secret (production'da env'den alınmalı)
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'tv25_admin_secret_2024_secure_key';

// Önceden tanımlı admin hesapları (production'da DB'den alınmalı)
// Bu hesaplar Supabase Auth ile eşleşmeli
const PREDEFINED_ADMINS: { email: string; role: AdminRole }[] = [
  { email: 'admin@tv25.app', role: 'super_admin' },
  { email: 'doruk@tv25.app', role: 'super_admin' },
  { email: 'moderator@tv25.app', role: 'moderator' },
];

/**
 * Admin token oluştur (JWT benzeri ama basit)
 */
export function generateAdminToken(userId: string, role: AdminRole): string {
  const payload = {
    uid: userId,
    role,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 saat
    iat: Date.now()
  };
  
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = Buffer.from(`${base64Payload}.${ADMIN_SECRET}`).toString('base64').substring(0, 32);
  
  return `${base64Payload}.${signature}`;
}

/**
 * Admin token doğrula
 */
export function verifyAdminToken(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const [base64Payload, signature] = token.split('.');
    
    if (!base64Payload || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    // Signature doğrula
    const expectedSignature = Buffer.from(`${base64Payload}.${ADMIN_SECRET}`).toString('base64').substring(0, 32);
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    // Payload decode et
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
    
    // Expiry kontrol
    if (payload.exp < Date.now()) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'Token parse error' };
  }
}

/**
 * Kullanıcının admin olup olmadığını kontrol et
 * @param emailOrUserId - Email adresi (required) veya userId
 * @param email - Opsiyonel email (eğer ilk parametre userId ise)
 */
export async function checkAdminAccess(emailOrUserId: string, email?: string): Promise<{ 
  isAdmin: boolean; 
  role?: AdminRole;
  permissions?: AdminPermission[];
  error?: string;
}> {
  // Parametreleri normalize et - eğer email verilmediyse, ilk parametre email'dir
  const userEmail = email || emailOrUserId;
  const userId = email ? emailOrUserId : undefined;
  
  // Önce önceden tanımlı adminleri kontrol et
  const predefinedAdmin = PREDEFINED_ADMINS.find(a => a.email.toLowerCase() === userEmail.toLowerCase());
  
  if (predefinedAdmin) {
    return {
      isAdmin: true,
      role: predefinedAdmin.role,
      permissions: ROLE_PERMISSIONS[predefinedAdmin.role]
    };
  }
  
  // userId yoksa ve predefined admin değilse, admin değil
  if (!userId) {
    return { isAdmin: false, error: 'Not a predefined admin and no userId provided' };
  }
  
  // Veritabanından kontrol et
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      return { isAdmin: false, error: 'Not an admin user' };
    }
    
    const role = data.role as AdminRole;
    return {
      isAdmin: true,
      role,
      permissions: ROLE_PERMISSIONS[role]
    };
  } catch (err) {
    // Tablo yoksa veya hata varsa, predefined kontrolü zaten yapıldı
    return { isAdmin: false, error: 'Database error' };
  }
}

/**
 * İzin kontrolü
 * @param roleOrPermissions - AdminRole string veya AdminPermission[] array
 * @param requiredPermission - Gereken izin
 */
export function hasPermission(roleOrPermissions: AdminRole | AdminPermission[], requiredPermission: AdminPermission): boolean {
  // Eğer string (role) verilmişse, o role'ün izinlerini al
  if (typeof roleOrPermissions === 'string') {
    const permissions = ROLE_PERMISSIONS[roleOrPermissions as AdminRole];
    return permissions ? permissions.includes(requiredPermission) : false;
  }
  // Eğer array (permissions) verilmişse, direkt kontrol et
  return roleOrPermissions.includes(requiredPermission);
}

/**
 * Admin API middleware
 */
export async function adminApiMiddleware(
  request: NextRequest,
  requiredPermission?: AdminPermission
): Promise<{ 
  authorized: boolean; 
  user?: AdminUser; 
  error?: string;
  response?: NextResponse;
}> {
  // Supabase session kontrolü
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { 
      authorized: false, 
      error: 'Unauthorized',
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }
  
  // Admin erişim kontrolü
  const adminCheck = await checkAdminAccess(user.id, user.email || '');
  
  if (!adminCheck.isAdmin) {
    return { 
      authorized: false, 
      error: 'Forbidden: Admin access required',
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    };
  }
  
  // Spesifik izin kontrolü
  if (requiredPermission && !hasPermission(adminCheck.permissions!, requiredPermission)) {
    return { 
      authorized: false, 
      error: `Forbidden: ${requiredPermission} permission required`,
      response: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    };
  }
  
  // Admin log kaydı
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      admin_email: user.email,
      action: request.method,
      resource: request.nextUrl.pathname,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // Log hatası admin işlemini engellemez
    console.warn('[AdminSecurity] Audit log failed:', err);
  }
  
  return {
    authorized: true,
    user: {
      id: user.id,
      email: user.email || '',
      role: adminCheck.role!,
      permissions: adminCheck.permissions!,
      created_at: user.created_at,
      last_login: new Date().toISOString(),
      is_active: true
    }
  };
}

/**
 * Client-side admin kontrolü
 */
export async function isAdminUser(): Promise<{ isAdmin: boolean; role?: AdminRole }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !user.email) {
    return { isAdmin: false };
  }
  
  const adminCheck = await checkAdminAccess(user.id, user.email);
  return { 
    isAdmin: adminCheck.isAdmin, 
    role: adminCheck.role 
  };
}

/**
 * Admin giriş doğrulama
 * Ek güvenlik katmanı: Email + Password + Admin Secret
 */
export async function validateAdminLogin(
  email: string, 
  password: string, 
  adminSecret?: string
): Promise<{ 
  success: boolean; 
  token?: string; 
  user?: AdminUser;
  error?: string;
}> {
  const supabase = createClient();
  
  // Normal Supabase login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error || !data.user) {
    return { success: false, error: error?.message || 'Login failed' };
  }
  
  // Admin erişim kontrolü
  const adminCheck = await checkAdminAccess(data.user.id, email);
  
  if (!adminCheck.isAdmin) {
    // Admin değilse oturumu kapat
    await supabase.auth.signOut();
    return { success: false, error: 'Not an admin user' };
  }
  
  // Super admin için ek secret kontrolü (opsiyonel)
  if (adminCheck.role === 'super_admin' && adminSecret) {
    const expectedSecret = process.env.SUPER_ADMIN_SECRET || 'tv25_super_admin_2024';
    if (adminSecret !== expectedSecret) {
      await supabase.auth.signOut();
      return { success: false, error: 'Invalid admin secret' };
    }
  }
  
  // Admin token oluştur
  const token = generateAdminToken(data.user.id, adminCheck.role!);
  
  return {
    success: true,
    token,
    user: {
      id: data.user.id,
      email: data.user.email || '',
      role: adminCheck.role!,
      permissions: adminCheck.permissions!,
      created_at: data.user.created_at,
      last_login: new Date().toISOString(),
      is_active: true
    }
  };
}
