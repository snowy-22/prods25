# YouTube URL Metadata & Analytics Özellikleri

## Genel Bakış

CanvasFlow, YouTube videolarını ve Shorts'ları eklerken otomatik olarak **metadata** ve **analitik verilerini** çekip listeye ekleyebiliyor. Bu özellik, kullanıcının kendi **YouTube Data API v3** anahtarını sağlaması ile kullanıcı bazında etkinleştirilebiliyor.

## Özellikler

### 1. Desteklenen URL Formatları

- **YouTube Videos**: `https://www.youtube.com/watch?v=VIDEO_ID`
- **YouTube Shorts**: `https://www.youtube.com/shorts/VIDEO_ID`
- **Shortened URLs**: `https://youtu.be/VIDEO_ID`
- **Embedded URLs**: `https://www.youtube.com/embed/VIDEO_ID`

### 2. Çekilen Metadata

Her YouTube videonun metadata'sında aşağıdaki bilgiler otomatik olarak kaydediliyor:

#### Temel Bilgiler
- `videoId` - YouTube Video ID
- `title` - Video başlığı
- `description` (content) - Video açıklaması
- `thumbnail_url` - Video önerisi resmi (en yüksek kalite)
- `published_at` - Yayın tarihi

#### Kanal Bilgileri
- `channelId` - Kanal ID'si
- `channelTitle` - Kanal adı
- `author_name` - Kanal sahibi adı

