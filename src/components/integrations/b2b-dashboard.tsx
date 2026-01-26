'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  DollarSign,
  FileText,
  ShoppingCart,
  Percent,
  Tag,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  Calculator,
  Send,
  Eye,
  Edit2,
  Trash2,
  Copy,
  History,
  BarChart3,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Shield,
  Settings,
  Package,
  Truck,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// =====================================================
// TYPES
// =====================================================

interface B2BCustomer {
  id: string;
  companyName: string;
  taxId: string;
  taxOffice: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  country: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  priceListId: string;
  priceListName: string;
  creditLimit: number;
  usedCredit: number;
  paymentTermDays: number;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  lastOrderAt?: string;
}

interface PriceRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'tiered';
  value: number;
  minQuantity?: number;
  maxQuantity?: number;
  categoryId?: string;
  productId?: string;
}

interface PriceList {
  id: string;
  name: string;
  description: string;
  currency: string;
  isDefault: boolean;
  priority: number;
  rules: PriceRule[];
  customerCount: number;
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    totalPrice: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  validUntil: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  createdAt: string;
  sentAt?: string;
  respondedAt?: string;
}

// =====================================================
// SAMPLE DATA
// =====================================================

const SAMPLE_CUSTOMERS: B2BCustomer[] = [
  {
    id: 'cust-1',
    companyName: 'Demir Teknoloji Ltd. Şti.',
    taxId: '1234567890',
    taxOffice: 'Ankara Kurumlar',
    contactName: 'Mehmet Demir',
    contactEmail: 'mehmet@demirtek.com',
    contactPhone: '+90 312 555 0001',
    address: 'Ankara OSB, Blok A No: 45',
    city: 'Ankara',
    country: 'Türkiye',
    tier: 'gold',
    priceListId: 'pl-2',
    priceListName: 'Altın Müşteri',
    creditLimit: 500000,
    usedCredit: 125000,
    paymentTermDays: 60,
    totalOrders: 45,
    totalSpent: 1250000,
    status: 'active',
    createdAt: '2023-01-15T10:00:00Z',
    lastOrderAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'cust-2',
    companyName: 'Yıldız Bilişim A.Ş.',
    taxId: '9876543210',
    taxOffice: 'İstanbul Büyük Mükellefler',
    contactName: 'Ayşe Yıldız',
    contactEmail: 'ayse@yildizbilisim.com',
    contactPhone: '+90 212 444 0002',
    address: 'Maslak, Büyükdere Cad. No: 123',
    city: 'İstanbul',
    country: 'Türkiye',
    tier: 'platinum',
    priceListId: 'pl-3',
    priceListName: 'Platin Müşteri',
    creditLimit: 1000000,
    usedCredit: 350000,
    paymentTermDays: 90,
    totalOrders: 128,
    totalSpent: 4500000,
    status: 'active',
    createdAt: '2022-06-20T10:00:00Z',
    lastOrderAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'cust-3',
    companyName: 'Anadolu Sistemleri Ltd.',
    taxId: '5555666677',
    taxOffice: 'İzmir Konak',
    contactName: 'Ali Kaya',
    contactEmail: 'ali@anadolusistemleri.com',
    contactPhone: '+90 232 333 0003',
    address: 'Ege Serbest Bölge, No: 78',
    city: 'İzmir',
    country: 'Türkiye',
    tier: 'silver',
    priceListId: 'pl-1',
    priceListName: 'Gümüş Müşteri',
    creditLimit: 250000,
    usedCredit: 50000,
    paymentTermDays: 45,
    totalOrders: 23,
    totalSpent: 450000,
    status: 'active',
    createdAt: '2023-08-10T10:00:00Z',
    lastOrderAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'cust-4',
    companyName: 'Yeni Başlangıç Tic. Ltd.',
    taxId: '1111222233',
    taxOffice: 'Bursa Nilüfer',
    contactName: 'Zeynep Arslan',
    contactEmail: 'zeynep@yenibaslangic.com',
    contactPhone: '+90 224 222 0004',
    address: 'Organize Sanayi, B Blok No: 12',
    city: 'Bursa',
    country: 'Türkiye',
    tier: 'bronze',
    priceListId: 'pl-0',
    priceListName: 'Bronz Müşteri',
    creditLimit: 100000,
    usedCredit: 0,
    paymentTermDays: 30,
    totalOrders: 0,
    totalSpent: 0,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const SAMPLE_PRICE_LISTS: PriceList[] = [
  {
    id: 'pl-0',
    name: 'Bronz Müşteri',
    description: 'Yeni müşteriler için başlangıç fiyat listesi',
    currency: 'TRY',
    isDefault: false,
    priority: 1,
    rules: [
      { id: 'r-1', name: 'Genel İndirim', type: 'percentage', value: 5 },
    ],
    customerCount: 12,
    status: 'active',
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'pl-1',
    name: 'Gümüş Müşteri',
    description: 'Orta seviye müşteriler için fiyat listesi',
    currency: 'TRY',
    isDefault: false,
    priority: 2,
    rules: [
      { id: 'r-2', name: 'Genel İndirim', type: 'percentage', value: 10 },
      { id: 'r-3', name: 'Toplu Alım', type: 'percentage', value: 5, minQuantity: 10 },
    ],
    customerCount: 25,
    status: 'active',
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'pl-2',
    name: 'Altın Müşteri',
    description: 'Sadık müşteriler için premium fiyat listesi',
    currency: 'TRY',
    isDefault: false,
    priority: 3,
    rules: [
      { id: 'r-4', name: 'Genel İndirim', type: 'percentage', value: 15 },
      { id: 'r-5', name: 'Toplu Alım', type: 'percentage', value: 7, minQuantity: 10 },
      { id: 'r-6', name: 'Büyük Sipariş', type: 'percentage', value: 10, minQuantity: 50 },
    ],
    customerCount: 18,
    status: 'active',
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
  },
  {
    id: 'pl-3',
    name: 'Platin Müşteri',
    description: 'En değerli müşteriler için özel fiyatlandırma',
    currency: 'TRY',
    isDefault: false,
    priority: 4,
    rules: [
      { id: 'r-7', name: 'Genel İndirim', type: 'percentage', value: 20 },
      { id: 'r-8', name: 'Toplu Alım', type: 'percentage', value: 10, minQuantity: 10 },
      { id: 'r-9', name: 'Büyük Sipariş', type: 'percentage', value: 15, minQuantity: 50 },
      { id: 'r-10', name: 'VIP Ekstra', type: 'percentage', value: 5 },
    ],
    customerCount: 8,
    status: 'active',
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
];

const SAMPLE_QUOTES: Quote[] = [
  {
    id: 'q-1',
    quoteNumber: 'TEK-2024-0001',
    customerId: 'cust-1',
    customerName: 'Demir Teknoloji Ltd. Şti.',
    items: [
      { productId: 'prod-1', productName: 'MacBook Pro 14" M3 Pro', quantity: 5, unitPrice: 89999, discount: 15, totalPrice: 382495.75 },
      { productId: 'prod-2', productName: 'Apple Magic Keyboard', quantity: 5, unitPrice: 4999, discount: 15, totalPrice: 21245.75 },
    ],
    subtotal: 403741.50,
    discount: 60561.23,
    tax: 61773.45,
    total: 404953.72,
    currency: 'TRY',
    validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    status: 'sent',
    notes: '5 adet MacBook ve klavye talebi için hazırlandı.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'q-2',
    quoteNumber: 'TEK-2024-0002',
    customerId: 'cust-2',
    customerName: 'Yıldız Bilişim A.Ş.',
    items: [
      { productId: 'prod-3', productName: 'Dell PowerEdge R750', quantity: 2, unitPrice: 450000, discount: 20, totalPrice: 720000 },
    ],
    subtotal: 720000,
    discount: 144000,
    tax: 103680,
    total: 679680,
    currency: 'TRY',
    validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: 'viewed',
    notes: 'Sunucu altyapısı yenileme projesi.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 'q-3',
    quoteNumber: 'TEK-2024-0003',
    customerId: 'cust-3',
    customerName: 'Anadolu Sistemleri Ltd.',
    items: [
      { productId: 'prod-4', productName: 'HP LaserJet Pro M404dn', quantity: 10, unitPrice: 8999, discount: 10, totalPrice: 80991 },
    ],
    subtotal: 80991,
    discount: 8099.10,
    tax: 13118.54,
    total: 86010.44,
    currency: 'TRY',
    validUntil: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: 'expired',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19).toISOString(),
  },
];

// =====================================================
// COMPONENTS
// =====================================================

function TierBadge({ tier }: { tier: B2BCustomer['tier'] }) {
  const variants = {
    bronze: { bg: 'bg-orange-500/10', text: 'text-orange-600', icon: '🥉' },
    silver: { bg: 'bg-slate-500/10', text: 'text-slate-600', icon: '🥈' },
    gold: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', icon: '🥇' },
    platinum: { bg: 'bg-purple-500/10', text: 'text-purple-600', icon: '💎' },
  };
  const variant = variants[tier];
  const labels = { bronze: 'Bronz', silver: 'Gümüş', gold: 'Altın', platinum: 'Platin' };
  return (
    <Badge variant="outline" className={cn(variant.bg, variant.text, 'gap-1')}>
      <span>{variant.icon}</span>
      {labels[tier]}
    </Badge>
  );
}

function CustomerStatusBadge({ status }: { status: B2BCustomer['status'] }) {
  const variants = {
    active: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Aktif' },
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', label: 'Onay Bekliyor' },
    suspended: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Askıya Alındı' },
  };
  const variant = variants[status];
  return <Badge variant="outline" className={cn(variant.bg, variant.text)}>{variant.label}</Badge>;
}

function QuoteStatusBadge({ status }: { status: Quote['status'] }) {
  const variants = {
    draft: { bg: 'bg-gray-500/10', text: 'text-gray-600', label: 'Taslak' },
    sent: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Gönderildi' },
    viewed: { bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'Görüntülendi' },
    accepted: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Kabul Edildi' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Reddedildi' },
    expired: { bg: 'bg-orange-500/10', text: 'text-orange-600', label: 'Süresi Doldu' },
  };
  const variant = variants[status];
  return <Badge variant="outline" className={cn(variant.bg, variant.text)}>{variant.label}</Badge>;
}

function formatCurrency(amount: number, currency: string = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function CustomerCard({ customer, onView }: { customer: B2BCustomer; onView: () => void }) {
  const creditUsagePercent = (customer.usedCredit / customer.creditLimit) * 100;
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {customer.companyName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{customer.companyName}</h3>
              <p className="text-sm text-muted-foreground">{customer.contactName}</p>
            </div>
          </div>
          <TierBadge tier={customer.tier} />
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Toplam Sipariş</p>
            <p className="font-semibold">{customer.totalOrders}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Toplam Harcama</p>
            <p className="font-semibold">{formatCurrency(customer.totalSpent)}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Kredi Kullanımı</span>
            <span className="font-medium">
              {formatCurrency(customer.usedCredit)} / {formatCurrency(customer.creditLimit)}
            </span>
          </div>
          <Progress 
            value={creditUsagePercent} 
            className={cn(
              'h-2',
              creditUsagePercent > 80 && 'bg-red-100',
              creditUsagePercent > 80 && '[&>div]:bg-red-500'
            )}
          />
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <CustomerStatusBadge status={customer.status} />
          <span className="text-xs text-muted-foreground">
            Vade: {customer.paymentTermDays} gün
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PriceListCard({ priceList }: { priceList: PriceList }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              {priceList.name}
              {priceList.status === 'active' ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600">Aktif</Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-600">Taslak</Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{priceList.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit2 className="h-4 w-4 mr-2" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Kopyala
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">Fiyat Kuralları:</p>
          {priceList.rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2">
              <span>{rule.name}</span>
              <Badge variant="secondary">
                {rule.type === 'percentage' ? `%${rule.value}` : formatCurrency(rule.value)}
                {rule.minQuantity && ` (${rule.minQuantity}+ adet)`}
              </Badge>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{priceList.customerCount} müşteri</span>
          <span>Öncelik: {priceList.priority}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AddCustomerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Yeni B2B Müşteri Ekle</DialogTitle>
          <DialogDescription>
            Kurumsal müşteri bilgilerini girin
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Firma Adı</Label>
            <Input placeholder="Örn: ABC Teknoloji Ltd. Şti." />
          </div>
          <div>
            <Label>Vergi No</Label>
            <Input placeholder="10 haneli vergi numarası" />
          </div>
          <div>
            <Label>Vergi Dairesi</Label>
            <Input placeholder="Örn: Kadıköy" />
          </div>
          <div>
            <Label>Yetkili Adı</Label>
            <Input placeholder="İletişim kurulacak kişi" />
          </div>
          <div>
            <Label>Yetkili E-posta</Label>
            <Input type="email" placeholder="email@firma.com" />
          </div>
          <div>
            <Label>Telefon</Label>
            <Input placeholder="+90 5XX XXX XXXX" />
          </div>
          <div>
            <Label>Şehir</Label>
            <Input placeholder="Örn: İstanbul" />
          </div>
          <div className="col-span-2">
            <Label>Adres</Label>
            <Textarea placeholder="Tam adres" rows={2} />
          </div>
          <div>
            <Label>Fiyat Listesi</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Fiyat listesi seçin" />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_PRICE_LISTS.map(pl => (
                  <SelectItem key={pl.id} value={pl.id}>{pl.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kredi Limiti (₺)</Label>
            <Input type="number" placeholder="100000" />
          </div>
          <div>
            <Label>Vade Süresi (Gün)</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Vade seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Gün</SelectItem>
                <SelectItem value="45">45 Gün</SelectItem>
                <SelectItem value="60">60 Gün</SelectItem>
                <SelectItem value="90">90 Gün</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Müşteri Seviyesi</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Seviye seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bronze">🥉 Bronz</SelectItem>
                <SelectItem value="silver">🥈 Gümüş</SelectItem>
                <SelectItem value="gold">🥇 Altın</SelectItem>
                <SelectItem value="platinum">💎 Platin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={() => onOpenChange(false)}>Müşteri Ekle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function B2BDashboard() {
  const [customers, setCustomers] = useState<B2BCustomer[]>(SAMPLE_CUSTOMERS);
  const [priceLists, setPriceLists] = useState<PriceList[]>(SAMPLE_PRICE_LISTS);
  const [quotes, setQuotes] = useState<Quote[]>(SAMPLE_QUOTES);
  const [activeTab, setActiveTab] = useState('customers');
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          customer.companyName.toLowerCase().includes(query) ||
          customer.contactName.toLowerCase().includes(query) ||
          customer.contactEmail.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (tierFilter !== 'all' && customer.tier !== tierFilter) return false;
      return true;
    });
  }, [customers, searchQuery, tierFilter]);
  
  const stats = useMemo(() => {
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const pendingCustomers = customers.filter(c => c.status === 'pending').length;
    const totalCredit = customers.reduce((sum, c) => sum + c.creditLimit, 0);
    const usedCredit = customers.reduce((sum, c) => sum + c.usedCredit, 0);
    const pendingQuotes = quotes.filter(q => q.status === 'sent' || q.status === 'viewed').length;
    const quotesValue = quotes
      .filter(q => q.status === 'sent' || q.status === 'viewed')
      .reduce((sum, q) => sum + q.total, 0);
    
    return { activeCustomers, pendingCustomers, totalCredit, usedCredit, pendingQuotes, quotesValue };
  }, [customers, quotes]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">B2B Portal</h1>
          <p className="text-muted-foreground">
            Kurumsal müşteriler, fiyat listeleri ve teklifler
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Rapor İndir
          </Button>
          <Button className="gap-2" onClick={() => setAddCustomerOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Müşteri Ekle
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeCustomers}</p>
                <p className="text-sm text-muted-foreground">Aktif Müşteri</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingCustomers}</p>
                <p className="text-sm text-muted-foreground">Onay Bekleyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.usedCredit)}</p>
                <p className="text-sm text-muted-foreground">Kullanılan Kredi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingQuotes}</p>
                <p className="text-sm text-muted-foreground">Bekleyen Teklif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="customers" className="gap-2">
            <Building2 className="h-4 w-4" />
            Müşteriler
          </TabsTrigger>
          <TabsTrigger value="price-lists" className="gap-2">
            <Tag className="h-4 w-4" />
            Fiyat Listeleri
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-2">
            <FileText className="h-4 w-4" />
            Teklifler
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="customers" className="mt-4">
          {/* Filters */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input 
                    placeholder="Firma adı, yetkili veya e-posta ile ara..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Seviye" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Seviyeler</SelectItem>
                    <SelectItem value="bronze">🥉 Bronz</SelectItem>
                    <SelectItem value="silver">🥈 Gümüş</SelectItem>
                    <SelectItem value="gold">🥇 Altın</SelectItem>
                    <SelectItem value="platinum">💎 Platin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Customer Grid */}
          <div className="grid grid-cols-2 gap-4">
            {filteredCustomers.map(customer => (
              <CustomerCard 
                key={customer.id} 
                customer={customer}
                onView={() => console.log('View customer:', customer.id)}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="price-lists" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">{priceLists.length} fiyat listesi</p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Liste
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {priceLists.map(pl => (
              <PriceListCard key={pl.id} priceList={pl} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="quotes" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teklif No</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Geçerlilik</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map(quote => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <p className="font-medium">{quote.quoteNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </TableCell>
                      <TableCell>{quote.customerName}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(quote.total, quote.currency)}
                      </TableCell>
                      <TableCell>
                        {new Date(quote.validUntil).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell>
                        <QuoteStatusBadge status={quote.status} />
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
                              Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="h-4 w-4 mr-2" />
                              Gönder
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Kopyala
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Siparişe Dönüştür
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
      
      {/* Add Customer Dialog */}
      <AddCustomerDialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen} />
    </div>
  );
}

export default B2BDashboard;
