/**
 * 4 Aşamalı Boyutlandırma Sistemi
 * S/M/L/XL boyutları için logaritmik geçiş ve tutarlı boyutlandırma
 */

export type SizePreset = 'S' | 'M' | 'L' | 'XL';

export interface SizingConfig {
  gridSize: number;        // Grid hücre boyutu (px)
  minWidth: number;        // Minimum genişlik (px)
  maxWidth: number;        // Maximum genişlik (px)
  minHeight: number;       // Minimum yükseklik (px)
  maxHeight: number;       // Maximum yükseklik (px)
  fontSize: {
    base: string;          // Temel font boyutu (rem)
    heading: string;       // Başlık font boyutu (rem)
    small: string;         // Küçük font boyutu (rem)
  };
  spacing: {
    padding: string;       // İç boşluk (rem)
    gap: string;          // Elemanlar arası boşluk (rem)
    margin: string;       // Dış boşluk (rem)
  };
  iconSize: {
    small: number;        // Küçük ikon boyutu (px)
    medium: number;       // Orta ikon boyutu (px)
    large: number;        // Büyük ikon boyutu (px)
  };
  borderRadius: string;   // Köşe yuvarlaklığı (rem)
  scale: number;          // Genel ölçek faktörü (1.0 = %100)
}

/**
 * S/M/L/XL boyutları için logaritmik ölçeklendirme
 * Formül: size = baseSize × (scaleFactor ^ level)
 * S (level 0) → M (level 1) → L (level 2) → XL (level 3)
 */
export const SIZING_PRESETS: Record<SizePreset, SizingConfig> = {
  S: {
    gridSize: 180,
    minWidth: 120,
    maxWidth: 240,
    minHeight: 120,
    maxHeight: 240,
    fontSize: {
      base: '0.75rem',    // 12px
      heading: '0.875rem', // 14px
      small: '0.625rem'   // 10px
    },
    spacing: {
      padding: '0.5rem',  // 8px
      gap: '0.25rem',     // 4px
      margin: '0.25rem'   // 4px
    },
    iconSize: {
      small: 12,
      medium: 16,
      large: 20
    },
    borderRadius: '0.25rem', // 4px
    scale: 0.7
  },
  M: {
    gridSize: 280,
    minWidth: 200,
    maxWidth: 400,
    minHeight: 200,
    maxHeight: 400,
    fontSize: {
      base: '0.875rem',   // 14px
      heading: '1rem',     // 16px
      small: '0.75rem'    // 12px
    },
    spacing: {
      padding: '0.75rem', // 12px
      gap: '0.5rem',      // 8px
      margin: '0.5rem'    // 8px
    },
    iconSize: {
      small: 16,
      medium: 20,
      large: 24
    },
    borderRadius: '0.375rem', // 6px
    scale: 1.0
  },
  L: {
    gridSize: 420,
    minWidth: 320,
    maxWidth: 640,
    minHeight: 320,
    maxHeight: 640,
    fontSize: {
      base: '1rem',       // 16px
      heading: '1.25rem', // 20px
      small: '0.875rem'   // 14px
    },
    spacing: {
      padding: '1rem',    // 16px
      gap: '0.75rem',     // 12px
      margin: '0.75rem'   // 12px
    },
    iconSize: {
      small: 20,
      medium: 24,
      large: 32
    },
    borderRadius: '0.5rem', // 8px
    scale: 1.5
  },
  XL: {
    gridSize: 640,
    minWidth: 480,
    maxWidth: 960,
    minHeight: 480,
    maxHeight: 960,
    fontSize: {
      base: '1.25rem',    // 20px
      heading: '1.5rem',  // 24px
      small: '1rem'       // 16px
    },
    spacing: {
      padding: '1.5rem',  // 24px
      gap: '1rem',        // 16px
      margin: '1rem'      // 16px
    },
    iconSize: {
      small: 24,
      medium: 32,
      large: 40
    },
    borderRadius: '0.75rem', // 12px
    scale: 2.3
  }
};

