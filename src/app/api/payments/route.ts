import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  createCheckoutSession,
  getCheckoutSession,
  createPaymentIntent,
  getOrCreateCustomer,
  verifyWebhookSignature,
  handleWebhookEvent,
  refundPayment,
} from '@/lib/stripe-client';
import { supabase } from '@/lib/db/supabase-client';
import {
  completePurchasePayment,
  refundPurchase,
} from '@/lib/db/ecommerce';

// Check if Stripe is configured
const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Helper to return 503 if Stripe not configured
function stripeNotAvailable() {
  return NextResponse.json(
    { error: 'Payment service is not configured', configured: false },
    { status: 503 }
  );
}

// ============================================================================
// POST /api/payments/checkout-session
// Create Stripe checkout session for purchase
// ============================================================================
export async function createSession(req: NextRequest) {
  if (!isStripeConfigured) {
    return stripeNotAvailable();
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, purchaseId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid items' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(
      user.id,
      user.email || '',
      user.user_metadata?.name || 'Customer'
    );

    // Create checkout session
    const session = await createCheckoutSession(customer.id, items, {
      purchaseId: purchaseId || '',
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        sessionId: session.id,
        url: session.url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ POST /api/payments/checkout-session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/payments/checkout-session/:sessionId
// Retrieve checkout session details
// ============================================================================
export async function getSession(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getCheckoutSession(params.sessionId);

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/payments/checkout-session/:sessionId error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/payments/payment-intent
// Create payment intent for manual confirmation
// ============================================================================
export async function createIntent(req: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, purchaseId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(
      user.id,
      user.email || '',
      user.user_metadata?.name || 'Customer'
    );

    // Create payment intent (amount in cents)
    const intent = await createPaymentIntent(
      Math.round(amount * 100),
      customer.id,
      {
        purchaseId: purchaseId || '',
        userId: user.id,
      }
    );

    return NextResponse.json(
      {
        success: true,
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ POST /api/payments/payment-intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/payments/confirm-intent
// Confirm payment intent with payment method
// ============================================================================
export async function confirmIntent(req: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { intentId, paymentMethodId, purchaseId } = body;

    if (!intentId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Note: Confirmation should be done on frontend for PCI compliance
    // This endpoint is for reference only
    return NextResponse.json(
      {
        error: 'Use Stripe.js for payment confirmation on the frontend',
      },
      { status: 403 }
    );
  } catch (error) {
    console.error('❌ POST /api/payments/confirm-intent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/payments/webhook
// Stripe webhook endpoint
// ============================================================================
export async function handleWebhook(req: NextRequest) {
  let event: Stripe.Event;

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    event = verifyWebhookSignature(body, signature, webhookSecret);

    console.log('✅ Webhook event received:', event.type);

    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const purchaseId = intent.metadata?.purchaseId;
        const userId = intent.metadata?.userId;

        if (purchaseId) {
          // Update purchase in database
          const success = await completePurchasePayment(
            purchaseId,
            intent.charges.data[0]?.id
          );

          if (success) {
            console.log(
              '✅ Purchase updated after payment success:',
              purchaseId
            );
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const purchaseId = intent.metadata?.purchaseId;

        if (purchaseId) {
          // Optionally mark purchase as failed in database
          console.log('❌ Payment failed for purchase:', purchaseId);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💰 Charge refunded:', charge.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Webhook error:', error.message);
    return NextResponse.json(
      { error: 'Webhook failed: ' + error.message },
      { status: 400 }
    );
  }
}

// ============================================================================
// POST /api/payments/refund
// Process refund for failed/cancelled order
// ============================================================================
export async function processRefund(req: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { chargeId, purchaseId, reason, amount } = body;

    if (!chargeId) {
      return NextResponse.json(
        { error: 'Missing chargeId' },
        { status: 400 }
      );
    }

    // Process Stripe refund
    const refund = await refundPayment(
      chargeId,
      amount ? Math.round(amount * 100) : undefined
    );

    // Update purchase in database
    if (purchaseId) {
      await refundPurchase(purchaseId, reason || 'Customer requested refund');
    }

    return NextResponse.json(
      {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ POST /api/payments/refund error:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/payments/status
// Check payment status
// ============================================================================
export async function getPaymentStatus(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const intentId = searchParams.get('intentId');

    if (!sessionId && !intentId) {
      return NextResponse.json(
        { error: 'sessionId or intentId required' },
        { status: 400 }
      );
    }

    // In production, fetch from Stripe and check status
    // For now, return a placeholder response

    return NextResponse.json(
      {
        status: 'pending',
        message: 'Check status in your Stripe dashboard',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ GET /api/payments/status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Custom route handler for webhook (separate from main routes)
// ============================================================================
export const POST = async (req: NextRequest) => {
  const path = new URL(req.url).pathname;

  if (path.endsWith('/webhook')) {
    return handleWebhook(req);
  } else if (path.includes('checkout-session')) {
    return createSession(req);
  } else if (path.includes('payment-intent') && req.method === 'POST') {
    return createIntent(req);
  } else if (path.includes('refund')) {
    return processRefund(req);
  } else if (path.includes('confirm-intent')) {
    return confirmIntent(req);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
};

export const GET = async (req: NextRequest) => {
  const path = new URL(req.url).pathname;

  if (path.includes('checkout-session')) {
    const sessionId = path.split('/').pop();
    if (sessionId && sessionId !== 'checkout-session') {
      return getSession(req, { params: { sessionId } });
    }
  } else if (path.includes('status')) {
    return getPaymentStatus(req);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
};
