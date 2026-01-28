'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CreditCard, 
  Building2, 
  Receipt, 
  FileText, 
  Download,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Crown,
  Sparkles,
  Zap,
  Star,
  Clock,
  Calendar,
  ArrowUpRight,
  BadgeCheck,
  Shield,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// Zod Schemas
const taxInfoSchema = z.object({
  companyName: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır').optional().or(z.literal('')),
  taxId: z.string().min(10, 'Vergi numarası 10 haneli olmalıdır').max(11, 'Vergi numarası en fazla 11 haneli olabilir').optional().or(z.literal('')),
  taxOffice: z.string().min(2, 'Vergi dairesi adı gerekli').optional().or(z.literal('')),
  billingAddress: z.string().min(10, 'Fatura adresi en az 10 karakter olmalıdır'),
  city: z.string().min(2, 'Şehir seçimi gerekli'),
  country: z.string().min(2, 'Ülke seçimi gerekli'),
  postalCode: z.string().min(5, 'Posta kodu gerekli'),
  billingEmail: z.string().email('Geçerli bir email adresi girin'),
});

const paymentMethodSchema = z.object({
  cardNumber: z.string().min(16, 'Kart numarası 16 haneli olmalıdır').max(19, 'Geçersiz kart numarası'),
  cardHolder: z.string().min(3, 'Kart sahibi adı gerekli'),
  expiryMonth: z.string().min(2, 'Ay seçimi gerekli'),
  expiryYear: z.string().min(4, 'Yıl seçimi gerekli'),
  cvv: z.string().min(3, 'CVV 3 haneli olmalıdır').max(4, 'CVV en fazla 4 haneli olabilir'),
});

type TaxInfoFormData = z.infer<typeof taxInfoSchema>;
type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

// Mock Data Types
interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  description: string;
  pdfUrl?: string;
}

interface Subscription {
  id: string;
  planName: string;
  planTier: 'free' | 'starter' | 'professional' | 'enterprise';
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'paused' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  features: string[];
}

// Subscription Plans
const plans = [
  {
    id: 'free',
    name: 'Ücretsiz',
    price: 0,
    yearlyPrice: 0,
    description: 'Başlangıç için ideal',
    features: [
      '5 proje',
      '1 GB depolama',
      'Temel widgetlar',
      'Topluluk desteği',
    ],
    icon: Sparkles,
    popular: false,
  },
  {
    id: 'starter',
    name: 'Başlangıç',
    price: 49,
    yearlyPrice: 490,
    description: 'Küçük ekipler için',
    features: [
      '25 proje',
      '10 GB depolama',
      'Tüm widgetlar',
      'Email desteği',
      'Özel temalar',
    ],
    icon: Zap,
    popular: false,
  },
  {
    id: 'professional',
    name: 'Profesyonel',
    price: 99,
    yearlyPrice: 990,
    description: 'Büyüyen ekipler için',
    features: [
      'Sınırsız proje',
      '100 GB depolama',
      'Tüm özellikler',
      'Öncelikli destek',
      'API erişimi',
      'Özel entegrasyonlar',
    ],
    icon: Star,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Kurumsal',
    price: null,
    yearlyPrice: null,
    description: 'Büyük organizasyonlar',
    features: [
      'Sınırsız her şey',
      'Özel SLA',
      'Dedicated destek',
      'SSO / SAML',
      'Özel geliştirmeler',
      'On-premise seçeneği',
    ],
    icon: Crown,
    popular: false,
  },
];

