/**
 * Cloud Storage Hook
 * Initialize and manage cloud storage for personal folders and players
 */

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function useCloudStorage() {
  const {
    user,
    initializeCloudStorage,
    subscribeToStorageChanges,
  } = useAppStore();

  useEffect(() => {
    if (!user) return;

    // Initialize cloud storage when user logs in
    initializeCloudStorage().catch(console.error);

    // Subscribe to storage changes
    const unsubscribe = subscribeToStorageChanges();

    return () => {
      unsubscribe?.();
    };
  }, [user, initializeCloudStorage, subscribeToStorageChanges]);
}

/**
 * Get formatted storage size
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get storage color based on usage percentage
 */
export function getStorageColor(percent: number): string {
  if (percent < 50) return 'text-green-600 dark:text-green-400';
  if (percent < 80) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'videos': '🎬',
    'images': '🖼️',
    'widgets': '🎨',
    'files': '📄',
    'other': '📦',
  };
  return icons[category] || '📦';
}
