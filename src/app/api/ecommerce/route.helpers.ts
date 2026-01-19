import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase-client';
import {
  createReservation,
  confirmReservation,
  cancelReservation,
  getUserReservations,
  checkSlotAvailability,
  createPurchase,
  completePurchasePayment,
  refundPurchase,
  updateOrderStatus,
  getUserPurchases,
  getPurchaseByConfirmationCode,
} from '@/lib/db/ecommerce';

// ============================================================================
// POST /api/reservations
// Create new reservation
// ============================================================================
export async function createNewReservation(req: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate availability
    const available = await checkSlotAvailability(
      body.reservation_date,
      body.start_time,
      body.end_time,
      body.participants
    );

    if (!available) {
      return NextResponse.json(
        { error: 'Slot not available' },
        { status: 409 }
      );
    }

    const reservation = await createReservation(user.id, body);

    if (!reservation) {
      return NextResponse.json(
        { error: 'Failed to create reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, reservation },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ POST /api/reservations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/reservations/:id/confirm
// Confirm reservation
// ============================================================================
export async function confirmRes(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservation = await confirmReservation(id);

    if (!reservation) {
      return NextResponse.json(
        { error: 'Failed to confirm reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reservation }, { status: 200 });
  } catch (error) {
    console.error('❌ POST /api/reservations/:id/confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/reservations/:id
// Cancel reservation
// ============================================================================
export async function cancelRes(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { reason } = body;

    const success = await cancelReservation(id, reason);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ DELETE /api/reservations/:id error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/reservations?userId=...
// Get user's reservations
// ============================================================================
export async function getReservations(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const reservations = await getUserReservations(userId);

    return NextResponse.json({ reservations }, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/reservations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/reservations/available-slots
// Check slot availability
// ============================================================================
export async function checkAvailability(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const startTime = searchParams.get('start_time');
    const endTime = searchParams.get('end_time');
    const participants = parseInt(searchParams.get('participants') || '1');

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const available = await checkSlotAvailability(
      date,
      startTime,
      endTime,
      participants
    );

    return NextResponse.json({ available }, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/reservations/available-slots error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PURCHASES ENDPOINTS
// ============================================================================

// ============================================================================
// POST /api/purchases
// Create new purchase
// ============================================================================
export async function createNewPurchase(req: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid items array' },
        { status: 400 }
      );
    }

    const purchase = await createPurchase(user.id, body);

    if (!purchase) {
      return NextResponse.json(
        { error: 'Failed to create purchase' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, purchase },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ POST /api/purchases error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/purchases/:id/complete-payment
// Complete purchase payment
// ============================================================================
export async function completePay(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { stripe_payment_id } = body;

    const purchase = await completePurchasePayment(id, stripe_payment_id);

    if (!purchase) {
      return NextResponse.json(
        { error: 'Failed to complete payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, purchase }, { status: 200 });
  } catch (error) {
    console.error('❌ POST /api/purchases/:id/complete-payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/purchases/:id/refund
// Refund purchase
// ============================================================================
export async function refundPay(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason required' },
        { status: 400 }
      );
    }

    const success = await refundPurchase(id, reason);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to refund purchase' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ POST /api/purchases/:id/refund error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/purchases/:id/status
// Update order status
// ============================================================================
export async function updateStatus(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { order_status } = body;

    if (!order_status) {
      return NextResponse.json(
        { error: 'order_status required' },
        { status: 400 }
      );
    }

    const purchase = await updateOrderStatus(
      id,
      order_status
    );

    if (!purchase) {
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, purchase }, { status: 200 });
  } catch (error) {
    console.error('❌ PATCH /api/purchases/:id/status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/purchases?userId=...
// Get user's purchases
// ============================================================================
export async function getPurchases(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const purchases = await getUserPurchases(userId);

    return NextResponse.json({ purchases }, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/purchases error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/purchases/code/:confirmationCode
// Get purchase by confirmation code
// ============================================================================
export async function getPurchaseByCode(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const purchase = await getPurchaseByConfirmationCode(code);

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ purchase }, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/purchases/code/:code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
