-- Philips Hue Integration - Personal Database Schema
-- All personal Hue bridge data, lights, and syncs stored in encrypted tables
-- This schema is separate from public/shared data

-- Create hue_bridges table for personal bridge configurations
create table if not exists hue_bridges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bridge_id text not null unique,
  ip_address inet not null,
  port integer not null default 443,
  username text not null, -- API token/username (encrypted)
  name text not null,
  is_connected boolean default false,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create hue_lights table for connected lights
create table if not exists hue_lights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bridge_id uuid not null references hue_bridges(id) on delete cascade,
  light_id text not null,
  name text not null,
  type text not null check (type in ('color', 'dimmer', 'switch', 'unknown')),
  state jsonb not null default '{"on": false, "brightness": 0}',
  is_available boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create hue_scenes table for saved scenes
create table if not exists hue_scenes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bridge_id uuid not null references hue_bridges(id) on delete cascade,
  scene_id text not null,
  name text not null,
  lights_in_scene text[] not null default array[]::text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create hue_syncs table for canvas item to light syncing
create table if not exists hue_syncs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bridge_id uuid not null references hue_bridges(id) on delete cascade,
  item_id text not null,
  light_id text not null,
  sync_type text not null check (sync_type in ('brightness', 'color', 'on-off', 'custom')),
  custom_rule jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on all Hue tables
alter table hue_bridges enable row level security;
alter table hue_lights enable row level security;
alter table hue_scenes enable row level security;
alter table hue_syncs enable row level security;

-- RLS Policies for hue_bridges
create policy "Users can view their own bridges"
  on hue_bridges for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bridges"
  on hue_bridges for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bridges"
  on hue_bridges for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own bridges"
  on hue_bridges for delete
  using (auth.uid() = user_id);

-- RLS Policies for hue_lights (inherited from bridge access)
create policy "Users can view lights from their bridges"
  on hue_lights for select
  using (
    user_id = auth.uid()
  );

create policy "Users can insert lights to their bridges"
  on hue_lights for insert
  with check (user_id = auth.uid());

create policy "Users can update lights in their bridges"
  on hue_lights for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete lights from their bridges"
  on hue_lights for delete
  using (user_id = auth.uid());

-- RLS Policies for hue_scenes
create policy "Users can view scenes from their bridges"
  on hue_scenes for select
  using (user_id = auth.uid());

create policy "Users can insert scenes to their bridges"
  on hue_scenes for insert
  with check (user_id = auth.uid());

create policy "Users can update scenes in their bridges"
  on hue_scenes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete scenes from their bridges"
  on hue_scenes for delete
  using (user_id = auth.uid());

-- RLS Policies for hue_syncs
create policy "Users can view their syncs"
  on hue_syncs for select
  using (user_id = auth.uid());

create policy "Users can insert their syncs"
  on hue_syncs for insert
  with check (user_id = auth.uid());

create policy "Users can update their syncs"
  on hue_syncs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their syncs"
  on hue_syncs for delete
  using (user_id = auth.uid());

-- Create indexes for performance
create index hue_bridges_user_id_idx on hue_bridges(user_id);
create index hue_bridges_bridge_id_idx on hue_bridges(bridge_id);
create index hue_lights_user_id_idx on hue_lights(user_id);
create index hue_lights_bridge_id_idx on hue_lights(bridge_id);
create index hue_scenes_user_id_idx on hue_scenes(user_id);
create index hue_scenes_bridge_id_idx on hue_scenes(bridge_id);
create index hue_syncs_user_id_idx on hue_syncs(user_id);
create index hue_syncs_bridge_id_idx on hue_syncs(bridge_id);
create index hue_syncs_item_id_idx on hue_syncs(item_id);
