/**
 * Reklam Alanı Sistemi (Ad Space System)
 * 
 * Kullanıcıların kendi canvas'larında reklam alanları tanımlamasına,
 * reklam satın almasına ve yönetmesine olanak tanır.
 */

// Reklam Slot Tipi
export type AdSlotType = 
  | 'banner'      // Yatay banner (728x90, 320x50)
  | 'square'      // Kare (300x250, 336x280)
  | 'vertical'    // Dikey (160x600, 300x600)
  | 'native'      // İçerik arası native reklam
  | 'interstitial' // Tam ekran geçiş reklamı
  | 'video'       // Video reklam
  | 'sponsored'   // Sponsorlu içerik kartı
  | 'custom';     // Özel boyut

// Reklam Slot Boyutları
export interface AdSlotSize {
  width: number;
  height: number;
  label: string;
  type: AdSlotType;
}

export const AD_SLOT_SIZES: AdSlotSize[] = [
  { width: 728, height: 90, label: 'Leaderboard', type: 'banner' },
  { width: 320, height: 50, label: 'Mobile Banner', type: 'banner' },
  { width: 300, height: 250, label: 'Medium Rectangle', type: 'square' },
  { width: 336, height: 280, label: 'Large Rectangle', type: 'square' },
  { width: 160, height: 600, label: 'Wide Skyscraper', type: 'vertical' },
  { width: 300, height: 600, label: 'Half Page', type: 'vertical' },
  { width: 1, height: 1, label: 'Native Card', type: 'native' },
  { width: 1920, height: 1080, label: 'Full Screen', type: 'interstitial' },
  { width: 640, height: 360, label: 'Video Ad', type: 'video' },
];

// Reklam Slot Durumu
export type AdSlotStatus = 
  | 'available'   // Satışa açık
  | 'reserved'    // Rezerve edilmiş
  | 'active'      // Aktif reklam gösteriliyor
  | 'paused'      // Duraklatılmış
  | 'expired'     // Süresi dolmuş
  | 'disabled';   // Devre dışı

// Reklam Slot Tanımı (Kullanıcının tanımladığı alan)
export interface AdSlot {
  id: string;
  ownerId: string;           // Slot sahibi kullanıcı
  ownerName: string;
  
  // Konum ve boyut
  gridPosition: number;      // Grid'de kaçıncı sırada
  gridSpanCol: number;       // Kaç sütun kaplar
  gridSpanRow: number;       // Kaç satır kaplar
  canvasX?: number;          // Canvas modunda X konumu
  canvasY?: number;          // Canvas modunda Y konumu
  width?: number;            // Piksel genişlik
  height?: number;           // Piksel yükseklik
  
  // Slot özellikleri
  type: AdSlotType;
  size: AdSlotSize;
  title: string;
  description?: string;
  
  // Fiyatlandırma
  pricingModel: 'cpm' | 'cpc' | 'cpa' | 'flat';  // CPM, CPC, CPA veya sabit ücret
  pricePerUnit: number;      // Birim fiyat (cent cinsinden)
  currency: 'USD' | 'EUR' | 'TRY';
  minimumBudget: number;     // Minimum bütçe
  
  // Hedefleme
  targetCategories?: string[];   // Hedef kategoriler
  targetAudience?: string[];     // Hedef kitle
  blockedCategories?: string[];  // Yasaklı kategoriler
  blockedAdvertisers?: string[]; // Yasaklı reklamverenler
  
  // Durum
  status: AdSlotStatus;
  isActive: boolean;
  
  // İstatistikler
  stats: {
    totalImpressions: number;
    totalClicks: number;
    totalRevenue: number;
    ctr: number;              // Click-through rate
    avgCpm: number;           // Ortalama CPM
  };
  
  // Tarihler
  createdAt: string;
  updatedAt: string;
  lastFilledAt?: string;      // Son reklam gösterim zamanı
}

// Reklam Kampanyası (Reklamveren tarafından)
export interface AdCampaign {
  id: string;
  advertiserId: string;
  advertiserName: string;
  
  // Kampanya bilgileri
  name: string;
  description?: string;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'rejected';
  
  // Reklam içeriği
  creative: AdCreative;
  
  // Bütçe
  budgetTotal: number;        // Toplam bütçe
  budgetDaily?: number;       // Günlük bütçe limiti
  budgetSpent: number;        // Harcanan bütçe
  
  // Hedefleme
  targetSlotTypes?: AdSlotType[];
  targetCategories?: string[];
  targetLocations?: string[];
  targetDevices?: ('desktop' | 'mobile' | 'tablet')[];
  
  // Zamanlama
  startDate: string;
  endDate?: string;
  scheduledHours?: number[];  // Gösterilecek saatler (0-23)
  scheduledDays?: number[];   // Gösterilecek günler (0-6, Pazar-Cumartesi)
  
  // Performans
  stats: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    spend: number;
  };
  
  // Tarihler
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

// Reklam Kreatifi
export interface AdCreative {
  id: string;
  campaignId: string;
  
  // İçerik tipi
  type: 'image' | 'video' | 'html' | 'native';
  
  // Görsel içerik
  imageUrl?: string;
  videoUrl?: string;
  htmlContent?: string;
  
  // Native reklam alanları
  headline?: string;
  description?: string;
  ctaText?: string;           // Call-to-action metni
  logoUrl?: string;
  sponsorName?: string;
  
  // Hedef URL
  destinationUrl: string;
  trackingPixelUrl?: string;
  
  // Boyut
  width: number;
  height: number;
  
