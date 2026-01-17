"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { tr } from "date-fns/locale";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addDays,
  isToday,
  parseISO,
} from "date-fns";
import { ContentItem } from "@/lib/initial-content";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Filter,
  List,
  MapPin,
  MoreHorizontal,
  Plus,
  Settings,
  Share2,
  Trash2,
  Users,
  Eye,
  EyeOff,
  Check,
  X,
  Bell,
  Repeat,
  Link2,
  ExternalLink,
} from "lucide-react";
import { getIconByName, IconName } from "@/lib/icons";
import {
  Calendar as CalendarType,
  CalendarEvent,
  CalendarView,
  CalendarProvider,
  CALENDAR_PROVIDERS,
  CALENDAR_ICONS,
  CALENDAR_COLORS,
} from "@/lib/calendar-types";
import { calendarService } from "@/lib/calendar-service";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================
// TYPES
// ============================================================

interface AdvancedCalendarWidgetProps {
  item: ContentItem;
  onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
  onSetView?: (item: ContentItem) => void;
  size?: "xs" | "small" | "medium" | "large" | "xl";
  isFullscreen?: boolean;
}

interface LocalEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  calendarId: string;
  location?: string;
  isRecurring?: boolean;
}

// ============================================================
// MINI CALENDAR COMPONENT
// ============================================================

function MiniCalendar({
  selectedDate,
  onSelectDate,
  events,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: LocalEvent[];
}) {
  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach((e) => dates.add(format(e.start, "yyyy-MM-dd")));
    return dates;
  }, [events]);

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={(date) => date && onSelectDate(date)}
      locale={tr}
      className="rounded-md border shadow-sm p-2"
      modifiers={{
        hasEvent: (date) => eventDates.has(format(date, "yyyy-MM-dd")),
      }}
      modifiersClassNames={{
        hasEvent: "bg-primary/20 font-bold",
      }}
    />
  );
}

// ============================================================
// EVENT CARD COMPONENT
// ============================================================

