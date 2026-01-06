/**
 * Animation Engine
 * Keyframe-based animasyon sistemi
 */

import { applyEasing, type EasingFunction, type TransitionType } from './transitions';

export interface AnimationKeyframe {
  id: string;
  time: number; // milliseconds
  properties: Record<string, number>;
  easing: EasingFunction;
}

export interface AnimationDefinition {
  id: string;
  name: string;
  duration: number; // milliseconds
  keyframes: AnimationKeyframe[];
  loop: boolean;
  autoPlay: boolean;
  delay: number;
}

export interface AnimationProperty {
  name: string;
  startValue: number;
  endValue: number;
  unit: string;
}

export type AnimationState = 'stopped' | 'playing' | 'paused';

/**
 * Animasyon Motoru
 */
export class AnimationEngine {
  private animations: Map<string, AnimationDefinition> = new Map();
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private state: AnimationState = 'stopped';
  private currentTime: number = 0;

  // Callbacks
  private onUpdate?: (properties: Record<string, number>) => void;
  private onComplete?: () => void;
  private onFrame?: (time: number, progress: number) => void;

  constructor() {}

  /**
   * Animasyon ekle
   */
  addAnimation(animation: AnimationDefinition): void {
    this.animations.set(animation.id, animation);
  }

  /**
   * Animasyon kaldır
   */
  removeAnimation(animationId: string): void {
    this.animations.delete(animationId);
  }

  /**
   * Animasyonu oynat
   */
  play(animationId: string, callbacks?: {
    onUpdate?: (properties: Record<string, number>) => void;
    onComplete?: () => void;
    onFrame?: (time: number, progress: number) => void;
  }): void {
    const animation = this.animations.get(animationId);
    if (!animation) return;

    this.onUpdate = callbacks?.onUpdate;
    this.onComplete = callbacks?.onComplete;
    this.onFrame = callbacks?.onFrame;

    this.state = 'playing';
    this.startTime = Date.now() - this.pausedTime;

    this.animate();
  }

