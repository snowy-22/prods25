'use client';

import { useState } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  Plus,
  Minus,
  RotateCcw
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StockMovement {
  id: string;
  productName: string;
  sku: string;
  movementType: 'in' | 'out' | 'adjustment' | 'return' | 'transfer';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  createdAt: string;
}

interface StockManagementWidgetProps {
  item: ContentItem;
  onUpdate?: (updates: Partial<ContentItem>) => void;
}

export function StockManagementWidget({ item, onUpdate }: StockManagementWidgetProps) {
  const [filter, setFilter] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');

  // Mock data
  const movements: StockMovement[] = item.metadata?.stockMovements || [
    {
      id: '1',
      productName: 'Premium Kulaklık',
      sku: 'PRD-001',
      movementType: 'in',
      quantity: 50,
      previousQuantity: 45,
      newQuantity: 95,
      reason: 'Yeni sevkiyat',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      productName: 'Bluetooth Hoparlör',
      sku: 'PRD-002',
      movementType: 'out',
      quantity: 3,
      previousQuantity: 15,
      newQuantity: 12,
      reason: 'Satış',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      productName: 'Laptop Çantası',
      sku: 'PRD-003',
      movementType: 'adjustment',
      quantity: -5,
      previousQuantity: 5,
      newQuantity: 0,
      reason: 'Envanter düzeltmesi - hasarlı ürün',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      productName: 'Premium Kulaklık',
      sku: 'PRD-001',
      movementType: 'return',
      quantity: 2,
      previousQuantity: 93,
      newQuantity: 95,
      reason: 'Müşteri iadesi',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const filteredMovements = movements.filter(m => 
    filter === 'all' || m.movementType === filter
  );

  const totalIn = movements
    .filter(m => m.movementType === 'in' || m.movementType === 'return')
    .reduce((sum, m) => sum + m.quantity, 0);
  
  const totalOut = movements
    .filter(m => m.movementType === 'out')
    .reduce((sum, m) => sum + m.quantity, 0);
  
  const totalAdjustments = movements
    .filter(m => m.movementType === 'adjustment')
    .length;

  const getMovementIcon = (type: StockMovement['movementType']) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'adjustment':
        return <ArrowUpDown className="h-4 w-4 text-yellow-600" />;
      case 'return':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      case 'transfer':
        return <ArrowUpDown className="h-4 w-4 text-purple-600" />;
    }
  };

  const getMovementBadge = (type: StockMovement['movementType']) => {
    const labels = {
      in: 'Giriş',
      out: 'Çıkış',
      adjustment: 'Düzeltme',
      return: 'İade',
      transfer: 'Transfer'
    };

    const variants = {
      in: 'default',
      out: 'destructive',
      adjustment: 'secondary',
      return: 'outline',
      transfer: 'outline'
    } as const;

    return (
      <Badge variant={variants[type]} className="flex items-center gap-1 w-fit">
        {getMovementIcon(type)}
        {labels[type]}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Az önce';
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gün önce`;
    return d.toLocaleDateString('tr-TR');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            {item.title || 'Stok Hareketleri'}
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Giriş
            </Button>
            <Button size="sm" variant="outline">
              <Minus className="h-4 w-4 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Toplam Giriş</span>
            </div>
            <div className="text-2xl font-bold">+{totalIn}</div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">Toplam Çıkış</span>
            </div>
            <div className="text-2xl font-bold">-{totalOut}</div>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Düzeltmeler</span>
            </div>
            <div className="text-2xl font-bold">{totalAdjustments}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filtreler */}
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Tümü
          </Button>
          <Button
            size="sm"
            variant={filter === 'in' ? 'default' : 'outline'}
            onClick={() => setFilter('in')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Giriş
          </Button>
          <Button
            size="sm"
            variant={filter === 'out' ? 'default' : 'outline'}
            onClick={() => setFilter('out')}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Çıkış
          </Button>
          <Button
            size="sm"
            variant={filter === 'adjustment' ? 'default' : 'outline'}
            onClick={() => setFilter('adjustment')}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Düzeltme
          </Button>
        </div>

        {/* Hareket Tablosu */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead className="text-right">Önceki</TableHead>
                <TableHead className="text-right">Değişim</TableHead>
                <TableHead className="text-right">Yeni</TableHead>
                <TableHead>Sebep</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(movement.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{movement.productName}</div>
                    <div className="text-sm text-muted-foreground font-mono">{movement.sku}</div>
                  </TableCell>
                  <TableCell>{getMovementBadge(movement.movementType)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {movement.previousQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${
                      movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {movement.newQuantity}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {movement.reason || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredMovements.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Hareket bulunamadı</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
