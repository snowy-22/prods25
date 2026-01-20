'use client';

import { useState, useEffect } from 'react';
import { AdminLayout, AdminNav } from '@/components/admin/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Save, 
  Download, 
  Upload, 
  RefreshCw,
  Settings,
  Layers,
  Users,
  ShoppingCart,
  Zap,
  Shield,
  Cloud,
  Palette,
  MessageSquare,
  Video,
  Bot,
  BarChart3,
  Megaphone,
  Crown,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Subscription tiers
const SUBSCRIPTION_TIERS = [
  { id: 'guest', name: 'Misafir', color: 'bg-gray-500', icon: Users },
  { id: 'free', name: 'Ücretsiz', color: 'bg-green-500', icon: Sparkles },
  { id: 'basic', name: 'Temel', color: 'bg-blue-500', icon: Zap },
  { id: 'pro', name: 'Pro', color: 'bg-purple-500', icon: Crown },
  { id: 'enterprise', name: 'Enterprise', color: 'bg-orange-500', icon: Shield },
  { id: 'kurumsal', name: 'Kurumsal', color: 'bg-red-500', icon: Users },
  { id: 'kurumsal_pro', name: 'Kurumsal Pro', color: 'bg-pink-500', icon: Crown },
] as const;

// Feature groups with all features
const FEATURE_GROUPS = [
  {
    id: 'canvas',
    name: 'Canvas & Layout',
    icon: Layers,
    features: [
      { id: 'grid_mode', name: 'Grid Modu', hasLimit: false },
      { id: 'canvas_mode', name: 'Canvas Modu', hasLimit: false },
      { id: 'multi_tab', name: 'Çoklu Sekme', hasLimit: true, limitLabel: 'Maks. Sekme' },
      { id: 'custom_layouts', name: 'Özel Layout\'lar', hasLimit: false },
      { id: 'drag_drop', name: 'Sürükle Bırak', hasLimit: false },
      { id: 'zoom_pan', name: 'Yakınlaştırma/Kaydırma', hasLimit: false },
      { id: 'split_view', name: 'Bölünmüş Görünüm', hasLimit: false },
      { id: 'fullscreen', name: 'Tam Ekran Modu', hasLimit: false },
    ],
  },
  {
    id: 'content',
    name: 'İçerik & Medya',
    icon: Video,
    features: [
      { id: 'max_items', name: 'İçerik Ekleme', hasLimit: true, limitLabel: 'Maks. İçerik' },
      { id: 'youtube_embed', name: 'YouTube Embed', hasLimit: false },
      { id: 'vimeo_embed', name: 'Vimeo Embed', hasLimit: false },
      { id: 'twitch_embed', name: 'Twitch Embed', hasLimit: false },
      { id: 'custom_iframe', name: 'Özel iFrame', hasLimit: true, limitLabel: 'Maks. iFrame' },
      { id: 'file_upload', name: 'Dosya Yükleme', hasLimit: true, limitLabel: 'Maks. Boyut (MB)' },
      { id: 'image_gallery', name: 'Resim Galerisi', hasLimit: false },
      { id: '3d_viewer', name: '3D Görüntüleyici', hasLimit: false },
    ],
  },
  {
    id: 'widgets',
    name: 'Widget\'lar',
    icon: Settings,
    features: [
      { id: 'clock_widget', name: 'Saat Widget', hasLimit: false },
      { id: 'notes_widget', name: 'Notlar Widget', hasLimit: true, limitLabel: 'Maks. Not' },
      { id: 'todo_widget', name: 'Yapılacaklar Widget', hasLimit: false },
      { id: 'weather_widget', name: 'Hava Durumu Widget', hasLimit: false },
      { id: 'calendar_widget', name: 'Takvim Widget', hasLimit: false },
      { id: 'countdown_widget', name: 'Geri Sayım Widget', hasLimit: false },
      { id: 'quotes_widget', name: 'Alıntılar Widget', hasLimit: false },
      { id: 'custom_widgets', name: 'Özel Widget\'lar', hasLimit: true, limitLabel: 'Maks. Özel' },
    ],
  },
  {
    id: 'ai',
    name: 'AI & Asistan',
    icon: Bot,
    features: [
      { id: 'ai_assistant', name: 'AI Asistan', hasLimit: true, limitLabel: 'Günlük İstek' },
      { id: 'ai_search', name: 'AI Destekli Arama', hasLimit: false },
      { id: 'ai_suggestions', name: 'AI Öneriler', hasLimit: false },
      { id: 'ai_styling', name: 'AI Stil Önerileri', hasLimit: false },
      { id: 'content_analysis', name: 'İçerik Analizi', hasLimit: false },
      { id: 'smart_organize', name: 'Akıllı Organizasyon', hasLimit: false },
      { id: 'voice_commands', name: 'Sesli Komutlar', hasLimit: false },
      { id: 'vision_analysis', name: 'Görsel Analiz', hasLimit: true, limitLabel: 'Günlük Analiz' },
    ],
  },
  {
    id: 'collaboration',
    name: 'İşbirliği',
    icon: Users,
    features: [
      { id: 'folder_sharing', name: 'Klasör Paylaşımı', hasLimit: false },
      { id: 'real_time_collab', name: 'Gerçek Zamanlı İşbirliği', hasLimit: false },
      { id: 'comments', name: 'Yorumlar', hasLimit: false },
      { id: 'mentions', name: 'Bahsetmeler (@)', hasLimit: false },
      { id: 'collaborators', name: 'İşbirlikçiler', hasLimit: true, limitLabel: 'Maks. Kişi' },
      { id: 'version_history', name: 'Sürüm Geçmişi', hasLimit: true, limitLabel: 'Gün' },
      { id: 'activity_log', name: 'Aktivite Günlüğü', hasLimit: false },
      { id: 'permissions', name: 'İzin Yönetimi', hasLimit: false },
    ],
  },
  {
    id: 'storage',
    name: 'Depolama & Senkronizasyon',
    icon: Cloud,
    features: [
      { id: 'cloud_storage', name: 'Bulut Depolama', hasLimit: true, limitLabel: 'Maks. GB' },
      { id: 'cross_device_sync', name: 'Cihazlar Arası Senkronizasyon', hasLimit: false },
      { id: 'offline_mode', name: 'Çevrimdışı Mod', hasLimit: false },
      { id: 'auto_backup', name: 'Otomatik Yedekleme', hasLimit: false },
      { id: 'export_data', name: 'Veri Dışa Aktarma', hasLimit: false },
      { id: 'import_data', name: 'Veri İçe Aktarma', hasLimit: false },
      { id: 'trash_retention', name: 'Çöp Kutusu Saklama', hasLimit: true, limitLabel: 'Gün' },
      { id: 'file_versioning', name: 'Dosya Sürümleme', hasLimit: true, limitLabel: 'Sürüm' },
    ],
  },
  {
    id: 'customization',
    name: 'Özelleştirme',
    icon: Palette,
    features: [
      { id: 'themes', name: 'Temalar', hasLimit: false },
      { id: 'custom_frames', name: 'Özel Çerçeveler', hasLimit: false },
      { id: 'animations', name: 'Animasyonlar', hasLimit: false },
      { id: 'custom_css', name: 'Özel CSS', hasLimit: false },
      { id: 'branding', name: 'Marka Özelleştirme', hasLimit: false },
      { id: 'custom_domains', name: 'Özel Alan Adı', hasLimit: false },
      { id: 'white_label', name: 'White Label', hasLimit: false },
      { id: 'api_access', name: 'API Erişimi', hasLimit: true, limitLabel: 'Günlük İstek' },
    ],
  },
  {
    id: 'messaging',
    name: 'Mesajlaşma & İletişim',
    icon: MessageSquare,
    features: [
      { id: 'direct_messages', name: 'Direkt Mesajlar', hasLimit: false },
      { id: 'group_chats', name: 'Grup Sohbetleri', hasLimit: true, limitLabel: 'Maks. Grup' },
      { id: 'voice_calls', name: 'Sesli Aramalar', hasLimit: false },
      { id: 'video_calls', name: 'Görüntülü Aramalar', hasLimit: false },
      { id: 'screen_sharing', name: 'Ekran Paylaşımı', hasLimit: false },
      { id: 'message_history', name: 'Mesaj Geçmişi', hasLimit: true, limitLabel: 'Gün' },
      { id: 'file_sharing', name: 'Dosya Paylaşımı', hasLimit: true, limitLabel: 'Maks. MB' },
      { id: 'notifications', name: 'Bildirimler', hasLimit: false },
    ],
  },
  {
    id: 'analytics',
    name: 'Analitik & Raporlama',
    icon: BarChart3,
    features: [
      { id: 'basic_analytics', name: 'Temel Analitik', hasLimit: false },
      { id: 'advanced_analytics', name: 'Gelişmiş Analitik', hasLimit: false },
      { id: 'export_reports', name: 'Rapor Dışa Aktarma', hasLimit: false },
      { id: 'custom_dashboards', name: 'Özel Panolar', hasLimit: true, limitLabel: 'Maks. Panel' },
      { id: 'real_time_metrics', name: 'Gerçek Zamanlı Metrikler', hasLimit: false },
      { id: 'user_behavior', name: 'Kullanıcı Davranışı', hasLimit: false },
      { id: 'content_insights', name: 'İçerik Analizleri', hasLimit: false },
      { id: 'scheduled_reports', name: 'Zamanlanmış Raporlar', hasLimit: false },
    ],
  },
  {
    id: 'ads',
    name: 'Reklamlar & Monetizasyon',
    icon: Megaphone,
    features: [
      { id: 'show_ads', name: 'Reklam Gösterimi', hasLimit: false, description: 'Ücretsiz kullanıcılara reklam gösterilir' },
      { id: 'ad_free', name: 'Reklamsız Deneyim', hasLimit: false },
      { id: 'ad_slots_per_page', name: 'Sayfa Başına Reklam', hasLimit: true, limitLabel: 'Adet' },
      { id: 'sponsored_content', name: 'Sponsorlu İçerik', hasLimit: false },
    ],
  },
  {
    id: 'security',
    name: 'Güvenlik & Gizlilik',
    icon: Shield,
    features: [
      { id: 'two_factor_auth', name: 'İki Faktörlü Doğrulama', hasLimit: false },
      { id: 'sso', name: 'Tek Oturum Açma (SSO)', hasLimit: false },
      { id: 'audit_logs', name: 'Denetim Günlükleri', hasLimit: true, limitLabel: 'Gün' },
      { id: 'data_encryption', name: 'Veri Şifreleme', hasLimit: false },
      { id: 'gdpr_compliance', name: 'GDPR Uyumluluğu', hasLimit: false },
      { id: 'ip_whitelist', name: 'IP Beyaz Listesi', hasLimit: false },
      { id: 'session_management', name: 'Oturum Yönetimi', hasLimit: false },
      { id: 'privacy_controls', name: 'Gizlilik Kontrolleri', hasLimit: false },
    ],
  },
  {
    id: 'ecommerce',
    name: 'E-Ticaret & Satış',
    icon: ShoppingCart,
    features: [
      { id: 'product_listings', name: 'Ürün Listeleme', hasLimit: true, limitLabel: 'Maks. Ürün' },
      { id: 'marketplace', name: 'Pazar Yeri Erişimi', hasLimit: false },
      { id: 'payment_processing', name: 'Ödeme İşleme', hasLimit: false },
      { id: 'inventory_tracking', name: 'Envanter Takibi', hasLimit: false },
      { id: 'order_management', name: 'Sipariş Yönetimi', hasLimit: false },
      { id: 'digital_products', name: 'Dijital Ürünler', hasLimit: false },
      { id: 'subscription_products', name: 'Abonelik Ürünleri', hasLimit: false },
      { id: 'affiliate_program', name: 'Ortaklık Programı', hasLimit: false },
    ],
  },
];

