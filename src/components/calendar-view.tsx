
'use client';

import { useState, useMemo } from 'react';
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfDay, startOfMonth, endOfMonth, getYear, setMonth, getMonth, subYears, addYears } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, MapPin, User, StickyNote, Bell, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentItem, ItemType } from '@/lib/initial-content';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import PlayerFrame from '@/components/player-frame';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useHotkeys } from 'react-hotkeys-hook';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';

type ViewMode = 'yearly' | 'monthly' | 'weekly' | 'daily';

interface CalendarViewProps {
    item: ContentItem;
    allItems: ContentItem[];
    onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
    onAddItem: (itemData: Partial<ContentItem> & { type: ItemType }, parentId: string | null) => void;
    widgetTemplates: Record<string, Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'parentId'>[]>;
}


const EventPill = ({ event, onEventClick }: { event: ContentItem, onEventClick: (event: ContentItem) => void }) => {
    const bgColor = 'hsl(var(--primary))';
    return (
        <div 
            onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
            className="p-1 rounded-md text-xs truncate cursor-pointer text-white"
            style={{ backgroundColor: bgColor }}
        >
            {event.title}
        </div>
    );
};

const Month = ({ monthDate, events, onAddEvent, onEventClick }: { monthDate: Date, events: ContentItem[], onAddEvent: (day: Date, action: string) => void, onEventClick: (event: ContentItem) => void }) => {
    const firstDayOfMonth = startOfMonth(monthDate);
    const lastDayOfMonth = endOfMonth(monthDate);
    const startDate = startOfWeek(firstDayOfMonth, { locale: tr });
    const endDate = endOfWeek(lastDayOfMonth, { locale: tr });
    const daysInView = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div className="flex flex-col relative">
            <div className="relative py-4 px-4 flex items-center justify-center border-b bg-muted/20">
                <h2 className="text-6xl font-black text-destructive/10 uppercase absolute">
                    {format(monthDate, 'MMMM', { locale: tr })}
                </h2>
            </div>
            <div className="grid grid-cols-7 flex-1 z-10">
                {daysInView.map(day => {
                    const dayEvents = events.filter(e => e.startDate && isSameDay(new Date(e.startDate), day));
                    return (
                        <div key={day.toString()} className={cn("border-b border-r p-1 relative group min-h-[90px]", !isSameMonth(day, monthDate) && "bg-muted/30 text-muted-foreground/50")}>
                            <div className={cn("text-xs font-semibold", isSameDay(day, new Date()) && "text-primary font-bold")}>
                                {format(day, 'd')}
                            </div>
                            <div className="mt-1 space-y-1">
                                {dayEvents.slice(0, 2).map(event => (
                                    <EventPill key={event.id} event={event} onEventClick={onEventClick} />
                                ))}
                                {dayEvents.length > 2 && <div className="text-xs text-muted-foreground">+_</div>}
                            </div>
                             <Popover>
                                <PopoverTrigger asChild>
                                     <Button size="icon" variant="ghost" className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-1" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col">
                                        <Button variant="ghost" className="justify-start" onClick={() => onAddEvent(day, 'url')}>
                                            <LinkIcon className="mr-2 h-4 w-4" /> URL Ekle
                                        </Button>
                                        <Button variant="ghost" className="justify-start" onClick={() => onAddEvent(day, 'note')}>
                                            <StickyNote className="mr-2 h-4 w-4" /> Not Ekle
                                        </Button>
                                        <Button variant="ghost" className="justify-start" onClick={() => onAddEvent(day, 'reminder')}>
                                            <Bell className="mr-2 h-4 w-4" /> Hatırlatıcı
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export default function CalendarView({ item: calendarItem, allItems, onUpdateItem, onAddItem, widgetTemplates }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedEvent, setSelectedEvent] = useState<ContentItem | null>(null);
  const { toast } = useToast();

  const calendarEvents = useMemo(() => {
    const sourceIds = [calendarItem.id, ...(calendarItem.calendarSources || [])];
    return allItems.filter(item => 
        item.startDate && 
        item.parentId && 
        sourceIds.includes(item.parentId)
    );
  }, [allItems, calendarItem]);


  const handlePrev = () => {
    if (viewMode === 'monthly') setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNext = () => {
    if (viewMode === 'monthly') setCurrentDate(prev => addMonths(prev, 1));
  };
  
  const handleAddEvent = async (day: Date, action: string) => {
     let newItemData: Partial<ContentItem> & { type: ItemType };

     if (action === 'url') {
        const url = prompt("Eklemek istediğiniz içeriğin URL'sini girin:", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        if (!url) return;
        newItemData = { type: 'website', url: url, title: 'Yeni İçerik' };
     } else if (action === 'note') {
        const content = prompt("Notunuzu girin:");
        newItemData = { type: 'notes', title: `Not - ${format(day, 'dd.MM')}`, content: content || '' };
     } else if (action === 'reminder') {
         const title = prompt("Hatırlatıcı başlığı:");
         newItemData = { type: 'file', title: title || 'Yeni Hatırlatıcı', icon: 'bell' };
     } else {
        return;
     }

    const finalItemData = {
      ...newItemData,
      startDate: day.toISOString(),
    };
     
    onAddItem(finalItemData, calendarItem.id);
    toast({ title: "Öğe Eklendi", description: `"${finalItemData.title}" takvime eklendi.` });
  };


  const Header = () => (
    <div className="flex items-center justify-between p-2 border-b">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}><ChevronLeft className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}><ChevronRight className="h-5 w-5" /></Button>
         <Button variant="outline" size="sm" className="h-7" onClick={() => setCurrentDate(new Date())}>Bugün</Button>
      </div>
       <span className="text-sm font-semibold">
          {format(currentDate, 'MMMM yyyy', { locale: tr })}
      </span>
      <div />
    </div>
  );
  
  const MonthlyViewHeader = () => {
    const daysOfWeek = eachDayOfInterval({
        start: startOfWeek(new Date(), { locale: tr }),
        end: endOfWeek(new Date(), { locale: tr }),
    });
    return (
        <div className="grid grid-cols-7 sticky top-0 bg-background/80 backdrop-blur-sm z-20">
            {daysOfWeek.map(day => (
                <div key={day.toString()} className="text-center font-bold py-1 border-b border-r text-xs text-muted-foreground">
                    {format(day, 'EEE', { locale: tr })}
                </div>
            ))}
        </div>
    );
  };

  useHotkeys('esc', () => setSelectedEvent(null), { enableOnFormTags: true });

  return (
    <div className="flex flex-col h-full bg-card text-foreground">
      <Header />
      <div className="flex-1 overflow-auto">
        {viewMode === 'monthly' && (
             <div className="relative">
                <MonthlyViewHeader />
                <Month 
                    monthDate={currentDate} 
                    events={calendarEvents} 
                    onAddEvent={handleAddEvent}
                    onEventClick={setSelectedEvent}
                />
            </div>
        )}
      </div>

       <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
            <DialogContent className="max-w-xl h-[60vh] flex flex-col p-0 gap-0">
                 {selectedEvent && (
                    <>
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle>{selectedEvent.title}</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 min-h-0">
                             <PlayerFrame 
                                item={selectedEvent} isEditMode={false} layoutMode='free' isPlayerHeaderVisible={false}
                                isPlayerSettingsVisible={false} onLoad={() => {}} onMouseDown={() => {}}
                                isSelected={false} onUpdateItem={() => {}}
                                onDeleteItem={() => {}} onCopyItem={() => {}} onShare={() => {}}
                                onShowInfo={() => {}} onNewItemInPlayer={() => {}} onPreviewItem={() => {}} onItemClick={() => {}}
                                onSaveItem={() => {}}
                            >
                                <div className="p-4">
                                  <p>{selectedEvent.content || selectedEvent.url}</p>
                                </div>
                            </PlayerFrame>
                        </div>
                    </>
                 )}
            </DialogContent>
        </Dialog>
    </div>
  );
}
