/**
 * Order Management System
 * 
 * Gelişmiş sipariş yönetimi, çok kanallı sipariş birleştirme,
 * durum takibi ve fatura entegrasyonu
 */

// =====================================================
// SİPARİŞ DURUMLARI
// =====================================================

export type OrderStatus = 
  | 'pending'           // Beklemede
  | 'awaiting_payment'  // Ödeme bekleniyor
  | 'payment_failed'    // Ödeme başarısız
  | 'paid'              // Ödendi
  | 'confirmed'         // Onaylandı
  | 'processing'        // İşleniyor
  | 'awaiting_stock'    // Stok bekleniyor
  | 'picking'           // Toplanıyor
  | 'packing'           // Paketleniyor
  | 'ready_to_ship'     // Kargoya hazır
  | 'shipped'           // Kargoda
  | 'out_for_delivery'  // Dağıtımda
  | 'delivered'         // Teslim edildi
  | 'completed'         // Tamamlandı
  | 'cancelled'         // İptal edildi
  | 'refunded'          // İade edildi
  | 'partially_refunded'; // Kısmi iade

export type PaymentStatus = 
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'partially_paid'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'voided';

export type FulfillmentStatus = 
  | 'unfulfilled'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'restocked';

// =====================================================
// SİPARİŞ
// =====================================================

export interface Order {
  id: string;
  userId: string;
  
  // Sipariş numaraları
  orderNumber: string;
  externalOrderId?: string; // Pazaryeri sipariş no
  invoiceNumber?: string;
  
  // Kaynak bilgisi
  source: {
    channel: 'web' | 'mobile' | 'marketplace' | 'pos' | 'phone' | 'api';
    platform?: string; // trendyol, hepsiburada, shopify, vb.
    integrationId?: string;
    referenceId?: string;
  };
  
  // Durumlar
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  
  // Müşteri
  customer: OrderCustomer;
  
  // Adresler
  billingAddress: OrderAddress;
  shippingAddress: OrderAddress;
  
  // Ürünler
  lineItems: OrderLineItem[];
  
  // Toplamlar
  totals: {
    subtotal: number;
    itemDiscount: number;
    orderDiscount: number;
    shippingCost: number;
    shippingDiscount: number;
    taxTotal: number;
    total: number;
    currency: string;
    exchangeRate?: number;
  };
  
  // İndirimler
  discounts: OrderDiscount[];
  
  // Ödeme bilgisi
  payment: {
    method: string;
    transactionId?: string;
    paidAmount: number;
    refundedAmount: number;
    
    // Taksit bilgisi
    installment?: {
      count: number;
      amount: number;
      interestRate: number;
      totalAmount: number;
    };
    
    // 3D Secure
    threeDSecure?: {
      verified: boolean;
      cavv?: string;
    };
    
    // Kredi kartı bilgisi (maskelenmiş)
    card?: {
      brand: string;
      last4: string;
      expiryMonth: number;
      expiryYear: number;
    };
  };
  
  // Kargo
  shipping: {
    method: string;
    carrierId?: string;
    carrierName?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    
    estimatedDelivery?: string;
    actualDelivery?: string;
    
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    
    packages: ShipmentPackage[];
  };
  
  // Fulfillment
  fulfillments: OrderFulfillment[];
  
  // İade/Refund
  refunds: OrderRefund[];
  returns: OrderReturn[];
  
  // Vergi
  tax: {
    taxIncluded: boolean;
    taxExempt: boolean;
    taxExemptionNumber?: string;
    taxLines: {
      title: string;
      rate: number;
      amount: number;
    }[];
  };
  
  // B2B spesifik
  b2b?: {
    customerId: string;
    companyName: string;
    poNumber?: string; // Purchase Order
    paymentTerms: string;
    dueDate?: string;
    creditUsed?: number;
  };
  
  // Notlar
  customerNote?: string;
  internalNotes: {
    text: string;
    createdBy: string;
    createdAt: string;
  }[];
  
  // Etiketler
  tags: string[];
  
  // Risk değerlendirme
  risk?: {
    level: 'low' | 'medium' | 'high';
    score: number;
    reasons: string[];
  };
  
  // Fatura
  invoices: OrderInvoice[];
  
  // Tarihler
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  
  // Metadata
  metadata: Record<string, any>;
}

// =====================================================
// SİPARİŞ BİLEŞENLERİ
// =====================================================

