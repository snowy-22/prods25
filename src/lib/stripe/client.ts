/**
 * Stripe Client Library
 * Frontend Stripe.js integration for CanvasFlow
 */



/**
 * Get Stripe instance (singleton)
 */
// Stripe client disabled for now; return null to avoid runtime usage
export type Stripe = null;
export type StripeElements = null;

export const getStripeClient = async (): Promise<null> => null;

/**
 * Create Stripe Elements instance
 */
export async function createElements(): Promise<StripeElements> {
  return null;
}

/**
 * Create payment intent for a cart
 */
export async function createPaymentIntent(): Promise<null> {
  return null;
}

/**
 * Confirm card payment
 */
export async function confirmCardPayment(): Promise<null> {
  return null;
}

/**
 * Confirm payment with Stripe Elements
 */
export async function confirmPayment(): Promise<null> {
  return null;
}

/**
 * Get payment intent status
 */
export async function getPaymentIntentStatus(): Promise<null> {
  return null;
}

/**
 * Confirm payment on server side
 */
export async function confirmPaymentServer(): Promise<{ success: boolean; message: string }> {
  return { success: false, message: 'stripe-disabled' };
}

/**
 * Create customer
 */
export async function createCustomer(): Promise<{ customerId: string }> {
  return { customerId: 'stripe-disabled' };
}

/**
 * Save payment method to customer
 */
export async function savePaymentMethod(
  customerId: string,
  paymentMethodId: string,
  isDefault: boolean = false
): Promise<{ success: boolean }> {
  return { success: false };
}

/**
 * Get saved payment methods for customer
 */
export async function getPaymentMethods(
  customerId: string
): Promise<any[]> {
  return [];
}

/**
 * Refund charge
 */
export async function refundCharge(
  chargeId: string,
  amount?: number
): Promise<{ success: boolean; refundId: string }> {
  return { success: false, refundId: 'stripe-disabled' };
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<any[]> {
  return [];
}

/**
 * Format amount for Stripe (convert to cents)
 */
export function formatAmountForStripe(
  amount: number,
  currency: string = 'usd'
): number {
  // Most currencies use 2 decimal places
  // Some currencies use 0 decimal places (JPY, KRW, etc)
  const zeroDecimalCurrencies = [
    'bif',
    'clp',
    'djf',
    'gnf',
    'jpy',
    'kmf',
    'krw',
    'mga',
    'pyg',
    'rwf',
    'vnd',
    'vuu',
    'xaf',
    'xof',
    'xpf',
  ];

  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  } else {
    return Math.round(amount * 100);
  }
}

/**
 * Format amount for display
 */
export function formatAmount(
  amount: number,
  currency: string = 'USD'
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  return formatter.format(amount / 100);
}

