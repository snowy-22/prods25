"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { WidgetSize, DEFAULT_WIDGET_SIZE, getWidgetSizeConfig, getWidgetFeatureFlags } from '@/lib/widget-sizes';
import { ToolkitWidgetWrapper } from '@/components/toolkit-widget-wrapper';

/**
 * Digital Clock Widget - ENHANCED
 * 
 * ✅ 5 Responsive Sizes (XS, S, M, L, XL)
 * ✅ Toolkit Library UI Consistency
 * ✅ Size-dependent features (seconds, timezone, extended info)
 */
interface DigitalClockWidgetProps {
  size?: WidgetSize;
  showWrapper?: boolean;
  onSizeChange?: (size: WidgetSize) => void;
}

export default function DigitalClockWidget({ 
  size = DEFAULT_WIDGET_SIZE,
  showWrapper = true,
  onSizeChange
}: DigitalClockWidgetProps) {
  const [date, setDate] = useState<Date | null>(null);
  const sizeConfig = getWidgetSizeConfig(size);
  const features = getWidgetFeatureFlags(size);

  useEffect(() => {
    setDate(new Date());
    const timerId = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // Font sizes per size
  const timeFontSizes = {
    XS: 'text-2xl',
    S: 'text-4xl',
    M: 'text-6xl',
    L: 'text-8xl',
    XL: 'text-9xl',
  };

  const dayFontSizes = {
    XS: 'text-xs',
    S: 'text-sm',
    M: 'text-xl',
    L: 'text-3xl',
    XL: 'text-4xl',
  };

  const dateFontSizes = {
    XS: 'text-[10px]',
    S: 'text-xs',
    M: 'text-lg',
    L: 'text-2xl',
    XL: 'text-3xl',
  };

  const content = !date ? (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full w-full text-center">
      {/* Time */}
      <div 
        className={cn(
          "font-bold tracking-tighter",
          timeFontSizes[size]
        )} 
        style={{fontVariantNumeric: 'tabular-nums'}}
      >
        {format(date, features.showSeconds ? 'HH:mm:ss' : 'HH:mm')}
      </div>

      {/* Day of week */}
      <div className={cn(
        "font-medium capitalize",
        dayFontSizes[size]
      )}>
        {format(date, 'eeee', { locale: tr })}
      </div>

      {/* Date */}
      <div className={cn(
        "text-muted-foreground",
        dateFontSizes[size]
      )}>
        {format(date, 'd MMMM yyyy', { locale: tr })}
      </div>

      {/* Extended info (timezone) - shown only in L and XL */}
      {features.showTimezone && (
        <div className="mt-2 text-xs text-muted-foreground">
          Türkiye (UTC+3)
        </div>
      )}
    </div>
  );

  if (!showWrapper) {
    return content;
  }

  return (
    <ToolkitWidgetWrapper
      title="Digital Clock"
      icon={<Clock className="h-4 w-4" />}
      size={size}
      onSizeChange={onSizeChange}
    >
      {content}
    </ToolkitWidgetWrapper>
  );
}
