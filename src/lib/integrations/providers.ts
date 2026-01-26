/**
 * Integration Providers Registry
 * 
 * Desteklenen tüm pazaryerleri, ERP sistemleri, kargo firmaları ve 
 * e-ticaret platformlarının tanımları
 */

import { IntegrationProvider, IntegrationOperation } from './integration-types';

// =====================================================
// PAZARYERI PROVIDERLARI
// =====================================================

export const MARKETPLACE_PROVIDERS: IntegrationProvider[] = [
  {
    id: 'trendyol',
    name: 'Trendyol',
    slug: 'trendyol',
    category: 'marketplace',
    logo: '/integrations/trendyol.svg',
    description: 'Türkiye\'nin en büyük e-ticaret platformu',
    website: 'https://www.trendyol.com',
    
    apiType: 'rest',
    apiVersion: 'v2',
    baseUrl: 'https://api.trendyol.com/sapigw',
    
    features: [
      { id: 'product_sync', name: 'Ürün Senkronizasyonu', description: 'Otomatik ürün aktarımı', enabled: true, premium: false },
      { id: 'stock_sync', name: 'Stok Senkronizasyonu', description: 'Gerçek zamanlı stok güncelleme', enabled: true, premium: false },
      { id: 'order_sync', name: 'Sipariş Senkronizasyonu', description: 'Otomatik sipariş çekme', enabled: true, premium: false },
      { id: 'price_sync', name: 'Fiyat Senkronizasyonu', description: 'Toplu fiyat güncelleme', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'product_create', 'product_update', 'product_sync', 'product_import',
      'stock_update', 'stock_sync',
      'price_update', 'price_sync',
      'order_fetch', 'order_update',
      'shipment_create', 'shipment_track'
    ],
    
    requiredCredentials: [
      { key: 'supplier_id', label: 'Satıcı ID', type: 'text', required: true, placeholder: '123456' },
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
    ],
    
    optionalSettings: [
      { key: 'auto_approve_orders', label: 'Siparişleri Otomatik Onayla', type: 'select', required: false, defaultValue: 'false', options: [{ value: 'true', label: 'Evet' }, { value: 'false', label: 'Hayır' }] },
      { key: 'stock_buffer', label: 'Stok Tamponu', type: 'text', required: false, defaultValue: '0', helpText: 'Güvenlik için düşülecek stok miktarı' },
    ],
    
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerDay: 10000,
    },
    
    webhookSupport: true,
    isTurkish: true,
    supportedRegions: ['TR'],
    docsUrl: 'https://developers.trendyol.com',
  },
  
  {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    slug: 'hepsiburada',
    category: 'marketplace',
    logo: '/integrations/hepsiburada.svg',
    description: 'Türkiye\'nin lider e-ticaret platformu',
    website: 'https://www.hepsiburada.com',
    
    apiType: 'rest',
    apiVersion: 'v1',
    baseUrl: 'https://mpop-sit.hepsiburada.com',
    
    features: [
      { id: 'product_sync', name: 'Ürün Senkronizasyonu', description: 'Otomatik ürün aktarımı', enabled: true, premium: false },
      { id: 'stock_sync', name: 'Stok Senkronizasyonu', description: 'Gerçek zamanlı stok güncelleme', enabled: true, premium: false },
      { id: 'order_sync', name: 'Sipariş Senkronizasyonu', description: 'Otomatik sipariş çekme', enabled: true, premium: false },
      { id: 'category_mapping', name: 'Kategori Eşleştirme', description: 'Otomatik kategori önerisi', enabled: true, premium: true },
    ],
    
    supportedOperations: [
      'product_create', 'product_update', 'product_sync',
      'stock_update', 'stock_sync',
      'price_update',
      'order_fetch', 'order_update',
      'shipment_create', 'shipment_track'
    ],
    
    requiredCredentials: [
      { key: 'merchant_id', label: 'Merchant ID', type: 'text', required: true },
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
    ],
    
    optionalSettings: [],
    
    rateLimits: {
      requestsPerMinute: 30,
      requestsPerHour: 1000,
    },
    
    webhookSupport: true,
    isTurkish: true,
    supportedRegions: ['TR'],
    docsUrl: 'https://developers.hepsiburada.com',
  },
  
  {
    id: 'n11',
    name: 'N11',
    slug: 'n11',
    category: 'marketplace',
    logo: '/integrations/n11.svg',
    description: 'N11 Pazaryeri entegrasyonu',
    website: 'https://www.n11.com',
    
    apiType: 'soap',
    apiVersion: 'v1',
    baseUrl: 'https://api.n11.com/ws',
    
    features: [
      { id: 'product_sync', name: 'Ürün Senkronizasyonu', description: 'Otomatik ürün aktarımı', enabled: true, premium: false },
      { id: 'stock_sync', name: 'Stok Senkronizasyonu', description: 'Stok güncelleme', enabled: true, premium: false },
      { id: 'order_sync', name: 'Sipariş Senkronizasyonu', description: 'Sipariş çekme', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'product_create', 'product_update', 'product_sync',
      'stock_update',
      'price_update',
      'order_fetch', 'order_update'
    ],
    
    requiredCredentials: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
    ],
    
    optionalSettings: [],
    
    rateLimits: {
      requestsPerMinute: 20,
    },
    
    webhookSupport: false,
    isTurkish: true,
    supportedRegions: ['TR'],
    docsUrl: 'https://api.n11.com/docs',
  },
  
  {
    id: 'amazon_tr',
    name: 'Amazon Türkiye',
    slug: 'amazon-tr',
    category: 'marketplace',
    logo: '/integrations/amazon.svg',
    description: 'Amazon Türkiye pazaryeri',
    website: 'https://www.amazon.com.tr',
    
    apiType: 'rest',
    apiVersion: 'SP-API',
    baseUrl: 'https://sellingpartnerapi-eu.amazon.com',
    
    features: [
      { id: 'product_sync', name: 'Ürün Senkronizasyonu', description: 'Ürün yönetimi', enabled: true, premium: false },
      { id: 'fba', name: 'FBA Entegrasyonu', description: 'Fulfillment by Amazon', enabled: true, premium: true },
      { id: 'advertising', name: 'Reklam API', description: 'Sponsored Products', enabled: true, premium: true },
    ],
    
    supportedOperations: [
      'product_create', 'product_update', 'product_sync', 'product_import', 'product_export',
      'stock_update', 'stock_sync',
      'price_update', 'price_sync',
      'order_fetch', 'order_update', 'order_cancel',
      'shipment_create', 'shipment_track'
    ],
    
    requiredCredentials: [
      { key: 'seller_id', label: 'Satıcı ID', type: 'text', required: true },
      { key: 'marketplace_id', label: 'Marketplace ID', type: 'text', required: true, defaultValue: 'A33AVAJ2PDY3EV' },
      { key: 'refresh_token', label: 'Refresh Token', type: 'oauth', required: true },
    ],
    
    optionalSettings: [],
    
    rateLimits: {
      requestsPerMinute: 10,
      burstLimit: 30,
    },
    
    webhookSupport: true,
    isTurkish: true,
    supportedRegions: ['TR', 'EU'],
    docsUrl: 'https://developer-docs.amazon.com/sp-api/',
  },
  
  {
    id: 'ebay',
    name: 'eBay',
    slug: 'ebay',
    category: 'marketplace',
    logo: '/integrations/ebay.svg',
    description: 'Global eBay pazaryeri',
    website: 'https://www.ebay.com',
    
    apiType: 'rest',
    apiVersion: 'v1',
    baseUrl: 'https://api.ebay.com',
    sandboxUrl: 'https://api.sandbox.ebay.com',
    
    features: [
      { id: 'product_sync', name: 'Ürün Senkronizasyonu', description: 'Listing yönetimi', enabled: true, premium: false },
      { id: 'global_shipping', name: 'Global Kargo', description: 'Uluslararası gönderim', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'product_create', 'product_update', 'product_sync',
      'stock_update',
      'price_update',
      'order_fetch', 'order_update'
    ],
    
    requiredCredentials: [
      { key: 'app_id', label: 'App ID', type: 'text', required: true },
      { key: 'dev_id', label: 'Dev ID', type: 'text', required: true },
      { key: 'cert_id', label: 'Cert ID', type: 'password', required: true },
      { key: 'oauth_token', label: 'OAuth Token', type: 'oauth', required: true },
    ],
    
    optionalSettings: [
      { key: 'site_id', label: 'Site ID', type: 'select', required: false, defaultValue: '0', options: [
        { value: '0', label: 'US' },
        { value: '3', label: 'UK' },
        { value: '77', label: 'Germany' },
      ]},
    ],
    
    rateLimits: {
      requestsPerDay: 5000,
    },
    
    webhookSupport: true,
    isTurkish: false,
    supportedRegions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'AU'],
    docsUrl: 'https://developer.ebay.com/docs',
  },
  
  {
    id: 'etsy',
    name: 'Etsy',
    slug: 'etsy',
    category: 'marketplace',
    logo: '/integrations/etsy.svg',
    description: 'El yapımı ve vintage ürünler pazaryeri',
    website: 'https://www.etsy.com',
    
    apiType: 'rest',
    apiVersion: 'v3',
    baseUrl: 'https://openapi.etsy.com/v3',
    
    features: [
      { id: 'product_sync', name: 'Ürün Senkronizasyonu', description: 'Listing yönetimi', enabled: true, premium: false },
      { id: 'variations', name: 'Varyasyon Desteği', description: 'Renk, boyut seçenekleri', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'product_create', 'product_update', 'product_sync',
      'stock_update',
      'order_fetch', 'order_update'
    ],
    
    requiredCredentials: [
      { key: 'keystring', label: 'API Keystring', type: 'password', required: true },
      { key: 'oauth_token', label: 'OAuth Token', type: 'oauth', required: true },
    ],
    
    optionalSettings: [],
    
    rateLimits: {
      requestsPerDay: 10000,
    },
    
    webhookSupport: true,
    isTurkish: false,
    supportedRegions: ['US', 'UK', 'DE', 'FR', 'AU', 'CA'],
    docsUrl: 'https://developers.etsy.com/documentation/',
  },
];

// =====================================================
// ERP & MUHASEBE PROVIDERLARI
// =====================================================

export const ERP_PROVIDERS: IntegrationProvider[] = [
  {
    id: 'parasut',
    name: 'Paraşüt',
    slug: 'parasut',
    category: 'accounting',
    logo: '/integrations/parasut.svg',
    description: 'Online muhasebe ve e-fatura platformu',
    website: 'https://www.parasut.com',
    
    apiType: 'rest',
    apiVersion: 'v4',
    baseUrl: 'https://api.parasut.com/v4',
    
    features: [
      { id: 'invoice', name: 'Fatura Oluşturma', description: 'Otomatik fatura kesimi', enabled: true, premium: false },
      { id: 'einvoice', name: 'E-Fatura', description: 'GİB entegrasyonu', enabled: true, premium: true },
      { id: 'earchive', name: 'E-Arşiv', description: 'E-arşiv fatura', enabled: true, premium: true },
      { id: 'customer_sync', name: 'Müşteri Senkronizasyonu', description: 'Cari hesap yönetimi', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'invoice_create', 'invoice_send', 'invoice_cancel',
      'customer_sync', 'customer_import', 'customer_export'
    ],
    
    requiredCredentials: [
      { key: 'company_id', label: 'Şirket ID', type: 'text', required: true },
      { key: 'client_id', label: 'Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
      { key: 'username', label: 'E-posta', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
    ],
    
    optionalSettings: [
      { key: 'auto_invoice', label: 'Otomatik Fatura', type: 'select', required: false, defaultValue: 'false', options: [{ value: 'true', label: 'Evet' }, { value: 'false', label: 'Hayır' }] },
      { key: 'default_category', label: 'Varsayılan Kategori', type: 'text', required: false },
    ],
    
    rateLimits: {
      requestsPerMinute: 60,
    },
    
    webhookSupport: true,
    isTurkish: true,
    supportedRegions: ['TR'],
    docsUrl: 'https://apidocs.parasut.com/',
  },
  
  {
    id: 'logo',
    name: 'Logo Tiger/Go',
    slug: 'logo',
    category: 'erp',
    logo: '/integrations/logo.svg',
    description: 'Logo ERP sistemleri entegrasyonu',
    website: 'https://www.logo.com.tr',
    
    apiType: 'rest',
    apiVersion: 'v1',
    baseUrl: 'https://api.logo.com.tr',
    
    features: [
      { id: 'stock_sync', name: 'Stok Senkronizasyonu', description: 'Stok kartı aktarımı', enabled: true, premium: false },
      { id: 'order_sync', name: 'Sipariş Aktarımı', description: 'Sipariş irsaliye dönüşümü', enabled: true, premium: false },
      { id: 'invoice', name: 'Fatura Entegrasyonu', description: 'Fatura oluşturma', enabled: true, premium: true },
    ],
    
    supportedOperations: [
      'product_sync', 'product_import', 'product_export',
      'stock_sync',
      'order_fetch',
      'invoice_create', 'customer_sync'
    ],
    
    requiredCredentials: [
      { key: 'host', label: 'Sunucu Adresi', type: 'text', required: true, placeholder: 'logo.firmaadi.com' },
      { key: 'firm_number', label: 'Firma Numarası', type: 'text', required: true },
      { key: 'period', label: 'Dönem', type: 'text', required: true },
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
    ],
    
    optionalSettings: [],
    
    webhookSupport: false,
    isTurkish: true,
    supportedRegions: ['TR'],
    docsUrl: 'https://www.logo.com.tr/developers',
  },
  
  {
    id: 'netsis',
    name: 'Netsis',
    slug: 'netsis',
    category: 'erp',
    logo: '/integrations/netsis.svg',
    description: 'Netsis ERP entegrasyonu',
    website: 'https://www.logo.com.tr/netsis',
    
    apiType: 'soap',
    apiVersion: 'v1',
    baseUrl: '',
    
    features: [
      { id: 'stock_sync', name: 'Stok Senkronizasyonu', description: 'Stok kartı aktarımı', enabled: true, premium: false },
      { id: 'order_sync', name: 'Sipariş Aktarımı', description: 'Sipariş yönetimi', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'product_sync', 'product_import',
      'stock_sync',
      'order_fetch',
      'customer_sync'
    ],
    
    requiredCredentials: [
      { key: 'host', label: 'Sunucu Adresi', type: 'text', required: true },
      { key: 'database', label: 'Veritabanı Adı', type: 'text', required: true },
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
    ],
    
    optionalSettings: [],
    
    webhookSupport: false,
    isTurkish: true,
    supportedRegions: ['TR'],
    docsUrl: 'https://www.logo.com.tr/netsis',
  },
];

// =====================================================
// KARGO PROVIDERLARI
// =====================================================

export const SHIPPING_PROVIDERS: IntegrationProvider[] = [
  {
    id: 'yurtici_kargo',
    name: 'Yurtiçi Kargo',
    slug: 'yurtici-kargo',
    category: 'shipping',
    logo: '/integrations/yurtici.svg',
    description: 'Yurtiçi Kargo API entegrasyonu',
    website: 'https://www.yurticikargo.com',
    
    apiType: 'soap',
    apiVersion: 'v1',
    baseUrl: 'https://ws.yurticikargo.com/KOPSWebServices',
    
    features: [
      { id: 'shipment_create', name: 'Gönderi Oluşturma', description: 'Otomatik gönderi kaydı', enabled: true, premium: false },
      { id: 'tracking', name: 'Takip', description: 'Gerçek zamanlı takip', enabled: true, premium: false },
      { id: 'label', name: 'Etiket Basımı', description: 'Kargo etiketi oluşturma', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'shipment_create', 'shipment_track', 'shipment_cancel', 'label_generate'
    ],
    
    requiredCredentials: [
      { key: 'username', label: 'Kullanıcı Kodu', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
      { key: 'customer_code', label: 'Müşteri Kodu', type: 'text', required: true },
    ],
    
    optionalSettings: [
      { key: 'default_payment', label: 'Varsayılan Ödeme', type: 'select', required: false, defaultValue: 'sender', options: [
        { value: 'sender', label: 'Gönderici Ödemeli' },
        { value: 'receiver', label: 'Alıcı Ödemeli' },
      ]},
    ],
    
    webhookSupport: true,
    isTurkish: true,
    supportedRegions: ['TR'],
    docsUrl: 'https://www.yurticikargo.com/tr/kurumsal/entegrasyon',
  },
  
  {
    id: 'aras_kargo',
    name: 'Aras Kargo',
    slug: 'aras-kargo',
    category: 'shipping',
    logo: '/integrations/aras.svg',
    description: 'Aras Kargo API entegrasyonu',
    website: 'https://www.araskargo.com.tr',
    
    apiType: 'rest',
    apiVersion: 'v1',
    baseUrl: 'https://customerservices.araskargo.com.tr/ArasCargoIntegrationService/ArasCargoIntegrationService.svc',
    
    features: [
      { id: 'shipment_create', name: 'Gönderi Oluşturma', description: 'Otomatik gönderi kaydı', enabled: true, premium: false },
      { id: 'tracking', name: 'Takip', description: 'Kargo takip', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'shipment_create', 'shipment_track', 'shipment_cancel', 'label_generate'
    ],
    
    requiredCredentials: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
      { key: 'customer_code', label: 'Müşteri Kodu', type: 'text', required: true },
    ],
    
    optionalSettings: [],
    
    webhookSupport: false,
    isTurkish: true,
    supportedRegions: ['TR'],
    docsUrl: 'https://www.araskargo.com.tr/entegrasyon',
  },
  
  {
    id: 'mng_kargo',
    name: 'MNG Kargo',
    slug: 'mng-kargo',
    category: 'shipping',
    logo: '/integrations/mng.svg',
    description: 'MNG Kargo API entegrasyonu',
    website: 'https://www.mngkargo.com.tr',
    
    apiType: 'rest',
    apiVersion: 'v1',
    baseUrl: 'https://service.mngkargo.com.tr/mloginws/service.svc',
    
    features: [
      { id: 'shipment_create', name: 'Gönderi Oluşturma', description: 'Otomatik gönderi kaydı', enabled: true, premium: false },
      { id: 'tracking', name: 'Takip', description: 'Kargo takip', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'shipment_create', 'shipment_track', 'label_generate'
    ],
    
    requiredCredentials: [
      { key: 'customer_number', label: 'Müşteri Numarası', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
    ],
    
    optionalSettings: [],
    
    webhookSupport: false,
    isTurkish: true,
    supportedRegions: ['TR'],
    docsUrl: 'https://www.mngkargo.com.tr/entegrasyon',
  },
  
  {
    id: 'ups',
    name: 'UPS',
    slug: 'ups',
    category: 'shipping',
    logo: '/integrations/ups.svg',
    description: 'UPS global kargo entegrasyonu',
    website: 'https://www.ups.com',
    
    apiType: 'rest',
    apiVersion: 'v1',
    baseUrl: 'https://onlinetools.ups.com/api',
    sandboxUrl: 'https://wwwcie.ups.com/api',
    
    features: [
      { id: 'shipment_create', name: 'Gönderi Oluşturma', description: 'Uluslararası gönderi', enabled: true, premium: false },
      { id: 'tracking', name: 'Takip', description: 'Global takip', enabled: true, premium: false },
      { id: 'rates', name: 'Fiyat Sorgulama', description: 'Anlık fiyat hesaplama', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'shipment_create', 'shipment_track', 'shipment_cancel', 'label_generate'
    ],
    
    requiredCredentials: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
      { key: 'access_key', label: 'Access Key', type: 'password', required: true },
      { key: 'account_number', label: 'Hesap Numarası', type: 'text', required: true },
    ],
    
    optionalSettings: [],
    
    rateLimits: {
      requestsPerMinute: 30,
    },
    
    webhookSupport: true,
    isTurkish: false,
    supportedRegions: ['US', 'EU', 'TR', 'GLOBAL'],
    docsUrl: 'https://developer.ups.com/',
  },
  
  {
    id: 'dhl',
    name: 'DHL Express',
    slug: 'dhl',
    category: 'shipping',
    logo: '/integrations/dhl.svg',
    description: 'DHL Express global kargo',
    website: 'https://www.dhl.com',
    
    apiType: 'rest',
    apiVersion: 'v2',
    baseUrl: 'https://express.api.dhl.com/mydhlapi',
    sandboxUrl: 'https://express.api.dhl.com/mydhlapi/test',
    
    features: [
      { id: 'shipment_create', name: 'Gönderi Oluşturma', description: 'Express gönderi', enabled: true, premium: false },
      { id: 'tracking', name: 'Takip', description: 'Global takip', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'shipment_create', 'shipment_track', 'label_generate'
    ],
    
    requiredCredentials: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
      { key: 'account_number', label: 'Hesap Numarası', type: 'text', required: true },
    ],
    
    optionalSettings: [],
    
    webhookSupport: true,
    isTurkish: false,
    supportedRegions: ['GLOBAL'],
    docsUrl: 'https://developer.dhl.com/',
  },
];

// =====================================================
// E-TİCARET PLATFORM PROVIDERLARI
// =====================================================

export const ECOMMERCE_PROVIDERS: IntegrationProvider[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    slug: 'shopify',
    category: 'ecommerce',
    logo: '/integrations/shopify.svg',
    description: 'Shopify mağaza senkronizasyonu',
    website: 'https://www.shopify.com',
    
    apiType: 'graphql',
    apiVersion: '2024-01',
    baseUrl: 'https://{shop}.myshopify.com/admin/api',
    
    features: [
      { id: 'product_sync', name: 'Ürün Senkronizasyonu', description: 'İki yönlü ürün aktarımı', enabled: true, premium: false },
      { id: 'order_sync', name: 'Sipariş Senkronizasyonu', description: 'Otomatik sipariş çekme', enabled: true, premium: false },
      { id: 'inventory_sync', name: 'Stok Senkronizasyonu', description: 'Anlık stok güncelleme', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'product_create', 'product_update', 'product_delete', 'product_sync', 'product_import', 'product_export',
      'stock_update', 'stock_sync',
      'price_update', 'price_sync',
      'order_fetch', 'order_update',
      'customer_sync', 'customer_import', 'customer_export'
    ],
    
    requiredCredentials: [
      { key: 'shop_name', label: 'Mağaza Adı', type: 'text', required: true, placeholder: 'magaza-adi' },
      { key: 'access_token', label: 'Access Token', type: 'oauth', required: true },
    ],
    
    optionalSettings: [
      { key: 'location_id', label: 'Lokasyon ID', type: 'text', required: false, helpText: 'Stok lokasyonu' },
    ],
    
    rateLimits: {
      requestsPerMinute: 40,
      burstLimit: 80,
    },
    
    webhookSupport: true,
    isTurkish: false,
    supportedRegions: ['GLOBAL'],
    docsUrl: 'https://shopify.dev/docs/api',
  },
  
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    slug: 'woocommerce',
    category: 'ecommerce',
    logo: '/integrations/woocommerce.svg',
    description: 'WooCommerce mağaza senkronizasyonu',
    website: 'https://woocommerce.com',
    
    apiType: 'rest',
    apiVersion: 'wc/v3',
    baseUrl: '',
    
    features: [
      { id: 'product_sync', name: 'Ürün Senkronizasyonu', description: 'İki yönlü ürün aktarımı', enabled: true, premium: false },
      { id: 'order_sync', name: 'Sipariş Senkronizasyonu', description: 'Otomatik sipariş çekme', enabled: true, premium: false },
      { id: 'stock_sync', name: 'Stok Senkronizasyonu', description: 'Stok güncelleme', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'product_create', 'product_update', 'product_delete', 'product_sync', 'product_import', 'product_export',
      'stock_update', 'stock_sync',
      'price_update',
      'order_fetch', 'order_update',
      'customer_sync', 'customer_import'
    ],
    
    requiredCredentials: [
      { key: 'site_url', label: 'Site URL', type: 'text', required: true, placeholder: 'https://magaza.com' },
      { key: 'consumer_key', label: 'Consumer Key', type: 'password', required: true },
      { key: 'consumer_secret', label: 'Consumer Secret', type: 'password', required: true },
    ],
    
    optionalSettings: [],
    
    webhookSupport: true,
    isTurkish: false,
    supportedRegions: ['GLOBAL'],
    docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
  },
  
  {
    id: 'magento',
    name: 'Magento / Adobe Commerce',
    slug: 'magento',
    category: 'ecommerce',
    logo: '/integrations/magento.svg',
    description: 'Magento 2 entegrasyonu',
    website: 'https://magento.com',
    
    apiType: 'rest',
    apiVersion: 'V1',
    baseUrl: '',
    
    features: [
      { id: 'product_sync', name: 'Ürün Senkronizasyonu', description: 'Ürün aktarımı', enabled: true, premium: false },
      { id: 'order_sync', name: 'Sipariş Senkronizasyonu', description: 'Sipariş çekme', enabled: true, premium: false },
    ],
    
    supportedOperations: [
      'product_create', 'product_update', 'product_sync', 'product_import',
      'stock_update', 'stock_sync',
      'order_fetch', 'order_update',
      'customer_sync'
    ],
    
    requiredCredentials: [
      { key: 'base_url', label: 'Base URL', type: 'text', required: true },
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
    ],
    
    optionalSettings: [],
    
    webhookSupport: true,
    isTurkish: false,
    supportedRegions: ['GLOBAL'],
    docsUrl: 'https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html',
  },
];

// =====================================================
// TÜM PROVIDERLAR
// =====================================================

export const ALL_PROVIDERS: IntegrationProvider[] = [
  ...MARKETPLACE_PROVIDERS,
  ...ERP_PROVIDERS,
  ...SHIPPING_PROVIDERS,
  ...ECOMMERCE_PROVIDERS,
];

// Helper functions
export function getProviderById(id: string): IntegrationProvider | undefined {
  return ALL_PROVIDERS.find(p => p.id === id);
}

export function getProvidersByCategory(category: IntegrationProvider['category']): IntegrationProvider[] {
  return ALL_PROVIDERS.filter(p => p.category === category);
}

export function getTurkishProviders(): IntegrationProvider[] {
  return ALL_PROVIDERS.filter(p => p.isTurkish);
}

export function getProvidersByOperation(operation: IntegrationOperation): IntegrationProvider[] {
  return ALL_PROVIDERS.filter(p => p.supportedOperations.includes(operation));
}
