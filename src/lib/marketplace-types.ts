/**
 * Marketplace and Inventory Management Types
 */

import { ContentItem } from './initial-content';

export type MarketplaceListingStatus = 'draft' | 'active' | 'sold' | 'cancelled' | 'expired';
export type ProductCondition = 'new' | 'like-new' | 'good' | 'fair' | 'poor';
export type ShippingMethod = 'standard' | 'express' | 'overnight' | 'pickup';
export type InventoryItemStatus = 'owned' | 'for-sale' | 'sold' | 'archived';
export type MarketplaceViewMode = {
  mode: 'grid' | 'list' | 'gallery';
  showImages: boolean;
  showPrices: boolean;
  showCondition: boolean;
  showLifecycle: boolean;
  columns: number;
};

export interface MarketplaceListing {
  id: string;
  itemId: string;
  sellerId: string;
  sellerName: string;
  status: MarketplaceListingStatus;
  title: string;
  description: string;
  price: number; // in cents
  currency?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  condition?: ProductCondition;
  shippingOptions: ShippingOption[];
  views: number;
  favorites: number;
  questions: MarketplaceQuestion[];
  offers: MarketplaceOffer[];
  createdAt: string;
  updatedAt: string;
  listedAt: string;
  soldAt?: string;
  expiresAt?: string;
}

export interface ShippingOption {
  id: string;
  method: ShippingMethod;
  price: number; // in cents
  estimatedDays: number;
  carrier?: string;
  trackingAvailable?: boolean;
}

export interface MarketplaceQuestion {
  id: string;
  userId: string;
  userName: string;
  question: string;
  answer?: string;
  createdAt: string;
  answeredAt?: string;
}

export interface MarketplaceOffer {
  id: string;
  userId: string;
  userName: string;
  amount: number; // in cents
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message?: string;
  createdAt: string;
  expiresAt: string;
  respondedAt?: string;
}

export interface ProductLifecycleTracking {
  itemId: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  depreciationRate?: number;
  currentStage: 'new' | 'good' | 'fair' | 'poor' | 'aging' | 'needs-repair' | 'end-of-life' | 'parts-only';
  maintenanceHistory: MaintenanceRecord[];
  condition: {
    overall: number; // 0-100
    appearance: number;
    functionality: number;
  };
  isTrackingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'cleaning' | 'repair' | 'upgrade' | 'inspection' | 'service';
  description: string;
  cost?: number;
  performedBy?: string;
  notes?: string;
}

export interface Warranty {
  id: string;
  itemId: string;
  provider: string;
  type: 'manufacturer' | 'extended' | 'third-party';
  startDate: string;
  endDate: string;
  coverage: string;
  terms: string;
  claimProcess?: string;
  contactInfo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Insurance {
  id: string;
  itemId: string;
  provider: string;
  policyNumber: string;
  type: 'personal-property' | 'electronics' | 'valuable-items';
  coverageAmount: number;
  premium: number;
  deductible: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appraisal {
  id: string;
  itemId: string;
  appraiser: string;
  appraisalDate: string;
  // Backwards-compatible alias used in some UI places
  date?: string;
  estimatedValue: number;
  marketValue: number;
  replacementValue: number;
  condition: ProductCondition;
  notes?: string;
  certificateUrl?: string;
  validUntil?: string;
  createdAt: string;
}

export interface FinancingOption {
  id: string;
  itemId: string;
  provider: string;
  type: 'installment' | 'lease' | 'rent-to-own';
  termMonths: number;
  // Backwards-compatible alias for templates expecting `term`
  term?: number;
  monthlyPayment: number;
  downPayment: number;
  interestRate: number;
  totalCost: number;
  isAvailable: boolean;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'purchase' | 'sale' | 'trade' | 'gift' | 'donation' | 'disposal' | 'transfer';
  fromStatus: InventoryItemStatus | string;
  toStatus: InventoryItemStatus | string;
  amount?: number;
  counterparty?: string;
  notes?: string;
  timestamp: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  itemId?: string;
  title: string;
  description?: string;
  targetPrice?: number;
  priority: 'low' | 'medium' | 'high';
  status: 'interested' | 'watching' | 'negotiating' | 'purchased' | 'researching' | 'ready-to-buy';
  images?: string[];
  // Backwards-compatible fields used elsewhere in the UI
  productName?: string;
  imageUrl?: string;
  url?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySettings {
  enableLifecycleTracking: boolean;
  autoDepreciation: boolean;
  depreciationMethod: 'linear' | 'declining-balance' | 'units-of-production';
  enableInsuranceTracking: boolean;
  enableWarrantyTracking: boolean;
  enableAppraisals: boolean;
  reminderDays: number;
  defaultCurrency: string;
}
