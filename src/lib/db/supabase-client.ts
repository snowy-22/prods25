import { createClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase instance (for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  title: string;
  title_tr: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  category: string;
  icon?: string;
  blockchain_hash: string;
  verification_chain: VerificationNode[];
  is_publicly_displayed: boolean;
  custom_message?: string;
  awarded_at: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationNode {
  id: string;
  timestamp: string;
  hash: string;
  previousHash: string;
  hmacSignature: string;
}

export interface TrainingProgress {
  id: string;
  user_id: string;
  module_id: string;
  module_title_tr?: string;
  started_at: string;
  completed_at?: string;
  current_step_id?: string;
  completed_steps: string[];
  progress: number;
  quiz_scores: Record<string, number>;
  achievements_earned: string[];
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  user_id: string;
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
  status: 'pending' | 'confirmed' | 'cancelled';
  blockchain_hash: string;
  verification_chain: VerificationNode[];
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  confirmation_code: string;
  items: PurchaseItem[];
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
  payment_status: 'pending' | 'completed' | 'failed';
  stripe_payment_id?: string;
  order_status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  blockchain_hash: string;
  verification_chain: VerificationNode[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Product {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  stock: number;
  image_url?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_table: string;
  target_id: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  reason?: string;
  created_at: string;
}

export interface AchievementStats {
  user_id: string;
  total_achievements: number;
  total_points: number;
  unique_categories: number;
  last_achievement_date: string;
}

export interface TrainingStats {
  user_id: string;
  total_modules: number;
  completed_modules: number;
  completion_percentage: number;
  last_completed_date: string;
}

export interface SalesSummary {
  sale_date: string;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  unique_customers: number;
}

// ============================================================================
// DATABASE QUERY HELPERS
// ============================================================================

/**
 * Fetch user achievement statistics
 */
export async function getAchievementStats(userId: string): Promise<AchievementStats | null> {
  const { data, error } = await supabase
    .from('achievement_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) console.error('Error fetching achievement stats:', error);
  return data;
}

/**
 * Fetch user training statistics
 */
export async function getTrainingStats(userId: string): Promise<TrainingStats | null> {
  const { data, error } = await supabase
    .from('training_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) console.error('Error fetching training stats:', error);
  return data;
}

/**
 * Fetch all products
 */
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch single product by ID
 */
export async function getProduct(productId: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('product_id', productId)
    .single();

  if (error) console.error('Error fetching product:', error);
  return data;
}

/**
 * Check if achievement code already exists
 */
export async function achievementExists(
  userId: string,
  achievementId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .limit(1);

  if (error) {
    console.error('Error checking achievement:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Get all sales data for admin dashboard
 */
export async function getSalesSummary(): Promise<SalesSummary[]> {
  const { data, error } = await supabase
    .from('sales_summary')
    .select('*');

  if (error) {
    console.error('Error fetching sales summary:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's current session
 */
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Listen to real-time database changes
 */
export function subscribeToAchievements(
  userId: string,
  callback: (achievements: Achievement[]) => void
) {
  return supabase
    .from(`achievements:user_id=eq.${userId}`)
    .on('*', (payload) => {
      console.log('Achievement change:', payload);
      callback(payload.new as Achievement[]);
    })
    .subscribe();
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class SupabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export function handleSupabaseError(error: any): never {
  if (error.message.includes('PGRST')) {
    throw new SupabaseError('Database error', 'DB_ERROR');
  }
  throw new SupabaseError(error.message || 'Unknown error');
}
