'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Action, 
  Timeline, 
  Scene, 
  PlaybackState,
  EasingFunction,
  AutomationState 
} from '@/lib/recording-studio-types';
import { 
  executeAction, 
  ExecutionContext, 
  ActionExecutor 
} from '@/components/recording-studio/action-executors';

// Easing fonksiyonları
const easingFunctions: Record<EasingFunction, (t: number) => number> = {
  'linear': (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  'ease-in-sine': (t) => 1 - Math.cos((t * Math.PI) / 2),
  'ease-out-sine': (t) => Math.sin((t * Math.PI) / 2),
  'ease-in-out-sine': (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  'ease-in-quad': (t) => t * t,
  'ease-out-quad': (t) => t * (2 - t),
  'ease-in-out-quad': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  'ease-in-cubic': (t) => t * t * t,
  'ease-out-cubic': (t) => (--t) * t * t + 1,
  'ease-in-out-cubic': (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  'ease-in-quart': (t) => t * t * t * t,
  'ease-out-quart': (t) => 1 - (--t) * t * t * t,
  'ease-in-out-quart': (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  'ease-in-expo': (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  'ease-out-expo': (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  'ease-in-out-expo': (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  'bounce': (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
};

export function useAutomationEngine() {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  
  // Execution context for action executors
  const executionContextRef = useRef<ExecutionContext>({});

  // Set execution context (called from component)
  const setExecutionContext = useCallback((context: Partial<ExecutionContext>) => {
    executionContextRef.current = {
      ...executionContextRef.current,
      ...context,
    };
  }, []);

  // Progress hesaplama (easing ile)
  const calculateProgress = useCallback((
    action: Action,
    currentTime: number
  ): number => {
    const elapsed = currentTime - action.startTime;
    const rawProgress = Math.min(1, Math.max(0, elapsed / action.duration));
    const easingFn = easingFunctions[action.easing] || easingFunctions.linear;
    return easingFn(rawProgress);
  }, []);

  // Aktif aksiyonları bulma
  const getActiveActions = useCallback((time: number): Action[] => {
    if (!timeline || !timeline.scenes[currentSceneIndex]) return [];
    
    const scene = timeline.scenes[currentSceneIndex];
    return scene.actions.filter(action => {
      const actionEnd = action.startTime + action.duration;
      return time >= action.startTime && time <= actionEnd;
    });
  }, [timeline, currentSceneIndex]);

  // Aksiyonları çalıştırma
  const executeActions = useCallback((time: number) => {
    const activeActions = getActiveActions(time);
    
    activeActions.forEach(action => {
      const progress = calculateProgress(action, time);
      
      // Use executeAction from action-executors
      executeAction(action, progress, executionContextRef.current);

      // Action'ı executed olarak işaretle
      if (!executedActions.has(action.id)) {
        setExecutedActions(prev => new Set(prev).add(action.id));
      }
    });
  }, [getActiveActions, calculateProgress, executedActions]);

  // Animation loop
  const tick = useCallback((timestamp: number) => {
    if (!isPlaying || isPaused || !timeline) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = timestamp;
      lastTimeRef.current = timestamp;
    }

    const deltaTime = (timestamp - lastTimeRef.current) * speed;
    lastTimeRef.current = timestamp;

    const newTime = currentTime + deltaTime;
    const scene = timeline.scenes[currentSceneIndex];

    if (scene && newTime >= scene.duration) {
      // Sahne sonu - bir sonraki sahneye geç veya bitir
      if (currentSceneIndex < timeline.scenes.length - 1) {
        setCurrentSceneIndex(prev => prev + 1);
        setCurrentTime(0);
        startTimeRef.current = 0;
        setExecutedActions(new Set());
      } else {
        // Timeline sonu
        if (loop) {
          setCurrentSceneIndex(0);
          setCurrentTime(0);
          startTimeRef.current = 0;
          setExecutedActions(new Set());
        } else {
          stop();
          return;
        }
      }
    } else {
      setCurrentTime(newTime);
      executeActions(newTime);
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [isPlaying, isPaused, timeline, currentTime, speed, currentSceneIndex, loop, executeActions]);

  // Oynatma kontrolü
  useEffect(() => {
    if (isPlaying && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isPaused, tick]);

  // Kontrol fonksiyonları
  const play = useCallback(() => {
    setIsPlaying(true);
    setIsPaused(false);
    startTimeRef.current = 0;
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    startTimeRef.current = 0;
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
    setCurrentSceneIndex(0);
    setExecutedActions(new Set());
    startTimeRef.current = 0;
    lastTimeRef.current = 0;
  }, []);

  const seekTo = useCallback((time: number) => {
    setCurrentTime(time);
    setExecutedActions(new Set());
    startTimeRef.current = 0;
  }, []);

  const seekToScene = useCallback((sceneIndex: number) => {
    if (timeline && sceneIndex >= 0 && sceneIndex < timeline.scenes.length) {
      setCurrentSceneIndex(sceneIndex);
      setCurrentTime(0);
      setExecutedActions(new Set());
      startTimeRef.current = 0;
    }
  }, [timeline]);

  const setPlaybackSpeed = useCallback((newSpeed: number) => {
    setSpeed(Math.max(0.25, Math.min(4, newSpeed)));
  }, []);

  const toggleLoop = useCallback(() => {
    setLoop(prev => !prev);
  }, []);

  return {
    // State
    timeline,
    currentTime,
    isPlaying,
    isPaused,
    currentSceneIndex,
    speed,
    loop,
    executedActions: Array.from(executedActions),
    
    // Current scene
    currentScene: timeline?.scenes[currentSceneIndex] || null,
    
    // Progress (0-1)
    sceneProgress: timeline?.scenes[currentSceneIndex] 
      ? currentTime / timeline.scenes[currentSceneIndex].duration 
      : 0,
    
    // Controls
    setTimeline,
    play,
    pause,
    resume,
    stop,
    seekTo,
    seekToScene,
    setPlaybackSpeed,
    toggleLoop,
    
    // Action execution context
    setExecutionContext,
    getActiveActions,
  };
}
