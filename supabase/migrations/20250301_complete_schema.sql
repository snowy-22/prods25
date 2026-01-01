-- CanvasFlow Complete Database Schema
-- Migration: Complete application schema with RLS policies
-- Created: 2025-03-01
-- Description: Full database setup for production deployment

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Items Table (spaces, devices, widgets, folders, media)
CREATE TABLE IF NOT EXISTS public.content_items (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT,
    content TEXT,
    icon TEXT,
    parent_id TEXT,
    assigned_space_id TEXT,
    is_deletable BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 0,
    
    -- Layout properties
    x FLOAT,
    y FLOAT,
    width FLOAT,
    height FLOAT,
    grid_span_col INTEGER,
    grid_span_row INTEGER,
    layout_mode TEXT,
    
    -- Space-specific properties
    space_type TEXT CHECK (space_type IN ('residential', 'commercial', 'industrial', 'office', 'warehouse', 'other')),
    space_abbreviation TEXT,
    address TEXT,
    hide_address_in_ui BOOLEAN DEFAULT false,
    hide_space_type_in_ui BOOLEAN DEFAULT false,
    container_inventory JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata and custom data
    metadata JSONB DEFAULT '{}'::jsonb,
    children JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (for social features)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    item_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add username column if it doesn't exist (for existing profiles table)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
    END IF;
END $$;

-- ============================================================================
-- ACHIEVEMENTS & GAMIFICATION
-- ============================================================================

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    points INTEGER DEFAULT 0,
    icon TEXT,
    criteria JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements (awarded achievements)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id TEXT REFERENCES public.achievements(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, achievement_id)
);

-- Verification Chain (blockchain-style achievement verification)
CREATE TABLE IF NOT EXISTS public.verification_chain (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id TEXT REFERENCES public.achievements(id) ON DELETE CASCADE,
    block_hash TEXT NOT NULL,
    previous_hash TEXT,
    signature TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- E-COMMERCE
-- ============================================================================

-- Products (Ürün Kataloğu)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    brand TEXT,
    
    -- Pricing
    base_price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    
    -- Inventory
    track_inventory BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    reorder_point INTEGER DEFAULT 5,
    
    -- Product Details
    barcode TEXT,
    weight DECIMAL(10, 2),
    weight_unit TEXT DEFAULT 'kg',
    dimensions JSONB, -- {length, width, height, unit}
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Status & Metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued', 'out_of_stock')),
    is_featured BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]'::jsonb,
    attributes JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Movements (Stok Hareketleri)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'return', 'transfer')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER,
    new_quantity INTEGER,
    
    reference_type TEXT, -- 'order', 'purchase', 'adjustment', 'transfer'
    reference_id UUID,
    
    location_from TEXT,
    location_to TEXT,
    
    reason TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (Siparişler - Gelişmiş)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    
    -- Customer Info
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    
    -- Pricing
    subtotal DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'TRY',
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partial')),
    fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled', 'cancelled')),
    
    -- Payment
    payment_method TEXT,
    stripe_payment_intent_id TEXT,
    paid_at TIMESTAMPTZ,
    
    -- Shipping
    shipping_address JSONB,
    billing_address JSONB,
    shipping_method TEXT,
    tracking_number TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Additional
    notes TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items (Sipariş Kalemleri)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    
    product_name TEXT NOT NULL,
    product_sku TEXT,
    quantity INTEGER NOT NULL,
    
    unit_price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_price DECIMAL(10, 2) NOT NULL,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations (Eski sistem - geriye dönük uyumluluk için korunuyor)
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_name TEXT,
    quantity INTEGER DEFAULT 1,
    total_price DECIMAL(10, 2),
    reservation_date TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
    confirmation_code TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases (Eski sistem - geriye dönük uyumluluk için korunuyor)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    item_id TEXT NOT NULL,
    item_name TEXT,
    quantity INTEGER DEFAULT 1,
    total_price DECIMAL(10, 2),
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    stripe_payment_intent_id TEXT,
    confirmation_code TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS & TRACKING
-- ============================================================================

-- Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page Views
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    page_path TEXT NOT NULL,
    referrer TEXT,
    session_id TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECURITY & AUDIT
-- ============================================================================

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add severity column if it doesn't exist (for existing audit_logs table)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'severity'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical'));
    END IF;
END $$;

-- GDPR Data Requests
CREATE TABLE IF NOT EXISTS public.gdpr_data_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    request_type TEXT CHECK (request_type IN ('export', 'deletion')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    data_url TEXT,
    scheduled_deletion_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    rate_limit INTEGER DEFAULT 1000,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if re-running migration)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own content items" ON public.content_items;
