/**
 * Enterprise E-Commerce Integration Types
 * 
 * Orta-büyük işletmeler için kapsamlı entegrasyon sistemi
 * Pazaryerleri, ERP, Muhasebe, Kargo ve E-ticaret platformları
 */

// =====================================================
// TEMEL ENTEGRASYON TİPLERİ
// =====================================================

export type IntegrationCategory = 
  | 'marketplace'       // Pazaryerleri (Trendyol, Hepsiburada, N11, Amazon)
  | 'erp'              // ERP sistemleri (SAP, Logo, Netsis)
  | 'accounting'       // Muhasebe (Parasut, Luca, Mikro)
  | 'ecommerce'        // E-ticaret platformları (Shopify, WooCommerce)
  | 'shipping'         // Kargo (Yurtiçi, Aras, MNG, UPS)
  | 'payment'          // Ödeme (iyzico, PayTR, Stripe)
  | 'inventory'        // Stok yönetimi
  | 'crm'              // Müşteri ilişkileri
  | 'analytics';       // Analitik & Raporlama

export type IntegrationStatus = 
  | 'active'           // Aktif bağlantı
  | 'inactive'         // Pasif
  | 'pending'          // Beklemede (onay gerekli)
  | 'error'            // Hata durumunda
  | 'expired'          // Süresi dolmuş
  | 'rate_limited';    // API limit aşımı

export type SyncDirection = 
  | 'push'             // Sadece gönder
  | 'pull'             // Sadece çek
  | 'bidirectional';   // İki yönlü

export type SyncFrequency = 
  | 'realtime'         // Anlık
  | 'hourly'           // Saatlik
  | 'daily'            // Günlük
  | 'weekly'           // Haftalık
  | 'manual';          // Manuel

// =====================================================
// ENTEGRASYON TANIMI
// =====================================================

export interface IntegrationProvider {
  id: string;
  name: string;
  slug: string;
  category: IntegrationCategory;
  logo: string;
  description: string;
  website: string;
  
  // API bilgileri
  apiType: 'rest' | 'soap' | 'graphql' | 'webhook';
  apiVersion: string;
  baseUrl: string;
  sandboxUrl?: string;
  
  // Özellikler
  features: IntegrationFeature[];
  supportedOperations: IntegrationOperation[];
  
  // Konfigürasyon gereksinimleri
  requiredCredentials: CredentialField[];
  optionalSettings: SettingField[];
  
  // Sınırlamalar
  rateLimits?: RateLimitConfig;
  webhookSupport: boolean;
  
  // Türkiye özel
  isTurkish: boolean;
  supportedRegions: string[];
  
  // Dökümentasyon
  docsUrl: string;
  supportEmail?: string;
}

export interface IntegrationFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  premium: boolean;
}

export type IntegrationOperation = 
  // Ürün işlemleri
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'product_sync'
  | 'product_import'
  | 'product_export'
  
  // Stok işlemleri
  | 'stock_update'
  | 'stock_sync'
  | 'stock_reserve'
  | 'stock_transfer'
  
  // Fiyat işlemleri
  | 'price_update'
  | 'price_sync'
  | 'price_rules'
  
  // Sipariş işlemleri
  | 'order_fetch'
  | 'order_update'
  | 'order_cancel'
  | 'order_refund'
  
  // Kargo işlemleri
  | 'shipment_create'
  | 'shipment_track'
  | 'shipment_cancel'
  | 'label_generate'
  
  // Fatura işlemleri
  | 'invoice_create'
  | 'invoice_send'
  | 'invoice_cancel'
  
  // Müşteri işlemleri
  | 'customer_sync'
  | 'customer_import'
  | 'customer_export';

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'oauth';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface SettingField extends CredentialField {
  defaultValue?: any;
  category?: string;
}

export interface RateLimitConfig {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
}

// =====================================================
// ENTEGRASYON BAĞLANTISI
// =====================================================

export interface IntegrationConnection {
  id: string;
  userId: string;
  providerId: string;
  providerName: string;
  category: IntegrationCategory;
  
  // Durum
  status: IntegrationStatus;
  lastSync?: string;
  nextSync?: string;
  