  /**
   * Animasyonu duraklat
   */
  pause(): void {
    if (this.state === 'playing') {
      this.pausedTime = this.currentTime;
      this.state = 'paused';
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  /**
   * Animasyonu devam ettir
   */
  resume(): void {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.startTime = Date.now() - this.pausedTime;
      this.animate();
    }
  }

  /**
   * Animasyonu durdur
   */
  stop(): void {
    this.state = 'stopped';
    this.currentTime = 0;
    this.pausedTime = 0;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Mevcut durumu al
   */
  getState(): AnimationState {
    return this.state;
  }

  /**
   * Mevcut zamanı al
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Animation frame callback
   */
  private animate = (): void => {
    if (this.state !== 'playing') return;

    const animations = Array.from(this.animations.values());
    if (animations.length === 0) return;

    const animation = animations[0]; // İlk animasyon oynat
    const elapsed = Date.now() - this.startTime;
    const adjustedTime = Math.max(0, elapsed - animation.delay);
    const progress = Math.min(adjustedTime / animation.duration, 1);

    this.currentTime = adjustedTime;

    // Interpolated değerleri hesapla
    const interpolatedProperties = this.interpolateProperties(
      animation,
      progress
    );

    // Callback'leri çağır
    this.onFrame?.(adjustedTime, progress);
    this.onUpdate?.(interpolatedProperties);

    // Animasyon biterse
    if (progress >= 1) {
      this.currentTime = animation.duration;

      if (animation.loop) {
        // Tekrarla
        this.pausedTime = 0;
        this.startTime = Date.now();
        this.animationFrameId = requestAnimationFrame(this.animate);
      } else {
        // Bitir
        this.state = 'stopped';
        this.onComplete?.();
      }
    } else {
      // Sonraki frame'i iste
      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  };

  /**
   * Özellikleri interpolate et
   */
  private interpolateProperties(
    animation: AnimationDefinition,
    progress: number
  ): Record<string, number> {
    const result: Record<string, number> = {};

    // Keyframe'leri sırala
    const sortedKeyframes = [...animation.keyframes].sort(
      (a, b) => a.time - b.time
    );

    for (const property of this.getAllProperties(animation)) {
      // Önceki ve sonraki keyframe'leri bul
      let prevKeyframe = sortedKeyframes[0];
      let nextKeyframe = sortedKeyframes[1] || sortedKeyframes[0];

      for (let i = 0; i < sortedKeyframes.length - 1; i++) {
        const current = sortedKeyframes[i];
        const next = sortedKeyframes[i + 1];
        const currentProgress = current.time / animation.duration;
        const nextProgress = next.time / animation.duration;

        if (progress >= currentProgress && progress <= nextProgress) {
          prevKeyframe = current;
          nextKeyframe = next;
          break;
        }
      }

      const prevValue = prevKeyframe.properties[property] ?? 0;
      const nextValue = nextKeyframe.properties[property] ?? prevValue;

      // Interpolation
      const prevTime = prevKeyframe.time / animation.duration;
      const nextTime = nextKeyframe.time / animation.duration;
      const range = nextTime - prevTime;
      const localProgress =
        range > 0 ? (progress - prevTime) / range : 0;

      // Easing uygula
      const easedProgress = applyEasing(
        nextKeyframe.easing,
        Math.max(0, Math.min(1, localProgress))
      );

      const interpolatedValue =
        prevValue + (nextValue - prevValue) * easedProgress;

      result[property] = interpolatedValue;
    }

    return result;
  }

  /**
   * Tüm özellikleri bul
   */
  private getAllProperties(animation: AnimationDefinition): string[] {
    const properties = new Set<string>();

    animation.keyframes.forEach((kf) => {
      Object.keys(kf.properties).forEach((prop) =>
        properties.add(prop)
      );
    });

    return Array.from(properties);
  }

  /**
   * CSS Transform stringi oluştur
   */
  static createTransformString(
    properties: Record<string, number>,
    propertyConfig: Record<string, { unit: string }>
  ): string {
    const transforms: string[] = [];
    const filters: string[] = [];

    Object.entries(properties).forEach(([prop, value]) => {
      const config = propertyConfig[prop];
      const unit = config?.unit || '';

      switch (prop) {
        case 'scaleX':
          transforms.push(`scaleX(${value})`);
          break;
        case 'scaleY':
          transforms.push(`scaleY(${value})`);
          break;
        case 'scale':
          transforms.push(`scale(${value})`);
          break;
        case 'rotateX':
          transforms.push(`rotateX(${value}${unit})`);
          break;
        case 'rotateY':
          transforms.push(`rotateY(${value}${unit})`);
          break;
        case 'rotateZ':
        case 'rotate':
          transforms.push(`rotateZ(${value}${unit})`);
          break;
        case 'x':
          transforms.push(`translateX(${value}${unit})`);
          break;
        case 'y':
          transforms.push(`translateY(${value}${unit})`);
          break;
        case 'z':
          transforms.push(`translateZ(${value}${unit})`);
          break;
        case 'skewX':
          transforms.push(`skewX(${value}${unit})`);
          break;
        case 'skewY':
          transforms.push(`skewY(${value}${unit})`);
          break;
        case 'blur':
          filters.push(`blur(${value}${unit})`);
          break;
        case 'brightness':
          filters.push(`brightness(${value}${unit})`);
          break;
        case 'contrast':
          filters.push(`contrast(${value}${unit})`);
          break;
        case 'grayscale':
          filters.push(`grayscale(${value}${unit})`);
          break;
        case 'invert':
          filters.push(`invert(${value}${unit})`);
          break;
        case 'saturate':
          filters.push(`saturate(${value}${unit})`);
          break;
        case 'sepia':
          filters.push(`sepia(${value}${unit})`);
          break;
        case 'hueRotate':
          filters.push(`hue-rotate(${value}${unit})`);
          break;
        case 'opacity':
          // Ayrı ayrı handle et
          break;
      }
    });

    return {
      transform: transforms.join(' '),
      filter: filters.join(' '),
      opacity: properties.opacity?.toString() || '1',
    } as any;
  }
}

/**
 * Animasyon yöneticisi
 */
export class AnimationManager {
  private engines: Map<string, AnimationEngine> = new Map();

  /**
   * Öğe için animasyon motoru oluştur veya al
   */
  getEngine(elementId: string): AnimationEngine {
    if (!this.engines.has(elementId)) {
      this.engines.set(elementId, new AnimationEngine());
    }
    return this.engines.get(elementId)!;
  }

  /**
   * Animasyonu oynat
   */
  playAnimation(
    elementId: string,
    animation: AnimationDefinition,
    callbacks?: {
      onUpdate?: (properties: Record<string, number>) => void;
      onComplete?: () => void;
      onFrame?: (time: number, progress: number) => void;
    }
  ): void {
    const engine = this.getEngine(elementId);
    engine.addAnimation(animation);
    engine.play(animation.id, callbacks);
  }

  /**
   * Tüm animasyonları duraklat
   */
  pauseAll(): void {
    this.engines.forEach((engine) => engine.pause());
  }

  /**
   * Tüm animasyonları devam ettir
   */
  resumeAll(): void {
    this.engines.forEach((engine) => engine.resume());
  }

  /**
   * Tüm animasyonları durdur
   */
  stopAll(): void {
    this.engines.forEach((engine) => engine.stop());
  }

  /**
   * Motoru temizle
   */
  clearEngine(elementId: string): void {
    this.engines.delete(elementId);
  }
}

// Global animation manager
export const globalAnimationManager = new AnimationManager();