// Default feature matrix (which tier has which feature)
const DEFAULT_FEATURE_MATRIX: Record<string, Record<string, { enabled: boolean; limit?: number | string }>> = {
  guest: {
    grid_mode: { enabled: true },
    canvas_mode: { enabled: false },
    multi_tab: { enabled: true, limit: 2 },
    max_items: { enabled: true, limit: 10 },
    show_ads: { enabled: true },
    ad_slots_per_page: { enabled: true, limit: 4 },
  },
  free: {
    grid_mode: { enabled: true },
    canvas_mode: { enabled: true },
    multi_tab: { enabled: true, limit: 5 },
    max_items: { enabled: true, limit: 50 },
    youtube_embed: { enabled: true },
    clock_widget: { enabled: true },
    notes_widget: { enabled: true, limit: 10 },
    ai_assistant: { enabled: true, limit: 10 },
    cloud_storage: { enabled: true, limit: 1 },
    show_ads: { enabled: true },
    ad_slots_per_page: { enabled: true, limit: 3 },
  },
  basic: {
    grid_mode: { enabled: true },
    canvas_mode: { enabled: true },
    multi_tab: { enabled: true, limit: 15 },
    max_items: { enabled: true, limit: 200 },
    youtube_embed: { enabled: true },
    vimeo_embed: { enabled: true },
    clock_widget: { enabled: true },
    notes_widget: { enabled: true, limit: 50 },
    ai_assistant: { enabled: true, limit: 50 },
    cloud_storage: { enabled: true, limit: 5 },
    ad_free: { enabled: true },
    collaborators: { enabled: true, limit: 3 },
  },
  pro: {
    grid_mode: { enabled: true },
    canvas_mode: { enabled: true },
    multi_tab: { enabled: true, limit: 50 },
    max_items: { enabled: true, limit: 1000 },
    youtube_embed: { enabled: true },
    vimeo_embed: { enabled: true },
    twitch_embed: { enabled: true },
    custom_iframe: { enabled: true, limit: 20 },
    ai_assistant: { enabled: true, limit: 200 },
    ai_styling: { enabled: true },
    cloud_storage: { enabled: true, limit: 25 },
    ad_free: { enabled: true },
    collaborators: { enabled: true, limit: 10 },
    api_access: { enabled: true, limit: 1000 },
  },
  enterprise: {
    grid_mode: { enabled: true },
    canvas_mode: { enabled: true },
    multi_tab: { enabled: true, limit: -1 }, // unlimited
    max_items: { enabled: true, limit: -1 },
    ai_assistant: { enabled: true, limit: -1 },
    cloud_storage: { enabled: true, limit: 100 },
    ad_free: { enabled: true },
    collaborators: { enabled: true, limit: -1 },
    api_access: { enabled: true, limit: -1 },
    sso: { enabled: true },
    white_label: { enabled: true },
    custom_domains: { enabled: true },
  },
  kurumsal: {
    // Similar to enterprise with Turkish corporate features
    grid_mode: { enabled: true },
    canvas_mode: { enabled: true },
    multi_tab: { enabled: true, limit: -1 },
    max_items: { enabled: true, limit: -1 },
    ai_assistant: { enabled: true, limit: 500 },
    cloud_storage: { enabled: true, limit: 50 },
    ad_free: { enabled: true },
    collaborators: { enabled: true, limit: 50 },
  },
  kurumsal_pro: {
    // All features unlimited
    grid_mode: { enabled: true },
    canvas_mode: { enabled: true },
    multi_tab: { enabled: true, limit: -1 },
    max_items: { enabled: true, limit: -1 },
    ai_assistant: { enabled: true, limit: -1 },
    cloud_storage: { enabled: true, limit: -1 },
    ad_free: { enabled: true },
    collaborators: { enabled: true, limit: -1 },
    api_access: { enabled: true, limit: -1 },
    sso: { enabled: true },
    white_label: { enabled: true },
    custom_domains: { enabled: true },
  },
};

