'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ContentItem } from '@/lib/initial-content';
import { Search, BookOpen, Globe, Users, ShoppingBag, Folder, Grid3X3, MessageSquare, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSourceSearchResult {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: React.ReactNode;
  metadata?: Record<string, any>;
  action?: () => void;
}

interface MultiSourceSearchDialogProps {
  query: string;
  onQueryChange: (query: string) => void;
  libraryItems: ContentItem[];
  onSelectLibraryItem: (item: ContentItem) => void;
  socialUsers?: any[];
  socialContent?: any[];
  onSelectSocialUser?: (user: any) => void;
  onSelectSocialContent?: (content: any) => void;
  marketplaceListings?: any[];
  onSelectMarketplaceListing?: (listing: any) => void;
  isLoading?: boolean;
}

export function MultiSourceSearchDialog({
  query,
  onQueryChange,
  libraryItems,
  onSelectLibraryItem,
  socialUsers = [],
  socialContent = [],
  onSelectSocialUser,
  onSelectSocialContent,
  marketplaceListings = [],
  onSelectMarketplaceListing,
  isLoading = false,
}: MultiSourceSearchDialogProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'web' | 'social' | 'marketplace'>('library');

  // Filter functions for each source
  const libraryResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return libraryItems.filter(item =>
      item.title?.toLowerCase().includes(q) ||
      (item as any).description?.toLowerCase().includes(q)
    ).slice(0, 20); // Limit to 20 results
  }, [query, libraryItems]);

  const webResults = useMemo(() => {
    if (!query.trim()) return [];
    // Web search mock - in production, integrate real search API
    return [
      {
        id: 'web-1',
        title: `Google sonuçları: "${query}"`,
        description: 'Web arama yap',
        url: `https://google.com/search?q=${encodeURIComponent(query)}`,
        source: 'Google',
      },
      {
        id: 'web-2',
        title: `Wikipedia'da "${query}" Ara`,
        description: 'Ansiklopedik bilgi',
        url: `https://wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`,
        source: 'Wikipedia',
      },
      {
        id: 'web-3',
        title: `YouTube'da "${query}" Videolari`,
        description: 'Video arama',
        url: `https://youtube.com/results?search_query=${encodeURIComponent(query)}`,
        source: 'YouTube',
      },
    ];
  }, [query]);

  const socialResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const users = socialUsers.filter(u => 
      u.name?.toLowerCase().includes(q) || 
      u.username?.toLowerCase().includes(q)
    ).slice(0, 10);
    const content = socialContent.filter(c => 
      c.title?.toLowerCase().includes(q) || 
      c.description?.toLowerCase().includes(q)
    ).slice(0, 10);
    return { users, content };
  }, [query, socialUsers, socialContent]);

  const marketplaceResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return (marketplaceListings || [])
      .filter(listing =>
        listing.title?.toLowerCase().includes(q) ||
        listing.description?.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [query, marketplaceListings]);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Arama yap... (Kutuphane, Web, Sosyal, Market)"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-9 h-10"
          autoFocus
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="library" className="gap-1 flex items-center justify-center text-xs sm:text-sm">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Kutuphane</span>
          </TabsTrigger>
          <TabsTrigger value="web" className="gap-1 flex items-center justify-center text-xs sm:text-sm">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Web</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-1 flex items-center justify-center text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Sosyal</span>
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="gap-1 flex items-center justify-center text-xs sm:text-sm">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Market</span>
          </TabsTrigger>
        </TabsList>

        {/* Library Tab */}
        <TabsContent value="library" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {libraryResults.length === 0 && query.trim() ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Kutuphanede sonuc bulunamadi</p>
                </div>
              ) : libraryResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Arama yapmak icin bir sey yazin</p>
                </div>
              ) : (
                libraryResults.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2 px-3 flex flex-col items-start"
                    onClick={() => onSelectLibraryItem(item)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Folder className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium text-left truncate">{item.title}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{item.type}</Badge>
                    </div>
                    {(item as any).description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 w-full text-left">
                        {(item as any).description}
                      </p>
                    )}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Web Tab */}
        <TabsContent value="web" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {webResults.length === 0 || !query.trim() ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Web'te arama yapmak icin bir sey yazin</p>
                </div>
              ) : (
                webResults.map((result) => (
                  <Button
                    key={result.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2 px-3 flex flex-col items-start"
                    onClick={() => window.open(result.url, '_blank')}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium text-left truncate">{result.title}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{result.source}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 w-full text-left">
                      {result.description}
                    </p>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {!query.trim() ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sosyal'da arama yapmak icin bir sey yazin</p>
                </div>
              ) : (
                <>
                  {/* Users Section */}
                  {socialResults.users.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Kullanicilar</h4>
                      <div className="space-y-2">
                        {socialResults.users.map((user) => (
                          <Button
                            key={user.id}
                            variant="ghost"
                            className="w-full justify-start h-auto py-2 px-3 flex flex-col items-start"
                            onClick={() => onSelectSocialUser?.(user)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium text-left">{user.name}</span>
                              <span className="text-xs text-muted-foreground">@{user.username}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Section */}
                  {socialResults.content.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Icerik</h4>
                      <div className="space-y-2">
                        {socialResults.content.map((content) => (
                          <Button
                            key={content.id}
                            variant="ghost"
                            className="w-full justify-start h-auto py-2 px-3 flex flex-col items-start"
                            onClick={() => onSelectSocialContent?.(content)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <MessageSquare className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium text-left truncate">{content.title}</span>
                            </div>
                            {content.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1 w-full text-left">
                                {content.description}
                              </p>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {socialResults.users.length === 0 && socialResults.content.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Sosyal'da sonuc bulunamadi</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {marketplaceResults.length === 0 && query.trim() ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Market'te sonuc bulunamadi</p>
                </div>
              ) : marketplaceResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Arama yapmak icin bir sey yazin</p>
                </div>
              ) : (
                marketplaceResults.map((listing) => (
                  <Button
                    key={listing.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2 px-3 flex flex-col items-start"
                    onClick={() => onSelectMarketplaceListing?.(listing)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium text-left truncate">{listing.title}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        ${(listing.price / 100).toFixed(2)}
                      </Badge>
                    </div>
                    {listing.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 w-full text-left">
                        {listing.description}
                      </p>
                    )}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
