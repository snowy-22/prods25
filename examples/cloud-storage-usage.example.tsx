/**
 * Bulut Depolama Sistemi Kullanım Örnekleri
 * 
 * Bu dosya cloud-storage-manager.ts API'sinin 
 * gerçek hayat kullanım örneklerini gösterir.
 * 
 * NOT: Bu dosya örnek amaçlıdır, doğrudan çalıştırmayın.
 */

import React from 'react';
import { useAppStore } from '@/lib/store';
import type { ContentItem } from '@/lib/initial-content';

// ============================================================================
// ÖRNEK 1: Uygulama Başlatıldığında Depolama Başlatma
// ============================================================================

export async function initializeStorageOnAppStart() {
  const user = useAppStore.getState().user;
  
  if (!user) {
    console.log('Kullanıcı giriş yapmamış, depolama başlatma atlandı');
    return;
  }

  try {
    // Store'dan action'ı al
    const { initializeCloudStorage, isStorageSyncing } = useAppStore.getState();
    
    // Başlat
    await initializeCloudStorage();
    
    // State'i kontrol et
    const state = useAppStore.getState();
    console.log(`✅ Depolama başlatıldı`);
    console.log(`   Kota: ${state.cloudStorageQuota?.quota_bytes} bytes`);
    console.log(`   Kullanılan: ${state.cloudStorageQuota?.used_bytes} bytes`);
    
  } catch (error) {
    console.error('❌ Depolama başlatma hatası:', error);
  }
}

// ============================================================================
// ÖRNEK 2: Klasöre Tekil Dosya Ekleme
// ============================================================================

export async function addSingleFileToFolder(
  folderId: string,
  item: ContentItem,
  fileSizeInBytes?: number
) {
  const { saveFolderItemToCloud, storageError } = useAppStore.getState();
  
  try {
    // Dosya boyutunu hesapla (verilmez ise JSON serialize et)
    const sizeBytes = fileSizeInBytes || JSON.stringify(item).length;
    
    console.log(`📝 Dosya ekleniyor: ${item.title}`);
    console.log(`   Boyut: ${(sizeBytes / 1024).toFixed(2)} KB`);
    console.log(`   Klasör: ${folderId}`);
    
    // Buluta kaydet
    await saveFolderItemToCloud(folderId, item, sizeBytes);
    
    // Sonuç
    const state = useAppStore.getState();
    console.log(`✅ Dosya başarıyla kaydedildi`);
    console.log(`   Yeni kullanım: ${(state.cloudStorageQuota?.used_bytes || 0) / (1024**3)} GB`);
    
  } catch (error) {
    const state = useAppStore.getState();
    console.error(`❌ Dosya eklenirken hata: ${state.storageError}`);
  }
}

// ============================================================================
// ÖRNEK 3: Birden Fazla Dosya Toplu Ekleme
// ============================================================================

export async function addMultipleFilesToFolder(
  folderId: string,
  items: Array<{ item: ContentItem; sizeBytes?: number }>
) {
  const { saveFolderItemsToCloud } = useAppStore.getState();
  
  try {
    console.log(`📦 ${items.length} dosya ekleniyor...`);
    
    // Boyutları hesapla
    const itemsWithSize = items.map(({ item, sizeBytes }) => ({
      item,
      sizeBytes: sizeBytes || JSON.stringify(item).length
    }));
    
    // Toplu kaydet
    await saveFolderItemsToCloud(folderId, itemsWithSize);
    
    const state = useAppStore.getState();
    console.log(`✅ Tüm dosyalar kaydedildi`);
    console.log(`   Klasördeki öğe sayısı: ${state.cloudFolderItems.length}`);
    
  } catch (error) {
    console.error('❌ Toplu ekleme hatası:', error);
  }
}

// ============================================================================
// ÖRNEK 4: Klasördeki Dosyaları Yükleme
// ============================================================================