  // Kimlik bilgileri (şifreli)
  credentials: Record<string, string>;
  settings: Record<string, any>;
  
  // Senkronizasyon ayarları
  syncDirection: SyncDirection;
  syncFrequency: SyncFrequency;
  syncEnabled: boolean;
  
  // İstatistikler
  stats: IntegrationStats;
  
  // Hata takibi
  lastError?: IntegrationError;
  errorCount: number;
  
  // Audit
  createdAt: string;
  updatedAt: string;
  lastHealthCheck?: string;
}

export interface IntegrationStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  itemsSynced: number;
  lastSyncDuration?: number;
  averageSyncDuration?: number;
}

export interface IntegrationError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  retryable: boolean;
}

// =====================================================
// PAZARYERI ENTEGRASYONLARİ
// =====================================================

export interface MarketplaceIntegration extends IntegrationConnection {
  category: 'marketplace';
  
  // Mağaza bilgileri
  storeId: string;
  storeName: string;
  storeUrl?: string;
  
  // Kategori eşleştirme
  categoryMappings: CategoryMapping[];
  
  // Komisyon oranları
  commissionRates: CommissionRate[];
  
  // Listeleme ayarları
  listingDefaults: ListingDefaults;
  
  // Sipariş ayarları
  orderSettings: MarketplaceOrderSettings;
}

export interface CategoryMapping {
  localCategoryId: string;
  localCategoryName: string;
  remoteCategoryId: string;
  remoteCategoryName: string;
  attributeMappings: AttributeMapping[];
}

export interface AttributeMapping {
  localAttribute: string;
  remoteAttribute: string;
  valueMapping?: Record<string, string>;
  required: boolean;
}

export interface CommissionRate {
  categoryId: string;
  categoryName: string;
  rate: number;
  minFee?: number;
  maxFee?: number;
}

export interface ListingDefaults {
  defaultWarehouse?: string;
  defaultShippingTemplate?: string;
  autoPublish: boolean;
  stockBuffer: number;
  priceMarkup: number;
  priceRoundingRule: 'none' | 'up' | 'down' | 'nearest';
}

export interface MarketplaceOrderSettings {
  autoAccept: boolean;
  autoFulfill: boolean;
  syncInterval: number;
  invoiceGeneration: 'auto' | 'manual' | 'none';
}

// =====================================================
// ERP & MUHASEBE ENTEGRASYONLARİ
// =====================================================

export interface ERPIntegration extends IntegrationConnection {
  category: 'erp' | 'accounting';
  
  // Firma bilgileri
  companyCode?: string;
  branchCode?: string;
  
  // Hesap eşleştirmeleri
  accountMappings: AccountMapping[];
  
  // Belge ayarları
  documentSettings: DocumentSettings;
  
  // Vergi ayarları
  taxSettings: TaxSettings;
}

export interface AccountMapping {
  type: 'revenue' | 'expense' | 'asset' | 'liability' | 'bank';
  localCode: string;
  remoteCode: string;
  description: string;
}

export interface DocumentSettings {
  invoicePrefix: string;
  invoiceNumbering: 'auto' | 'manual';
  defaultCurrency: string;
  defaultLanguage: string;
  digitalSignature: boolean;
  eInvoiceEnabled: boolean;
  eArchiveEnabled: boolean;
}

export interface TaxSettings {
  defaultTaxRate: number;
  taxRoundingRule: 'up' | 'down' | 'nearest';
  taxIncluded: boolean;
  withholdingEnabled: boolean;
}

// =====================================================
// KARGO ENTEGRASYONLARİ
// =====================================================

export interface ShippingIntegration extends IntegrationConnection {
  category: 'shipping';
  
  // Gönderici bilgileri
  senderInfo: SenderInfo;
  
  // Varsayılan ayarlar
  defaultSettings: ShippingDefaults;
  
  // Fiyat kuralları
  pricingRules: ShippingPricingRule[];
  
  // Bölge ayarları
  zoneConfigs: ShippingZoneConfig[];
}

