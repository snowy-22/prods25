/**
 * E-Commerce System: Reservations & Sales
 * 
 * Blockchain-verified reservation and purchase system
 * with calendar widgets and price confirmation cards
 */

import crypto from 'crypto';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded';

export interface ReservationSlot {
  id: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number;
  booked: number;
  price: number;
  currency: string;
  isAvailable: boolean;
  metadata?: Record<string, any>;
}

export interface Reservation {
  id: string;
  userId: string;
  slotId: string;
  createdAt: string;
  confirmedAt?: string;
  status: ReservationStatus;
  participants: number;
  totalPrice: number;
  currency: string;
  blockchainHash: string;
  verificationChain: VerificationNode[];
  customerInfo: CustomerInfo;
  notes?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
  additionalInfo?: Record<string, any>;
}

export interface PurchaseItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface Purchase {
  id: string;
  userId: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  createdAt: string;
  paidAt?: string;
  paymentStatus: PaymentStatus;
  blockchainHash: string;
  verificationChain: VerificationNode[];
  shippingInfo?: ShippingInfo;
  billingInfo?: BillingInfo;
  confirmationCode: string;
}

export interface ShippingInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  trackingNumber?: string;
}

export interface BillingInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface VerificationNode {
  hash: string;
  previousHash: string;
  timestamp: string;
  verifier: string;
  signature: string;
}

// Reservation Calendar Widget Configuration
export interface ReservationWidgetConfig {
  id: string;
  title: string;
  description?: string;
  serviceType: string; // e.g., 'restaurant', 'salon', 'consulting'
  workingHours: {
    start: string; // HH:mm
    end: string; // HH:mm
  };
  slotDuration: number; // minutes
  maxCapacityPerSlot: number;
  pricingTiers: PricingTier[];
  blockDates?: string[]; // ISO dates to block
  settings: {
    requireConfirmation: boolean;
    autoConfirmAfterMinutes?: number;
    allowCancellation: boolean;
    cancellationDeadlineHours: number;
    requirePaymentUpfront: boolean;
  };
}

export interface PricingTier {
  name: string;
  price: number;
  currency: string;
  minParticipants?: number;
  maxParticipants?: number;
  appliesTo?: string[]; // day names or date ranges
}

// Purchase Confirmation Widget Configuration
export interface PurchaseWidgetConfig {
  id: string;
  title: string;
  description?: string;
  products: ProductListing[];
  shippingOptions: ShippingOption[];
  taxRate: number; // percentage
  acceptedPaymentMethods: PaymentMethod[];
  settings: {
    requireShipping: boolean;
    allowGuestCheckout: boolean;
    sendConfirmationEmail: boolean;
    enableInventoryTracking: boolean;
  };
}

export interface ProductListing {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  stock?: number;
  category?: string;
  attributes?: Record<string, string>;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  description?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'crypto' | 'bank-transfer' | 'cash';
  isEnabled: boolean;
}

// Blockchain E-Commerce System
export class ECommerceBlockchain {
  private chain: VerificationNode[] = [];