export async function loadFolderContents(folderId: string) {
  const { loadFolderItemsFromCloud } = useAppStore.getState();
  
  try {
    console.log(`📂 Klasör içeriği yükleniyor: ${folderId}`);
    
    // Yükle
    await loadFolderItemsFromCloud(folderId);
    
    const state = useAppStore.getState();
    const items = state.cloudFolderItems;
    
    console.log(`✅ ${items.length} dosya yüklendi`);
    items.forEach(item => {
      console.log(`   - ${item.item_title} (${item.size_bytes} bytes)`);
    });
    
    return items;
    
  } catch (error) {
    console.error('❌ Yükleme hatası:', error);
  }
}

// ============================================================================
// ÖRNEK 5: Tüm Kişisel Klasörleri Yükleme
// ============================================================================

export async function loadAllPersonalFolders() {
  const { loadAllPersonalFolderItems } = useAppStore.getState();
  
  try {
    console.log(`🏠 Tüm kişisel klasörler yükleniyor...`);
    
    await loadAllPersonalFolderItems();
    
    const state = useAppStore.getState();
    const items = state.cloudFolderItems;
    
    // Klasörlere göre grupla
    const byFolder = items.reduce((acc, item) => {
      const folder = item.folder_id;
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(item);
      return acc;
    }, {} as Record<string, typeof items>);
    
    console.log(`✅ Toplam ${items.length} dosya, ${Object.keys(byFolder).length} klasörde`);
    Object.entries(byFolder).forEach(([folderId, folderItems]) => {
      const totalSize = folderItems.reduce((sum, item) => sum + item.size_bytes, 0);
      console.log(`   📁 ${folderId}: ${folderItems.length} dosya, ${(totalSize / 1024).toFixed(2)} KB`);
    });
    
  } catch (error) {
    console.error('❌ Klasörleri yükleme hatası:', error);
  }
}

// ============================================================================
// ÖRNEK 6: Dosya Silme
// ============================================================================

export async function deleteCloudFile(itemId: string) {
  const { deleteFolderItemFromCloud } = useAppStore.getState();
  
  try {
    console.log(`🗑️ Dosya siliniyor: ${itemId}`);
    
    const state = useAppStore.getState();
    const usedBefore = state.cloudStorageQuota?.used_bytes || 0;
    
    // Sil
    await deleteFolderItemFromCloud(itemId);
    
    const stateAfter = useAppStore.getState();
    const usedAfter = stateAfter.cloudStorageQuota?.used_bytes || 0;
    const freedSpace = usedBefore - usedAfter;
    
    console.log(`✅ Dosya silindi`);
    console.log(`   Boşaltılan alan: ${(freedSpace / 1024).toFixed(2)} KB`);
    console.log(`   Yeni kullanım: ${(usedAfter / (1024**3)).toFixed(3)} GB`);
    
  } catch (error) {
    console.error('❌ Silme hatası:', error);
  }
}

// ============================================================================
// ÖRNEK 7: Depolama Analitiklerini Alma
// ============================================================================

export async function getStorageAnalytics() {
  const { getStorageAnalytics } = useAppStore.getState();
  
  try {
    console.log(`📊 Depolama analitikleri alınıyor...`);
    
    await getStorageAnalytics();
    
    const state = useAppStore.getState();
    const analytics = state.storageAnalytics;
    
    if (analytics) {
      console.log(`✅ Analitikler yüklendi:`);
      console.log(`   Kullanım: ${analytics.usagePercent.toFixed(1)}%`);
      console.log(`   Kullanılan: ${(analytics.quotaBytes / (1024**3)).toFixed(3)} GB`);
      console.log(`   Boş: ${(analytics.availableBytes / (1024**3)).toFixed(3)} GB`);
      
      // Kategori dağılımı
      const distribution = state.storageDistribution;
      console.log(`   Kategori dağılımı:`);
      distribution.forEach(cat => {
        console.log(`     ${cat.category}: ${(cat.used_bytes / (1024**2)).toFixed(2)} MB`);
      });
    }
    
  } catch (error) {
    console.error('❌ Analitik hatası:', error);
  }
}

