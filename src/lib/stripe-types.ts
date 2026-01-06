// Payments disabled: neutral placeholders only

/**
 * Payment method types accepted
 */
export type PaymentMethodType = 'card' | 'bank_account' | 'wallet';

/**
 * Payment status
 */
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled';

/**
 * Order status
 */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned';

/**
 * Stripe checkout session response
 */
export interface CheckoutSessionResponse {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

/**
 * Stripe payment intent response
 */
export interface PaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

/**
 * Webhook event payload
 */
export interface WebhookPayload {
  type: string;
  paymentIntentId?: string;
  amount?: number;
  status?: PaymentStatus;
  error?: string;
}

/**
 * Refund request
 */
export interface RefundRequest {
  chargeId: string;
  purchaseId: string;
  reason: string;
  amount?: number;
}

/**
 * Refund response
 */
export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  error?: string;
}

/**
 * Payment configuration
 */
export const STRIPE_CONFIG = {} as const;

/**
 * Helper to format price for display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Helper to convert price to cents
 */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Helper to convert cents to dollars
 */
export function toDollars(cents: number): number {
  return cents / 100;
}

/**
 * Error messages for Stripe
 */
export const STRIPE_ERRORS = {} as const;

/**
 * Success messages
 */
export const STRIPE_SUCCESS = {} as const;
