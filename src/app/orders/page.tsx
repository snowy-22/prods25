'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingBag,
  Calendar,
  DollarSign,
  Search,
  Filter,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  const { orders, user, fetchOrders } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-high' | 'price-low'>('newest');

  // Fetch orders from Supabase when component mounts
  useEffect(() => {
    if (user) {
      fetchOrders(user.id);
    }
  }, [user, fetchOrders]);

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

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => order.userId === user.id);

    // Search by order ID or items
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.items.some((item: any) => item.title.toLowerCase().includes(query))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-high':
        filtered.sort((a, b) => b.total - a.total);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.total - b.total);
        break;
    }

    return filtered;
  }, [orders, user.id, searchQuery, statusFilter, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfa
          </Link>
          <h1 className="text-4xl font-bold">Siparişlerim</h1>
          <p className="text-gray-600 mt-1">{filteredOrders.length} sipariş</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <SearchInput
                placeholder="Sipariş ID veya ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="min-w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="processing">İşleniyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="min-w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">En Yeni</SelectItem>
                <SelectItem value="oldest">En Eski</SelectItem>
                <SelectItem value="price-high">Fiyat (Yüksek)</SelectItem>
                <SelectItem value="price-low">Fiyat (Düşük)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold mb-2">Sipariş Bulunamadı</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Arama kriterlerinizi değiştirmeyi deneyin'
                : 'Henüz hiç sipariş vermediyseniz'}
            </p>
            <Link href="/products">
              <Button>Alışverişe Başla</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg truncate">Sipariş #{order.id.slice(0, 8)}</h3>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div>
                          {order.items.length} ürün
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="mt-3 text-sm text-gray-600">
                        {order.items.slice(0, 2).map((item: any) => (
                          <p key={item.id}>{item.title} × {item.quantity}</p>
                        ))}
                        {order.items.length > 2 && (
                          <p>+{order.items.length - 2} daha</p>
                        )}
                      </div>
                    </div>

                    {/* Right: Total & Arrow */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Toplam</p>
                        <p className="text-2xl font-bold">${(order.total / 100).toFixed(2)}</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
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
