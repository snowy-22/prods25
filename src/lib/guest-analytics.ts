/**
 * Guest Canvas Analytics - Misafir Kullanıcı Takibi
 * 
 * Guest canvas'ta gerçekleşen ziyaret ve işlemleri takip eder.
 * Admin panelinden görüntülenebilir.
 */

import { createClient } from '@/lib/supabase/client';

export interface GuestSession {
  id: string;
  session_id: string;
  ip_hash: string; // Gizlilik için hash'lenmiş IP
  user_agent: string;
  referrer: string | null;
  country: string | null;
  city: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet';
  started_at: string;
  ended_at: string | null;
  page_views: number;
  actions_count: number;
  converted_to_signup: boolean;
  last_activity: string;
}

export interface GuestAction {
  id: string;
  session_id: string;
  action_type: GuestActionType;
  target_id: string | null;
  target_type: string | null;
  metadata: Record<string, any>;
  timestamp: string;
}

export type GuestActionType = 
  | 'page_view'
  | 'content_click'
  | 'video_play'
  | 'video_pause'
  | 'scroll'
  | 'hover'
  | 'signup_click'
  | 'login_click'
  | 'share_attempt'
  | 'download_attempt'
  | 'navigation'
  | 'search'
  | 'filter_change'
  | 'fullscreen_enter'
  | 'fullscreen_exit'
  | 'social_interaction';

export interface GuestAnalyticsSummary {
  total_sessions: number;
  active_sessions: number;
  total_page_views: number;
  total_actions: number;
  conversion_rate: number;
  avg_session_duration: number;
  top_actions: { action: string; count: number }[];
  traffic_by_device: { device: string; count: number }[];
  traffic_by_hour: { hour: number; count: number }[];
  traffic_by_day: { day: string; count: number }[];
}

// Session ID oluştur veya localStorage'dan al
const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  let sessionId = sessionStorage.getItem('guest_session_id');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('guest_session_id', sessionId);
  }
  return sessionId;
};

// Cihaz tipini algıla
const detectDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

// IP hash oluştur (gizlilik için)
const hashString = async (str: string): Promise<string> => {
  if (typeof window === 'undefined') return 'server';
  
  const encoder = new TextEncoder();
  const data = encoder.encode(str + 'tv25_salt_' + new Date().toDateString());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
};

/**
 * Guest Analytics Manager
 */