// ============================================================================
// ÖRNEK 8: Cihazlar Arası Senkronizasyon
// ============================================================================

export async function syncAcrossDevices(folderId?: string) {
  const { syncFolderItemsAcrossDevices } = useAppStore.getState();
  
  try {
    const targetFolder = folderId || 'personal';
    console.log(`🔄 Senkronizasyon başlatılıyor: ${targetFolder}`);
    
    const startTime = Date.now();
    await syncFolderItemsAcrossDevices(targetFolder);
    const duration = Date.now() - startTime;
    
    const state = useAppStore.getState();
    const syncStatus = state.storageSyncStatus[0];
    
    if (syncStatus) {
      console.log(`✅ Senkronizasyon tamamlandı (${duration}ms)`);
      console.log(`   Senkronize dosya sayısı: ${syncStatus.items_synced}`);
      console.log(`   Senkronize veri: ${(syncStatus.bytes_synced / (1024**2)).toFixed(2)} MB`);
      console.log(`   Durum: ${syncStatus.sync_status}`);
    }
    
  } catch (error) {
    console.error('❌ Senkronizasyon hatası:', error);
  }
}

// ============================================================================
// ÖRNEK 9: Depolama Değişikliklerine Abone Olma
// ============================================================================

export function subscribeToStorageChanges() {
  const { subscribeToStorageChanges: subscribe } = useAppStore.getState();
  
  console.log(`👂 Depolama değişiklikleri izleniyor...`);
  
  // Abone ol
  const unsubscribe = subscribe();
  
  // Test: Her 5 saniyede değişiklik çek
  const testInterval = setInterval(() => {
    const state = useAppStore.getState();
    const analytics = state.storageAnalytics;
    
    if (analytics) {
      console.log(`📡 Anlık kullanım: ${analytics.usagePercent.toFixed(1)}%`);
    }
  }, 5000);
  
  // 30 saniye sonra izlemeyi kapat
  setTimeout(() => {
    clearInterval(testInterval);
    unsubscribe();
    console.log(`✅ İzleme kapatıldı`);
  }, 30000);
}

// ============================================================================
// ÖRNEK 10: Depolama Dolu Durumunu Yönetme
// ============================================================================

export async function handleStorageFull() {
  const state = useAppStore.getState();
  const analytics = state.storageAnalytics;
  
  if (!analytics || analytics.usagePercent < 80) {
    console.log(`✅ Depolama durumu iyi (${analytics?.usagePercent.toFixed(1)}% kullanıldı)`);
    return;
  }
  
  console.warn(`⚠️ DEPOLAMA NEREDEYSE DOLU!`);
  console.warn(`   Kullanım: ${analytics.usagePercent.toFixed(1)}%`);
  console.warn(`   Boş alan: ${(analytics.availableBytes / (1024**2)).toFixed(2)} MB`);
  
  // Çözüm seçenekleri
  console.log(`📋 Çözüm seçenekleri:`);
  console.log(`   1. Eski dosyaları sil`);
  console.log(`   2. Depolama yükselt (gelecek)`);
  console.log(`   3. Arşiv oluştur`);
  
  // Örnek: Dağılımdan büyük kategorileri sil
  const distribution = state.storageDistribution;
  const largest = distribution.sort((a, b) => b.used_bytes - a.used_bytes)[0];
  
  if (largest) {
    console.log(`💡 İpucu: ${largest.category} kategorisinde ${(largest.used_bytes / (1024**2)).toFixed(2)} MB var`);
  }
}

// ============================================================================
// ÖRNEK 11: React Component İçinde Kullanım
// ============================================================================

