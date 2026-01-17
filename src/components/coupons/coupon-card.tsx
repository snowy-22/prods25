'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Ticket, Percent, Gift, Clock, Check, X, 
  Copy, ExternalLink, ShoppingBag, Tag, 
  Calendar, AlertCircle, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { CouponCard as CouponCardType } from '@/lib/rewards-types';

interface CouponCardProps {
  coupon: CouponCardType;
  onUse?: (couponId: string) => void;
  onClick?: (coupon: CouponCardType) => void;
  compact?: boolean;
  showCopyButton?: boolean;
}

const statusConfig = {
  active: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50',
    border: 'border-green-300 dark:border-green-700',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    icon: Ticket,
    label: 'Aktif'
  },
  used: {
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    border: 'border-slate-300 dark:border-slate-700',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    icon: Check,
    label: 'Kullanıldı'
  },
  expired: {
    bg: 'bg-red-50/50 dark:bg-red-950/30',
    border: 'border-red-300 dark:border-red-800',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    icon: X,
    label: 'Süresi Doldu'
  },
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-300 dark:border-amber-700',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    icon: Clock,
    label: 'Beklemede'
  }
};

const sourceConfig = {
  achievement: { icon: Gift, label: 'Başarı Ödülü', color: 'text-purple-500' },
  referral: { icon: Sparkles, label: 'Referans Ödülü', color: 'text-blue-500' },
  promotion: { icon: Tag, label: 'Promosyon', color: 'text-orange-500' },
  purchase: { icon: ShoppingBag, label: 'Satın Alma', color: 'text-green-500' },
  admin: { icon: Gift, label: 'Hediye', color: 'text-pink-500' }
};

