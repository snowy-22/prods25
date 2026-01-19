/**
 * Analytics Tracking System
 * 
 * Cihaz bilgisi, oturum takibi, kullanıcı/misafir algılama ve event logging
 */

import { createClient } from './supabase/client';
import { customAlphabet } from 'nanoid';
import { UAParser } from 'ua-parser-js';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 32);

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceVendor?: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  timezone: string;
  userAgent: string;
}

export interface AnalyticsSession {
  id: string;
  session_id: string;
  user_id: string | null;
  device_info: DeviceInfo;
  browser: string;
  os: string;
  screen_width: number;
  screen_height: number;
  language: string;
  timezone: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  is_guest: boolean;
  ip_address: string | null;
  country_code: string | null;
  city: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export interface AnalyticsEvent {
  id: string;
  session_id: string;
  user_id: string | null;
  event_type: string;
  event_category: string | null;
  resource_type: string | null;
  resource_id: string | null;
  resource_slug: string | null;
  metadata: Record<string, any>;
  duration: number | null;
  created_at: string;
}

// Session storage key
const SESSION_STORAGE_KEY = 'canvasflow_session_id';

/**
 * Get or create session ID
 * Persists across page reloads but clears on browser close
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  
  if (!sessionId) {
    sessionId = nanoid();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Detect device information
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      osVersion: '',
      deviceType: 'desktop',
      screenWidth: 1920,
      screenHeight: 1080,
      language: 'en-US',
      timezone: 'UTC',
      userAgent: '',
    };
  }

  const parser = new UAParser();
  const result = parser.getResult();

  return {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || '',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || '',
    deviceType: result.device.type || 'desktop',
    deviceVendor: result.device.vendor,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language || 'en-US',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
  };
}

/**
 * Extract UTM parameters from URL
 */
export function extractUtmParams(): {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
} {
  if (typeof window === 'undefined') {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };
}

/**
 * Initialize analytics session
 * Creates or updates session in database
 */
export async function initializeAnalyticsSession(): Promise<string> {
  const supabase = createClient();
  const sessionId = getSessionId();
  const deviceInfo = detectDevice();
  const utmParams = extractUtmParams();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  // Check if session already exists
  const { data: existingSession } = await supabase
    .from('analytics_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (existingSession) {
    // Update last_seen_at
    await supabase
      .from('analytics_sessions')
      .update({
        last_seen_at: new Date().toISOString(),
        user_id: user?.id || null,
        is_guest: !user,
      })
      .eq('session_id', sessionId);
  } else {
    // Create new session
    await supabase
      .from('analytics_sessions')
      .insert({
        session_id: sessionId,
        user_id: user?.id || null,
        device_info: deviceInfo,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        screen_width: deviceInfo.screenWidth,
        screen_height: deviceInfo.screenHeight,
        language: deviceInfo.language,
        timezone: deviceInfo.timezone,
        referrer: typeof window !== 'undefined' ? document.referrer || null : null,
        ...utmParams,
        is_guest: !user,
      });
  }

  return sessionId;
}

/**
 * Track analytics event
 * @param eventType Type of event (e.g., 'page_view', 'folder_view')
 * @param options Event metadata
 */
export async function trackEvent(
  eventType: string,
  options?: {
    category?: string;
    resourceType?: string;
    resourceId?: string;
    resourceSlug?: string;
    metadata?: Record<string, any>;
    duration?: number;
  }
): Promise<void> {
  const supabase = createClient();
  const sessionId = getSessionId();

  // Get user if authenticated
  const { data: { user } } = await supabase.auth.getUser();

  await supabase
    .from('analytics_events')
    .insert({
      session_id: sessionId,
      user_id: user?.id || null,
      event_type: eventType,
      event_category: options?.category || null,
      resource_type: options?.resourceType || null,
      resource_id: options?.resourceId || null,
      resource_slug: options?.resourceSlug || null,
      metadata: options?.metadata || {},
      duration: options?.duration || null,
    });
}

/**
 * Track page view
 * @param path Page path
 * @param title Page title
 */
export async function trackPageView(path: string, title?: string): Promise<void> {
  await trackEvent('page_view', {
    category: 'navigation',
    metadata: { path, title },
  });
}

/**
 * Track folder view
 * @param folderId Folder ContentItem ID
 * @param folderTitle Folder title
 */
export async function trackFolderView(folderId: string, folderTitle: string): Promise<void> {
  await trackEvent('folder_view', {
    category: 'engagement',
    resourceType: 'folder',
    resourceId: folderId,
    metadata: { title: folderTitle },
  });
}

/**
 * Track shared folder view (via slug)
 * @param slug Shared folder slug
 * @param folderId Original folder ID
 * @param folderTitle Folder title
 */
export async function trackSharedFolderView(
  slug: string,
  folderId: string,
  folderTitle: string
): Promise<void> {
  await trackEvent('shared_folder_view', {
    category: 'engagement',
    resourceType: 'shared_folder',
    resourceId: folderId,
    resourceSlug: slug,
    metadata: { title: folderTitle },
  });
}

/**
 * Track item interaction
 * @param itemId ContentItem ID
 * @param itemType ContentItem type
 * @param action Action performed (e.g., 'click', 'play', 'share')
 */
export async function trackItemInteraction(
  itemId: string,
  itemType: string,
  action: string
): Promise<void> {
  await trackEvent('item_interaction', {
    category: 'engagement',
    resourceType: itemType,
    resourceId: itemId,
    metadata: { action },
  });
}

/**
 * Track social share
 * @param platform Social platform (e.g., 'twitter', 'facebook')
 * @param resourceId Resource being shared
 * @param resourceType Resource type
 */
export async function trackSocialShare(
  platform: string,
  resourceId: string,
  resourceType: string
): Promise<void> {
  await trackEvent('social_share', {
    category: 'conversion',
    resourceType,
    resourceId,
    metadata: { platform },
  });
}

/**
 * Track search
 * @param query Search query
 * @param resultsCount Number of results
 */
export async function trackSearch(query: string, resultsCount: number): Promise<void> {
  await trackEvent('search', {
    category: 'engagement',
    metadata: { query, resultsCount },
  });
}

/**
 * Get user analytics summary
 * @param userId User ID (defaults to current user)
 * @returns Analytics summary
 */
export async function getUserAnalyticsSummary(userId?: string) {
  const supabase = createClient();

  // Get user if not provided
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return null;

  // Get content stats
  const { data: contentStats } = await supabase
    .from('analytics_content_stats')
    .select('*')
    .eq('user_id', userId)
    .order('total_views', { ascending: false });

  // Get recent events
  const { data: recentEvents } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  // Get unique sessions
  const { data: sessions } = await supabase
    .from('analytics_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('first_seen_at', { ascending: false });

  return {
    contentStats: contentStats || [],
    recentEvents: recentEvents || [],
    sessions: sessions || [],
    totalViews: contentStats?.reduce((sum, stat) => sum + stat.total_views, 0) || 0,
    totalShares: contentStats?.reduce((sum, stat) => sum + stat.total_shares, 0) || 0,
    uniqueVisitors: sessions?.length || 0,
  };
}

/**
 * Get admin analytics summary (all users)
 * @returns Full system analytics
 */
export async function getAdminAnalyticsSummary() {
  const supabase = createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get total events
  const { count: totalEvents } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true });

