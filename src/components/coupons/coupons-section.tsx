'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, Filter, Search, ChevronDown, 
  Loader2, RefreshCw, Sparkles, Grid, List, Gift,
  PercentCircle, Tag, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import CouponCard from './coupon-card';
import type { CouponCard as CouponCardType } from '@/lib/rewards-types';
import * as rewardsService from '@/lib/rewards-service';

interface CouponsSectionProps {
  userId?: string;
  onCouponClick?: (coupon: CouponCardType) => void;
  onUseCoupon?: (couponId: string, code: string) => void;
  className?: string;
  compact?: boolean;
  showHeader?: boolean;
  filterStatus?: 'active' | 'used' | 'expired' | 'all';
}

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'active' | 'used' | 'expired';
type SourceFilter = 'all' | 'achievement' | 'referral' | 'promotion' | 'purchase';

export default function CouponsSection({ 
  userId, 
  onCouponClick,
  onUseCoupon,
  className,
  compact = false,
  showHeader = true,
  filterStatus
}: CouponsSectionProps) {
  const { toast } = useToast();
  const user = useAppStore(state => state.user);
  const effectiveUserId = userId || user?.id;
  
  const [coupons, setCoupons] = useState<CouponCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(filterStatus || 'all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  
  // Load coupons
  const loadCoupons = useCallback(async () => {
    if (!effectiveUserId) return;
    
    setIsLoading(true);
    try {
      const cards = await rewardsService.getCouponCards(effectiveUserId);
      setCoupons(cards);
    } catch (error) {
      console.error('Failed to load coupons:', error);
      toast({
        title: 'Hata',
        description: 'Kuponlar yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, toast]);
  
  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);
  
  // Subscribe to realtime updates
  useEffect(() => {
    if (!effectiveUserId) return;
    
    const unsubscribe = rewardsService.subscribeToRewards(effectiveUserId, (event) => {
      if (event.type === 'coupon_issued' || event.type === 'coupon_used') {
        loadCoupons();
      }
    });
    
    return () => unsubscribe();
  }, [effectiveUserId, loadCoupons]);
  
  // Use coupon handler
  const handleUseCoupon = useCallback(async (couponId: string) => {
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon) return;
    
    if (onUseCoupon) {
      onUseCoupon(couponId, coupon.code);
    } else {
      // Copy code and show instructions
      try {
        await navigator.clipboard.writeText(coupon.code);
        toast({
          title: 'Kupon Kodu Kopyalandı!',
          description: `"${coupon.code}" kodunu ödeme sayfasında kullanabilirsiniz.`,
        });
      } catch {
        toast({
          title: 'Kupon Kodu',
          description: `Kod: ${coupon.code}`,
        });
      }
    }
  }, [coupons, onUseCoupon, toast]);
  
  // Filter coupons
  const filteredCoupons = useMemo(() => {
    let filtered = [...coupons];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.code.toLowerCase().includes(query) || 
        c.title.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(c => c.source === sourceFilter);
    }
    
    // Sort: active first, then by expiry date, then by discount value
    filtered.sort((a, b) => {
      // Active coupons first
      const statusOrder = { active: 0, pending: 1, used: 2, expired: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      
      // By expiry (soonest first for active)
      if (a.expiresAt && b.expiresAt) {
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      }
      
      // By discount value (highest first)
      return b.discountValue - a.discountValue;
    });
    
    return filtered;
  }, [coupons, searchQuery, statusFilter, sourceFilter]);
  
  // Stats
  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter(c => c.status === 'active').length;
    const used = coupons.filter(c => c.status === 'used').length;
    const expired = coupons.filter(c => c.status === 'expired').length;
    const totalSavings = coupons
      .filter(c => c.status === 'used')
      .reduce((sum, c) => sum + c.discountValue, 0);
    
    return { total, active, used, expired, totalSavings };
  }, [coupons]);
  
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col gap-4 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Kuponlarım</h2>
                <p className="text-sm text-muted-foreground">
                  {stats.active} aktif kupon
                </p>
              </div>
            </div>
            
            {/* Stats Badges */}
            <div className="flex items-center gap-2">
              {stats.active > 0 && (
                <Badge className="bg-green-500 text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {stats.active} kullanılabilir
                </Badge>
              )}
              {stats.totalSavings > 0 && (
                <Badge variant="outline">
                  <Gift className="h-3 w-3 mr-1 text-purple-500" />
                  {stats.totalSavings}₺ tasarruf
                </Badge>
              )}
            </div>
          </div>
          
          {/* Search & Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kupon ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Durum</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Durum</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  Tümü {statusFilter === 'all' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  Aktif {statusFilter === 'active' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('used')}>
                  Kullanıldı {statusFilter === 'used' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('expired')}>
                  Süresi Doldu {statusFilter === 'expired' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Source Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Tag className="h-4 w-4" />
                  <span className="hidden sm:inline">Kaynak</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Kaynak</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSourceFilter('all')}>
                  Tümü {sourceFilter === 'all' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter('achievement')}>
                  Başarı Ödülü {sourceFilter === 'achievement' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter('referral')}>
                  Referans {sourceFilter === 'referral' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter('promotion')}>
                  Promosyon {sourceFilter === 'promotion' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Refresh */}
            <Button variant="ghost" size="icon" onClick={loadCoupons}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Status Tabs (Alternative View) */}
      {!filterStatus && (
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="gap-1">
              Tümü
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1">
              Aktif
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-green-100 text-green-700">{stats.active}</Badge>
            </TabsTrigger>
            <TabsTrigger value="used" className="gap-1">
              Kullanıldı
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{stats.used}</Badge>
            </TabsTrigger>
            <TabsTrigger value="expired" className="gap-1">
              Süresi Doldu
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{stats.expired}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredCoupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">Kupon Bulunamadı</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? 'Arama kriterlerinize uygun kupon bulunamadı.'
                  : statusFilter === 'active'
                    ? 'Aktif kuponunuz yok. Başarı kazanarak veya alışveriş yaparak kupon kazanabilirsiniz!'
                    : 'Henüz hiç kuponunuz yok.'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div 
                className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
                    : "flex flex-col gap-2"
                )}
                layout
              >
                {filteredCoupons.map((coupon, index) => (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <CouponCard
                      coupon={coupon}
                      onUse={handleUseCoupon}
                      onClick={onCouponClick}
                      compact={viewMode === 'list'}
                      showCopyButton={true}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
