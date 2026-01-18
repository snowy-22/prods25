'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, HardDrive, BarChart3, RefreshCw, Cloud } from 'lucide-react';

interface StorageSettingsProps {
  className?: string;
}

export function StorageSettings({ className = '' }: StorageSettingsProps) {
  const {
    cloudStorageQuota,
    storageDistribution,
    storageSyncStatus,
    storageAnalytics,
    isStorageSyncing,
    storageError,
    getStorageAnalytics,
    syncFolderItemsAcrossDevices,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load storage analytics on mount
    getStorageAnalytics().catch(console.error);
  }, [getStorageAnalytics]);

  const handleRefreshAnalytics = async () => {
    setIsLoading(true);
    try {
      await getStorageAnalytics();
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAcrossDevices = async () => {
    setIsLoading(true);
    try {
      // Sync all personal folder items
      await syncFolderItemsAcrossDevices('personal');
      await getStorageAnalytics();
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quota = cloudStorageQuota;
  const analytics = storageAnalytics;

  if (!quota || !analytics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Depolama
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Depolama bilgileri yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  const usagePercent = analytics.usagePercent;
  const quotaGB = (analytics.quotaBytes / (1024 ** 3)).toFixed(2);
  const usedGB = (analytics.usedBytes / (1024 ** 3)).toFixed(2);
  const availableGB = (analytics.availableBytes / (1024 ** 3)).toFixed(2);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Genel Depolama Bilgisi */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              <div>
                <CardTitle>Bulut Depolaması</CardTitle>
                <CardDescription>Kişisel klasörler ve oynatıcılar</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshAnalytics}
              disabled={isLoading || isStorageSyncing}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ana Kullanım Göstergesi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Toplam Kullanım</span>
              <span className="text-sm font-semibold">{usagePercent.toFixed(1)}%</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{usedGB} GB kullanıldı</span>
              <span>{availableGB} GB kullanılabilir</span>
            </div>
          </div>

          {/* Kuota Bilgileri */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Toplam Kuota</p>
              <p className="text-lg font-semibold">{quotaGB} GB</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Kullanım</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">{usedGB} GB</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Kullanılabilir</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{availableGB} GB</p>
            </div>
          </div>

          {/* Hata Mesajı */}
          {storageError && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{storageError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kategori Dağılımı */}
      {storageDistribution && storageDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <div>
                <CardTitle>Depolama Dağılımı</CardTitle>
                <CardDescription>Kategori başına kullanım</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storageDistribution.map((dist) => {
                const categoryLabel = {
                  videos: '🎬 Videolar',
                  images: '🖼️ Görseller',
                  widgets: '🎨 Widget\'ler',
                  files: '📄 Dosyalar',
                  other: '📦 Diğer',
                }[dist.category] || dist.category;

                const distUsedGB = (dist.used_bytes / (1024 ** 3)).toFixed(2);
                const distPercent = analytics.quotaBytes > 0 
                  ? (dist.used_bytes / analytics.quotaBytes) * 100 
                  : 0;

                return (
                  <div key={dist.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{categoryLabel}</span>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-semibold">{distUsedGB}</span> GB ({dist.item_count} öğe)
                      </div>
                    </div>
                    <Progress value={distPercent} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Senkronizasyon Durumu */}
      {storageSyncStatus && storageSyncStatus.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              <div>
                <CardTitle>Senkronizasyon</CardTitle>
                <CardDescription>Cihazlar arası senkronizasyon durumu</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {storageSyncStatus.map((sync) => {
                const statusLabel = {
                  synced: '✓ Senkronize',
                  pending: '⏳ Bekleniyor',
                  error: '✕ Hata',
                }[sync.sync_status] || sync.sync_status;

                const statusColor = {
                  synced: 'text-green-600 dark:text-green-400',
                  pending: 'text-yellow-600 dark:text-yellow-400',
                  error: 'text-red-600 dark:text-red-400',
                }[sync.sync_status] || '';

                const syncedGB = (sync.bytes_synced / (1024 ** 3)).toFixed(2);

                return (
                  <div 
                    key={sync.id}
                    className="p-3 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{sync.device_id || 'Cihaz'}</p>
                        <p className={`text-xs ${statusColor} font-semibold`}>
                          {statusLabel}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{sync.items_synced} öğe</p>
                        <p>{syncedGB} GB</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Son senkronizasyon:{' '}
                      {sync.last_sync_at
                        ? new Date(sync.last_sync_at).toLocaleString('tr-TR')
                        : 'Hiç senkronize edilmedi'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Senkronizasyon Butonları */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Senkronizasyon İşlemleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleSyncAcrossDevices}
            disabled={isLoading || isStorageSyncing}
            className="w-full"
          >
            <Cloud className="w-4 h-4 mr-2" />
            {isStorageSyncing ? 'Senkronize Ediliyor...' : 'Tüm Cihazlarda Senkronize Et'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Kişisel klasörlerinizi tüm cihazlarınız arasında senkronize edin
          </p>
        </CardContent>
      </Card>

      {/* Bilgi Mesajı */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Bilgi:</strong> Her kullanıcı <strong>{quotaGB} GB</strong> bulut depolama alanına sahiptir. 
          Depolama, kişisel klasörleriniz ve oynatıcılarınız için kullanılır ve tüm cihazlarınız arasında otomatik olarak senkronize edilir.
        </p>
      </div>
    </div>
  );
}
