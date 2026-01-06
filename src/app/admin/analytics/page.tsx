'use client';

import { useEffect, useState } from 'react';
import { getAdminAnalyticsSummary } from '@/lib/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Share2, 
  TrendingUp, 
  Users, 
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Loader2,
  RefreshCw,
  BarChart3,
  PieChart,
  UserCheck,
  UserX
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AdminAnalyticsSummary {
  totalEvents: number;
  totalSessions: number;
  guestSessions: number;
  userSessions: number;
  topContent: Array<{
    resource_id: string;
    resource_type: string;
    resource_title: string;
    total_views: number;
    unique_visitors: number;
    total_shares: number;
  }>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  recentEvents: Array<{
    id: string;
    event_type: string;
    event_category: string | null;
    resource_type: string | null;
    created_at: string;
    user_id: string | null;
  }>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminAnalyticsSummary();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load admin analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

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
        <p className="text-muted-foreground">Analitik veri yüklenemedi.</p>
      </div>
    );
  }

  const guestPercentage = analytics.totalSessions > 0 
    ? (analytics.guestSessions / analytics.totalSessions) * 100 
    : 0;
  const userPercentage = analytics.totalSessions > 0 
    ? (analytics.userSessions / analytics.totalSessions) * 100 
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistem Analitikleri</h1>
          <p className="text-muted-foreground mt-1">
            Platform genelindeki kullanım istatistikleri ve performans metrikleri
          </p>
        </div>
        <Button onClick={loadAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Etkinlik</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEvents.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tüm kullanıcı etkileşimleri
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Oturum</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSessions.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aktif oturumlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kayıtlı Kullanıcı</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.userSessions.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              %{userPercentage.toFixed(1)} toplam oturumların
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Misafir Kullanıcı</CardTitle>
            <UserX className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.guestSessions.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              %{guestPercentage.toFixed(1)} toplam oturumların
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">En Popüler İçerikler</TabsTrigger>
          <TabsTrigger value="devices">Cihaz Dağılımı</TabsTrigger>
          <TabsTrigger value="events">Son Etkinlikler</TabsTrigger>
          <TabsTrigger value="users">Kullanıcı İstatistikleri</TabsTrigger>
        </TabsList>

        {/* Top Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>En Çok Görüntülenen İçerikler</CardTitle>
              <CardDescription>
                Platform genelinde en popüler içerikler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topContent.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Henüz içerik verisi yok
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.topContent.map((content, index) => (
                    <div
                      key={content.resource_id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{content.resource_title || 'Adsız İçerik'}</h4>
                          <Badge variant="outline" className="text-xs">
                            {content.resource_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {content.total_views.toLocaleString('tr-TR')} görüntülenme
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {content.unique_visitors.toLocaleString('tr-TR')} benzersiz ziyaretçi
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            {content.total_shares.toLocaleString('tr-TR')} paylaşım
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {content.unique_visitors > 0 
                            ? ((content.unique_visitors / content.total_views) * 100).toFixed(1) 
                            : '0.0'}%
                        </div>
                        <p className="text-xs text-muted-foreground">Benzersiz oran</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Device Breakdown Tab */}
        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Device Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Cihaz Türleri
                </CardTitle>
                <CardDescription>
                  Platform kullanım cihaz dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.deviceBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([device, count]) => {
                      const percentage = (count / analytics.totalSessions) * 100;
                      return (
                        <div key={device} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {device === 'mobile' && <Smartphone className="h-4 w-4 text-primary" />}
                              {device === 'tablet' && <Tablet className="h-4 w-4 text-primary" />}
                              {device === 'desktop' && <Monitor className="h-4 w-4 text-primary" />}
                              <span className="text-sm font-medium capitalize">{device}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {count.toLocaleString('tr-TR')}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                %{percentage.toFixed(1)}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Browser Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Tarayıcı Dağılımı
                </CardTitle>
                <CardDescription>
                  En çok kullanılan tarayıcılar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.browserBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([browser, count]) => {
                      const percentage = (count / analytics.totalSessions) * 100;
                      return (
                        <div key={browser} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{browser}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {count.toLocaleString('tr-TR')}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                %{percentage.toFixed(1)}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combined Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Platform İstatistikleri Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Smartphone className="h-4 w-4" />
                    En Popüler Cihaz
                  </div>
                  <div className="text-2xl font-bold capitalize">
                    {Object.entries(analytics.deviceBreakdown).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Globe className="h-4 w-4" />
                    En Popüler Tarayıcı
                  </div>
                  <div className="text-2xl font-bold">
                    {Object.entries(analytics.browserBreakdown).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Activity className="h-4 w-4" />
                    Oturum Başına Etkinlik
                  </div>
                  <div className="text-2xl font-bold">
                    {analytics.totalSessions > 0 
                      ? (analytics.totalEvents / analytics.totalSessions).toFixed(1) 
                      : '0'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Son Etkinlikler</CardTitle>
              <CardDescription>
                Platform genelindeki en son kullanıcı aktiviteleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recentEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Henüz etkinlik kaydı yok
                </p>
              ) : (
                <div className="space-y-2">
                  {analytics.recentEvents.slice(0, 30).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {event.event_type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            {event.resource_type && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <Badge variant="secondary" className="text-xs">
                                  {event.resource_type}
                                </Badge>
                              </>
                            )}
                            {event.user_id ? (
                              <Badge variant="outline" className="text-xs">
                                Kullanıcı
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-orange-500">
                                Misafir
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.created_at), { 
                              addSuffix: true, 
                              locale: tr 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Stats Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı Dağılımı</CardTitle>
                <CardDescription>
                  Kayıtlı vs. Misafir kullanıcılar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Kayıtlı Kullanıcılar</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {analytics.userSessions.toLocaleString('tr-TR')}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          %{userPercentage.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${userPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Misafir Kullanıcılar</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {analytics.guestSessions.toLocaleString('tr-TR')}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          %{guestPercentage.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="bg-orange-500 h-3 rounded-full transition-all"
                        style={{ width: `${guestPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı Metrikleri</CardTitle>
                <CardDescription>
                  Kullanıcı etkileşim istatistikleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm text-muted-foreground">Toplam Oturum</span>
                    <span className="text-lg font-bold">{analytics.totalSessions.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm text-muted-foreground">Toplam Etkinlik</span>
                    <span className="text-lg font-bold">{analytics.totalEvents.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm text-muted-foreground">Oturum Başı Ortalama Etkinlik</span>
                    <span className="text-lg font-bold">
                      {analytics.totalSessions > 0 
                        ? (analytics.totalEvents / analytics.totalSessions).toFixed(2) 
                        : '0'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
