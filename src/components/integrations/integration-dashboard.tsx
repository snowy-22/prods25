'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  Link2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Settings2,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  Package,
  ShoppingCart,
  FileText,
  Truck,
  Wallet,
  BarChart3,
  Users,
  ChevronRight,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Edit2,
  Play,
  Pause,
  Calendar,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// =====================================================
// TYPES
// =====================================================

interface IntegrationProvider {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  country?: string;
  requiredFields: { key: string; label: string; type: string; placeholder?: string }[];
  features: string[];
  setupGuideUrl?: string;
}

interface IntegrationConnection {
  id: string;
  providerId: string;
  providerName: string;
  status: 'active' | 'inactive' | 'error' | 'syncing';
  lastSync?: string;
  nextSync?: string;
  syncInterval: number;
  stats: {
    ordersToday: number;
    productsSynced: number;
    lastError?: string;
  };
}

interface SyncLog {
  id: string;
  connectionId: string;
  type: 'orders' | 'products' | 'stock' | 'prices';
  status: 'success' | 'error' | 'partial';
  itemsProcessed: number;
  errors: number;
  duration: number;
  createdAt: string;
}

// =====================================================
// SAMPLE DATA
// =====================================================

const SAMPLE_PROVIDERS: IntegrationProvider[] = [
  {
    id: 'trendyol',
    name: 'Trendyol',
    category: 'marketplace',
    description: 'Türkiye\'nin en büyük e-ticaret platformu',
    icon: '🛒',
    color: '#F27A1A',
    country: 'TR',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'API anahtarınızı girin' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'API şifrenizi girin' },
      { key: 'sellerId', label: 'Satıcı ID', type: 'text', placeholder: 'Satıcı numaranızı girin' },
    ],
    features: ['Sipariş senkronizasyonu', 'Ürün yönetimi', 'Stok güncelleme', 'Fiyat güncelleme', 'Kargo entegrasyonu'],
  },
  {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    category: 'marketplace',
    description: 'Türkiye\'nin önde gelen e-ticaret sitesi',
    icon: '🧡',
    color: '#FF6000',
    country: 'TR',
    requiredFields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text' },
      { key: 'apiKey', label: 'API Key', type: 'text' },
      { key: 'apiSecret', label: 'API Secret', type: 'password' },
    ],
    features: ['Sipariş senkronizasyonu', 'Ürün yönetimi', 'Stok güncelleme'],
  },
  {
    id: 'n11',
    name: 'N11',
    category: 'marketplace',
    description: 'Türkiye\'nin popüler alışveriş sitesi',
    icon: '🟢',
    color: '#00C853',
    country: 'TR',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'text' },
      { key: 'apiSecret', label: 'API Secret', type: 'password' },
    ],
    features: ['Sipariş senkronizasyonu', 'Ürün yönetimi'],
  },
  {
    id: 'parasut',
    name: 'Paraşüt',
    category: 'erp',
    description: 'Bulut tabanlı ön muhasebe ve fatura yönetimi',
    icon: '📊',
    color: '#6366F1',
    country: 'TR',
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'companyId', label: 'Şirket ID', type: 'text' },
    ],
    features: ['E-Fatura', 'E-Arşiv', 'Müşteri yönetimi', 'Stok takibi'],
  },
  {
    id: 'yurtici',
    name: 'Yurtiçi Kargo',
    category: 'shipping',
    description: 'Türkiye\'nin lider kargo firması',
    icon: '📦',
    color: '#E31E24',
    country: 'TR',
    requiredFields: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text' },
      { key: 'password', label: 'Şifre', type: 'password' },
      { key: 'customerCode', label: 'Müşteri Kodu', type: 'text' },
    ],
    features: ['Gönderi oluşturma', 'Kargo takibi', 'Etiket yazdırma'],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'ecommerce',
    description: 'Global e-ticaret platformu',
    icon: '🛍️',
    color: '#5E8E3E',
    requiredFields: [
      { key: 'shopDomain', label: 'Mağaza Domain', type: 'text', placeholder: 'magazaadi.myshopify.com' },
      { key: 'accessToken', label: 'Access Token', type: 'password' },
    ],
    features: ['Ürün senkronizasyonu', 'Sipariş senkronizasyonu', 'Müşteri senkronizasyonu'],
  },
];

