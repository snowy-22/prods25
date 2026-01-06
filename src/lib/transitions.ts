/**
 * Transition Effects Library
 * CSS ve Canvas-based geçiş efektleri
 */

export type TransitionType =
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'rotate'
  | 'flip'
  | 'scale-bounce'
  | 'blur'
  | 'pixelate'
  | 'wave'
  | 'curtain'
  | 'vignette'
  | 'morph';

export type EasingFunction =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-sine'
  | 'ease-out-sine'
  | 'ease-in-out-sine'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'ease-in-quart'
  | 'ease-out-quart'
  | 'ease-in-out-quart';

export interface TransitionConfig {
  type: TransitionType;
  duration: number; // milliseconds
  easing: EasingFunction;
  direction?: 'in' | 'out';
  intensity?: number; // 0-100
}

/**
 * CSS Geçiş Animasyonları
 */
export const CSS_TRANSITIONS: Record<TransitionType, string> = {
  // Basit Geçişler
  fade: `
    @keyframes fade-enter {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fade-exit {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,

  'slide-left': `
    @keyframes slide-left-enter {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slide-left-exit {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(-100%); opacity: 0; }
    }
  `,

  'slide-right': `
    @keyframes slide-right-enter {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slide-right-exit {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `,

  'slide-up': `
    @keyframes slide-up-enter {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slide-up-exit {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(-100%); opacity: 0; }
    }
  `,

  'slide-down': `
    @keyframes slide-down-enter {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slide-down-exit {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(100%); opacity: 0; }
    }
  `,

  // Zoom Geçişleri
  'zoom-in': `
    @keyframes zoom-in-enter {
      from { transform: scale(0); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes zoom-in-exit {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(0); opacity: 0; }
    }
  `,

  'zoom-out': `
    @keyframes zoom-out-enter {
      from { transform: scale(2); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes zoom-out-exit {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(2); opacity: 0; }
    }
  `,

  // Döndürme
  rotate: `
    @keyframes rotate-enter {
      from { transform: rotate(-180deg); opacity: 0; }
      to { transform: rotate(0deg); opacity: 1; }
    }
    @keyframes rotate-exit {
      from { transform: rotate(0deg); opacity: 1; }
      to { transform: rotate(180deg); opacity: 0; }
    }
  `,

  // Flip
  flip: `
    @keyframes flip-enter {
      from { transform: perspective(600px) rotateY(90deg); opacity: 0; }
      to { transform: perspective(600px) rotateY(0deg); opacity: 1; }
    }
    @keyframes flip-exit {
      from { transform: perspective(600px) rotateY(0deg); opacity: 1; }
      to { transform: perspective(600px) rotateY(-90deg); opacity: 0; }
    }
  `,

  // Scale Bounce
  'scale-bounce': `
    @keyframes scale-bounce-enter {
      0% { transform: scale(0); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `,

  // Canvas-based (placeholder)
  blur: `
    @keyframes blur-enter {
      from { filter: blur(10px); opacity: 0; }
      to { filter: blur(0px); opacity: 1; }
    }
  `,

  pixelate: `
    @keyframes pixelate-enter {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,

  wave: `
    @keyframes wave-enter {
      0% { clip-path: polygon(0 50%, 0 50%, 0 50%, 0 50%, 0 50%); }
      100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0); }
    }
  `,

  curtain: `
    @keyframes curtain-enter {
      from { clip-path: polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%); }
      to { clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); }
    }
  `,

  vignette: `
    @keyframes vignette-enter {
      from { box-shadow: inset 0 0 30px 30px rgba(0,0,0,0.5); opacity: 0; }
      to { box-shadow: inset 0 0 30px 30px rgba(0,0,0,0); opacity: 1; }
    }
  `,

  morph: `
    @keyframes morph-enter {
      from { 
        border-radius: 50%;
        transform: scale(0);
        opacity: 0;
      }
      to { 
        border-radius: 0%;
        transform: scale(1);
        opacity: 1;
      }
    }
  `,
};

/**
 * Easing Fonksiyonları CSS kartezyen notasyonu
 */
export const EASING_FUNCTIONS: Record<EasingFunction, string> = {
  linear: '0, 0, 1, 1',
  ease: '0.25, 0.1, 0.25, 1',
  'ease-in': '0.42, 0, 1, 1',
  'ease-out': '0, 0, 0.58, 1',
  'ease-in-out': '0.42, 0, 0.58, 1',
  'ease-in-sine': '0.47, 0, 0.745, 0.715',
  'ease-out-sine': '0.39, 0.575, 0.565, 1',
  'ease-in-out-sine': '0.445, 0.05, 0.55, 0.95',
  'ease-in-cubic': '0.55, 0.055, 0.675, 0.19',
  'ease-out-cubic': '0.215, 0.61, 0.355, 1',
  'ease-in-out-cubic': '0.645, 0.045, 0.355, 1',
  'ease-in-quart': '0.895, 0.03, 0.685, 0.22',
  'ease-out-quart': '0.165, 0.84, 0.44, 1',
  'ease-in-out-quart': '0.77, 0, 0.175, 1',
};

/**
 * Transition yapılandırması oluştur
 */
export function createTransition(
  type: TransitionType,
  duration: number = 500,
  easing: EasingFunction = 'ease-in-out'
): TransitionConfig {
  return {
    type,
    duration,
    easing,
    intensity: 100,
  };
}

/**
 * CSS animation stringi oluştur
 */
export function generateCSSAnimation(
  config: TransitionConfig,
  direction: 'enter' | 'exit' = 'enter'
): string {
  const animationName = `${config.type}-${direction}`;
  const easingFn = EASING_FUNCTIONS[config.easing];

  return `
    animation: ${animationName} ${config.duration}ms cubic-bezier(${easingFn}) forwards;
  `;
}

/**
 * Canvas-based pixelate efekti
 */
export function applyPixelateEffect(
  canvas: CanvasRenderingContext2D,
  imageData: ImageData,
  intensity: number = 10
): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const blockSize = intensity;

  for (let y = 0; y < width; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      const pixelIndex = (y * width + x) * 4;

      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];

      // Blok içindeki tüm pikselleri ortalama renkle doldur
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          if (idx < data.length) {
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }
  }

  return imageData;
}

/**
 * Canvas-based wave efekti
 */
export function applyWaveEffect(
  canvas: CanvasRenderingContext2D,
  imageData: ImageData,
  time: number = 0,
  intensity: number = 10
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const newData = new Uint8ClampedArray(imageData.data);

  for (let y = 0; y < height; y++) {
    const offset = Math.sin((y + time) / 10) * intensity;
    for (let x = 0; x < width; x++) {
      const sourceX = Math.floor(x + offset);
      if (sourceX >= 0 && sourceX < width) {
        const sourceIdx = (y * width + sourceX) * 4;
        const destIdx = (y * width + x) * 4;
        newData[destIdx] = imageData.data[sourceIdx];
        newData[destIdx + 1] = imageData.data[sourceIdx + 1];
        newData[destIdx + 2] = imageData.data[sourceIdx + 2];
        newData[destIdx + 3] = imageData.data[sourceIdx + 3];
      }
    }
  }

  return new ImageData(newData, width, height);
}

/**
 * Canvas-based blur efekti (box blur)
 */
export function applyBlurEffect(
  imageData: ImageData,
  radius: number = 5
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      let count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }
      }

      const destIdx = (y * width + x) * 4;
      newData[destIdx] = Math.round(r / count);
      newData[destIdx + 1] = Math.round(g / count);
      newData[destIdx + 2] = Math.round(b / count);
      newData[destIdx + 3] = Math.round(a / count);
    }
  }

  return new ImageData(newData, width, height);
}

/**
 * Geçiş efektlerinin açıklamaları
 */
export const TRANSITION_DESCRIPTIONS: Record<TransitionType, string> = {
  fade: 'Soluk geçiş',
  'slide-left': 'Soldan sağa kayma',
  'slide-right': 'Sağdan sola kayma',
  'slide-up': 'Aşağıdan yukarı kayma',
  'slide-down': 'Yukarıdan aşağı kayma',
  'zoom-in': 'Yaklaştırarak giriş',
  'zoom-out': 'Uzaklaştırarak çıkış',
  rotate: 'Dönerek geçiş',
  flip: 'Ters çevirerek geçiş',
  'scale-bounce': 'Zıplayan ölçek',
  blur: 'Bulanık geçiş',
  pixelate: 'Piksel efekti',
  wave: 'Dalga efekti',
  curtain: 'Perde açılması',
  vignette: 'Köşe karartması',
  morph: 'Şekil dönüşümü',
};

/**
 * Tüm geçiş tiplerini al
 */
export function getAllTransitionTypes(): Array<{
  type: TransitionType;
  description: string;
}> {
  return Object.entries(TRANSITION_DESCRIPTIONS).map(([type, description]) => ({
    type: type as TransitionType,
    description,
  }));
}

/**
 * Easing fonksiyonu uygula
 */
export function applyEasing(
  easing: EasingFunction,
  progress: number
): number {
  const easings: Record<EasingFunction, (t: number) => number> = {
    linear: (t) => t,
    ease: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'ease-in': (t) => t * t,
    'ease-out': (t) => t * (2 - t),
    'ease-in-out': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'ease-in-sine': (t) => 1 - Math.cos((t * Math.PI) / 2),
    'ease-out-sine': (t) => Math.sin((t * Math.PI) / 2),
    'ease-in-out-sine': (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    'ease-in-cubic': (t) => t * t * t,
    'ease-out-cubic': (t) => 1 - Math.pow(1 - t, 3),
    'ease-in-out-cubic': (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    'ease-in-quart': (t) => t * t * t * t,
    'ease-out-quart': (t) => 1 - Math.pow(1 - t, 4),
    'ease-in-out-quart': (t) =>
      t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  };

  return easings[easing](progress);
}
