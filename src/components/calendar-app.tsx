"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Settings2,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  Clock,
  MapPin,
  Users,
  Video,
  Link2,
  Bell,
  Trash2,
  Edit,
  Copy,
  Check,
  X
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, addDays, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO date string
  end?: string; // ISO date string
  allDay?: boolean;
  location?: string;
  url?: string;
  color?: string;
  category?: 'personal' | 'work' | 'organization' | 'group' | 'holiday';
  attendees?: Array<{
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    status?: 'accepted' | 'declined' | 'tentative' | 'pending';
  }>;
  reminders?: Array<{
    type: 'notification' | 'email';
    minutes: number;
  }>;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
    count?: number;
  };
  source?: 'local' | 'google' | 'apple' | 'microsoft' | 'slack' | 'github' | 'jira';
  externalId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarSync {
  id: string;
  provider: 'google' | 'apple' | 'microsoft' | 'outlook' | 'slack' | 'github' | 'jira';
  name: string;
  enabled: boolean;
  lastSynced?: string;
  calendarId?: string;
  accessToken?: string;
  refreshToken?: string;
  color?: string;
}

export interface CalendarAppProps {
  events?: CalendarEvent[];
  syncs?: CalendarSync[];
  onEventCreate?: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onEventDelete?: (eventId: string) => Promise<void>;
  onSyncToggle?: (syncId: string, enabled: boolean) => Promise<void>;
  onSyncRefresh?: (syncId: string) => Promise<void>;
  onOpenExternal?: () => void;
  isFullscreen?: boolean;
  className?: string;
}

// Day names in Turkish (aligned)
const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const fullDayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// Event colors by category
const categoryColors: Record<string, string> = {
  personal: 'bg-blue-500',
  work: 'bg-green-500',
  organization: 'bg-purple-500',
  group: 'bg-orange-500',
  holiday: 'bg-red-500'
};

// Provider icons/colors
const providerConfig: Record<string, { name: string; color: string }> = {
  google: { name: 'Google Calendar', color: 'bg-blue-500' },
  apple: { name: 'Apple Calendar', color: 'bg-gray-700' },
  microsoft: { name: 'Microsoft Calendar', color: 'bg-blue-600' },
  outlook: { name: 'Outlook', color: 'bg-cyan-500' },
  slack: { name: 'Slack', color: 'bg-purple-600' },
  github: { name: 'GitHub', color: 'bg-gray-900' },
  jira: { name: 'Jira', color: 'bg-blue-700' }
};

