/**
 * Advanced Analytics & Metrics System
 * Comprehensive tracking for user behavior, engagement, content performance
 */

import { createClient } from './supabase/client';

export type EventType = 
  | 'view' | 'click' | 'share' | 'like' | 'comment'
  | 'create' | 'edit' | 'delete' | 'favorite'
  | 'search' | 'play' | 'pause' | 'download'
  | 'upload' | 'purchase' | 'subscribe' | 'login';

export type EntityType =
  | 'item' | 'folder' | 'video' | 'image'
  | 'post' | 'comment' | 'user' | 'profile'
  | 'collection' | 'presentation' | 'product';

export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: EventType;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
  deviceInfo?: {
    os: string;
    browser: string;
    screenSize: string;
  };
  location?: {
    country?: string;
    city?: string;
  };
  sessionId: string;
  timestamp: string;
}

export interface UserMetrics {
  userId: string;
  totalEvents: number;
  totalViews: number;
  totalClicks: number;
  totalShares: number;
  totalLikes: number;
  averageSessionDuration: number;
  sessionsCount: number;
  lastActiveAt: string;
  firstSeenAt: string;
  favoriteEntityTypes: EntityType[];
  topActions: EventType[];
}

export interface ContentMetrics {
  entityId: string;
  entityType: EntityType;
  entityName: string;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalDownloads?: number;
  avgTimeSpent: number;
  engagementRate: number;
  conversionRate?: number;
  trending: boolean;
  peakHour?: number;
  topReferrers: string[];
}

export interface EngagementMetrics {
  userId: string;
  engagementScore: number; // 0-100
  contentCreated: number;
  contentConsumed: number;
  socialInteractions: number; // likes, comments, shares
  collaborations: number;
  achievements: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  monthlyActiveScore: number;
}

export interface ConversionFunnel {
  stage: string;
  visitors: number;
  converters: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface CohortAnalysis {
  cohortDate: string;
  cohortSize: number;
  retention: Record<number, number>; // day -> retention %
  avgLifetimeValue: number;
  churnRate: number;
}

export interface HeatmapData {
  eventType: EventType;
  location: string; // UI element identifier
  clickCount: number;
  timeSpent: number;
}

/**
 * Analytics Manager
 */
export class AnalyticsManager {
  private supabase = createClient();
  private sessionId = this.generateSessionId();