class GuestAnalyticsManager {
  private sessionId: string | null = null;
  private actionBuffer: GuestAction[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  
  /**
   * Analytics'i başlat
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.sessionId = getOrCreateSessionId();
    this.isInitialized = true;
    
    // Session'ı kaydet
    await this.startSession();
    
    // Buffer'ı periyodik flush et
    this.flushInterval = setInterval(() => this.flushActions(), 10000);
    
    // Sayfa kapanırken son verileri kaydet
    window.addEventListener('beforeunload', () => {
      this.flushActions();
      this.endSession();
    });
    
    // Visibility değişikliklerini takip et
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flushActions();
      }
    });
    
    console.log('[GuestAnalytics] Initialized with session:', this.sessionId);
  }
  
  /**
   * Session başlat
   */
  private async startSession(): Promise<void> {
    const supabase = createClient();
    const ipHash = await hashString(Math.random().toString()); // Gerçek IP yerine random
    
    const sessionData = {
      session_id: this.sessionId,
      ip_hash: ipHash,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      device_type: detectDeviceType(),
      started_at: new Date().toISOString(),
      page_views: 1,
      actions_count: 0,
      converted_to_signup: false,
      last_activity: new Date().toISOString()
    };
    
    // Supabase'e kaydet (tablo yoksa localStorage'a yaz)
    try {
      const { error } = await supabase
        .from('guest_sessions')
        .insert(sessionData);
      
      if (error) {
        // Tablo yoksa localStorage'a yedekle
        console.warn('[GuestAnalytics] Supabase insert failed, using localStorage:', error.message);
        this.saveToLocalStorage('sessions', sessionData);
      }
    } catch (err) {
      this.saveToLocalStorage('sessions', sessionData);
    }
  }
  
  /**
   * Session sonlandır
   */
  private async endSession(): Promise<void> {
    if (!this.sessionId) return;
    
    const supabase = createClient();
    
    try {
      await supabase
        .from('guest_sessions')
        .update({ 
          ended_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .eq('session_id', this.sessionId);
    } catch (err) {
      console.warn('[GuestAnalytics] Failed to end session:', err);
    }
  }
  
  /**
   * Action kaydet
   */
  track(actionType: GuestActionType, targetId?: string, targetType?: string, metadata?: Record<string, any>): void {
    if (!this.sessionId) return;
    
    const action: GuestAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      session_id: this.sessionId,
      action_type: actionType,
      target_id: targetId || null,
      target_type: targetType || null,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };
    
    this.actionBuffer.push(action);
    
    // Buffer 20'yi geçerse flush et
    if (this.actionBuffer.length >= 20) {
      this.flushActions();
    }
  }
  
  /**
   * Sayfa görüntüleme
   */
  trackPageView(pagePath: string, pageTitle?: string): void {
    this.track('page_view', pagePath, 'page', { title: pageTitle });
  }
  
  /**
   * İçerik tıklaması
   */
  trackContentClick(contentId: string, contentType: string, contentTitle?: string): void {
    this.track('content_click', contentId, contentType, { title: contentTitle });
  }
  
  /**
   * Video oynatma
   */
  trackVideoPlay(videoId: string, videoTitle?: string, currentTime?: number): void {
    this.track('video_play', videoId, 'video', { title: videoTitle, currentTime });
  }
  
  /**
   * Video durdurma
   */
  trackVideoPause(videoId: string, currentTime?: number, totalDuration?: number): void {
    this.track('video_pause', videoId, 'video', { currentTime, totalDuration });
  }
  
  /**
   * Kayıt ol butonuna tıklama
   */
  trackSignupClick(source: string): void {
    this.track('signup_click', source, 'button', { source });
    
    // Conversion olarak işaretle
    this.markConversion();
  }
  
  /**
   * Giriş yap butonuna tıklama
   */
  trackLoginClick(source: string): void {
    this.track('login_click', source, 'button', { source });
  }
  
  /**
   * Paylaşma denemesi (kilitli özellik)
   */
  trackShareAttempt(contentId: string): void {
    this.track('share_attempt', contentId, 'content', { blocked: true });
  }
  
  /**
   * İndirme denemesi (kilitli özellik)
   */
  trackDownloadAttempt(contentId: string): void {
    this.track('download_attempt', contentId, 'content', { blocked: true });
  }
  
  /**
   * Conversion işaretle
   */
  private async markConversion(): Promise<void> {
    if (!this.sessionId) return;
    
    const supabase = createClient();
    
    try {
      await supabase
        .from('guest_sessions')
        .update({ converted_to_signup: true })
        .eq('session_id', this.sessionId);
    } catch (err) {
      console.warn('[GuestAnalytics] Failed to mark conversion:', err);
    }
  }
  
  /**
   * Buffer'daki action'ları veritabanına kaydet
   */
  private async flushActions(): Promise<void> {
    if (this.actionBuffer.length === 0) return;
    
    const actionsToFlush = [...this.actionBuffer];
    this.actionBuffer = [];
    
    const supabase = createClient();
    
    try {
      // Actions'ları kaydet
      const { error } = await supabase
        .from('guest_actions')
        .insert(actionsToFlush);
      
      if (error) {
        console.warn('[GuestAnalytics] Failed to flush actions:', error.message);
        // localStorage'a yedekle
        actionsToFlush.forEach(action => this.saveToLocalStorage('actions', action));
        return;
      }
      
      // Session'daki action sayısını güncelle
      await supabase
        .from('guest_sessions')
        .update({ 
          actions_count: supabase.rpc ? undefined : actionsToFlush.length, // increment ile daha iyi olur
          last_activity: new Date().toISOString()
        })
        .eq('session_id', this.sessionId);
        
    } catch (err) {
      console.warn('[GuestAnalytics] Flush error:', err);
      actionsToFlush.forEach(action => this.saveToLocalStorage('actions', action));
    }
  }
  
  /**
   * localStorage'a yedekle
   */
  private saveToLocalStorage(type: 'sessions' | 'actions', data: any): void {
    if (typeof window === 'undefined') return;
    
    const key = `guest_analytics_${type}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(data);
    
    // Son 100 kaydı tut
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    localStorage.setItem(key, JSON.stringify(existing));
  }
  
  /**
   * Analytics'i temizle
   */
  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushActions();
    this.isInitialized = false;
  }
}

// Singleton instance
export const guestAnalytics = new GuestAnalyticsManager();

/**
 * Admin: Analytics özeti getir
 */
export async function getGuestAnalyticsSummary(days: number = 7): Promise<GuestAnalyticsSummary> {
  const supabase = createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Sessions getir
  const { data: sessions } = await supabase
    .from('guest_sessions')
    .select('*')
    .gte('started_at', startDate.toISOString());
  
  // Actions getir
  const { data: actions } = await supabase
    .from('guest_actions')
    .select('*')
    .gte('timestamp', startDate.toISOString());
  
  const sessionList = sessions || [];
  const actionList = actions || [];
  
  // Active sessions (son 5 dakika içinde aktivite)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const activeSessions = sessionList.filter(s => s.last_activity > fiveMinutesAgo && !s.ended_at);
  
  // Conversion rate
  const conversions = sessionList.filter(s => s.converted_to_signup).length;
  const conversionRate = sessionList.length > 0 ? (conversions / sessionList.length) * 100 : 0;
  
  // Average session duration
  const completedSessions = sessionList.filter(s => s.ended_at);
  const avgDuration = completedSessions.length > 0
    ? completedSessions.reduce((sum, s) => {
        const duration = new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime();
        return sum + duration;
      }, 0) / completedSessions.length / 1000 // saniye cinsinden
    : 0;
  
  // Top actions
  const actionCounts: Record<string, number> = {};
  actionList.forEach(a => {
    actionCounts[a.action_type] = (actionCounts[a.action_type] || 0) + 1;
  });
  const topActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Traffic by device
  const deviceCounts: Record<string, number> = {};
  sessionList.forEach(s => {
    deviceCounts[s.device_type] = (deviceCounts[s.device_type] || 0) + 1;
  });
  const trafficByDevice = Object.entries(deviceCounts)
    .map(([device, count]) => ({ device, count }));
  
  // Traffic by hour
  const hourCounts: Record<number, number> = {};
  sessionList.forEach(s => {
    const hour = new Date(s.started_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const trafficByHour = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => a.hour - b.hour);
  
  // Traffic by day
  const dayCounts: Record<string, number> = {};
  sessionList.forEach(s => {
    const day = new Date(s.started_at).toISOString().split('T')[0];
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  const trafficByDay = Object.entries(dayCounts)
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
  
  return {
    total_sessions: sessionList.length,
    active_sessions: activeSessions.length,
    total_page_views: sessionList.reduce((sum, s) => sum + (s.page_views || 0), 0),
    total_actions: actionList.length,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    avg_session_duration: Math.round(avgDuration),
    top_actions: topActions,
    traffic_by_device: trafficByDevice,
    traffic_by_hour: trafficByHour,
    traffic_by_day: trafficByDay
  };
}