function EventCard({
  event,
  onEdit,
  onDelete,
  compact = false,
}: {
  event: LocalEvent;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}) {
  const timeStr = event.allDay
    ? "Tüm Gün"
    : `${format(event.start, "HH:mm")} - ${format(event.end, "HH:mm")}`;

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer hover:bg-accent/50 transition-colors"
        style={{ borderLeft: `3px solid ${event.color}` }}
      >
        <span className="truncate flex-1">{event.title}</span>
        <span className="text-muted-foreground text-[10px]">{timeStr}</span>
      </div>
    );
  }

  return (
    <div
      className="p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      style={{ borderLeftWidth: 4, borderLeftColor: event.color }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{event.title}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeStr}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.isRecurring && (
            <div className="flex items-center gap-1 mt-1">
              <Repeat className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-primary">Tekrarlayan</span>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ============================================================
// CALENDAR SIDEBAR
// ============================================================

function CalendarSidebar({
  calendars,
  visibleCalendarIds,
  onToggleCalendar,
  onCreateCalendar,
  connectedProviders,
  onConnectProvider,
}: {
  calendars: CalendarType[];
  visibleCalendarIds: Set<string>;
  onToggleCalendar: (id: string) => void;
  onCreateCalendar: () => void;
  connectedProviders: CalendarProvider[];
  onConnectProvider: (provider: CalendarProvider) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button onClick={onCreateCalendar} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Yeni Takvim
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* My Calendars */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Takvimlerim
            </h3>
            <div className="space-y-1">
              {calendars.filter((c) => c.provider === "local").map((cal) => {
                const Icon = getIconByName(cal.icon as IconName | undefined);
                const isVisible = visibleCalendarIds.has(cal.id);
                return (
                  <div
                    key={cal.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer"
                    onClick={() => onToggleCalendar(cal.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: cal.color }}
                    />
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    <span className="flex-1 truncate text-sm">{cal.name}</span>
                    {isVisible ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    {cal.is_shared && (
                      <Share2 className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Providers */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Bağlı Hesaplar
            </h3>
            <div className="space-y-1">
              {CALENDAR_PROVIDERS.map((provider) => {
                const isConnected = connectedProviders.includes(provider.id);
                return (
                  <div
                    key={provider.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                      isConnected
                        ? "bg-accent/30 hover:bg-accent/50"
                        : "hover:bg-accent/30 opacity-60"
                    )}
                    onClick={() => !isConnected && onConnectProvider(provider.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: provider.color }}
                    />
                    <span className="flex-1 text-sm">{provider.name}</span>
                    {isConnected ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shared With Me */}
          {calendars.some((c) => c.is_shared) && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Benimle Paylaşılanlar
              </h3>
              <div className="space-y-1">
                {calendars
                  .filter((c) => c.is_shared)
                  .map((cal) => {
                    const Icon = getIconByName(cal.icon as IconName | undefined);
                    const isVisible = visibleCalendarIds.has(cal.id);
                    return (
                      <div
                        key={cal.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer"
                        onClick={() => onToggleCalendar(cal.id)}
                      >
                        <div
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: cal.color }}
                        />
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                        <span className="flex-1 truncate text-sm">{cal.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1">
                          <Users className="h-3 w-3 mr-1" />
                          Paylaşılan
                        </Badge>
                        {isVisible ? (
                          <Eye className="h-3 w-3 text-primary" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================
// CREATE EVENT DIALOG
// ============================================================

function CreateEventDialog({
  open,
  onOpenChange,
  calendars,
  selectedDate,
  onCreateEvent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendars: CalendarType[];
  selectedDate: Date;
  onCreateEvent: (event: Partial<LocalEvent>) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [calendarId, setCalendarId] = useState(calendars[0]?.id || "");
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const handleSubmit = () => {
    if (!title.trim()) return;

    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (!allDay) {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      start.setHours(startH, startM, 0, 0);
      end.setHours(endH, endM, 0, 0);
    }

    const calendar = calendars.find((c) => c.id === calendarId);

    onCreateEvent({
      title,
      description,
      location,
      start,
      end,
      allDay,
      calendarId,
      color: calendar?.color || "#3b82f6",
    });

    // Reset form
    setTitle("");
    setDescription("");
    setLocation("");
    setAllDay(false);
    setStartTime("09:00");
    setEndTime("10:00");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Yeni Etkinlik
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Başlık</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Etkinlik başlığı..."
            />
          </div>

          <div>
            <Label>Takvim</Label>
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: cal.color }}
                      />
                      {cal.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={allDay} onCheckedChange={setAllDay} />
              <Label>Tüm Gün</Label>
            </div>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Başlangıç</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label>Bitiş</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <Label>Konum</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Konum ekle..."
            />
          </div>

          <div>
            <Label>Açıklama</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Açıklama ekle..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// CREATE CALENDAR DIALOG
// ============================================================

function CreateCalendarDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (calendar: { name: string; icon: IconName; color: string }) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IconName>("calendar" as IconName);
  const [color, setColor] = useState<string>(CALENDAR_COLORS[0]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name, icon, color });
    setName("");
    setIcon("calendar" as IconName);
    setColor(CALENDAR_COLORS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Yeni Takvim Oluştur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Takvim Adı</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: İş Takvimi, Aile..."
            />
          </div>

          <div>
            <Label>İkon</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {CALENDAR_ICONS.slice(0, 12).map((iconName) => {
                const IconComp = getIconByName(iconName as IconName | undefined);
                return (
                  <Button
                    key={iconName}
                    variant={icon === iconName ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setIcon(iconName as IconName)}
                  >
                    {IconComp && <IconComp className="h-5 w-5" />}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Renk</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CALENDAR_COLORS.map((c) => (
                <button
                  key={c}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdvancedCalendarWidget({
  item,
  onUpdateItem,
  onSetView,
  size = "medium",
  isFullscreen = false,
}: AdvancedCalendarWidgetProps) {
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [showSidebar, setShowSidebar] = useState(size === "large" || size === "xl");
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [visibleCalendarIds, setVisibleCalendarIds] = useState<Set<string>>(new Set());
  const [connectedProviders, setConnectedProviders] = useState<CalendarProvider[]>([]);

  // Dialogs
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createCalendarOpen, setCreateCalendarOpen] = useState(false);

  // Size-based layout
  const isCompact = size === "xs" || size === "small";
  const showMiniCalendar = !isCompact;
  const showEventList = size !== "xs";

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const [myCalendars, sharedCalendars] = await Promise.all([
        calendarService.getMyCalendars(),
        calendarService.getSharedWithMe(),
      ]);

      const allCalendars = [...myCalendars, ...sharedCalendars];
      setCalendars(allCalendars);
      setVisibleCalendarIds(new Set(allCalendars.map((c) => c.id)));

      // Load events for current month
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const calendarEvents = await calendarService.getEventsForDateRange(start, end);

      setEvents(
        calendarEvents.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          start: parseISO(e.start_time),
          end: parseISO(e.end_time),
          allDay: e.all_day,
          color: e.color || "#3b82f6",
          calendarId: e.calendar_id,
          location: e.location,
          isRecurring: e.is_recurring,
        }))
      );

      // Load provider connections
      const connections = await calendarService.getProviderConnections();
      setConnectedProviders(connections.map((c) => c.provider as CalendarProvider));
    };

    loadData();
  }, [currentDate]);

  // Demo events for empty state
  useEffect(() => {
    if (events.length === 0 && calendars.length === 0) {
      // Add demo calendar and events
      const demoCalendar: CalendarType = {
        id: "demo-1",
        user_id: "",
        name: "Kişisel Takvim",
        slug: "personal",
        icon: "calendar",
        color: "#3b82f6",
        timezone: "Europe/Istanbul",
        default_view: "month",
        week_start: 1,
        show_weekends: true,
        show_week_numbers: false,
        is_public: false,
        is_default: true,
        is_shared: false,
        provider: "local",
        sync_enabled: false,
        sync_direction: "both",
        event_count: 3,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const demoEvents: LocalEvent[] = [
        {
          id: "demo-event-1",
          title: "Proje Toplantısı",
          start: addDays(new Date(), 1),
          end: addDays(new Date(), 1),
          allDay: false,
          color: "#3b82f6",
          calendarId: "demo-1",
          location: "Zoom",
        },
        {
          id: "demo-event-2",
          title: "Doktor Randevusu",
          start: addDays(new Date(), 3),
          end: addDays(new Date(), 3),
          allDay: false,
          color: "#ef4444",
          calendarId: "demo-1",
          location: "Merkez Hastanesi",
        },
        {
          id: "demo-event-3",
          title: "Haftalık Planlama",
          start: addDays(new Date(), 7),
          end: addDays(new Date(), 7),
          allDay: false,
          color: "#22c55e",
          calendarId: "demo-1",
          isRecurring: true,
        },
      ];

      setCalendars([demoCalendar]);
      setEvents(demoEvents);
      setVisibleCalendarIds(new Set(["demo-1"]));
    }
  }, [calendars.length, events.length]);

  // Filtered events
  const visibleEvents = useMemo(() => {
    return events.filter((e) => visibleCalendarIds.has(e.calendarId));
  }, [events, visibleCalendarIds]);

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    return visibleEvents.filter((e) => isSameDay(e.start, selectedDate));
  }, [visibleEvents, selectedDate]);

  // Handlers
  const handlePrevMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setCurrentDate((d) => addMonths(d, 1));
  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleToggleCalendar = (id: string) => {
    setVisibleCalendarIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateEvent = async (eventData: Partial<LocalEvent>) => {
    const newEvent: LocalEvent = {
      id: `event-${Date.now()}`,
      title: eventData.title || "",
      description: eventData.description,
      start: eventData.start || new Date(),
      end: eventData.end || new Date(),
      allDay: eventData.allDay || false,
      color: eventData.color || "#3b82f6",
      calendarId: eventData.calendarId || calendars[0]?.id || "",
      location: eventData.location,
    };

    setEvents((prev) => [...prev, newEvent]);

    // Sync to database
    await calendarService.createEvent({
      calendar_id: newEvent.calendarId,
      title: newEvent.title,
      description: newEvent.description,
      location: newEvent.location,
      start_time: newEvent.start.toISOString(),
      end_time: newEvent.end.toISOString(),
      all_day: newEvent.allDay,
      color: newEvent.color,
    });
  };

  const handleCreateCalendar = async (calData: { name: string; icon: string; color: string }) => {
    const newCalendar = await calendarService.createCalendar({
      name: calData.name,
      icon: calData.icon,
      color: calData.color,
    });

    if (newCalendar) {
      setCalendars((prev) => [...prev, newCalendar]);
      setVisibleCalendarIds((prev) => new Set([...prev, newCalendar.id]));
    }
  };

  const handleConnectProvider = (provider: CalendarProvider) => {
    // Redirect to OAuth flow
    window.location.href = `/api/auth/calendar/${provider}`;
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    calendarService.deleteEvent(eventId);
  };

  // Render calendar grid
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="flex-1 flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7">
          {weeks.flat().map((day, idx) => {
            const dayEvents = visibleEvents.filter((e) => isSameDay(e.start, day));
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={idx}
                className={cn(
                  "border-b border-r p-1 min-h-[60px] cursor-pointer transition-colors",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isSelected && "bg-primary/10",
                  "hover:bg-accent/50"
                )}
                onClick={() => setSelectedDate(day)}
                onDoubleClick={() => {
                  setSelectedDate(day);
                  setCreateEventOpen(true);
                }}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-sm mb-1",
                    isCurrentDay && "bg-primary text-primary-foreground font-bold",
                    isSelected && !isCurrentDay && "ring-2 ring-primary"
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, isCompact ? 1 : 3).map((event) => (
                    <div
                      key={event.id}
                      className="text-[10px] truncate px-1 rounded"
                      style={{ backgroundColor: `${event.color}20`, color: event.color }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > (isCompact ? 1 : 3) && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayEvents.length - (isCompact ? 1 : 3)} daha
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // XS size - just show mini calendar
  if (size === "xs") {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background p-1">
        <div className="text-center">
          <div className="text-3xl font-bold">{format(new Date(), "d")}</div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(), "MMMM", { locale: tr })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          {(size === "large" || size === "xl") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <List className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold">
            {format(currentDate, "MMMM yyyy", { locale: tr })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Bugün
          </Button>
          <Button size="sm" onClick={() => setCreateEventOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Etkinlik
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (size === "large" || size === "xl") && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r overflow-hidden"
            >
              <CalendarSidebar
                calendars={calendars}
                visibleCalendarIds={visibleCalendarIds}
                onToggleCalendar={handleToggleCalendar}
                onCreateCalendar={() => setCreateCalendarOpen(true)}
                connectedProviders={connectedProviders}
                onConnectProvider={handleConnectProvider}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calendar area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderMonthView()}
        </div>

        {/* Event panel for selected date */}
        {showEventList && (size === "medium" || size === "large" || size === "xl") && (
          <div className="w-64 border-l flex flex-col">
            <div className="p-3 border-b">
              <h3 className="font-medium">
                {format(selectedDate, "d MMMM yyyy", { locale: tr })}
              </h3>
              <p className="text-xs text-muted-foreground">
                {format(selectedDate, "EEEE", { locale: tr })}
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Etkinlik yok</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setCreateEventOpen(true)}
                    >
                      Etkinlik ekle
                    </Button>
                  </div>
                ) : (
                  selectedDateEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      compact={size === "medium"}
                      onDelete={() => handleDeleteEvent(event.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        calendars={calendars}
        selectedDate={selectedDate}
        onCreateEvent={handleCreateEvent}
      />
      <CreateCalendarDialog
        open={createCalendarOpen}
        onOpenChange={setCreateCalendarOpen}
        onCreate={handleCreateCalendar}
      />
    </div>
  );
}
