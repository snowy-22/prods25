'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  MoreVertical,
  Eye,
  Edit2,
  Printer,
  Download,
  Search,
  Filter,
  RefreshCw,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  MessageSquare,
  History,
  TrendingUp,
  DollarSign,
  BarChart3,
  Calendar,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// =====================================================
// TYPES
// =====================================================

interface OrderCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isB2B: boolean;
  companyName?: string;
}

interface OrderAddress {
  name: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  platform: string;
  platformOrderId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  customer: OrderCustomer;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

// =====================================================
// SAMPLE DATA
// =====================================================

const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-2024-0001',
    platform: 'Trendyol',
    platformOrderId: 'TY-1234567890',
    status: 'processing',
    paymentStatus: 'paid',
    customer: {
      id: 'cust-1',
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      phone: '+90 532 123 4567',
      isB2B: false,
    },
    shippingAddress: {
      name: 'Ahmet Yılmaz',
      address: 'Bağdat Caddesi No: 123 D: 5',
      city: 'İstanbul',
      district: 'Kadıköy',
      postalCode: '34710',
      country: 'Türkiye',
      phone: '+90 532 123 4567',
    },
    billingAddress: {
      name: 'Ahmet Yılmaz',
      address: 'Bağdat Caddesi No: 123 D: 5',
      city: 'İstanbul',
      district: 'Kadıköy',
      postalCode: '34710',
      country: 'Türkiye',
      phone: '+90 532 123 4567',
    },
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'iPhone 15 Pro Max 256GB',
        sku: 'APPL-IP15PM-256',
        quantity: 1,
        unitPrice: 74999,
        totalPrice: 74999,
        image: 'https://placehold.co/80x80/f5f5f5/333?text=iPhone',
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'AirPods Pro 2',
        sku: 'APPL-APP2',
        quantity: 1,
        unitPrice: 8999,
        totalPrice: 8999,
        image: 'https://placehold.co/80x80/f5f5f5/333?text=AirPods',
      },
    ],
    subtotal: 83998,
    shippingCost: 0,
    discount: 5000,
    tax: 14220,
    total: 93218,
    currency: 'TRY',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-2024-0002',
    platform: 'Hepsiburada',
    platformOrderId: 'HB-9876543210',
    status: 'shipped',
    paymentStatus: 'paid',
    customer: {
      id: 'cust-2',
      name: 'Mehmet Demir',
      email: 'mehmet@company.com',
      phone: '+90 533 234 5678',
      isB2B: true,
      companyName: 'Demir Teknoloji Ltd. Şti.',
    },
    shippingAddress: {
      name: 'Demir Teknoloji Ltd. Şti.',
      address: 'Ankara OSB, Blok A No: 45',
      city: 'Ankara',
      district: 'Sincan',
      postalCode: '06935',
      country: 'Türkiye',
      phone: '+90 312 555 0001',
    },
    billingAddress: {
      name: 'Demir Teknoloji Ltd. Şti.',
      address: 'Ankara OSB, Blok A No: 45',
      city: 'Ankara',
      district: 'Sincan',
      postalCode: '06935',
      country: 'Türkiye',
      phone: '+90 312 555 0001',
    },
    items: [
      {
        id: 'item-3',
        productId: 'prod-3',
        productName: 'MacBook Pro 14" M3 Pro',
        sku: 'APPL-MBP14-M3P',
        quantity: 3,
        unitPrice: 89999,
        totalPrice: 269997,
        image: 'https://placehold.co/80x80/f5f5f5/333?text=MacBook',
      },
    ],
    subtotal: 269997,
    shippingCost: 0,
    discount: 15000,
    tax: 45900,
    total: 300897,
    currency: 'TRY',
    shippingCarrier: 'Yurtiçi Kargo',
    trackingNumber: '1234567890123',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    shippedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-2024-0003',
    platform: 'N11',
    platformOrderId: 'N11-5555666677',
    status: 'pending',
    paymentStatus: 'pending',
    customer: {
      id: 'cust-3',
      name: 'Ayşe Kaya',
      email: 'ayse@example.com',
      phone: '+90 534 345 6789',
      isB2B: false,
    },
    shippingAddress: {
      name: 'Ayşe Kaya',
      address: 'Atatürk Mahallesi, 123. Sokak No: 45',
      city: 'İzmir',
      district: 'Karşıyaka',
      postalCode: '35590',
      country: 'Türkiye',
      phone: '+90 534 345 6789',
    },
    billingAddress: {
      name: 'Ayşe Kaya',
      address: 'Atatürk Mahallesi, 123. Sokak No: 45',
      city: 'İzmir',
      district: 'Karşıyaka',
      postalCode: '35590',
      country: 'Türkiye',
      phone: '+90 534 345 6789',
    },
    items: [
      {
        id: 'item-4',
        productId: 'prod-4',
        productName: 'Samsung Galaxy S24 Ultra 256GB',
        sku: 'SAM-GS24U-256',
        quantity: 1,
        unitPrice: 59999,
        totalPrice: 59999,
        image: 'https://placehold.co/80x80/f5f5f5/333?text=Galaxy',
      },
    ],
    subtotal: 59999,
    shippingCost: 49.90,
    discount: 0,
    tax: 10800,
    total: 70848.90,
    currency: 'TRY',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

