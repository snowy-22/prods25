'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MouseTrackerFrameProps {
  enabled?: boolean;
  color?: string;
  size?: number;
  blur?: number;
  opacity?: number;
}

/**
 * Fare hareketlerini takip eden ve görüntüleyen çerçeve
 */
export const MouseTrackerFrame = memo(function MouseTrackerFrame({
  enabled = false,
  color = '#0ea5e9',
  size = 80,
  blur = 15,
  opacity = 0.6,
}: MouseTrackerFrameProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled]);

  if (!enabled || !isVisible) return null;

  return (
    <motion.div
      className="fixed pointer-events-none mix-blend-screen"
      style={{
        left: mousePos.x - size / 2,
        top: mousePos.y - size / 2,
        width: size,
        height: size,
        zIndex: 9998,
      }}
      animate={{
        opacity: isVisible ? opacity : 0,
      }}
      transition={{
        duration: 0.1,
        ease: 'easeOut',
      }}
    >
      <div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: color,
          boxShadow: `0 0 ${blur}px ${color}, inset 0 0 ${blur / 2}px ${color}`,
          opacity: opacity * 0.8,
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          backgroundColor: color,
          boxShadow: `0 0 ${blur / 2}px ${color}`,
          opacity: opacity,
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5"
        style={{
          height: size * 0.2,
          backgroundColor: color,
          opacity: opacity * 0.6,
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5"
        style={{
          height: size * 0.2,
          backgroundColor: color,
          opacity: opacity * 0.6,
        }}
      />
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5"
        style={{
          width: size * 0.2,
          backgroundColor: color,
          opacity: opacity * 0.6,
        }}
      />
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5"
        style={{
          width: size * 0.2,
          backgroundColor: color,
          opacity: opacity * 0.6,
        }}
      />
    </motion.div>
  );
});

interface AudioTrackerFrameProps {
  enabled?: boolean;
  isActive?: boolean;
  color?: string;
  intensity?: number;
}

/**
 * Sesi çalan öğeyi belirten ve animasyonlu çerçeve
 */
export const AudioTrackerFrame = memo(function AudioTrackerFrame({
  enabled = false,
  isActive = false,
  color = '#ec4899',
  intensity = 0.5,
}: AudioTrackerFrameProps) {
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    if (!enabled || !isActive) {
      setPulseScale(1);
      return;
    }

    let animationFrame: number;
    const startTime = Date.now();
    const pulseInterval = 600;

    const animate = () => {
      const elapsed = (Date.now() - startTime) % pulseInterval;
      const progress = elapsed / pulseInterval;
      const scale = 1 + Math.sin(progress * Math.PI) * intensity;
      setPulseScale(scale);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [enabled, isActive, intensity]);

  if (!enabled || !isActive) return null;

  return (
    <div
      className="absolute inset-0 rounded-lg pointer-events-none"
      style={{
        border: `3px solid ${color}`,
        boxShadow: `0 0 20px ${color}, inset 0 0 15px ${color}`,
        transform: `scale(${pulseScale})`,
        opacity: 0.8,
      }}
    />
  );
});

interface AudioVisualizerProps {
  enabled?: boolean;
  isActive?: boolean;
  mode?: 'bars' | 'wave' | 'circular' | 'particles';
  color?: string;
  height?: number;
}

/**
 * Ses görselleştirici - müzik öğeleri için animasyonlu görsel efektler
 */
export const AudioVisualizer = memo(function AudioVisualizer({
  enabled = false,
  isActive = false,
  mode = 'bars',
  color = '#8b5cf6',
  height = 60,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!enabled || !isActive || !canvasRef.current) return;

    // Audio Context kurulumu
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    setAudioContext(audioContext);

    // Görselleştirme başlat
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      switch (mode) {
        case 'bars':
          drawBars(ctx, dataArray, canvas);
          break;
        case 'wave':
          drawWave(ctx, dataArray, canvas);
          break;
        case 'circular':
          drawCircular(ctx, dataArray, canvas);
          break;
        case 'particles':
          drawParticles(ctx, dataArray, canvas);
          break;
      }
    };

    draw();

    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [enabled, isActive, mode]);

  const drawBars = (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
    const barWidth = (canvas.width / data.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      barHeight = (data[i] / 255) * canvas.height;

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
    ctx.globalAlpha = 1;
  };

  const drawWave = (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = canvas.width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  const drawCircular = (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    for (let i = 0; i < data.length; i++) {
      const angle = (i / data.length) * Math.PI * 2;
      const value = data[i] / 255;
      const distance = radius * value;

      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / data.length) * canvas.width;
      const y = canvas.height / 2 - (data[i] / 255) * (canvas.height / 2);
      const size = (data[i] / 255) * 4;

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  if (!enabled || !isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ height: `${height}px` }}
    />
  );
});

interface ActivePlayerHighlightProps {
  enabled?: boolean;
  playingItems?: string[]; // Oynatılan öğelerin ID'leri
  children?: React.ReactNode;
}

/**
 * Aktif oynatıcıyı vurgulayan yer tutucu
 */
export const ActivePlayerHighlight = memo(function ActivePlayerHighlight({
  enabled = false,
  playingItems = [],
  children,
}: ActivePlayerHighlightProps) {
  const isPlaying = playingItems.length > 0;

  return (
    <div
      className={cn(
        'relative transition-all duration-200',
        enabled && isPlaying && 'ring-2 ring-pink-500 shadow-lg shadow-pink-500/50'
      )}
    >
      {children}
      {enabled && isPlaying && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none border-2 border-pink-500"
          animate={{
            boxShadow: [
              '0 0 10px rgba(236, 72, 153, 0.5)',
              '0 0 20px rgba(236, 72, 153, 0.8)',
              '0 0 10px rgba(236, 72, 153, 0.5)',
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      )}
    </div>
  );
});