  // Durum
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Reklam Gösterimi
export interface AdImpression {
  id: string;
  slotId: string;
  campaignId: string;
  creativeId: string;
  
  // Kullanıcı bilgileri (anonim)
  viewerId?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userAgent: string;
  ipHash: string;              // IP hash (gizlilik için)
  
  // Konum
  country?: string;
  region?: string;
  city?: string;
  
  // Zaman
  impressionTime: string;
  viewDuration?: number;       // Görüntülenme süresi (ms)
  
  // Etkileşim
  clicked: boolean;
  clickTime?: string;
  converted: boolean;
  conversionTime?: string;
  conversionValue?: number;
  
  // Gelir
  revenueForOwner: number;     // Slot sahibine ödenen
  revenueForPlatform: number;  // Platforma ödenen
}

// Reklam Slot Satın Alma
export interface AdSlotPurchase {
  id: string;
  slotId: string;
  campaignId: string;
  advertiserId: string;
  
  // Satın alma detayları
  purchaseType: 'auction' | 'direct' | 'programmatic';
  bidAmount: number;
  finalPrice: number;
  
  // Süre
  startDate: string;
  endDate: string;
  duration: number;            // Gün cinsinden
  
  // Durum
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'refunded';
  
  // Ödeme
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Reklam Alanı Araç Takımı Ayarları
export interface AdSpaceToolkitSettings {
  userId: string;
  
  // Genel ayarlar
  isEnabled: boolean;
  defaultPricingModel: 'cpm' | 'cpc' | 'cpa' | 'flat';
  defaultPricePerUnit: number;
  defaultCurrency: 'USD' | 'EUR' | 'TRY';
  
  // Otomatik ayarlar
  autoApproveAds: boolean;
  autoFillEmptySlots: boolean;
  fallbackAdUrl?: string;      // Boş slot için varsayılan reklam
  
  // Gelir paylaşımı
  platformFeePercent: number;  // Platform komisyonu (%)
  
  // Bildirimler
  notifyOnNewPurchase: boolean;
  notifyOnLowRevenue: boolean;
  lowRevenueThreshold: number;
  
  // Kara liste
  blockedAdvertisers: string[];
  blockedCategories: string[];
  
  createdAt: string;
  updatedAt: string;
}

// Reklam Gelir Özeti
export interface AdRevenueReport {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year' | 'all';
  startDate: string;
  endDate: string;
  
  // Özet
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgCpm: number;
  avgCpc: number;
  
  // Slot bazlı
  slotBreakdown: {
    slotId: string;
    slotTitle: string;
    revenue: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
  
  // Günlük dağılım
  dailyBreakdown: {
    date: string;
    revenue: number;
    impressions: number;
    clicks: number;
  }[];
  
  // Reklamveren bazlı
  advertiserBreakdown: {
    advertiserId: string;
    advertiserName: string;
    revenue: number;
    impressions: number;
  }[];
  
  generatedAt: string;
}

// Varsayılan reklam slot şablonları
export const DEFAULT_AD_SLOT_TEMPLATES: Partial<AdSlot>[] = [
  {
    type: 'native',
    title: 'Sponsorlu İçerik Kartı',
    description: 'İçerik akışında görünen native reklam kartı',
    pricingModel: 'cpm',
    pricePerUnit: 500,  // $5 CPM
    currency: 'USD',
    minimumBudget: 1000, // $10 minimum
    gridSpanCol: 1,
    gridSpanRow: 1,
  },
  {
    type: 'banner',
    title: 'Üst Banner',
    description: 'Sayfa üstünde yatay banner alanı',
    pricingModel: 'cpm',
    pricePerUnit: 300,  // $3 CPM
    currency: 'USD',
    minimumBudget: 500,
    gridSpanCol: 4,
    gridSpanRow: 1,
  },
  {
    type: 'square',
    title: 'Yan Panel Reklam',
    description: 'Yan panelde kare reklam alanı',
    pricingModel: 'cpc',
    pricePerUnit: 50,   // $0.50 CPC
    currency: 'USD',
    minimumBudget: 500,
    gridSpanCol: 1,
    gridSpanRow: 1,
  },
  {
    type: 'video',
    title: 'Video Reklam Alanı',
    description: 'Video içerik öncesi veya arası reklam',
    pricingModel: 'cpm',
    pricePerUnit: 2000, // $20 CPM
    currency: 'USD',
    minimumBudget: 5000,
    gridSpanCol: 2,
    gridSpanRow: 2,
  },
];

// Reklam kategorileri
export const AD_CATEGORIES = [
  { id: 'tech', label: 'Teknoloji', icon: '💻' },
  { id: 'fashion', label: 'Moda', icon: '👗' },
  { id: 'food', label: 'Yemek & İçecek', icon: '🍕' },
  { id: 'travel', label: 'Seyahat', icon: '✈️' },
  { id: 'finance', label: 'Finans', icon: '💰' },
  { id: 'health', label: 'Sağlık', icon: '🏥' },
  { id: 'education', label: 'Eğitim', icon: '📚' },
  { id: 'entertainment', label: 'Eğlence', icon: '🎮' },
  { id: 'sports', label: 'Spor', icon: '⚽' },
  { id: 'automotive', label: 'Otomotiv', icon: '🚗' },
  { id: 'realestate', label: 'Emlak', icon: '🏠' },
  { id: 'beauty', label: 'Güzellik', icon: '💄' },
  { id: 'business', label: 'İş & Kariyer', icon: '💼' },
  { id: 'other', label: 'Diğer', icon: '📦' },
];
