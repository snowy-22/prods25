'use client';

import { useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag,
  ArrowLeft,
  Calendar,
  MapPin,
  CreditCard,
  Download,
  Truck,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { orders, user } = useAppStore();

  const order = orders.find(o => o.id === orderId);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">Siparişler</h2>
          <p className="text-gray-600 mb-6">
            Siparişlerinizi görmek için giriş yapmanız gerekiyor.
          </p>
          <Link href="/auth">
            <Button>Giriş Yap</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!order || order.userId !== user.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
          <h2 className="text-2xl font-bold mb-2">Sipariş Bulunamadı</h2>
          <p className="text-gray-600 mb-6">
            Aradığınız sipariş bulunamadı veya erişim izniniz yok.
          </p>
          <Link href="/orders">
            <Button>Siparişlere Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusTimeline = [
    {
      status: 'placed',
      label: 'Sipariş Oluşturuldu',
      timestamp: order.createdAt,
      completed: true,
    },
    {
      status: 'processing',
      label: 'İşleniyor',
      timestamp: order.status === 'processing' || ['shipped', 'completed'].includes(order.status) ? order.updatedAt : null,
      completed: ['shipped', 'completed'].includes(order.status),
    },
    {
      status: 'shipped',
      label: 'Gönderildi',
      timestamp: order.status === 'shipped' || order.status === 'completed' ? order.updatedAt : null,
      completed: order.status === 'completed',
    },
    {
      status: 'delivered',
      label: 'Teslim Edildi',
      timestamp: order.status === 'completed' ? order.updatedAt : null,
      completed: order.status === 'completed',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Link href="/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Siparişlere Dön
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold">Sipariş #{order.id.slice(0, 8)}</h1>
              <p className="text-gray-600 mt-1">
                {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge status={order.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Ürünler</h2>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">Ürün Kodu: {item.productId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{item.quantity} × ${(item.unitPrice / 100).toFixed(2)}</p>
                      <p className="font-semibold">${(item.totalPrice / 100).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Addresses */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Teslimat Adresi
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {order.shippingAddress && (
                    <>
                      <p className="font-semibold text-gray-900">{order.shippingAddress.name}</p>
                      <p>{order.shippingAddress.street}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                      <p>Tel: {order.shippingAddress.phone}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Fatura Adresi
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {order.shippingAddress ? (
                    <>
                      <p className="font-semibold text-gray-900">{order.shippingAddress.name}</p>
                      <p>{order.shippingAddress.street}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                    </>
                  ) : (
                    <p className="text-gray-400">Fatura adresi mevcut değil</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Durumu Takip Et</h2>
              <div className="space-y-6">
                {statusTimeline.map((item, idx) => (
                  <div key={item.status} className="flex gap-4">
                    {/* Timeline marker */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        item.completed
                          ? 'bg-green-500 text-white'
                          : idx === statusTimeline.findIndex(t => !t.completed && t.timestamp !== null)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {item.completed ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      {idx < statusTimeline.length - 1 && (
                        <div className={`w-1 h-12 ${item.completed ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>

                    {/* Timeline content */}
                    <div className="pb-6 pt-1">
                      <p className="font-semibold">{item.label}</p>
                      {item.timestamp && (
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(item.timestamp).toLocaleDateString('tr-TR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Faturayı İndir
              </Button>
              {order.status === 'shipped' && (
                <Button variant="outline" className="flex-1">
                  <Truck className="w-4 h-4 mr-2" />
                  Siparişi Takip Et
                </Button>
              )}
              <Button variant="outline" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Destek
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold mb-4">Sipariş Özeti</h3>
              <div className="space-y-3 text-sm border-b pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ara Toplam</span>
                  <span>${(order.subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vergi</span>
                  <span>${(order.tax / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kargo</span>
                  <span>${(order.shipping / 100).toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim</span>
                    <span>-${(order.discount / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Toplam</span>
                <span>${(order.total / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold mb-4">Ödeme Bilgisi</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Yöntem</p>
                  <p className="font-semibold text-gray-900">
                    {order.paymentMethod || 'Kredi Kartı'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1">Durum</p>
                  <p className="font-semibold">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </p>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold mb-2">Sorun mu var?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Sorunuzun çözümü için destek ekibimizle iletişime geçin.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <MessageSquare className="w-4 h-4 mr-2" />
                Destek Talep Oluştur
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    pending_payment: { label: 'Ödeme Beklemede', color: 'bg-yellow-100 text-yellow-800' },
    pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
    processing: { label: 'İşleniyor', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Gönderildi', color: 'bg-purple-100 text-purple-800' },
    completed: { label: 'Tamamlandı', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800' },
  };

  const { label, color } = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    pending: { label: 'Bekleniyor', color: 'bg-yellow-100 text-yellow-800' },
    completed: { label: 'Ödendi', color: 'bg-green-100 text-green-800' },
    failed: { label: 'Başarısız', color: 'bg-red-100 text-red-800' },
    pending_payment: { label: 'Ödeme Bekleniyor', color: 'bg-yellow-100 text-yellow-800' },
  };

  const { label, color } = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}