  // Get total sessions
  const { count: totalSessions } = await supabase
    .from('analytics_sessions')
    .select('*', { count: 'exact', head: true });

  // Get guest vs user sessions
  const { count: guestSessions } = await supabase
    .from('analytics_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('is_guest', true);

  // Get top content
  const { data: topContent } = await supabase
    .from('analytics_content_stats')
    .select('*')
    .order('total_views', { ascending: false })
    .limit(10);

  // Get device breakdown
  const { data: sessions } = await supabase
    .from('analytics_sessions')
    .select('browser, os, device_info')
    .limit(1000);

  const deviceBreakdown = sessions?.reduce((acc, session) => {
    const deviceType = (session.device_info as any)?.deviceType || 'desktop';
    acc[deviceType] = (acc[deviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get browser breakdown
  const browserBreakdown = sessions?.reduce((acc, session) => {
    const browserType = (session.browser as any) || 'unknown';
    acc[browserType] = (acc[browserType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get recent events with all required fields
  const { data: recentEventsData } = await supabase
    .from('analytics_events')
    .select('id, event_type, event_category, resource_type, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    totalEvents: totalEvents || 0,
    totalSessions: totalSessions || 0,
    guestSessions: guestSessions || 0,
    userSessions: (totalSessions || 0) - (guestSessions || 0),
    topContent: topContent || [],
    deviceBreakdown: deviceBreakdown || {},
    browserBreakdown: browserBreakdown || {},
    recentEvents: (recentEventsData || []).map(event => ({
      id: event.id || '',
      event_type: event.event_type || '',
      event_category: event.event_category || null,
      resource_type: event.resource_type || null,
      created_at: event.created_at || '',
      user_id: event.user_id || null,
    })),
  };
}
