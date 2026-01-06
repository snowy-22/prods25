'use client';

import { ContentItem } from '@/lib/initial-content';
import { Product, ShoppingCart } from '@/lib/ecommerce-types';
import { useAppStore } from '@/lib/store';
import { 
  productToContentItem, 
  contentItemToProduct 
} from '@/components/ecommerce/product-grid-adapter';
import { 
  marketplaceListingToContentItem, 
  contentItemToMarketplaceListing 
} from '@/components/ecommerce/marketplace-list-adapter';
import { MarketplaceListing } from '@/lib/marketplace-types';

/**
 * E-Commerce Canvas Hook
 * Canvas'ta e-ticaret ürünleri ve marketplace listeleri ile çalışmayı kolaylaştırır
 */

export function useEcommerceCanvas() {
  const store = useAppStore();

  /**
   * Ürünü canvas'ta açmak için ContentItem'a dönüştür
   */
  const openProductInCanvas = (product: Product, newTab = true) => {
    const contentItem = productToContentItem(product);
    
    if (newTab) {
      store.openInNewTab(contentItem, [contentItem]);
    } else {
      store.setActiveTab(contentItem.id);
    }
    
    return contentItem;
  };

  /**
   * Marketplace listesini canvas'ta açmak için ContentItem'a dönüştür
   */
  const openMarketplaceInCanvas = (listing: MarketplaceListing, newTab = true) => {
    const contentItem = marketplaceListingToContentItem(listing);
    
    if (newTab) {
      store.openInNewTab(contentItem, [contentItem]);
    } else {
      store.setActiveTab(contentItem.id);
    }
    
    return contentItem;
  };

  /**
   * Birden fazla ürünü grid modunda aç
   */
  const openProductsInGrid = (products: Product[]) => {
    const contentItems = products.map(productToContentItem);
    
    // Grid mode'a geç
    store.setLayoutMode('grid');
    store.setGridModeEnabled(true);
    store.setGridModeType('vertical');
    
    return contentItems;
  };

  /**
   * Birden fazla marketplace listesini custom list mode'da aç
   */
  const openMarketplaceListingsInList = (listings: MarketplaceListing[]) => {
    const contentItems = listings.map(marketplaceListingToContentItem);
    
    // Custom list mode'a geç (grid mode'u kapat)
    store.setLayoutMode('grid');
    store.setGridModeEnabled(false);
    
    return contentItems;
  };

  /**
   * Sepete ekle (e-ticaret store'dan)
   */
  const addToCart = (product: Product, quantity = 1, variantId?: string) => {
    store.addToCart(product, quantity, variantId);
  };

  /**
   * ContentItem'dan ürün al
   */
  const getProductFromContentItem = (item: ContentItem): Product | null => {
    // Check if item has product properties
    if (!(item as any).price) return null;
    return contentItemToProduct(item);
  };

  /**
   * ContentItem'dan marketplace listesi al
   */
  const getMarketplaceListingFromContentItem = (item: ContentItem): MarketplaceListing | null => {
    // Check if item has marketplace properties
    if (!(item as any).shippingOptions) return null;
    return contentItemToMarketplaceListing(item);
  };

  /**
   * E-ticaret ürünü mü kontrol et
   */
  const isEcommerceProduct = (item: ContentItem): boolean => {
    return !!(item as any).price;
  };

  /**
   * Marketplace listesi mi kontrol et
   */
  const isMarketplaceListing = (item: ContentItem): boolean => {
    return !!(item as any).shippingOptions;
  };

  /**
   * E-ticaret sepeti al
   */
  const getCart = (): ShoppingCart => {
    return store.shoppingCart;
  };

  /**
   * Sepetin toplam tutarını al
   */
  const getCartTotal = (): string => {
    const total = store.shoppingCart.total;
    return `$${(total / 100).toFixed(2)}`;
  };

  /**
   * Sepetin item sayısını al
   */
  const getCartItemCount = (): number => {
    return store.shoppingCart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  };

  /**
   * Sepetin toplam item sayısını al (farklı ürünler)
   */
  const getCartUniqueItemCount = (): number => {
    return store.shoppingCart.items.length;
  };

  /**
   * Favorilere ekle
   */
  const addToWishlist = (listing: MarketplaceListing) => {
    store.addToWishlist({
      productName: listing.title,
      status: 'interested',
      imageUrl: listing.images?.[0],
      targetPrice: listing.price,
    } as any);
  };

  /**
   * Favorilerden kaldır
   */
  const removeFromWishlist = (listingId: string) => {
    // Find and remove wishlist item by matching listing
    const item = store.wishlistItems.find(w => w.productName?.includes(listingId));
    if (item) {
      store.removeFromWishlist(item.id);
    }
  };

  /**
   * Favorilerde mi kontrol et
   */
  const isInWishlist = (listingId: string): boolean => {
    return store.wishlistItems.some(w => w.productName?.includes(listingId) || false);
  };

  return {
    // Canvas açma fonksiyonları
    openProductInCanvas,
    openMarketplaceInCanvas,
    openProductsInGrid,
    openMarketplaceListingsInList,
    
    // Sepet işlemleri
    addToCart,
    getCart,
    getCartTotal,
    getCartItemCount,
    getCartUniqueItemCount,
    
    // Dönüştürme fonksiyonları
    getProductFromContentItem,
    getMarketplaceListingFromContentItem,
    
    // Tip kontrol fonksiyonları
    isEcommerceProduct,
    isMarketplaceListing,
    
    // Favoriler
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  };
}
