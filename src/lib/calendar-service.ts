/**
 * Calendar Service
 * 
 * Handles all calendar operations including:
 * - CRUD for calendars and events
 * - Sharing and permissions
 * - Provider integrations
 * - Real-time subscriptions
 */

import { createClient } from './supabase/client';
import {
  Calendar,
  CalendarCreate,
  CalendarEvent,
  CalendarEventCreate,
  CalendarShare,
  CalendarShareCreate,
  CalendarProviderConnection,
  CalendarSubscription,
  SharedCalendarInfo,
  CalendarFilters,
  CalendarProvider,
} from './calendar-types';

class CalendarService {
  private supabase = createClient();

  // ============================================================
  // CALENDARS
  // ============================================================

  async getMyCalendars(): Promise<Calendar[]> {
    const { data, error } = await this.supabase
      .from('calendars')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching calendars:', error);
      return [];
    }
    return data || [];
  }

  async getCalendar(id: string): Promise<Calendar | null> {
    const { data, error } = await this.supabase
      .from('calendars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching calendar:', error);
      return null;
    }
    return data;
  }

  async createCalendar(calendar: CalendarCreate): Promise<Calendar | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const slug = calendar.slug || calendar.name.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

    const { data, error } = await this.supabase
      .from('calendars')
      .insert({
        user_id: user.id,
        name: calendar.name,
        slug,
        description: calendar.description,
        icon: calendar.icon || 'calendar',
        color: calendar.color || '#3b82f6',
        timezone: calendar.timezone || 'Europe/Istanbul',
        default_view: calendar.default_view || 'month',
        is_public: calendar.is_public || false,
        organization_id: calendar.organization_id,
        provider: 'local',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar:', error);
      return null;
    }
    return data;
  }

  async updateCalendar(id: string, updates: Partial<Calendar>): Promise<Calendar | null> {
    const { data, error } = await this.supabase
      .from('calendars')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar:', error);
      return null;
    }
    return data;
  }

  async deleteCalendar(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendars')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting calendar:', error);
      return false;
    }
    return true;
  }

  async setDefaultCalendar(id: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return false;

    // First, unset all default calendars
    await this.supabase
      .from('calendars')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Then set the new default
    const { error } = await this.supabase
      .from('calendars')
      .update({ is_default: true })
      .eq('id', id);

    return !error;
  }

  // ============================================================
  // SHARED CALENDARS
  // ============================================================

  async getSharedWithMe(): Promise<SharedCalendarInfo[]> {
    const { data, error } = await this.supabase
      .from('calendars_shared_with_me')
      .select('*');

    if (error) {
      console.error('Error fetching shared calendars:', error);
      return [];
    }
    return data || [];
  }

  async getMySharedCalendars(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('my_shared_calendars')
      .select('*');

    if (error) {
      console.error('Error fetching my shared calendars:', error);
      return [];
    }
    return data || [];
  }

  // ============================================================
  // EVENTS
  // ============================================================

  async getEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    let query = this.supabase
      .from('calendar_events')
      .select('*')
      .order('start_time');

    if (filters?.calendarIds?.length) {
      query = query.in('calendar_id', filters.calendarIds);
    }
    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('end_time', filters.endDate);
    }
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters?.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }
    return data || [];
  }

  async getEventsForDateRange(
    startDate: Date,
    endDate: Date,
    calendarIds?: string[]
  ): Promise<CalendarEvent[]> {
    return this.getEvents({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      calendarIds,
    });
  }

  async getEvent(id: string): Promise<CalendarEvent | null> {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }
    return data;
  }

  async createEvent(event: CalendarEventCreate): Promise<CalendarEvent | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('calendar_events')
      .insert({
        calendar_id: event.calendar_id,
        user_id: user.id,
        title: event.title,
        description: event.description,
        location: event.location,
        start_time: event.start_time,
        end_time: event.end_time,
        all_day: event.all_day || false,
        is_recurring: event.is_recurring || false,
        recurrence_rule: event.recurrence_rule,
        color: event.color,
        reminders: event.reminders || [15, 60],
        reminder_methods: ['notification'],
        tags: event.tags || [],
        status: 'confirmed',
        visibility: 'public',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return null;
    }
    return data;
  }

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return null;
    }
    return data;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }
    return true;
  }

  async moveEvent(eventId: string, newCalendarId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_events')
      .update({ calendar_id: newCalendarId, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    return !error;
  }

  // ============================================================
  // SHARING
  // ============================================================

  async shareCalendar(share: CalendarShareCreate): Promise<CalendarShare | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('calendar_shares')
      .insert({
        calendar_id: share.calendar_id,
        shared_with_user_id: share.shared_with_user_id,
        shared_with_email: share.shared_with_email,
        permission: share.permission || 'view',
        can_create_events: share.can_create_events || false,
        can_modify_events: share.can_modify_events || false,
        note: share.note,
        invited_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error sharing calendar:', error);
      return null;
    }
    return data;
  }

  async createShareLink(calendarId: string, expiresInDays?: number): Promise<CalendarShare | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await this.supabase
      .from('calendar_shares')
      .insert({
        calendar_id: calendarId,
        is_public_link: true,
        permission: 'view',
        share_link_expires_at: expiresAt,
        invited_by: user.id,
        status: 'accepted', // Public links are auto-accepted
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating share link:', error);
      return null;
    }
    return data;
  }

  async acceptShare(shareId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_shares')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', shareId);

    return !error;
  }

  async declineShare(shareId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_shares')
      .update({ status: 'declined' })
      .eq('id', shareId);

    return !error;
  }

  async revokeShare(shareId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_shares')
      .delete()
      .eq('id', shareId);

    return !error;
  }

  async getCalendarShares(calendarId: string): Promise<CalendarShare[]> {
    const { data, error } = await this.supabase
      .from('calendar_shares')
      .select('*')
      .eq('calendar_id', calendarId);

    if (error) {
      console.error('Error fetching shares:', error);
      return [];
    }
    return data || [];
  }

  async getPendingShareInvites(): Promise<CalendarShare[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('calendar_shares')
      .select('*')
      .eq('shared_with_user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending invites:', error);
      return [];
    }
    return data || [];
  }

  // ============================================================
  // PROVIDER CONNECTIONS
  // ============================================================

  async getProviderConnections(): Promise<CalendarProviderConnection[]> {
    const { data, error } = await this.supabase
      .from('calendar_provider_connections')
      .select('*');

    if (error) {
      console.error('Error fetching provider connections:', error);
      return [];
    }
    return data || [];
  }

  async getProviderConnection(provider: CalendarProvider): Promise<CalendarProviderConnection | null> {
    const { data, error } = await this.supabase
      .from('calendar_provider_connections')
      .select('*')
      .eq('provider', provider)
      .single();

    if (error) {
      return null;
    }
    return data;
  }

  async disconnectProvider(provider: CalendarProvider): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_provider_connections')
      .delete()
      .eq('provider', provider);

    return !error;
  }

  async updateProviderConnection(
    provider: CalendarProvider,
    updates: Partial<CalendarProviderConnection>
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_provider_connections')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('provider', provider);

    return !error;
  }

  // ============================================================
  // SUBSCRIPTIONS
  // ============================================================

  async getSubscriptions(): Promise<CalendarSubscription[]> {
    const { data, error } = await this.supabase
      .from('calendar_subscriptions')
      .select('*');

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
    return data || [];
  }

  async subscribeToCalendar(calendarId: string, displayName?: string): Promise<CalendarSubscription | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('calendar_subscriptions')
      .insert({
        user_id: user.id,
        source_type: 'public_calendar',
        source_calendar_id: calendarId,
        display_name: displayName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error subscribing to calendar:', error);
      return null;
    }
    return data;
  }

  async subscribeToIcalUrl(url: string, displayName: string): Promise<CalendarSubscription | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('calendar_subscriptions')
      .insert({
        user_id: user.id,
        source_type: 'ical_url',
        source_url: url,
        display_name: displayName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error subscribing to iCal:', error);
      return null;
    }
    return data;
  }

  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_subscriptions')
      .delete()
      .eq('id', subscriptionId);

    return !error;
  }

  // ============================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================

  subscribeToCalendarChanges(calendarId: string, callback: (event: any) => void) {
    return this.supabase
      .channel(`calendar:${calendarId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `calendar_id=eq.${calendarId}`,
        },
        callback
      )
      .subscribe();
  }

  subscribeToAllMyEvents(callback: (event: any) => void) {
    return this.supabase
      .channel('my-calendar-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
        },
        callback
      )
      .subscribe();
  }

  subscribeToShareInvites(callback: (event: any) => void) {
    return this.supabase
      .channel('calendar-share-invites')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calendar_shares',
        },
        callback
      )
      .subscribe();
  }
}

export const calendarService = new CalendarService();
export default calendarService;
