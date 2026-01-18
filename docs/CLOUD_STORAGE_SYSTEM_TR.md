# Bulut Depolama Sistemi Dokümantasyonu

## Genel Bakış

CanvasFlow artık tam bir **bulut depolama sistemi** ile donatılmıştır. Bu sistem kişisel klasörleri ve oynatıcıları tüm oturumlar ve cihazlar arasında senkronize ederek, 1 GB'lık kişi başı depolama alanı sağlar.

## Başlıca Özellikler

### 1. **Depolama Yönetimi**
- **1 GB kişi başı depolama**: Her kullanıcı 1,073,741,824 byte (1 GB) bulut alanına sahiptir
- **Otomatik takip**: Kullanım, kategori başına dağılım ve gerçek zamanlı senkronizasyon
- **Kullanım göstergesi**: İnteraktif ilerlemeler ve detalı istatistikler

### 2. **Klasör Öğe Depolama**
```typescript
// Klasörde öğeleri buluttan kaydet
await saveFolderItemToCloud(userId, folderId, item, sizeBytes);

// Birden fazla öğeyi kaydet
await saveFolderItemsToCloud(userId, folderId, [
  { item: item1, sizeBytes: 1024 },
  { item: item2, sizeBytes: 2048 }
]);

// Klasörlerin öğelerini yükle
const items = await loadFolderItemsFromCloud(userId, folderId);
```

### 3. **Çok Cihazlı Senkronizasyon**
```typescript
// Cihazlar arasında senkronize et
const result = await syncFolderItemsAcrossDevices(userId, deviceId, folderId);
console.log(`${result.itemCount} öğe, ${result.bytesCount} byte senkronize edildi`);
```

### 4. **Depolama Analitikleri**
```typescript
// Depolama bilgisini al
const analytics = await getStorageAnalytics(userId);
// Döner: { quota, distribution, syncStatus, usagePercent, availableBytes }
```

## Veritabanı Tabloları

### `user_storage_quotas`
Kullanıcı depolama kontasını saklar:
- `user_id`: Kullanıcı ID'si
- `quota_bytes`: Toplam kota (1 GB = 1,073,741,824)
- `used_bytes`: Kullanılan depolama
- `created_at`, `updated_at`: Zaman damgaları

### `folder_items_cloud`
Klasör öğelerini buluttan saklar:
- `user_id`, `folder_id`, `item_id`: Yapı
- `item_type`: Öğe türü (video, widget, vb.)
- `item_data`: Tam içerik
- `size_bytes`: Öğe boyutu

### `storage_distribution`
Kategori başına depolama dağılımı:
- `category`: videos, images, widgets, files, other
- `used_bytes`: Kategori kullanım
- `item_count`: Öğe sayısı

### `storage_sync_status`
Cihaz senkronizasyon durumu:
- `device_id`: Cihaz tanımlayıcısı
- `sync_status`: synced, pending, error
- `items_synced`, `bytes_synced`: Senkronize istatistikleri
- `last_sync_at`: Son senkronizasyon zamanı

### `storage_transactions`
Depolama işlem günlüğü:
- `transaction_type`: upload, delete, sync, transfer
- `item_id`, `item_type`: Hangi öğe
- `size_bytes`: İşlem boyutu
- `status`: Tamamlandı, hata, vb.

## Store Entegrasyonu

### State
```typescript
interface AppStore {
  // Cloud Storage
  cloudStorageQuota?: UserStorageQuota;
  cloudFolderItems: FolderItemCloud[];
  storageDistribution: StorageDistribution[];
  storageSyncStatus: StorageSyncStatus[];
  storageAnalytics?: {
    usagePercent: number;
    availableBytes: number;
    quotaBytes: number;
    usedBytes: number;
  };
  isStorageSyncing: boolean;
  storageError?: string;
}
```

### Actions
```typescript
// Başlat
await initializeCloudStorage();

// Öğe kaydet
await saveFolderItemToCloud(folderId, item, sizeBytes);

// Öğeleri yükle
await loadFolderItemsFromCloud(folderId);
await loadAllPersonalFolderItems();

// Senkronize et
await syncFolderItemsAcrossDevices(folderId);

// Analitikleri yenile
await getStorageAnalytics();

// Değişikliklere abone ol
const unsubscribe = subscribeToStorageChanges();
```

## Depolama Ayarları UI

Depolama ayarları şu bileşenlerde gösterilir:

### StorageSettings Component
```tsx
import { StorageSettings } from '@/components/storage-settings';

export function MyPage() {
  return <StorageSettings />;
}
```

**Özellikler:**
- Toplam depolama kullanım göstergesi
- Kategori başına dağılım tablosu
- Cihaz senkronizasyon durumu
- Senkronizasyon kontrol butonları
- Hata mesajları

### Settings Dialog'da Depolama Sekmesi
Ayarlar dialog'unun "Depolama" sekmesinde görülebilir:
1. Ayarları aç → Depolama sekmesi
2. Depolama kullanımını görüntüle
3. Cihazlar arasında senkronize et
4. Kategori dağılımını analiz et

## Örnek Kullanım

