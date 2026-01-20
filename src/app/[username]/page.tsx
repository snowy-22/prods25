import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PublicProfilePage from './public-profile-client';

interface PageProps {
  params: Promise<{ username: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, bio, avatar_url')
    .eq('username', username)
    .eq('is_public', true)
    .single();

  if (!profile) {
    return {
      title: 'Kullanıcı Bulunamadı | TV25',
      description: 'Bu kullanıcı profili bulunamadı veya gizli.',
    };
  }

  const displayName = profile.full_name || profile.username;
  
  return {
    title: `${displayName} (@${profile.username}) | TV25`,
    description: profile.bio || `${displayName} kullanıcısının TV25 profili`,
    openGraph: {
      title: `${displayName} | TV25`,
      description: profile.bio || `${displayName} kullanıcısının profili`,
      type: 'profile',
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
      url: `https://tv25.app/${profile.username}`,
    },
    twitter: {
      card: 'summary',
      title: `${displayName} | TV25`,
      description: profile.bio || `${displayName} kullanıcısının profili`,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Validate username format
  if (!/^[a-z0-9_]+$/.test(username)) {
    notFound();
  }

  // Check if it's a reserved route (not a username)
  const reservedRoutes = [
    'api', 'auth', 'admin', 'canvas', 'home', 'login', 'register',
    'profile', 'settings', 'about', 'contact', 'help', 'support',
    'privacy', 'terms', 'pricing', 'features', 'blog', 'docs',
    'dashboard', 'analytics', 'cart', 'orders', 'products', 'shared',
    'community', 'faq', 'kvkk', 'kurumlar', 'corporate', 'inventory',
    'guest', 'landing', 'popout', 'scan', 'test-ai', 'test-oauth',
  ];

  if (reservedRoutes.includes(username.toLowerCase())) {
    notFound();
  }

  // Check if profile exists and is public
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      bio,
      avatar_url,
      location,
      website,
      social_links,
      verified,
      is_public,
      created_at
    `)
    .eq('username', username)
    .eq('is_public', true)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Log profile view
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (currentUser?.id !== profile.id) {
    // Log view from different user
    await supabase.from('profile_views').insert({
      profile_id: profile.id,
      viewer_id: currentUser?.id || null,
    });
  }

  return <PublicProfilePage profile={profile} />;
}
