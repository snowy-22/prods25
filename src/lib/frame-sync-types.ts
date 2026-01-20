/**
 * Frame Dance & Sync Types
 * Philips Hue style frame sync and choreographed animations
 */

// ============= SYNC FRAME TYPES =============

export type SyncMode = 'audio' | 'video' | 'audio-video' | 'off';
export type FrameScope = 'single' | 'all-players' | 'selected';
export type VideoSource = 'full-screen' | 'single-player' | 'average';

export interface SyncFrameConfig {
  enabled: boolean;
  mode: SyncMode;
  scope: FrameScope;
  videoSource: VideoSource;
  selectedPlayerId?: string;
  intensity: number; // 0-100
  smoothing: number; // 0-100 (higher = smoother transitions)
  colorMapping: 'frequency' | 'brightness' | 'hue-shift' | 'dominant';
  borderWidth: number; // 1-20px
  glowEnabled: boolean;
  glowIntensity: number; // 0-100
  pulseEnabled: boolean;
  pulseSpeed: number; // 0.5-3x
}

export interface SyncFrameState {
  currentColor: { r: number; g: number; b: number };
  brightness: number;
  isActive: boolean;
  lastUpdate: number;
}

// ============= FRAME DANCE TYPES =============

export type DancePattern = 
  | 'checkerboard'      // Damalı bayrak
  | 'rainbow'           // Gökkuşağı
  | 'wave'              // Dalga
  | 'pulse'             // Nabız
  | 'countdown'         // Geri sayım
  | 'stadium-cards'     // Tribün şölen kartları
  | 'flag'              // Bayrak renkleri
  | 'strobe'            // Stroboskop
  | 'breathing'         // Nefes alma
  | 'cascade'           // Kademeli geçiş
  | 'random-sparkle'    // Rastgele parıltı
  | 'gradient-sweep';   // Gradyan süpürme

export type FlagPreset = 
  | 'turkey'      // 🇹🇷
  | 'usa'         // 🇺🇸
  | 'germany'     // 🇩🇪
  | 'france'      // 🇫🇷
  | 'italy'       // 🇮🇹
  | 'spain'       // 🇪🇸
  | 'uk'          // 🇬🇧
  | 'japan'       // 🇯🇵
  | 'brazil'      // 🇧🇷
  | 'custom';

export interface FlagColors {
  colors: Array<{ r: number; g: number; b: number }>;
  name: string;
  emoji: string;
}

export const FLAG_PRESETS: Record<FlagPreset, FlagColors> = {
  turkey: { colors: [{ r: 255, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }], name: 'Türkiye', emoji: '🇹🇷' },
  usa: { colors: [{ r: 255, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 255 }], name: 'USA', emoji: '🇺🇸' },
  germany: { colors: [{ r: 0, g: 0, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 255, g: 204, b: 0 }], name: 'Germany', emoji: '🇩🇪' },
  france: { colors: [{ r: 0, g: 85, b: 164 }, { r: 255, g: 255, b: 255 }, { r: 239, g: 65, b: 53 }], name: 'France', emoji: '🇫🇷' },
  italy: { colors: [{ r: 0, g: 140, b: 69 }, { r: 255, g: 255, b: 255 }, { r: 205, g: 33, b: 42 }], name: 'Italy', emoji: '🇮🇹' },
  spain: { colors: [{ r: 170, g: 21, b: 27 }, { r: 241, g: 191, b: 0 }], name: 'Spain', emoji: '🇪🇸' },
  uk: { colors: [{ r: 1, g: 33, b: 105 }, { r: 255, g: 255, b: 255 }, { r: 200, g: 16, b: 46 }], name: 'UK', emoji: '🇬🇧' },
  japan: { colors: [{ r: 255, g: 255, b: 255 }, { r: 188, g: 0, b: 45 }], name: 'Japan', emoji: '🇯🇵' },
  brazil: { colors: [{ r: 0, g: 156, b: 59 }, { r: 254, g: 223, b: 0 }, { r: 0, g: 39, b: 118 }], name: 'Brazil', emoji: '🇧🇷' },
  custom: { colors: [{ r: 255, g: 255, b: 255 }], name: 'Custom', emoji: '🎨' }
};

