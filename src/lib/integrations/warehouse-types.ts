/**
 * Warehouse Management Types & System
 * 
 * Çoklu depo yönetimi, stok takibi ve transfer işlemleri
 */

// =====================================================
// DEPO TİPLERİ
// =====================================================

export type WarehouseType = 
  | 'main'           // Ana depo
  | 'fulfillment'    // Sipariş karşılama merkezi
  | 'retail'         // Mağaza deposu
  | 'dropship'       // Dropship deposu
  | 'consignment'    // Konsinye depo
  | 'virtual'        // Sanal depo (marketplace stoku)
  | 'return';        // İade deposu

export type WarehouseStatus = 'active' | 'inactive' | 'maintenance' | 'closed';

export type StockType = 
  | 'available'      // Satışa hazır
  | 'reserved'       // Rezerve edilmiş
  | 'damaged'        // Hasarlı
  | 'in_transit'     // Transfer halinde
  | 'quarantine'     // Karantinada
  | 'expired';       // Son kullanma tarihi geçmiş

// =====================================================
// DEPO TANIMLARI
// =====================================================

export interface Warehouse {
  id: string;
  userId: string;
  
  // Temel bilgiler
  name: string;
  code: string; // Kısa kod (örn: IST-01)
  type: WarehouseType;
  status: WarehouseStatus;
  
