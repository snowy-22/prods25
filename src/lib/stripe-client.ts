import Stripe from 'stripe';

/**
 * Initialize Stripe API client
 */
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Stripe is optional - allow missing key for development
export const isStripeAvailable = !!stripeSecretKey;

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia',
      typescript: true,
    })
  : null;

/**
 * Create checkout session for purchases
 */
export async function createCheckoutSession(
  customerId: string,
  items: Array<{
    name: string;
    price: number; // in cents
    quantity: number;
  }>,
  metadata: Record<string, string> = {}
) {
  if (!isStripeAvailable || !stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    // Convert items to Stripe line items
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchases/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchases/cancel`,
      metadata,
    });

    console.log('✅ Checkout session created:', session.id);
    return session;
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieve checkout session details
 */
export async function getCheckoutSession(sessionId: string) {
  if (!isStripeAvailable || !stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error('❌ Error retrieving checkout session:', error);
    throw error;
  }
}

/**
 * Create payment intent (for more control)
 */
export async function createPaymentIntent(
  amount: number, // in cents
  customerId: string,
  metadata: Record<string, string> = {}
) {
  if (!isStripeAvailable || !stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      payment_method_types: ['card'],
      metadata,
    });

    console.log('✅ Payment intent created:', intent.id);
    return intent;
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Confirm payment intent
 */
export async function confirmPaymentIntent(
  intentId: string,
  paymentMethodId: string
) {
  if (!isStripeAvailable || !stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const intent = await stripe.paymentIntents.confirm(intentId, {
      payment_method: paymentMethodId,
    });

    return intent;
  } catch (error) {
    console.error('❌ Error confirming payment intent:', error);
    throw error;
  }
}

/**
 * Get or create Stripe customer
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name: string
) {
  if (!isStripeAvailable || !stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    // Search for existing customer with this email
    const customers = await stripe.customers.list({ email, limit: 1 });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    console.log('✅ Stripe customer created:', customer.id);
    return customer;
  } catch (error) {
    console.error('❌ Error managing customer:', error);
    throw error;
  }
}

/**
 * Create invoice from line items
 */
export async function createInvoice(
  customerId: string,
  lineItems: Array<{
    description: string;
    amount: number; // in cents
    quantity?: number;
  }>,
  metadata: Record<string, string> = {}
) {
  try {
    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      metadata,
    });

    // Add line items
    for (const item of lineItems) {
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: item.amount,
        description: item.description,
        quantity: item.quantity || 1,
      });
    }

    // Finalize and send
    await stripe.invoices.finalizeInvoice(invoice.id);

    console.log('✅ Invoice created:', invoice.id);
    return invoice;
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    throw error;
  }
}

/**
 * Refund payment
 */
export async function refundPayment(
  chargeId: string,
  amount?: number // optional partial refund in cents
) {
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