export interface DanceConfig {
  pattern: DancePattern;
  speed: number; // 0.5-5x
  intensity: number; // 0-100
  direction: 'forward' | 'backward' | 'alternate';
  colors: Array<{ r: number; g: number; b: number }>;
  flagPreset?: FlagPreset;
  countdownFrom?: number; // For countdown pattern
  syncWithAudio: boolean;
  loopCount: number; // 0 = infinite
}

export interface DanceState {
  isPlaying: boolean;
  currentFrame: number;
  elapsedMs: number;
  loopsCompleted: number;
}

// ============= DEFAULT CONFIGS =============

export const DEFAULT_SYNC_CONFIG: SyncFrameConfig = {
  enabled: false,
  mode: 'audio',
  scope: 'single',
  videoSource: 'single-player',
  intensity: 70,
  smoothing: 50,
  colorMapping: 'frequency',
  borderWidth: 4,
  glowEnabled: true,
  glowIntensity: 50,
  pulseEnabled: false,
  pulseSpeed: 1
};

export const DEFAULT_DANCE_CONFIG: DanceConfig = {
  pattern: 'rainbow',
  speed: 1,
  intensity: 80,
  direction: 'forward',
  colors: [
    { r: 255, g: 0, b: 0 },
    { r: 255, g: 127, b: 0 },
    { r: 255, g: 255, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 75, g: 0, b: 130 },
    { r: 148, g: 0, b: 211 }
  ],
  syncWithAudio: false,
  loopCount: 0
};

// ============= DANCE PATTERN PRESETS =============

export interface DancePreset {
  id: string;
  name: string;
  nametr: string;
  icon: string;
  config: Partial<DanceConfig>;
}

export const DANCE_PRESETS: DancePreset[] = [
  {
    id: 'checkerboard',
    name: 'Checkerboard',
    nametr: 'Damalı Bayrak',
    icon: '🏁',
    config: {
      pattern: 'checkerboard',
      colors: [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }],
      speed: 1
    }
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    nametr: 'Gökkuşağı',
    icon: '🌈',
    config: {
      pattern: 'rainbow',
      speed: 0.8
    }
  },
  {
    id: 'countdown-10',
    name: 'Countdown 10',
    nametr: '10\'dan Geri Sayım',
    icon: '🔟',
    config: {
      pattern: 'countdown',
      countdownFrom: 10,
      speed: 1
    }
  },
  {
    id: 'countdown-5',
    name: 'Countdown 5',
    nametr: '5\'ten Geri Sayım',
    icon: '5️⃣',
    config: {
      pattern: 'countdown',
      countdownFrom: 5,
      speed: 1
    }
  },
  {
    id: 'stadium-wave',
    name: 'Stadium Wave',
    nametr: 'Tribün Dalgası',
    icon: '🏟️',
    config: {
      pattern: 'wave',
      speed: 1.2,
      direction: 'forward'
    }
  },
  {
    id: 'stadium-cards',
    name: 'Stadium Cards',
    nametr: 'Tribün Kartları',
    icon: '🎴',
    config: {
      pattern: 'stadium-cards',
      speed: 0.5
    }
  },
  {
    id: 'turkey-flag',
    name: 'Turkey Flag',
    nametr: 'Türk Bayrağı',
    icon: '🇹🇷',
    config: {
      pattern: 'flag',
      flagPreset: 'turkey'
    }
  },
  {
    id: 'strobe',
    name: 'Strobe',
    nametr: 'Stroboskop',
    icon: '⚡',
    config: {
      pattern: 'strobe',
      speed: 2,
      colors: [{ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 }]
    }
  },
  {
    id: 'breathing',
    name: 'Breathing',
    nametr: 'Nefes Alma',
    icon: '💨',
    config: {
      pattern: 'breathing',
      speed: 0.5,
      colors: [{ r: 100, g: 150, b: 255 }]
    }
  },
  {
    id: 'cascade',
    name: 'Cascade',
    nametr: 'Kademeli Geçiş',
    icon: '🌊',
    config: {
      pattern: 'cascade',
      speed: 1
    }
  },
  {
    id: 'sparkle',
    name: 'Random Sparkle',
    nametr: 'Rastgele Parıltı',
    icon: '✨',
    config: {
      pattern: 'random-sparkle',
      speed: 1.5
    }
  },
  {
    id: 'gradient-sweep',
    name: 'Gradient Sweep',
    nametr: 'Gradyan Süpürme',
    icon: '🎨',
    config: {
      pattern: 'gradient-sweep',
      speed: 0.8
    }
  }
];