// =====================================================
// COMPONENTS
// =====================================================

function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const variants = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', label: 'Beklemede' },
    confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Onaylandı' },
    processing: { bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'Hazırlanıyor' },
    shipped: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', label: 'Kargoda' },
    delivered: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Teslim Edildi' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'İptal' },
    returned: { bg: 'bg-orange-500/10', text: 'text-orange-600', label: 'İade' },
  };
  const variant = variants[status];
  return <Badge variant="outline" className={cn(variant.bg, variant.text)}>{variant.label}</Badge>;
}

function PaymentStatusBadge({ status }: { status: Order['paymentStatus'] }) {
  const variants = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', label: 'Ödeme Bekliyor' },
    paid: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Ödendi' },
    refunded: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'İade Edildi' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Başarısız' },
  };
  const variant = variants[status];
  return <Badge variant="outline" className={cn(variant.bg, variant.text)}>{variant.label}</Badge>;
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    Trendyol: 'bg-orange-500/10 text-orange-600',
    Hepsiburada: 'bg-orange-600/10 text-orange-700',
    N11: 'bg-green-500/10 text-green-600',
    Amazon: 'bg-yellow-500/10 text-yellow-700',
    Shopify: 'bg-emerald-500/10 text-emerald-600',
    Website: 'bg-blue-500/10 text-blue-600',
  };
  return (
    <Badge variant="outline" className={cn(colors[platform] || 'bg-gray-500/10 text-gray-600')}>
      {platform}
    </Badge>
  );
}

