"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { cn } from '@/lib/utils';

export default function DigitalClockWidget({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    setDate(new Date());
    const timerId = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  if (!date) return null;

  return (
    <div className={cn(
        "flex flex-col items-center justify-center h-full w-full bg-background text-foreground p-4 text-center",
        size === 'small' && "p-2",
        size === 'large' && "p-8"
    )}>
      <div className={cn(
          "font-bold tracking-tighter",
          size === 'small' ? "text-2xl" : size === 'large' ? "text-9xl" : "text-6xl"
      )} style={{fontVariantNumeric: 'tabular-nums'}}>
        {format(date, size === 'small' ? 'HH:mm' : 'HH:mm:ss')}
      </div>
      <div className={cn(
          "font-medium capitalize",
          size === 'small' ? "text-xs" : size === 'large' ? "text-4xl" : "text-xl"
      )}>
        {format(date, 'eeee', { locale: tr })}
      </div>
      <div className={cn(
          "text-muted-foreground",
          size === 'small' ? "text-[10px]" : size === 'large' ? "text-2xl" : "text-lg"
      )}>
        {format(date, 'd MMMM yyyy', { locale: tr })}
      </div>
    </div>
  );
}
