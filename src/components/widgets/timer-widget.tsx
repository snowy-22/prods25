// src/components/widgets/timer-widget.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Play, Pause, RotateCw, Hourglass } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const playAlertSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
    }, 300); // Beep for 300ms
};

interface TimerWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function TimerWidget({ size = 'medium' }: TimerWidgetProps) {
  const [initialTime, setInitialTime] = useState({ h: 0, m: 5, s: 0 });
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      toast({
        title: "Süre Doldu!",
        description: "Zamanlayıcı tamamlandı.",
      });
      playAlertSound();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, toast]);

  const handleStart = () => {
    if (timeLeft === 0) {
        const totalSeconds = (initialTime.h * 3600) + (initialTime.m * 60) + initialTime.s;
        setTimeLeft(totalSeconds);
    }
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(0);
  };
  
  const handleInputChange = (unit: 'h' | 'm' | 's', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
        setInitialTime(prev => ({...prev, [unit]: numValue}));
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-card text-center",
      isSmall && "p-2",
      !isSmall && !isLarge && "p-4",
      isLarge && "p-6"
    )}>
      <h3 className={cn(
        "font-semibold mb-2 flex items-center justify-center gap-2",
        isSmall && "text-xs",
        !isSmall && !isLarge && "text-sm",
        isLarge && "text-lg"
      )}>
        <Hourglass className={cn(isSmall && "h-3 w-3", !isSmall && !isLarge && "h-4 w-4", isLarge && "h-5 w-5")}/>
        Zamanlayıcı
      </h3>
      
      {timeLeft > 0 || isActive ? (
        <div className={cn(
          "flex-1 flex items-center justify-center font-mono text-foreground",
          isSmall && "text-2xl",
          !isSmall && !isLarge && "text-6xl",
          isLarge && "text-8xl"
        )}>
          {formatTime(timeLeft)}
        </div>
      ) : (
        <div className={cn(
          "flex-1 flex items-center justify-center",
          isSmall && "gap-0.5",
          !isSmall && !isLarge && "gap-1",
          isLarge && "gap-2"
        )}>
            <Input 
              type="number" 
              value={initialTime.h} 
              onChange={e => handleInputChange('h', e.target.value)} 
              className={cn(
                "text-center",
                isSmall && "w-8 text-sm h-8",
                !isSmall && !isLarge && "w-20 text-4xl h-20",
                isLarge && "w-28 text-6xl h-28"
              )} 
            />
            <span className={cn(
              isSmall && "text-sm",
              !isSmall && !isLarge && "text-4xl",
              isLarge && "text-6xl"
            )}>:</span>
            <Input 
              type="number" 
              value={initialTime.m} 
              onChange={e => handleInputChange('m', e.target.value)} 
              className={cn(
                "text-center",
                isSmall && "w-8 text-sm h-8",
                !isSmall && !isLarge && "w-20 text-4xl h-20",
                isLarge && "w-28 text-6xl h-28"
              )} 
            />
            <span className={cn(
              isSmall && "text-sm",
              !isSmall && !isLarge && "text-4xl",
              isLarge && "text-6xl"
            )}>:</span>
            <Input 
              type="number" 
              value={initialTime.s} 
              onChange={e => handleInputChange('s', e.target.value)} 
              className={cn(
                "text-center",
                isSmall && "w-8 text-sm h-8",
                !isSmall && !isLarge && "w-20 text-4xl h-20",
                isLarge && "w-28 text-6xl h-28"
              )} 
            />
        </div>
      )}

      <div className={cn(
        "grid grid-cols-2",
        isSmall && "gap-1",
        !isSmall && !isLarge && "gap-2",
        isLarge && "gap-3"
      )}>
        <Button 
          onClick={isActive ? handlePause : handleStart} 
          variant={isActive ? 'destructive' : 'default'}
          className={cn(
            isSmall && "h-7 text-xs",
            isLarge && "h-12 text-lg"
          )}
        >
          {isActive ? <Pause className={cn(isSmall && "mr-1 h-3 w-3", !isSmall && "mr-2 h-4 w-4")} /> : <Play className={cn(isSmall && "mr-1 h-3 w-3", !isSmall && "mr-2 h-4 w-4")} />}
          {isActive ? 'Durdur' : 'Başlat'}
        </Button>
        <Button 
          onClick={handleReset} 
          variant="outline"
          className={cn(
            isSmall && "h-7 text-xs",
            isLarge && "h-12 text-lg"
          )}
        >
          <RotateCw className={cn(isSmall && "mr-1 h-3 w-3", !isSmall && "mr-2 h-4 w-4")} />
          Sıfırla
        </Button>
      </div>
    </div>
  );
}
