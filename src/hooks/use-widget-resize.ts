/**
 * useWidgetResize Hook
 * 
 * Monitors widget container size changes and triggers responsive updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { WidgetSize } from '@/lib/widget-sizes';
import { calculateWidgetSizeFromWidth } from '@/lib/widget-viewport-utils';

export interface WidgetResizeData {
  width: number;
  height: number;
  size: WidgetSize;
}

export function useWidgetResize(
  onResize?: (data: WidgetResizeData) => void,
  dependencies: any[] = []
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<WidgetResizeData>({
    width: 0,
    height: 0,
    size: 'M',
  });
  const lastSizeRef = useRef<WidgetSize>('M');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use ResizeObserver to monitor dimension changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Calculate new size based on width
        const newSize = calculateWidgetSizeFromWidth(width);
        
        // Update state
        setDimensions({
          width: Math.round(width),
          height: Math.round(height),
          size: newSize,
        });

        // Trigger callback only if size category changed
        if (newSize !== lastSizeRef.current && onResize) {
          onResize({
            width: Math.round(width),
            height: Math.round(height),
            size: newSize,
          });
          lastSizeRef.current = newSize;
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onResize, ...dependencies]);

  return {
    containerRef,
    ...dimensions,
  };
}

/**
 * useViewportResize Hook
 * 
 * Monitors viewport/window size changes
 */
export function useViewportResize(
  onResize?: (width: number, height: number) => void,
  debounceMs: number = 300
) {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
  });
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        setViewport({ width, height });

        if (onResize) {
          onResize(width, height);
        }
      }, debounceMs);
    };

    // Initial setup
    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onResize, debounceMs]);

  return viewport;
}
