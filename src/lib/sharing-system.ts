/**
 * Advanced Sharing & Permissions System
 * Handles item sharing, permissions, access links, and collaborative features
 */

import { ContentItem } from './initial-content';
import { createClient } from './supabase/client';

export type SharePermission = 'view' | 'comment' | 'edit' | 'admin';
export type ShareType = 'user' | 'email' | 'link' | 'public';
export type LinkExpiry = 'never' | '1hour' | '1day' | '7days' | '30days';

export interface SharedItem {
  id: string;
  ownerId: string;
  itemId: string;
  itemType: string;
  itemName: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  publicUrl?: string;
}

export interface SharePermission_Type {
  id: string;
  sharedItemId: string;
  grantedTo: string; // user ID or email
  grantedBy: string; // user ID who shared
  shareType: ShareType;
  permission: SharePermission;
  canDownload: boolean;
  canPrint: boolean;
  canShare: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  accessCount?: number;
  lastAccessedAt?: string;
}

export interface ShareLink {
  id: string;
  sharedItemId: string;
  createdBy: string;
  token: string;
  shortCode: string;
  permission: SharePermission;
  expiresAt?: string;
  maxAccesses?: number;
  accessCount: number;
  isActive: boolean;
  canDownload: boolean;
  canPrint: boolean;
  password?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SharingAccess {
  linkId: string;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  action: 'view' | 'download' | 'comment' | 'edit';
  timestamp: string;
}

export interface SharingStats {
  itemId: string;
  totalShares: number;
  totalPeople: number;
  totalLinks: number;
  totalAccesses: number;
  uniqueViewers: number;
  permissions: Record<SharePermission, number>;
  lastSharedAt?: string;
}

/**
 * Sharing Manager
 */
export class SharingManager {
  private supabase = createClient();

