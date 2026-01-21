'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Sparkles, Clock, Star, TrendingUp, Music, 
  MapPin, Video, Globe, BookOpen, ShoppingBag, Gamepad2,
  Newspaper, Cloud, Utensils, Plane, Film, Podcast,
  ChevronRight, ExternalLink, Play, Heart, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { ContentItem, ItemType } from '@/lib/initial-content';
import { fetchAiResult, fetchWebResults, fetchYoutubeResults } from '@/lib/search-apis';

interface EnhancedSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem?: (item: Partial<ContentItem> & { type: ItemType }, parentId: string | null) => void;
  activeViewId?: string | null;
}

// Kişisel kısayollar
const personalShortcuts = [
  { id: 'youtube', icon: Video, label: 'YouTube', color: 'bg-red-500', url: 'https://youtube.com' },
  { id: 'spotify', icon: Music, label: 'Spotify', color: 'bg-green-500', url: 'https://open.spotify.com' },
  { id: 'maps', icon: MapPin, label: 'Haritalar', color: 'bg-blue-500', url: 'https://maps.google.com' },
  { id: 'news', icon: Newspaper, label: 'Haberler', color: 'bg-purple-500', url: 'https://news.google.com' },
  { id: 'weather', icon: Cloud, label: 'Hava Durumu', color: 'bg-cyan-500', url: 'https://weather.com' },
  { id: 'shopping', icon: ShoppingBag, label: 'Alışveriş', color: 'bg-orange-500', url: 'https://trendyol.com' },
];

// Algoritmik öneriler - kullanıcı geçmişine göre
const algorithmicSuggestions = [
  { 
    id: 'music-relax', 
    title: 'Rahatlatıcı Müzikler', 
    description: 'Çalışırken dinlemek için lofi beats',
    icon: Music,
    color: 'from-purple-500 to-pink-500',
    sources: ['Spotify', 'Apple Music', 'YouTube Music'],
    type: 'playlist' as const
  },
  { 
    id: 'trending-videos', 
    title: 'Trend Videolar', 
    description: 'Bugün en çok izlenen içerikler',
    icon: TrendingUp,
    color: 'from-red-500 to-orange-500',
    sources: ['YouTube', 'TikTok', 'Twitch'],
    type: 'video' as const
  },
  { 
    id: 'news-tech', 
    title: 'Teknoloji Haberleri', 
    description: 'Yapay zeka ve yazılım dünyasından',
    icon: Newspaper,
    color: 'from-blue-500 to-cyan-500',
    sources: ['Engadget', 'The Verge', 'Wired'],
    type: 'article' as const
  },
  { 
    id: 'food-nearby', 
    title: 'Yakındaki Restoranlar', 
    description: 'Açık ve yüksek puanlı mekanlar',
    icon: Utensils,
    color: 'from-green-500 to-emerald-500',
    sources: ['Google Maps', 'Yemeksepeti', 'Foursquare'],
    type: 'place' as const
  },
];

// Platform kaynak ikonları
const platformIcons: Record<string, string> = {
  'Spotify': 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
  'Apple Music': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Apple_Music_icon.svg',
  'YouTube Music': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Youtube_Music_icon.svg',
  'YouTube': 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
  'Google': 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
  'Google Maps': 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg',
  'ChatGPT': 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
  'Gemini': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Google_Gemini_logo.svg',
  'Perplexity': 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.png',
};

