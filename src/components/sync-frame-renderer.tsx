'use client';

/**
 * Sync Frame Renderer
 * Philips Hue-style frame sync component that reacts to audio/video
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getAudioEngine, AudioAnalysisData } from '@/lib/audio-engine';
import { 
  SyncFrameConfig, 
  SyncFrameState, 
  DEFAULT_SYNC_CONFIG,
  rgbToHex,
  interpolateColor 
} from '@/lib/frame-sync-types';

interface SyncFrameRendererProps {
  config?: Partial<SyncFrameConfig>;
  playerId?: string;
  children?: React.ReactNode;
  className?: string;
  onColorChange?: (color: { r: number; g: number; b: number }) => void;
}

export function SyncFrameRenderer({
  config: configOverrides,
  playerId,
  children,
  className,
  onColorChange
}: SyncFrameRendererProps) {
  const config: SyncFrameConfig = { ...DEFAULT_SYNC_CONFIG, ...configOverrides };
  const [state, setState] = useState<SyncFrameState>({
    currentColor: { r: 50, g: 50, b: 100 },
    brightness: 0.5,
    isActive: false,
    lastUpdate: Date.now()
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const previousColorRef = useRef({ r: 50, g: 50, b: 100 });

  // Smooth color transition
  const smoothColor = useCallback((
    current: { r: number; g: number; b: number },
    target: { r: number; g: number; b: number }
  ) => {
    const factor = (100 - config.smoothing) / 100;
    return {
      r: Math.round(current.r + (target.r - current.r) * factor),
      g: Math.round(current.g + (target.g - current.g) * factor),
      b: Math.round(current.b + (target.b - current.b) * factor)
    };
  }, [config.smoothing]);

  // Audio analysis for color
  const getAudioColor = useCallback((analysis: AudioAnalysisData | null) => {
    if (!analysis) return { r: 50, g: 50, b: 100 };
    
    const { bass, mid, treble, dominantColor } = analysis;
    const intensity = config.intensity / 100;

    switch (config.colorMapping) {
      case 'frequency':
        return {
          r: Math.min(255, Math.round(bass * 255 * intensity)),
          g: Math.min(255, Math.round(mid * 255 * intensity)),
          b: Math.min(255, Math.round(treble * 255 * intensity))
        };
      
      case 'brightness':
        const avg = analysis.average;
        const bright = Math.round(avg * 255 * intensity);
        return { r: bright, g: bright, b: bright };
      
      case 'hue-shift':
        // Shift hue based on audio level
        const hue = (analysis.average * 360) % 360;
        return hslToRgb(hue, 80, 50 * intensity);
      
      case 'dominant':
        return dominantColor || { r: 50, g: 50, b: 100 };
      
      default:
        return { r: 50, g: 50, b: 100 };
    }
  }, [config.colorMapping, config.intensity]);

  // Video analysis for dominant color
  const analyzeVideoFrame = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return null;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    try {
      // Draw scaled video frame
      ctx.drawImage(videoRef.current, 0, 0, 32, 32);
      const imageData = ctx.getImageData(0, 0, 32, 32);
      const data = imageData.data;

      let r = 0, g = 0, b = 0;
      const sampleSize = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }

      return {
        r: Math.round((r / sampleSize) * (config.intensity / 100)),
        g: Math.round((g / sampleSize) * (config.intensity / 100)),
        b: Math.round((b / sampleSize) * (config.intensity / 100))
      };
    } catch (e) {
      return null;
    }
  }, [config.intensity]);

  // Main animation loop
  useEffect(() => {
    if (!config.enabled) {
      setState(s => ({ ...s, isActive: false }));
      return;
    }

    const audioEngine = getAudioEngine();
    let isRunning = true;

    const updateFrame = () => {
      if (!isRunning) return;

      let newColor = previousColorRef.current;

      // Audio-based color
      if (config.mode === 'audio' || config.mode === 'audio-video') {
        const analysis = audioEngine.getMasterAnalysis();
        if (analysis) {
          const audioColor = getAudioColor(analysis);
          newColor = config.mode === 'audio' 
            ? audioColor 
            : interpolateColor(audioColor, newColor, 0.5);
        }
      }

      // Video-based color
      if (config.mode === 'video' || config.mode === 'audio-video') {
        const videoColor = analyzeVideoFrame();
        if (videoColor) {
          newColor = config.mode === 'video'
            ? videoColor
            : interpolateColor(newColor, videoColor, 0.5);
        }
      }

      // Smooth transition
      const smoothedColor = smoothColor(previousColorRef.current, newColor);
      previousColorRef.current = smoothedColor;

      setState({
        currentColor: smoothedColor,
        brightness: (smoothedColor.r + smoothedColor.g + smoothedColor.b) / (255 * 3),
        isActive: true,
        lastUpdate: Date.now()
      });

      onColorChange?.(smoothedColor);
      animationRef.current = requestAnimationFrame(updateFrame);
    };

    updateFrame();

    return () => {
      isRunning = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config.enabled, config.mode, getAudioColor, analyzeVideoFrame, smoothColor, onColorChange]);

  // Find and attach to video element
  useEffect(() => {
    if (config.videoSource === 'single-player' && playerId) {
      const playerElement = document.getElementById(playerId);
      if (playerElement) {
        const video = playerElement.querySelector('video');
        if (video) {
          videoRef.current = video;
        }
      }
    }
  }, [playerId, config.videoSource]);

  if (!config.enabled) {
    return <>{children}</>;
  }

  const { currentColor, brightness, isActive } = state;
  const borderColor = rgbToHex(currentColor.r, currentColor.g, currentColor.b);
  const glowColor = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${config.glowIntensity / 100})`;

  const pulseScale = config.pulseEnabled 
    ? 1 + (brightness * 0.05 * config.pulseSpeed)
    : 1;

  return (
    <motion.div
      className={cn('relative', className)}
      animate={{
        scale: pulseScale
      }}
      transition={{
        duration: 0.1,
        ease: 'easeOut'
      }}
      style={{
        borderWidth: config.borderWidth,
        borderStyle: 'solid',
        borderColor: borderColor,
        boxShadow: config.glowEnabled
          ? `0 0 ${20 * (config.glowIntensity / 100)}px ${glowColor}, 
             inset 0 0 ${10 * (config.glowIntensity / 100)}px ${glowColor}`
          : undefined,
        transition: `border-color ${config.smoothing}ms ease-out, box-shadow ${config.smoothing}ms ease-out`
      }}
    >
      {/* Hidden canvas for video analysis */}
      <canvas 
        ref={canvasRef} 
        width={32} 
        height={32} 
        className="hidden"
      />
      
      {children}

      {/* Activity indicator */}
      {isActive && (
        <div 
          className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: borderColor }}
        />
      )}
    </motion.div>
  );
}

// HSL to RGB helper
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

export default SyncFrameRenderer;