  /**
   * Create shared item
   */
  async createSharedItem(
    ownerId: string,
    itemId: string,
    itemType: string,
    itemName: string,
    isPublic: boolean = false
  ): Promise<SharedItem> {
    const now = new Date().toISOString();
    const publicUrl = isPublic ? `${itemId}/${Math.random().toString(36).substring(7)}` : undefined;

    const { data, error } = await this.supabase
      .from('shared_items')
      .insert({
        ownerId,
        itemId,
        itemType,
        itemName,
        isPublic,
        publicUrl,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Share with user/email
   */
  async grantPermission(
    sharedItemId: string,
    grantedBy: string,
    grantedTo: string,
    shareType: ShareType,
    permission: SharePermission,
    options: {
      canDownload?: boolean;
      canPrint?: boolean;
      canShare?: boolean;
      expiresIn?: number; // minutes
    } = {}
  ): Promise<SharePermission_Type> {
    const now = new Date().toISOString();
    const expiresAt = options.expiresIn
      ? new Date(Date.now() + options.expiresIn * 60 * 1000).toISOString()
      : undefined;

    const { data, error } = await this.supabase
      .from('share_permissions')
      .upsert({
        sharedItemId,
        grantedBy,
        grantedTo,
        shareType,
        permission,
        canDownload: options.canDownload ?? true,
        canPrint: options.canPrint ?? true,
        canShare: options.canShare ?? (permission === 'admin' || permission === 'edit'),
        expiresAt,
        createdAt: now,
        updatedAt: now
      }, {
        onConflict: 'sharedItemId,grantedTo'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create share link
   */
  async createShareLink(
    sharedItemId: string,
    createdBy: string,
    permission: SharePermission,
    options: {
      expiresIn?: LinkExpiry;
      maxAccesses?: number;
      canDownload?: boolean;
      canPrint?: boolean;
      password?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<ShareLink> {
    const now = new Date().toISOString();
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    let expiresAt: string | undefined;
    if (options.expiresIn && options.expiresIn !== 'never') {
      const hours: Record<string, number> = {
        '1hour': 1,
        '1day': 24,
        '7days': 24 * 7,
        '30days': 24 * 30
      };
      expiresAt = new Date(Date.now() + hours[options.expiresIn] * 60 * 60 * 1000).toISOString();
    }

    const { data, error } = await this.supabase
      .from('share_links')
      .insert({
        sharedItemId,
        createdBy,
        token,
        shortCode,
        permission,
        expiresAt,
        maxAccesses: options.maxAccesses,
        accessCount: 0,
        isActive: true,
        canDownload: options.canDownload ?? true,
        canPrint: options.canPrint ?? true,
        password: options.password,
        metadata: options.metadata,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Verify share link access
   */
  async verifyShareLink(
    token: string,
    password?: string
  ): Promise<{ valid: boolean; link?: ShareLink; message?: string }> {
    const { data: link, error } = await this.supabase
      .from('share_links')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      return { valid: false, message: 'Link not found' };
    }

    // Check if active
    if (!link.isActive) {
      return { valid: false, message: 'Link has been revoked' };
    }

    // Check expiry
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { valid: false, message: 'Link has expired' };
    }

    // Check max accesses
    if (link.maxAccesses && link.accessCount >= link.maxAccesses) {
      return { valid: false, message: 'Link access limit reached' };
    }

    // Check password
    if (link.password && password !== link.password) {
      return { valid: false, message: 'Invalid password' };
    }

    return { valid: true, link };
  }

  /**
   * Log share access
   */
  async logAccess(
    linkId: string,
    action: 'view' | 'download' | 'comment' | 'edit',
    options: {
      userId?: string;
      email?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<void> {
    // Increment access count
    const { error: updateError } = await this.supabase
      .from('share_links')
      .update({ accessCount: { increment: 1 } })
      .eq('id', linkId);

    if (updateError) throw updateError;

    // Log access
    const { error: logError } = await this.supabase
      .from('sharing_access_logs')
      .insert({
        linkId,
        userId: options.userId,
        email: options.email,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        action,
        timestamp: new Date().toISOString()
      });

    if (logError && logError.code !== 'PGRST202') {
      console.error('Failed to log share access:', logError);
    }
  }

  /**
   * Revoke share permission
   */
  async revokePermission(
    permissionId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('share_permissions')
      .update({ revokedAt: new Date().toISOString() })
      .eq('id', permissionId);

    if (error) throw error;
  }

  /**
   * Revoke share link
   */
  async revokeLink(
    linkId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('share_links')
      .update({ isActive: false })
      .eq('id', linkId);

    if (error) throw error;
  }

  /**
   * Get share permissions
   */
  async getPermissions(
    sharedItemId: string
  ): Promise<SharePermission_Type[]> {
    const { data, error } = await this.supabase
      .from('share_permissions')
      .select('*')
      .eq('sharedItemId', sharedItemId)
      .is('revokedAt', null);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get share links
   */
  async getShareLinks(
    sharedItemId: string
  ): Promise<ShareLink[]> {
    const { data, error } = await this.supabase
      .from('share_links')
      .select('*')
      .eq('sharedItemId', sharedItemId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get sharing statistics
   */
  async getSharingStats(
    itemId: string
  ): Promise<SharingStats> {
    const { data: shared } = await this.supabase
      .from('shared_items')
      .select('id')
      .eq('itemId', itemId)
      .single();

    if (!shared) {
      return {
        itemId,
        totalShares: 0,
        totalPeople: 0,
        totalLinks: 0,
        totalAccesses: 0,
        uniqueViewers: 0,
        permissions: {}
      };
    }

    // Get permissions
    const { data: permissions, error: permError } = await this.supabase
      .from('share_permissions')
      .select('permission')
      .eq('sharedItemId', shared.id)
      .is('revokedAt', null);

    // Get links
    const { data: links, error: linksError } = await this.supabase
      .from('share_links')
      .select('*')
      .eq('sharedItemId', shared.id)
      .eq('isActive', true);

    // Count accesses
    const totalAccesses = (links || []).reduce((sum, link) => sum + link.accessCount, 0);
    const uniqueViewers = new Set((links || []).map(l => l.id)).size;

    // Breakdown permissions
    const permissionBreakdown: Record<SharePermission, number> = {
      view: 0,
      comment: 0,
      edit: 0,
      admin: 0
    };

    (permissions || []).forEach(p => {
      permissionBreakdown[p.permission]++;
    });

    return {
      itemId,
      totalShares: (permissions || []).length,
      totalPeople: new Set((permissions || []).map(p => p.grantedTo)).size,
      totalLinks: (links || []).length,
      totalAccesses,
      uniqueViewers,
      permissions: permissionBreakdown,
      lastSharedAt: shared.updatedAt
    };
  }
}

export const sharingManager = new SharingManager();