#### İstatistikler
- `viewCount` - Toplam görüntülenme sayısı
- `likeCount` - Beğeni sayısı
- `dislikeCount` - Beğenmeme sayısı (YouTube v3 API'sinden)
- `commentCount` - Yorum sayısı
- `favoriteCount` - Favori sayısı

#### İçerik Detayları
- `duration` - Video süresi (ISO 8601 formatı, örn: "PT4M13S")
- `definition` - Video kalitesi ("hd" | "sd")
- `dimension` - Video boyutu ("2d" | "3d")
- `caption` - Altyazı desteği (boolean)
- `licensedContent` - Telif hakkı korumalı içerik (boolean)
- `projection` - Video projeksiyon tipi ("rectangular" | "360")

#### Kategori ve Etiketler
- `categoryId` - YouTube kategori ID'si
- `tags` - Video etiketleri (dizi)

### 3. API Setup

#### Step 1: Google Cloud Proje Oluştur
1. [Google Cloud Console](https://console.cloud.google.com) adresine git
2. Yeni bir proje oluştur
3. "YouTube Data API v3" etkinleştir

#### Step 2: API Anahtarı Oluştur
1. "Kimlik Doğrulama" (Credentials) sayfasına git
2. "API Anahtarı Oluştur" seçeneğini tıkla
3. Oluşturulan API anahtarını kopyala

#### Step 3: CanvasFlow'da Ayarla
1. Ayarlar ikonuna tıkla (⚙️)
2. "Entegrasyonlar" sekmesine git (veya Header'da bulunan "API Keys" düğmesine tıkla)
3. "YouTube" tab'ını seç
4. API anahtarını yapıştır
5. "YouTube Metadata Çekmeyi Etkinleştir" seçeneğini aç
6. "Kaydet" düğmesine tıkla

### 4. Kullanım

#### Video Eklerken Otomatik Metadata
Kullanıcı API anahtarını ve özelliği ayarladığında, YouTube URL'si eklenen her video otomatik olarak metadata çeker ve kayıt eder.

```typescript
// Canvas page'de otomatik olarak yapılıyor
const { youtubeApiKey, youtubeMetadataEnabled } = useAppStore.getState();
const userApiKey = youtubeMetadataEnabled ? youtubeApiKey : undefined;

const metadata = await fetchOembedMetadata(itemData.url, userApiKey);
```

#### Metadata'yı Manuel Olarak Yenile
Video Info Dialog'da "Yenile" düğmesini tıklayarak metadata manuel olarak yenilelenebilir.

### 5. Güvenlik

- API anahtarları **localStorage**'da TLS üzerinden kaydediliyor
- Anahtarlar **sadece client-side**'da saklanıyor
- Hiçbir sunucuya gönderilmiyor
- Kullanıcı istediği zaman silebilir

### 6. Hook: useYoutubeMetadata

Diğer bileşenlerde YouTube metadata çekme işlemini yönetmek için bu hook kullanılabilir:

```typescript
import { useYoutubeMetadata } from '@/hooks/use-youtube-metadata';

function MyComponent() {
  const { fetchMetadata, isLoading, error } = useYoutubeMetadata();

  const handleFetch = async () => {
    const metadata = await fetchMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    if (metadata) {
      console.log('Başlık:', metadata.title);
      console.log('Görüntülenme:', metadata.viewCount);
    }
  };

  return (
    <button onClick={handleFetch} disabled={isLoading}>
      {isLoading ? 'Yükleniyor...' : 'Metadata Çek'}
    </button>
  );
}
```

## Dosya Yapısı

```
src/
├── lib/
│   ├── oembed-helpers.ts          # Metadata çekme fonksiyonları
│   ├── store.ts                   # Zustand store (API anahtarları)
│   └── initial-content.ts         # ContentItem type tanımlamaları
├── components/
│   ├── api-keys-dialog.tsx        # API Keys dialog (YouTube & Google)
│   ├── item-info-dialog.tsx       # Item bilgileri (Yenile düğmesi)
│   └── settings-dialog.tsx        # Ayarlar
├── app/
│   └── canvas/page.tsx            # Main canvas sayısı (metadata çekme)
└── hooks/
    └── use-youtube-metadata.ts    # Hook for YouTube metadata management
```

## Store State

```typescript
// AppStore'da eklenen alanlar
youtubeApiKey?: string;           // YouTube Data API anahtarı
googleApiKey?: string;            // Google Cloud API anahtarı
youtubeMetadataEnabled: boolean;  // Metadata çekme özellikleri aktif mi?

// Actions
setYoutubeApiKey: (key: string) => void;
setGoogleApiKey: (key: string) => void;
setYoutubeMetadataEnabled: (enabled: boolean) => void;
```

## ContentItem Metadata Alanları

```typescript
// Eklenen YouTube-specific alanlar
videoId?: string;              // YouTube Video ID
channelId?: string;            // YouTube Channel ID
channelTitle?: string;         // YouTube Channel Name
categoryId?: string;           // YouTube Category ID
tags?: string[];               // YouTube Tags
duration?: string;             // ISO 8601 format
definition?: 'hd' | 'sd';
dimension?: '2d' | '3d';
caption?: boolean;
licensedContent?: boolean;
projection?: 'rectangular' | '360';
dislikeCount?: number;
favoriteCount?: number;
```

## Eksik/İleri Özellikler

### Potansiyel Geliştirmeler
1. **Batch Metadata Update** - Birden fazla video için metadata toplu güncelleme
2. **Analytics Dashboard** - YouTube istatistiklerini görselleştiren dashboard
3. **Captions/Transcripts** - Altyazı ve transkrip çekme
4. **Comments** - Video yorumlarını çekme
5. **Thumbnails Gallery** - Farklı thumbnail resolution'ları
6. **Channel Analytics** - Kanal istatistikleri
7. **Playlist Support** - Playlist desteği
8. **Auto-refresh** - Periyodik metadata yenileme

### API Rate Limiting
YouTube Data API'nin günlük limit'i:
- Varsayılan: 10,000 birim/gün
- Her video metadata çekişi: ~10 birim

## Troubleshooting

### Problem: "API Anahtarı Gerekli"
- API anahtarınızı ayarlar'da girmeniz gerekiyor
- Ayarlar → Entegrasyonlar → YouTube

### Problem: API Anahtarı Geçersiz
- API anahtarınızı kontrol et
- Google Cloud Console'da YouTube Data API v3'ün etkin olduğundan emin ol
- API anahtarını test et ("Bağlantıyı Test Et" düğmesi)

### Problem: Metadata Çekimiyor
- `youtubeMetadataEnabled` alanı aktif olduğundan emin ol
- Browser console'da hata mesajlarını kontrol et
- YouTube API quota'nızı kontrol et

## Referans

- [YouTube Data API v3 Dokumentasyonu](https://developers.google.com/youtube/v3)
- [API Quotas ve Limits](https://developers.google.com/youtube/v3/getting-started#quota)
- [Snippet Resource](https://developers.google.com/youtube/v3/docs/videos#snippet)
- [Statistics Resource](https://developers.google.com/youtube/v3/docs/videos#statistics)