  // Adres
  address: {
    street: string;
    district: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // İletişim
  contact: {
    name: string;
    phone: string;
    email: string;
    alternatePhone?: string;
  };
  
  // Kapasite ve özellikler
  capacity: {
    totalSlots: number;
    usedSlots: number;
    totalArea: number; // m²
    usedArea: number;
    maxWeight: number; // kg
    currentWeight: number;
  };
  
  features: {
    hasClimateControl: boolean;
    hasColdStorage: boolean;
    hasHazmatStorage: boolean;
    hasFragileSection: boolean;
    hasOversizeSection: boolean;
    maxPalletHeight: number; // cm
  };
  
  // Çalışma saatleri
  operatingHours: {
    monday: { open: string; close: string } | null;
    tuesday: { open: string; close: string } | null;
    wednesday: { open: string; close: string } | null;
    thursday: { open: string; close: string } | null;
    friday: { open: string; close: string } | null;
    saturday: { open: string; close: string } | null;
    sunday: { open: string; close: string } | null;
  };
  
  // Entegrasyon
  integrations: {
    erpWarehouseId?: string;
    marketplaceIds: Record<string, string>; // providerId -> warehouseId
    shippingZoneId?: string;
  };
  
  // Öncelik ve kurallar
  priority: number; // Sipariş karşılama önceliği
  rules: {
    autoReplenish: boolean;
    minStockLevel: number;
    maxStockLevel: number;
    defaultForCategories: string[];
    excludedCategories: string[];
    preferredShippingProviders: string[];
  };
  
  // İstatistikler
  stats: {
    totalProducts: number;
    totalItems: number;
    inboundToday: number;
    outboundToday: number;
    pendingTransfers: number;
    lowStockAlerts: number;
  };
  
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// STOK YÖNETİMİ
// =====================================================

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  productId: string;
  variantId?: string;
  sku: string;
  barcode?: string;
  
  // Stok miktarları
  quantities: {
    available: number;
    reserved: number;
    damaged: number;
    inTransit: number;
    quarantine: number;
    total: number;
  };
  
  // Lokasyon bilgisi
  locations: StockLocation[];
  
  // Lot/Parti takibi
  lots: StockLot[];
  
  // Seviyeler
  levels: {
    reorderPoint: number;
    safetyStock: number;
    maxStock: number;
    economicOrderQty: number;
  };
  
  // Maliyet
  cost: {
    unitCost: number;
    totalValue: number;
    currency: string;
    lastPurchasePrice: number;
    averageCost: number;
    costingMethod: 'fifo' | 'lifo' | 'average' | 'specific';
  };
  
  // Son işlemler
  lastInbound: string;
  lastOutbound: string;
  lastStockTake: string;
  
  // Uyarılar
  alerts: {
    lowStock: boolean;
    overStock: boolean;
    expiringSoon: boolean;
    noMovement: boolean; // 30 gündür hareket yok
  };
  
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface StockLocation {
  id: string;
  zone: string;       // Bölge (A, B, C)
  aisle: string;      // Koridor (01, 02, 03)
  rack: string;       // Raf (01, 02)
  shelf: string;      // Kat (A, B, C)
  bin: string;        // Kutu/Bölme
  fullCode: string;   // Örn: A-01-02-B-03
  
  quantity: number;
  lotId?: string;
  isPrimary: boolean;
}

export interface StockLot {
  id: string;
  lotNumber: string;
  batchNumber?: string;
  
  quantity: number;
  originalQuantity: number;
  
  manufacturingDate?: string;
  expiryDate?: string;
  receiptDate: string;
  
  supplier?: {
    id: string;
    name: string;
    purchaseOrderId?: string;
  };
  
  cost: {
    unitCost: number;
    currency: string;
  };
  
  status: 'active' | 'quarantine' | 'expired' | 'depleted';
  metadata: Record<string, any>;
}

// =====================================================
// STOK HAREKETLERİ
// =====================================================

export type MovementType = 
  | 'inbound'         // Giriş
  | 'outbound'        // Çıkış
  | 'transfer'        // Depolar arası transfer
  | 'adjustment'      // Düzeltme
  | 'return'          // İade
  | 'damage'          // Hasar
  | 'stock_take'      // Sayım
  | 'reserved'        // Rezervasyon
  | 'unreserved';     // Rezervasyon iptali

export type MovementReason = 
  | 'purchase'        // Satın alma
  | 'sale'            // Satış
  | 'return_customer' // Müşteri iadesi
  | 'return_supplier' // Tedarikçi iadesi
  | 'damage'          // Hasar
  | 'loss'            // Kayıp
  | 'theft'           // Hırsızlık
  | 'production'      // Üretim
  | 'consumption'     // Tüketim
  | 'expiry'          // Son kullanma
  | 'correction'      // Düzeltme
  | 'transfer'        // Transfer
  | 'reallocation';   // Yeniden tahsis

export interface StockMovement {
  id: string;
  userId: string;
  
  type: MovementType;
  reason: MovementReason;
  
  // Kaynak
  source: {
    warehouseId: string;
    warehouseName: string;
    locationCode?: string;
    lotId?: string;
  };
  
  // Hedef (transfer için)
  destination?: {
    warehouseId: string;
    warehouseName: string;
    locationCode?: string;
  };
  
  // Ürün bilgisi
  product: {
    productId: string;
    variantId?: string;
    sku: string;
    name: string;
    barcode?: string;
  };
  
  // Miktar
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  
  // Maliyet
  unitCost?: number;
  totalCost?: number;
  currency?: string;
  
  // Referans
  reference: {
    type: 'order' | 'purchase_order' | 'transfer_order' | 'manual' | 'adjustment';
    id?: string;
    number?: string;
  };
  
  // Belge
  documents: {
    type: string;
    url: string;
  }[];
  
  notes?: string;
  performedBy: string;
  performedByName: string;
  
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  
  metadata: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

// =====================================================
// TRANSFER İŞLEMLERİ
// =====================================================

export interface TransferOrder {
  id: string;
  userId: string;
  
  orderNumber: string;
  
  // Kaynak ve hedef
  sourceWarehouse: {
    id: string;
    name: string;
    code: string;
  };
  destinationWarehouse: {
    id: string;
    name: string;
    code: string;
  };
  
  // Öğeler
  items: TransferItem[];
  
  // Durum
  status: 'draft' | 'pending' | 'approved' | 'in_transit' | 'partial' | 'completed' | 'cancelled';
  
  // Tarihler
  requestedDate: string;
  expectedArrival: string;
  shippedDate?: string;
  receivedDate?: string;
  
  // Kargo
  shipping?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    cost?: number;
  };
  
  // Notlar
  notes?: string;
  internalNotes?: string;
  
  // Onay
  requestedBy: string;
  requestedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  
  // Toplam
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TransferItem {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  barcode?: string;
  
  requestedQuantity: number;
  approvedQuantity: number;
  shippedQuantity: number;
  receivedQuantity: number;
  
  sourceLocation?: string;
  destinationLocation?: string;
  
  lotId?: string;
  lotNumber?: string;
  
  unitCost: number;
  totalValue: number;
  
  status: 'pending' | 'approved' | 'partial' | 'shipped' | 'received' | 'cancelled';
  
  notes?: string;
}

// =====================================================
// STOK SAYIMI
// =====================================================

export interface StockTake {
  id: string;
  userId: string;
  warehouseId: string;
  warehouseName: string;
  
  name: string;
  description?: string;
  
  // Kapsam
  scope: {
    type: 'full' | 'partial' | 'cycle' | 'random';
    zones?: string[];
    categories?: string[];
    productIds?: string[];
  };
  
  // Durum
  status: 'scheduled' | 'in_progress' | 'pending_review' | 'approved' | 'completed' | 'cancelled';
  
  // Tarihler
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  
  // Sonuçlar
  summary: {
    totalProducts: number;
    countedProducts: number;
    matchedProducts: number;
    discrepancyProducts: number;
    
    totalExpectedQuantity: number;
    totalCountedQuantity: number;
    totalVariance: number;
    varianceValue: number;
  };
  
  // Öğeler
  items: StockTakeItem[];
  
  // Ekip
  assignedTo: string[];
  completedBy?: string;
  approvedBy?: string;
  
  notes?: string;
  
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface StockTakeItem {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  barcode?: string;
  
  location: string;
  lotId?: string;
  
  expectedQuantity: number;
  countedQuantity: number;
  variance: number;
  
  unitCost: number;
  varianceValue: number;
  
  status: 'pending' | 'counted' | 'recounted' | 'verified' | 'adjusted';
  
  countedBy?: string;
  countedAt?: string;
  
  notes?: string;
}

// =====================================================
// OTOMATİK YENİDEN STOK
// =====================================================

export interface ReplenishmentRule {
  id: string;
  userId: string;
  
  name: string;
  description?: string;
  isActive: boolean;
  
  // Kapsam
  scope: {
    warehouseIds: string[];
    categoryIds: string[];
    productIds?: string[];
  };
  
  // Koşullar
  trigger: {
    type: 'reorder_point' | 'time_based' | 'forecast' | 'manual';
    reorderPoint?: number;
    reorderPercentage?: number;
    scheduleDays?: number[];
    scheduleTime?: string;
  };
  
  // Sipariş miktarı
  orderQuantity: {
    type: 'fixed' | 'eoq' | 'max_level' | 'forecast';
    fixedQuantity?: number;
    maxLevel?: number;
    forecastDays?: number;
    roundTo?: number;
  };
  
  // Kaynak
  source: {
    type: 'supplier' | 'warehouse' | 'production';
    supplierId?: string;
    warehouseId?: string;
  };
  
  // Bildirimler
  notifications: {
    onTrigger: boolean;
    onOrderCreated: boolean;
    onLowStock: boolean;
    recipients: string[];
  };
  
  // İstatistikler
  stats: {
    timesTriggered: number;
    ordersCreated: number;
    lastTriggered?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// DEPO ANALİTİKLERİ
// =====================================================

export interface WarehouseAnalytics {
  warehouseId: string;
  period: {
    from: string;
    to: string;
  };
  
  // Stok metrikleri
  stockMetrics: {
    avgInventoryValue: number;
    inventoryTurnover: number;
    daysOfStock: number;
    stockAccuracy: number;
    fillRate: number;
  };
  
  // Hareket metrikleri
  movementMetrics: {
    totalInbound: number;
    totalOutbound: number;
    totalTransfers: number;
    avgDailyMovements: number;
    peakDay: string;
    peakMovements: number;
  };
  
  // Performans metrikleri
  performanceMetrics: {
    orderFulfillmentRate: number;
    avgPickingTime: number; // dakika
    avgPackingTime: number;
    ordersPerDay: number;
    itemsPerOrder: number;
    onTimeShipmentRate: number;
  };
  
  // Yer kullanımı
  spaceUtilization: {
    current: number; // %
    trend: 'increasing' | 'decreasing' | 'stable';
    projectedFull?: string; // Tahmini dolum tarihi
  };
  
  // Stok sorunları
  issues: {
    lowStockProducts: number;
    overStockProducts: number;
    expiringProducts: number;
    noMovementProducts: number;
    negativeStock: number;
  };
  
  // ABC analizi
  abcAnalysis: {
    aProducts: { count: number; value: number; percentage: number };
    bProducts: { count: number; value: number; percentage: number };
    cProducts: { count: number; value: number; percentage: number };
  };
  
  generatedAt: string;
}

// =====================================================
// MANAGER CLASS
// =====================================================

export class WarehouseManager {
  private userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  // Depo CRUD işlemleri
  async createWarehouse(data: Partial<Warehouse>): Promise<Warehouse | null> {
    // Implementation
    return null;
  }
  
  async getWarehouses(): Promise<Warehouse[]> {
    return [];
  }
  
  async getWarehouse(warehouseId: string): Promise<Warehouse | null> {
    return null;
  }
  
  // Stok işlemleri
  async getStock(warehouseId: string, productId?: string): Promise<WarehouseStock[]> {
    return [];
  }
  
  async adjustStock(
    warehouseId: string,
    productId: string,
    quantity: number,
    reason: MovementReason,
    notes?: string
  ): Promise<StockMovement | null> {
    return null;
  }
  
  // Transfer işlemleri
  async createTransfer(data: Partial<TransferOrder>): Promise<TransferOrder | null> {
    return null;
  }
  
  async processTransfer(
    transferId: string,
    action: 'approve' | 'ship' | 'receive' | 'cancel'
  ): Promise<TransferOrder | null> {
    return null;
  }
  
  // Sayım işlemleri
  async createStockTake(data: Partial<StockTake>): Promise<StockTake | null> {
    return null;
  }
  
  async recordCount(
    stockTakeId: string,
    itemId: string,
    countedQuantity: number
  ): Promise<StockTakeItem | null> {
    return null;
  }
  
  // Analitik
  async getAnalytics(
    warehouseId: string,
    fromDate: string,
    toDate: string
  ): Promise<WarehouseAnalytics | null> {
    return null;
  }
  
  // Stok optimizasyonu
  async suggestReplenishment(warehouseId: string): Promise<any[]> {
    return [];
  }
  
  async findOptimalLocation(
    warehouseId: string,
    productId: string,
    quantity: number
  ): Promise<string | null> {
    return null;
  }
}

export function createWarehouseManager(userId: string): WarehouseManager {
  return new WarehouseManager(userId);
}
