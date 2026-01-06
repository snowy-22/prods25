/**
 * useAnalytics Hook
 * 
 * React hook for easy analytics tracking
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  initializeAnalyticsSession,
  trackEvent,
  trackPageView,
  trackFolderView,
  trackSharedFolderView,
  trackItemInteraction,
  trackSocialShare,
  trackSearch,
  getUserAnalyticsSummary,
  getSessionId,
} from '@/lib/analytics';
import { usePathname } from 'next/navigation';

export interface UseAnalyticsReturn {
  sessionId: string;
  isInitialized: boolean;
  trackEvent: typeof trackEvent;
  trackPageView: typeof trackPageView;
  trackFolderView: typeof trackFolderView;
  trackSharedFolderView: typeof trackSharedFolderView;
  trackItemInteraction: typeof trackItemInteraction;
  trackSocialShare: typeof trackSocialShare;
  trackSearch: typeof trackSearch;
  getUserAnalytics: typeof getUserAnalyticsSummary;
}

/**
 * Main analytics hook
 * Automatically initializes session and tracks page views
 */
export function useAnalytics(options?: {
  autoTrackPageViews?: boolean;
  autoInitialize?: boolean;
}): UseAnalyticsReturn {
  const pathname = usePathname();
  const [sessionId, setSessionId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  const autoTrackPageViews = options?.autoTrackPageViews ?? true;
  const autoInitialize = options?.autoInitialize ?? true;

  // Initialize session on mount
  useEffect(() => {
    if (!autoInitialize) return;

    const initialize = async () => {
      try {
        const sid = await initializeAnalyticsSession();
        setSessionId(sid);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    };

    initialize();
  }, [autoInitialize]);

  // Auto-track page views
  useEffect(() => {
    if (!isInitialized || !autoTrackPageViews) return;

    const pageTitle = document?.title || pathname;
    trackPageView(pathname, pageTitle);
  }, [pathname, isInitialized, autoTrackPageViews]);

  return {
    sessionId,
    isInitialized,
    trackEvent,
    trackPageView,
    trackFolderView,
    trackSharedFolderView,
    trackItemInteraction,
    trackSocialShare,
    trackSearch,
    getUserAnalytics: getUserAnalyticsSummary,
  };
}

/**
 * Hook for tracking time spent on a resource
 * Returns a function to stop tracking
 */
export function useTimeTracking(
  resourceId: string,
  resourceType: string
): () => Promise<void> {
  const startTimeRef = useState<number>(Date.now())[0];

  const stopTracking = useCallback(async () => {
    const duration = Date.now() - startTimeRef;
    
    await trackEvent('time_spent', {
      category: 'engagement',
      resourceType,
      resourceId,
      duration,
    });
  }, [startTimeRef, resourceType, resourceId]);

  // Auto-stop on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return stopTracking;
}

/**
 * Hook for tracking scroll depth
 */
export function useScrollTracking(resourceId: string, resourceType: string) {
  const [maxScrollDepth, setMaxScrollDepth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      if (scrollPercent > maxScrollDepth) {
        setMaxScrollDepth(scrollPercent);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [maxScrollDepth]);

  // Track on unmount
  useEffect(() => {
    return () => {
      if (maxScrollDepth > 0) {
        trackEvent('scroll_depth', {
          category: 'engagement',
          resourceType,
          resourceId,
          metadata: { maxScrollDepth },
        });
      }
    };
  }, [maxScrollDepth, resourceType, resourceId]);
}

/**
 * Hook for tracking visibility (when tab/window is visible)
 */
export function useVisibilityTracking(resourceId: string, resourceType: string) {
  useEffect(() => {
    let visibleStartTime = Date.now();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden - track time visible
        const visibleDuration = Date.now() - visibleStartTime;
        trackEvent('visibility_hidden', {
          category: 'engagement',
          resourceType,
          resourceId,
          duration: visibleDuration,
        });
      } else {
        // Tab became visible again
        visibleStartTime = Date.now();
        trackEvent('visibility_visible', {
          category: 'engagement',
          resourceType,
          resourceId,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [resourceType, resourceId]);
}

/**
 * Hook to get session ID without full analytics
 */
export function useSessionId(): string {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  return sessionId;
}
