// Payments removed: provide local plan metadata only
export const SUBSCRIPTION_PLANS = [
  // Misafir (Guest) - Free tier
  {
    id: 'plan_guest',
    name: 'Misafir',
    description: 'Ücretsiz deneme',
    tier: 'guest' as const,
    priceId: null,
    productId: 'free',
    amount: 0,
    currency: 'usd' as const,
    billingPeriod: 'one-time' as const,
    features: [
      'Temel özellikler',
      '1 proje',
      '100 MB depolama',
      'Topluluk desteği',
    ],
  },
  
  // Plus - Bireysel kullanıcı
  {
    id: 'plan_plus',
    name: 'Plus',
    description: 'Bireysel kullanıcılar için',
    tier: 'plus' as const,
    priceId: null,
    productId: 'plus',
    amount: 2900, // $29/ay
    currency: 'usd' as const,
    billingPeriod: 'monthly' as const,
    interval: 'month' as const,
    features: [
      '10 projeye kadar',
      '5 GB depolama',
      'E-posta desteği',
      'Temel analitik',
      'Özel widget\'lar',
    ],
    trialDays: 14,
  },
  
  // Pro - Profesyonel
  {
    id: 'plan_pro',
    name: 'Pro',
    description: 'Profesyoneller için',
    tier: 'pro' as const,
    priceId: null,
    productId: 'pro',
    amount: 7900, // $79/ay
    currency: 'usd' as const,
    billingPeriod: 'monthly' as const,
    interval: 'month' as const,
    isPopular: true,
    features: [
      'Sınırsız proje',
      '50 GB depolama',
      'Öncelikli destek',
      'Gelişmiş analitik',
      'API erişimi',
      'Özel entegrasyonlar',
      'A/B testing',
    ],
    trialDays: 14,
  },
  
  // Kurumsal - Business
  {
    id: 'plan_kurumsal',
    name: 'Kurumsal',
    description: 'Kurumlar için',
    tier: 'kurumsal' as const,
    priceId: null,
    productId: 'kurumsal',
    amount: 19900, // $199/ay
    currency: 'usd' as const,
    billingPeriod: 'monthly' as const,
    interval: 'month' as const,
    features: [
      'Tüm Pro özellikler',
      '200 GB depolama',
      'Özel destek',
      'SLA garantisi',
      'Takım yönetimi (20 kullanıcı)',
      'Beyaz etiket',
      'Gelişmiş güvenlik',
    ],
    trialDays: 30,
  },
  
  // Kurumsal Pro - Enterprise
  {
    id: 'plan_kurumsal_pro',
    name: 'Kurumsal Pro',
    description: 'Büyük kurumlar için',
    tier: 'kurumsal_pro' as const,
    priceId: null,
    productId: 'kurumsal_pro',
    amount: 49900, // $499/ay
    currency: 'usd' as const,
    billingPeriod: 'monthly' as const,
    interval: 'month' as const,
    features: [
      'Tüm Kurumsal özellikler',
      'Sınırsız depolama',
      '7/24 özel destek',
      'Özel SLA',
      'Sınırsız kullanıcı',
      'Özel altyapı',
      'Compliance sertifikaları',
      'Özel geliştirme',
    ],
    trialDays: 30,
  },
] as const;

export function getPlanById(planId: string) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
}

export function getPlanByPriceId(_priceId: string) {
  // No external prices; return undefined
  return undefined;
}
