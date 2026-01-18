'use client';

import { useEffect } from 'react';
import { useCloudStorage } from '@/lib/use-cloud-storage';

/**
 * Cloud Storage Initializer
 * This component initializes cloud storage when the app mounts
 */
export function CloudStorageInitializer() {
  // The hook handles all initialization
  useCloudStorage();

  return null; // This component doesn't render anything
}
