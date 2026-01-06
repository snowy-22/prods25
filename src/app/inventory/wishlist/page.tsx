'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Heart,
  Trash2,
  DollarSign,
  TrendingDown,
  Calendar,
  Package,
  ArrowLeft,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, updateWishlistItem, user } = useAppStore();

  const [sortBy, setSortBy] = useState<'date-added' | 'target-price' | 'priority'>('date-added');
  const [filterStatus, setFilterStatus] = useState<'all' | 'interested' | 'researching' | 'ready' | 'purchased'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Filter wishlist items
  const filteredItems = useMemo(() => {
    let items = wishlistItems.filter(item => !item.userId || item.userId === user?.id);

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.productName?.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      items = items.filter(item => item.status === filterStatus);
    }

    // Sort
    switch (sortBy) {
      case 'target-price':
        items.sort((a, b) => (a.targetPrice || 0) - (b.targetPrice || 0));
        break;
      case 'priority':
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        items.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
        break;
      case 'date-added':
      default:
        items.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return items;
  }, [wishlistItems, user?.id, sortBy, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: wishlistItems.filter(item => !item.userId || item.userId === user?.id).length,
      interested: wishlistItems.filter(item => (!item.userId || item.userId === user?.id) && item.status === 'interested').length,
      researching: wishlistItems.filter(item => (!item.userId || item.userId === user?.id) && item.status === 'researching').length,
      readyToBuy: wishlistItems.filter(item => (!item.userId || item.userId === user?.id) && item.status === 'ready-to-buy').length,
      purchased: wishlistItems.filter(item => (!item.userId || item.userId === user?.id) && item.status === 'purchased').length,
    };
  }, [wishlistItems, user?.id]);

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    interested: { label: 'İlgileniyorum', color: 'bg-blue-100 text-blue-800', icon: Heart },
    researching: { label: 'Araştırıyorum', color: 'bg-purple-100 text-purple-800', icon: Search },
    'ready-to-buy': { label: 'Satın Almaya Hazır', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    purchased: { label: 'Satın Alındı', color: 'bg-gray-100 text-gray-800', icon: Package },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-8">
          <Link href="/inventory" className="inline-flex items-center gap-2 mb-4 hover:opacity-90">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Envanterime Dön</span>
          </Link>

          <h1 className="text-4xl font-bold mb-2">İstek Listem</h1>
          <p className="text-lg opacity-90">
            Satın almak istediğiniz ürünleri takip edin ve fiyat uyarılarını alın.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-pink-600">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-600">Toplam Ürün</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-600">
            <div className="text-2xl font-bold">{stats.interested}</div>
            <p className="text-sm text-gray-600">İlgileniyorum</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-600">
            <div className="text-2xl font-bold">{stats.researching}</div>
            <p className="text-sm text-gray-600">Araştırıyorum</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-600">
            <div className="text-2xl font-bold">{stats.readyToBuy}</div>
            <p className="text-sm text-gray-600">Hazır</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-600">
            <div className="text-2xl font-bold">{stats.purchased}</div>
            <p className="text-sm text-gray-600">Satın Alındı</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <SearchInput
                placeholder="Ürün adı veya açıklamasında ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="interested">İlgileniyorum</SelectItem>
                  <SelectItem value="researching">Araştırıyorum</SelectItem>
                  <SelectItem value="ready-to-buy">Satın Almaya Hazır</SelectItem>
                  <SelectItem value="purchased">Satın Alındı</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-added">Eklenme Tarihi</SelectItem>
                  <SelectItem value="target-price">Hedef Fiyat</SelectItem>
                  <SelectItem value="priority">Öncelik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-gray-600">
                {selectedItems.length} ürün seçildi
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Etiketi Değiştir
                </Button>
                <Button variant="destructive" size="sm">
                  Sil
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-bold mb-2">İstek Listeniz Boş</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterStatus !== 'all'
                ? 'Arama kriterlerinizi değiştirmeyi deneyin'
                : 'Satın almak istediğiniz ürünleri buraya ekleyin'}
            </p>
            {(searchQuery || filterStatus !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
              >
                Filtreleri Temizle
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Select All */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm font-semibold">
                {selectedItems.length === filteredItems.length && filteredItems.length > 0
                  ? 'Tümünün seçimi kaldır'
                  : 'Tümünü seç'}
              </span>
            </div>

            {/* Items */}
            {filteredItems.map((item) => {
              const status = statusConfig[item.status];
              const priceMatch = item.targetPrice
                ? false // Can't compare without current price
                : false;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="w-4 h-4 rounded cursor-pointer flex-shrink-0 mt-1"
                    />

                    {/* Image */}
                    <div className="relative w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName || 'Product'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{item.productName}</h3>
                          {item.notes && (
                            <p className="text-sm text-gray-600 line-clamp-1">{item.notes}</p>
                          )}
                        </div>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                        {/* Target Price */}
                        {item.targetPrice && (
                          <div>
                            <p className="text-gray-600">Hedef Fiyat</p>
                            <p className="font-semibold">${(item.targetPrice / 100).toFixed(2)}</p>
                          </div>
                        )}

                        {/* Current Price */}
                        {/* Removed: currentPrice property doesn't exist on WishlistItem */}

                        {/* Priority */}
                        {item.priority && (
                          <div>
                            <p className="text-gray-600">Öncelik</p>
                            <div className="flex gap-1">
                              {Array.from({ length: item.priority === 'high' ? 3 : item.priority === 'medium' ? 2 : 1 }).map((_, i) => (
                                <Heart key={i} className="w-4 h-4 fill-pink-600 text-pink-600" />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Added Date */}
                        <div>
                          <p className="text-gray-600">Eklenme Tarihi</p>
                          <p className="font-semibold">
                            {new Date(item.createdAt).toLocaleDateString('tr-TR', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {item.notes && (
                        <div className="mb-3 p-3 bg-blue-50 rounded border-l-2 border-blue-600">
                          <p className="text-sm text-blue-800">{item.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 text-sm">
                        <Select
                          value={item.status}
                          onValueChange={(newStatus) =>
                            updateWishlistItem(item.id, { status: newStatus as any })
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="interested">İlgileniyorum</SelectItem>
                            <SelectItem value="researching">Araştırıyorum</SelectItem>
                            <SelectItem value="ready-to-buy">Satın Almaya Hazır</SelectItem>
                            <SelectItem value="purchased">Satın Alındı</SelectItem>
                          </SelectContent>
                        </Select>

                        {item.status === 'purchased' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Envanterime Ekle
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromWishlist(item.id)}
                          className="text-red-600 hover:text-red-800 ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
