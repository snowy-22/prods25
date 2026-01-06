'use client';

import { ContentItem } from '@/lib/initial-content';
import { Product } from '@/lib/ecommerce-types';
import { ShoppingCart, Package, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useState } from 'react';

/**
 * E-Commerce Product Grid Adapter
 * Ürünleri ContentItem formatından grid view için uyarlar
 */

interface ProductGridAdapterProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export function ProductGridAdapter({ 
  product, 
  viewMode = 'grid',
  onAddToCart,
  onViewDetails
}: ProductGridAdapterProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useAppStore();

  const handleAddToCart = () => {
    addToCart(product, 1);
    onAddToCart?.(product);
  };

  const priceFormatted = `$${(product.price / 100).toFixed(2)}`;
  const isOutOfStock = !product.unlimited && (product.quantity || 0) <= 0;
  const isLowStock = !product.unlimited && (product.quantity || 0) <= (product.lowStockThreshold || 5);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-900/80 to-slate-800/50 rounded-lg border border-slate-700/50 hover:border-purple-500/50 transition-all"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Product Image */}
        <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-slate-800/50">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-slate-600" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{product.title}</h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1">{product.description}</p>
          
          <div className="flex items-center gap-2 mt-2">
            {product.category && (
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="destructive" className="text-xs">
                Stok Azalıyor: {product.quantity}
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive" className="text-xs">
                Stokta Yok
              </Badge>
            )}
          </div>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-400">{priceFormatted}</div>
            <div className="text-xs text-slate-500">{product.currency}</div>
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="bg-purple-500 hover:bg-purple-600"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Sepete Ekle
          </Button>
        </div>
      </motion.div>
    );
  }

  // Grid View (Default)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group bg-gradient-to-br from-slate-900/90 to-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden cursor-pointer transition-all hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10"
      onClick={() => onViewDetails?.(product)}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-slate-800/50 overflow-hidden">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-slate-700" />
          </div>
        )}

        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm font-semibold">
              Stokta Yok
            </Badge>
          </div>
        )}

        {isLowStock && !isOutOfStock && (
          <Badge 
            variant="destructive" 
            className="absolute top-2 right-2 text-xs"
          >
            Son {product.quantity} Adet
          </Badge>
        )}

        {/* Product Type Badge */}
        <Badge 
          variant={product.type === 'digital' ? 'default' : 'secondary'}
          className="absolute top-2 left-2 text-xs"
        >
          {product.type === 'digital' ? 'Dijital' : 'Fiziksel'}
        </Badge>
      </div>

      {/* Product Details */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
          {product.title}
        </h3>

        <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
          {product.description}
        </p>

        {/* Category & Tags */}
        {product.category && (
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
            {product.tags?.slice(0, 2).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs text-slate-500">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Price & Cart Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div>
            <div className="text-xl font-bold text-purple-400">{priceFormatted}</div>
            <div className="text-xs text-slate-500">{product.currency}</div>
          </div>

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={isOutOfStock}
              className="bg-purple-500 hover:bg-purple-600 transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Seller Info */}
        <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/30">
          Satıcı: <span className="text-slate-400">{product.sellerName}</span>
        </div>
      </div>

      {/* Hover Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent pointer-events-none"
      />
    </motion.div>
  );
}

/**
 * Helper: Product'ı ContentItem'a çevir (canvas için)
 */
export function productToContentItem(product: Product): any {
  return {
    id: product.id,
    type: 'folder', // Use folder type instead of ecommerce-product
    title: product.title,
    icon: 'shopping-cart' as any, // Cast to any to avoid type issues
    parentId: null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    tenPointRating: 0, // E-ticaret ürünleri için puan sistemi
    metadata: {
      productType: product.type,
      category: product.category,
      tags: product.tags,
      quantity: product.quantity,
      unlimited: product.unlimited,
      sku: product.sku,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
    },
    images: product.images,
  } as ContentItem;
}

/**
 * Helper: ContentItem'ı Product'a çevir
 */
export function contentItemToProduct(item: ContentItem): Product {
  const metadata = item.metadata || {};
  return {
    id: item.id,
    title: item.title || 'Ürün',
    description: metadata.description || '',
    price: metadata.price || 0,
    currency: 'USD',
    type: (metadata.productType || 'digital') as any,
    status: 'active',
    sku: metadata.sku || `PROD-${item.id}`,
    quantity: metadata.quantity || 999,
    unlimited: metadata.unlimited || true,
    image: (item as any).images?.[0],
    images: (item as any).images || [],
    category: metadata.category,
    tags: metadata.tags || [],
    metadata: metadata,
    sellerId: metadata.sellerId || 'system',
    sellerName: metadata.sellerName || 'CanvasFlow Store',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  } as Product;
}
