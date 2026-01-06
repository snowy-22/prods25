'use client';

import { MarketplaceListing } from '@/lib/marketplace-types';
import { ContentItem } from '@/lib/initial-content';
import { 
  Eye, Heart, MessageCircle, ShoppingBag, 
  Package, Star, TrendingUp, Clock,
  User, MapPin, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';

/**
 * E-Commerce Marketplace List Adapter
 * Marketplace listelerini ContentItem formatından özel liste modu için uyarlar
 */

interface MarketplaceListAdapterProps {
  listing: MarketplaceListing;
  viewMode?: 'compact' | 'detailed';
  onViewDetails?: (listing: MarketplaceListing) => void;
  onContact?: (listing: MarketplaceListing) => void;
  onBuy?: (listing: MarketplaceListing) => void;
  onFavorite?: (listing: MarketplaceListing) => void;
}

export function MarketplaceListAdapter({
  listing,
  viewMode = 'detailed',
  onViewDetails,
  onContact,
  onBuy,
  onFavorite,
}: MarketplaceListAdapterProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const priceFormatted = `$${(listing.price / 100).toFixed(2)}`;
  const isAvailable = listing.status === 'active';
  const isSold = listing.status === 'sold';

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'text-green-400 border-green-500/50';
      case 'like-new': return 'text-blue-400 border-blue-500/50';
      case 'good': return 'text-purple-400 border-purple-500/50';
      case 'fair': return 'text-amber-400 border-amber-500/50';
      case 'poor': return 'text-red-400 border-red-500/50';
      default: return 'text-slate-400 border-slate-500/50';
    }
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      'new': 'Sıfır',
      'like-new': 'Sıfır Gibi',
      'good': 'İyi',
      'fair': 'Orta',
      'poor': 'Kullanılmış',
    };
    return labels[condition] || condition;
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavorite?.(listing);
  };

  if (viewMode === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-purple-500/30 transition-all cursor-pointer"
        onClick={() => onViewDetails?.(listing)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-md overflow-hidden bg-slate-800/50 flex-shrink-0">
          {listing.images?.[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-slate-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-sm truncate">{listing.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-xs ${getConditionColor(listing.condition)}`}>
              {getConditionLabel(listing.condition)}
            </Badge>
            <span className="text-xs text-slate-500">{listing.sellerName}</span>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <div className="text-lg font-bold text-purple-400">{priceFormatted}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {listing.views}
          </div>
        </div>
      </motion.div>
    );
  }

  // Detailed View (Default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden cursor-pointer transition-all hover:border-purple-500/50 hover:shadow-lg"
      onClick={() => onViewDetails?.(listing)}
    >
      <div className="flex gap-4 p-4">
        {/* Image Gallery */}
        <div className="w-48 h-48 rounded-lg overflow-hidden bg-slate-800/50 flex-shrink-0">
          {listing.images && listing.images.length > 0 ? (
            <div className="relative w-full h-full">
              <img 
                src={listing.images[0]} 
                alt={listing.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              {listing.images.length > 1 && (
                <Badge className="absolute bottom-2 right-2 text-xs bg-black/70 backdrop-blur-sm">
                  +{listing.images.length - 1} Fotoğraf
                </Badge>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-20 w-20 text-slate-700" />
            </div>
          )}

          {/* Favorite Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavorite}
            className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
          >
            <Heart 
              className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`} 
            />
          </motion.button>
        </div>

        {/* Listing Details */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                {listing.title}
              </h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">{priceFormatted}</div>
                {listing.compareAtPrice && listing.compareAtPrice > listing.price && (
                  <div className="text-xs text-slate-500 line-through">
                    ${(listing.compareAtPrice / 100).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-slate-400 mt-2 line-clamp-2">
              {listing.description}
            </p>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Condition */}
            <Badge variant="outline" className={getConditionColor(listing.condition)}>
              {getConditionLabel(listing.condition)}
            </Badge>

            {/* Category */}
            {listing.category && (
              <Badge variant="outline" className="text-xs">
                {listing.category}
              </Badge>
            )}

            {/* Location */}
            {listing.location && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3" />
                {listing.location}
              </div>
            )}

            {/* Status */}
            {!isAvailable && (
              <Badge variant={isSold ? 'destructive' : 'secondary'} className="text-xs">
                {isSold ? 'Satıldı' : 'Rezerve'}
              </Badge>
            )}

            {/* Warranty */}
            {/* hasWarranty property doesn't exist on MarketplaceListing */}

          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {listing.sellerName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{listing.sellerName}</div>
              <div className="text-xs text-slate-500">Satıcı</div>
            </div>
            {/* sellerRating property doesn't exist on MarketplaceListing */}
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {listing.views}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {listing.favorites}
              </div>
              {listing.questions && listing.questions.length > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {listing.questions.length}
                </div>
              )}
              {listing.listedAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(listing.listedAt).toLocaleDateString('tr-TR')}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onContact?.(listing);
                }}
                className="text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                İletişim
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onBuy?.(listing);
                }}
                disabled={!isAvailable}
                className="bg-purple-500 hover:bg-purple-600 text-xs"
              >
                <ShoppingBag className="h-3 w-3 mr-1" />
                {isSold ? 'Satıldı' : 'Satın Al'}
              </Button>
            </div>
          </div>

          {/* Shipping Options */}
          {listing.shippingOptions && listing.shippingOptions.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <Package className="h-3 w-3" />
              <span>
                Kargo: {listing.shippingOptions.map(opt => 
                  `${opt.method} ($${(opt.price / 100).toFixed(2)} - ${opt.estimatedDays} gün)`
                ).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent pointer-events-none"
      />
    </motion.div>
  );
}

/**
 * Helper: MarketplaceListing'i ContentItem'a çevir
 */
export function marketplaceListingToContentItem(listing: MarketplaceListing): ContentItem {
  return {
    id: listing.id,
    type: 'folder' as any, // Use folder type instead of ecommerce-marketplace
    title: listing.title,
    description: listing.description,
    icon: 'shopping-bag' as any, // Cast to any to avoid type issues
    parentId: null,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    tenPointRating: 0,
    price: listing.price,
    metadata: {
      listingStatus: listing.status,
      condition: listing.condition,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      category: listing.category,
      location: listing.location,
      views: listing.views,
      favorites: listing.favorites,
      shippingOptions: listing.shippingOptions,
      compareAtPrice: listing.compareAtPrice,
      listedAt: listing.createdAt,
    },
    images: listing.images || [],
  } as any;
}

/**
 * Helper: ContentItem'ı MarketplaceListing'e çevir
 */
export function contentItemToMarketplaceListing(item: ContentItem): MarketplaceListing {
  const metadata = item.metadata || {};
  return {
    id: item.id,
    itemId: item.id,
    sellerId: metadata.sellerId || 'unknown',
    sellerName: metadata.sellerName || 'Unknown',
    status: (metadata.listingStatus || 'active') as any,
    title: item.title || 'İlan',
    description: (item as any).description || '',
    price: (item as any).price || 0,
    compareAtPrice: metadata.compareAtPrice,
    images: metadata.images as string[] || [],
    category: metadata.category,
    condition: metadata.condition || 'good',
    location: metadata.location,
    shippingOptions: metadata.shippingOptions || [],
    views: metadata.views || 0,
    favorites: metadata.favorites || 0,
    questions: [],
    offers: [],
    hasWarranty: metadata.hasWarranty || false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    listedAt: metadata.listedAt || item.createdAt,
    soldAt: metadata.soldAt,
  } as MarketplaceListing;
}
