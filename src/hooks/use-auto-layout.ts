'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ContentItem } from '@/lib/initial-content';

// Determine optimal layout mode based on content type and screen size
export function useAutoLayoutMode(items: ContentItem[]) {
  const { layoutMode, setLayoutMode } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Determine optimal mode
  useEffect(() => {
    if (items.length === 0) return;

    // Content types that work better in canvas mode
    const canvasContentTypes = [
      'device',
      'space',
      'signage',
      'dashboard',
      'gallery',
      'board'
    ];

    // Content types that work better in grid mode
    const gridContentTypes = [
      'folder',
      'list',
      'inventory',
      'calendar',
      'table',
      'notes'
    ];

    // Check if content has mixed types
    const contentTypes = items.map(item => item.type);
    const hasCanvasContent = contentTypes.some(type => canvasContentTypes.includes(type));
    const hasGridContent = contentTypes.some(type => gridContentTypes.includes(type));

    // Decide mode
    let optimalMode: 'grid' | 'canvas' = 'grid';

    if (hasCanvasContent && !hasGridContent) {
      optimalMode = 'canvas';
    } else if (hasGridContent && hasCanvasContent && isMobile) {
      optimalMode = 'canvas'; // Mobile: use canvas for flexibility
    } else if (!hasGridContent && hasCanvasContent) {
      optimalMode = 'canvas';
    } else {
      optimalMode = 'grid'; // Default to grid
    }

    // Only change if different
    if (layoutMode !== optimalMode) {
      setLayoutMode(optimalMode);
    }
  }, [items, isMobile, layoutMode, setLayoutMode]);

  return { isMobile, optimalMode: layoutMode };
}

// Get recommended grid span based on content type
export function getOptimalGridSpan(item: ContentItem): { col: number; row: number } {
  const type = item.type;

  const spanMap: Record<string, { col: number; row: number }> = {
    // Large items
    'device': { col: 2, row: 2 },
    'space': { col: 2, row: 2 },
    'dashboard': { col: 2, row: 2 },
    'signage': { col: 2, row: 2 },
    'gallery': { col: 2, row: 2 },

    // Medium items
    'folder': { col: 1, row: 1 },
    'list': { col: 1, row: 1 },
    'calendar': { col: 2, row: 1 },
    'notes': { col: 1, row: 1 },

    // Small items
    'widget': { col: 1, row: 1 },
    'clock': { col: 1, row: 1 },
    'todo': { col: 1, row: 1 },
    'counter': { col: 1, row: 1 },

    // Video
    'video': { col: 1, row: 1 },
    'youtube': { col: 1, row: 1 },
    'iframe': { col: 2, row: 2 },
  };

  return spanMap[type] || { col: 1, row: 1 };
}

// Check if content should open in canvas mode
export function shouldOpenInCanvas(item: ContentItem): boolean {
  const canvasTypes = [
    'device',
    'space',
    'signage',
    'dashboard',
    'gallery',
    'board',
    'organization',
    'profile'
  ];

  return canvasTypes.includes(item.type);
}

// Check if content is a content group (folder with specific types)
export function isContentGroup(item: ContentItem): boolean {
  if (item.type !== 'folder') return false;

  const groupTypes = ['videos', 'images', 'documents', 'saved-items', 'awards'];
  return groupTypes.some(type => item.title?.toLowerCase().includes(type) || item.type === type);
}

// Get grid columns based on screen size
export function getResponsiveGridColumns(): number {
  if (typeof window === 'undefined') return 4;

  const width = window.innerWidth;

  if (width < 640) return 2; // Mobile
  if (width < 1024) return 3; // Tablet
  if (width < 1536) return 4; // Desktop
  return 6; // Large desktop
}
