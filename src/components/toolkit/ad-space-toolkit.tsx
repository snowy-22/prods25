"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, Plus, Settings, DollarSign, BarChart3, Eye, 
  MousePointer, TrendingUp, Trash2, Edit3, Power, PowerOff,
  Grid3X3, Layers, Target, Clock, ChevronRight, ChevronDown,
  AlertCircle, CheckCircle2, PauseCircle, XCircle, 
  CreditCard, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight,
  Filter, Search, MoreHorizontal, Copy, ExternalLink, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  AdSlot,
  AdSlotType,
  AdSlotStatus,
  AD_SLOT_SIZES,
  AD_CATEGORIES,
  DEFAULT_AD_SLOT_TEMPLATES,
  AdSpaceToolkitSettings,
  AdRevenueReport,
} from '@/lib/ad-system-types';

// Demo veriler
const DEMO_AD_SLOTS: AdSlot[] = [
  {
    id: 'slot-1',
    ownerId: 'user-1',
    ownerName: 'Demo User',
    gridPosition: 5,
    gridSpanCol: 1,
    gridSpanRow: 1,
    type: 'native',
    size: AD_SLOT_SIZES.find(s => s.type === 'native')!,
    title: 'Ana Akış Reklam Kartı',
    description: 'İçerik akışında 5. sırada görünen native reklam',
    pricingModel: 'cpm',
    pricePerUnit: 500,
    currency: 'USD',
    minimumBudget: 1000,
    status: 'active',
    isActive: true,
    stats: {
      totalImpressions: 12450,
      totalClicks: 234,
      totalRevenue: 6225,
      ctr: 1.88,
      avgCpm: 5.0,
    },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z',
    lastFilledAt: '2025-01-20T12:30:00Z',
  },
  {
    id: 'slot-2',
    ownerId: 'user-1',
    ownerName: 'Demo User',
    gridPosition: 12,
    gridSpanCol: 1,
    gridSpanRow: 1,
    type: 'native',
    size: AD_SLOT_SIZES.find(s => s.type === 'native')!,
    title: 'İkinci Akış Reklam Kartı',
    description: 'İçerik akışında 12. sırada görünen native reklam',
    pricingModel: 'cpm',
    pricePerUnit: 400,
    currency: 'USD',
    minimumBudget: 800,
    status: 'available',
    isActive: true,
    stats: {
      totalImpressions: 8200,
      totalClicks: 164,
      totalRevenue: 3280,
      ctr: 2.0,
      avgCpm: 4.0,
    },
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-18T00:00:00Z',
  },
  {
    id: 'slot-3',
    ownerId: 'user-1',
    ownerName: 'Demo User',
    gridPosition: 0,
    gridSpanCol: 4,
    gridSpanRow: 1,
    type: 'banner',
    size: AD_SLOT_SIZES.find(s => s.label === 'Leaderboard')!,
    title: 'Üst Banner Alanı',
    description: 'Sayfa üstünde yatay banner',
    pricingModel: 'cpm',
    pricePerUnit: 300,
    currency: 'USD',
    minimumBudget: 500,
    status: 'paused',
    isActive: false,
    stats: {
      totalImpressions: 25000,
      totalClicks: 125,
      totalRevenue: 7500,
      ctr: 0.5,
      avgCpm: 3.0,
    },
    createdAt: '2024-12-15T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
];

// Durum badge renkleri
const STATUS_COLORS: Record<AdSlotStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  available: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  reserved: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock className="w-3 h-3" /> },
  active: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <Power className="w-3 h-3" /> },
  paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <PauseCircle className="w-3 h-3" /> },
  expired: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <XCircle className="w-3 h-3" /> },
  disabled: { bg: 'bg-red-100', text: 'text-red-700', icon: <PowerOff className="w-3 h-3" /> },
};

