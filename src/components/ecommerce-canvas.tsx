'use client';

import { useState, useMemo } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { useAppStore } from '@/lib/store';
import { Product, MarketplaceListing, Order } from '@/lib/ecommerce-types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ShoppingCart,
  Grid3x3,
  List,
  Search,
  Filter,
  ChevronDown,
  Star,
  Heart,
  Eye,
} from 'lucide-react';

type ViewMode = 'grid' | 'list' | 'compact';
type EcommerceContentType = 'products' | 'marketplace' | 'cart' | 'orders';

interface EcommerceCanvasProps {
  item: ContentItem;
  contentType: EcommerceContentType;
  viewMode?: ViewMode;
}

export function EcommerceCanvas({ item, contentType, viewMode: initialViewMode = 'grid' }: EcommerceCanvasProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'date'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const products = useAppStore((state) => state.products);
  const marketplaceListings = useAppStore((state) => state.marketplaceListings);
  const shoppingCart = useAppStore((state) => state.shoppingCart);
  const orders = useAppStore((state) => state.orders);
  const addToCart = useAppStore((state) => state.addToCart);
  const user = useAppStore((state) => state.user);

  const filteredData = useMemo(() => {
    let data: any[] = [];
    
    if (contentType === 'products') {
      data = products.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (contentType === 'marketplace') {
      data = marketplaceListings.filter(l => 
        l.status === 'active' &&
        (l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         l.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else if (contentType === 'cart') {
      return shoppingCart.items;
    } else if (contentType === 'orders') {
      data = orders;
    }

    // Sort
    if (contentType === 'products' || contentType === 'marketplace') {
      data.sort((a, b) => {
        let aVal: any, bVal: any;
        
        if (sortBy === 'price') {
          aVal = a.price || 0;
          bVal = b.price || 0;
        } else if (sortBy === 'name') {
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
        } else {
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
        }

        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return data;
  }, [contentType, products, marketplaceListings, shoppingCart, orders, searchQuery, sortBy, sortDirection]);

  const renderProductCard = (product: Product, isMarketplace = false) => {
    const listing = isMarketplace ? product as unknown as MarketplaceListing : null;
    
    if (viewMode === 'grid') {
      return (
        <div
          key={product.id}
          className="group relative bg-card border border-border/60 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50"
        >
          {/* Image */}
          {product.image && (
            <div className="relative aspect-square overflow-hidden bg-muted">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
              {product.type && (
                <div className="absolute top-2 left-2">
                  <span className={cn(
                    "inline-block text-[10px] px-2 py-1 rounded-full font-semibold",
                    product.type === 'digital' 
                      ? 'bg-blue-500/90 text-white' 
                      : 'bg-orange-500/90 text-white'
                  )}>
                    {product.type === 'digital' ? '💾 Dijital' : '📦 Fiziksel'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-3 space-y-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                {product.title}
              </h3>
              {product.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>

            {listing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {listing.views || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {listing.favorites || 0}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="space-y-0.5">
                <p className="text-lg font-bold text-primary">
                  ${(product.price / 100).toFixed(2)}
                </p>
                {listing && listing.sellerId && (
                  <p className="text-[10px] text-muted-foreground">
                    {listing.sellerName}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => addToCart(product, 1)}
                className="h-8 text-xs"
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                Sepete Ekle
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // List view
    return (
      <div
        key={product.id}
        className="flex gap-3 p-3 bg-card border border-border/60 rounded-lg hover:bg-accent/50 transition-all"
      >
        {product.image && (
          <img
            src={product.image}
            alt={product.title}
            className="h-20 w-20 rounded object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="font-semibold text-sm truncate">{product.title}</h3>
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "inline-block text-[9px] px-1.5 py-0.5 rounded",
              product.type === 'digital' 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-orange-500/20 text-orange-400'
            )}>
              {product.type === 'digital' ? '💾 Dijital' : '📦 Fiziksel'}
            </span>
            <p className="text-sm font-bold text-primary">
              ${(product.price / 100).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-between items-end">
          <Button
            size="sm"
            onClick={() => addToCart(product, 1)}
            className="h-7 text-xs"
          >
            🛒 Sepete Ekle
          </Button>
        </div>
      </div>
    );
  };

  const renderCart = () => {
    if (shoppingCart.items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">Sepetiniz boş</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ürün eklemek için alışverişe başlayın
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-3">
          {shoppingCart.items.map((cartItem: any) => {
            const product = products.find(p => p.id === cartItem.productId);
            if (!product) return null;
            
            return (
              <div key={cartItem.id} className="flex gap-3 p-4 bg-card border border-border/60 rounded-lg">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-20 w-20 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Miktar: {cartItem.quantity} × ${(cartItem.price / 100).toFixed(2)}
                  </p>
                </div>
                <p className="font-bold text-lg text-primary">
                  ${((cartItem.price * cartItem.quantity) / 100).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Ara Toplam:</span>
              <span>${(shoppingCart.subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Vergi:</span>
              <span>${(shoppingCart.tax / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kargo:</span>
              <span>${(shoppingCart.shipping / 100).toFixed(2)}</span>
            </div>
            {shoppingCart.discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>İndirim:</span>
                <span>-${(shoppingCart.discount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Toplam:</span>
              <span className="text-primary">${(shoppingCart.total / 100).toFixed(2)}</span>
            </div>
          </div>
          <Button className="w-full" size="lg">
            Ödemeye Geç
          </Button>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    if (orders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-semibold text-muted-foreground">Siparişiniz bulunmuyor</p>
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        {orders.map((order: Order) => (
          <div key={order.id} className="p-4 bg-card border border-border/60 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">Sipariş #{order.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <span className={cn(
                "inline-block text-xs px-2 py-1 rounded-full font-semibold",
                order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                order.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              )}>
                {order.status === 'completed' ? '✓ Tamamlandı' :
                 order.status === 'pending' ? '⏳ Beklemede' :
                 order.status === 'cancelled' ? '✗ İptal' :
                 '📦 Kargoda'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border/40">
              <p className="text-sm text-muted-foreground">
                {order.items.length} ürün
              </p>
              <p className="font-bold text-primary">
                ${(order.total / 100).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">
            {contentType === 'products' && 'Ürünler'}
            {contentType === 'marketplace' && 'Market Yeri'}
            {contentType === 'cart' && 'Sepet'}
            {contentType === 'orders' && 'Siparişlerim'}
          </h2>
          
          {contentType !== 'cart' && contentType !== 'orders' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {contentType !== 'cart' && contentType !== 'orders' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <Button size="sm" variant="outline" className="h-9 gap-1.5">
              <Filter className="h-4 w-4" />
              Filtre
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {contentType === 'cart' ? renderCart() :
           contentType === 'orders' ? renderOrders() :
           viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredData.map((item) => renderProductCard(item, contentType === 'marketplace'))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map((item) => renderProductCard(item, contentType === 'marketplace'))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