export default function FeaturePlannerPage() {
  const [featureMatrix, setFeatureMatrix] = useState<Record<string, Record<string, { enabled: boolean; limit?: number | string }>>>(DEFAULT_FEATURE_MATRIX);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toggle feature for a tier
  const toggleFeature = (tierId: string, featureId: string) => {
    setFeatureMatrix(prev => {
      const tierFeatures = prev[tierId] || {};
      const current = tierFeatures[featureId] || { enabled: false };
      return {
        ...prev,
        [tierId]: {
          ...tierFeatures,
          [featureId]: { ...current, enabled: !current.enabled },
        },
      };
    });
    setHasChanges(true);
  };

  // Update limit for a feature
  const updateLimit = (tierId: string, featureId: string, limit: number | string) => {
    setFeatureMatrix(prev => {
      const tierFeatures = prev[tierId] || {};
      const current = tierFeatures[featureId] || { enabled: true };
      return {
        ...prev,
        [tierId]: {
          ...tierFeatures,
          [featureId]: { ...current, limit },
        },
      };
    });
    setHasChanges(true);
  };

  // Get feature state for a tier
  const getFeatureState = (tierId: string, featureId: string) => {
    return featureMatrix[tierId]?.[featureId] || { enabled: false };
  };

  // Save configuration (placeholder - will be implemented with Supabase)
  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to Supabase
      console.log('Saving configuration:', featureMatrix);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Export configuration as JSON
  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(featureMatrix, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feature-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import configuration from JSON
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        setFeatureMatrix(config);
        setHasChanges(true);
      } catch (error) {
        console.error('Invalid JSON file:', error);
      }
    };
    reader.readAsText(file);
  };

  // Filter feature groups
  const filteredGroups = selectedGroup === 'all' 
    ? FEATURE_GROUPS 
    : FEATURE_GROUPS.filter(g => g.id === selectedGroup);

  return (
    <AdminLayout
      title="Özellik Planlama"
      subtitle="Tüm abonelik paketleri için özellikleri ve limitleri yapılandırın"
    >
      <AdminNav />
      
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportConfig}>
            <Download className="w-4 h-4 mr-2" />
            Dışa Aktar
          </Button>
          <label>
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                İçe Aktar
              </span>
            </Button>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={importConfig}
            />
          </label>
          <Button 
            onClick={saveConfiguration}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Button>
        </div>

      {/* Tier Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Abonelik Paketleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {SUBSCRIPTION_TIERS.map(tier => (
              <div key={tier.id} className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', tier.color)} />
                <tier.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{tier.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Group Filter Tabs */}
      <Tabs value={selectedGroup} onValueChange={setSelectedGroup} className="w-full">
        <TabsList className="w-full flex-wrap h-auto p-1 gap-1">
          <TabsTrigger value="all" className="text-xs">
            Tümü
          </TabsTrigger>
          {FEATURE_GROUPS.map(group => (
            <TabsTrigger key={group.id} value={group.id} className="text-xs">
              <group.icon className="w-3 h-3 mr-1" />
              {group.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Feature Matrix Tables */}
      <div className="space-y-6">
        {filteredGroups.map(group => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <group.icon className="w-5 h-5" />
                {group.name}
              </CardTitle>
              <CardDescription>
                {group.features.length} özellik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Özellik</TableHead>
                      <TableHead className="min-w-[100px]">Limit Türü</TableHead>
                      {SUBSCRIPTION_TIERS.map(tier => (
                        <TableHead key={tier.id} className="text-center min-w-[120px]">
                          <div className="flex flex-col items-center gap-1">
                            <div className={cn('w-2 h-2 rounded-full', tier.color)} />
                            <span className="text-xs">{tier.name}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.features.map(feature => (
                      <TableRow key={feature.id}>
                        <TableCell className="font-medium">
                          {feature.name}
                          {feature.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {feature.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {feature.hasLimit ? (
                            <Badge variant="outline" className="text-xs">
                              {feature.limitLabel}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Açık/Kapalı
                            </Badge>
                          )}
                        </TableCell>
                        {SUBSCRIPTION_TIERS.map(tier => {
                          const state = getFeatureState(tier.id, feature.id);
                          return (
                            <TableCell key={tier.id} className="text-center">
                              <div className="flex flex-col items-center gap-2">
                                <Checkbox
                                  checked={state.enabled}
                                  onCheckedChange={() => toggleFeature(tier.id, feature.id)}
                                />
                                {feature.hasLimit && state.enabled && (
                                  <Input
                                    type="text"
                                    value={state.limit === -1 ? '∞' : state.limit || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '∞' || val === '-1') {
                                        updateLimit(tier.id, feature.id, -1);
                                      } else {
                                        const num = parseInt(val);
                                        updateLimit(tier.id, feature.id, isNaN(num) ? val : num);
                                      }
                                    }}
                                    className="w-16 h-7 text-xs text-center"
                                    placeholder="Limit"
                                  />
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Özet İstatistikler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {SUBSCRIPTION_TIERS.map(tier => {
              const tierFeatures = featureMatrix[tier.id] || {};
              const enabledCount = Object.values(tierFeatures).filter(f => f.enabled).length;
              const totalFeatures = FEATURE_GROUPS.reduce((acc, g) => acc + g.features.length, 0);
              
              return (
                <div key={tier.id} className="text-center p-3 rounded-lg bg-muted/50">
                  <div className={cn('w-3 h-3 rounded-full mx-auto mb-2', tier.color)} />
                  <div className="text-sm font-medium">{tier.name}</div>
                  <div className="text-2xl font-bold">{enabledCount}</div>
                  <div className="text-xs text-muted-foreground">
                    / {totalFeatures} özellik
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            size="lg" 
            onClick={saveConfiguration}
            disabled={isSaving}
            className="shadow-lg"
          >
            {isSaving ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Kaydet
          </Button>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
