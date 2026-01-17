/**
 * Calendar System Types
 * 
 * Comprehensive calendar system with:
 * - Multiple calendars per user/organization
 * - Events with recurrence, attendees, reminders
 * - Sharing with granular permissions
 * - Provider integrations (Google, Microsoft, Apple, Facebook, Slack, Jira)
 */

// ============================================================
// CALENDAR TYPES
// ============================================================

export type CalendarProvider = 'local' | 'google' | 'microsoft' | 'apple' | 'facebook' | 'slack' | 'jira';
export type CalendarView = 'day' | 'week' | 'month' | 'agenda' | 'year';
export type SyncDirection = 'import' | 'export' | 'both';

export interface Calendar {
  id: string;
  user_id: string;
  organization_id?: string;
  
  // Identity
  name: string;
  slug: string;
  description?: string;
  icon: string; // lucide-react icon name
  color: string; // Hex color
  
  // Settings
  timezone: string;
  default_view: CalendarView;
  week_start: number; // 0=Sunday, 1=Monday, etc.
  show_weekends: boolean;
  show_week_numbers: boolean;
  
  // Visibility
  is_public: boolean;
  is_default: boolean;
  is_shared: boolean;
  
  // Provider sync
  provider: CalendarProvider;
  provider_calendar_id?: string;
  last_synced_at?: string;
  sync_enabled: boolean;
  sync_direction: SyncDirection;
  
  // Metadata
  event_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CalendarCreate {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  timezone?: string;
  default_view?: CalendarView;
  is_public?: boolean;
  organization_id?: string;
}

// ============================================================
// EVENT TYPES
// ============================================================

export type EventStatus = 'tentative' | 'confirmed' | 'cancelled';
export type EventVisibility = 'public' | 'private' | 'confidential';
export type AttendeeStatus = 'needs_action' | 'accepted' | 'declined' | 'tentative';
export type AttendeeRole = 'organizer' | 'required' | 'optional' | 'resource';
export type ReminderMethod = 'notification' | 'email' | 'sms';

export interface CalendarEvent {
  id: string;
  calendar_id: string;
  user_id: string;
  
  // Identity
  title: string;
  description?: string;
  location?: string;
  location_coordinates?: { lat: number; lng: number };
  
  // Timing
  start_time: string; // ISO timestamp
  end_time: string;
  all_day: boolean;
  timezone: string;
  
  // Recurrence
  is_recurring: boolean;
  recurrence_rule?: string; // RFC 5545 RRULE
  recurrence_end_date?: string;
  recurrence_exceptions?: string[];
  parent_event_id?: string;
  
  // Appearance
  color?: string;
  icon?: string;
  
  // Status
  status: EventStatus;
  visibility: EventVisibility;
  
  // Reminders
  reminders: number[]; // Minutes before event
  reminder_methods: ReminderMethod[];
  
  // Attendees
  attendee_count: number;
  
  // Provider sync
  provider_event_id?: string;
  provider_data?: Record<string, any>;
  