  generateHash(data: Record<string, any>): string {
    const content = JSON.stringify(data);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  createVerificationNode(
    transactionId: string,
    userId: string,
    verifier: string,
    metadata?: Record<string, any>
  ): VerificationNode {
    const timestamp = new Date().toISOString();
    const previousHash = this.chain.length > 0 
      ? this.chain[this.chain.length - 1].hash 
      : '0';

    const hash = this.generateHash({
      transactionId,
      userId,
      timestamp,
      previousHash,
      verifier,
      metadata
    });

    const signature = crypto
      .createHmac('sha256', process.env.BLOCKCHAIN_SECRET || 'canvasflow-ecommerce-secret')
      .update(hash)
      .digest('hex');

    const node: VerificationNode = {
      hash,
      previousHash,
      timestamp,
      verifier,
      signature
    };

    this.chain.push(node);
    return node;
  }

  verifyChain(chain: VerificationNode[]): boolean {
    for (let i = 1; i < chain.length; i++) {
      const current = chain[i];
      const previous = chain[i - 1];

      if (current.previousHash !== previous.hash) {
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.BLOCKCHAIN_SECRET || 'canvasflow-ecommerce-secret')
        .update(current.hash)
        .digest('hex');

      if (current.signature !== expectedSignature) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create blockchain-verified reservation
   */
  createReservation(
    userId: string,
    slotId: string,
    customerInfo: CustomerInfo,
    participants: number,
    totalPrice: number,
    currency: string
  ): Reservation {
    const id = `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const hash = this.generateHash({ id, userId, slotId, timestamp, totalPrice });
    const verificationNode = this.createVerificationNode(id, userId, 'system', {
      type: 'reservation',
      slotId,
      participants
    });

    return {
      id,
      userId,
      slotId,
      createdAt: timestamp,
      status: 'pending',
      participants,
      totalPrice,
      currency,
      blockchainHash: hash,
      verificationChain: [verificationNode],
      customerInfo
    };
  }

  /**
   * Confirm reservation with admin/user verification
   */
  confirmReservation(
    reservation: Reservation,
    verifier: string
  ): Reservation {
    const verificationNode = this.createVerificationNode(
      reservation.id,
      reservation.userId,
      verifier,
      { action: 'confirm' }
    );

    return {
      ...reservation,
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      verificationChain: [...reservation.verificationChain, verificationNode]
    };
  }

  /**
   * Create blockchain-verified purchase
   */
  createPurchase(
    userId: string,
    items: PurchaseItem[],
    subtotal: number,
    tax: number,
    total: number,
    currency: string,
    shippingInfo?: ShippingInfo,
    billingInfo?: BillingInfo
  ): Purchase {
    const id = `pur-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const confirmationCode = this.generateConfirmationCode();
    const hash = this.generateHash({ id, userId, items, total, timestamp });
    const verificationNode = this.createVerificationNode(id, userId, 'system', {
      type: 'purchase',
      itemCount: items.length,
      total
    });

    return {
      id,
      userId,
      items,
      subtotal,
      tax,
      total,
      currency,
      createdAt: timestamp,
      paymentStatus: 'unpaid',
      blockchainHash: hash,
      verificationChain: [verificationNode],
      shippingInfo,
      billingInfo,
      confirmationCode
    };
  }

  /**
   * Confirm payment with verification
   */
  confirmPayment(
    purchase: Purchase,
    verifier: string,
    paymentMethod: string
  ): Purchase {
    const verificationNode = this.createVerificationNode(
      purchase.id,
      purchase.userId,
      verifier,
      { action: 'payment-confirmed', paymentMethod }
    );

    return {
      ...purchase,
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
      verificationChain: [...purchase.verificationChain, verificationNode]
    };
  }

  /**
   * Generate human-readable confirmation code
   */
  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Export transaction as NFT-like proof
   */
  exportTransactionNFT(
    transaction: Reservation | Purchase
  ): Record<string, any> {
    const isReservation = 'slotId' in transaction;

    return {
      name: isReservation ? `Reservation #${transaction.id}` : `Purchase #${transaction.id}`,
      description: isReservation 
        ? `Verified reservation for ${(transaction as Reservation).participants} participants`
        : `Verified purchase of ${(transaction as Purchase).items.length} items`,
      image: '/assets/transaction-certificate.png',
      attributes: [
        { trait_type: 'Type', value: isReservation ? 'Reservation' : 'Purchase' },
        { trait_type: 'Total Price', value: transaction.totalPrice || (transaction as Purchase).total },
        { trait_type: 'Currency', value: transaction.currency },
        { trait_type: 'Created At', value: transaction.createdAt },
        { trait_type: 'Status', value: transaction.status || (transaction as Purchase).paymentStatus },
        { trait_type: 'Blockchain Hash', value: transaction.blockchainHash },
        { trait_type: 'Verification Chain Length', value: transaction.verificationChain.length }
      ],
      verification: {
        chain: transaction.verificationChain,
        isValid: this.verifyChain(transaction.verificationChain)
      },
      confirmationCode: (transaction as Purchase).confirmationCode
    };
  }
}

// Helper function to generate available slots for a date
export function generateDaySlots(
  date: string,
  config: ReservationWidgetConfig,
  existingReservations: Reservation[]
): ReservationSlot[] {
  const slots: ReservationSlot[] = [];
  const [startHour, startMin] = config.workingHours.start.split(':').map(Number);
  const [endHour, endMin] = config.workingHours.end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const slotDuration = config.slotDuration;

  for (let time = startMinutes; time < endMinutes; time += slotDuration) {
    const hour = Math.floor(time / 60);
    const min = time % 60;
    const slotStart = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    
    const nextTime = time + slotDuration;
    const nextHour = Math.floor(nextTime / 60);
    const nextMin = nextTime % 60;
    const slotEnd = `${nextHour.toString().padStart(2, '0')}:${nextMin.toString().padStart(2, '0')}`;

    const slotId = `slot-${date}-${slotStart}`;
    
    // Calculate booked count from existing reservations
    const booked = existingReservations
      .filter(r => r.slotId === slotId && r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.participants, 0);

    const isAvailable = booked < config.maxCapacityPerSlot;

    // Get pricing for this slot
    const pricing = config.pricingTiers[0]; // Simplified - could be time-based

    slots.push({
      id: slotId,
      date,
      startTime: slotStart,
      endTime: slotEnd,
      capacity: config.maxCapacityPerSlot,
      booked,
      price: pricing.price,
      currency: pricing.currency,
      isAvailable
    });
  }

  return slots;
}
