// Stripe removed: export stubs to avoid build-time dependency
export const isStripeAvailable = false;

type LineItem = { name: string; price: number; quantity: number };

export async function createCheckoutSession(
  _customerId: string,
  _items: Array<LineItem>,
  _metadata: Record<string, string> = {}
): Promise<{ id: string; url: string | null }> {
  throw new Error('payments-disabled');
}

export async function getCheckoutSession(
  _sessionId: string
): Promise<unknown> {
  throw new Error('payments-disabled');
}

export async function createPaymentIntent(
  _amount: number,
  _customerId: string,
  _metadata: Record<string, string> = {}
): Promise<{ id: string; client_secret?: string }> {
  throw new Error('payments-disabled');
}

export async function confirmPaymentIntent(
  _intentId: string,
  _paymentMethodId: string
): Promise<unknown> {
  throw new Error('payments-disabled');
}

export async function getOrCreateCustomer(
  _userId: string,
  _email: string,
  _name: string
): Promise<{ id: string }> {
  throw new Error('payments-disabled');
}

export async function createInvoice(
  _customerId: string,
  _lineItems: Array<{ description: string; amount: number; quantity?: number }>,
  _metadata: Record<string, string> = {}
): Promise<{ id: string }> {
  throw new Error('payments-disabled');
}

export async function refundPayment(
  _chargeId: string,
  _amount?: number
): Promise<{ id: string; amount: number }> {
  throw new Error('payments-disabled');
}

/**
 * Refund payment
 */
export async function refundPayment(
  chargeId: string,
  amount?: number // optional partial refund in cents
) {
  if (!stripe) throw new Error('Stripe not initialized');
  
  try {
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount,
    });

    console.log('✅ Refund created:', refund.id);
    return refund;
  } catch (error) {
    console.error('❌ Error refunding payment:', error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): any {
  if (!stripe) throw new Error('Stripe not initialized');
  
  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    return event;
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    throw error;
  }
}

/**
 * Handle common webhook events
 */
export const handleWebhookEvent = {
  'payment_intent.succeeded': async (intent: Stripe.PaymentIntent) => {
    console.log('✅ Payment succeeded:', intent.id);
    return {
      type: 'payment_intent.succeeded',
      paymentIntentId: intent.id,
      amount: intent.amount,
      status: intent.status,
    };
  },

  'payment_intent.payment_failed': async (intent: Stripe.PaymentIntent) => {
    console.log('❌ Payment failed:', intent.id, intent.last_payment_error);
    return {
      type: 'payment_intent.payment_failed',
      paymentIntentId: intent.id,
      error: intent.last_payment_error?.message,
    };
  },

  'charge.refunded': async (charge: Stripe.Charge) => {
    console.log('💰 Charge refunded:', charge.id);
    return {
      type: 'charge.refunded',
      chargeId: charge.id,
      refundedAmount: charge.amount_refunded,
    };
  },

  'invoice.payment_succeeded': async (invoice: Stripe.Invoice) => {
    console.log('✅ Invoice payment succeeded:', invoice.id);
    return {
      type: 'invoice.payment_succeeded',
      invoiceId: invoice.id,
      paidAmount: invoice.paid,
    };
  },

  'customer.subscription.created': async (subscription: Stripe.Subscription) => {
    console.log('✅ Subscription created:', subscription.id);
    return {
      type: 'customer.subscription.created',
      subscriptionId: subscription.id,
      status: subscription.status,
    };
  },
};

/**
 * Create subscription (for future use)
 */
export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata: Record<string, string> = {}
) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
    });

    console.log('✅ Subscription created:', subscription.id);
    return subscription;
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    throw error;
  }
}

/**
 * List customer's payment methods
 */
export async function getCustomerPaymentMethods(customerId: string) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  } catch (error) {
    console.error('❌ Error fetching payment methods:', error);
    throw error;
  }
}