/**
 * Pixel değerini en yakın boyut preset'ine dönüştürür
 */
export function pixelToSizePreset(pixels: number): SizePreset {
  if (pixels <= 230) return 'S';
  if (pixels <= 350) return 'M';
  if (pixels <= 530) return 'L';
  return 'XL';
}

/**
 * Boyut preset'inden pixel değeri döndürür
 */
export function sizePresetToPixel(preset: SizePreset): number {
  return SIZING_PRESETS[preset].gridSize;
}

/**
 * Bir sonraki boyut preset'ini döndürür (zoom in)
 */
export function getNextSizePreset(current: SizePreset): SizePreset {
  const order: SizePreset[] = ['S', 'M', 'L', 'XL'];
  const currentIndex = order.indexOf(current);
  return order[Math.min(currentIndex + 1, order.length - 1)];
}

/**
 * Bir önceki boyut preset'ini döndürür (zoom out)
 */
export function getPreviousSizePreset(current: SizePreset): SizePreset {
  const order: SizePreset[] = ['S', 'M', 'L', 'XL'];
  const currentIndex = order.indexOf(current);
  return order[Math.max(currentIndex - 1, 0)];
}

/**
 * Grid span değerlerini boyut preset'ine göre ayarlar
 * S: max 2×2, M: max 3×3, L: max 4×4, XL: max 6×6
 */
export function getMaxGridSpan(preset: SizePreset): { col: number; row: number } {
  switch (preset) {
    case 'S':
      return { col: 2, row: 2 };
    case 'M':
      return { col: 3, row: 3 };
    case 'L':
      return { col: 4, row: 4 };
    case 'XL':
      return { col: 6, row: 6 };
  }
}

/**
 * Boyut preset'ine göre CSS değişkenlerini döndürür (Tailwind uyumlu)
 */
export function getSizingCSSVars(preset: SizePreset): Record<string, string> {
  const config = SIZING_PRESETS[preset];
  return {
    '--grid-size': `${config.gridSize}px`,
    '--min-width': `${config.minWidth}px`,
    '--max-width': `${config.maxWidth}px`,
    '--min-height': `${config.minHeight}px`,
    '--max-height': `${config.maxHeight}px`,
    '--font-base': config.fontSize.base,
    '--font-heading': config.fontSize.heading,
    '--font-small': config.fontSize.small,
    '--spacing-padding': config.spacing.padding,
    '--spacing-gap': config.spacing.gap,
    '--spacing-margin': config.spacing.margin,
    '--icon-small': `${config.iconSize.small}px`,
    '--icon-medium': `${config.iconSize.medium}px`,
    '--icon-large': `${config.iconSize.large}px`,
    '--border-radius': config.borderRadius,
    '--scale': config.scale.toString()
  };
}

/**
 * Responsive boyutlandırma: Ekran boyutuna göre preset ayarla
 */
export function getResponsiveSizePreset(
  basePreset: SizePreset,
  screenWidth: number
): SizePreset {
  // Mobil: 1 seviye küçült
  if (screenWidth < 768) {
    return getPreviousSizePreset(basePreset);
  }
  // Tablet: Aynı bırak
  if (screenWidth < 1024) {
    return basePreset;
  }
  // Desktop: Aynı bırak veya 1 büyüt (kullanıcı tercihi)
  return basePreset;
}

/**
 * Mini harita/kapak için özel boyutlar
 */
export const MINIMAP_SIZES: Record<SizePreset, { width: number; height: number }> = {
  S: { width: 140, height: 96 },   // 2×3 grid için
  M: { width: 180, height: 140 },  // 3×4 grid için
  L: { width: 220, height: 180 },  // 4×5 grid için
  XL: { width: 180, height: 220 }  // 4×6 grid için (scrollable)
};
