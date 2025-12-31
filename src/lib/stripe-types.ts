/**
 * Stripe Integration Types & Constants
 */

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
  sessionId: string;
  url?: string;
  error?: string;
}

/**
 * Stripe payment intent response
 */
export interface PaymentIntentResponse {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
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
export const STRIPE_CONFIG = {
  // Currency
  CURRENCY: 'usd',

  // Prices (in cents)
  MIN_AMOUNT: 100, // $1.00
  MAX_AMOUNT: 99999900, // $999,999.00

  // Tax rates
  TAX_RATE: 0.18, // 18%

  // Shipping costs (in cents)
  SHIPPING: {
    STANDARD: 300, // $3.00
    EXPRESS: 800, // $8.00
    FREE_OVER: 10000, // Free shipping over $100
  },

  // Webhook events to listen
  WEBHOOK_EVENTS: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'charge.refunded',
    'invoice.payment_succeeded',
    'customer.subscription.created',
    'customer.subscription.deleted',
  ],

  // Retry policy
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
};

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
export const STRIPE_ERRORS = {
  INVALID_AMOUNT: 'Amount must be between $1.00 and $999,999.00',
  INVALID_CURRENCY: 'Currency must be USD',
  PAYMENT_FAILED: 'Payment processing failed. Please try again.',
  CARD_DECLINED: 'Card was declined. Please use a different card.',
  EXPIRED_CARD: 'Card has expired.',
  INSUFFICIENT_FUNDS: 'Insufficient funds. Please use a different card.',
  INVALID_SIGNATURE: 'Invalid webhook signature.',
  WEBHOOK_ERROR: 'Webhook processing failed.',
} as const;

/**
 * Success messages
 */
export const STRIPE_SUCCESS = {
  PAYMENT_COMPLETED: 'Payment completed successfully.',
  CHECKOUT_CREATED: 'Checkout session created.',
  REFUND_PROCESSED: 'Refund has been processed.',
} as const;
