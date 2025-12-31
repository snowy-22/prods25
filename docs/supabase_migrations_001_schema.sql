-- Supabase Migration: Create Training & Achievement Tables
-- 2025-01-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL, -- ach-first-steps, ach-smart-home-master, etc.
  title TEXT NOT NULL,
  title_tr TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  points INTEGER NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,
  
  -- Blockchain fields
  blockchain_hash TEXT NOT NULL,
  verification_chain JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of VerificationNode
  
  -- Metadata
  is_publicly_displayed BOOLEAN DEFAULT true,
  custom_message TEXT,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Indexes
  CONSTRAINT unique_achievement_per_user UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_awarded_at ON achievements(awarded_at DESC);
CREATE INDEX idx_achievements_category ON achievements(category);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own achievements" 
  ON achievements FOR SELECT 
  USING (auth.uid() = user_id OR is_publicly_displayed = true);

CREATE POLICY "Users can update their own achievements" 
  ON achievements FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" 
  ON achievements FOR INSERT 
  WITH CHECK (true);

-- ============================================================================
-- TRAINING PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL, -- basic-001, api-001, etc.
  module_title_tr TEXT,
  
  -- Progress tracking
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  current_step_id TEXT,
  completed_steps TEXT[] DEFAULT '{}'::TEXT[],
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Quiz scores
  quiz_scores JSONB DEFAULT '{}'::jsonb,
  
  -- Rewards
  achievements_earned TEXT[] DEFAULT '{}'::TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_training_per_user UNIQUE(user_id, module_id)
);

CREATE INDEX idx_training_user_id ON training_progress(user_id);
CREATE INDEX idx_training_completed ON training_progress(completed_at DESC NULLS LAST);

-- Enable RLS
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own training progress" 
  ON training_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
  ON training_progress FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- RESERVATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Reservation details
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL,
  participants INTEGER NOT NULL CHECK (participants > 0),
  
  -- Customer information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Pricing
  price_per_slot DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  
  -- Blockchain
  blockchain_hash TEXT NOT NULL,
  verification_chain JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Enable RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations" 
  ON reservations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations" 
  ON reservations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PURCHASES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Purchase details
  confirmation_code TEXT NOT NULL UNIQUE,
  items JSONB NOT NULL, -- Array of {productId, name, price, quantity}
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Shipping
  shipping_method TEXT NOT NULL, -- 'standard', 'express'
  shipping_cost DECIMAL(10, 2) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_zipcode TEXT NOT NULL,
  
  -- Billing
  billing_name TEXT NOT NULL,
  billing_email TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  
  -- Payment
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'crypto', 'bank', 'cash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  stripe_payment_id TEXT,
  
  -- Order status
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  
  -- Blockchain
  blockchain_hash TEXT NOT NULL,
  verification_chain JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_confirmation_code ON purchases(confirmation_code);
CREATE INDEX idx_purchases_created_at ON purchases(created_at DESC);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases" 
  ON purchases FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases" 
  ON purchases FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ADMIN LOGS TABLE (Audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'verify_achievement', 'cancel_reservation', 'refund_purchase', etc.
  target_table TEXT NOT NULL, -- 'achievements', 'reservations', 'purchases'
  target_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);

-- Enable RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view logs" 
  ON admin_logs FOR SELECT 
  USING (auth.uid() = admin_id);

-- ============================================================================
-- PRODUCTS TABLE (For e-commerce)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL UNIQUE, -- prod-1, prod-2, etc.
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_products_product_id ON products(product_id);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" 
  ON products FOR SELECT 
  USING (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for achievements
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for training_progress
CREATE TRIGGER update_training_progress_updated_at BEFORE UPDATE ON training_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for reservations
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for purchases
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS (For analytics & admin dashboard)
-- ============================================================================

-- Achievement stats per user
CREATE OR REPLACE VIEW achievement_stats AS
SELECT 
  user_id,
  COUNT(*) as total_achievements,
  SUM(points) as total_points,
  COUNT(DISTINCT category) as unique_categories,
  MAX(awarded_at) as last_achievement_date
FROM achievements
GROUP BY user_id;

-- Training completion stats
CREATE OR REPLACE VIEW training_stats AS
SELECT 
  user_id,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_modules,
  COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END)::FLOAT / COUNT(*) * 100 as completion_percentage,
  MAX(completed_at) as last_completed_date
FROM training_progress
GROUP BY user_id;

-- Sales summary
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as average_order_value,
  COUNT(DISTINCT user_id) as unique_customers
FROM purchases
WHERE payment_status = 'completed'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- ============================================================================
-- INITIAL DATA (Optional demo products)
-- ============================================================================

INSERT INTO products (product_id, name, description, price, stock, category) 
VALUES 
  ('prod-1', 'Demo Product', 'A demo product for testing', 100.00, 50, 'demo'),
  ('prod-2', 'Premium Service', 'Premium service offering', 250.00, 20, 'service')
ON CONFLICT (product_id) DO NOTHING;

-- ============================================================================
-- COMMENTS (for documentation)
-- ============================================================================

COMMENT ON TABLE achievements IS 'User achievements with blockchain verification chains';
COMMENT ON TABLE training_progress IS 'User training module progress tracking';
COMMENT ON TABLE reservations IS 'Reservation bookings with blockchain hashing';
COMMENT ON TABLE purchases IS 'E-commerce purchases with payment tracking';
COMMENT ON TABLE admin_logs IS 'Audit trail for admin actions';
COMMENT ON TABLE products IS 'Product catalog for e-commerce';

-- ============================================================================
-- GRANT PERMISSIONS (if needed)
-- ============================================================================

-- Anon user permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON products TO anon;

-- Authenticated user permissions  
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON achievement_stats, training_stats, sales_summary TO authenticated;
