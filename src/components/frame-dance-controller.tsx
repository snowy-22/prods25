'use client';

/**
 * Frame Dance Controller
 * Orchestrates synchronized animations across multiple player frames
 */

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DanceConfig, 
  DanceState, 
  DancePattern,
  DancePreset,
  DANCE_PRESETS,
  FLAG_PRESETS,
  FlagPreset,
  DEFAULT_DANCE_CONFIG,
  getPatternColor,
  rgbToHex
} from '@/lib/frame-sync-types';
import { getAudioEngine } from '@/lib/audio-engine';
import { cn } from '@/lib/utils';

// ============= CONTEXT =============

interface FrameDanceContextValue {
  isPlaying: boolean;
  config: DanceConfig;
  state: DanceState;
  registeredFrames: Map<string, FrameRegistration>;
  registerFrame: (id: string, registration: FrameRegistration) => void;
  unregisterFrame: (id: string) => void;
  getFrameColor: (frameId: string) => { r: number; g: number; b: number };
  play: () => void;
  pause: () => void;
  stop: () => void;
  setConfig: (config: Partial<DanceConfig>) => void;
  applyPreset: (presetId: string) => void;
}

interface FrameRegistration {
  id: string;
  index: number;
  element?: HTMLElement;
  onColorChange?: (color: { r: number; g: number; b: number }) => void;
}

const FrameDanceContext = createContext<FrameDanceContextValue | null>(null);

export function useFrameDance() {
  const context = useContext(FrameDanceContext);
  if (!context) {
    throw new Error('useFrameDance must be used within a FrameDanceProvider');
  }
  return context;
}

// ============= PROVIDER =============

interface FrameDanceProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<DanceConfig>;
}

export function FrameDanceProvider({ children, initialConfig }: FrameDanceProviderProps) {
  const [config, setConfigState] = useState<DanceConfig>({
    ...DEFAULT_DANCE_CONFIG,
    ...initialConfig
  });
  
  const [state, setState] = useState<DanceState>({
    isPlaying: false,
    currentFrame: 0,
    elapsedMs: 0,
    loopsCompleted: 0
  });

  const registeredFramesRef = useRef<Map<string, FrameRegistration>>(new Map());
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const audioSyncRef = useRef<number>(1);

  // Register a frame
  const registerFrame = useCallback((id: string, registration: FrameRegistration) => {
    registeredFramesRef.current.set(id, registration);
  }, []);

  // Unregister a frame
  const unregisterFrame = useCallback((id: string) => {
    registeredFramesRef.current.delete(id);
  }, []);

  // Get color for a specific frame
  const getFrameColor = useCallback((frameId: string) => {
    const frame = registeredFramesRef.current.get(frameId);
    if (!frame) return { r: 50, g: 50, b: 100 };

    const totalFrames = registeredFramesRef.current.size;
    const time = state.elapsedMs / 1000;
    
    // Apply audio sync modifier if enabled
    let effectiveTime = time;
    if (config.syncWithAudio) {
      const audioEngine = getAudioEngine();
      const analysis = audioEngine.getMasterAnalysis();
      if (analysis) {
        audioSyncRef.current = 0.5 + analysis.average * 1.5;
        effectiveTime *= audioSyncRef.current;
      }
    }

    return getPatternColor(
      config.pattern,
      frame.index,
      totalFrames,
      effectiveTime,
      config
    );
  }, [config, state.elapsedMs]);

  // Animation loop
  const animate = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    
    setState(prev => ({
      ...prev,
      elapsedMs: elapsed,
      currentFrame: Math.floor(elapsed / (1000 / 60))
    }));

    // Update all registered frames
    registeredFramesRef.current.forEach((frame, id) => {
      const color = getPatternColor(
        config.pattern,
        frame.index,
        registeredFramesRef.current.size,
        elapsed / 1000,
        config
      );
      frame.onColorChange?.(color);
    });

    // Check for loop completion
    if (config.pattern === 'countdown') {
      const countdownDuration = (config.countdownFrom || 10) * 1000 / config.speed;
      if (elapsed >= countdownDuration) {
        if (config.loopCount === 0 || state.loopsCompleted < config.loopCount - 1) {
          startTimeRef.current = now;
          setState(prev => ({
            ...prev,
            loopsCompleted: prev.loopsCompleted + 1,
            elapsedMs: 0
          }));
        } else {
          // Stop after completing all loops
          setState(prev => ({ ...prev, isPlaying: false }));
          return;
        }
      }
    }

    if (state.isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [config, getPatternColor, state.isPlaying, state.loopsCompleted]);

  // Play animation
  const play = useCallback(() => {
    startTimeRef.current = performance.now();
    setState(prev => ({
      ...prev,
      isPlaying: true,
      elapsedMs: 0,
      loopsCompleted: 0
    }));
  }, []);

  // Pause animation
  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // Stop animation
  const stop = useCallback(() => {
    setState({
      isPlaying: false,
      currentFrame: 0,
      elapsedMs: 0,
      loopsCompleted: 0
    });
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // Update config
  const setConfig = useCallback((updates: Partial<DanceConfig>) => {
    setConfigState(prev => ({ ...prev, ...updates }));
  }, []);

  // Apply preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = DANCE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setConfigState(prev => ({
        ...prev,
        ...preset.config,
        colors: preset.config.flagPreset 
          ? FLAG_PRESETS[preset.config.flagPreset].colors
          : preset.config.colors || prev.colors
      }));
    }
  }, []);

  // Handle animation frame updates
  useEffect(() => {
    if (state.isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isPlaying, animate]);

  const value: FrameDanceContextValue = {
    isPlaying: state.isPlaying,
    config,
    state,
    registeredFrames: registeredFramesRef.current,
    registerFrame,
    unregisterFrame,
    getFrameColor,
    play,
    pause,
    stop,
    setConfig,
    applyPreset
  };

  return (
    <FrameDanceContext.Provider value={value}>
      {children}
    </FrameDanceContext.Provider>
  );
}

