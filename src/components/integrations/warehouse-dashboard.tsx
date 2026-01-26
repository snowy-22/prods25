'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Warehouse,
  MapPin,
  Package,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Plus,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  Box,
  Settings2,
  Download,
  Upload,
  RefreshCw,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// =====================================================
// TYPES
// =====================================================

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  type: 'main' | 'distribution' | 'store' | 'dropship' | 'virtual';
  address: string;
  city: string;
  country: string;
  isActive: boolean;
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  utilizationPercent: number;
  capacityUnits: number;
  usedUnits: number;
  manager?: string;
  phone?: string;
  lastUpdated: string;
}

interface StockMovement {
  id: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  productName: string;
  productSku: string;
  quantity: number;
  fromWarehouse?: string;
  toWarehouse?: string;
  reason: string;
  reference?: string;
  createdBy: string;
  createdAt: string;
}

interface TransferOrder {
  id: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  status: 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled';
  itemCount: number;
  totalQuantity: number;
  createdAt: string;
  expectedDelivery?: string;
}

// =====================================================
// SAMPLE DATA
// =====================================================

const SAMPLE_WAREHOUSES: WarehouseData[] = [
  {
    id: 'wh-1',
    name: 'Ana Depo',
    code: 'WH-001',
    type: 'main',
    address: 'İstanbul Ticaret Merkezi, Blok A',
    city: 'İstanbul',
    country: 'Türkiye',
    isActive: true,
    totalProducts: 1250,
    totalStock: 45680,
    lowStockItems: 23,
    outOfStockItems: 5,
    utilizationPercent: 78,
    capacityUnits: 60000,
    usedUnits: 46800,
    manager: 'Ahmet Yılmaz',
    phone: '+90 212 555 0001',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'wh-2',
    name: 'Dağıtım Merkezi - Ankara',
    code: 'WH-002',
    type: 'distribution',
    address: 'Ankara OSB, No: 45',
    city: 'Ankara',
    country: 'Türkiye',
    isActive: true,
    totalProducts: 890,
    totalStock: 23450,
    lowStockItems: 12,
    outOfStockItems: 2,
    utilizationPercent: 65,
    capacityUnits: 40000,
    usedUnits: 26000,
    manager: 'Mehmet Demir',
    phone: '+90 312 555 0002',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'wh-3',
    name: 'Mağaza Deposu - Kadıköy',
    code: 'WH-003',
    type: 'store',
    address: 'Bağdat Caddesi, No: 123',
    city: 'İstanbul',
    country: 'Türkiye',
    isActive: true,
    totalProducts: 450,
    totalStock: 3200,
    lowStockItems: 8,
    outOfStockItems: 1,
    utilizationPercent: 45,
    capacityUnits: 8000,
    usedUnits: 3600,
    manager: 'Ayşe Kaya',
    phone: '+90 216 555 0003',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

const SAMPLE_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    type: 'in',
    productName: 'iPhone 15 Pro Max 256GB',
    productSku: 'APPL-IP15PM-256',
    quantity: 50,
    toWarehouse: 'Ana Depo',
    reason: 'Tedarikçi siparişi',
    reference: 'PO-2024-0001',
    createdBy: 'Ahmet Yılmaz',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'mov-2',
    type: 'out',
    productName: 'Samsung Galaxy S24 Ultra',
    productSku: 'SAM-GS24U-256',
    quantity: 15,
    fromWarehouse: 'Ana Depo',
    reason: 'Trendyol siparişi',
    reference: 'ORD-TY-2024-1234',
    createdBy: 'Sistem',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'mov-3',
    type: 'transfer',
    productName: 'MacBook Pro 14" M3',
    productSku: 'APPL-MBP14-M3',
    quantity: 10,
    fromWarehouse: 'Ana Depo',
    toWarehouse: 'Dağıtım Merkezi - Ankara',
    reason: 'Stok dengeleme',
    reference: 'TRF-2024-0001',
    createdBy: 'Mehmet Demir',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'mov-4',
    type: 'adjustment',
    productName: 'AirPods Pro 2',
    productSku: 'APPL-APP2',
    quantity: -3,
    fromWarehouse: 'Mağaza Deposu - Kadıköy',
    reason: 'Sayım farkı',
    createdBy: 'Ayşe Kaya',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

const SAMPLE_TRANSFERS: TransferOrder[] = [
  {
    id: 'trf-1',
    fromWarehouseId: 'wh-1',
    fromWarehouseName: 'Ana Depo',
    toWarehouseId: 'wh-2',
    toWarehouseName: 'Dağıtım Merkezi - Ankara',
    status: 'in_transit',
    itemCount: 15,
    totalQuantity: 120,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    expectedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'trf-2',
    fromWarehouseId: 'wh-1',
    fromWarehouseName: 'Ana Depo',
    toWarehouseId: 'wh-3',
    toWarehouseName: 'Mağaza Deposu - Kadıköy',
    status: 'pending',
    itemCount: 8,
    totalQuantity: 45,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

// =====================================================
// COMPONENTS
// =====================================================

function WarehouseTypeBadge({ type }: { type: WarehouseData['type'] }) {
  const variants = {
    main: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Ana Depo' },
    distribution: { bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'Dağıtım' },
    store: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Mağaza' },
    dropship: { bg: 'bg-orange-500/10', text: 'text-orange-600', label: 'Dropship' },
    virtual: { bg: 'bg-gray-500/10', text: 'text-gray-600', label: 'Sanal' },
  };
  const variant = variants[type];
  return <Badge variant="outline" className={cn(variant.bg, variant.text)}>{variant.label}</Badge>;
}

function TransferStatusBadge({ status }: { status: TransferOrder['status'] }) {
  const variants = {
    draft: { bg: 'bg-gray-500/10', text: 'text-gray-600', label: 'Taslak' },
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', label: 'Bekliyor' },
    in_transit: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Yolda' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Tamamlandı' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'İptal' },
  };
  const variant = variants[status];
  return <Badge variant="outline" className={cn(variant.bg, variant.text)}>{variant.label}</Badge>;
}

function MovementTypeBadge({ type }: { type: StockMovement['type'] }) {
  const variants = {
    in: { bg: 'bg-green-500/10', text: 'text-green-600', icon: TrendingUp, label: 'Giriş' },
    out: { bg: 'bg-red-500/10', text: 'text-red-600', icon: TrendingDown, label: 'Çıkış' },
    transfer: { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: ArrowRightLeft, label: 'Transfer' },
    adjustment: { bg: 'bg-orange-500/10', text: 'text-orange-600', icon: Settings2, label: 'Düzeltme' },
  };
  const variant = variants[type];
  const Icon = variant.icon;
  return (
    <Badge variant="outline" className={cn('gap-1', variant.bg, variant.text)}>
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
}

function WarehouseCard({ warehouse, onClick }: { warehouse: WarehouseData; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              warehouse.isActive ? "bg-primary/10" : "bg-muted"
            )}>
              <Warehouse className={cn(
                "h-5 w-5",
                warehouse.isActive ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <CardTitle className="text-base">{warehouse.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                {warehouse.city}
              </CardDescription>
            </div>
          </div>
          <WarehouseTypeBadge type={warehouse.type} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Doluluk</span>
            <span className="font-medium">{warehouse.utilizationPercent}%</span>
          </div>
          <Progress value={warehouse.utilizationPercent} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{warehouse.totalProducts.toLocaleString()} ürün</span>
          </div>
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-muted-foreground" />
            <span>{warehouse.totalStock.toLocaleString()} adet</span>
          </div>
        </div>
        
        {(warehouse.lowStockItems > 0 || warehouse.outOfStockItems > 0) && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 text-orange-600 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {warehouse.lowStockItems > 0 && `${warehouse.lowStockItems} düşük stok`}
              {warehouse.lowStockItems > 0 && warehouse.outOfStockItems > 0 && ', '}
              {warehouse.outOfStockItems > 0 && `${warehouse.outOfStockItems} stoksuz`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddWarehouseDialog({ onAdd }: { onAdd: (data: Partial<WarehouseData>) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'main' as WarehouseData['type'],
    address: '',
    city: '',
    capacityUnits: 10000,
  });
  
  const handleSubmit = () => {
    onAdd(formData);
    setOpen(false);
    setFormData({ name: '', code: '', type: 'main', address: '', city: '', capacityUnits: 10000 });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Depo Ekle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Depo Ekle</DialogTitle>
          <DialogDescription>
            Yeni bir depo veya dağıtım merkezi oluşturun
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Depo Adı</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ana Depo"
              />
            </div>
            <div className="space-y-2">
              <Label>Depo Kodu</Label>
              <Input 
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="WH-001"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Depo Tipi</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Ana Depo</SelectItem>
                <SelectItem value="distribution">Dağıtım Merkezi</SelectItem>
                <SelectItem value="store">Mağaza Deposu</SelectItem>
                <SelectItem value="dropship">Dropship</SelectItem>
                <SelectItem value="virtual">Sanal Depo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Adres</Label>
            <Input 
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Tam adres"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Şehir</Label>
              <Input 
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="İstanbul"
              />
            </div>
            <div className="space-y-2">
              <Label>Kapasite (Birim)</Label>
              <Input 
                type="number"
                value={formData.capacityUnits}
                onChange={(e) => setFormData({ ...formData, capacityUnits: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSubmit}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function WarehouseDashboard() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>(SAMPLE_WAREHOUSES);
  const [movements, setMovements] = useState<StockMovement[]>(SAMPLE_MOVEMENTS);
  const [transfers, setTransfers] = useState<TransferOrder[]>(SAMPLE_TRANSFERS);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  const totalStock = useMemo(() => 
    warehouses.reduce((sum, w) => sum + w.totalStock, 0), [warehouses]
  );
  
  const totalLowStock = useMemo(() => 
    warehouses.reduce((sum, w) => sum + w.lowStockItems, 0), [warehouses]
  );
  
  const totalOutOfStock = useMemo(() => 
    warehouses.reduce((sum, w) => sum + w.outOfStockItems, 0), [warehouses]
  );
  
  const avgUtilization = useMemo(() => 
    Math.round(warehouses.reduce((sum, w) => sum + w.utilizationPercent, 0) / warehouses.length), [warehouses]
  );
  
  const handleAddWarehouse = (data: Partial<WarehouseData>) => {
    const newWarehouse: WarehouseData = {
      id: `wh-${Date.now()}`,
      name: data.name || 'Yeni Depo',
      code: data.code || `WH-${Date.now()}`,
      type: data.type || 'main',
      address: data.address || '',
      city: data.city || '',
      country: 'Türkiye',
      isActive: true,
      totalProducts: 0,
      totalStock: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      utilizationPercent: 0,
      capacityUnits: data.capacityUnits || 10000,
      usedUnits: 0,
      lastUpdated: new Date().toISOString(),
    };
    setWarehouses([...warehouses, newWarehouse]);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Çoklu Depo Yönetimi</h1>
          <p className="text-muted-foreground">
            Tüm depolarınızı ve stok hareketlerini tek yerden yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Rapor
          </Button>
          <AddWarehouseDialog onAdd={handleAddWarehouse} />
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Warehouse className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warehouses.length}</p>
                <p className="text-sm text-muted-foreground">Toplam Depo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Box className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStock.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Toplam Stok</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">%{avgUtilization}</p>
                <p className="text-sm text-muted-foreground">Ort. Doluluk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLowStock}</p>
                <p className="text-sm text-muted-foreground">Düşük Stok</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOutOfStock}</p>
                <p className="text-sm text-muted-foreground">Stoksuz Ürün</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Warehouse className="h-4 w-4" />
            Depolar
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Stok Hareketleri
          </TabsTrigger>
          <TabsTrigger value="transfers" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transferler
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {warehouses.map(warehouse => (
              <WarehouseCard 
                key={warehouse.id} 
                warehouse={warehouse}
                onClick={() => console.log('View warehouse', warehouse.id)}
              />
            ))}
            
            {/* Add New Card */}
            <Card className="border-dashed flex items-center justify-center min-h-[200px] hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="text-center">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Yeni Depo Ekle</p>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="movements" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Stok Hareketleri</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input 
                      placeholder="Hareket ara..." 
                      className="pl-8 w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tip</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Depo</TableHead>
                    <TableHead>Sebep</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map(movement => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <MovementTypeBadge type={movement.type} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{movement.productName}</p>
                          <p className="text-xs text-muted-foreground">{movement.productSku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-medium",
                          movement.quantity > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        {movement.type === 'transfer' ? (
                          <div className="flex items-center gap-1 text-sm">
                            <span>{movement.fromWarehouse}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>{movement.toWarehouse}</span>
                          </div>
                        ) : (
                          <span>{movement.fromWarehouse || movement.toWarehouse}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{movement.reason}</p>
                          {movement.reference && (
                            <p className="text-xs text-muted-foreground">{movement.reference}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(movement.createdAt).toLocaleString('tr-TR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transfers" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transfer Emirleri</CardTitle>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Yeni Transfer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transfer No</TableHead>
                    <TableHead>Kaynak</TableHead>
                    <TableHead>Hedef</TableHead>
                    <TableHead>Ürün/Adet</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map(transfer => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.id.toUpperCase()}</TableCell>
                      <TableCell>{transfer.fromWarehouseName}</TableCell>
                      <TableCell>{transfer.toWarehouseName}</TableCell>
                      <TableCell>
                        {transfer.itemCount} ürün / {transfer.totalQuantity} adet
                      </TableCell>
                      <TableCell>
                        <TransferStatusBadge status={transfer.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(transfer.createdAt).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Detaylar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              İptal Et
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WarehouseDashboard;
