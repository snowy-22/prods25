/**
 * B2B Portal & Pricing System
 * 
 * Kurumsal müşteri yönetimi, bayilik sistemi ve dinamik fiyatlandırma
 */

// =====================================================
// MÜŞTERİ TİPLERİ
// =====================================================

export type CustomerType = 
  | 'retail'          // Bireysel müşteri
  | 'wholesale'       // Toptan müşteri
  | 'distributor'     // Distribütör
  | 'dealer'          // Bayi
  | 'reseller'        // Satıcı
  | 'corporate'       // Kurumsal
  | 'vip';            // VIP müşteri

export type CustomerStatus = 'pending' | 'active' | 'suspended' | 'blacklisted';

export type PaymentTerms = 
  | 'prepaid'         // Peşin
  | 'cod'             // Kapıda ödeme
  | 'net_7'           // 7 gün vade
  | 'net_15'          // 15 gün vade
  | 'net_30'          // 30 gün vade
  | 'net_45'          // 45 gün vade
  | 'net_60'          // 60 gün vade
  | 'net_90';         // 90 gün vade

// =====================================================
// B2B MÜŞTERİ
// =====================================================

export interface B2BCustomer {
  id: string;
  userId: string;
  
  // Temel bilgiler
  companyName: string;
  tradeName?: string;
  taxId: string;
  taxOffice: string;
  
  type: CustomerType;
  status: CustomerStatus;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  
  // İletişim
  contact: {
    primary: {
      name: string;
      title: string;
      email: string;
      phone: string;
      mobile?: string;
    };
    billing?: {
      name: string;
      email: string;
      phone: string;
    };
    purchasing?: {
      name: string;
      email: string;
      phone: string;
    };
  };
  
  // Adresler
  addresses: {
    billing: B2BAddress;
    shipping: B2BAddress[];
    defaultShippingId: string;
  };
  
  // Finansal
  financial: {
    creditLimit: number;
    creditUsed: number;
    creditAvailable: number;
    paymentTerms: PaymentTerms;
    currency: string;
    
    bankAccounts?: {
      bankName: string;
      iban: string;
      swiftCode?: string;
    }[];
    
    taxExempt: boolean;
    taxExemptionNumber?: string;
  };
  
  // Fiyatlandırma
  pricing: {
    priceListId?: string;
    priceListName?: string;
    discountPercentage: number;
    specialPricing: boolean;
    volumeDiscounts: boolean;
  };
  
  // Sipariş kuralları
  orderRules: {
    minOrderAmount: number;
    minOrderQuantity: number;
    maxOrderAmount?: number;
    allowPartialShipment: boolean;
    allowBackorder: boolean;
    requirePO: boolean; // Purchase Order gerekli mi
    autoApproveOrders: boolean;
    approvalThreshold?: number;
  };
  
  // Kargo
  shipping: {
    preferredCarrier?: string;
    freeShippingThreshold?: number;
    shippingAccountNumber?: string;
    specialInstructions?: string;
  };
  
  // Bayi bilgileri (eğer bayi ise)
  dealerInfo?: {
    dealerCode: string;
    territory: string[];
    exclusiveTerritory: boolean;
    contractStart: string;
    contractEnd: string;
    salesTarget: number;
    salesAchieved: number;
    commissionRate: number;
  };
  
  // İstatistikler
  stats: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderDate?: string;
    firstOrderDate?: string;
    lifetimeValue: number;
  };
  
  // Notlar ve belgeler
  notes?: string;
  documents: {
    type: 'contract' | 'tax_certificate' | 'trade_license' | 'other';
    name: string;
    url: string;
    expiryDate?: string;
  }[];
  
  tags: string[];
  metadata: Record<string, any>;
  
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface B2BAddress {
  id: string;
  name: string;
  street: string;
  street2?: string;
  district: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  
  contact?: {
    name: string;
    phone: string;
  };
  
  isDefault: boolean;
  deliveryInstructions?: string;
}

// =====================================================
// FİYAT LİSTESİ SİSTEMİ
// =====================================================

export interface PriceList {
  id: string;
  userId: string;
  
  name: string;
  code: string;
  description?: string;
  
  type: 'base' | 'customer' | 'channel' | 'promotional';
  status: 'active' | 'inactive' | 'scheduled';
  
  // Geçerlilik
  validity: {
    startDate: string;
    endDate?: string;
    isIndefinite: boolean;
  };
  
  // Kapsam
  scope: {
    customerTypes?: CustomerType[];
    customerTiers?: string[];
    customerIds?: string[];
    channels?: string[];
    regions?: string[];
  };
  
  // Temel fiyat listesi referansı
  basePriceListId?: string;
  
