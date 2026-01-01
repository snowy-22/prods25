'use client';

import { useState } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  TrendingUp, 
  ShoppingCart,
  DollarSign,
  Barcode,
  Tag
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  basePrice: number;
  salePrice?: number;
  stockQuantity: number;
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  images: string[];
}

interface ProductCatalogWidgetProps {
  item: ContentItem;
  onUpdate?: (updates: Partial<ContentItem>) => void;
}

export function ProductCatalogWidget({ item, onUpdate }: ProductCatalogWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data - gerçek uygulamada Supabase'den çekilecek
  const products: Product[] = item.metadata?.products || [
    {
      id: '1',
      sku: 'PRD-001',
      name: 'Premium Kulaklık',
      category: 'Elektronik',
      basePrice: 1299.99,
      salePrice: 999.99,
      stockQuantity: 45,
      status: 'active',
      images: []
    },
    {
      id: '2',
      sku: 'PRD-002',
      name: 'Bluetooth Hoparlör',
      category: 'Elektronik',
      basePrice: 599.99,
      stockQuantity: 12,
      status: 'active',
      images: []
    },
    {
      id: '3',
      sku: 'PRD-003',
      name: 'Laptop Çantası',
      category: 'Aksesuar',
      basePrice: 349.99,
      stockQuantity: 0,
      status: 'out_of_stock',
      images: []
    }
  ];

  const categories = ['Elektronik', 'Aksesuar', 'Giyim', 'Ev & Yaşam'];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStock = products.filter(p => p.stockQuantity < 10 && p.stockQuantity > 0).length;
  const outOfStock = products.filter(p => p.status === 'out_of_stock').length;

  const getStatusBadge = (status: Product['status']) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      discontinued: 'destructive',
      out_of_stock: 'destructive'
    } as const;

    const labels = {
      active: 'Aktif',
      inactive: 'Pasif',
      discontinued: 'Üretim Durduruldu',
      out_of_stock: 'Stokta Yok'
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item.title || 'Ürün Kataloğu'}
          </CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ürün
          </Button>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Toplam</span>
            </div>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Aktif</span>
            </div>
            <div className="text-2xl font-bold">{activeProducts}</div>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm font-medium">Düşük Stok</span>
            </div>
            <div className="text-2xl font-bold">{lowStock}</div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
              <Trash2 className="h-4 w-4" />
              <span className="text-sm font-medium">Tükendi</span>
            </div>
            <div className="text-2xl font-bold">{outOfStock}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filtreler */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ürün ara (ad, SKU)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Pasif</SelectItem>
              <SelectItem value="out_of_stock">Stokta Yok</SelectItem>
              <SelectItem value="discontinued">Üretim Durduruldu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ürün Tablosu */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Ürün Adı</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Fiyat</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-muted-foreground" />
                      {product.sku}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <Tag className="h-3 w-3" />
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {product.salePrice && (
                        <span className="text-sm line-through text-muted-foreground">
                          ₺{product.basePrice.toFixed(2)}
                        </span>
                      )}
                      <span className="font-semibold flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ₺{(product.salePrice || product.basePrice).toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      product.stockQuantity === 0 ? 'text-red-600' :
                      product.stockQuantity < 10 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {product.stockQuantity}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ürün bulunamadı</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