DROP POLICY IF EXISTS "Users can create own content items" ON public.content_items;
DROP POLICY IF EXISTS "Users can update own content items" ON public.content_items;
DROP POLICY IF EXISTS "Users can delete own content items" ON public.content_items;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can view others' achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can create own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can create own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Products: Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Products: Users can create own products" ON public.products;
DROP POLICY IF EXISTS "Products: Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Products: Users can delete own products" ON public.products;
DROP POLICY IF EXISTS "Stock: Users can view own stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Stock: Users can create stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Orders: Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders: Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders: Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Order Items: Users can view items from own orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can create analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can create page views" ON public.page_views;
DROP POLICY IF EXISTS "Users can view own GDPR requests" ON public.gdpr_data_requests;
DROP POLICY IF EXISTS "Users can create own GDPR requests" ON public.gdpr_data_requests;
DROP POLICY IF EXISTS "API Keys: Users can view own keys" ON public.api_keys;
DROP POLICY IF EXISTS "API Keys: Users can create own keys" ON public.api_keys;
DROP POLICY IF EXISTS "API Keys: Users can update own keys" ON public.api_keys;
DROP POLICY IF EXISTS "API Keys: Users can delete own keys" ON public.api_keys;

-- Users Policies
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Content Items Policies
CREATE POLICY "Users can view own content items"
    ON public.content_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own content items"
    ON public.content_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content items"
    ON public.content_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content items"
    ON public.content_items FOR DELETE
    USING (auth.uid() = user_id AND is_deletable = true);

-- Profiles Policies
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profiles"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Achievements Policies (public read)
CREATE POLICY "Achievements are viewable by everyone"
    ON public.achievements FOR SELECT
    USING (true);

-- User Achievements Policies
CREATE POLICY "Users can view own achievements"
    ON public.user_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' achievements"
    ON public.user_achievements FOR SELECT
    USING (true);

-- Reservations Policies
CREATE POLICY "Users can view own reservations"
    ON public.reservations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reservations"
    ON public.reservations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations"
    ON public.reservations FOR UPDATE
    USING (auth.uid() = user_id);

-- Purchases Policies
CREATE POLICY "Users can view own purchases"
    ON public.purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchases"
    ON public.purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Products Policies
CREATE POLICY "Products: Users can view own products"
    ON public.products FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Products: Users can create own products"
    ON public.products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Products: Users can update own products"
    ON public.products FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Products: Users can delete own products"
    ON public.products FOR DELETE
    USING (auth.uid() = user_id);

-- Stock Movements Policies
CREATE POLICY "Stock: Users can view own stock movements"
    ON public.stock_movements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Stock: Users can create stock movements"
    ON public.stock_movements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Orders Policies
CREATE POLICY "Orders: Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Orders: Users can create own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Orders: Users can update own orders"
    ON public.orders FOR UPDATE
    USING (auth.uid() = user_id);

-- Order Items Policies
CREATE POLICY "Order Items: Users can view items from own orders"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Analytics Policies (write-only for users, admin read)
CREATE POLICY "Users can create analytics events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can create page views"
    ON public.page_views FOR INSERT
    WITH CHECK (true);

-- GDPR Policies
CREATE POLICY "Users can view own GDPR requests"
    ON public.gdpr_data_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own GDPR requests"
    ON public.gdpr_data_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- API Keys Policies
CREATE POLICY "API Keys: Users can view own keys"
    ON public.api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "API Keys: Users can create own keys"
    ON public.api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "API Keys: Users can update own keys"
    ON public.api_keys FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "API Keys: Users can delete own keys"
    ON public.api_keys FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Content items indexes
CREATE INDEX IF NOT EXISTS idx_content_items_user_id ON public.content_items(user_id);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_parent_id ON public.content_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_items_assigned_space_id ON public.content_items(assigned_space_id);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON public.content_items(created_at);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Achievements indexes
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_tier ON public.achievements(tier);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_awarded_at ON public.user_achievements(awarded_at);

-- Reservations indexes
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_confirmation_code ON public.reservations(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at);

-- Purchases indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_reservation_id ON public.purchases(reservation_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON public.purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON public.content_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at)
    VALUES (NEW.id, NEW.email, NOW());
    
    INSERT INTO public.profiles (id, username, display_name, created_at)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)), COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================

-- Insert default achievements (can be customized)
INSERT INTO public.achievements (id, title, description, category, tier, points, icon) VALUES
    ('first-login', 'İlk Giriş', 'Uygulamaya ilk kez giriş yaptınız', 'milestone', 'bronze', 10, 'trophy'),
    ('first-space', 'İlk Mekan', 'İlk mekanınızı oluşturdunuz', 'space', 'bronze', 20, 'home'),
    ('first-widget', 'İlk Widget', 'İlk widget''ınızı eklediniz', 'widget', 'bronze', 15, 'grid'),
    ('power-user', 'Güçlü Kullanıcı', '10 farklı widget kullandınız', 'usage', 'silver', 50, 'zap'),
    ('space-master', 'Mekan Ustası', '5 farklı mekan oluşturdunuz', 'space', 'gold', 100, 'building')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'User profiles and account information';
COMMENT ON TABLE public.content_items IS 'All user content: spaces, devices, widgets, folders, media files';
COMMENT ON TABLE public.achievements IS 'Available achievements and badges';
COMMENT ON TABLE public.user_achievements IS 'User-earned achievements';
COMMENT ON TABLE public.reservations IS 'Item reservations for e-commerce';
COMMENT ON TABLE public.purchases IS 'Completed purchases';
COMMENT ON TABLE public.analytics_events IS 'User analytics and behavior tracking';
COMMENT ON TABLE public.audit_logs IS 'Security audit trail';

-- ============================================================================
-- GRANTS (for authenticated users)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
