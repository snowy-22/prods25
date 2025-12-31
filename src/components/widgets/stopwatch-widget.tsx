// src/components/widgets/stopwatch-widget.tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Play, Pause, RotateCw, Flag } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface StopwatchWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function StopwatchWidget({ size = 'medium' }: StopwatchWidgetProps) {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    setIsActive(true);
    intervalRef.current = setInterval(() => {
      setTime(prevTime => prevTime + 10);
    }, 10);
  };

  const handlePause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsActive(false);
  };

  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsActive(false);
    setTime(0);
    setLaps([]);
  };
  
  const handleLap = () => {
    setLaps([time, ...laps]);
  }

  const formatTime = (timeMs: number) => {
    const minutes = Math.floor(timeMs / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((timeMs % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = (timeMs % 1000).toString().padStart(3, '0').slice(0, 2);
    return `${minutes}:${seconds}.${milliseconds}`;
  };

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-background text-center",
      isSmall && "p-2",
      !isSmall && !isLarge && "p-4",
      isLarge && "p-6"
    )}>
      <div className="flex-1 flex items-center justify-center">
        <p className={cn(
          "font-mono text-foreground",
          isSmall && "text-2xl",
          !isSmall && !isLarge && "text-6xl",
          isLarge && "text-8xl"
        )}>{formatTime(time)}</p>
      </div>
      <div className={cn(
        "grid grid-cols-2 mb-4",
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
       <div className={cn(
         'flex flex-col border rounded-lg overflow-hidden bg-muted',
         isSmall && "h-20",
         !isSmall && !isLarge && "h-32",
         isLarge && "h-48"
       )}>
            <div className={cn(
              'flex justify-between items-center border-b bg-card',
              isSmall && "p-1",
              !isSmall && !isLarge && "p-2",
              isLarge && "p-3"
            )}>
                <h3 className={cn(
                  "font-semibold",
                  isSmall && "text-xs",
                  !isSmall && !isLarge && "text-sm",
                  isLarge && "text-base"
                )}>Tur Zamanları</h3>
                <Button 
                  size={isSmall ? "sm" : "default"} 
                  onClick={handleLap} 
                  disabled={!isActive}
                  className={cn(isSmall && "h-6 text-xs px-2")}
                >
                  <Flag className={cn(isSmall && 'mr-1 h-3 w-3', !isSmall && 'mr-2 h-4 w-4')}/> 
                  Tur
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className={cn(
                  'font-mono',
                  isSmall && "p-1 text-xs",
                  !isSmall && !isLarge && "p-2 text-sm",
                  isLarge && "p-3 text-base"
                )}>
                {laps.map((lap, index) => (
                    <div key={`lap-${index}-${lap}`} className="flex justify-between">
                        <span>Tur {laps.length - index}</span>
                        <span>{formatTime(lap)}</span>
                    </div>
                ))}
                </div>
            </ScrollArea>
       </div>
    </div>
  );
}
