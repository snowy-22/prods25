import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * Hook to manage background tab suspension and media/timer exemptions
 * Detects active media players and timers to prevent suspension
 */
export function useBackgroundTabManager(tabId: string, activeViewId: string, items: any[]) {
  const updateTabMediaState = useAppStore(s => s.updateTabMediaState);
  const isSuspended = useAppStore(s => s.tabs.find(t => t.id === tabId)?.isSuspended);
  const intervalRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  useEffect(() => {
    // Detect active media (video/audio/website players) - her zaman çalışır
    const hasActiveMedia = items.some(item => 
      ['video', 'audio', 'player', 'website', 'iframe'].includes(item.type) ||
      (item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be') || 
                    item.url.includes('twitch.tv') || item.url.includes('spotify.com')))
    );

    // Detect active timers/clocks
    const hasActiveTimer = items.some(item =>
      item.type === 'widget' && [
        'clock',
        'world-clock',
        'stopwatch',
        'timer',
        'countdown',
        'alarm-clock',
        'gradient-clock',
        'astronomical-clock'
      ].includes(item.widgetType)
    );

    updateTabMediaState(tabId, hasActiveMedia, hasActiveTimer);
  }, [items, tabId, updateTabMediaState]);

  // Suspend intervals when tab is suspended
  useEffect(() => {
    if (isSuspended) {
      // Clear all intervals
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current.clear();
    }
  }, [isSuspended]);

  return {
    isSuspended,
    registerInterval: (interval: NodeJS.Timeout) => {
      intervalRefs.current.add(interval);
      return () => {
        clearInterval(interval);
        intervalRefs.current.delete(interval);
      };
    }
  };
}
