
"use client";

import { Calendar } from "@/components/ui/calendar"
import { useState, useEffect } from "react";
import { tr } from 'date-fns/locale';
import { ContentItem } from "@/lib/initial-content";
import { cn } from "@/lib/utils";

interface CalendarWidgetProps {
    item: ContentItem;
    onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
    onSetView?: (item: ContentItem) => void;
    size?: 'small' | 'medium' | 'large';
}


export default function CalendarWidget({ item, onUpdateItem, onSetView, size = 'medium' }: CalendarWidgetProps) {
  const [date, setDate] = useState<Date | undefined>(item.startDate ? new Date(item.startDate) : new Date());

  const handleDayClick = (day: Date) => {
    setDate(day);
    if (day) {
        onUpdateItem(item.id, { startDate: day.toISOString() });
    }
    if(onSetView && item.type === 'calendar') {
        onSetView(item);
    }
  }

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center h-full w-full bg-background text-foreground cursor-pointer overflow-hidden",
        size === 'large' ? "p-8" : size === 'medium' ? "p-4" : "p-1"
      )}
      onDoubleClick={() => {if(onSetView) onSetView(item)}}
    >
        <Calendar
            mode="single"
            selected={date}
          onSelect={(selected) => {
            setDate(selected);
            if (selected) {
              onUpdateItem(item.id, { startDate: selected.toISOString() });
            }
          }}
            onDayClick={handleDayClick}
            className={cn(
                "rounded-md border shadow-sm",
                size === 'small' && "scale-75 origin-center"
            )}
            locale={tr}
        />
        {size !== 'large' && (
          <div className="mt-2 text-center text-xs text-muted-foreground px-2 line-clamp-2">
            {date?.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        )}
        {size === 'large' && (
            <div className="mt-8 w-full max-w-md p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Seçili Tarih Detayları</h4>
                <p className="text-sm text-muted-foreground">
                    {date?.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>Örnek Etkinlik: Proje Toplantısı (14:00)</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
