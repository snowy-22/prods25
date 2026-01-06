/**
 * Unified Widget Responsive Size System
 * 
 * 5 responsive presets (XS, S, M, L, XL) for all 62 widgets
 * User requirement: "minimum 5 farklı boyutta maksimum fonksiyonu sunabilsinler"
 */

export const WIDGET_SIZES = {
  XS: {
    width: 200,
    height: 150,
    label: 'Extra Small',
    displayLabel: 'XS',
    // Size-dependent features
    showSeconds: false,
    showTimezone: false,
    showExtendedInfo: false,
    fontSize: 'text-sm',
    iconSize: 'h-4 w-4',
    padding: 'p-2',
    gap: 'gap-1',
  },
  S: {
    width: 300,
    height: 200,
    label: 'Small',
    displayLabel: 'S',
    showSeconds: false,
    showTimezone: false,
    showExtendedInfo: false,
    fontSize: 'text-base',
    iconSize: 'h-5 w-5',
    padding: 'p-3',
    gap: 'gap-2',
  },
  M: {
    width: 400,
    height: 300,
    label: 'Medium',
    displayLabel: 'M',
    showSeconds: true,
    showTimezone: false,
    showExtendedInfo: true,
    fontSize: 'text-lg',
    iconSize: 'h-6 w-6',
    padding: 'p-4',
    gap: 'gap-3',
  },
  L: {
    width: 600,
    height: 400,
    label: 'Large',
    displayLabel: 'L',
    showSeconds: true,
    showTimezone: true,
    showExtendedInfo: true,
    fontSize: 'text-xl',
    iconSize: 'h-8 w-8',
    padding: 'p-6',
    gap: 'gap-4',
  },
  XL: {
    width: 800,
    height: 600,
    label: 'Extra Large',
    displayLabel: 'XL',
    showSeconds: true,
    showTimezone: true,
    showExtendedInfo: true,
    fontSize: 'text-2xl',
    iconSize: 'h-10 w-10',
    padding: 'p-8',
    gap: 'gap-5',
  },
} as const;

export type WidgetSize = keyof typeof WIDGET_SIZES;

export const DEFAULT_WIDGET_SIZE: WidgetSize = 'M';

/**
 * Get size configuration with fallback
 */
export function getWidgetSizeConfig(size: WidgetSize = DEFAULT_WIDGET_SIZE) {
  // Validate size is valid WidgetSize type
  const validSizes = Object.keys(WIDGET_SIZES) as WidgetSize[];
  const safeSize = validSizes.includes(size) ? size : DEFAULT_WIDGET_SIZE;
  return WIDGET_SIZES[safeSize];
}

/**
 * Get responsive classes for a given size
 */
export function getWidgetSizeClasses(size: WidgetSize = DEFAULT_WIDGET_SIZE) {
  const config = getWidgetSizeConfig(size); // Use defensive config getter
  return {
    fontSize: config.fontSize,
    iconSize: config.iconSize,
    padding: config.padding,
    gap: config.gap,
  };
}

/**
 * Type guard to validate WidgetSize
 */
export function isValidWidgetSize(value: any): value is WidgetSize {
  return Object.keys(WIDGET_SIZES).includes(value);
}

/**
 * Safe size conversion from string or unknown value
 */
export function toWidgetSize(value: any): WidgetSize {
  if (isValidWidgetSize(value)) {
    return value;
  }
  return DEFAULT_WIDGET_SIZE;
}

/**
 * Size-dependent feature flags
 */
export function getWidgetFeatureFlags(size: WidgetSize = DEFAULT_WIDGET_SIZE) {
  const config = getWidgetSizeConfig(size); // Use defensive config getter
  return {
    showSeconds: config.showSeconds,
    showTimezone: config.showTimezone,
    showExtendedInfo: config.showExtendedInfo,
  };
}

/**
 * Player-specific sizing (for center alignment)
 */
export const PLAYER_SIZES = {
  XS: { width: '160px', height: '90px', controls: 'compact' },
  S: { width: '240px', height: '135px', controls: 'minimal' },
  M: { width: '320px', height: '180px', controls: 'standard' },
  L: { width: '480px', height: '270px', controls: 'full' },
  XL: { width: '640px', height: '360px', controls: 'extended' },
} as const;

export function getPlayerSize(size: WidgetSize = DEFAULT_WIDGET_SIZE) {
  const validSizes = Object.keys(PLAYER_SIZES) as WidgetSize[];
  const safeSize = validSizes.includes(size) ? size : DEFAULT_WIDGET_SIZE;
  return PLAYER_SIZES[safeSize];
}
