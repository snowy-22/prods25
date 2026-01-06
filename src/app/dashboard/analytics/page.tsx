'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { getUserAnalyticsSummary } from '@/lib/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Share2, 
  TrendingUp, 
  Users, 
  Clock, 
  BarChart3,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Loader2,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AnalyticsSummary {
  contentStats: Array<{
    id: string;
    user_id: string;
    resource_id: string;
    resource_type: string;
    resource_title: string;
    total_views: number;
    unique_visitors: number;
    total_shares: number;
    total_saves: number;
    avg_duration: number | null;
    last_viewed_at: string;
  }>;
  recentEvents: Array<{
    id: string;
    event_type: string;
    event_category: string | null;
    resource_type: string | null;
    resource_id: string | null;
    created_at: string;
    metadata: any;
  }>;
  sessions: Array<{
    id: string;
    session_id: string;
    browser: string | null;
    os: string | null;
    screen_width: number | null;
    screen_height: number | null;
    device_info: any;
    first_seen_at: string;
    last_seen_at: string;
    is_guest: boolean;
  }>;
  totalViews: number;
  totalShares: number;
  uniqueVisitors: number;
}

export default function UserAnalyticsPage() {
  const { user } = useAppStore();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await getUserAnalyticsSummary(user.id);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  // Device type breakdown from sessions
  const deviceBreakdown = analytics?.sessions.reduce((acc, session) => {
    const deviceType = session.device_info?.device?.type || 'desktop';
    acc[deviceType] = (acc[deviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Browser breakdown
  const browserBreakdown = analytics?.sessions.reduce((acc, session) => {
    const browser = session.browser || 'Unknown';
    acc[browser] = (acc[browser] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Event type breakdown
  const eventTypeBreakdown = analytics?.recentEvents.reduce((acc, event) => {
    const eventType = event.event_type;
    acc[eventType] = (acc[eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Henüz analitik veri bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">İçerik Analitikleri</h1>
          <p className="text-muted-foreground mt-1">
            Paylaştığınız içeriklerin performansını izleyin
          </p>
        </div>
        <Button onClick={loadAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Görüntülenme</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tüm içerikleriniz
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benzersiz Ziyaretçi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueVisitors.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Farklı kullanıcılar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Paylaşım</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalShares.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sosyal medya paylaşımları
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Oturum</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.sessions.length.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aktif oturumlar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">İçerik Performansı</TabsTrigger>
          <TabsTrigger value="events">Son Aktiviteler</TabsTrigger>
          <TabsTrigger value="devices">Cihaz & Tarayıcı</TabsTrigger>
        </TabsList>

        {/* Content Performance Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>En Çok Görüntülenen İçerikler</CardTitle>
              <CardDescription>
                Paylaştığınız içeriklerin detaylı istatistikleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.contentStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Henüz görüntülenen içerik yok
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.contentStats
                    .sort((a, b) => b.total_views - a.total_views)
                    .map((stat) => (
                      <div
                        key={stat.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{stat.resource_title || 'Adsız İçerik'}</h4>
                            <Badge variant="outline" className="text-xs">
                              {stat.resource_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {stat.total_views} görüntülenme
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {stat.unique_visitors} benzersiz ziyaretçi
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              {stat.total_shares} paylaşım
                            </span>
                            {stat.avg_duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Math.round(stat.avg_duration)}s ortalama süre
                              </span>
                            )}
                          </div>
                          {stat.last_viewed_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Son görüntülenme: {formatDistanceToNow(new Date(stat.last_viewed_at), { 
                                addSuffix: true, 
                                locale: tr 
                              })}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {((stat.unique_visitors / stat.total_views) * 100).toFixed(1)}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Benzersiz oran
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
              <CardDescription>
                İçeriklerinizdeki en son etkileşimler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recentEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Henüz aktivite kaydı yok
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.recentEvents.slice(0, 20).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="mt-0.5">
                        {event.event_type === 'page_view' && <Eye className="h-4 w-4 text-blue-500" />}
                        {event.event_type === 'folder_view' && <Globe className="h-4 w-4 text-green-500" />}
                        {event.event_type === 'shared_folder_view' && <Share2 className="h-4 w-4 text-purple-500" />}
                        {event.event_type === 'social_share' && <Share2 className="h-4 w-4 text-pink-500" />}
                        {event.event_type === 'item_interaction' && <Activity className="h-4 w-4 text-orange-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {event.event_type.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          {event.resource_type && (
                            <Badge variant="secondary" className="text-xs">
                              {event.resource_type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(event.created_at), { 
                            addSuffix: true, 
                            locale: tr 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivite Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(eventTypeBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{type.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(count / analytics.recentEvents.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices & Browser Tab */}
        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cihaz Türleri</CardTitle>
                <CardDescription>
                  Ziyaretçilerin kullandığı cihazlar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(deviceBreakdown).map(([device, count]) => (
                    <div key={device} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {device === 'mobile' && <Smartphone className="h-4 w-4 text-primary" />}
                        {device === 'tablet' && <Tablet className="h-4 w-4 text-primary" />}
                        {device === 'desktop' && <Monitor className="h-4 w-4 text-primary" />}
                        <span className="text-sm capitalize">{device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(count / analytics.sessions.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Browser Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Tarayıcı Dağılımı</CardTitle>
                <CardDescription>
                  En çok kullanılan tarayıcılar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(browserBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([browser, count]) => (
                      <div key={browser} className="flex items-center justify-between">
                        <span className="text-sm">{browser}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(count / analytics.sessions.length) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Son Oturumlar</CardTitle>
              <CardDescription>
                İçeriklerinizi görüntüleyen son ziyaretçiler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.sessions.slice(0, 10).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {session.device_info?.device?.type === 'mobile' && <Smartphone className="h-4 w-4 text-muted-foreground" />}
                      {session.device_info?.device?.type === 'tablet' && <Tablet className="h-4 w-4 text-muted-foreground" />}
                      {!session.device_info?.device?.type && <Monitor className="h-4 w-4 text-muted-foreground" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {session.browser || 'Bilinmeyen Tarayıcı'}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {session.os || 'Bilinmeyen OS'}
                          </span>
                          {session.is_guest && (
                            <Badge variant="outline" className="text-xs">
                              Misafir
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.first_seen_at), { 
                            addSuffix: true, 
                            locale: tr 
                          })}
                        </p>
                      </div>
                    </div>
                    {session.screen_width && session.screen_height && (
                      <span className="text-xs text-muted-foreground">
                        {session.screen_width} × {session.screen_height}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
