'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export type ClockStyle = 'digital' | 'analog';

interface MicroClockWidgetProps {
  style?: ClockStyle;
  showSeconds?: boolean;
  show24Hour?: boolean;
  showDate?: boolean;
  showDay?: boolean;
  className?: string;
  draggable?: boolean;
  onPositionChange?: (x: number) => void;
  initialX?: number;
  containerRef?: React.RefObject<HTMLElement>;
}

export function MicroClockWidget({
  style = 'digital',
  showSeconds = false,
  show24Hour = true,
  showDate = false,
  showDay = false,
  className,
  draggable = false,
  onPositionChange,
  initialX = 50, // % position
  containerRef,
}: MicroClockWidgetProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(initialX);
  const clockRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const startPosition = useRef(0);

  // Update time every second
  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    startPosition.current = position;
  }, [draggable, position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef?.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX.current;
    const deltaPercent = (deltaX / containerRect.width) * 100;
    
    const newPosition = Math.max(10, Math.min(90, startPosition.current + deltaPercent));
    setPosition(newPosition);
  }, [isDragging, containerRef]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange?.(position);
    }
  }, [isDragging, position, onPositionChange]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!time) {
    return null;
  }

  const hours = show24Hour ? time.getHours() : time.getHours() % 12 || 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ampm = time.getHours() >= 12 ? 'PM' : 'AM';

  // Turkish day names
  const turkishDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const turkishMonths = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  
  const dayName = turkishDays[time.getDay()];
  const dateString = `${time.getDate()} ${turkishMonths[time.getMonth()]} ${time.getFullYear()}`;
  const hasSubLine = showDay || showDate;

  // Digital clock
  if (style === 'digital') {
    return (
      <div
        ref={clockRef}
        onMouseDown={handleMouseDown}
        className={cn(
          "flex flex-col items-center select-none",
          draggable && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-80",
          className
        )}
        style={draggable ? { 
          position: 'absolute', 
          left: `${position}%`, 
          transform: 'translateX(-50%)',
          zIndex: isDragging ? 100 : 10
        } : undefined}
      >
        {/* Time row */}
        <div className="flex items-center gap-0.5 font-mono text-xs">
          <span className="tabular-nums">
            {hours.toString().padStart(2, '0')}
          </span>
          <span className="animate-pulse">:</span>
          <span className="tabular-nums">
            {minutes.toString().padStart(2, '0')}
          </span>
          {showSeconds && (
            <>
              <span className="animate-pulse">:</span>
              <span className="tabular-nums text-muted-foreground">
                {seconds.toString().padStart(2, '0')}
              </span>
            </>
          )}
          {!show24Hour && (
            <span className="text-[10px] text-muted-foreground ml-0.5">{ampm}</span>
          )}
        </div>
        {/* Date/Day sub-line */}
        {hasSubLine && (
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-sans leading-tight">
            {showDay && <span>{dayName}</span>}
            {showDay && showDate && <span>•</span>}
            {showDate && <span>{dateString}</span>}
          </div>
        )}
      </div>
    );
  }

  // Analog clock
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6;
  const secondDeg = seconds * 6;

  return (
    <div
      ref={clockRef}
      onMouseDown={handleMouseDown}
      className={cn(
        "flex flex-col items-center select-none",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-80",
        className
      )}
      style={draggable ? { 
        position: 'absolute', 
        left: `${position}%`, 
        transform: 'translateX(-50%)',
        zIndex: isDragging ? 100 : 10
      } : undefined}
    >
      {/* Analog clock face */}
      <div className={cn(
        "relative w-6 h-6 rounded-full border border-border bg-background/50",
        isDragging && "ring-2 ring-primary"
      )}>
        {/* Hour markers */}
        {[0, 3, 6, 9].map((h) => (
          <div
            key={h}
            className="absolute w-0.5 h-0.5 bg-foreground/30 rounded-full"
            style={{
              top: h === 0 ? '2px' : h === 6 ? 'auto' : '50%',
              bottom: h === 6 ? '2px' : 'auto',
              left: h === 9 ? '2px' : h === 3 ? 'auto' : '50%',
              right: h === 3 ? '2px' : 'auto',
              transform: [0, 6].includes(h) ? 'translateX(-50%)' : [3, 9].includes(h) ? 'translateY(-50%)' : 'none'
            }}
          />
        ))}
        
        {/* Hour hand */}
        <div
          className="absolute left-1/2 bottom-1/2 w-0.5 h-2 bg-foreground origin-bottom rounded-full"
          style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
        />
        
        {/* Minute hand */}
        <div
          className="absolute left-1/2 bottom-1/2 w-[1px] h-2.5 bg-foreground/80 origin-bottom rounded-full"
          style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
        />
        
        {/* Second hand */}
        {showSeconds && (
          <div
            className="absolute left-1/2 bottom-1/2 w-[0.5px] h-2.5 bg-primary origin-bottom"
            style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
          />
        )}
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-foreground rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>
      
      {/* Date/Day sub-line */}
      {hasSubLine && (
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-sans leading-tight mt-0.5">
          {showDay && <span>{dayName}</span>}
          {showDay && showDate && <span>•</span>}
          {showDate && <span>{dateString}</span>}
        </div>
      )}
    </div>
  );
}

export default MicroClockWidget;
