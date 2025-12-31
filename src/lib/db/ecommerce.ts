import { supabase, Reservation, Purchase, VerificationNode, SupabaseError } from './supabase-client';
import { ECommerceBlockchain } from '../ecommerce-system';

/**
 * Create a new reservation
 */
export async function createReservation(
  userId: string,
  reservationData: {
    reservation_date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    participants: number;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    price_per_slot: number;
    total_price: number;
  }
): Promise<Reservation | null> {
  try {
    const blockchain = new ECommerceBlockchain();
    const hash = blockchain.generateHash(JSON.stringify(reservationData));
    const node = blockchain.createReservationNode(reservationData);

    const { data, error } = await supabase
      .from('reservations')
      .insert([
        {
          user_id: userId,
          ...reservationData,
          blockchain_hash: hash,
          verification_chain: [
            {
              id: node.id,
              timestamp: node.timestamp,
              hash: node.hash,
              previousHash: '0',
              hmacSignature: node.hmacSignature,
            },
          ],
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_INSERT_ERROR');
    
    console.log('✅ Reservation created:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error creating reservation:', error);
    return null;
  }
}

/**
 * Confirm reservation and update blockchain
 */
export async function confirmReservation(
  reservationId: string
): Promise<Reservation | null> {
  try {
    const { data: current, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError) throw new SupabaseError(fetchError.message, 'DB_FETCH_ERROR');

    const blockchain = new ECommerceBlockchain();
    const newNode = blockchain.createReservationNode(current);
    
    // Add to verification chain
    const newChain = [
      ...(current.verification_chain || []),
      {
        id: newNode.id,
        timestamp: newNode.timestamp,
        hash: newNode.hash,
        previousHash: current.blockchain_hash,
        hmacSignature: newNode.hmacSignature,
      },
    ];

    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'confirmed',
        verification_chain: newChain,
      })
      .eq('id', reservationId)
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    console.log('✅ Reservation confirmed:', reservationId);
    return data;
  } catch (error) {
    console.error('❌ Error confirming reservation:', error);
    return null;
  }
}

/**
 * Cancel reservation
 */
export async function cancelReservation(
  reservationId: string,
  reason?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    // Log admin action if reason provided
    if (reason) {
      await logAdminAction('cancel_reservation', 'reservations', reservationId, null, reason);
    }
    
    console.log('✅ Reservation cancelled:', reservationId);
    return true;
  } catch (error) {
    console.error('❌ Error cancelling reservation:', error);
    return false;
  }
}

/**
 * Get user's reservations
 */
export async function getUserReservations(userId: string): Promise<Reservation[]> {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('reservation_date', { ascending: false });

    if (error) throw new SupabaseError(error.message, 'DB_FETCH_ERROR');
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching reservations:', error);
    return [];
  }
}

/**
 * Check slot availability
 */
export async function checkSlotAvailability(
  date: string,
  startTime: string,
  endTime: string,
  requiredCapacity: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('participants')
      .eq('reservation_date', date)
      .eq('start_time', startTime)
      .eq('status', 'confirmed');

    if (error) throw new SupabaseError(error.message, 'DB_FETCH_ERROR');

    const totalBooked = (data || []).reduce((sum, r) => sum + r.participants, 0);
    const available = 5 - totalBooked; // Assuming 5 capacity per slot

    return available >= requiredCapacity;
  } catch (error) {
    console.error('❌ Error checking availability:', error);
    return false;
  }
}

// ============================================================================
// PURCHASE OPERATIONS
// ============================================================================

/**
 * Create a new purchase
 */