### 1. Klasörde İçerik Kaydetme
```typescript
// Store'dan action'ları al
const { saveFolderItemToCloud } = useAppStore();

// Kullanıcı öğesi eklemesi yaptığında
async function handleAddItemToFolder(folderId: string, item: ContentItem) {
  try {
    // Öğe boyutunu hesapla (opsiyonel)
    const sizeBytes = JSON.stringify(item).length;
    
    // Buluta kaydet
    await saveFolderItemToCloud(folderId, item, sizeBytes);
    
    // UI güncelle
    console.log('Öğe başarıyla kaydedildi');
  } catch (error) {
    console.error('Kaydetme hatası:', error);
  }
}
```

### 2. Klasör Öğelerini Yükleme
```typescript
// Komponent mount olduğunda
useEffect(() => {
  async function loadItems() {
    const { loadFolderItemsFromCloud } = useAppStore();
    const items = await loadFolderItemsFromCloud(folderId);
    setItems(items);
  }
  
  loadItems();
}, [folderId]);
```

### 3. Cihazlar Arasında Senkronize Etme
```typescript
// Kullanıcı butona tıklaması
async function handleSyncAcrossDevices() {
  const { syncFolderItemsAcrossDevices } = useAppStore();
  
  try {
    await syncFolderItemsAcrossDevices('personal');
    alert('Başarıyla senkronize edildi!');
  } catch (error) {
    alert('Senkronizasyon hatası: ' + error.message);
  }
}
```

### 4. Depolama Analitiklerini İzleme
```typescript
useEffect(() => {
  async function getStats() {
    const { getStorageAnalytics } = useAppStore();
    const analytics = useAppStore(s => s.storageAnalytics);
    
    if (analytics) {
      console.log(`%${analytics.usagePercent.toFixed(1)} kullanıldı`);
      console.log(`${analytics.availableBytes / (1024**3).toFixed(2)} GB kullanılabilir`);
    }
  }
  
  getStats();
}, []);
```

## Teknik Detaylar

### Senkronizasyon Mekanizması
1. **Otomatik**: CloudSyncProvider app mount olduğunda başlatılır
2. **Gerçek zamanlı**: Supabase LISTEN/NOTIFY ile değişiklikler izlenir
3. **Çok cihazlı**: Her cihaz kendi `device_id` ile ayırt edilir
4. **Çakışma çözümü**: Yapı `user_id,item_id` ile UNIQUE kullanır

### Boyut Hesaplaması
- Varsayılan: JSON serilizasyonu uzunluğu
- Özel: Medya dosyaları için gerçek dosya boyutu
- Otomatik: Storage transactions'a kaydedilir

### Kategori Haritalaması
```typescript
const categoryMap = {
  video: 'videos',
  audio: 'videos',
  youtube: 'videos',
  player: 'videos',
  image: 'images',
  widget: 'widgets',
  note: 'files',
  todo: 'files',
  folder: 'other'
};
```

## Güvenlik

### Row Level Security (RLS)
- Kullanıcılar sadece kendi verilerini görebilir
- Tüm işlemler `auth.uid()` kontrolü ile korunur
- Veri ihlali imkansız

### Veri Taraması
```sql
-- Örnek query (RLS tarafından otomatik filtrelenir)
SELECT * FROM folder_items_cloud 
WHERE user_id = auth.uid();
```

## Performans

### Optimizasyonlar
1. **Indexler**: `user_id`, `folder_id`, `item_id` için index
2. **Pagination**: Cihazlar arası senkronizasyon batch işleme
3. **Debouncing**: UI güncellemeleri azaltılır
4. **Lazy Loading**: Ön talep üzerine yükleme

### Sınırlamalar
- Maksimum dosya boyutu: 1 GB (Supabase sınırı)
- Maksimum istekler: Rate limiting var
- Senkronizasyon gecikme: ~2-5 saniye

## Hata Yönetimi

### Hata Türleri
```typescript
// Depolama doldu
if (analytics.usagePercent >= 100) {
  // Uyarı göster
}

// Senkronizasyon hatası
if (storageError) {
  console.error(storageError);
  // Yeniden dene ve/veya kullanıcıya bildir
}

// Bağlantı hatası
try {
  await getStorageAnalytics();
} catch (error) {
  // Offline olduğunu göster
}
```

## Gelecek Geliştirmeler

- [ ] Depolama upgrade seçenekleri
- [ ] Eski dosyaları arşivleme
- [ ] Depolama veri taşıma
- [ ] İşbirliğine dayalı klasörler
- [ ] S3/Google Cloud entegrasyonu

## İlgili Dosyalar

- **Store**: `src/lib/store.ts` - AppStore entegrasyonu
- **Cloud Storage**: `src/lib/cloud-storage-manager.ts` - Ana lojik
- **UI Komponenti**: `src/components/storage-settings.tsx` - Arayüz
- **Hook**: `src/lib/use-cloud-storage.ts` - Başlatma
- **Supabase**: `src/lib/supabase-sync.ts` - Gerçek zamanlı senkronizasyon
- **Ayarlar**: `src/components/settings-dialog.tsx` - Depolama sekmesi

## Destek

Soru veya sorunlar için:
1. Türk: `docs/depolama-sistemi-tr.md`
2. İngilizce: `docs/storage-system-en.md`
3. GitHub Issues: Hataları raporla
