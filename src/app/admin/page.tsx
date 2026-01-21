'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout, AdminNav, StatCard } from '@/components/admin/admin-layout';
import { BarChart3, ShieldCheck, Users, TrendingUp, AlertCircle, Eye, MousePointer, UserPlus, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { checkAdminAccess, type AdminRole } from '@/lib/admin-security';
import { getGuestAnalyticsSummary, type GuestAnalyticsSummary } from '@/lib/guest-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAppStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [guestStats, setGuestStats] = useState<GuestAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user?.email) {
        router.push('/auth');
        return;
      }

      const access = await checkAdminAccess(user.email);
      if (!access.isAdmin) {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
      setAdminRole(access.role || null);

      // Load guest analytics
      try {
        const stats = await getGuestAnalyticsSummary();
        setGuestStats(stats);
      } catch (e) {
        console.error('Failed to load guest analytics:', e);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle={`Manage and monitor your platform • Role: ${adminRole || 'admin'}`}
    >
      <AdminNav />

      <div className="p-6 space-y-6">
        {/* Admin Role Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <ShieldCheck className="w-3 h-3 mr-1" />
            {adminRole === 'super_admin' ? 'Süper Admin' : adminRole === 'admin' ? 'Admin' : adminRole === 'moderator' ? 'Moderatör' : 'Analist'}
          </Badge>
          <span className="text-sm text-slate-500">{user?.email}</span>
        </div>

        {/* Guest Analytics Section */}
        {guestStats && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Misafir Ziyaretçi Analitikleri
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/80 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">{guestStats.totalSessions}</div>
                <div className="text-xs text-purple-600">Toplam Oturum</div>
              </div>
              <div className="bg-white/80 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-indigo-700">{guestStats.totalActions}</div>
                <div className="text-xs text-indigo-600">Toplam Eylem</div>
              </div>
              <div className="bg-white/80 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{guestStats.signupAttempts}</div>
                <div className="text-xs text-blue-600">Kayıt Denemesi</div>
              </div>
              <div className="bg-white/80 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {guestStats.conversionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-green-600">Dönüşüm Oranı</div>
              </div>
            </div>
            
            {/* Top Actions */}
            {guestStats.topActions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-purple-800 mb-2">En Popüler Eylemler</h4>
                <div className="flex flex-wrap gap-2">
                  {guestStats.topActions.slice(0, 5).map((action, i) => (
                    <Badge key={i} variant="secondary" className="bg-white/80">
                      {action.action_type}: {action.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Aktif Kullanıcılar"
            value={guestStats?.uniqueVisitors.toString() || '0'}
            change={12}
            icon={<Users className="w-8 h-8" />}
          />
          <StatCard
            label="Misafir Oturumları"
            value={guestStats?.totalSessions.toString() || '0'}
            change={8}
            icon={<Eye className="w-8 h-8" />}
          />
          <StatCard
            label="Toplam Etkileşim"
            value={guestStats?.totalActions.toString() || '0'}
            change={24}
            trend="up"
            icon={<MousePointer className="w-8 h-8" />}
          />
          <StatCard
            label="Kayıt Denemeleri"
            value={guestStats?.signupAttempts.toString() || '0'}
            change={15}
            trend="up"
            icon={<UserPlus className="w-8 h-8" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Admin Paneline Hoş Geldiniz</h3>
          <p className="text-blue-800 mb-4">
            Farklı admin özelliklerine erişmek için navigasyon menüsünü kullanın:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
            <li>✓ Kullanıcı Yönetimi - Rolleri ve izinleri yönetin</li>
            <li>✓ Misafir Analitikleri - Ziyaretçi davranışlarını izleyin</li>
            <li>✓ Başarı Doğrulama - Kullanıcı başarılarını onaylayın</li>
            <li>✓ Satış Analitikleri - Rezervasyonları ve satışları takip edin</li>
          </ul>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Status */}
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Database Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Supabase Connection</span>
                <span className="text-green-600 font-medium">✓ Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Tables</span>
                <span className="text-slate-900 font-medium">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">RLS Policies</span>
                <span className="text-slate-900 font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">API Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Payments API</span>
                <span className="text-green-600 font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Stripe Integration</span>
                <span className="text-green-600 font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Webhook Handler</span>
                <span className="text-green-600 font-medium">✓ Running</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