export function StorageMonitorExample() {
  // Hook'u kullan
  const {
    cloudStorageQuota,
    storageAnalytics,
    storageDistribution,
    isStorageSyncing,
    storageError,
    getStorageAnalytics,
    syncFolderItemsAcrossDevices
  } = useAppStore();

  // Analitikleri yükle
  React.useEffect(() => {
    getStorageAnalytics();
    
    // Her 10 saniyede güncelle
    const interval = setInterval(() => getStorageAnalytics(), 10000);
    return () => clearInterval(interval);
  }, [getStorageAnalytics]);

  // UI göster
  return (
    <div>
      {isStorageSyncing && <p>⏳ Senkronize ediliyor...</p>}
      
      {storageError && <p style={{ color: 'red' }}>❌ {storageError}</p>}
      
      {storageAnalytics && (
        <div>
          <h3>Depolama: {storageAnalytics.usagePercent.toFixed(1)}%</h3>
          
          <progress
            value={storageAnalytics.usagePercent}
            max="100"
          />
          
          <p>
            {(storageAnalytics.quotaBytes / (1024**3)).toFixed(3)} GB /
            {(storageAnalytics.availableBytes / (1024**3)).toFixed(3)} GB kaldı
          </p>
          
          <h4>Kategori Dağılımı:</h4>
          <ul>
            {storageDistribution.map(cat => (
              <li key={cat.category}>
                {cat.category}: {(cat.used_bytes / (1024**2)).toFixed(2)} MB
              </li>
            ))}
          </ul>
          
          <button onClick={() => syncFolderItemsAcrossDevices('personal')}>
            Senkronize Et
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ÖRNEK 12: Hata Yönetimi
// ============================================================================

export async function handleStorageWithErrorManagement() {
  try {
    const { saveFolderItemToCloud, storageError } = useAppStore.getState();
    
    // Dosya ekle
    await saveFolderItemToCloud(
      'personal',
      {
        id: 'video-1',
        title: 'My Video',
        type: 'video'
      } as ContentItem,
      500000 // 500 KB
    );
    
    // Hata kontrolü
    if (storageError) {
      switch (true) {
        case storageError.includes('quota'):
          console.error('❌ Depolama kotası tamamlanmış');
          // Kullanıcıya yükseltme seçeneği sun
          break;
        case storageError.includes('network'):
          console.error('❌ Ağ bağlantısı sorunu');
          // Yeniden denemek için buton sun
          break;
        case storageError.includes('permission'):
          console.error('❌ İzin yok');
          // Giriş yaptırmayı tekrar et
          break;
        default:
          console.error('❌ Bilinmeyen hata:', storageError);
      }
    }
    
  } catch (error) {
    console.error('❌ Beklenmeyen hata:', error);
  }
}

// ============================================================================
// ÖRNEK 13: Periyodik Senkronizasyon
// ============================================================================

export function setupPeriodicSync(intervalMs = 300000) { // 5 dakika
  console.log(`⏱️ Periyodik senkronizasyon başlatıldı (${intervalMs}ms)`);
  
  const sync = async () => {
    try {
      const { syncFolderItemsAcrossDevices, getStorageAnalytics } = useAppStore.getState();
      
      console.log(`🔄 Periyodik senkronizasyon çalışıyor...`);
      await Promise.all([
        syncFolderItemsAcrossDevices('personal'),
        getStorageAnalytics()
      ]);
      
      console.log(`✅ Periyodik senkronizasyon tamamlandı`);
    } catch (error) {
      console.error('❌ Periyodik senkronizasyon hatası:', error);
    }
  };
  
  // İlk çalıştır
  sync();
  
  // Periyodik çalıştır
  const interval = setInterval(sync, intervalMs);
  
  // Temizleme fonksiyonu döndür
  return () => clearInterval(interval);
}

// ============================================================================
// TÜRKÇE BAŞLAMA KODU
// ============================================================================

/**
 * İlk kullanım için bu adımları izleyin:
 */
export const GETTING_STARTED = `
1. Depolama Başlat
   await initializeStorageOnAppStart();

2. Dosya Ekle
   await addSingleFileToFolder('personal', myItem, 5000);

3. Analitikleri Görüntüle
   await getStorageAnalytics();

4. Senkronize Et
   await syncAcrossDevices('personal');

5. İzle
   subscribeToStorageChanges();
`;