export function BillingSettings() {
  const { user, userSubscriptionTier } = useAppStore();
  const [activeTab, setActiveTab] = useState('subscription');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mock subscription data
  const [subscription, setSubscription] = useState<Subscription>({
    id: 'sub-1',
    planName: 'Profesyonel',
    planTier: 'professional',
    price: 99,
    currency: 'TRY',
    billingCycle: 'monthly',
    status: 'active',
    currentPeriodStart: '2025-01-01',
    currentPeriodEnd: '2025-02-01',
    features: ['Sınırsız proje', '100 GB depolama', 'Tüm özellikler'],
  });

  // Mock payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'pm-1',
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2026,
      isDefault: true,
    },
    {
      id: 'pm-2',
      type: 'card',
      brand: 'Mastercard',
      last4: '8888',
      expiryMonth: 6,
      expiryYear: 2025,
      isDefault: false,
    },
  ]);

  // Mock invoices
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'inv-1',
      number: 'INV-2025-001',
      date: '2025-01-01',
      dueDate: '2025-01-15',
      amount: 99,
      currency: 'TRY',
      status: 'paid',
      description: 'Profesyonel Plan - Ocak 2025',
    },
    {
      id: 'inv-2',
      number: 'INV-2024-012',
      date: '2024-12-01',
      dueDate: '2024-12-15',
      amount: 99,
      currency: 'TRY',
      status: 'paid',
      description: 'Profesyonel Plan - Aralık 2024',
    },
    {
      id: 'inv-3',
      number: 'INV-2024-011',
      date: '2024-11-01',
      dueDate: '2024-11-15',
      amount: 99,
      currency: 'TRY',
      status: 'paid',
      description: 'Profesyonel Plan - Kasım 2024',
    },
  ]);

  // Tax Info Form
  const taxForm = useForm<TaxInfoFormData>({
    resolver: zodResolver(taxInfoSchema),
    defaultValues: {
      companyName: '',
      taxId: '',
      taxOffice: '',
      billingAddress: '',
      city: 'Istanbul',
      country: 'Türkiye',
      postalCode: '',
      billingEmail: user?.email || '',
    },
  });

  // Payment Method Form
  const paymentForm = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      cardNumber: '',
      cardHolder: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
    },
  });

  const handleTaxInfoSubmit = async (data: TaxInfoFormData) => {
    setIsSaving(true);
    try {
      // API call would go here
      console.log('Saving tax info:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPaymentMethod = async (data: PaymentMethodFormData) => {
    setIsSaving(true);
    try {
      // API call would go here
      console.log('Adding payment method:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMethod: PaymentMethod = {
        id: `pm-${Date.now()}`,
        type: 'card',
        brand: data.cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
        last4: data.cardNumber.slice(-4),
        expiryMonth: parseInt(data.expiryMonth),
        expiryYear: parseInt(data.expiryYear),
        isDefault: paymentMethods.length === 0,
      };
      
      setPaymentMethods([...paymentMethods, newMethod]);
      setIsAddingCard(false);
      paymentForm.reset();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
  };

  const handleSetDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.map(pm => ({
      ...pm,
      isDefault: pm.id === id,
    })));
  };

  const handleChangePlan = async (planId: string) => {
    console.log('Changing to plan:', planId);
    // API call would go here
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    const labels = {
      paid: 'Ödendi',
      pending: 'Bekliyor',
      overdue: 'Gecikmiş',
      cancelled: 'İptal',
    };
    return (
      <Badge variant="outline" className={cn('font-medium', styles[status])}>
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Faturalandırma</h1>
          <p className="text-white/60 mt-1">Abonelik, ödeme yöntemleri ve fatura geçmişi</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger value="subscription" className="data-[state=active]:bg-white/10">
            <Crown className="h-4 w-4 mr-2" />
            Abonelik
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="data-[state=active]:bg-white/10">
            <CreditCard className="h-4 w-4 mr-2" />
            Ödeme Yöntemleri
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-white/10">
            <Receipt className="h-4 w-4 mr-2" />
            Faturalar
          </TabsTrigger>
          <TabsTrigger value="tax-info" className="data-[state=active]:bg-white/10">
            <Building2 className="h-4 w-4 mr-2" />
            Vergi Bilgileri
          </TabsTrigger>
        </TabsList>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          {/* Current Plan */}
          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{subscription.planName} Plan</CardTitle>
                    <CardDescription className="text-white/60">
                      {subscription.billingCycle === 'monthly' ? 'Aylık' : 'Yıllık'} faturalandırma
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aktif
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-sm mb-1">Mevcut Dönem</div>
                  <div className="text-white font-medium">
                    {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-sm mb-1">Aylık Ücret</div>
                  <div className="text-white font-medium text-xl">
                    {formatCurrency(subscription.price, subscription.currency)}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-white/60 text-sm mb-1">Sonraki Ödeme</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    {formatDate(subscription.currentPeriodEnd)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn("text-sm", billingCycle === 'monthly' ? 'text-white' : 'text-white/60')}>
              Aylık
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={cn(
                "relative w-14 h-7 rounded-full transition-colors",
                billingCycle === 'yearly' ? 'bg-purple-500' : 'bg-white/20'
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
                  billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                )}
              />
            </button>
            <span className={cn("text-sm flex items-center gap-2", billingCycle === 'yearly' ? 'text-white' : 'text-white/60')}>
              Yıllık
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                2 ay bedava
              </Badge>
            </span>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === subscription.planTier;
              const price = billingCycle === 'monthly' ? plan.price : plan.yearlyPrice;
              const Icon = plan.icon;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative transition-all hover:scale-[1.02]",
                    plan.popular && "border-purple-500 shadow-lg shadow-purple-500/20",
                    isCurrentPlan && "bg-white/5",
                    !isCurrentPlan && "bg-white/[0.02] hover:bg-white/5"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                        En Popüler
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className={cn(
                      "mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-3",
                      plan.popular ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-white/10"
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-white/60">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-4">
                      {price !== null ? (
                        <>
                          <span className="text-3xl font-bold text-white">{formatCurrency(price)}</span>
                          <span className="text-white/60">/{billingCycle === 'monthly' ? 'ay' : 'yıl'}</span>
                        </>
                      ) : (
                        <span className="text-xl font-medium text-white">Özel Fiyat</span>
                      )}
                    </div>
                    <ul className="space-y-2 text-sm text-left">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-white/80">
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {isCurrentPlan ? (
                      <Button disabled className="w-full bg-white/10 text-white/60">
                        <BadgeCheck className="h-4 w-4 mr-2" />
                        Mevcut Plan
                      </Button>
                    ) : price !== null ? (
                      <Button
                        onClick={() => handleChangePlan(plan.id)}
                        className={cn(
                          "w-full",
                          plan.popular
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                            : "bg-white/10 hover:bg-white/20 text-white"
                        )}
                      >
                        Plan Değiştir
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                        İletişime Geç
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Ödeme Yöntemleri</h3>
            <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
              <DialogTrigger asChild>
                <Button className="bg-purple-500 hover:bg-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Kart Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Yeni Kart Ekle</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Ödeme yöntemi olarak yeni bir kredi veya banka kartı ekleyin.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={paymentForm.handleSubmit(handleAddPaymentMethod)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="text-white">Kart Numarası</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      className="bg-white/5 border-white/10 text-white"
                      {...paymentForm.register('cardNumber')}
                    />
                    {paymentForm.formState.errors.cardNumber && (
                      <p className="text-red-400 text-sm">{paymentForm.formState.errors.cardNumber.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardHolder" className="text-white">Kart Sahibi</Label>
                    <Input
                      id="cardHolder"
                      placeholder="AD SOYAD"
                      className="bg-white/5 border-white/10 text-white uppercase"
                      {...paymentForm.register('cardHolder')}
                    />
                    {paymentForm.formState.errors.cardHolder && (
                      <p className="text-red-400 text-sm">{paymentForm.formState.errors.cardHolder.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Ay</Label>
                      <Select onValueChange={(val) => paymentForm.setValue('expiryMonth', val)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Ay" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i} value={String(i + 1).padStart(2, '0')}>
                              {String(i + 1).padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Yıl</Label>
                      <Select onValueChange={(val) => paymentForm.setValue('expiryYear', val)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Yıl" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          {Array.from({ length: 10 }, (_, i) => (
                            <SelectItem key={i} value={String(2025 + i)}>
                              {2025 + i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="text-white">CVV</Label>
                      <Input
                        id="cvv"
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        className="bg-white/5 border-white/10 text-white"
                        {...paymentForm.register('cvv')}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsAddingCard(false)} className="text-white/60">
                      İptal
                    </Button>
                    <Button type="submit" className="bg-purple-500 hover:bg-purple-600" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Ekleniyor...
                        </>
                      ) : (
                        'Kart Ekle'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="bg-white/[0.02] border-white/10">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-white/60" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{method.brand}</span>
                        <span className="text-white/60">•••• {method.last4}</span>
                        {method.isDefault && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                            Varsayılan
                          </Badge>
                        )}
                      </div>
                      <span className="text-white/40 text-sm">
                        {method.expiryMonth?.toString().padStart(2, '0')}/{method.expiryYear}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefaultPaymentMethod(method.id)}
                        className="text-white/60 hover:text-white"
                      >
                        Varsayılan Yap
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {paymentMethods.length === 0 && (
              <Card className="bg-white/[0.02] border-white/10 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <CreditCard className="h-12 w-12 text-white/20 mb-4" />
                  <p className="text-white/60 text-center">
                    Henüz ödeme yöntemi eklenmemiş.
                    <br />
                    <span className="text-white/40">Kart ekleyerek başlayın.</span>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Fatura Geçmişi</h3>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
              <Download className="h-4 w-4 mr-2" />
              Tümünü İndir
            </Button>
          </div>

          <div className="space-y-3">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="bg-white/[0.02] border-white/10">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white/60" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{invoice.number}</span>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <span className="text-white/40 text-sm">{invoice.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </div>
                      <div className="text-white/40 text-sm">{formatDate(invoice.date)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/60 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tax Info Tab */}
        <TabsContent value="tax-info">
          <Card className="bg-white/[0.02] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Vergi ve Fatura Bilgileri</CardTitle>
              <CardDescription className="text-white/60">
                Kurumsal fatura almak için şirket bilgilerinizi girin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={taxForm.handleSubmit(handleTaxInfoSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-white">Şirket Adı (Opsiyonel)</Label>
                    <Input
                      id="companyName"
                      placeholder="ABC Teknoloji A.Ş."
                      className="bg-white/5 border-white/10 text-white"
                      {...taxForm.register('companyName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId" className="text-white">Vergi Numarası</Label>
                    <Input
                      id="taxId"
                      placeholder="1234567890"
                      className="bg-white/5 border-white/10 text-white"
                      {...taxForm.register('taxId')}
                    />
                    {taxForm.formState.errors.taxId && (
                      <p className="text-red-400 text-sm">{taxForm.formState.errors.taxId.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxOffice" className="text-white">Vergi Dairesi</Label>
                    <Input
                      id="taxOffice"
                      placeholder="Büyük Mükellefler"
                      className="bg-white/5 border-white/10 text-white"
                      {...taxForm.register('taxOffice')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingEmail" className="text-white">Fatura E-posta</Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      placeholder="fatura@sirket.com"
                      className="bg-white/5 border-white/10 text-white"
                      {...taxForm.register('billingEmail')}
                    />
                    {taxForm.formState.errors.billingEmail && (
                      <p className="text-red-400 text-sm">{taxForm.formState.errors.billingEmail.message}</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-4">
                  <h4 className="text-white font-medium">Fatura Adresi</h4>
                  <div className="space-y-2">
                    <Label htmlFor="billingAddress" className="text-white">Adres</Label>
                    <Input
                      id="billingAddress"
                      placeholder="Tam adres..."
                      className="bg-white/5 border-white/10 text-white"
                      {...taxForm.register('billingAddress')}
                    />
                    {taxForm.formState.errors.billingAddress && (
                      <p className="text-red-400 text-sm">{taxForm.formState.errors.billingAddress.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-white">Şehir</Label>
                      <Select 
                        defaultValue={taxForm.getValues('city')}
                        onValueChange={(val) => taxForm.setValue('city', val)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Şehir seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="Istanbul">İstanbul</SelectItem>
                          <SelectItem value="Ankara">Ankara</SelectItem>
                          <SelectItem value="Izmir">İzmir</SelectItem>
                          <SelectItem value="Antalya">Antalya</SelectItem>
                          <SelectItem value="Bursa">Bursa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-white">Ülke</Label>
                      <Select 
                        defaultValue={taxForm.getValues('country')}
                        onValueChange={(val) => taxForm.setValue('country', val)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Ülke seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="Türkiye">Türkiye</SelectItem>
                          <SelectItem value="Germany">Almanya</SelectItem>
                          <SelectItem value="UK">İngiltere</SelectItem>
                          <SelectItem value="USA">ABD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-white">Posta Kodu</Label>
                      <Input
                        id="postalCode"
                        placeholder="34000"
                        className="bg-white/5 border-white/10 text-white"
                        {...taxForm.register('postalCode')}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="bg-purple-500 hover:bg-purple-600" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      'Bilgileri Kaydet'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