  // Metadata
  tags: string[];
  attachments: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventCreate {
  calendar_id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  is_recurring?: boolean;
  recurrence_rule?: string;
  color?: string;
  reminders?: number[];
  tags?: string[];
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id?: string;
  email?: string;
  name?: string;
  status: AttendeeStatus;
  response_time?: string;
  role: AttendeeRole;
  is_organizer: boolean;
  notify_on_update: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// SHARING TYPES
// ============================================================

export type SharePermission = 'view' | 'edit' | 'admin';
export type ShareStatus = 'pending' | 'accepted' | 'declined';

export interface CalendarShare {
  id: string;
  calendar_id: string;
  
  // Share target
  shared_with_user_id?: string;
  shared_with_email?: string;
  shared_with_organization_id?: string;
  is_public_link: boolean;
  
  // Permissions
  permission: SharePermission;
  can_see_details: boolean;
  can_invite_others: boolean;
  can_modify_events: boolean;
  can_create_events: boolean;
  can_delete_events: boolean;
  
  // Share link
  share_token?: string;
  share_link_expires_at?: string;
  share_link_max_uses?: number;
  share_link_use_count: number;
  
  // Status
  status: ShareStatus;
  invited_by?: string;
  accepted_at?: string;
  
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarShareCreate {
  calendar_id: string;
  shared_with_user_id?: string;
  shared_with_email?: string;
  permission?: SharePermission;
  can_create_events?: boolean;
  can_modify_events?: boolean;
  note?: string;
}

// ============================================================
// PROVIDER TYPES
// ============================================================

export interface CalendarProviderConnection {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  provider_user_id?: string;
  provider_email?: string;
  provider_display_name?: string;
  
  // OAuth (tokens should be encrypted)
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  scopes: string[];
  
  // Status
  is_active: boolean;
  last_sync_at?: string;
  last_error?: string;
  sync_frequency_minutes: number;
  
  // Settings
  auto_import_calendars: boolean;
  imported_calendar_ids: string[];
  
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CalendarSubscription {
  id: string;
  user_id: string;
  source_type: 'calendar' | 'ical_url' | 'public_calendar';
  source_calendar_id?: string;
  source_url?: string;
  display_name?: string;
  color?: string;
  icon?: string;
  show_in_sidebar: boolean;
  sync_enabled: boolean;
  sync_frequency_minutes: number;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// UI/STATE TYPES
// ============================================================

export interface CalendarViewState {
  currentDate: Date;
  view: CalendarView;
  selectedEventId?: string;
  selectedCalendarIds: string[];
  showSidebar: boolean;
  showMiniCalendar: boolean;
  isCreatingEvent: boolean;
  draggedEvent?: CalendarEvent;
}

export interface CalendarFilters {
  calendarIds?: string[];
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  status?: EventStatus[];
  tags?: string[];
}

export interface SharedCalendarInfo extends Calendar {
  permission: SharePermission;
  can_see_details: boolean;
  can_create_events: boolean;
  can_modify_events: boolean;
  can_delete_events: boolean;
  owner_email?: string;
  owner_name?: string;
}

// ============================================================
// PROVIDER CONFIG TYPES
// ============================================================

export interface CalendarProviderConfig {
  id: CalendarProvider;
  name: string;
  icon: string;
  color: string;
  authUrl: string;
  scopes: string[];
  supportsCalendarSync: boolean;
  supportsEventSync: boolean;
  supportsTasks: boolean;
}

export const CALENDAR_PROVIDERS: CalendarProviderConfig[] = [
  {
    id: 'google',
    name: 'Google Calendar',
    icon: 'mail', // Google icon placeholder
    color: '#4285F4',
    authUrl: '/api/auth/calendar/google',
    scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
    supportsCalendarSync: true,
    supportsEventSync: true,
    supportsTasks: true,
  },
  {
    id: 'microsoft',
    name: 'Microsoft Outlook',
    icon: 'mail',
    color: '#0078D4',
    authUrl: '/api/auth/calendar/microsoft',
    scopes: ['Calendars.ReadWrite', 'Calendars.ReadWrite.Shared'],
    supportsCalendarSync: true,
    supportsEventSync: true,
    supportsTasks: true,
  },
  {
    id: 'apple',
    name: 'Apple iCloud',
    icon: 'apple',
    color: '#000000',
    authUrl: '/api/auth/calendar/apple',
    scopes: ['calendar'],
    supportsCalendarSync: true,
    supportsEventSync: true,
    supportsTasks: false,
  },
  {
    id: 'facebook',
    name: 'Facebook Events',
    icon: 'facebook',
    color: '#1877F2',
    authUrl: '/api/auth/calendar/facebook',
    scopes: ['user_events'],
    supportsCalendarSync: false,
    supportsEventSync: true,
    supportsTasks: false,
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'hash',
    color: '#4A154B',
    authUrl: '/api/auth/calendar/slack',
    scopes: ['channels:read', 'users:read'],
    supportsCalendarSync: false,
    supportsEventSync: true,
    supportsTasks: false,
  },
  {
    id: 'jira',
    name: 'Jira',
    icon: 'clipboard',
    color: '#0052CC',
    authUrl: '/api/auth/calendar/jira',
    scopes: ['read:jira-work', 'write:jira-work'],
    supportsCalendarSync: false,
    supportsEventSync: true,
    supportsTasks: true,
  },
];

// ============================================================
// RECURRENCE HELPERS
// ============================================================

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // Every X days/weeks/months/years
  byDay?: string[]; // ['MO', 'WE', 'FR']
  byMonthDay?: number[]; // [1, 15]
  byMonth?: number[]; // [1, 6, 12]
  count?: number; // Number of occurrences
  until?: string; // End date
}

export function parseRRule(rrule: string): RecurrenceRule | null {
  if (!rrule) return null;
  
  const parts = rrule.split(';');
  const rule: Partial<RecurrenceRule> = {
    interval: 1,
  };
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    switch (key) {
      case 'FREQ':
        rule.frequency = value.toLowerCase() as RecurrenceFrequency;
        break;
      case 'INTERVAL':
        rule.interval = parseInt(value, 10);
        break;
      case 'BYDAY':
        rule.byDay = value.split(',');
        break;
      case 'BYMONTHDAY':
        rule.byMonthDay = value.split(',').map(v => parseInt(v, 10));
        break;
      case 'BYMONTH':
        rule.byMonth = value.split(',').map(v => parseInt(v, 10));
        break;
      case 'COUNT':
        rule.count = parseInt(value, 10);
        break;
      case 'UNTIL':
        rule.until = value;
        break;
    }
  }
  
  return rule.frequency ? rule as RecurrenceRule : null;
}

export function buildRRule(rule: RecurrenceRule): string {
  const parts: string[] = [`FREQ=${rule.frequency.toUpperCase()}`];
  
  if (rule.interval > 1) {
    parts.push(`INTERVAL=${rule.interval}`);
  }
  if (rule.byDay?.length) {
    parts.push(`BYDAY=${rule.byDay.join(',')}`);
  }
  if (rule.byMonthDay?.length) {
    parts.push(`BYMONTHDAY=${rule.byMonthDay.join(',')}`);
  }
  if (rule.byMonth?.length) {
    parts.push(`BYMONTH=${rule.byMonth.join(',')}`);
  }
  if (rule.count) {
    parts.push(`COUNT=${rule.count}`);
  }
  if (rule.until) {
    parts.push(`UNTIL=${rule.until}`);
  }
  
  return parts.join(';');
}

// ============================================================
// CALENDAR ICONS (for UI selection)
// ============================================================

export const CALENDAR_ICONS = [
  'calendar',
  'calendar-days',
  'calendar-check',
  'calendar-clock',
  'calendar-heart',
  'calendar-plus',
  'calendar-range',
  'briefcase',
  'graduation-cap',
  'home',
  'heart',
  'users',
  'plane',
  'car',
  'utensils',
  'dumbbell',
  'music',
  'film',
  'gamepad-2',
  'book',
  'code',
  'gift',
  'cake',
  'star',
  'sun',
  'moon',
  'cloud',
  'umbrella',
  'tree',
  'flower',
] as const;

export const CALENDAR_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#64748b', // Slate
  '#78716c', // Stone
] as const;