export default function EnhancedSearchPanel({ isOpen, onClose, onAddItem, activeViewId }: EnhancedSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Search results state
  const [aiResult, setAiResult] = useState<string>('');
  const [webResults, setWebResults] = useState<any[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  
  // Store
  const searchHistory = useAppStore(s => s.searchHistory);
  const addSearchHistory = useAppStore(s => s.addSearchHistory);
  const username = useAppStore(s => s.username);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Search function
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    addSearchHistory(query);
    
    try {
      // Parallel fetch from all sources
      const [ai, web, yt] = await Promise.allSettled([
        fetchAiResult(query),
        fetchWebResults(query),
        fetchYoutubeResults(query)
      ]);
      
      if (ai.status === 'fulfilled') setAiResult(ai.value);
      if (web.status === 'fulfilled') setWebResults(web.value);
      if (yt.status === 'fulfilled') setYoutubeResults(yt.value);
      
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, addSearchHistory]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSearch();
    }
  };

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setShowResults(false);
      setAiResult('');
      setWebResults([]);
      setYoutubeResults([]);
    }
  }, [isOpen]);

  // Get current hour for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh]"
      >
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-4xl mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Header with search input */}
          <div className="p-4 border-b border-white/10">
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ne aramak istersiniz?"
                  className="w-full pl-12 pr-4 py-6 text-lg bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-12 w-12 rounded-xl hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Content area */}
          <ScrollArea className="h-[60vh]">
            <AnimatePresence mode="wait">
              {!showResults ? (
                /* Welcome Screen */
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 space-y-8"
                >
                  {/* Greeting */}
                  <div className="text-center py-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Sparkles className="h-10 w-10 mx-auto mb-3 text-indigo-400" />
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {getGreeting()}{username ? `, ${username}` : ''}! 👋
                      </h2>
                      <p className="text-white/60">
                        Bugün size nasıl yardımcı olabilirim?
                      </p>
                    </motion.div>
                  </div>

                  {/* Personal Shortcuts */}
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4" /> Kişisel Kısayollar
                    </h3>
                    <div className="grid grid-cols-6 gap-3">
                      {personalShortcuts.map((shortcut, i) => (
                        <motion.button
                          key={shortcut.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          onClick={() => window.open(shortcut.url, '_blank')}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition-all group"
                        >
                          <div className={cn("p-3 rounded-xl", shortcut.color, "group-hover:scale-110 transition-transform")}>
                            <shortcut.icon className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-xs text-white/70 group-hover:text-white">{shortcut.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Recent Searches */}
                  {searchHistory && searchHistory.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Son Aramalar
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {searchHistory.slice(0, 8).map((item, i) => (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.03 }}
                            onClick={() => {
                              setQuery(item.query);
                              handleSearch();
                            }}
                            className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-all border border-white/10"
                          >
                            {item.query}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Algorithmic Suggestions */}
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Size Özel Öneriler
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {algorithmicSuggestions.map((suggestion, i) => (
                        <motion.div
                          key={suggestion.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                        >
                          <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group overflow-hidden">
                            <div className={cn("h-1 bg-gradient-to-r", suggestion.color)} />
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div className={cn("p-2 rounded-lg bg-gradient-to-r", suggestion.color)}>
                                  <suggestion.icon className="h-5 w-5 text-white" />
                                </div>
                                <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                              </div>
                              <CardTitle className="text-white text-base mt-2">{suggestion.title}</CardTitle>
                              <CardDescription className="text-white/50">{suggestion.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex gap-1">
                                {suggestion.sources.map(source => (
                                  <Badge key={source} variant="secondary" className="bg-white/10 text-white/60 text-xs">
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Platform Links */}
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-sm font-semibold text-white/70 mb-3">Daha Fazla Kaynak</h3>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { name: 'Google', url: 'https://google.com' },
                        { name: 'YouTube', url: 'https://youtube.com' },
                        { name: 'Spotify', url: 'https://open.spotify.com' },
                        { name: 'Google Maps', url: 'https://maps.google.com' },
                        { name: 'ChatGPT', url: 'https://chat.openai.com' },
                        { name: 'Gemini', url: 'https://gemini.google.com' },
                        { name: 'Perplexity', url: 'https://perplexity.ai' },
                      ].map(platform => (
                        <Button
                          key={platform.name}
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(platform.url, '_blank')}
                          className="h-9 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white gap-2"
                        >
                          {platformIcons[platform.name] && (
                            <img src={platformIcons[platform.name]} alt={platform.name} className="h-4 w-4" />
                          )}
                          {platform.name}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Results Screen */
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="p-6"
                >
                  {isSearching ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-400" />
                      </div>
                      <p className="text-white/60 mt-4">Aranıyor...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-6">
                      {/* AI Results */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-4 border border-indigo-500/30"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 rounded-lg bg-indigo-500">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-semibold text-white">AI Yanıtı</h3>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed">
                          {aiResult || 'AI yanıtı yükleniyor...'}
                        </p>
                        <div className="mt-4 flex gap-2">
                          {['ChatGPT', 'Gemini', 'Perplexity'].map(ai => (
                            <Button
                              key={ai}
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 bg-white/5 hover:bg-white/10"
                              onClick={() => window.open(
                                ai === 'ChatGPT' ? 'https://chat.openai.com' :
                                ai === 'Gemini' ? 'https://gemini.google.com' :
                                'https://perplexity.ai',
                                '_blank'
                              )}
                            >
                              {platformIcons[ai] && (
                                <img src={platformIcons[ai]} alt={ai} className="h-4 w-4" />
                              )}
                            </Button>
                          ))}
                        </div>
                      </motion.div>

                      {/* Web Results */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 rounded-lg bg-blue-500">
                            <Globe className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-semibold text-white">Web Sonuçları</h3>
                        </div>
                        <div className="space-y-2">
                          {webResults.length > 0 ? webResults.slice(0, 5).map((result, i) => (
                            <a
                              key={i}
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2 rounded-lg hover:bg-white/10 transition-colors group"
                            >
                              <p className="text-white/90 text-sm font-medium truncate group-hover:text-indigo-300">
                                {result.title}
                              </p>
                              <p className="text-white/40 text-xs truncate">{result.url}</p>
                            </a>
                          )) : (
                            <p className="text-white/50 text-sm">Sonuç bulunamadı</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full mt-3 h-8 bg-white/5 hover:bg-white/10 text-white/70"
                          onClick={() => window.open(`https://google.com/search?q=${encodeURIComponent(query)}`, '_blank')}
                        >
                          <img src={platformIcons['Google']} alt="Google" className="h-4 w-4 mr-2" />
                          Google'da Ara
                        </Button>
                      </motion.div>

                      {/* YouTube Results */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl p-4 border border-red-500/30"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 rounded-lg bg-red-500">
                            <Video className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-semibold text-white">YouTube</h3>
                        </div>
                        <div className="space-y-2">
                          {youtubeResults.length > 0 ? youtubeResults.slice(0, 3).map((video, i) => (
                            <div
                              key={video.id}
                              className="rounded-lg overflow-hidden hover:ring-2 ring-red-500/50 transition-all cursor-pointer group"
                              onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                            >
                              <div className="aspect-video bg-black/30 relative">
                                <img 
                                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Play className="h-8 w-8 text-white" />
                                </div>
                              </div>
                              <p className="text-white/80 text-xs p-2 truncate">{video.title}</p>
                            </div>
                          )) : (
                            <p className="text-white/50 text-sm">Sonuç bulunamadı</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full mt-3 h-8 bg-white/5 hover:bg-white/10 text-white/70"
                          onClick={() => window.open(`https://youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank')}
                        >
                          <img src={platformIcons['YouTube']} alt="YouTube" className="h-4 w-4 mr-2" />
                          YouTube'da Ara
                        </Button>
                      </motion.div>
                    </div>
                  )}

                  {/* Back button */}
                  <div className="mt-6 text-center">
                    <Button
                      variant="ghost"
                      onClick={() => setShowResults(false)}
                      className="text-white/60 hover:text-white"
                    >
                      ← Geri Dön
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
            <span>ESC ile kapat • Enter ile ara</span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              tv25.app tarafından desteklenmektedir
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
