"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HydrationWrapper, ClientOnly } from '@/components/hydration-wrapper';
import { useGuestLogin, useGuestAnalytics, GuestAuthGuard } from '@/lib/guest-login';
import { useSocialFeed, useSocialActions, formatRelativeTime, SocialPost } from '@/hooks/use-social-feed';
import { useCanvasSync, RemoteCursor, useRemoteCursors, useThrottledCursor } from '@/hooks/use-canvas-sync';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Heart, MessageCircle, 
  Share2, Download, Lock, User, LogIn, UserPlus, X, Sparkles,
  ChevronRight, ExternalLink, Eye, Clock, Star, Zap, Gift, RefreshCw,
  Users, Wifi, WifiOff, Grid3x3, List, Folder, Grid, Plus, Settings,
  ChevronLeft, ChevronDown, Monitor, FileText, Music, Database, Maximize
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarProvider } from '@/components/ui/sidebar';
import PrimarySidebar from '@/components/primary-sidebar';
import SecondarySidebar from '@/components/secondary-sidebar';

// 25 Örnek İçerik - Video, Resim, Web Siteleri
const DEMO_CONTENT = [
  // Videolar (10)
  { id: 'v1', type: 'video', title: 'Lo-Fi Beats - Çalışma Müziği', url: 'https://www.youtube.com/embed/jfKfPfyJRdk', thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg', views: 12500, likes: 890, duration: '3:45:00', category: 'Müzik' },
  { id: 'v2', type: 'video', title: 'Doğa Belgeseli - Okyanuslar', url: 'https://www.youtube.com/embed/H3xrFnUiYkg', thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400', views: 8200, likes: 654, duration: '42:18', category: 'Belgesel' },
  { id: 'v3', type: 'video', title: 'Uzay Yolculuğu - NASA', url: 'https://www.youtube.com/embed/nA9UZF-SZoQ', thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400', views: 15600, likes: 1230, duration: '28:45', category: 'Bilim' },
  { id: 'v4', type: 'video', title: 'Yoga & Meditasyon', url: 'https://www.youtube.com/embed/v7AYKMP6rOE', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', views: 6800, likes: 520, duration: '15:30', category: 'Wellness' },
  { id: 'v5', type: 'video', title: 'Avrupa Turu - Seyahat', url: 'https://www.youtube.com/embed/Scxs7L0vhZ4', thumbnail: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400', views: 9400, likes: 780, duration: '24:12', category: 'Seyahat' },
  { id: 'v6', type: 'video', title: 'Kodlama Dersleri - React', url: 'https://www.youtube.com/embed/w7ejDZ8SWv8', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400', views: 22100, likes: 1890, duration: '1:12:45', category: 'Eğitim' },
  { id: 'v7', type: 'video', title: 'Yemek Tarifleri - İtalyan', url: 'https://www.youtube.com/embed/Ug6zpnFpLKo', thumbnail: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400', views: 11200, likes: 920, duration: '18:22', category: 'Mutfak' },
  { id: 'v8', type: 'video', title: 'Fitness Antrenmanı', url: 'https://www.youtube.com/embed/UItWltVZZmE', thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', views: 18700, likes: 1450, duration: '35:00', category: 'Fitness' },
  { id: 'v9', type: 'video', title: 'Müzik Prodüksiyon', url: 'https://www.youtube.com/embed/lTRiuFIWV54', thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400', views: 7500, likes: 620, duration: '52:15', category: 'Müzik' },
  { id: 'v10', type: 'video', title: 'Fotoğrafçılık İpuçları', url: 'https://www.youtube.com/embed/V7z7BAZdt2M', thumbnail: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400', views: 13800, likes: 1100, duration: '21:38', category: 'Sanat' },
  
  // Web Siteleri (8)
  { id: 'w1', type: 'website', title: 'Donanım Haber - Türkiye', url: 'https://www.donanimhaber.com', thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400', views: 5400, likes: 320, category: 'Haber' },
  { id: 'w2', type: 'website', title: 'The Verge', url: 'https://www.theverge.com', thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400', views: 6200, likes: 410, category: 'Teknoloji' },
  { id: 'w3', type: 'website', title: 'Dribbble - Tasarım', url: 'https://dribbble.com', thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400', views: 8900, likes: 720, category: 'Tasarım' },
  { id: 'w4', type: 'website', title: 'Product Hunt', url: 'https://www.producthunt.com', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', views: 4100, likes: 280, category: 'Teknoloji' },
  { id: 'w5', type: 'website', title: 'Medium - Blog', url: 'https://medium.com', thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400', views: 7800, likes: 560, category: 'Blog' },
  { id: 'w6', type: 'website', title: 'Behance - Portfolyo', url: 'https://www.behance.net', thumbnail: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400', views: 6500, likes: 480, category: 'Tasarım' },
  { id: 'w7', type: 'website', title: 'Unsplash - Görseller', url: 'https://unsplash.com', thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400', views: 12300, likes: 980, category: 'Görseller' },
  { id: 'w8', type: 'website', title: 'GitHub', url: 'https://github.com', thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400', views: 15600, likes: 1240, category: 'Teknoloji' },
  
  // Görseller (7)
  { id: 'i1', type: 'image', title: 'Gün Batımı Manzarası', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', views: 9200, likes: 780, category: 'Doğa' },
  { id: 'i2', type: 'image', title: 'Şehir Manzarası', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800', thumbnail: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400', views: 7600, likes: 620, category: 'Şehir' },
  { id: 'i3', type: 'image', title: 'Dağ Zirvesi', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400', views: 11400, likes: 920, category: 'Doğa' },
  { id: 'i4', type: 'image', title: 'Orman Yolu', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400', views: 8100, likes: 670, category: 'Doğa' },
  { id: 'i5', type: 'image', title: 'Kuzey Işıkları', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400', views: 14200, likes: 1180, category: 'Gökyüzü' },
  { id: 'i6', type: 'image', title: 'Çiçek Bahçesi', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800', thumbnail: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400', views: 6300, likes: 510, category: 'Doğa' },
  { id: 'i7', type: 'image', title: 'Tropikal Plaj', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', views: 10800, likes: 890, category: 'Plaj' },
];

// Sosyal Örnek İçerikleri
const EXAMPLE_SOCIAL_ITEMS = [
  { id: 'se1', icon: '🎬', title: 'Film Koleksiyonu', description: 'Klasik ve modern filmler', itemCount: 247, views: 45300, category: 'Video' },
  { id: 'se2', icon: '🎵', title: 'Müzik Kütüphanesi', description: 'Tüm türlerden müzikler', itemCount: 1230, views: 89200, category: 'Müzik' },
  { id: 'se3', icon: '📚', title: 'Okuma Listesi', description: 'Kitap ve makaleler', itemCount: 85, views: 12450, category: 'Okuma' },
  { id: 'se4', icon: '🎨', title: 'Tasarım Referansları', description: 'UI/UX ve Graphic Design', itemCount: 546, views: 67890, category: 'Tasarım' },
  { id: 'se5', icon: '✈️', title: 'Seyahat Rehberleri', description: 'Dünya çapında destinasyonlar', itemCount: 120, views: 34560, category: 'Seyahat' },
  { id: 'se6', icon: '🍳', title: 'Tarif Koleksiyonu', description: 'Dünya mutfakları', itemCount: 890, views: 123450, category: 'Mutfak' },
];

// İçerik Modal - Iframe Viewer
const ContentModal: React.FC<{ 
  item: typeof DEMO_CONTENT[0] | null; 
  onClose: () => void;
}> = ({ item, onClose }) => {
  if (!item) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full h-[90vh] max-w-6xl bg-black rounded-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="w-full h-full flex flex-col">
            {item.type === 'video' && (
              <iframe
                src={item.url}
                className="flex-1 w-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={item.title}
              />
            )}
            
            {item.type === 'website' && (
              <iframe
                src={item.url}
                className="flex-1 w-full border-0"
                title={item.title}
              />
            )}
            
            {item.type === 'image' && (
              <div className="flex-1 flex items-center justify-center bg-black">
                <img
                  src={item.url}
                  alt={item.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            {/* Info Bar */}
            <div className="bg-black/80 backdrop-blur p-4 border-t border-white/10">
              <div className="max-w-6xl mx-auto">
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <div className="flex items-center justify-between text-white/70 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      {item.views.toLocaleString()} İzleme
                    </span>
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      {item.likes.toLocaleString()} Beğeni
                    </span>
                    {item.category && (
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = item.url;
                        link.target = '_blank';
                        link.click();
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Sosyal Örnek Kartı Komponenti
const SocialExampleCard: React.FC<{ item: typeof EXAMPLE_SOCIAL_ITEMS[0] }> = ({ item }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="group relative bg-gradient-to-br from-card to-card/50 rounded-xl p-5 border hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative space-y-4">
        {/* Icon & Category */}
        <div className="flex items-start justify-between">
          <div className="text-4xl">{item.icon}</div>
          <Badge variant="secondary" className="text-xs">
            {item.category}
          </Badge>
        </div>
        
        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="font-bold text-base group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Grid className="w-3 h-3" />
              {item.itemCount} içerik
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {(item.views / 1000).toFixed(0)}K
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 group-hover:-translate-y-1" />
        </div>
      </div>
    </motion.div>
  );
};

// Canlı Sosyal Akış Bileşeni
const LiveSocialFeed: React.FC<{ onLoginPrompt: () => void }> = ({ onLoginPrompt }) => {
  const { posts, loading, hasMore, loadMore, refresh } = useSocialFeed({ limit: 10 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Canlı Akış</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-7 px-2"
        >
          <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      {loading && posts.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-muted/50 rounded-lg animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
              <div className="h-3 w-full bg-muted rounded mb-1" />
              <div className="h-3 w-2/3 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {post.user_avatar ? (
                      <img src={post.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      post.user_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate">{post.user_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(post.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={onLoginPrompt}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Heart className="w-3 h-3" />
                        <span>{post.likes_count}</span>
                      </button>
                      <button
                        onClick={onLoginPrompt}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>{post.comments_count}</span>
                      </button>
                      <button
                        onClick={onLoginPrompt}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {hasMore && (
            <Button
              size="sm"
              variant="ghost"
              onClick={loadMore}
              disabled={loading}
              className="w-full text-xs"
            >
              {loading ? 'Yükleniyor...' : 'Daha Fazla'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Çevrimiçi Kullanıcılar Bileşeni (Self-contained with hook)
const OnlineUsers: React.FC = () => {
  const { users } = useCanvasSync('guest-canvas');
  
  if (users.length === 0) {
    // Show mock online users for demo
    const mockUsers = [
      { user_id: '1', user_name: 'Ahmet', color: '#8B5CF6' },
      { user_id: '2', user_name: 'Elif', color: '#EC4899' },
      { user_id: '3', user_name: 'Mehmet', color: '#3B82F6' },
    ];
    
    return (
      <Card className="sticky top-24">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">{mockUsers.length} çevrimiçi</span>
            </div>
            <div className="flex -space-x-2">
              {mockUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: user.color }}
                  title={user.user_name}
                >
                  {user.user_name.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-24">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">{users.length} çevrimiçi</span>
          </div>
          <div className="flex -space-x-2">
            {users.slice(0, 5).map((user) => (
              <div
                key={user.user_id}
                className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: user.color }}
                title={user.user_name}
              >
                {user.user_name.charAt(0)}
              </div>
            ))}
            {users.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px]">
                +{users.length - 5}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Reklam Kartı Komponenti
const AdCard: React.FC<{ position: number }> = ({ position }) => {
  const adContent = [
    { title: '🚀 Pro\'ya Geç!', desc: 'Sınırsız içerik, reklamsız deneyim', cta: 'Hemen Başla', color: 'from-purple-600 to-indigo-600' },
    { title: '💡 Yeni Özellik!', desc: 'AI destekli içerik önerileri', cta: 'Keşfet', color: 'from-blue-600 to-cyan-500' },
    { title: '🎁 Özel Teklif', desc: 'İlk ay %50 indirim', cta: 'Fırsatı Yakala', color: 'from-orange-500 to-red-500' },
  ];
  
  const ad = adContent[position % adContent.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative rounded-xl p-4 bg-gradient-to-br text-white overflow-hidden",
        ad.color
      )}
    >
      <Badge className="absolute top-2 right-2 bg-white/20 text-white text-[10px]">
        Reklam
      </Badge>
      <div className="space-y-2">
        <h3 className="font-bold text-lg">{ad.title}</h3>
        <p className="text-sm text-white/90">{ad.desc}</p>
        <Button size="sm" variant="secondary" className="mt-2 bg-white/20 hover:bg-white/30 text-white">
          {ad.cta} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
    </motion.div>
  );
};

// İçerik Kartı Komponenti
const ContentCard: React.FC<{
  item: typeof DEMO_CONTENT[0];
  onAction: (action: string) => void;
  isPlaying?: boolean;
}> = ({ item, onAction, isPlaying }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const typeIcon = {
    video: <Play className="w-8 h-8" />,
    website: <ExternalLink className="w-6 h-6" />,
    image: <Eye className="w-6 h-6" />,
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group relative bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition-all cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img 
          src={item.thumbnail} 
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Play Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center text-gray-900 shadow-lg"
              >
                {typeIcon[item.type as keyof typeof typeIcon]}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Duration Badge */}
        {item.duration && (
          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
            <Clock className="w-3 h-3 mr-1" />
            {item.duration}
          </Badge>
        )}
        
        {/* Type Badge */}
        <Badge className="absolute top-2 left-2 bg-black/50 text-white text-[10px]">
          {item.type === 'video' ? '📹 Video' : item.type === 'website' ? '🌐 Web' : '🖼️ Görsel'}
        </Badge>
      </div>
      
      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="font-medium text-sm truncate">{item.title}</h3>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {item.views?.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" /> {item.likes}
            </span>
          </div>
        </div>
        
        {/* Actions - Locked for Guests */}
        <div className="flex items-center gap-1 pt-2 border-t">
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex-1 h-8 text-xs"
            onClick={() => onAction('like')}
          >
            <Heart className="w-3 h-3 mr-1" />
            <Lock className="w-2 h-2" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex-1 h-8 text-xs"
            onClick={() => onAction('comment')}
          >
            <MessageCircle className="w-3 h-3 mr-1" />
            <Lock className="w-2 h-2" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex-1 h-8 text-xs"
            onClick={() => onAction('share')}
          >
            <Share2 className="w-3 h-3 mr-1" />
            <Lock className="w-2 h-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Ana Sayfa Komponenti
export default function GuestCanvasPage() {
  const { guestSession, isGuest, loginAsGuest } = useGuestLogin();
  const { trackEvent, trackView } = useGuestAnalytics();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const [activeMainTab, setActiveMainTab] = useState<'canvas' | 'examples'>('canvas');
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'websites' | 'images'>('all');
  const [selectedItem, setSelectedItem] = useState<typeof DEMO_CONTENT[0] | null>(null);
  
  // Track page view on mount
  useEffect(() => {
    trackView('guest-canvas');
  }, [trackView]);
  
  const filteredContent = useMemo(() => {
    const content = [...DEMO_CONTENT];
    if (activeTab === 'videos') return content.filter(c => c.type === 'video');
    if (activeTab === 'websites') return content.filter(c => c.type === 'website');
    if (activeTab === 'images') return content.filter(c => c.type === 'image');
    return content;
  }, [activeTab]);
  
  // Insert ads every 6 items
  const contentWithAds = useMemo(() => {
    const result: (typeof DEMO_CONTENT[0] | { isAd: true; position: number })[] = [];
    let adIndex = 0;
    
    filteredContent.forEach((item, index) => {
      result.push(item);
      if ((index + 1) % 6 === 0) {
        result.push({ isAd: true, position: adIndex++ } as any);
      }
    });
    
    return result;
  }, [filteredContent]);
  
  const handleAction = (action: string) => {
    const messages: Record<string, string> = {
      like: '❤️ Beğenmek için üye olmanız gerekiyor',
      comment: '💬 Yorum yapmak için üye olmanız gerekiyor',
      share: '📤 Paylaşmak için üye olmanız gerekiyor',
      export: '📥 Dışa aktarmak için üye olmanız gerekiyor',
    };
    
    trackEvent(action, { source: 'content_card' });
    setPromptMessage(messages[action] || 'Bu özellik için üye olmanız gerekiyor');
    setShowLoginPrompt(true);
  };
  
  // Track tab changes
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    trackEvent('tab_change', { tab });
  };

  const handleMainTabChange = (tab: typeof activeMainTab) => {
    setActiveMainTab(tab);
    trackEvent('main_tab_change', { tab });
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">TV</span>
              </div>
              <span className="font-bold text-xl">tv25.app</span>
            </Link>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              <User className="w-3 h-3 mr-1" />
              Misafir Modu
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                <LogIn className="w-4 h-4 mr-2" />
                Giriş Yap
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-500">
                <UserPlus className="w-4 h-4 mr-2" />
                Üye Ol
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Guest Info Banner */}
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-500/10 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <p className="text-sm">
                <strong>Deneme Modundasınız!</strong> Tüm özelliklere erişmek için{' '}
                <Link href="/register" className="text-purple-600 hover:underline font-medium">
                  hemen üye olun
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> İzleme: ✓
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-400" /> Beğeni: 🔒
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" /> Yorum: 🔒
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-3 h-3" /> Paylaşım: 🔒
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Main Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Button
                variant={activeMainTab === 'canvas' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleMainTabChange('canvas')}
                className="gap-2"
              >
                <Grid className="w-4 h-4" />
                Canvas Koleksiyonu
              </Button>
              <Button
                variant={activeMainTab === 'examples' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleMainTabChange('examples')}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Sosyal Örnekler
              </Button>
              <div className="flex-1" />
              {activeMainTab === 'canvas' && (
                <Badge variant="outline" className="text-xs">
                  {filteredContent.length} içerik
                </Badge>
              )}
            </div>

            {/* Canvas Tab Content */}
            {activeMainTab === 'canvas' && (
              <>
                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  {(['all', 'videos', 'websites', 'images'] as const).map((tab) => (
                    <Button
                      key={tab}
                      variant={activeTab === tab ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTabChange(tab)}
                    >
                      {tab === 'all' && '📁 Tümü'}
                      {tab === 'videos' && '📹 Videolar'}
                      {tab === 'websites' && '🌐 Web Siteleri'}
                      {tab === 'images' && '🖼️ Görseller'}
                    </Button>
                  ))}
                </div>
                
                {/* Content Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {contentWithAds.map((item, index) => 
                    'isAd' in item ? (
                      <AdCard key={`ad-${item.position}`} position={item.position} />
                    ) : (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setSelectedItem(item);
                          trackEvent('open_content', { contentId: item.id, type: item.type });
                        }}
                      >
                        <ContentCard 
                          item={item} 
                          onAction={handleAction}
                        />
                      </motion.div>
                    )
                  )}
                </div>
              </>
            )}

            {/* Examples Tab Content */}
            {activeMainTab === 'examples' && (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-2">Sosyal Örnek Koleksiyonları</h2>
                  <p className="text-sm text-muted-foreground">
                    Diğer kullanıcıların oluşturduğu harika koleksiyonları keşfedin
                  </p>
                </div>
                
                {/* Social Examples Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {EXAMPLE_SOCIAL_ITEMS.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        trackEvent('view_social_example', { exampleId: item.id });
                      }}
                    >
                      <SocialExampleCard item={item} />
                    </motion.div>
                  ))}
                </div>

                {/* Feature Grid Section */}
                <div className="mt-12">
                  <h2 className="text-lg font-bold mb-4">Öne Çıkan Özellikler</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { icon: Folder, title: 'Klasörler', desc: 'İçeriğini kategorilere ayır' },
                      { icon: Grid, title: 'Yer Paylaşımı', desc: 'İzgara görünümüyle düzenle' },
                      { icon: Share2, title: 'Paylaş', desc: 'Koleksiyonları arkadaşlarla paylaş' },
                      { icon: Heart, title: 'Beğen', desc: 'Sevdiğin içerikleri işaretle' },
                      { icon: Eye, title: 'İzle', desc: 'Çevrimiçi olarak izle' },
                      { icon: Sparkles, title: 'AI Öneriler', desc: 'Yapay zeka destekli tavsiyeler' },
                    ].map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="p-4 text-center">
                            <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                            <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                            <p className="text-xs text-muted-foreground">{feature.desc}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Social Feed Sidebar */}
          <div className="hidden xl:block w-80 shrink-0 space-y-4">
            {/* Online Users */}
            <OnlineUsers />
            
            {/* Live Social Feed */}
            <LiveSocialFeed onLoginPrompt={() => setShowLoginPrompt(true)} />
          </div>
        </div>
      </div>

      {/* Content Modal - Iframe Viewer */}
      <ContentModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      
      {/* Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                onClick={() => setShowLoginPrompt(false)}
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Üyelik Gerekli</h3>
                <p className="text-muted-foreground mb-6">{promptMessage}</p>
                
                <div className="space-y-3">
                  <Link href="/register" className="block">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-500">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Ücretsiz Üye Ol
                    </Button>
                  </Link>
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full">
                      <LogIn className="w-4 h-4 mr-2" />
                      Giriş Yap
                    </Button>
                  </Link>
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">
                  Üyelik tamamen ücretsiz ve 30 saniyede tamamlanır!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