const SAMPLE_CONNECTIONS: IntegrationConnection[] = [
  {
    id: 'conn-1',
    providerId: 'trendyol',
    providerName: 'Trendyol',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    nextSync: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    syncInterval: 60,
    stats: {
      ordersToday: 47,
      productsSynced: 1250,
    },
  },
  {
    id: 'conn-2',
    providerId: 'hepsiburada',
    providerName: 'Hepsiburada',
    status: 'active',
    lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    syncInterval: 60,
    stats: {
      ordersToday: 23,
      productsSynced: 890,
    },
  },
  {
    id: 'conn-3',
    providerId: 'parasut',
    providerName: 'Paraşüt',
    status: 'error',
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    syncInterval: 120,
    stats: {
      ordersToday: 0,
      productsSynced: 0,
      lastError: 'API kimlik doğrulama hatası',
    },
  },
];

// =====================================================
// COMPONENTS
// =====================================================

function ProviderIcon({ provider, size = 40 }: { provider: IntegrationProvider; size?: number }) {
  return (
    <div 
      className="flex items-center justify-center rounded-xl text-2xl"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: `${provider.color}20`,
      }}
    >
      {provider.icon}
    </div>
  );
}

function ConnectionStatusBadge({ status }: { status: IntegrationConnection['status'] }) {
  const variants = {
    active: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Aktif' },
    inactive: { bg: 'bg-gray-500/10', text: 'text-gray-600', label: 'Pasif' },
    error: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Hata' },
    syncing: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Senkronize ediliyor' },
  };
  
  const variant = variants[status];
  
  return (
    <Badge variant="outline" className={cn('gap-1', variant.bg, variant.text)}>
      {status === 'syncing' ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : status === 'active' ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : status === 'error' ? (
        <XCircle className="h-3 w-3" />
      ) : null}
      {variant.label}
    </Badge>
  );
}

