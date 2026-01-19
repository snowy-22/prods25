/**
 * E-Commerce System Types
 * Complete product, cart, order, payment, and reservation system
 */

// Re-export marketplace types for convenience
export type { MarketplaceListing, MarketplaceListingStatus } from './marketplace-types';

// ============================================================================
// PRODUCT & INVENTORY SYSTEM
// ============================================================================

export type ProductStatus = 'active' | 'inactive' | 'discontinued' | 'draft';
export type ProductType = 'physical' | 'digital' | 'service' | 'subscription';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number; // in cents (e.g., $19.99 = 1999)
  currency: 'USD' | 'EUR' | 'GBP' | 'TRY' | 'JPY';
  type: ProductType;
  status: ProductStatus;
  
  // Inventory
  sku: string;
  quantity: number;
  lowStockThreshold?: number;
  unlimited: boolean; // For digital/subscription products
  
  // Metadata
  image?: string;
  images?: string[];
  category: string;
  tags: string[];
  metadata: Record<string, any>;
  
  // Seller info
  sellerId: string;
  sellerName: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  order: number;
  createdAt: string;
}

// ============================================================================
// CART & BASKET SYSTEM
// ============================================================================

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number; // Price at time of addition (for history)
  selectedVariant?: {
    size?: string;
    color?: string;
    customization?: Record<string, any>;
  };
  addedAt: string;
}

export interface ShoppingCart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number; // Alias: taxAmount
  shipping: number; // Alias: shippingCost
  discount: number; // Alias: discountAmount
  discountCode?: string;
  total: number;
  lastModified: string;
  expiresAt?: string; // Cart expiration (usually 30 days)
}

// ============================================================================
// ORDER & TRANSACTION SYSTEM
// ============================================================================

export type OrderStatus = 
  | 'pending'      // Created, awaiting payment
  | 'processing'   // Payment received
  | 'shipped'      // Physical items in transit
  | 'delivered'    // Delivered
  | 'completed'    // Digital/service fulfilled
  | 'cancelled'    // Order cancelled
  | 'refunded';    // Money returned

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  price: number;
  variant?: Record<string, any>;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  
  // Shipping
  shippingAddress?: {
    name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Payment
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  
  // Status
  status: OrderStatus;
  
  // Tracking
  trackingNumber?: string;
  estimatedDelivery?: string;
  
  // Notes
  notes?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ============================================================================
// PAYMENT & PAYMENT METHODS
// ============================================================================

export type PaymentMethodType = 'card' | 'bank_transfer' | 'digital_wallet' | 'crypto';

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  
  // Stripe integration
  stripePaymentMethodId?: string;
  
  // Card details (last 4 digits only)
  cardLast4?: string;
  cardBrand?: string; // visa, mastercard, amex, discover
  cardExpMonth?: number;
  cardExpYear?: number;
  
  // Bank transfer details
  bankAccountLast4?: string;
  bankName?: string;
  
  // Digital wallet
  walletEmail?: string;
  walletType?: string; // apple_pay, google_pay, paypal
  
  // Default method
  isDefault: boolean;
  
  // Status
  isActive: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  orderId: string;
  
  // Stripe
  stripePaymentIntentId?: string;
  
  // Details
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  
  // Methods
  paymentMethods: string[];
  
  // Metadata
  metadata: Record<string, any>;
  
  // Timestamps
  createdAt: string;
  expiresAt: string;
}

// ============================================================================
// RESERVATION & BOOKING SYSTEM
// ============================================================================

export type ReservationStatus = 
  | 'pending'      // Awaiting confirmation
  | 'confirmed'    // Confirmed
  | 'in_progress'  // Service in progress
  | 'completed'    // Completed
  | 'cancelled';   // Cancelled

export interface ReservationSlot {
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number;
  available: number;
  reserved: number;
}

export interface Reservation {
  id: string;
  userId: string;
  serviceId: string; // Product ID of the service
  serviceName: string;
  
  // Details
  status: ReservationStatus;
  
  // Booking
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  
  // Guest info
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCount?: number;
  
  // Price
  price: number;
  
  // Notes
  notes?: string;
  cancellationReason?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

// ============================================================================
// SHOPPING MANAGER (Player Control)
// ============================================================================

export interface ShoppingManager {
  id: string;
  userId: string;
  
  // Cart & Checkout
  currentCart?: ShoppingCart;
  recentOrders: Order[];
  
  // Preferences
  defaultPaymentMethod?: string;
  defaultShippingAddress?: string;
  
  // Settings
  notifyOnOrder: boolean;
  notifyOnShipment: boolean;
  notifyOnDelivery: boolean;
  
  // Display
  viewMode: 'grid' | 'list' | 'compact';
  itemsPerPage: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DISCOUNT & COUPON SYSTEM
// ============================================================================

export type DiscountType = 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';

export interface DiscountCode {
  id: string;
  code: string;
  description?: string;
  type: DiscountType;
  value: number; // percentage or fixed amount
  maxUsage: number;
  currentUsage: number;
  minimumPurchase?: number;
  appliesTo?: string[]; // Product IDs
  
  // Validity
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// REVIEW & RATING SYSTEM
// ============================================================================

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  
  // Content
  title: string;
  body: string;
  rating: 1 | 2 | 3 | 4 | 5;
  
  // Flags
  isVerifiedPurchase: boolean;
  isFeatured: boolean;
  
  // Engagement
  helpfulCount: number;
  unhelpfulCount: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

export interface SalesMetrics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
  
  // Revenue
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  
  // Products
  productsViewed: number;
  productsOrdered: number;
  
  // Conversion
  conversionRate: number;
  cartAbandonmentRate: number;
  
  // Returns
  returnRate: number;
  refundAmount: number;
}

// ============================================================================
// SELLER DASHBOARD
// ============================================================================

export interface SellerDashboard {
  userId: string;
  businessName: string;
  businessDescription?: string;
  
  // Financial
  accountBalance: number;
  totalRevenue: number;
  pendingPayouts: number;
  
  // Products
  totalProducts: number;
  activeListings: number;
  outOfStock: number;
  
  // Metrics
  totalOrders: number;
  totalReviews: number;
  averageRating: number;
  
  // Status
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TRANSACTION & PAYMENT HISTORY
// ============================================================================

export type TransactionType = 'payment' | 'refund' | 'payout' | 'adjustment';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  
  // Details
  amount: number;
  currency: string;
  description: string;
  
  // Related
  orderId?: string;
  paymentMethodId?: string;
  
  // Status
  status: 'pending' | 'completed' | 'failed';
  
  // Stripe
  stripeTransactionId?: string;
  
  // Timestamps
  createdAt: string;
  completedAt?: string;
}
