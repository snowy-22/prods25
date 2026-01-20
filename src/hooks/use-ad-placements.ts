'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * Hook to determine ad placement positions in a content grid/canvas
 * Returns positions where ads should be inserted (0-indexed)
 * 
 * Example: For a page with 20 items and 3 ads:
 * - Ad positions might be: [4, 10, 16] (after every ~5-6 content items)
 */
export function useAdPlacements(totalItems: number, maxAds: number = 4): number[] {
  const userSubscriptionTier = useAppStore((state) => state.userSubscriptionTier);
  
  return useMemo(() => {
    // Only show ads for free and guest tiers
    if (userSubscriptionTier !== 'free' && userSubscriptionTier !== 'guest') {
      return [];
    }
    
    // No ads if no content
    if (totalItems < 3) {
      return [];
    }
    
    // Calculate ad positions: distribute evenly through content
    // Don't show more than maxAds
    const numAds = Math.min(maxAds, Math.floor(totalItems / 4));
    const positions: number[] = [];
    
    if (numAds <= 0) return [];
    
    // Space ads evenly
    const spacing = Math.floor(totalItems / (numAds + 1));
    
    for (let i = 1; i <= numAds; i++) {
      const position = spacing * i;
      if (position < totalItems) {
        positions.push(position);
      }
    }
    
    return positions;
  }, [totalItems, maxAds, userSubscriptionTier]);
}

/**
 * Hook to check if current user should see ads
 */
export function useShowAds(): boolean {
  const userSubscriptionTier = useAppStore((state) => state.userSubscriptionTier);
  return userSubscriptionTier === 'free' || userSubscriptionTier === 'guest';
}

/**
 * Get the number of ads to show per page based on tier
 */
export function useAdsPerPage(): number {
  const userSubscriptionTier = useAppStore((state) => state.userSubscriptionTier);
  
  switch (userSubscriptionTier) {
    case 'guest':
      return 4; // More ads for guests
    case 'free':
      return 3; // Slightly fewer for registered free users
    default:
      return 0; // No ads for paid tiers
  }
}

/**
 * Interleave content items with ad slots
 * Returns a new array with ads inserted at calculated positions
 */
export function useInterleavedContent<T>(
  items: T[],
  createAdItem: (index: number) => T
): T[] {
  const adPositions = useAdPlacements(items.length);
  
  return useMemo(() => {
    if (adPositions.length === 0) return items;
    
    const result: T[] = [];
    let adIndex = 0;
    
    items.forEach((item, idx) => {
      result.push(item);
      
      // Check if we should insert an ad after this item
      if (adPositions.includes(idx + 1) && adIndex < adPositions.length) {
        result.push(createAdItem(adIndex));
        adIndex++;
      }
    });
    
    return result;
  }, [items, adPositions, createAdItem]);
}