  // Genel ayarlar
  settings: {
    currency: string;
    includesTax: boolean;
    taxRate?: number;
    roundingRule: 'none' | 'round' | 'floor' | 'ceil';
    roundingPrecision: number;
  };
  
  // Öğeler
  items: PriceListItem[];
  
  // Toplu kurallar
  bulkRules: {
    percentageAdjustment?: number;
    fixedAdjustment?: number;
    categoryAdjustments?: {
      categoryId: string;
      adjustment: number;
    }[];
  };
  
  priority: number; // Çakışma durumunda öncelik
  
  stats: {
    productCount: number;
    lastUpdated: string;
    customersAssigned: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface PriceListItem {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  
  basePrice: number;
  salePrice?: number;
  minPrice?: number; // Minimum satış fiyatı
  
  // Miktar bazlı fiyatlar
  tierPricing?: {
    minQty: number;
    maxQty?: number;
    price: number;
    discountPercent?: number;
  }[];
  
  // Maliyet ve marj
  cost?: number;
  margin?: number;
  
  isActive: boolean;
  updatedAt: string;
}

// =====================================================
// DİNAMİK FİYATLANDIRMA KURALLARI
// =====================================================

export type PriceRuleType = 
  | 'discount'              // Sabit indirim
  | 'percentage_discount'   // Yüzde indirim
  | 'fixed_price'           // Sabit fiyat
  | 'buy_x_get_y'          // X al Y öde
  | 'bundle'               // Paket fiyatı
  | 'tiered'               // Kademe bazlı
  | 'time_based'           // Zaman bazlı
  | 'quantity_based'       // Miktar bazlı
  | 'customer_based'       // Müşteri bazlı
  | 'channel_based';       // Kanal bazlı

export interface PriceRule {
  id: string;
  userId: string;
  
  name: string;
  description?: string;
  code?: string; // Promosyon kodu
  
  type: PriceRuleType;
  status: 'active' | 'inactive' | 'scheduled' | 'expired';
  
  // Geçerlilik
  validity: {
    startDate: string;
    endDate: string;
    daysOfWeek?: number[]; // 0-6
    hoursOfDay?: { start: number; end: number }[];
    usageLimit?: number;
    usageCount: number;
    perCustomerLimit?: number;
  };
  
  // Koşullar
  conditions: PriceRuleCondition[];
  
  // Aksiyonlar
  actions: PriceRuleAction[];
  
  // Kombinasyon
  combination: {
    canCombineWithOther: boolean;
    exclusiveWith?: string[];
  };
  
  // Öncelik
  priority: number;
  stopProcessing: boolean; // Bu kural uygulandığında diğerlerini durdur
  
  // Pazarlama
  marketing?: {
    displayName: string;
    displayBadge?: string;
    bannerUrl?: string;
    termsUrl?: string;
  };
  
  stats: {
    timesApplied: number;
    totalDiscountGiven: number;
    avgDiscountAmount: number;
    affectedOrders: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface PriceRuleCondition {
  type: 
    | 'min_order_amount'
    | 'min_quantity'
    | 'product_in_cart'
    | 'category_in_cart'
    | 'customer_type'
    | 'customer_tier'
    | 'customer_group'
    | 'first_order'
    | 'order_count'
    | 'channel'
    | 'region'
    | 'coupon_code';
  
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains';
  value: any;
}

export interface PriceRuleAction {
  type: 
    | 'percentage_discount'
    | 'fixed_discount'
    | 'fixed_price'
    | 'free_item'
    | 'free_shipping'
    | 'gift'
    | 'points';
  
  value: number;
  
  // Uygulama kapsamı
  applyTo: 
    | 'order_total'
    | 'specific_products'
    | 'specific_categories'
    | 'cheapest_item'
    | 'most_expensive_item'
    | 'shipping';
  
  // Kapsam detayı
  productIds?: string[];
  categoryIds?: string[];
  
  // Limit
  maxDiscount?: number;
  maxItems?: number;
}

// =====================================================
// TEKLİF SİSTEMİ
// =====================================================

export interface Quote {
  id: string;
  userId: string;
  customerId: string;
  
  quoteNumber: string;
  name: string;
  
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';
  
  // Müşteri bilgileri
  customer: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
  };
  
  // Öğeler
  items: QuoteItem[];
  
  // Toplamlar
  totals: {
    subtotal: number;
    discount: number;
    discountPercentage: number;
    tax: number;
    taxRate: number;
    shipping: number;
    total: number;
    currency: string;
  };
  
  // Koşullar
  terms: {
    paymentTerms: PaymentTerms;
    deliveryTerms?: string;
    validityDays: number;
    expiryDate: string;
    notes?: string;
    termsAndConditions?: string;
  };
  
  // Takip
  history: {
    action: 'created' | 'sent' | 'viewed' | 'updated' | 'accepted' | 'rejected' | 'converted';
    timestamp: string;
    by?: string;
    notes?: string;
  }[];
  
  // Dönüşüm
  convertedOrderId?: string;
  convertedAt?: string;
  
  // Belge
  documentUrl?: string;
  
  createdBy: string;
  createdByName: string;
  
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
}

export interface QuoteItem {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  description?: string;
  image?: string;
  
  quantity: number;
  unitPrice: number;
  listPrice: number; // Orijinal fiyat
  discount: number;
  discountPercentage: number;
  taxRate: number;
  tax: number;
  total: number;
  
  notes?: string;
}

// =====================================================
// SIPARIŞ ONAY SİSTEMİ
// =====================================================

export interface ApprovalWorkflow {
  id: string;
  userId: string;
  
  name: string;
  description?: string;
  isActive: boolean;
  
  // Kapsam
  scope: {
    orderTypes: ('b2b' | 'b2c' | 'quote' | 'return')[];
    customerTypes?: CustomerType[];
    minAmount?: number;
    maxAmount?: number;
  };
  
  // Adımlar
  steps: ApprovalStep[];
  
  // Ayarlar
  settings: {
    allowSkip: boolean;
    allowParallel: boolean;
    autoApproveTimeout?: number; // dakika
    notifyOnPending: boolean;
    notifyOnComplete: boolean;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalStep {
  id: string;
  order: number;
  name: string;
  
  type: 'user' | 'role' | 'manager' | 'department';
  
  // Onaylayıcılar
  approvers: {
    userId?: string;
    role?: string;
    department?: string;
  }[];
  
  // Koşullar
  conditions?: {
    minAmount?: number;
    maxAmount?: number;
    categories?: string[];
  };
  
  // Zaman aşımı
  timeout?: number; // saat
  escalateTo?: string; // userId
  
  required: boolean;
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  
  entityType: 'order' | 'quote' | 'return' | 'price_change';
  entityId: string;
  
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'escalated';
  
  currentStep: number;
  
  decisions: {
    stepId: string;
    userId: string;
    userName: string;
    decision: 'approved' | 'rejected';
    notes?: string;
    timestamp: string;
  }[];
  
  requestedBy: string;
  requestedByName: string;
  
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// =====================================================
// B2B PORTAL MANAGER
// =====================================================

export class B2BManager {
  private userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  // Müşteri yönetimi
  async createCustomer(data: Partial<B2BCustomer>): Promise<B2BCustomer | null> {
    return null;
  }
  
  async getCustomers(filters?: Partial<{
    type: CustomerType;
    status: CustomerStatus;
    tier: string;
    search: string;
  }>): Promise<B2BCustomer[]> {
    return [];
  }
  
  async updateCustomer(customerId: string, updates: Partial<B2BCustomer>): Promise<B2BCustomer | null> {
    return null;
  }
  
  // Fiyat listesi yönetimi
  async createPriceList(data: Partial<PriceList>): Promise<PriceList | null> {
    return null;
  }
  
  async getPriceLists(): Promise<PriceList[]> {
    return [];
  }
  
  async assignPriceList(customerId: string, priceListId: string): Promise<boolean> {
    return false;
  }
  
  // Fiyat hesaplama
  async calculatePrice(
    productId: string,
    customerId: string,
    quantity: number,
    context?: {
      channel?: string;
      promoCode?: string;
    }
  ): Promise<{
    originalPrice: number;
    finalPrice: number;
    discounts: { name: string; amount: number }[];
    appliedRules: string[];
  }> {
    return {
      originalPrice: 0,
      finalPrice: 0,
      discounts: [],
      appliedRules: [],
    };
  }
  
  // Teklif yönetimi
  async createQuote(data: Partial<Quote>): Promise<Quote | null> {
    return null;
  }
  
  async sendQuote(quoteId: string): Promise<boolean> {
    return false;
  }
  
  async convertQuoteToOrder(quoteId: string): Promise<string | null> {
    return null;
  }
  
  // Onay işlemleri
  async submitForApproval(entityType: string, entityId: string): Promise<ApprovalRequest | null> {
    return null;
  }
  
  async approve(requestId: string, notes?: string): Promise<boolean> {
    return false;
  }
  
  async reject(requestId: string, reason: string): Promise<boolean> {
    return false;
  }
}

export function createB2BManager(userId: string): B2BManager {
  return new B2BManager(userId);
}
