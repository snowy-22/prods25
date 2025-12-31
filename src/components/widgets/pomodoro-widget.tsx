// src/components/widgets/pomodoro-widget.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Play, Pause, RotateCw, Coffee, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const playAlertSound = () => {
    if (typeof window === 'undefined') return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
    }, 300);
};

interface PomodoroWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function PomodoroWidget({ size = 'medium' }: PomodoroWidgetProps) {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  const WORK_DURATION = 25 * 60;
  const BREAK_DURATION = 5 * 60;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      playAlertSound();
      if (mode === 'work') {
        toast({ title: "Mola Zamanı!", description: "Harika iş! Şimdi kısa bir ara ver." });
        setMode('break');
        setTimeLeft(BREAK_DURATION);
      } else {
        toast({ title: "Tekrar Başla!", description: "Mola bitti, odaklanma zamanı." });
        setMode('work');
        setTimeLeft(WORK_DURATION);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, toast]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setMode('work');
    setTimeLeft(WORK_DURATION);
  };
  
  const totalDuration = mode === 'work' ? WORK_DURATION : BREAK_DURATION;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <div className={cn(
      "flex h-full w-full flex-col items-center justify-center bg-card text-center gap-4",
      isSmall && "p-2",
      !isSmall && !isLarge && "p-4",
      isLarge && "p-6"
    )}>
      <div className={cn(
        "relative rounded-full flex items-center justify-center",
        isSmall && "h-24 w-24",
        !isSmall && !isLarge && "h-48 w-48",
        isLarge && "h-64 w-64"
      )}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
            <circle
                className="stroke-current text-muted"
                strokeWidth="5"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
            />
            <circle
                className="stroke-current text-primary transition-all duration-1000 ease-linear"
                strokeWidth="5"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                strokeDasharray="282.7"
                strokeDashoffset={282.7 - (progress / 100) * 282.7}
                transform="rotate(-90 50 50)"
            />
        </svg>
        <div className="z-10 text-center">
            <div className={cn(
              "flex items-center justify-center font-semibold text-muted-foreground mb-1",
              isSmall && "text-xs",
              !isSmall && !isLarge && "text-sm",
              isLarge && "text-base"
            )}>
                {mode === 'work' ? <Brain className={cn(isSmall && "mr-0.5 h-3 w-3", !isSmall && "mr-1 h-4 w-4")} /> : <Coffee className={cn(isSmall && "mr-0.5 h-3 w-3", !isSmall && "mr-1 h-4 w-4")} />}
                {mode === 'work' ? 'Odaklan' : 'Mola'}
            </div>
            <p className={cn(
              "font-mono text-foreground",
              isSmall && "text-2xl",
              !isSmall && !isLarge && "text-5xl",
              isLarge && "text-7xl"
            )}>{formatTime(timeLeft)}</p>
        </div>
      </div>
      
      <div className={cn(
        "flex items-center",
        isSmall && "gap-2",
        !isSmall && !isLarge && "gap-4",
        isLarge && "gap-6"
      )}>
        <Button onClick={handleReset} variant="outline" className={cn(
          "rounded-full",
          isSmall && "h-8 w-8",
          !isSmall && !isLarge && "h-12 w-12",
          isLarge && "h-16 w-16"
        )}>
            <RotateCw className={cn(isSmall && "h-4 w-4", !isSmall && !isLarge && "h-5 w-5", isLarge && "h-7 w-7")} />
        </Button>
        <Button onClick={handleStartPause} className={cn(
          "rounded-full",
          isSmall && "h-10 w-10",
          !isSmall && !isLarge && "h-16 w-16",
          isLarge && "h-20 w-20"
        )}>
          {isActive ? <Pause className={cn(isSmall && "h-5 w-5", !isSmall && !isLarge && "h-8 w-8", isLarge && "h-10 w-10")} /> : <Play className={cn(isSmall && "h-5 w-5", !isSmall && !isLarge && "h-8 w-8", isLarge && "h-10 w-10")} />}
        </Button>
      </div>
    </div>
  );
}
