-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES items(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    icon TEXT,
    thumbnail_url TEXT,
    author_name TEXT,
    published_at TEXT,
    view_count TEXT,
    like_count TEXT,
    comment_count TEXT,
    "order" INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create follows table for user relationships
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    website TEXT,
    organization_type TEXT DEFAULT 'general', -- 'general', 'company', 'community', 'brand'
    follower_count INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- Create organization_follows table
CREATE TABLE IF NOT EXISTS organization_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_follows ENABLE ROW LEVEL SECURITY;

-- Policies for items
CREATE POLICY "Users can view their own items" ON items
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own items" ON items
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own items" ON items
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own items" ON items
    FOR DELETE USING (auth.uid() = owner_id);

-- Policies for profiles
CREATE POLICY "Public profiles are view

-- Policies for follows
CREATE POLICY "Anyone can view follows" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Users can create follows" ON follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" ON follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Policies for organizations
CREATE POLICY "Anyone can view organizations" ON organizations
    FOR SELECT USING (true);

CREATE POLICY "Members can update organization" ON organization_members
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM organization_members 
            WHERE organization_id = organization_members.organization_id 
            AND role IN ('owner', 'admin')
        )
    );

-- Policies for organization_members
CREATE POLICY "Anyone can view organization members" ON organization_members
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage members" ON organization_members
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM organization_members 
            WHERE organization_id = organization_members.organization_id 
            AND role = 'owner'
        )
    );

-- Policies for organization_follows
CREATE POLICY "Anyone can view organization follows" ON organization_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can follow organizations" ON organization_follows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow organizations" ON organization_follows
    FOR DELETE USING (auth.uid() = user_id);able by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update follow counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment follower count for the followed user
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    -- Increment following count for the follower
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement follower count for the unfollowed user
    UPDATE profiles SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
    -- Decrement following count for the unfollower
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update organization follow counts
CREATE OR REPLACE FUNCTION public.update_organization_follow_counts()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE organizations SET follower_count = follower_count + 1 WHERE id = NEW.organization_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE organizations SET follower_count = follower_count - 1 WHERE id = OLD.organization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update organization member counts
CREATE OR REPLACE FUNCTION public.update_organization_member_counts()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE organizations SET member_count = member_count + 1 WHERE id = NEW.organization_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE organizations SET member_count = member_count - 1 WHERE id = OLD.organization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for follow count updates
CREATE OR REPLACE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- Trigger for organization follow count updates
CREATE OR REPLACE TRIGGER on_organization_follow_change
  AFTER INSERT OR DELETE ON organization_follows
  FOR EACH ROW EXECUTE FUNCTION public.update_organization_follow_counts();

-- Trigger for organization member count updates
CREATE OR REPLACE TRIGGER on_organization_member_change
  AFTER INSERT OR DELETE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION public.update_organization_member_counts();

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    loading_time_ms INTEGER,
    folders_open_time_ms INTEGER,
    personal_folders_load_time_ms INTEGER,
    device_info JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) for logs
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Policies for logs
CREATE POLICY "Admins can view all logs" ON logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Anyone can insert logs" ON logs
    FOR INSERT WITH CHECK (true);
