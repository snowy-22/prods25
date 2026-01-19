
"use client";

import { Calendar } from "@/components/ui/calendar"
import { useState, useEffect } from "react";
import { tr } from 'date-fns/locale';
import { ContentItem } from "@/lib/initial-content";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { useAppStore } from "@/lib/store";

interface CalendarWidgetProps {
    item: ContentItem;
    onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
    onSetView?: (item: ContentItem) => void;
    size?: 'small' | 'medium' | 'large';
}


export default function CalendarWidget({ item, onUpdateItem, onSetView, size = 'medium' }: CalendarWidgetProps) {
  const [date, setDate] = useState<Date | undefined>(item.startDate ? new Date(item.startDate) : new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const { openInNewTab } = useAppStore();

  const handleDayClick = (day: Date) => {
    setDate(day);
    if (day) {
        onUpdateItem(item.id, { startDate: day.toISOString() });
    }
    if(onSetView && item.type === 'calendar') {
        onSetView(item);
    }
  }

  // Navigate months
  const goToPrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  const goToNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Open full calendar app in new tab
  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    const calendarAppItem: ContentItem = {
      id: `calendar-app-${Date.now()}`,
      type: 'calendar-app',
      title: 'Takvim',
      icon: 'calendar',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: null,
      isDeletable: true,
      // Pass selected date to the app
      startDate: date?.toISOString(),
    };
    openInNewTab(calendarAppItem, []);
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center h-full w-full bg-background text-foreground cursor-pointer overflow-hidden relative group",
        size === 'large' ? "p-8" : size === 'medium' ? "p-4" : "p-1"
      )}
      onDoubleClick={() => {if(onSetView) onSetView(item)}}
    >
        {/* Month navigation for medium/large sizes */}
        {size !== 'small' && (
          <div className="flex items-center justify-between w-full max-w-[280px] mb-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(currentMonth, 'MMMM yyyy', { locale: tr })}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Calendar
            mode="single"
            selected={date}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
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
        
        {/* Open in new tab button - visible on hover */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          onClick={handleOpenInNewTab}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Yeni Sekmede Aç
        </Button>

        {size === 'large' && (
            <div className="mt-8 w-full max-w-md p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Seçili Tarih Detayları</h4>
                  <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Tam Takvim
                  </Button>
                </div>
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