export function CalendarApp({
  events = [],
  syncs = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onSyncToggle,
  onSyncRefresh,
  onOpenExternal,
  isFullscreen = false,
  className
}: CalendarAppProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = React.useState(false);
  const [isCreateMode, setIsCreateMode] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'month' | 'week' | 'day'>('month');
  const [isSyncing, setIsSyncing] = React.useState(false);
  
  // New event form state
  const [newEvent, setNewEvent] = React.useState({
    title: '',
    description: '',
    start: '',
    end: '',
    allDay: false,
    location: '',
    category: 'personal' as CalendarEvent['category'],
    color: ''
  });

  // Navigate months
  const goToPrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Get days for current month view (including overflow from prev/next months)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get events for a specific day
  const getEventsForDay = (day: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = parseISO(event.start);
      return isSameDay(eventDate, day);
    });
  };

  // Handle day click
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  // Handle day double-click (create event)
  const handleDayDoubleClick = (day: Date) => {
    setSelectedDate(day);
    setIsCreateMode(true);
    setNewEvent({
      ...newEvent,
      start: format(day, "yyyy-MM-dd'T'HH:mm"),
      end: format(addDays(day, 0), "yyyy-MM-dd'T'23:59")
    });
    setIsEventDialogOpen(true);
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsCreateMode(false);
    setIsEventDialogOpen(true);
  };

  // Create new event
  const handleCreateEvent = async () => {
    if (!newEvent.title.trim()) {
      toast({
        title: "Hata",
        description: "Etkinlik başlığı gereklidir.",
        variant: "destructive"
      });
      return;
    }

    try {
      await onEventCreate?.({
        ...newEvent,
        source: 'local'
      });
      setIsEventDialogOpen(false);
      setNewEvent({
        title: '',
        description: '',
        start: '',
        end: '',
        allDay: false,
        location: '',
        category: 'personal',
        color: ''
      });
      toast({
        title: "Etkinlik Oluşturuldu",
        description: `"${newEvent.title}" başarıyla eklendi.`
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Etkinlik oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await onEventDelete?.(eventId);
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Etkinlik Silindi",
        description: "Etkinlik başarıyla silindi."
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Etkinlik silinirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  // Sync all calendars
  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const enabledSyncs = syncs.filter(s => s.enabled);
      for (const sync of enabledSyncs) {
        await onSyncRefresh?.(sync.id);
      }
      toast({
        title: "Senkronizasyon Tamamlandı",
        description: `${enabledSyncs.length} takvim güncellendi.`
      });
    } catch (error) {
      toast({
        title: "Senkronizasyon Hatası",
        description: "Bazı takvimler senkronize edilemedi.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-background",
      isFullscreen && "fixed inset-0 z-50",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Takvim</h1>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[160px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: tr })}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Bugün
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Ay</SelectItem>
              <SelectItem value="week">Hafta</SelectItem>
              <SelectItem value="day">Gün</SelectItem>
            </SelectContent>
          </Select>

          {/* Sync Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={isSyncing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
            Senkronize Et
          </Button>

          {/* Create Event */}
          <Button
            size="sm"
            onClick={() => {
              setIsCreateMode(true);
              setNewEvent({
                ...newEvent,
                start: format(selectedDate || new Date(), "yyyy-MM-dd'T'09:00"),
                end: format(selectedDate || new Date(), "yyyy-MM-dd'T'10:00")
              });
              setIsEventDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Etkinlik Ekle
          </Button>

          {/* Settings Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Bağlı Takvimler</DropdownMenuLabel>
              {syncs.map(sync => (
                <DropdownMenuCheckboxItem
                  key={sync.id}
                  checked={sync.enabled}
                  onCheckedChange={(checked) => onSyncToggle?.(sync.id, checked)}
                >
                  <div className={cn("w-2 h-2 rounded-full mr-2", providerConfig[sync.provider]?.color)} />
                  {sync.name}
                  {sync.lastSynced && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {format(parseISO(sync.lastSynced), 'HH:mm')}
                    </span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Takvim Bağla
              </DropdownMenuItem>
              {onOpenExternal && (
                <DropdownMenuItem onClick={onOpenExternal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Yeni Sekmede Aç
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'month' && (
          <div className="h-full flex flex-col">
            {/* Day names header - ALIGNED */}
            <div className="grid grid-cols-7 border-b">
              {dayNames.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    "py-2 text-center text-sm font-medium text-muted-foreground",
                    (index === 5 || index === 6) && "text-red-500/70"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={index}
                    className={cn(
                      "border-r border-b p-1 min-h-[100px] cursor-pointer transition-colors",
                      !isCurrentMonth && "bg-muted/30",
                      isSelected && "bg-primary/10",
                      isTodayDate && "bg-primary/5",
                      "hover:bg-muted/50"
                    )}
                    onClick={() => handleDayClick(day)}
                    onDoubleClick={() => handleDayDoubleClick(day)}
                  >
                    {/* Day number */}
                    <div className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-full text-sm mb-1",
                      isTodayDate && "bg-primary text-primary-foreground font-bold",
                      !isCurrentMonth && "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                    </div>

                    {/* Events */}
                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
                            event.color || categoryColors[event.category || 'personal'],
                            "text-white"
                          )}
                          onClick={(e) => handleEventClick(event, e)}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-muted-foreground pl-1">
                          +{dayEvents.length - 3} daha
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Day Panel */}
      {selectedDate && (
        <div className="border-t p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">
              {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: tr })}
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDayDoubleClick(selectedDate)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Etkinlik Ekle
            </Button>
          </div>
          
          <ScrollArea className="max-h-32">
            <div className="space-y-2">
              {getEventsForDay(selectedDate).length === 0 ? (
                <p className="text-sm text-muted-foreground">Bu gün için etkinlik yok.</p>
              ) : (
                getEventsForDay(selectedDate).map(event => (
                  <Card key={event.id} className="p-2 cursor-pointer hover:bg-muted/50" onClick={(e) => handleEventClick(event, e)}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", event.color || categoryColors[event.category || 'personal'])} />
                      <span className="font-medium text-sm">{event.title}</span>
                      {!event.allDay && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(parseISO(event.start), 'HH:mm')}
                          {event.end && ` - ${format(parseISO(event.end), 'HH:mm')}`}
                        </span>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Yeni Etkinlik' : (selectedEvent?.title || 'Etkinlik')}
            </DialogTitle>
          </DialogHeader>

          {isCreateMode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Başlık</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Etkinlik başlığı"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Başlangıç</label>
                  <Input
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bitiş</label>
                  <Input
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Konum</label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Konum ekle"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <Select
                  value={newEvent.category}
                  onValueChange={(v) => setNewEvent({ ...newEvent, category: v as CalendarEvent['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Kişisel</SelectItem>
                    <SelectItem value="work">İş</SelectItem>
                    <SelectItem value="organization">Organizasyon</SelectItem>
                    <SelectItem value="group">Grup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Açıklama</label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Etkinlik açıklaması"
                  rows={3}
                />
              </div>
            </div>
          ) : selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", selectedEvent.color || categoryColors[selectedEvent.category || 'personal'])} />
                <Badge variant="secondary">{selectedEvent.category || 'Kişisel'}</Badge>
                {selectedEvent.source && selectedEvent.source !== 'local' && (
                  <Badge variant="outline" className="text-xs">
                    {providerConfig[selectedEvent.source]?.name}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {selectedEvent.allDay ? (
                  'Tüm gün'
                ) : (
                  <>
                    {format(parseISO(selectedEvent.start), 'd MMM HH:mm', { locale: tr })}
                    {selectedEvent.end && ` - ${format(parseISO(selectedEvent.end), 'HH:mm')}`}
                  </>
                )}
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {selectedEvent.location}
                </div>
              )}

              {selectedEvent.description && (
                <p className="text-sm">{selectedEvent.description}</p>
              )}

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4" />
                    Katılımcılar ({selectedEvent.attendees.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.attendees.map(attendee => (
                      <Badge key={attendee.id} variant="secondary" className="text-xs">
                        {attendee.name}
                        {attendee.status === 'accepted' && <Check className="h-3 w-3 ml-1 text-green-500" />}
                        {attendee.status === 'declined' && <X className="h-3 w-3 ml-1 text-red-500" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedEvent.url} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-2" />
                    Toplantıya Katıl
                  </a>
                </Button>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {!isCreateMode && selectedEvent && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              İptal
            </Button>
            {isCreateMode && (
              <Button onClick={handleCreateEvent}>
                Oluştur
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CalendarApp;
