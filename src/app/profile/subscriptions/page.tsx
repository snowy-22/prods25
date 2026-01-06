'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  Check,
  X,
  Plus,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionsPage() {
  const { user, userSubscriptionTier, orders } = useAppStore();

  const subscriptionPlans = [
    {
      name: 'Ücretsiz',
      tier: 'free',
      price: 0,
      features: [
        '10 GB depolama',
        'Temel destek',
        '1 aktif proje',
        'Sınırlı API erişimi',
      ],
    },
    {
      name: 'Plus',
      tier: 'plus',
      price: 9.99,
      popular: true,
      features: [
        '100 GB depolama',
        'Öncelikli destek',
        '5 aktif proje',
        'Sınırsız API erişimi',
        'Özel özelliklere erişim',
      ],
    },
    {
      name: 'Pro',
      tier: 'pro',
      price: 29.99,
      features: [
        '1 TB depolama',
        '24/7 ön destek',
        'Sınırsız proje',
        'Sınırsız API erişimi',
        'İleri analitikler',
        'Özel entegrasyonlar',
      ],
    },
    {
      name: 'Kurumsal',
      tier: 'corporate',
      price: 'Özel Fiyat',
      features: [
        'Sınırsız depolama',
        'Adanmış destek',
        'Sınırsız her şey',
        'SLA garantisi',
        'Özel eğitim',
        'İş birliği uzmanı',
      ],
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">Profil</h2>
          <p className="text-gray-600 mb-6">
            Bu sayfaya erişmek için giriş yapmanız gerekiyor.
          </p>
          <Link href="/auth">
            <Button>Giriş Yap</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Geri
          </Link>
          <h1 className="text-4xl font-bold">Abonelikler</h1>
          <p className="text-gray-600 mt-1">Planınızı yönetin ve yükseltin</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Aktif Plan</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 mb-2">Şu Anki Plan</p>
              <p className="text-3xl font-bold capitalize mb-4">
                {subscriptionPlans.find(p => p.tier === userSubscriptionTier)?.name}
              </p>
              <p className="text-gray-600 mb-6">
                {userSubscriptionTier === 'guest'
                  ? 'Başlamaya hazır mısınız? Daha fazla özellik için plan yükseltin.'
                  : 'Yüksek kaliteli özellikleri kullanırken keyif alın.'}
              </p>
              {userSubscriptionTier !== 'kurumsal' && userSubscriptionTier !== 'kurumsal_pro' && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Planı Yükselt
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Sonraki Ödeme Tarihi</p>
                <p className="font-semibold">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fatura Dönem</p>
                <p className="font-semibold">Aylık</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Otomatik Yenileme</p>
                <p className="font-semibold text-green-600">Etkin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Tüm Planlar</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionPlans.map(plan => (
              <div
                key={plan.tier}
                className={`rounded-lg border-2 p-6 ${
                  plan.tier === userSubscriptionTier
                    ? 'border-blue-500 bg-blue-50'
                    : plan.popular
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">
                    Popüler
                  </div>
                )}
                {plan.tier === userSubscriptionTier && (
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">
                    Şu Anki Plan
                  </div>
                )}

                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  {typeof plan.price === 'string' ? (
                    <p className="text-2xl font-bold">{plan.price}</p>
                  ) : (
                    <>
                      <p className="text-3xl font-bold">${plan.price}</p>
                      <p className="text-sm text-gray-600">/ay</p>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full mb-6"
                  disabled={plan.tier === userSubscriptionTier}
                >
                  {plan.tier === userSubscriptionTier ? 'Mevcut Plan' : 'Seç'}
                </Button>

                <div className="space-y-3">
                  {plan.features.map(feature => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-6">Fatura Geçmişi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Tarih</th>
                  <th className="text-left py-3 px-4 font-semibold">Dönem</th>
                  <th className="text-left py-3 px-4 font-semibold">Tutar</th>
                  <th className="text-left py-3 px-4 font-semibold">Durum</th>
                  <th className="text-left py-3 px-4 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    date: new Date(Date.now() - 0 * 30 * 24 * 60 * 60 * 1000),
                    period: 'Ocak 2025',
                    amount: 9.99,
                    status: 'Ödendi',
                  },
                  {
                    date: new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000),
                    period: 'Aralık 2024',
                    amount: 9.99,
                    status: 'Ödendi',
                  },
                  {
                    date: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
                    period: 'Kasım 2024',
                    amount: 0,
                    status: 'Ücretsiz Dönem',
                  },
                ].map((invoice, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {invoice.date.toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">{invoice.period}</td>
                    <td className="py-3 px-4">
                      {invoice.amount > 0 ? `$${invoice.amount.toFixed(2)}` : 'Ücretsiz'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        İndir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