export interface OrderCustomer {
  id?: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  
  type: 'guest' | 'registered' | 'b2b';
  b2bCustomerId?: string;
  
  locale?: string;
  acceptsMarketing: boolean;
  
  ordersCount: number;
  totalSpent: number;
}

export interface OrderAddress {
  firstName: string;
  lastName: string;
  company?: string;
  
  address1: string;
  address2?: string;
  district: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  countryCode: string;
  
  phone?: string;
  email?: string;
  
  taxId?: string;
  taxOffice?: string;
}

export interface OrderLineItem {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  
  name: string;
  title: string; // Variant dahil tam isim
  image?: string;
  
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  
  discount: number;
  discountPercentage: number;
  discountReasons: string[];
  
  tax: number;
  taxRate: number;
  taxIncluded: boolean;
  
  total: number;
  
  // Stok bilgisi
  fulfillableQuantity: number;
  fulfilledQuantity: number;
  refundableQuantity: number;
  refundedQuantity: number;
  
  // Ürün özellikleri
  properties?: {
    name: string;
    value: string;
  }[];
  
  // Depo ataması
  warehouseId?: string;
  locationId?: string;
  
  // Hediye mi?
  isGift: boolean;
  giftMessage?: string;
  
  // Ön sipariş
  isPreorder: boolean;
  preorderReleaseDate?: string;
  
  // Backorder
  isBackorder: boolean;
  expectedDate?: string;
  
  weight?: number;
  requiresShipping: boolean;
}

export interface OrderDiscount {
  id: string;
  code?: string;
  type: 'fixed' | 'percentage' | 'shipping';
  value: number;
  amount: number;
  target: 'order' | 'line_item' | 'shipping';
  targetId?: string;
  reason?: string;
}

export interface ShipmentPackage {
  id: string;
  trackingNumber: string;
  trackingUrl?: string;
  carrier: string;
  
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  
  items: {
    lineItemId: string;
    quantity: number;
  }[];
  
  status: 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'returned';
  
  shippedAt?: string;
  deliveredAt?: string;
  
  events: {
    status: string;
    description: string;
    location?: string;
    timestamp: string;
  }[];
}

export interface OrderFulfillment {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  
  warehouseId: string;
  warehouseName: string;
  
  lineItems: {
    lineItemId: string;
    quantity: number;
    pickedQuantity: number;
  }[];
  
  // Toplama bilgisi
  picking?: {
    startedAt: string;
    completedAt?: string;
    pickedBy?: string;
    notes?: string;
  };
  
  // Paketleme bilgisi
  packing?: {
    startedAt: string;
    completedAt?: string;
    packedBy?: string;
    packageCount: number;
  };
  
