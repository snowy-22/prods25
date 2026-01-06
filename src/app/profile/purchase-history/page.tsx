'use client';

import { useState, useMemo } from 'react';
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
  ArrowLeft,
  Search,
  Download,
  Eye,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';

export default function PurchaseHistoryPage() {
  const { orders, user } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '90days' | '1year'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const filteredOrders = useMemo(() => {
    if (!user) return [];

    let filtered = orders.filter(order => order.userId === user.id);

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.items.some((item: any) => item.title.toLowerCase().includes(query))
      );
    }

    // Date filter
    const now = new Date();
    switch (dateFilter) {
      case '30days':
        filtered = filtered.filter(order =>
          (now.getTime() - new Date(order.createdAt).getTime()) <= 30 * 24 * 60 * 60 * 1000
        );
        break;
      case '90days':
        filtered = filtered.filter(order =>
          (now.getTime() - new Date(order.createdAt).getTime()) <= 90 * 24 * 60 * 60 * 1000
        );
        break;
      case '1year':
        filtered = filtered.filter(order =>
          (now.getTime() - new Date(order.createdAt).getTime()) <= 365 * 24 * 60 * 60 * 1000
        );
        break;
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.total - a.total);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.total - b.total);
        break;
    }

    return filtered;
  }, [orders, user, searchQuery, dateFilter, sortBy]);

  const totalSpent = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + order.total, 0) / 100,
    [filteredOrders]
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">Satın Alma Geçmişi</h2>
          <p className="text-gray-600 mb-6">
            Satın alma geçmişinizi görmek için giriş yapmanız gerekiyor.
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
          <h1 className="text-4xl font-bold">Satın Alma Geçmişi</h1>
          <p className="text-gray-600 mt-1">Tüm siparişlerinizi ve satın almalarınızı görüntüleyin</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-2">Toplam Sipariş</p>
            <p className="text-3xl font-bold">{filteredOrders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-2">Toplam Harcama</p>
            <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-2">Ortalama Sipariş</p>
            <p className="text-3xl font-bold">
              ${(filteredOrders.length > 0 ? totalSpent / filteredOrders.length : 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <SearchInput
                placeholder="Sipariş ID veya ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
              <SelectTrigger className="min-w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Zamanlar</SelectItem>
                <SelectItem value="30days">Son 30 Gün</SelectItem>
                <SelectItem value="90days">Son 90 Gün</SelectItem>
                <SelectItem value="1year">Son 1 Yıl</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="min-w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">En Yeni</SelectItem>
                <SelectItem value="oldest">En Eski</SelectItem>
                <SelectItem value="highest">En Yüksek Fiyat</SelectItem>
                <SelectItem value="lowest">En Düşük Fiyat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold mb-2">Sipariş Bulunamadı</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || dateFilter !== 'all'
                ? 'Arama kriterlerinizi değiştirmeyi deneyin'
                : 'Henüz hiç satın alma yapmadınız'}
            </p>
            <Link href="/products">
              <Button>Alışverişe Başla</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-sm">Sipariş No</th>
                    <th className="text-left py-3 px-6 font-semibold text-sm">Tarih</th>
                    <th className="text-left py-3 px-6 font-semibold text-sm">Ürünler</th>
                    <th className="text-left py-3 px-6 font-semibold text-sm">Tutar</th>
                    <th className="text-left py-3 px-6 font-semibold text-sm">Durum</th>
                    <th className="text-left py-3 px-6 font-semibold text-sm">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <Link href={`/orders/${order.id}`} className="font-mono text-blue-600 hover:underline text-sm">
                          #{order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="truncate max-w-[250px]">
                          {order.items.slice(0, 1).map((item: any) => item.title).join(', ')}
                          {order.items.length > 1 && ` +${order.items.length - 1}`}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold">
                        ${(order.total / 100).toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}