export interface SenderInfo {
  name: string;
  phone: string;
  email: string;
  address: Address;
  taxId?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ShippingDefaults {
  packageType: 'box' | 'envelope' | 'pallet' | 'custom';
  defaultWeight: number;
  defaultDimensions: {
    length: number;
    width: number;
    height: number;
  };
  insurance: boolean;
  signature: boolean;
  deliveryConfirmation: boolean;
}

export interface ShippingPricingRule {
  id: string;
  name: string;
  conditions: PricingCondition[];
  action: 'fixed' | 'percent' | 'free';
  value: number;
  priority: number;
}

export interface PricingCondition {
  field: 'weight' | 'total' | 'quantity' | 'zone' | 'category';
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin';
  value: any;
}

export interface ShippingZoneConfig {
  zoneId: string;
  zoneName: string;
  regions: string[];
  deliveryDays: { min: number; max: number };
  enabled: boolean;
}

// =====================================================
// STOK & DEPO YÖNETİMİ
// =====================================================

export interface Warehouse {
  id: string;
  userId: string;
  name: string;
  code: string;
  type: 'main' | 'secondary' | 'dropship' | 'fba' | 'virtual';
  
  // Adres
  address: Address;
  
  // İletişim
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  
  // Ayarlar
  settings: WarehouseSettings;
  
  // Entegrasyon
  integrationId?: string;
  externalId?: string;
  
  // Durum
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseSettings {
  autoReplenish: boolean;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  leadTimeDays: number;
  acceptReturns: boolean;
  processOrders: boolean;
}

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  productId: string;
  sku: string;
  
  // Stok miktarları
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  damagedQuantity: number;
  
  // Lokasyon
  location?: {
    aisle: string;
    rack: string;
    shelf: string;
    bin: string;
  };
  
  // Maliyet
  unitCost: number;
  totalValue: number;
  
  // Takip
  batchNumber?: string;
  expirationDate?: string;
  receivedDate: string;
  
  // Audit
  lastCountDate?: string;
  lastMovementDate: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment' | 'return' | 'damage';
  
  productId: string;
  sku: string;
  
  fromWarehouseId?: string;
  toWarehouseId?: string;
  
  quantity: number;
  unitCost?: number;
  
  // Kaynak bilgisi
  sourceType: 'order' | 'purchase' | 'manual' | 'sync' | 'return' | 'count';
  sourceId?: string;
  
  // Detaylar
  reason?: string;
  notes?: string;
  
  // Kullanıcı
  performedBy: string;
  approvedBy?: string;
  
  // Zaman
  createdAt: string;
  effectiveDate: string;
}

// =====================================================
// B2B & BAYİLİK SİSTEMİ
// =====================================================

export interface B2BCustomer {
  id: string;
  userId: string;
  companyName: string;
  taxId: string;
  taxOffice: string;
  
  // Segment
  customerType: 'dealer' | 'wholesaler' | 'retailer' | 'distributor' | 'agent';
  segment: 'bronze' | 'silver' | 'gold' | 'platinum' | 'vip';
  
  // İletişim
  contactPerson: {
    name: string;
    title: string;
    phone: string;
    email: string;
  };
  
  // Adresler
  billingAddress: Address;
  shippingAddresses: Address[];
  
  // Finansal
  creditLimit: number;
  currentBalance: number;
  paymentTerms: number; // gün
  discountRate: number; // yüzde
  
  // Özel fiyat listesi
  priceListId?: string;
  
  // Durum
  isApproved: boolean;
  isActive: boolean;
  
  // Satış temsilcisi
  salesRepId?: string;
  
  // Audit
  createdAt: string;
  updatedAt: string;
  lastOrderDate?: string;
}

export interface PriceList {
  id: string;
  userId: string;
  name: string;
  code: string;
  description?: string;
  
  // Tip
  type: 'retail' | 'wholesale' | 'dealer' | 'special';
  currency: string;
  
  // Geçerlilik
  validFrom: string;
  validUntil?: string;
  
  // Kurallar
  baseMultiplier: number;
  rules: PriceRule[];
  
  // Segment atamaları
  customerSegments: string[];
  
  // Durum
  isActive: boolean;
  priority: number;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

export interface PriceRule {
  id: string;
  type: 'category' | 'product' | 'brand' | 'quantity' | 'total';
  targetId?: string;
  