// Slot Kartı
const AdSlotCard: React.FC<{
  slot: AdSlot;
  onEdit: (slot: AdSlot) => void;
  onToggle: (slotId: string, active: boolean) => void;
  onDelete: (slotId: string) => void;
}> = ({ slot, onEdit, onToggle, onDelete }) => {
  const statusStyle = STATUS_COLORS[slot.status];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-xl p-4 bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            slot.type === 'native' ? 'bg-purple-100 text-purple-600' :
            slot.type === 'banner' ? 'bg-blue-100 text-blue-600' :
            slot.type === 'video' ? 'bg-red-100 text-red-600' :
            'bg-gray-100 text-gray-600'
          )}>
            {slot.type === 'native' && <Layers className="w-5 h-5" />}
            {slot.type === 'banner' && <Grid3X3 className="w-5 h-5" />}
            {slot.type === 'video' && <Eye className="w-5 h-5" />}
            {!['native', 'banner', 'video'].includes(slot.type) && <Megaphone className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-medium">{slot.title}</h3>
            <p className="text-xs text-muted-foreground">
              Grid pozisyon: {slot.gridPosition} • {slot.gridSpanCol}x{slot.gridSpanRow}
            </p>
          </div>
        </div>
        <Badge className={cn(statusStyle.bg, statusStyle.text, 'flex items-center gap-1')}>
          {statusStyle.icon}
          {slot.status === 'active' ? 'Aktif' : 
           slot.status === 'available' ? 'Müsait' :
           slot.status === 'paused' ? 'Durduruldu' :
           slot.status === 'reserved' ? 'Rezerve' : slot.status}
        </Badge>
      </div>
      
      {/* İstatistikler */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <Eye className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Görüntülenme</p>
          <p className="font-semibold text-sm">{slot.stats.totalImpressions.toLocaleString()}</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <MousePointer className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Tıklama</p>
          <p className="font-semibold text-sm">{slot.stats.totalClicks.toLocaleString()}</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">CTR</p>
          <p className="font-semibold text-sm">{slot.stats.ctr.toFixed(2)}%</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <DollarSign className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Gelir</p>
          <p className="font-semibold text-sm text-green-600">${(slot.stats.totalRevenue / 100).toFixed(2)}</p>
        </div>
      </div>
      
      {/* Fiyatlandırma */}
      <div className="flex items-center justify-between text-sm mb-4 p-2 bg-muted/30 rounded-lg">
        <span className="text-muted-foreground">
          Fiyat: <strong>${(slot.pricePerUnit / 100).toFixed(2)}</strong> / {slot.pricingModel.toUpperCase()}
        </span>
        <span className="text-muted-foreground">
          Min. Bütçe: <strong>${(slot.minimumBudget / 100).toFixed(0)}</strong>
        </span>
      </div>
      
      {/* Aksiyonlar */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(slot)}>
          <Edit3 className="w-4 h-4 mr-1" />
          Düzenle
        </Button>
        <Button 
          variant={slot.isActive ? "outline" : "default"} 
          size="sm" 
          className="flex-1"
          onClick={() => onToggle(slot.id, !slot.isActive)}
        >
          {slot.isActive ? <PauseCircle className="w-4 h-4 mr-1" /> : <Power className="w-4 h-4 mr-1" />}
          {slot.isActive ? 'Durdur' : 'Aktifleştir'}
        </Button>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(slot.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// Yeni Slot Oluşturma Dialogu
const CreateSlotDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (slot: Partial<AdSlot>) => void;
}> = ({ open, onOpenChange, onSubmit }) => {
  const [type, setType] = useState<AdSlotType>('native');
  const [title, setTitle] = useState('');
  const [gridPosition, setGridPosition] = useState(5);
  const [pricingModel, setPricingModel] = useState<'cpm' | 'cpc'>('cpm');
  const [price, setPrice] = useState(5);
  
  const handleSubmit = () => {
    onSubmit({
      type,
      title,
      gridPosition,
      gridSpanCol: 1,
      gridSpanRow: 1,
      pricingModel,
      pricePerUnit: price * 100,
      currency: 'USD',
      minimumBudget: price * 100 * 2,
      status: 'available',
      isActive: true,
    });
    onOpenChange(false);
    // Reset form
    setType('native');
    setTitle('');
    setGridPosition(5);
    setPricingModel('cpm');
    setPrice(5);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Yeni Reklam Alanı Oluştur
          </DialogTitle>
          <DialogDescription>
            Izgaranızda yeni bir reklam alanı tanımlayın
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Reklam Tipi</Label>
            <Select value={type} onValueChange={(v) => setType(v as AdSlotType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="native">📱 Native Kart (İçerik Arası)</SelectItem>
                <SelectItem value="banner">📐 Banner (Yatay)</SelectItem>
                <SelectItem value="square">⬜ Kare (300x250)</SelectItem>
                <SelectItem value="video">🎬 Video Reklam</SelectItem>
                <SelectItem value="sponsored">⭐ Sponsorlu İçerik</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Alan Adı</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="örn: Ana Akış Reklam Kartı"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Grid Pozisyonu (kaçıncı içerikten sonra)</Label>
            <div className="flex items-center gap-4">
              <Slider 
                value={[gridPosition]} 
                onValueChange={([v]) => setGridPosition(v)}
                min={1}
                max={20}
                step={1}
                className="flex-1"
              />
              <span className="w-12 text-center font-mono bg-muted px-2 py-1 rounded">
                {gridPosition}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Reklam, ızgarada {gridPosition}. içerikten sonra görünecek
            </p>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fiyatlandırma Modeli</Label>
              <Select value={pricingModel} onValueChange={(v) => setPricingModel(v as 'cpm' | 'cpc')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpm">CPM (1000 Görüntülenme)</SelectItem>
                  <SelectItem value="cpc">CPC (Tıklama Başına)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Fiyat (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min={0.5}
                  step={0.5}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tahmini Min. Bütçe:</span>
              <span className="font-medium">${price * 2}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-muted-foreground">Platform Komisyonu:</span>
              <span className="font-medium">%15</span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={!title}>
            <Plus className="w-4 h-4 mr-1" />
            Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Ana Reklam Alanı Araç Takımı
export default function AdSpaceToolkit() {
  const [slots, setSlots] = useState<AdSlot[]>(DEMO_AD_SLOTS);
  const [activeTab, setActiveTab] = useState('slots');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | AdSlotStatus>('all');
  
  // Özet istatistikler
  const summary = useMemo(() => {
    return {
      totalSlots: slots.length,
      activeSlots: slots.filter(s => s.status === 'active').length,
      totalImpressions: slots.reduce((sum, s) => sum + s.stats.totalImpressions, 0),
      totalClicks: slots.reduce((sum, s) => sum + s.stats.totalClicks, 0),
      totalRevenue: slots.reduce((sum, s) => sum + s.stats.totalRevenue, 0),
      avgCtr: slots.length > 0 
        ? slots.reduce((sum, s) => sum + s.stats.ctr, 0) / slots.length 
        : 0,
    };
  }, [slots]);
  
  // Filtrelenmiş slotlar
  const filteredSlots = useMemo(() => {
    return slots.filter(slot => {
      const matchesSearch = slot.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || slot.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [slots, searchQuery, filterStatus]);
  
  const handleCreateSlot = (newSlot: Partial<AdSlot>) => {
    const slot: AdSlot = {
      ...newSlot,
      id: `slot-${Date.now()}`,
      ownerId: 'user-1',
      ownerName: 'Demo User',
      size: AD_SLOT_SIZES.find(s => s.type === newSlot.type) || AD_SLOT_SIZES[0],
      stats: {
        totalImpressions: 0,
        totalClicks: 0,
        totalRevenue: 0,
        ctr: 0,
        avgCpm: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as AdSlot;
    
    setSlots([...slots, slot]);
  };
  
  const handleToggleSlot = (slotId: string, active: boolean) => {
    setSlots(slots.map(s => 
      s.id === slotId 
        ? { ...s, isActive: active, status: active ? 'active' : 'paused', updatedAt: new Date().toISOString() }
        : s
    ));
  };
  
  const handleDeleteSlot = (slotId: string) => {
    setSlots(slots.filter(s => s.id !== slotId));
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Reklam Alanı</h2>
              <p className="text-xs text-muted-foreground">Reklam alanlarınızı yönetin ve gelir elde edin</p>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Yeni Alan
          </Button>
        </div>
        
        {/* Özet Kartları */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Toplam Alan</p>
                <p className="font-bold">{summary.totalSlots}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Eye className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Görüntülenme</p>
                <p className="font-bold">{summary.totalImpressions.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <MousePointer className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tıklama (CTR)</p>
                <p className="font-bold">{summary.totalClicks.toLocaleString()} ({summary.avgCtr.toFixed(1)}%)</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Toplam Gelir</p>
                <p className="font-bold text-green-600">${(summary.totalRevenue / 100).toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 border-b">
          <TabsList className="h-10">
            <TabsTrigger value="slots" className="text-sm">
              <Grid3X3 className="w-4 h-4 mr-1" />
              Alanlar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm">
              <BarChart3 className="w-4 h-4 mr-1" />
              Analiz
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-sm">
              <Settings className="w-4 h-4 mr-1" />
              Ayarlar
            </TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="flex-1">
          <TabsContent value="slots" className="p-4 m-0">
            {/* Filtreler */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Alan ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-1" />
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="available">Müsait</SelectItem>
                  <SelectItem value="paused">Durduruldu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Slot Listesi */}
            <div className="space-y-4">
              {filteredSlots.length === 0 ? (
                <div className="text-center py-12">
                  <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Henüz reklam alanı yok</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Izgaranızda reklam alanları oluşturarak gelir elde etmeye başlayın
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    İlk Alanı Oluştur
                  </Button>
                </div>
              ) : (
                filteredSlots.map((slot) => (
                  <AdSlotCard
                    key={slot.id}
                    slot={slot}
                    onEdit={() => {}}
                    onToggle={handleToggleSlot}
                    onDelete={handleDeleteSlot}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="p-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gelir Analizi</CardTitle>
                <CardDescription>Son 30 günlük performans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">📊 Grafik yakında eklenecek</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Bu Ay Gelir</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">${(summary.totalRevenue / 100).toFixed(2)}</p>
                    <p className="text-xs text-green-600/70 mt-1">+24% geçen aya göre</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Ortalama CPM</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">$4.50</p>
                    <p className="text-xs text-blue-600/70 mt-1">Sektör ort. $3.00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="p-4 m-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Genel Ayarlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reklam Sistemini Etkinleştir</Label>
                    <p className="text-xs text-muted-foreground">Tüm reklam alanlarını açar/kapatır</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Otomatik Reklam Onayı</Label>
                    <p className="text-xs text-muted-foreground">Uygun reklamları otomatik onayla</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Boş Slot Dolgusu</Label>
                    <p className="text-xs text-muted-foreground">Boş slotlarda varsayılan reklam göster</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yasaklı Kategoriler</CardTitle>
                <CardDescription>Bu kategorilerdeki reklamlar gösterilmez</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {AD_CATEGORIES.slice(0, 8).map((cat) => (
                    <Badge key={cat.id} variant="outline" className="cursor-pointer hover:bg-muted">
                      {cat.icon} {cat.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
      
      {/* Create Dialog */}
      <CreateSlotDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateSlot}
      />
    </div>
  );
}
