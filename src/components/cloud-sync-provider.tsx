/**
 * Cloud Sync Provider
 * Initializes and manages real-time sync with Supabase
 */

'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { CloudStorageInitializer } from '@/components/cloud-storage-initializer';

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const user = useAppStore((state) => state.user);
  const initializeCloudSync = useAppStore((state) => state.initializeCloudSync);
  const isSyncEnabled = useAppStore((state) => state.isSyncEnabled);

  useEffect(() => {
    if (user && !isSyncEnabled) {
      // Initialize cloud sync when user is available
      initializeCloudSync();
    }
  }, [user, isSyncEnabled, initializeCloudSync]);

  return (
    <>
      <CloudStorageInitializer />
      {children}
    </>
  );
}
