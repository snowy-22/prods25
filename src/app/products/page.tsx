'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Grid3x3, List, Filter, ShoppingCart, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Using Product type from store
type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'TRY' | 'JPY';
  type: 'physical' | 'digital' | 'service' | 'subscription';
  status: 'active' | 'inactive' | 'discontinued' | 'draft';
  sku: string;
  quantity: number;
  lowStockThreshold?: number;
  unlimited: boolean;
  image?: string;
  images?: string[];
  category: string;
  tags: string[];
  metadata: Record<string, any>;
  sellerId: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
};

type ViewMode = 'grid' | 'list';
type SortOption = 'popular' | 'newest' | 'price-low' | 'price-high' | 'name';

export default function ProductsPage() {
  const { 
    products, 
    addToCart, 
    shoppingCart,
  } = useAppStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'digital' | 'physical'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered = [...filtered].sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'newest':
        filtered = [...filtered].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, selectedType, sortBy]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  const isInCart = (productId: string) => {
    return shoppingCart.items.some(item => item.productId === productId);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Ürünler</h1>
            <div className="flex items-center gap-4">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Link href="/cart">
                <Button variant="outline" className="relative">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Sepet
                  {shoppingCart.items.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-blue-600">
                      {shoppingCart.items.length}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-zinc-900/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Category */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'Tümü' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="digital">Dijital</SelectItem>
                <SelectItem value="physical">Fiziksel</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Popüler</SelectItem>
                <SelectItem value="newest">En Yeni</SelectItem>
                <SelectItem value="price-low">Ucuzdan Pahalıya</SelectItem>
                <SelectItem value="price-high">Pahalıdan Ucuza</SelectItem>
                <SelectItem value="name">İsme Göre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
            <h3 className="text-xl font-semibold mb-2">Ürün Bulunamadı</h3>
            <p className="text-zinc-400">Filtreleri değiştirmeyi deneyin</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCardGrid
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isInCart={isInCart(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => (
              <ProductCardList
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isInCart={isInCart(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Grid Card Component
function ProductCardGrid({
  product,
  onAddToCart,
  isInCart,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  isInCart: boolean;
}) {
  return (
    <div className="bg-zinc-900 rounded-lg shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all overflow-hidden border border-zinc-800 group">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-zinc-800">
          {product.images && product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <Package className="w-16 h-16" />
            </div>
          )}
          {product.type === 'digital' && (
            <Badge className="absolute top-2 right-2 bg-blue-600">
              💾 Dijital
            </Badge>
          )}
          {product.quantity !== undefined && product.quantity < 10 && !product.unlimited && (
            <Badge className="absolute top-2 left-2 bg-orange-600">
              ⚠️ Son {product.quantity}
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold mb-1 text-white hover:text-blue-400 transition-colors line-clamp-1">
            {product.title}
          </h3>
        </Link>
        <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="text-2xl font-bold text-white">
              ${(product.price / 100).toFixed(2)}
            </div>
            <div className="text-xs text-zinc-500">{product.category}</div>
          </div>

          <Button
            size="sm"
            onClick={() => onAddToCart(product)}
            disabled={isInCart || (product.quantity !== undefined && product.quantity === 0 && !product.unlimited)}
            className={isInCart ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
          >
            {isInCart ? '✓' : (product.quantity === 0 && !product.unlimited) ? '✗' : '+'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// List Card Component
function ProductCardList({
  product,
  onAddToCart,
  isInCart,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  isInCart: boolean;
}) {
  return (
    <div className="bg-zinc-900 rounded-lg shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all overflow-hidden border border-zinc-800 group">
      <div className="flex gap-6 p-6">
        <Link href={`/products/${product.id}`} className="flex-shrink-0">
          <div className="relative w-48 h-48 bg-zinc-800 rounded-lg overflow-hidden">
            {product.images && product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <Package className="w-16 h-16" />
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div>
              <Link href={`/products/${product.id}`}>
                <h3 className="text-xl font-semibold text-white hover:text-blue-400 transition-colors">
                  {product.title}
                </h3>
              </Link>
              <p className="text-zinc-500 text-sm">{product.category}</p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                ${(product.price / 100).toFixed(2)}
              </div>
            </div>
          </div>

          <p className="text-zinc-400 mb-4 line-clamp-3">
            {product.description}
          </p>

          <div className="flex items-center gap-4 mb-4">
            {product.quantity !== undefined && product.quantity < 10 && !product.unlimited && (
              <Badge className="bg-orange-600">
                Son {product.quantity} Adet
              </Badge>
            )}
            {product.type === 'digital' && (
              <Badge className="bg-blue-500">
                💾 Dijital
              </Badge>
            )}
          </div>

          <div className="mt-auto flex gap-2">
            <Button
              onClick={() => onAddToCart(product)}
              disabled={isInCart || (product.quantity !== undefined && product.quantity === 0 && !product.unlimited)}
              className={isInCart ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isInCart ? '✓ Sepette' : (product.quantity === 0 && !product.unlimited) ? '✗ Tükendi' : '+ Sepete Ekle'}
            </Button>
            <Link href={`/products/${product.id}`}>
              <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
                Detayları Gör
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