  // Kargo
  shipment?: {
    carrier: string;
    trackingNumber: string;
    labelUrl?: string;
    shippedAt?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// İADE VE REFUND
// =====================================================

export interface OrderRefund {
  id: string;
  orderId: string;
  
  status: 'pending' | 'processed' | 'failed';
  
  amount: number;
  currency: string;
  
  reason: string;
  note?: string;
  
  items: {
    lineItemId: string;
    quantity: number;
    amount: number;
    restockType: 'no_restock' | 'cancel' | 'return';
  }[];
  
  shippingRefund: number;
  taxRefund: number;
  
  transactionId?: string;
  
  processedBy?: string;
  processedAt?: string;
  
  createdAt: string;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  
  status: 
    | 'requested'
    | 'approved'
    | 'rejected'
    | 'awaiting_return'
    | 'in_transit'
    | 'received'
    | 'inspecting'
    | 'completed'
    | 'refunded';
  
  returnNumber: string;
  
  items: {
    lineItemId: string;
    quantity: number;
    reason: ReturnReason;
    condition?: 'new' | 'opened' | 'used' | 'damaged';
    notes?: string;
  }[];
  
  // Kargo bilgisi
  returnShipping?: {
    carrier: string;
    trackingNumber: string;
    labelUrl?: string;
    paidByCustomer: boolean;
    cost?: number;
  };
  
  // İnceleme
  inspection?: {
    completedAt: string;
    completedBy: string;
    result: 'approved' | 'rejected' | 'partial';
    notes: string;
    images?: string[];
  };
  
  // İade tutarı
  refundAmount?: number;
  refundId?: string;
  
  // Değişim (exchange)
  exchange?: {
    newOrderId: string;
    items: {
      productId: string;
      variantId?: string;
      quantity: number;
    }[];
  };
  
  customerNote?: string;
  internalNotes?: string;
  
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type ReturnReason = 
  | 'wrong_item'          // Yanlış ürün gönderildi
  | 'damaged'             // Hasarlı ulaştı
  | 'defective'           // Arızalı/kusurlu
  | 'not_as_described'    // Açıklamaya uygun değil
  | 'changed_mind'        // Fikir değişikliği
  | 'size_fit'            // Beden/ölçü uyumsuz
  | 'late_delivery'       // Geç teslimat
  | 'better_price'        // Daha iyi fiyat bulundu
  | 'other';              // Diğer

// =====================================================
// FATURA
// =====================================================

export interface OrderInvoice {
  id: string;
  orderId: string;
  
  invoiceNumber: string;
  type: 'standard' | 'proforma' | 'credit_note';
  
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'void';
  
  // Fatura adresi
  billingAddress: OrderAddress;
  
  // Kalemler
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    tax: number;
    total: number;
  }[];
  
  // Toplamlar
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  currency: string;
  
  // Ödeme bilgisi
  paymentTerms?: string;
  dueDate?: string;
  paidAmount: number;
  paidAt?: string;
  
  // Vergi bilgisi
  taxInfo: {
    companyName: string;
    taxId: string;
    taxOffice: string;
    address: string;
  };
  
  // E-Fatura (TR)
  eInvoice?: {
    uuid: string;
    issueDate: string;
    issueTime: string;
    scenarioType: 'TEMEL' | 'TICARI' | 'IHRACAT';
    invoiceType: 'SATIS' | 'IADE';
    gibIntegratorId?: string;
    status: 'pending' | 'sent' | 'accepted' | 'rejected';
    rejectionReason?: string;
    pdfUrl?: string;
    xmlUrl?: string;
  };
  
  // E-Arşiv (TR)
  eArchive?: {
    uuid: string;
    issueDate: string;
    status: 'pending' | 'generated' | 'failed';
    pdfUrl?: string;
  };
  
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

// =====================================================
// SİPARİŞ YÖNETİCİSİ
// =====================================================

export interface OrderFilters {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  fulfillmentStatus?: FulfillmentStatus[];
  channel?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  customerId?: string;
  search?: string;
  tags?: string[];
  minTotal?: number;
  maxTotal?: number;
  warehouseId?: string;
  hasRisk?: boolean;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  
  byStatus: Record<OrderStatus, number>;
  byPaymentStatus: Record<PaymentStatus, number>;
  byFulfillmentStatus: Record<FulfillmentStatus, number>;
  byChannel: Record<string, { count: number; revenue: number }>;
  
  pendingPayment: number;
  readyToShip: number;
  awaitingStock: number;
  
  todayOrders: number;
  todayRevenue: number;
}

export class OrderManager {
  private userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  // Sipariş CRUD
  async createOrder(data: Partial<Order>): Promise<Order | null> {
    return null;
  }
  
  async getOrders(filters?: OrderFilters, pagination?: { page: number; limit: number }): Promise<{
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return { orders: [], total: 0, page: 1, totalPages: 0 };
  }
  
  async getOrder(orderId: string): Promise<Order | null> {
    return null;
  }
  
  async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
    return null;
  }
  
  // Durum güncelleme
  async updateStatus(orderId: string, status: OrderStatus, note?: string): Promise<boolean> {
    return false;
  }
  
  async confirmOrder(orderId: string): Promise<boolean> {
    return false;
  }
  
  async cancelOrder(orderId: string, reason: string): Promise<boolean> {
    return false;
  }
  
  // Fulfillment
  async createFulfillment(orderId: string, warehouseId: string, items: { lineItemId: string; quantity: number }[]): Promise<OrderFulfillment | null> {
    return null;
  }
  
  async markAsShipped(orderId: string, trackingInfo: { carrier: string; trackingNumber: string }): Promise<boolean> {
    return false;
  }
  
  async markAsDelivered(orderId: string): Promise<boolean> {
    return false;
  }
  
  // Refund & Return
  async createRefund(orderId: string, data: Partial<OrderRefund>): Promise<OrderRefund | null> {
    return null;
  }
  
  async createReturn(orderId: string, data: Partial<OrderReturn>): Promise<OrderReturn | null> {
    return null;
  }
  
  async processReturn(returnId: string, decision: 'approve' | 'reject', notes?: string): Promise<boolean> {
    return false;
  }
  
  // Fatura
  async generateInvoice(orderId: string): Promise<OrderInvoice | null> {
    return null;
  }
  
  async sendEInvoice(invoiceId: string): Promise<boolean> {
    return false;
  }
  
  // İstatistikler
  async getStats(dateRange?: { start: string; end: string }): Promise<OrderStats> {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      byStatus: {} as Record<OrderStatus, number>,
      byPaymentStatus: {} as Record<PaymentStatus, number>,
      byFulfillmentStatus: {} as Record<FulfillmentStatus, number>,
      byChannel: {},
      pendingPayment: 0,
      readyToShip: 0,
      awaitingStock: 0,
      todayOrders: 0,
      todayRevenue: 0,
    };
  }
  
  // Pazaryeri senkronizasyonu
  async syncFromMarketplace(integrationId: string): Promise<{ imported: number; updated: number; errors: string[] }> {
    return { imported: 0, updated: 0, errors: [] };
  }
  
  async pushStatusToMarketplace(orderId: string): Promise<boolean> {
    return false;
  }
  
  // Toplu işlemler
  async bulkUpdateStatus(orderIds: string[], status: OrderStatus): Promise<{ success: number; failed: number }> {
    return { success: 0, failed: 0 };
  }
  
  async bulkAssignWarehouse(orderIds: string[], warehouseId: string): Promise<{ success: number; failed: number }> {
    return { success: 0, failed: 0 };
  }
  
  async bulkPrintLabels(orderIds: string[]): Promise<string[]> {
    return [];
  }
  
  async bulkGenerateInvoices(orderIds: string[]): Promise<{ success: number; failed: number }> {
    return { success: 0, failed: 0 };
  }
}

export function createOrderManager(userId: string): OrderManager {
  return new OrderManager(userId);
}

// =====================================================
// SIPARIŞ WORKFLOW
// =====================================================

export interface OrderWorkflowStep {
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  action: string;
  requiresConfirmation: boolean;
  autoTriggers?: {
    type: 'status_change' | 'time_elapsed' | 'payment_received' | 'stock_available';
    condition?: any;
  }[];
  notifications?: {
    type: 'email' | 'sms' | 'push' | 'webhook';
    template: string;
    recipients: ('customer' | 'admin' | 'warehouse')[];
  }[];
}

export const ORDER_WORKFLOW: OrderWorkflowStep[] = [
  {
    fromStatus: 'pending',
    toStatus: 'confirmed',
    action: 'confirm',
    requiresConfirmation: false,
    autoTriggers: [{ type: 'payment_received' }],
    notifications: [
      { type: 'email', template: 'order_confirmed', recipients: ['customer'] }
    ]
  },
  {
    fromStatus: 'confirmed',
    toStatus: 'processing',
    action: 'start_processing',
    requiresConfirmation: false,
    autoTriggers: [{ type: 'stock_available' }]
  },
  {
    fromStatus: 'processing',
    toStatus: 'picking',
    action: 'start_picking',
    requiresConfirmation: false
  },
  {
    fromStatus: 'picking',
    toStatus: 'packing',
    action: 'complete_picking',
    requiresConfirmation: true
  },
  {
    fromStatus: 'packing',
    toStatus: 'ready_to_ship',
    action: 'complete_packing',
    requiresConfirmation: true
  },
  {
    fromStatus: 'ready_to_ship',
    toStatus: 'shipped',
    action: 'ship',
    requiresConfirmation: true,
    notifications: [
      { type: 'email', template: 'order_shipped', recipients: ['customer'] },
      { type: 'sms', template: 'order_shipped_sms', recipients: ['customer'] }
    ]
  },
  {
    fromStatus: 'shipped',
    toStatus: 'out_for_delivery',
    action: 'out_for_delivery',
    requiresConfirmation: false,
    autoTriggers: [{ type: 'status_change' }],
    notifications: [
      { type: 'push', template: 'order_out_for_delivery', recipients: ['customer'] }
    ]
  },
  {
    fromStatus: 'out_for_delivery',
    toStatus: 'delivered',
    action: 'deliver',
    requiresConfirmation: false,
    autoTriggers: [{ type: 'status_change' }],
    notifications: [
      { type: 'email', template: 'order_delivered', recipients: ['customer'] }
    ]
  },
  {
    fromStatus: 'delivered',
    toStatus: 'completed',
    action: 'complete',
    requiresConfirmation: false,
    autoTriggers: [
      { type: 'time_elapsed', condition: { days: 7 } }
    ]
  }
];