function TimeAgo({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (minutes < 1) return <span>Az önce</span>;
  if (minutes < 60) return <span>{minutes} dk önce</span>;
  if (hours < 24) return <span>{hours} saat önce</span>;
  return <span>{Math.floor(hours / 24)} gün önce</span>;
}

function AddIntegrationDialog({ 
  providers, 
  onAdd 
}: { 
  providers: IntegrationProvider[];
  onAdd: (providerId: string, credentials: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const categories = [
    { id: 'marketplace', label: 'Pazaryerleri', icon: Store },
    { id: 'erp', label: 'ERP / Muhasebe', icon: FileText },
    { id: 'shipping', label: 'Kargo', icon: Truck },
    { id: 'ecommerce', label: 'E-Ticaret', icon: ShoppingCart },
  ];
  
  const handleProviderSelect = (provider: IntegrationProvider) => {
    setSelectedProvider(provider);
    setCredentials({});
    setTestResult(null);
    setStep('configure');
  };
  
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = Math.random() > 0.3;
    setTestResult({
      success,
      message: success ? 'Bağlantı başarılı!' : 'Bağlantı başarısız. Kimlik bilgilerini kontrol edin.',
    });
    setTesting(false);
  };
  
  const handleSave = () => {
    if (selectedProvider) {
      onAdd(selectedProvider.id, credentials);
      setOpen(false);
      setStep('select');
      setSelectedProvider(null);
      setCredentials({});
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Entegrasyon Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? 'Entegrasyon Seç' : `${selectedProvider?.name} Bağlantısı`}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' 
              ? 'Bağlamak istediğiniz platformu seçin'
              : 'API kimlik bilgilerinizi girin'
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 'select' ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {categories.map(category => {
                const categoryProviders = providers.filter(p => p.category === category.id);
                if (categoryProviders.length === 0) return null;
                
                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <category.icon className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">{category.label}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryProviders.map(provider => (
                        <button
                          key={provider.id}
                          onClick={() => handleProviderSelect(provider)}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary hover:bg-accent/50 transition-colors text-left"
                        >
                          <ProviderIcon provider={provider} size={36} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{provider.name}</span>
                              {provider.country && (
                                <Badge variant="outline" className="text-xs">
                                  {provider.country}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {provider.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
              <ProviderIcon provider={selectedProvider!} />
              <div>
                <p className="font-medium">{selectedProvider?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedProvider?.description}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              {selectedProvider?.requiredFields.map(field => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <div className="relative">
                    <Input
                      type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={credentials[field.key] || ''}
                      onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                    />
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShowSecrets({ ...showSecrets, [field.key]: !showSecrets[field.key] })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                      >
                        {showSecrets[field.key] ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {testResult && (
              <div className={cn(
                'p-3 rounded-lg flex items-center gap-2',
                testResult.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
              )}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}
            
            {selectedProvider?.setupGuideUrl && (
              <a 
                href={selectedProvider.setupGuideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Kurulum rehberini görüntüle
              </a>
            )}
          </div>
        )}
        
        <DialogFooter>
          {step === 'configure' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')}>
                Geri
              </Button>
              <Button variant="outline" onClick={handleTest} disabled={testing}>
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test ediliyor...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Bağlantıyı Test Et
                  </>
                )}
              </Button>
              <Button onClick={handleSave} disabled={!testResult?.success}>
                Kaydet
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConnectionCard({ 
  connection, 
  provider,
  onSync,
  onEdit,
  onDelete,
  onToggle
}: { 
  connection: IntegrationConnection;
  provider?: IntegrationProvider;
  onSync: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {provider && <ProviderIcon provider={provider} />}
            <div>
              <CardTitle className="text-base">{connection.providerName}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <ConnectionStatusBadge status={connection.status} />
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onSync}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {connection.stats.lastError && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {connection.stats.lastError}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg bg-accent/50">
            <p className="text-xs text-muted-foreground">Bugünkü Siparişler</p>
            <p className="text-xl font-semibold">{connection.stats.ordersToday}</p>
          </div>
          <div className="p-2 rounded-lg bg-accent/50">
            <p className="text-xs text-muted-foreground">Senkronize Ürün</p>
            <p className="text-xl font-semibold">{connection.stats.productsSynced.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Son sync: {connection.lastSync ? <TimeAgo date={connection.lastSync} /> : 'Hiç'}
          </span>
          <span>Her {connection.syncInterval} dk</span>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function IntegrationDashboard() {
  const [connections, setConnections] = useState<IntegrationConnection[]>(SAMPLE_CONNECTIONS);
  const [activeTab, setActiveTab] = useState('connections');
  
  const handleAddIntegration = (providerId: string, credentials: Record<string, string>) => {
    const provider = SAMPLE_PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;
    
    const newConnection: IntegrationConnection = {
      id: `conn-${Date.now()}`,
      providerId,
      providerName: provider.name,
      status: 'active',
      syncInterval: 60,
      stats: {
        ordersToday: 0,
        productsSynced: 0,
      },
    };
    
    setConnections([...connections, newConnection]);
  };
  
  const activeConnections = connections.filter(c => c.status === 'active').length;
  const totalOrders = connections.reduce((sum, c) => sum + c.stats.ordersToday, 0);
  const totalProducts = connections.reduce((sum, c) => sum + c.stats.productsSynced, 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Entegrasyonlar</h1>
          <p className="text-muted-foreground">
            Pazaryerleri, ERP ve kargo bağlantılarınızı yönetin
          </p>
        </div>
        <AddIntegrationDialog providers={SAMPLE_PROVIDERS} onAdd={handleAddIntegration} />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Link2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeConnections}</p>
                <p className="text-sm text-muted-foreground">Aktif Bağlantı</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-sm text-muted-foreground">Bugünkü Sipariş</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProducts.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Toplam Ürün</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">%98.5</p>
                <p className="text-sm text-muted-foreground">Sync Başarı Oranı</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connections" className="gap-2">
            <Link2 className="h-4 w-4" />
            Bağlantılar
          </TabsTrigger>
          <TabsTrigger value="sync-logs" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Senkronizasyon Geçmişi
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connections" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {connections.map(connection => {
              const provider = SAMPLE_PROVIDERS.find(p => p.id === connection.providerId);
              return (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  provider={provider}
                  onSync={() => console.log('Sync', connection.id)}
                  onEdit={() => console.log('Edit', connection.id)}
                  onDelete={() => setConnections(connections.filter(c => c.id !== connection.id))}
                  onToggle={() => console.log('Toggle', connection.id)}
                />
              );
            })}
            
            {/* Add New Card */}
            <Card className="border-dashed flex items-center justify-center min-h-[200px] hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="text-center">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Yeni Entegrasyon Ekle</p>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sync-logs" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-center py-8">
                Senkronizasyon geçmişi burada görüntülenecek
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Otomatik Senkronizasyon</p>
                  <p className="text-sm text-muted-foreground">
                    Tüm bağlantılar için otomatik senkronizasyonu etkinleştir
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Hata Bildirimleri</p>
                  <p className="text-sm text-muted-foreground">
                    Senkronizasyon hatalarında e-posta bildirimi al
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Stok Uyarıları</p>
                  <p className="text-sm text-muted-foreground">
                    Düşük stok durumunda uyarı al
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default IntegrationDashboard;