function formatCurrency(amount: number, currency: string = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function OrderDetailDialog({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [activeSection, setActiveSection] = useState<string | null>('items');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {order.orderNumber}
                <OrderStatusBadge status={order.status} />
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <PlatformBadge platform={order.platform} />
                <span className="text-xs">#{order.platformOrderId}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-4">
            {/* Customer & Addresses */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Müşteri Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>{order.customer.name}</span>
                    {order.customer.isB2B && (
                      <Badge variant="secondary" className="text-xs">B2B</Badge>
                    )}
                  </div>
                  {order.customer.companyName && (
                    <div className="flex items-center gap-2">
                      <Store className="h-3 w-3 text-muted-foreground" />
                      <span>{order.customer.companyName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>{order.customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{order.customer.phone}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Teslimat Adresi
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 text-sm">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.address}</p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.district}, {order.shippingAddress.city} {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                  <p className="mt-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.shippingAddress.phone}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Order Items */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Ürünler ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.productName}
                          className="w-12 h-12 rounded-lg object-cover bg-muted"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.totalPrice, order.currency)}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(item.unitPrice, order.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-3" />
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ara Toplam</span>
                    <span>{formatCurrency(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kargo</span>
                    <span>{order.shippingCost === 0 ? 'Ücretsiz' : formatCurrency(order.shippingCost, order.currency)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>İndirim</span>
                      <span>-{formatCurrency(order.discount, order.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">KDV</span>
                    <span>{formatCurrency(order.tax, order.currency)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Toplam</span>
                    <span>{formatCurrency(order.total, order.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Shipping Info */}
            {order.trackingNumber && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Kargo Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.shippingCarrier}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Takip No: {order.trackingNumber}
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Takip Et
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="border-t pt-4">
          <div className="flex items-center gap-2 w-full justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Printer className="h-4 w-4" />
                Yazdır
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <FileText className="h-4 w-4" />
                Fatura
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {order.status === 'pending' && (
                <Button variant="default" size="sm">Onayla</Button>
              )}
              {order.status === 'confirmed' && (
                <Button variant="default" size="sm">Hazırla</Button>
              )}
              {order.status === 'processing' && (
                <Button variant="default" size="sm" className="gap-1">
                  <Truck className="h-4 w-4" />
                  Kargoya Ver
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrderRow({ order, onView }: { order: Order; onView: () => void }) {
  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onView}>
      <TableCell>
        <div>
          <p className="font-medium">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('tr-TR')}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <PlatformBadge platform={order.platform} />
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{order.customer.name}</p>
          {order.customer.isB2B && (
            <p className="text-xs text-muted-foreground">{order.customer.companyName}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {order.items.slice(0, 2).map(item => (
            item.image && (
              <img 
                key={item.id}
                src={item.image}
                alt=""
                className="w-8 h-8 rounded object-cover bg-muted"
              />
            )
          ))}
          {order.items.length > 2 && (
            <span className="text-xs text-muted-foreground">+{order.items.length - 2}</span>
          )}
          <span className="text-sm">{order.items.length} ürün</span>
        </div>
      </TableCell>
      <TableCell>
        <p className="font-medium">{formatCurrency(order.total, order.currency)}</p>
      </TableCell>
      <TableCell>
        <OrderStatusBadge status={order.status} />
      </TableCell>
      <TableCell>
        <PaymentStatusBadge status={order.paymentStatus} />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
              <Eye className="h-4 w-4 mr-2" />
              Detaylar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Printer className="h-4 w-4 mr-2" />
              Yazdır
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              Fatura Oluştur
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <MessageSquare className="h-4 w-4 mr-2" />
              Not Ekle
            </DropdownMenuItem>
            <DropdownMenuItem>
              <History className="h-4 w-4 mr-2" />
              Geçmiş
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          order.orderNumber.toLowerCase().includes(query) ||
          order.customer.name.toLowerCase().includes(query) ||
          order.platformOrderId.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (platformFilter !== 'all' && order.platform !== platformFilter) return false;
      
      return true;
    });
  }, [orders, searchQuery, statusFilter, platformFilter]);
  
  const stats = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0);
    
    return { pending, processing, shipped, totalRevenue };
  }, [orders]);
  
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sipariş Yönetimi</h1>
          <p className="text-muted-foreground">
            Tüm kanallardan gelen siparişlerinizi tek yerden yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Senkronize Et
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Dışa Aktar
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Bekleyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.processing}</p>
                <p className="text-sm text-muted-foreground">Hazırlanan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.shipped}</p>
                <p className="text-sm text-muted-foreground">Kargoda</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Toplam Gelir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input 
                placeholder="Sipariş no, müşteri adı veya platform ID ile ara..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="confirmed">Onaylandı</SelectItem>
                <SelectItem value="processing">Hazırlanıyor</SelectItem>
                <SelectItem value="shipped">Kargoda</SelectItem>
                <SelectItem value="delivered">Teslim Edildi</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Platformlar</SelectItem>
                <SelectItem value="Trendyol">Trendyol</SelectItem>
                <SelectItem value="Hepsiburada">Hepsiburada</SelectItem>
                <SelectItem value="N11">N11</SelectItem>
                <SelectItem value="Amazon">Amazon</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Ürünler</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Ödeme</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map(order => (
                <OrderRow 
                  key={order.id} 
                  order={order}
                  onView={() => handleViewOrder(order)}
                />
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Sipariş bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Order Detail Dialog */}
      {selectedOrder && (
        <OrderDetailDialog 
          order={selectedOrder}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </div>
  );
}

export default OrderDashboard;