  /**
   * Track event
   */
  async trackEvent(
    userId: string,
    eventType: EventType,
    entityType: EntityType,
    entityId: string,
    options: {
      entityName?: string;
      durationMs?: number;
      metadata?: Record<string, any>;
      deviceInfo?: AnalyticsEvent['deviceInfo'];
      location?: AnalyticsEvent['location'];
    } = {}
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    const { error } = await this.supabase
      .from('analytics_events')
      .insert({
        userId,
        eventType,
        entityType,
        entityId,
        entityName: options.entityName,
        durationMs: options.durationMs,
        metadata: options.metadata,
        deviceInfo: options.deviceInfo,
        location: options.location,
        sessionId: this.sessionId,
        timestamp
      });

    if (error && error.code !== 'PGRST202') {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(
    userId: string,
    pageName: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.trackEvent(userId, 'view', 'item', pageName, { metadata });
  }

  /**
   * Track user action
   */
  async trackAction(
    userId: string,
    action: EventType,
    entityId: string,
    durationMs?: number
  ): Promise<void> {
    return this.trackEvent(userId, action, 'item', entityId, { durationMs });
  }

  /**
   * Get user metrics
   */
  async getUserMetrics(userId: string): Promise<UserMetrics> {
    const { data: events, error } = await this.supabase
      .from('analytics_events')
      .select('*')
      .eq('userId', userId);

    if (error) throw error;

    if (!events || events.length === 0) {
      return {
        userId,
        totalEvents: 0,
        totalViews: 0,
        totalClicks: 0,
        totalShares: 0,
        totalLikes: 0,
        averageSessionDuration: 0,
        sessionsCount: 0,
        lastActiveAt: new Date().toISOString(),
        firstSeenAt: new Date().toISOString(),
        favoriteEntityTypes: [],
        topActions: []
      };
    }

    // Calculate metrics
    const eventCounts: Record<EventType, number> = {} as any;
    const entityTypeCounts: Record<EntityType, number> = {} as any;
    const sessionIds = new Set<string>();
    let totalDuration = 0;

    events.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
      entityTypeCounts[event.entityType] = (entityTypeCounts[event.entityType] || 0) + 1;
      sessionIds.add(event.sessionId);
      if (event.durationMs) totalDuration += event.durationMs;
    });

    const topActions = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action]) => action as EventType);

    const favoriteEntityTypes = Object.entries(entityTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type as EntityType);

    return {
      userId,
      totalEvents: events.length,
      totalViews: eventCounts['view'] || 0,
      totalClicks: eventCounts['click'] || 0,
      totalShares: eventCounts['share'] || 0,
      totalLikes: eventCounts['like'] || 0,
      averageSessionDuration: sessionIds.size > 0 ? totalDuration / sessionIds.size : 0,
      sessionsCount: sessionIds.size,
      lastActiveAt: events[events.length - 1]?.timestamp || new Date().toISOString(),
      firstSeenAt: events[0]?.timestamp || new Date().toISOString(),
      favoriteEntityTypes,
      topActions
    };
  }

  /**
   * Get content metrics
   */
  async getContentMetrics(
    entityId: string,
    entityType: EntityType
  ): Promise<ContentMetrics> {
    const { data: events, error } = await this.supabase
      .from('analytics_events')
      .select('*')
      .eq('entityId', entityId)
      .eq('entityType', entityType);

    if (error) throw error;

    if (!events || events.length === 0) {
      return {
        entityId,
        entityType,
        entityName: 'Unknown',
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        avgTimeSpent: 0,
        engagementRate: 0,
        topReferrers: []
      };
    }

    // Calculate metrics
    const eventCounts: Record<EventType, number> = {} as any;
    let totalDuration = 0;

    events.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
      if (event.durationMs) totalDuration += event.durationMs;
    });

    const totalViews = eventCounts['view'] || 0;
    const socialInteractions = (eventCounts['like'] || 0) + (eventCounts['comment'] || 0) + (eventCounts['share'] || 0);
    const engagementRate = totalViews > 0 ? (socialInteractions / totalViews) * 100 : 0;

    return {
      entityId,
      entityType,
      entityName: events[0]?.entityName || 'Unknown',
      totalViews,
      totalLikes: eventCounts['like'] || 0,
      totalComments: eventCounts['comment'] || 0,
      totalShares: eventCounts['share'] || 0,
      totalDownloads: eventCounts['download'] || 0,
      avgTimeSpent: events.length > 0 ? totalDuration / events.length : 0,
      engagementRate,
      topReferrers: []
    };
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(userId: string): Promise<EngagementMetrics> {
    const metrics = await this.getUserMetrics(userId);

    // Calculate engagement score
    const engagementScore = Math.min(
      100,
      (metrics.totalLikes * 5 +
        metrics.totalShares * 10 +
        metrics.totalClicks * 2) /
        Math.max(1, metrics.totalEvents)
    );

    // Determine level
    let level: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    if (engagementScore >= 75) level = 'platinum';
    else if (engagementScore >= 50) level = 'gold';
    else if (engagementScore >= 25) level = 'silver';

    return {
      userId,
      engagementScore,
      contentCreated: metrics.topActions.filter(a => a === 'create').length,
      contentConsumed: metrics.totalViews,
      socialInteractions: metrics.totalLikes + metrics.totalShares,
      collaborations: 0, // Would need collaboration tracking
      achievements: 0, // Would need achievement tracking
      level,
      monthlyActiveScore: engagementScore
    };
  }

  /**
   * Get conversion funnel
   */
  async getConversionFunnel(
    stages: string[]
  ): Promise<ConversionFunnel[]> {
    const results: ConversionFunnel[] = [];

    for (const stage of stages) {
      const { count: visitors, error: visitorError } = await this.supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('entityId', stage);

      if (visitorError) throw visitorError;

      const { count: converters, error: converterError } = await this.supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('entityId', stage)
        .eq('eventType', 'purchase');

      if (converterError) throw converterError;

      const conversionRate = (visitors || 0) > 0 ? ((converters || 0) / (visitors || 1)) * 100 : 0;

      results.push({
        stage,
        visitors: visitors || 0,
        converters: converters || 0,
        conversionRate,
        dropoffRate: 100 - conversionRate
      });
    }

    return results;
  }

  /**
   * Get heatmap data
   */
  async getHeatmapData(
    timeframeHours: number = 24
  ): Promise<HeatmapData[]> {
    const since = new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .rpc('get_heatmap_data', {
        since_time: since
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get trending content
   */
  async getTrendingContent(
    entityType: EntityType,
    timeframeHours: number = 24,
    limit: number = 10
  ): Promise<ContentMetrics[]> {
    const since = new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString();

    const { data: events, error } = await this.supabase
      .from('analytics_events')
      .select('entityId, entityName, eventType')
      .eq('entityType', entityType)
      .gt('timestamp', since);

    if (error) throw error;

    // Group by entity and count
    const grouped: Record<string, { count: number; name: string }> = {};
    (events || []).forEach(event => {
      if (!grouped[event.entityId]) {
        grouped[event.entityId] = { count: 0, name: event.entityName || 'Unknown' };
      }
      grouped[event.entityId].count++;
    });

    // Sort and get top
    const trending = Object.entries(grouped)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([id, { count, name }]) => ({
        entityId: id,
        entityType,
        entityName: name,
        totalViews: count,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        avgTimeSpent: 0,
        engagementRate: 0,
        topReferrers: []
      }));

    return trending;
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(
    cohortDate: string
  ): Promise<CohortAnalysis> {
    // Simplified implementation
    return {
      cohortDate,
      cohortSize: 0,
      retention: {},
      avgLifetimeValue: 0,
      churnRate: 0
    };
  }

  /**
   * Generate report
   */
  async generateReport(
    userId: string,
    dateRange: { from: string; to: string }
  ): Promise<{
    userMetrics: UserMetrics;
    engagementMetrics: EngagementMetrics;
    topContent: ContentMetrics[];
    summary: Record<string, any>;
  }> {
    const userMetrics = await this.getUserMetrics(userId);
    const engagementMetrics = await this.getEngagementMetrics(userId);

    return {
      userMetrics,
      engagementMetrics,
      topContent: [],
      summary: {
        generatedAt: new Date().toISOString(),
        dateRange,
        userId
      }
    };
  }

  /**
   * Subscribe to real-time analytics
   */
  subscribeToAnalytics(
    entityType: EntityType,
    callback: (event: AnalyticsEvent) => void
  ) {
    return this.supabase
      .channel(`analytics:${entityType}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
          filter: `entityType=eq.${entityType}`
        },
        (payload) => {
          callback(payload.new as AnalyticsEvent);
        }
      )
      .subscribe();
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

export const analyticsManager = new AnalyticsManager();