// ============= HELPER FUNCTIONS =============

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

export function interpolateColor(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  factor: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * factor),
    g: Math.round(color1.g + (color2.g - color1.g) * factor),
    b: Math.round(color1.b + (color2.b - color1.b) * factor)
  };
}

export function getPatternColor(
  pattern: DancePattern,
  frameIndex: number,
  totalFrames: number,
  time: number,
  config: DanceConfig
): { r: number; g: number; b: number } {
  const { colors, speed, intensity, flagPreset } = config;
  const t = time * speed;
  
  switch (pattern) {
    case 'rainbow': {
      const hue = ((t * 50) + (frameIndex * 360 / totalFrames)) % 360;
      return hslToRgb(hue, 100, 50);
    }
    
    case 'checkerboard': {
      const isEven = Math.floor((t + frameIndex) % 2) === 0;
      return isEven ? colors[0] : (colors[1] || { r: 255, g: 255, b: 255 });
    }
    
    case 'wave': {
      const phase = Math.sin((t + frameIndex * 0.3) * Math.PI * 2) * 0.5 + 0.5;
      return interpolateColor(colors[0], colors[1] || colors[0], phase);
    }
    
    case 'pulse': {
      const brightness = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
      const baseColor = colors[0];
      return {
        r: Math.round(baseColor.r * brightness),
        g: Math.round(baseColor.g * brightness),
        b: Math.round(baseColor.b * brightness)
      };
    }
    
    case 'countdown': {
      const countdownValue = config.countdownFrom || 10;
      const currentNumber = Math.max(0, countdownValue - Math.floor(t));
      // Color changes as countdown progresses
      const progress = 1 - (currentNumber / countdownValue);
      return interpolateColor(
        { r: 0, g: 255, b: 0 }, // Green at start
        { r: 255, g: 0, b: 0 }, // Red at end
        progress
      );
    }
    
    case 'stadium-cards': {
      const cardIndex = Math.floor((t + frameIndex * 0.2) % colors.length);
      return colors[cardIndex] || colors[0];
    }
    
    case 'flag': {
      if (flagPreset && FLAG_PRESETS[flagPreset]) {
        const flagColors = FLAG_PRESETS[flagPreset].colors;
        const stripeIndex = frameIndex % flagColors.length;
        return flagColors[stripeIndex];
      }
      return colors[0];
    }
    
    case 'strobe': {
      const isOn = Math.floor(t * 10) % 2 === 0;
      return isOn ? colors[0] : { r: 0, g: 0, b: 0 };
    }
    
    case 'breathing': {
      const breath = Math.sin(t * Math.PI * 0.5) * 0.5 + 0.5;
      const baseColor = colors[0];
      return {
        r: Math.round(baseColor.r * breath * (intensity / 100)),
        g: Math.round(baseColor.g * breath * (intensity / 100)),
        b: Math.round(baseColor.b * breath * (intensity / 100))
      };
    }
    
    case 'cascade': {
      const delay = frameIndex * 0.1;
      const phase = Math.max(0, Math.sin((t - delay) * Math.PI * 2));
      const colorIndex = Math.floor(t + frameIndex) % colors.length;
      const color = colors[colorIndex];
      return {
        r: Math.round(color.r * phase),
        g: Math.round(color.g * phase),
        b: Math.round(color.b * phase)
      };
    }
    
    case 'random-sparkle': {
      const random = Math.random();
      if (random > 0.9) {
        return { r: 255, g: 255, b: 255 };
      }
      return colors[Math.floor(Math.random() * colors.length)] || colors[0];
    }
    
    case 'gradient-sweep': {
      const sweepPosition = (t * 0.5 + frameIndex / totalFrames) % 1;
      const colorIndex = Math.floor(sweepPosition * (colors.length - 1));
      const nextIndex = (colorIndex + 1) % colors.length;
      const localProgress = (sweepPosition * (colors.length - 1)) % 1;
      return interpolateColor(colors[colorIndex], colors[nextIndex], localProgress);
    }
    
    default:
      return colors[0] || { r: 255, g: 255, b: 255 };
  }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4))
  };
}
