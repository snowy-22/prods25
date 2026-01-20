'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BadgeCheck,
  MapPin,
  Globe,
  Calendar,
  Twitter,
  Instagram,
  Youtube,
  Github,
  Linkedin,
  MessageCircle,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PublicProfile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  social_links: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    linkedin?: string;
    discord?: string;
  } | null;
  verified: boolean;
  is_public: boolean;
  created_at: string;
}

interface PublicProfilePageProps {
  profile: PublicProfile;
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  github: Github,
  linkedin: Linkedin,
  discord: MessageCircle,
};

export default function PublicProfilePage({ profile }: PublicProfilePageProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const displayName = profile.full_name || profile.username;
  const profileUrl = `https://tv25.app/${profile.username}`;

  const copyProfileLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Kopyalandı!',
      description: 'Profil linki panoya kopyalandı.',
    });
  };

  const getSocialUrl = (platform: string, handle: string): string => {
    if (handle.startsWith('http')) return handle;
    
    const prefixes: Record<string, string> = {
      twitter: 'https://twitter.com/',
      instagram: 'https://instagram.com/',
      youtube: 'https://youtube.com/',
      github: 'https://github.com/',
      linkedin: 'https://linkedin.com/in/',
    };
    
    return prefixes[platform] ? `${prefixes[platform]}${handle.replace('@', '')}` : handle;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">TV25</span>
          </Link>
          <Button variant="outline" size="sm" onClick={copyProfileLink} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Kopyalandı' : 'Paylaş'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl py-8">
        {/* Profile Card */}
        <Card className="overflow-hidden">
          {/* Cover Image / Gradient */}
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
          
          <CardContent className="relative pt-0">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4 flex justify-center">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage 
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`} 
                  alt={displayName}
                />
                <AvatarFallback className="text-4xl">
                  {profile.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name & Username */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                {profile.verified && (
                  <BadgeCheck className="h-6 w-6 text-primary" />
                )}
              </div>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-center text-muted-foreground mb-6 max-w-md mx-auto">
                {profile.bio}
              </p>
            )}

            {/* Info Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              {profile.location && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {profile.location}
                </Badge>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer">
                  <Badge variant="secondary" className="gap-1 hover:bg-secondary/80 cursor-pointer">
                    <Globe className="h-3 w-3" />
                    Web Sitesi
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Badge>
                </a>
              )}
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: tr })} katıldı
              </Badge>
            </div>

            {/* Social Links */}
            {profile.social_links && Object.keys(profile.social_links).some(k => profile.social_links![k as keyof typeof profile.social_links]) && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {Object.entries(profile.social_links).map(([platform, handle]) => {
                  if (!handle) return null;
                  const Icon = socialIcons[platform];
                  if (!Icon) return null;
                  
                  return (
                    <a
                      key={platform}
                      href={getSocialUrl(platform, handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <Icon className="h-5 w-5" />
                      </Button>
                    </a>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Public Canvas Section (Future) */}
        <div className="mt-8">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Globe className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Herkese Açık Kanvas</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Bu kullanıcı henüz herkese açık bir kanvas yayınlamamış.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Join CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Siz de kendi kanvasınızı oluşturmak ister misiniz?
          </p>
          <Link href={`/register?ref=${profile.username}`}>
            <Button className="gap-2">
              TV25'e Katıl
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} TV25.app - Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