  // Koşullar
  minQuantity?: number;
  maxQuantity?: number;
  minTotal?: number;
  
  // Fiyatlandırma
  discountType: 'percent' | 'fixed' | 'price_override';
  discountValue: number;
  
  priority: number;
}

// =====================================================
// SİPARİŞ YÖNETİMİ (OMNICHANNEL)
// =====================================================

export interface UnifiedOrder {
  id: string;
  userId: string;
  orderNumber: string;
  
  // Kaynak
  source: 'website' | 'marketplace' | 'b2b' | 'pos' | 'phone' | 'api';
  sourceId?: string;
  sourceName?: string;
  externalOrderId?: string;
  
  // Müşteri
  customer: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    isB2B: boolean;
    b2bCustomerId?: string;
  };
  
  // Adresler
  billingAddress: Address;
  shippingAddress: Address;
  
  // Ürünler
  items: OrderItem[];
  
  // Tutarlar
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  
  // Ödeme
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded' | 'failed';
  paymentMethod?: string;
  paymentDetails?: Record<string, any>;
  
  // Sipariş durumu
  status: OrderStatus;
  statusHistory: OrderStatusChange[];
  
  // Kargo
  shipments: Shipment[];
  
  // Fatura
  invoices: Invoice[];
  
  // Notlar
  customerNote?: string;
  internalNote?: string;
  
  // Depo
  warehouseId?: string;
  
  // Tarihler
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  
  // Stok
  warehouseId?: string;
  reservedStock: boolean;
  
  // Fulfillment
  fulfilledQuantity: number;
  returnedQuantity: number;
}

export interface OrderStatusChange {
  status: OrderStatus;
  timestamp: string;
  changedBy: string;
  note?: string;
  source: 'manual' | 'auto' | 'webhook';
}

export interface Shipment {
  id: string;
  orderId: string;
  carrierId: string;
  carrierName: string;
  
  trackingNumber: string;
  trackingUrl?: string;
  
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  
  items: { orderItemId: string; quantity: number }[];
  
  labelUrl?: string;
  
  shippedAt?: string;
  deliveredAt?: string;
  
  events: ShipmentEvent[];
}

export interface ShipmentEvent {
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  type: 'invoice' | 'credit_note' | 'proforma';
  
  status: 'draft' | 'issued' | 'sent' | 'paid' | 'cancelled';
  
  // Tutarlar
  subtotal: number;
  tax: number;
  total: number;
  
  // E-fatura
  eInvoiceId?: string;
  eInvoiceUUID?: string;
  eInvoiceStatus?: string;
  
  // Dosyalar
  pdfUrl?: string;
  xmlUrl?: string;
  
  issuedAt: string;
  dueDate?: string;
  paidAt?: string;
}

// =====================================================
// SENKRONIZASYON LOG
// =====================================================

export interface SyncLog {
  id: string;
  integrationId: string;
  operation: IntegrationOperation;
  direction: SyncDirection;
  
  status: 'started' | 'completed' | 'failed' | 'partial';
  
  // İstatistikler
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  
  // Detaylar
  details: SyncLogDetail[];
  errors: SyncLogError[];
  
  // Süre
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

export interface SyncLogDetail {
  itemId: string;
  itemType: string;
  action: 'create' | 'update' | 'delete' | 'skip';
  status: 'success' | 'failed' | 'skipped';
  message?: string;
}

export interface SyncLogError {
  itemId?: string;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// =====================================================
// WEBHOOK YÖNETİMİ
// =====================================================

export interface WebhookEndpoint {
  id: string;
  userId: string;
  integrationId?: string;
  
  name: string;
  url: string;
  secret: string;
  
  events: string[];
  
  isActive: boolean;
  
  // Güvenlik
  headers?: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };
  
  // İstatistikler
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  lastDeliveryAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: string;
  
  payload: any;
  
  status: 'pending' | 'delivered' | 'failed';
  
  // Response
  responseCode?: number;
  responseBody?: string;
  
  // Retry
  attempt: number;
  nextRetryAt?: string;
  
  deliveredAt?: string;
  createdAt: string;
}
