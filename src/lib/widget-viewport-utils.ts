/**
 * Widget Viewport Sizing Utilities
 * 
 * Provides helper functions for responsive widget sizing and viewport calculations
 */

import { ContentItem } from './initial-content';
import { WidgetSize, toWidgetSize, WIDGET_SIZES } from './widget-sizes';

export interface ViewportDimensions {
  width: number;
  height: number;
  scale: number;
}

export interface WidgetViewportConfig {
  size: WidgetSize;
  containerWidth: number;
  containerHeight: number;
  itemWidth: number;
  itemHeight: number;
  isResponsive: boolean;
}

/**
 * Calculate appropriate widget size based on container dimensions
 * @param containerWidth The width of the container in pixels
 * @param itemWidth Optional item width to use for calculation
 * @returns The appropriate WidgetSize
 */
export function calculateWidgetSizeFromWidth(containerWidth: number, itemWidth?: number): WidgetSize {
  const effectiveWidth = itemWidth || containerWidth;
  
  // Use precise width thresholds from WIDGET_SIZES
  if (effectiveWidth >= 800) return 'XL';
  if (effectiveWidth >= 600) return 'L';
  if (effectiveWidth >= 400) return 'M';
  if (effectiveWidth >= 300) return 'S';
  return 'XS';
}

/**
 * Get recommended dimensions for a widget size
 */
export function getRecommendedDimensions(size: WidgetSize) {
  const config = WIDGET_SIZES[size];
  return {
    width: config.width,
    height: config.height,
    minWidth: Math.floor(config.width * 0.8),
    minHeight: Math.floor(config.height * 0.8),
    maxWidth: Math.floor(config.width * 1.2),
    maxHeight: Math.floor(config.height * 1.2),
  };
}

/**
 * Validate and normalize item dimensions
 */
export function normalizeItemDimensions(item: ContentItem, containerWidth: number): {
  width: number;
  height: number;
  size: WidgetSize;
} {
  // Get width from item properties
  const itemWidth = item.width || 
                    (item.styles?.width ? parseInt(item.styles.width as string) : null) ||
                    WIDGET_SIZES.M.width;
  
  const itemHeight = item.height ||
                     (item.styles?.height ? parseInt(item.styles.height as string) : null) ||
                     WIDGET_SIZES.M.height;
  
  // Ensure dimensions don't exceed container
  const constrainedWidth = Math.min(itemWidth, containerWidth * 0.95);
  const constrainedHeight = Math.max(itemHeight, 100); // Minimum height of 100px
  
  // Calculate size based on constrained width
  const size = calculateWidgetSizeFromWidth(constrainedWidth, constrainedWidth);
  
  return {
    width: Math.round(constrainedWidth),
    height: Math.round(constrainedHeight),
    size,
  };
}

/**
 * Handle viewport resize for widgets
 * Recalculates size category when viewport dimensions change
 */
export function handleViewportResize(
  item: ContentItem,
  newViewportWidth: number,
  oldViewportWidth: number
): Partial<ContentItem> | null {
  // If viewport width changed significantly (>50px), recalculate
  if (Math.abs(newViewportWidth - oldViewportWidth) < 50) {
    return null;
  }
  
  const newSize = calculateWidgetSizeFromWidth(newViewportWidth, item.width);
  const oldSize = calculateWidgetSizeFromWidth(oldViewportWidth, item.width);
  
  // Only update if size category changed
  if (newSize === oldSize) {
    return null;
  }
  
  return {
    styles: {
      ...item.styles,
      // Could trigger resize here if needed
    },
  };
}

/**
 * Validate widget dimensions and apply constraints
 */
export function validateWidgetDimensions(
  item: ContentItem,
  containerWidth: number,
  containerHeight: number
): { width: string; height: string } {
  const minWidth = 120;
  const minHeight = 100;
  const maxWidth = Math.floor(containerWidth * 0.95);
  const maxHeight = Math.floor(containerHeight * 0.95);
  
  let width = item.width || 320;
  let height = item.height || 240;
  
  // Apply constraints
  width = Math.max(minWidth, Math.min(width, maxWidth));
  height = Math.max(minHeight, Math.min(height, maxHeight));
  
  return {
    width: `${width}px`,
    height: `${height}px`,
  };
}

/**
 * Calculate scale factor for responsive widgets
 */
export function calculateWidgetScale(
  baseWidth: number,
  currentWidth: number,
  baseHeight: number,
  currentHeight: number
): number {
  const scaleX = currentWidth / baseWidth;
  const scaleY = currentHeight / baseHeight;
  
  // Use average of both scales, with reasonable limits
  const scale = Math.max(0.5, Math.min(2, (scaleX + scaleY) / 2));
  return Math.round(scale * 100) / 100;
}

/**
 * Get viewport configuration for a widget
 */
export function getWidgetViewportConfig(
  item: ContentItem,
  containerWidth: number,
  containerHeight: number
): WidgetViewportConfig {
  const { width, height, size } = normalizeItemDimensions(item, containerWidth);
  
  return {
    size,
    containerWidth,
    containerHeight,
    itemWidth: width,
    itemHeight: height,
    isResponsive: true,
  };
}