export async function createPurchase(
  userId: string,
  purchaseData: {
    items: Array<{ productId: string; name: string; price: number; quantity: number }>;
    subtotal: number;
    tax: number;
    total: number;
    shipping_method: 'standard' | 'express';
    shipping_cost: number;
    shipping_address: string;
    shipping_city: string;
    shipping_zipcode: string;
    billing_name: string;
    billing_email: string;
    billing_address: string;
    payment_method: 'card' | 'crypto' | 'bank' | 'cash';
  }
): Promise<Purchase | null> {
  try {
    const blockchain = new ECommerceBlockchain();
    const hash = blockchain.generateHash(JSON.stringify(purchaseData));
    const node = blockchain.createPurchaseNode(purchaseData);
    const confirmationCode = blockchain.generateConfirmationCode();

    const { data, error } = await supabase
      .from('purchases')
      .insert([
        {
          user_id: userId,
          confirmation_code: confirmationCode,
          ...purchaseData,
          blockchain_hash: hash,
          verification_chain: [
            {
              id: node.id,
              timestamp: node.timestamp,
              hash: node.hash,
              previousHash: '0',
              hmacSignature: node.hmacSignature,
            },
          ],
          payment_status: 'pending',
          order_status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_INSERT_ERROR');
    
    console.log('✅ Purchase created:', data.confirmation_code);
    return data;
  } catch (error) {
    console.error('❌ Error creating purchase:', error);
    return null;
  }
}

/**
 * Complete payment for purchase
 */
export async function completePurchasePayment(
  purchaseId: string,
  stripePaymentId?: string
): Promise<Purchase | null> {
  try {
    const { data: current, error: fetchError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (fetchError) throw new SupabaseError(fetchError.message, 'DB_FETCH_ERROR');

    const blockchain = new ECommerceBlockchain();
    const newNode = blockchain.createPurchaseNode(current);
    
    // Add to verification chain
    const newChain = [
      ...(current.verification_chain || []),
      {
        id: newNode.id,
        timestamp: newNode.timestamp,
        hash: newNode.hash,
        previousHash: current.blockchain_hash,
        hmacSignature: newNode.hmacSignature,
      },
    ];

    const { data, error } = await supabase
      .from('purchases')
      .update({
        payment_status: 'completed',
        order_status: 'confirmed',
        stripe_payment_id: stripePaymentId || null,
        verification_chain: newChain,
      })
      .eq('id', purchaseId)
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    console.log('✅ Payment completed:', purchaseId);
    return data;
  } catch (error) {
    console.error('❌ Error completing payment:', error);
    return null;
  }
}

/**
 * Refund purchase
 */
export async function refundPurchase(
  purchaseId: string,
  reason: string
): Promise<boolean> {
  try {
    const { data: current } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    // Log refund action
    await logAdminAction(
      'refund_purchase',
      'purchases',
      purchaseId,
      { payment_status: current.payment_status },
      reason
    );

    const { error } = await supabase
      .from('purchases')
      .update({
        payment_status: 'failed',
        order_status: 'cancelled',
      })
      .eq('id', purchaseId);

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    console.log('✅ Purchase refunded:', purchaseId);
    return true;
  } catch (error) {
    console.error('❌ Error refunding purchase:', error);
    return false;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  purchaseId: string,
  newStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
): Promise<Purchase | null> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .update({ order_status: newStatus })
      .eq('id', purchaseId)
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    return data;
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return null;
  }
}

/**
 * Get user's purchases
 */
export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new SupabaseError(error.message, 'DB_FETCH_ERROR');
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching purchases:', error);
    return [];
  }
}

/**
 * Find purchase by confirmation code
 */
export async function getPurchaseByConfirmationCode(
  code: string
): Promise<Purchase | null> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('confirmation_code', code)
      .single();

    if (error) {
      console.warn('Purchase not found with code:', code);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching purchase:', error);
    return null;
  }
}

/**
 * Get all reservations and purchases for admin
 */
export async function getAdminSalesData() {
  try {
    const [reservations, purchases] = await Promise.all([
      supabase.from('reservations').select('*').order('created_at', { ascending: false }),
      supabase.from('purchases').select('*').order('created_at', { ascending: false }),
    ]);

    return {
      reservations: reservations.data || [],
      purchases: purchases.data || [],
      totalReservations: reservations.data?.length || 0,
      totalPurchases: purchases.data?.length || 0,
    };
  } catch (error) {
    console.error('❌ Error fetching sales data:', error);
    return { reservations: [], purchases: [], totalReservations: 0, totalPurchases: 0 };
  }
}

// ============================================================================
// ADMIN LOGGING
// ============================================================================

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(
  action: string,
  targetTable: string,
  targetId: string,
  oldData?: Record<string, any>,
  reason?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('admin_logs').insert([
      {
        admin_id: '00000000-0000-0000-0000-000000000000', // Placeholder - should be actual admin ID
        action,
        target_table: targetTable,
        target_id: targetId,
        old_data: oldData || null,
        reason,
      },
    ]);

    if (error) throw new SupabaseError(error.message, 'DB_INSERT_ERROR');
    
    console.log('✅ Admin action logged:', action);
    return true;
  } catch (error) {
    console.error('❌ Error logging admin action:', error);
    return false;
  }
}

/**
 * Get admin logs for audit trail
 */
export async function getAdminLogs(limit: number = 100) {
  try {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new SupabaseError(error.message, 'DB_FETCH_ERROR');
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching admin logs:', error);
    return [];
  }
}
