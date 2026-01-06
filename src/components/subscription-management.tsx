'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, 
  X, 
  Crown, 
  Zap, 
  Shield, 
  ArrowRight,
  AlertTriangle,
  Info,
  CreditCard,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionManagement() {
  const { userSubscriptionTier, setUserSubscriptionTier } = useAppStore();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'plans' | 'manage' | 'cancel'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.tier === userSubscriptionTier);
  const filteredPlans = SUBSCRIPTION_PLANS.filter(p => p.id !== 'enterprise'); // Kurumsal ayrı gösterilecek

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    toast({
      title: 'Yönlendiriliyor...',
      description: 'Ödeme sayfasına yönlendiriliyorsunuz. (Şu anda sadece UI hazır)',
    });
    // TODO: Stripe checkout sayfasına yönlendir
  };

  const handleCancelSubscription = () => {
    if (!cancelReason.trim()) {
      toast({
        title: 'Lütfen iptal nedeninizi belirtin',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Backend'e iptal isteği gönder
    toast({
      title: 'İptal İsteğiniz Alındı',
      description: 'Aboneliğiniz dönem sonunda iptal edilecek.',
    });
    setShowCancelDialog(false);
    setActiveView('manage');
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Planları Karşılaştır</TabsTrigger>
          <TabsTrigger value="manage">Aboneliğimi Yönet</TabsTrigger>
          <TabsTrigger value="cancel">Aboneliği İptal Et</TabsTrigger>
        </TabsList>

        {/* Planları Karşılaştır */}
        <TabsContent value="plans" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Size Uygun Planı Seçin</h2>
            <p className="text-muted-foreground">
              Tüm planlar canvas özellikleri ile gelir. Şu anda tüm özellikler açıktır.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {filteredPlans.map((plan) => {
              const isCurrent = plan.tier === userSubscriptionTier;
              const isPopular = plan.popular;

              return (
                <Card 
                  key={plan.id} 
                  className={cn(
                    'relative',
                    isPopular && 'border-primary shadow-lg',
                    isCurrent && 'ring-2 ring-primary'
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Crown className="h-3 w-3 mr-1" />
                        En Popüler
                      </Badge>
                    </div>
                  )}
                  
                  {isCurrent && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="outline" className="bg-background">
                        Mevcut Planınız
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {plan.tier === 'free' && <Zap className="h-5 w-5 text-yellow-500" />}
                      {plan.tier === 'basic' && <Shield className="h-5 w-5 text-blue-500" />}
                      {plan.tier === 'pro' && <Crown className="h-5 w-5 text-purple-500" />}
                      {plan.displayName}
                    </CardTitle>
                    <CardDescription>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">
                          ${(plan.price / 100).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">/ay</span>
                      </div>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Özellik Detayları
                      </p>
                      {plan.featureGroups.slice(0, 2).map((group, idx) => (
                        <div key={idx} className="space-y-1">
                          <p className="text-xs font-medium">{group.name}</p>
                          {group.features.slice(0, 3).map((feature, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-2 text-xs">
                              {feature.included ? (
                                <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                              ) : (
                                <X className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                              )}
                              <span className={cn(!feature.included && 'text-muted-foreground')}>
                                {feature.name}
                                {feature.limit && ` (${feature.limit})`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter>
                    {isCurrent ? (
                      <Button className="w-full" disabled>
                        Mevcut Planınız
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant={isPopular ? 'default' : 'outline'}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {plan.price === 0 ? 'Ücretsiz Başla' : 'Yükselt'}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Kurumsal Plan Kartı */}
          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Kurumsal Plan
              </CardTitle>
              <CardDescription>
                Büyük ekipler ve şirketler için özel çözümler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Tüm Pro özellikleri</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>SSO/SAML entegrasyonu</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Özel SLA (99.9% uptime)</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Dedicated account manager</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Satış Ekibi ile İletişime Geç
              </Button>
            </CardFooter>
          </Card>

          {/* Detaylı Karşılaştırma Tablosu */}
          <Card>
            <CardHeader>
              <CardTitle>Detaylı Özellik Karşılaştırması</CardTitle>
              <CardDescription>
                Tüm planların özellik detaylarını karşılaştırın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Özellik Grubu</th>
                      {filteredPlans.map(plan => (
                        <th key={plan.id} className="text-center py-3 px-4">
                          {plan.displayName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlans[0]?.featureGroups.map((group, groupIdx) => (
                      <React.Fragment key={groupIdx}>
                        <tr className="border-b bg-muted/50">
                          <td colSpan={filteredPlans.length + 1} className="py-2 px-4 font-semibold">
                            {group.name}
                          </td>
                        </tr>
                        {group.features.map((feature, featureIdx) => (
                          <tr key={featureIdx} className="border-b">
                            <td className="py-2 px-4">{feature.name}</td>
                            {filteredPlans.map(plan => {
                              const planFeature = plan.featureGroups[groupIdx]?.features[featureIdx];
                              return (
                                <td key={plan.id} className="text-center py-2 px-4">
                                  {planFeature?.included ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <Check className="h-4 w-4 text-green-500" />
                                      {planFeature.limit && (
                                        <span className="text-xs text-muted-foreground">
                                          {planFeature.limit}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <X className="h-4 w-4 text-muted-foreground mx-auto" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aboneliğimi Yönet */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mevcut Aboneliğiniz</CardTitle>
              <CardDescription>
                Abonelik bilgilerinizi görüntüleyin ve yönetin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="font-semibold">{currentPlan?.displayName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Aylık Ücret</p>
                      <p className="font-semibold">
                        ${currentPlan?.price ? (currentPlan.price / 100).toFixed(2) : '0.00'}/ay
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Yenileme Tarihi</p>
                      <p className="font-semibold">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Durum</p>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600">
                        Aktif
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Kullanım İstatistikleri</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Canvas Öğeleri</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {currentPlan?.limits.maxCanvasItems === -1 ? '∞' : currentPlan?.limits.maxCanvasItems}
                        </span>
                        <span className="text-sm text-muted-foreground">limit</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>AI İstekleri</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {currentPlan?.limits.maxAIRequests === -1 ? '∞' : currentPlan?.limits.maxAIRequests}
                        </span>
                        <span className="text-sm text-muted-foreground">/ay</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Depolama</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {currentPlan?.limits.maxStorage === -1 
                            ? '∞' 
                            : `${(currentPlan?.limits.maxStorage || 0) / 1000} GB`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button className="flex-1" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Planı Yükselt
                </Button>
                <Button className="flex-1" variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ödeme Yöntemini Güncelle
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <Info className="h-5 w-5" />
                Bilgi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Şu anda tüm özellikler tüm kullanıcılar için açıktır. Gelecekte plan kısıtlamaları uygulanacaktır.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aboneliği İptal Et */}
        <TabsContent value="cancel" className="space-y-6">
          <Card className="border-red-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Aboneliği İptal Et
              </CardTitle>
              <CardDescription>
                Aboneliğinizi iptal etmeden önce aşağıdaki bilgileri gözden geçirin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">İptal Ettiğinizde Neler Olur?</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Mevcut dönem sonuna kadar tüm özelliklere erişiminiz devam eder</li>
                  <li>Dönem sonu: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}</li>
                  <li>İptal sonrası otomatik olarak Temel plana geçiş yapılacak</li>
                  <li>Verileriniz silinmez, ancak bazı özelliklere erişim kısıtlanır</li>
                  <li>İstediğiniz zaman tekrar abone olabilirsiniz</li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Kaybedeceğiniz Özellikler</h3>
                {currentPlan?.featureGroups.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-sm font-medium">{group.name}</p>
                    <div className="grid gap-1 pl-4">
                      {group.features
                        .filter(f => f.included && !SUBSCRIPTION_PLANS[0].featureGroups[idx]?.features.find(ff => ff.name === f.name)?.included)
                        .map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <X className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                            <span>{feature.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowCancelDialog(true)}
              >
                Aboneliği İptal Et
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aboneliği İptal Et</DialogTitle>
            <DialogDescription>
              Neden iptal etmek istediğinizi bize bildirin (isteğe bağlı)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="İptal nedeniniz..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription}>
              İptal Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