// ============= DANCE FRAME WRAPPER =============

interface DanceFrameProps {
  id: string;
  index?: number;
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  glowEnabled?: boolean;
  glowIntensity?: number;
}

export function DanceFrame({
  id,
  index = 0,
  children,
  className,
  borderWidth = 4,
  glowEnabled = true,
  glowIntensity = 50
}: DanceFrameProps) {
  const { registerFrame, unregisterFrame, getFrameColor, isPlaying } = useFrameDance();
  const [color, setColor] = useState({ r: 50, g: 50, b: 100 });
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerFrame(id, {
      id,
      index,
      element: frameRef.current || undefined,
      onColorChange: setColor
    });

    return () => unregisterFrame(id);
  }, [id, index, registerFrame, unregisterFrame]);

  useEffect(() => {
    if (isPlaying) {
      const newColor = getFrameColor(id);
      setColor(newColor);
    }
  }, [id, isPlaying, getFrameColor]);

  const borderColor = rgbToHex(color.r, color.g, color.b);
  const glowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${glowIntensity / 100})`;

  return (
    <motion.div
      ref={frameRef}
      className={cn('relative transition-all', className)}
      style={{
        borderWidth,
        borderStyle: 'solid',
        borderColor: isPlaying ? borderColor : 'transparent',
        boxShadow: isPlaying && glowEnabled
          ? `0 0 ${20 * (glowIntensity / 100)}px ${glowColor}`
          : 'none',
        transition: 'border-color 50ms ease-out, box-shadow 50ms ease-out'
      }}
    >
      {children}
    </motion.div>
  );
}

// ============= DANCE CONTROLLER UI =============

interface DanceControllerProps {
  className?: string;
  compact?: boolean;
}

export function DanceController({ className, compact = false }: DanceControllerProps) {
  const { 
    isPlaying, 
    config, 
    state, 
    play, 
    pause, 
    stop, 
    setConfig, 
    applyPreset,
    registeredFrames 
  } = useFrameDance();

  const [showPresets, setShowPresets] = useState(!compact);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 p-2 rounded-lg bg-card/50 border', className)}>
        <button
          onClick={isPlaying ? pause : play}
          className={cn(
            'p-2 rounded-full transition-colors',
            isPlaying ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'
          )}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <select
          value={config.pattern}
          onChange={(e) => applyPreset(e.target.value)}
          className="flex-1 px-2 py-1 rounded border bg-background text-sm"
        >
          {DANCE_PRESETS.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.icon} {preset.nametr}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {registeredFrames.size} çerçeve
        </span>
      </div>
    );
  }

  return (
    <div className={cn('p-4 rounded-xl bg-card border space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          💃 Çerçeve Dansları
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {registeredFrames.size} çerçeve kayıtlı
          </span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={play}
          disabled={isPlaying}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            isPlaying 
              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
              : 'bg-green-500 text-white hover:bg-green-600'
          )}
        >
          ▶ Başlat
        </button>
        <button
          onClick={pause}
          disabled={!isPlaying}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            !isPlaying 
              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
              : 'bg-yellow-500 text-white hover:bg-yellow-600'
          )}
        >
          ⏸ Duraklat
        </button>
        <button
          onClick={stop}
          className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          ⏹ Durdur
        </button>
      </div>

      {/* Status */}
      {isPlaying && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="animate-pulse w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm">
            {(state.elapsedMs / 1000).toFixed(1)}s geçti
          </span>
          {config.pattern === 'countdown' && (
            <span className="text-sm font-mono">
              ⏱ {Math.max(0, (config.countdownFrom || 10) - Math.floor(state.elapsedMs / 1000 * config.speed))}
            </span>
          )}
          {config.loopCount > 0 && (
            <span className="text-sm text-muted-foreground">
              Döngü: {state.loopsCompleted + 1}/{config.loopCount}
            </span>
          )}
        </div>
      )}

      {/* Presets */}
      <div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-2 text-sm font-medium mb-2"
        >
          {showPresets ? '▼' : '▶'} Hazır Desenler
        </button>
        
        <AnimatePresence>
          {showPresets && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-3 gap-2 overflow-hidden"
            >
              {DANCE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all hover:bg-muted/50',
                    config.pattern === preset.config.pattern && 'border-primary bg-primary/5'
                  )}
                >
                  <span className="text-2xl">{preset.icon}</span>
                  <p className="text-sm font-medium mt-1">{preset.nametr}</p>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Hız: {config.speed.toFixed(1)}x</label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={config.speed}
            onChange={(e) => setConfig({ speed: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Yoğunluk: {config.intensity}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.intensity}
            onChange={(e) => setConfig({ intensity: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="syncAudio"
            checked={config.syncWithAudio}
            onChange={(e) => setConfig({ syncWithAudio: e.target.checked })}
          />
          <label htmlFor="syncAudio" className="text-sm">
            🎵 Sesle Senkronize Et
          </label>
        </div>

        {config.pattern === 'countdown' && (
          <div>
            <label className="text-sm font-medium">Geri Sayım: {config.countdownFrom}</label>
            <input
              type="range"
              min="3"
              max="30"
              value={config.countdownFrom || 10}
              onChange={(e) => setConfig({ countdownFrom: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        )}

        {config.pattern === 'flag' && (
          <div>
            <label className="text-sm font-medium block mb-1">Bayrak</label>
            <select
              value={config.flagPreset || 'turkey'}
              onChange={(e) => {
                const preset = e.target.value as FlagPreset;
                setConfig({ 
                  flagPreset: preset,
                  colors: FLAG_PRESETS[preset].colors
                });
              }}
              className="w-full px-3 py-2 rounded border bg-background"
            >
              {Object.entries(FLAG_PRESETS).filter(([k]) => k !== 'custom').map(([key, flag]) => (
                <option key={key} value={key}>
                  {flag.emoji} {flag.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

export default {
  FrameDanceProvider,
  DanceFrame,
  DanceController,
  useFrameDance
};
