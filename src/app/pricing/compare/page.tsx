'use client';

import { useState } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
// Stripe kaldırıldı: yerel plan listesi kullanılıyor
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type BillingPeriod = 'monthly' | 'yearly';

export default function SubscriptionComparePage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  // Yerel planlar (Stripe bağımsız)
  const plans = [
    {
      id: 'plan_guest',
      name: 'Misafir',
      description: 'Ücretsiz deneme',
      tier: 'guest' as const,
      amount: 0,
    },
    {
      id: 'plan_plus',
      name: 'Plus',
      description: 'Bireysel kullanıcılar için',
      tier: 'plus' as const,
      amount: 2900,
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      description: 'Profesyoneller için',
      tier: 'pro' as const,
      amount: 7900,
      isPopular: true,
    },
    {
      id: 'plan_kurumsal',
      name: 'Kurumsal',
      description: 'Kurumlar için',
      tier: 'kurumsal' as const,
      amount: 19900,
    },
    {
      id: 'plan_kurumsal_pro',
      name: 'Kurumsal Pro',
      description: 'Büyük kurumlar için',
      tier: 'kurumsal_pro' as const,
      amount: 49900,
    },
  ] as const;

  // Özellik kategorileri
  const featureCategories = [
    {
      name: 'Temel Özellikler',
      features: [
        { name: 'Proje sayısı', values: ['1', '10', 'Sınırsız', 'Sınırsız', 'Sınırsız'] },
        { name: 'Depolama alanı', values: ['100 MB', '5 GB', '50 GB', '200 GB', 'Sınırsız'] },
        { name: 'Kullanıcı sayısı', values: ['1', '1', '5', '20', 'Sınırsız'] },
        { name: 'API erişimi', values: [false, false, true, true, true] },
      ],
    },
    {
      name: 'İçerik Yönetimi',
      features: [
        { name: 'Widget kütüphanesi', values: ['Temel', 'Gelişmiş', 'Tümü', 'Tümü', 'Tümü + Özel'] },
        { name: 'Video/Medya yükleme', values: ['100 MB', '5 GB', '50 GB', '200 GB', 'Sınırsız'] },
        { name: 'Özel iframe entegrasyonu', values: [false, true, true, true, true] },
        { name: 'Dosya yöneticisi', values: [false, true, true, true, true] },
      ],
    },
    {
      name: 'E-Ticaret & Marketplace',
      features: [
        { name: 'Ürün satışı', values: [false, '10 ürün', '100 ürün', '1000 ürün', 'Sınırsız'] },
        { name: 'Dijital ürün satışı', values: [false, true, true, true, true] },
        { name: 'Fiziksel ürün satışı', values: [false, false, true, true, true] },
        { name: 'Komisyon oranı', values: ['-', '%15', '%10', '%5', '%2'] },
        { name: 'Ödeme yöntemleri', values: ['Temel', 'Temel', 'Tümü', 'Tümü', 'Tümü + Özel'] },
        { name: 'Stok yönetimi', values: [false, false, true, true, true] },
        { name: 'İndirim kuponu', values: [false, true, true, true, true] },
      ],
    },
    {
      name: 'Analitik & Raporlama',
      features: [
        { name: 'Temel metrikler', values: [true, true, true, true, true] },
        { name: 'Gelişmiş analitik', values: [false, false, true, true, true] },
        { name: 'Gerçek zamanlı dashboard', values: [false, false, true, true, true] },
        { name: 'A/B testing', values: [false, false, true, true, true] },
        { name: 'Özel raporlar', values: [false, false, false, true, true] },
        { name: 'Veri dışa aktarma', values: [false, false, true, true, true] },
      ],
    },
    {
      name: 'Destek & Güvenlik',
      features: [
        { name: 'Destek türü', values: ['Topluluk', 'E-posta', 'Öncelikli', 'Özel', '7/24 Özel'] },
        { name: 'Yanıt süresi', values: ['48 saat', '24 saat', '12 saat', '4 saat', '1 saat'] },
        { name: 'SLA garantisi', values: [false, false, false, true, true] },
        { name: '2FA kimlik doğrulama', values: [true, true, true, true, true] },
        { name: 'Beyaz etiket', values: [false, false, false, true, true] },
        { name: 'Özel sertifikalar', values: [false, false, false, false, true] },
      ],
    },
    {
      name: 'İşbirliği & Entegrasyon',
      features: [
        { name: 'Takım çalışma alanları', values: [false, false, true, true, true] },
        { name: 'Rol tabanlı erişim', values: [false, false, true, true, true] },
        { name: 'Özel entegrasyonlar', values: [false, false, '5', '20', 'Sınırsız'] },
        { name: 'Webhook desteği', values: [false, false, true, true, true] },
        { name: 'Özel geliştirme', values: [false, false, false, false, true] },
      ],
    },
  ];

  const formatPrice = (amount: number, period: BillingPeriod) => {
    if (amount === 0) return 'Ücretsiz';
    const monthlyPrice = amount / 100;
    
    if (period === 'yearly') {
      const yearlyPrice = monthlyPrice * 12 * 0.8; // 20% indirim
      return `$${yearlyPrice.toFixed(0)}/yıl`;
    }
    
    return `$${monthlyPrice}/ay`;
  };

  const getPlanColor = (tier: string) => {
    switch(tier) {
      case 'guest': return 'bg-gray-100 border-gray-300';
      case 'plus': return 'bg-blue-50 border-blue-300';
      case 'pro': return 'bg-purple-50 border-purple-300';
      case 'kurumsal': return 'bg-orange-50 border-orange-300';
      case 'kurumsal_pro': return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-400';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tüm Üyelik Paketlerini Karşılaştır
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Size en uygun planı seçin. Tüm planlar arasındaki farkları detaylı inceleyin.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Yıllık
              <Badge className="ml-2 bg-green-500">%20 İndirim</Badge>
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Plan Headers */}
          <div className="grid grid-cols-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="p-6 border-r border-gray-200">
              <h3 className="font-semibold text-gray-900">Özellikler</h3>
            </div>
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 text-center border-r border-gray-200 last:border-r-0 ${getPlanColor(plan.tier)}`}
              >
                <div className="mb-2">
                  {plan.tier === 'pro' && (
                    <Badge className="mb-2 bg-purple-600">En Popüler</Badge>
                  )}
                  {plan.tier === 'kurumsal_pro' && (
                    <Badge className="mb-2 bg-gradient-to-r from-yellow-500 to-orange-500">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(plan.amount, billingPeriod)}
                </div>
                {/* TODO: Add trial days support
                {plan.trialDays && (
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.trialDays} gün ücretsiz deneme
                  </p>
                )}
                */}
              </div>
            ))}
          </div>

          {/* Feature Categories */}
          {featureCategories.map((category, categoryIdx) => (
            <div key={categoryIdx}>
              {/* Category Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">{category.name}</h4>
              </div>

              {/* Category Features */}
              {category.features.map((feature, featureIdx) => (
                <div
                  key={featureIdx}
                  className="grid grid-cols-6 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-4 border-r border-gray-200 flex items-center">
                    <span className="text-sm text-gray-700">{feature.name}</span>
                  </div>
                  {feature.values.map((value, valueIdx) => (
                    <div
                      key={valueIdx}
                      className="p-4 text-center border-r border-gray-200 last:border-r-0 flex items-center justify-center"
                    >
                      {typeof value === 'boolean' ? (
                        value ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300" />
                        )
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{value}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}

          {/* Action Buttons */}
          <div className="grid grid-cols-6 border-t border-gray-200 bg-gray-50">
            <div className="p-6 border-r border-gray-200"></div>
            {plans.map((plan) => (
              <div key={plan.id} className="p-6 text-center border-r border-gray-200 last:border-r-0">
                <Button
                  className={`w-full ${
                    plan.tier === 'guest'
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : plan.tier === 'pro'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : plan.tier === 'kurumsal_pro'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={() => {
                    // TODO: Open subscription purchase modal
                    console.log('Seçilen plan:', plan.tier);
                  }}
                >
                  {plan.tier === 'guest' ? 'Ücretsiz Başla' : 'Satın Al'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Sorularınız mı var?{' '}
            <a href="/contact" className="text-blue-600 hover:underline">
              Bizimle iletişime geçin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
