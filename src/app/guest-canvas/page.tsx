"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Heart, MessageCircle, 
  Share2, Download, Lock, User, LogIn, UserPlus, X, Sparkles,
  ChevronRight, ExternalLink, Eye, Clock, Star, Zap, Gift
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { guestAnalytics } from '@/lib/guest-analytics';

// 25 Örnek İçerik - Video, Resim, Web Siteleri
const DEMO_CONTENT = [
  // Videolar (10)
  { id: 'v1', type: 'video', title: 'Lo-Fi Beats - Çalışma Müziği', url: 'https://www.youtube.com/embed/jfKfPfyJRdk', thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg', views: 12500, likes: 890, duration: '3:45:00' },
  { id: 'v2', type: 'video', title: 'Doğa Belgeseli - Okyanuslar', url: 'https://www.youtube.com/embed/H3xrFnUiYkg', thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400', views: 8200, likes: 654, duration: '42:18' },
  { id: 'v3', type: 'video', title: 'Uzay Yolculuğu - NASA', url: 'https://www.youtube.com/embed/nA9UZF-SZoQ', thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400', views: 15600, likes: 1230, duration: '28:45' },
  { id: 'v4', type: 'video', title: 'Yoga & Meditasyon', url: 'https://www.youtube.com/embed/v7AYKMP6rOE', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', views: 6800, likes: 520, duration: '15:30' },
  { id: 'v5', type: 'video', title: 'Avrupa Turu - Seyahat', url: 'https://www.youtube.com/embed/Scxs7L0vhZ4', thumbnail: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400', views: 9400, likes: 780, duration: '24:12' },
  { id: 'v6', type: 'video', title: 'Kodlama Dersleri - React', url: 'https://www.youtube.com/embed/w7ejDZ8SWv8', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400', views: 22100, likes: 1890, duration: '1:12:45' },
  { id: 'v7', type: 'video', title: 'Yemek Tarifleri - İtalyan', url: 'https://www.youtube.com/embed/Ug6zpnFpLKo', thumbnail: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400', views: 11200, likes: 920, duration: '18:22' },
  { id: 'v8', type: 'video', title: 'Fitness Antrenmanı', url: 'https://www.youtube.com/embed/UItWltVZZmE', thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', views: 18700, likes: 1450, duration: '35:00' },
  { id: 'v9', type: 'video', title: 'Müzik Prodüksiyon', url: 'https://www.youtube.com/embed/lTRiuFIWV54', thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400', views: 7500, likes: 620, duration: '52:15' },
  { id: 'v10', type: 'video', title: 'Fotoğrafçılık İpuçları', url: 'https://www.youtube.com/embed/V7z7BAZdt2M', thumbnail: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400', views: 13800, likes: 1100, duration: '21:38' },
  
  // Web Siteleri (8)
  { id: 'w1', type: 'website', title: 'Donanım Haber - Türkiye', url: 'https://www.donanimhaber.com', thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400', views: 5400, likes: 320 },
  { id: 'w2', type: 'website', title: 'The Verge', url: 'https://www.theverge.com', thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400', views: 6200, likes: 410 },
  { id: 'w3', type: 'website', title: 'Dribbble - Tasarım', url: 'https://dribbble.com', thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400', views: 8900, likes: 720 },
  { id: 'w4', type: 'website', title: 'Product Hunt', url: 'https://www.producthunt.com', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', views: 4100, likes: 280 },
  { id: 'w5', type: 'website', title: 'Medium - Blog', url: 'https://medium.com', thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400', views: 7800, likes: 560 },
  { id: 'w6', type: 'website', title: 'Behance - Portfolyo', url: 'https://www.behance.net', thumbnail: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400', views: 6500, likes: 480 },
  { id: 'w7', type: 'website', title: 'Unsplash - Görseller', url: 'https://unsplash.com', thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400', views: 12300, likes: 980 },
  { id: 'w8', type: 'website', title: 'GitHub', url: 'https://github.com', thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400', views: 15600, likes: 1240 },
  
  // Görseller (7)
  { id: 'i1', type: 'image', title: 'Gün Batımı Manzarası', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', views: 9200, likes: 780 },
  { id: 'i2', type: 'image', title: 'Şehir Manzarası', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800', thumbnail: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400', views: 7600, likes: 620 },
  { id: 'i3', type: 'image', title: 'Dağ Zirvesi', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400', views: 11400, likes: 920 },
  { id: 'i4', type: 'image', title: 'Orman Yolu', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400', views: 8100, likes: 670 },
  { id: 'i5', type: 'image', title: 'Kuzey Işıkları', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400', views: 14200, likes: 1180 },
  { id: 'i6', type: 'image', title: 'Çiçek Bahçesi', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800', thumbnail: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400', views: 6300, likes: 510 },
  { id: 'i7', type: 'image', title: 'Tropikal Plaj', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', views: 10800, likes: 890 },
];

// Sosyal Akış - Örnek Postlar
const SOCIAL_FEED = [
  { id: 's1', user: 'Ahmet Y.', avatar: 'A', content: 'Harika bir koleksiyon! 🎉', time: '2 dk önce', likes: 12 },
  { id: 's2', user: 'Elif K.', avatar: 'E', content: 'Lo-Fi müzik tam çalışırken dinlenecek türden.', time: '5 dk önce', likes: 8 },
  { id: 's3', user: 'Mehmet S.', avatar: 'M', content: 'Doğa belgeselleri favorim!', time: '12 dk önce', likes: 15 },
  { id: 's4', user: 'Zeynep A.', avatar: 'Z', content: 'Tasarım kaynakları çok faydalı 👍', time: '18 dk önce', likes: 6 },
  { id: 's5', user: 'Can B.', avatar: 'C', content: 'Kodlama dersleri süper!', time: '25 dk önce', likes: 22 },
];

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
      className="group relative bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        <img 
          src={item.thumbnail} 
          alt={item.title}
          className="w-full h-full object-cover"
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
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center text-gray-900"
              >
                {typeIcon[item.type as keyof typeof typeIcon]}
              </motion.button>
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'websites' | 'images'>('all');
  
  // Guest Analytics başlat
  useEffect(() => {
    guestAnalytics.initialize();
    guestAnalytics.trackPageView('/guest-canvas', 'Misafir Canvas');
    
    return () => {
      guestAnalytics.cleanup();
    };
  }, []);
  
  const filteredContent = useMemo(() => {
    const content = [...DEMO_CONTENT];
    if (activeTab === 'videos') return content.filter(c => c.type === 'video');
    if (activeTab === 'websites') return content.filter(c => c.type === 'website');
    if (activeTab === 'images') return content.filter(c => c.type === 'image');
    return content;
  }, [activeTab]);
  
  // Reklamları araya serpiştir (her 6 içerikte 1 reklam)
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
    
    // Analytics tracking
    if (action === 'like') guestAnalytics.track('social_interaction', 'like', 'button');
    else if (action === 'comment') guestAnalytics.track('social_interaction', 'comment', 'button');
    else if (action === 'share') guestAnalytics.trackShareAttempt('content');
    else if (action === 'export') guestAnalytics.trackDownloadAttempt('content');
    
    setPromptMessage(messages[action] || 'Bu özellik için üye olmanız gerekiyor');
    setShowLoginPrompt(true);
  };
  
  // Tab değişikliğini takip et
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    guestAnalytics.track('filter_change', tab, 'tab');
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">CanvasFlow</span>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-purple-600" />
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
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
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
              <div className="flex-1" />
              <Badge variant="outline">
                {filteredContent.length} içerik
              </Badge>
            </div>
            
            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {contentWithAds.map((item, index) => 
                'isAd' in item ? (
                  <AdCard key={`ad-${item.position}`} position={item.position} />
                ) : (
                  <ContentCard 
                    key={item.id} 
                    item={item} 
                    onAction={handleAction}
                  />
                )
              )}
            </div>
          </div>
          
          {/* Social Feed Sidebar */}
          <div className="hidden xl:block w-80 shrink-0">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Sosyal Akış
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {SOCIAL_FEED.map((post) => (
                  <div key={post.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      {post.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{post.user}</span>
                        <span className="text-xs text-muted-foreground">{post.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <button 
                          className="flex items-center gap-1 hover:text-red-500"
                          onClick={() => handleAction('like')}
                        >
                          <Heart className="w-3 h-3" /> {post.likes}
                          <Lock className="w-2 h-2 ml-1" />
                        </button>
                        <button 
                          className="flex items-center gap-1"
                          onClick={() => handleAction('comment')}
                        >
                          <MessageCircle className="w-3 h-3" /> Yanıtla
                          <Lock className="w-2 h-2 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-center text-muted-foreground mb-3">
                    Sosyal akışa katılmak için üye olun
                  </p>
                  <Link href="/register" className="block">
                    <Button className="w-full" size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Hemen Üye Ol
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
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
