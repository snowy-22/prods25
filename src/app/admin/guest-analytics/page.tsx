'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout, AdminNav, StatCard } from '@/components/admin/admin-layout';
import { useAppStore } from '@/lib/store';
import { checkAdminAccess, hasPermission, type AdminRole } from '@/lib/admin-security';
import { getGuestAnalyticsSummary, type GuestAnalyticsSummary, type GuestAction, type GuestSession } from '@/lib/guest-analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  Users,
  MousePointer,
  UserPlus,
  TrendingUp,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Loader2,
  RefreshCw,
  Play,
  Heart,
  MessageSquare,
  Share2,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function GuestAnalyticsPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [stats, setStats] = useState<GuestAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const checkAuth = async () => {
      if (!user?.email) {
        router.push('/auth');
        return;
      }

      const access = await checkAdminAccess(user.email);
      if (!access.isAdmin || !hasPermission(access.role!, 'analytics:read')) {
        router.push('/admin');
        return;
      }

      setIsAuthorized(true);
      setAdminRole(access.role || null);
      await loadStats();
    };

    checkAuth();
  }, [user, router]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await getGuestAnalyticsSummary();
      setStats(data);
    } catch (e) {
      console.error('Failed to load guest analytics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthorized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'video_play':
      case 'video_pause':
        return <Play className="w-4 h-4" />;
      case 'like_attempt':
        return <Heart className="w-4 h-4" />;
      case 'comment_attempt':
        return <MessageSquare className="w-4 h-4" />;
      case 'share_attempt':
        return <Share2 className="w-4 h-4" />;
      case 'export_attempt':
        return <Download className="w-4 h-4" />;
      case 'signup_click':
        return <UserPlus className="w-4 h-4" />;
      case 'content_click':
        return <MousePointer className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes('attempt')) return 'bg-amber-100 text-amber-700';
    if (actionType.includes('signup')) return 'bg-green-100 text-green-700';
    if (actionType.includes('video')) return 'bg-purple-100 text-purple-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <AdminLayout
      title="Misafir Analitikleri"
      subtitle="Kayıt olmamış ziyaretçilerin davranışlarını analiz edin"
    >
      <AdminNav />

      <div className="p-6 space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button onClick={loadStats} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Toplam Oturum"
            value={stats?.totalSessions || 0}
            icon={<Users className="w-8 h-8" />}
          />
          <StatCard
            label="Benzersiz Ziyaretçi"
            value={stats?.uniqueVisitors || 0}
            icon={<Eye className="w-8 h-8" />}
          />
          <StatCard
            label="Toplam Eylem"
            value={stats?.totalActions || 0}
            icon={<MousePointer className="w-8 h-8" />}
          />
          <StatCard
            label="Dönüşüm Oranı"
            value={`${stats?.conversionRate.toFixed(1) || 0}%`}
            trend="up"
            icon={<TrendingUp className="w-8 h-8" />}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="actions">Eylemler</TabsTrigger>
            <TabsTrigger value="sessions">Oturumlar</TabsTrigger>
            <TabsTrigger value="conversion">Dönüşüm</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Popular Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  En Popüler Eylemler
                </CardTitle>
                <CardDescription>
                  Misafir kullanıcıların en çok gerçekleştirdiği eylemler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topActions.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getActionColor(action.action_type)}`}>
                          {getActionIcon(action.action_type)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {action.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-lg">
                        {action.count}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-slate-500 text-center py-4">Henüz veri yok</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Signup Attempts vs Sessions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-green-600" />
                    Kayıt Denemeleri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600">
                    {stats?.signupAttempts || 0}
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Toplam {stats?.totalSessions || 0} oturumdan
                  </p>
                  <div className="mt-4 bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-green-700">
                      %{stats?.conversionRate.toFixed(1) || 0} dönüşüm oranı
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Ortalama Oturum Süresi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600">
                    {stats?.avgSessionDuration 
                      ? Math.round(stats.avgSessionDuration / 60000) 
                      : 0} dk
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Ortalama ziyaret süresi
                  </p>
                  <div className="mt-4 bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      Eylem başına ~{stats?.totalActions && stats?.totalSessions 
                        ? (stats.totalActions / stats.totalSessions).toFixed(1) 
                        : 0} işlem
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tüm Eylemler</CardTitle>
                <CardDescription>
                  Misafir kullanıcıların gerçekleştirdiği tüm eylemler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.recentActions?.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getActionColor(action.action_type)}`}>
                          {getActionIcon(action.action_type)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {action.action_type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {action.item_id ? `Item: ${action.item_id.slice(0, 8)}...` : 'Genel'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(action.timestamp), { 
                            addSuffix: true, 
                            locale: tr 
                          })}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-slate-500 text-center py-8">Henüz eylem kaydı yok</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Oturum Detayları</CardTitle>
                <CardDescription>
                  Misafir ziyaretçi oturumlarının detaylı listesi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recentSessions?.map((session, i) => (
                    <div
                      key={i}
                      className="p-4 border rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {session.device_type === 'mobile' ? (
                            <Smartphone className="w-4 h-4 text-slate-500" />
                          ) : (
                            <Monitor className="w-4 h-4 text-slate-500" />
                          )}
                          <span className="font-medium text-slate-900">
                            {session.session_id.slice(0, 12)}...
                          </span>
                        </div>
                        <Badge variant={session.converted ? 'default' : 'secondary'}>
                          {session.converted ? 'Dönüştü' : 'Aktif'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="text-slate-400">Sayfa:</span>{' '}
                          {session.page_views || 0} görüntüleme
                        </div>
                        <div>
                          <span className="text-slate-400">Eylem:</span>{' '}
                          {session.actions_count || 0} işlem
                        </div>
                        <div>
                          <span className="text-slate-400">Süre:</span>{' '}
                          {session.duration 
                            ? Math.round(session.duration / 60000) + ' dk'
                            : 'Aktif'}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDistanceToNow(new Date(session.started_at), { 
                          addSuffix: true, 
                          locale: tr 
                        })}
                      </p>
                    </div>
                  )) || (
                    <p className="text-slate-500 text-center py-8">Henüz oturum kaydı yok</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">Dönüşüm Hunisi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="bg-blue-100 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-700">
                          {stats?.totalSessions || 0}
                        </p>
                        <p className="text-sm text-blue-600">Toplam Ziyaret</p>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[15px] border-l-transparent border-r-transparent border-t-blue-200" />
                    </div>
                    <div className="relative">
                      <div className="bg-amber-100 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-amber-700">
                          {stats?.totalActions || 0}
                        </p>
                        <p className="text-sm text-amber-600">Etkileşim</p>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[15px] border-l-transparent border-r-transparent border-t-amber-200" />
                    </div>
                    <div className="relative">
                      <div className="bg-green-100 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-700">
                          {stats?.signupAttempts || 0}
                        </p>
                        <p className="text-sm text-green-600">Kayıt Tıklaması</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dönüşüm İpuçları</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">💡 Öneri 1</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Kilitli özelliklere tıklayan kullanıcılara özel indirim sunun
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900">💡 Öneri 2</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Video izleme sonrası kayıt çağrısı gösterin
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900">💡 Öneri 3</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Uzun oturumlarda (5+ dk) exit intent popup kullanın
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
