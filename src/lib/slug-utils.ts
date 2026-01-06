/**
 * Slug Generation & Shared Folder Utilities
 * 
 * URL slug oluşturma, benzersizlik kontrolü ve paylaşılan klasör yönetimi
 */

import { createClient } from './supabase/client';
import { customAlphabet } from 'nanoid';
import { ContentItem } from './initial-content';

// URL-safe nanoid (lowercase + numbers, 8 chars)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export interface SharedFolder {
  id: string;
  folder_id: string;
  slug: string;
  user_id: string;
  title: string;
  description: string | null;
  access_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Generate a unique slug for a folder
 * @param baseSlug Optional base string (e.g., folder title)
 * @returns Unique slug string
 */
export async function generateUniqueSlug(baseSlug?: string): Promise<string> {
  const supabase = createClient();
  
  // If base slug provided, sanitize it
  let slug = baseSlug 
    ? baseSlug
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Spaces to hyphens
        .replace(/-+/g, '-') // Multiple hyphens to single
        .slice(0, 30) // Max 30 chars
    : '';

  // Append nanoid for uniqueness
  if (slug) {
    slug = `${slug}-${nanoid()}`;
  } else {
    slug = nanoid();
  }

  // Check if slug already exists (extremely rare with nanoid, but safe)
  const { data: existing } = await supabase
    .from('shared_folders')
    .select('slug')
    .eq('slug', slug)
    .single();

  if (existing) {
    // Collision detected, regenerate
    return generateUniqueSlug(baseSlug);
  }

  return slug;
}

/**
 * Create a shared folder entry in Supabase
 * @param folderId ContentItem ID
 * @param title Folder title
 * @param description Optional description
 * @param expiresInDays Optional expiration (null = never expires)
 * @returns SharedFolder object with slug
 */
export async function createSharedFolder(
  folderId: string,
  title: string,
  description?: string,
  expiresInDays?: number
): Promise<SharedFolder | null> {
  const supabase = createClient();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  // Generate unique slug
  const slug = await generateUniqueSlug(title);

  // Calculate expiration date
  let expiresAt: string | null = null;
  if (expiresInDays) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expiresInDays);
    expiresAt = expirationDate.toISOString();
  }

  // Insert into database
  const { data, error } = await supabase
    .from('shared_folders')
    .insert({
      folder_id: folderId,
      slug,
      user_id: user.id,
      title,
      description: description || null,
      expires_at: expiresAt,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating shared folder:', error);
    return null;
  }

  return data as SharedFolder;
}

/**
 * Get shared folder by slug
 * @param slug Unique slug
 * @returns SharedFolder object or null
 */
export async function getSharedFolderBySlug(slug: string): Promise<SharedFolder | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('shared_folders')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching shared folder:', error);
    return null;
  }

  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    console.warn('Shared folder expired:', slug);
    return null;
  }

  return data as SharedFolder;
}

/**
 * Get all shared folders for current user
 * @returns Array of SharedFolder objects
 */
export async function getUserSharedFolders(): Promise<SharedFolder[]> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('shared_folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user shared folders:', error);
    return [];
  }

  return data as SharedFolder[];
}

/**
 * Update shared folder
 * @param slug Folder slug
 * @param updates Partial updates
 * @returns Updated SharedFolder or null
 */
export async function updateSharedFolder(
  slug: string,
  updates: Partial<Pick<SharedFolder, 'title' | 'description' | 'expires_at' | 'is_active'>>
): Promise<SharedFolder | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('shared_folders')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating shared folder:', error);
    return null;
  }

  return data as SharedFolder;
}

/**
 * Delete (deactivate) shared folder
 * @param slug Folder slug
 * @returns Success boolean
 */
export async function deleteSharedFolder(slug: string): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('shared_folders')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting shared folder:', error);
    return false;
  }

  return true;
}

/**
 * Generate share URL for folder
 * @param slug Unique slug
 * @returns Full share URL
 */
export function getShareUrl(slug: string): string {
  if (typeof window === 'undefined') {
    return `https://tv25.app/shared/${slug}`;
  }
  
  const { protocol, host } = window.location;
  return `${protocol}//${host}/shared/${slug}`;
}

/**
 * Get social share links for folder
 * @param slug Unique slug
 * @param title Folder title
 * @param description Optional description
 * @returns Object with social platform URLs
 */
export function getSocialShareLinks(slug: string, title: string, description?: string) {
  const shareUrl = getShareUrl(slug);
  const text = description || `${title} adlı klasörü görüntüle`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text);
  const encodedTitle = encodeURIComponent(title);

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
  };
}

/**
 * Check if user owns a shared folder
 * @param slug Folder slug
 * @returns Boolean
 */
export async function isUserOwnerOfSharedFolder(slug: string): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('shared_folders')
    .select('user_id')
    .eq('slug', slug)
    .single();

  return data?.user_id === user.id;
}