function CouponCard({ 
  coupon, 
  onUse, 
  onClick,
  compact = false,
  showCopyButton = true 
}: CouponCardProps) {
  const { toast } = useToast();
  const status = statusConfig[coupon.status];
  const source = sourceConfig[coupon.source];
  const StatusIcon = status.icon;
  const SourceIcon = source?.icon || Gift;
  
  // Calculate remaining time
  const remainingTime = useMemo(() => {
    if (!coupon.expiresAt) return null;
    
    const now = new Date();
    const expires = new Date(coupon.expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Süresi doldu';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} gün`;
    if (hours > 0) return `${hours} saat`;
    return 'Son dakikalar';
  }, [coupon.expiresAt]);
  
  const isActive = coupon.status === 'active';
  const isExpiringSoon = remainingTime && !remainingTime.includes('gün') && isActive;
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(coupon.code);
      toast({
        title: 'Kopyalandı!',
        description: `Kupon kodu "${coupon.code}" panoya kopyalandı.`,
      });
    } catch {
      toast({
        title: 'Kopyalanamadı',
        description: 'Kupon kodu manuel olarak kopyalayın.',
        variant: 'destructive'
      });
    }
  };
  
  // Format discount display
  const discountDisplay = useMemo(() => {
    if (coupon.discountType === 'percentage') {
      return `%${coupon.discountValue} İndirim`;
    }
    return `${coupon.discountValue}₺ İndirim`;
  }, [coupon.discountType, coupon.discountValue]);
  
  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
          status.bg,
          status.border,
          !isActive && "opacity-60"
        )}
        onClick={() => onClick?.(coupon)}
      >
        {/* Discount Badge */}
        <div className={cn(
          "flex items-center justify-center w-16 h-10 rounded-lg font-bold text-sm",
          isActive 
            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
            : "bg-muted text-muted-foreground"
        )}>
          {coupon.discountType === 'percentage' ? (
            <span className="flex items-center">
              <Percent className="h-3 w-3 mr-0.5" />
              {coupon.discountValue}
            </span>
          ) : (
            <span>{coupon.discountValue}₺</span>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className="font-mono font-semibold text-sm">{coupon.code}</code>
            {showCopyButton && isActive && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={handleCopy}
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{coupon.title}</p>
        </div>
        
        {/* Status & Expiry */}
        <div className="flex flex-col items-end gap-1">
          <Badge className={status.badge} variant="outline">
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
          {remainingTime && isActive && (
            <span className={cn(
              "text-xs",
              isExpiringSoon ? "text-red-500 font-medium" : "text-muted-foreground"
            )}>
              {remainingTime}
            </span>
          )}
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all",
        status.bg,
        status.border,
        !isActive && "opacity-70",
        isExpiringSoon && isActive && "ring-2 ring-red-500/50"
      )}
      onClick={() => onClick?.(coupon)}
    >
      {/* Dashed Edge Decoration */}
      <div className="absolute left-0 top-0 bottom-0 w-3 flex flex-col justify-center gap-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-background" />
        ))}
      </div>
      
      {/* Status Badge */}
      <Badge 
        className={cn("absolute top-3 right-3 z-10", status.badge)}
        variant="outline"
      >
        <StatusIcon className="h-3 w-3 mr-1" />
        {status.label}
      </Badge>
      
      <div className="pl-6 pr-4 py-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Discount Display */}
          <div className={cn(
            "flex flex-col items-center justify-center w-20 h-20 rounded-xl",
            isActive 
              ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/50 dark:shadow-green-900/30" 
              : "bg-muted text-muted-foreground"
          )}>
            {coupon.discountType === 'percentage' ? (
              <>
                <Percent className="h-5 w-5 mb-0.5" />
                <span className="text-2xl font-bold">{coupon.discountValue}</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold">{coupon.discountValue}</span>
                <span className="text-sm">₺</span>
              </>
            )}
          </div>
          
          {/* Title & Source */}
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-1.5 mb-1">
              <SourceIcon className={cn("h-3.5 w-3.5", source?.color)} />
              <span className="text-xs font-medium text-muted-foreground">
                {source?.label}
              </span>
            </div>
            <h3 className="font-semibold text-base leading-tight mb-1">{coupon.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {coupon.description}
            </p>
          </div>
        </div>
        
        {/* Code Display */}
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg mb-3",
          isActive ? "bg-white/50 dark:bg-black/20" : "bg-muted/50"
        )}>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Kupon Kodu</p>
            <code className="font-mono font-bold text-lg tracking-wider">{coupon.code}</code>
          </div>
          {showCopyButton && isActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1.5"
                  onClick={handleCopy}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Kopyala
                </Button>
              </TooltipTrigger>
              <TooltipContent>Kodu panoya kopyala</TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {/* Conditions & Expiry */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {coupon.minPurchase && coupon.minPurchase > 0 && (
            <Badge variant="outline" className="gap-1">
              <ShoppingBag className="h-3 w-3" />
              Min. {coupon.minPurchase}₺
            </Badge>
          )}
          
          {coupon.maxDiscount && (
            <Badge variant="outline" className="gap-1">
              <Tag className="h-3 w-3" />
              Maks. {coupon.maxDiscount}₺
            </Badge>
          )}
          
          {remainingTime && (
            <Badge 
              variant="outline" 
              className={cn("gap-1", isExpiringSoon && isActive && "border-red-500 text-red-500")}
            >
              <Clock className="h-3 w-3" />
              {remainingTime}
            </Badge>
          )}
        </div>
        
        {/* Use Button */}
        {isActive && onUse && (
          <Button 
            className="w-full mt-4 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onUse(coupon.id);
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Kuponu Kullan
          </Button>
        )}
        
        {/* Used/Expired Info */}
        {coupon.usedAt && (
          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            {new Date(coupon.usedAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })} tarihinde kullanıldı
          </p>
        )}
      </div>
      
      {/* Expiring Soon Warning */}
      {isExpiringSoon && isActive && (
        <div className="flex items-center justify-center gap-1.5 py-2 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
          <AlertCircle className="h-3.5 w-3.5" />
          Son kullanma tarihi yaklaşıyor!
        </div>
      )}
    </motion.div>
  );
}

export default memo(CouponCard);
