'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Wrench,
  Shield,
  FileText,
  Share2,
  Heart,
  MessageSquare,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Download,
  Calendar,
  User,
  MapPin,
  Zap,
  Activity,
  BarChart3,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';
import { ContentItem } from '@/lib/initial-content';
import Image from 'next/image';

export default function ItemDetailPage() {
  const params = useParams();
  const itemId = params.id as string;
  
  const { 
    tabs, 
    lifecycleTrackings, 
    warranties, 
    insurances, 
    appraisals, 
    financingOptions,
    inventoryTransactions,
    user,
  } = useAppStore();

  // Find the item from tabs (it's in ContentItem format)
  const item = useMemo(() => {
    for (const tab of tabs) {
      if (tab.id === itemId) return tab;
      if (tab.children) {
        const found = tab.children.find(c => c.id === itemId);
        if (found) return found;
      }
    }
    return null;
  }, [tabs, itemId]);

  const lifecycleData = lifecycleTrackings[itemId];
  const itemWarranties = warranties.filter(w => w.itemId === itemId);
  const itemInsurances = insurances.filter(i => i.itemId === itemId);
  const itemAppraisals = appraisals.filter(a => a.itemId === itemId);
  const itemFinancing = financingOptions.filter(f => f.itemId === itemId);
  const itemTransactions = inventoryTransactions.filter(t => t.itemId === itemId);

  const [activeTab, setActiveTab] = useState('overview');

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-24 h-24 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">Eşya Bulunamadı</h2>
          <p className="text-gray-600 mb-4">Bu eşya veya ürün bulunamadı</p>
          <Link href="/inventory">
            <Button>Envanterime Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/inventory">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
            </Link>
            <h1 className="text-2xl font-bold truncate">{item.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Heart className="w-4 h-4 mr-2" />
              Favori
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Paylaş
            </Button>
            <Button size="sm">
              <Edit2 className="w-4 h-4 mr-2" />
              Düzenle
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Item Image & Basic Info */}
          <div className="lg:col-span-2">
            {/* Image */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                {(item as any).imageUrl ? (
                  <Image
                    src={(item as any).imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Package className="w-32 h-32 text-gray-300" />
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {lifecycleData && (
                  <Badge className="bg-blue-100 text-blue-800 border-0">
                    <Activity className="w-3 h-3 mr-1" />
                    Takip Edildi
                  </Badge>
                )}
                {itemWarranties.length > 0 && (
                  <Badge className="bg-green-100 text-green-800 border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    {itemWarranties.length} Garanti
                  </Badge>
                )}
                {itemInsurances.length > 0 && (
                  <Badge className="bg-purple-100 text-purple-800 border-0">
                    <Zap className="w-3 h-3 mr-1" />
                    {itemInsurances.length} Sigorta
                  </Badge>
                )}
                {itemAppraisals.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-0">
                    <FileText className="w-3 h-3 mr-1" />
                    {itemAppraisals.length} Ekspetiz
                  </Badge>
                )}
              </div>

              <p className="text-gray-600">{(item as any).description}</p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white rounded-lg shadow-sm">
                <TabsTrigger value="overview">Genel</TabsTrigger>
                <TabsTrigger value="lifecycle">Yaşam Döngüsü</TabsTrigger>
                <TabsTrigger value="maintenance">Bakım</TabsTrigger>
                <TabsTrigger value="transactions">İşlemler</TabsTrigger>
                <TabsTrigger value="documents">Belgeler</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Temel Bilgiler</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Başlık</label>
                      <p className="font-semibold">{item.title}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Tür</label>
                      <p className="font-semibold">{item.type}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Oluşturulma Tarihi</label>
                      <p className="font-semibold">{new Date(item.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Son Güncellenme</label>
                      <p className="font-semibold">{new Date(item.updatedAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Lifecycle Tab */}
              <TabsContent value="lifecycle" className="space-y-4">
                {lifecycleData ? (
                  <div className="space-y-6">
                    {/* Current Condition */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Mevcut Durum
                      </h2>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm text-gray-600">Yaşam Döngüsü Aşaması</label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-semibold capitalize">{lifecycleData.currentStage}</span>
                            <Badge variant="outline">
                            {lifecycleData.currentStage === 'new' ? 'Yeni' :
                             lifecycleData.currentStage === 'good' ? 'İyi' :
                             lifecycleData.currentStage === 'fair' ? 'Orta' :
                             lifecycleData.currentStage === 'poor' ? 'Kötü' :
                             lifecycleData.currentStage === 'parts-only' ? 'Yedek Parça' : 'Diğer'}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm text-gray-600">İzleme Durumu</label>
                          <div className="flex items-center gap-2 mt-1">
                            {lifecycleData.isTrackingEnabled ? (
                              <Badge className="bg-green-100 text-green-800 border-0">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Aktif
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pasif</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Condition Scores */}
                      <div className="mt-6">
                        <h3 className="font-semibold mb-4">Durum Puanları</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">Genel Durum</span>
                              <span className="font-semibold">{lifecycleData.condition.overall}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${lifecycleData.condition.overall}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">Görünüm</span>
                              <span className="font-semibold">{lifecycleData.condition.appearance}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${lifecycleData.condition.appearance}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">İşlevsellik</span>
                              <span className="font-semibold">{lifecycleData.condition.functionality}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${lifecycleData.condition.functionality}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Depreciation Chart */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-orange-600" />
                        Değer Tahmini (Simüle)
                      </h3>
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <div className="text-3xl font-bold text-orange-600 mb-2">-%15</div>
                        <p className="text-gray-600">Son 12 ayda ortalama değer kaybı</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-6 text-center py-12">
                    <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="font-semibold mb-2">Takip Etkinleştirilmemiş</h3>
                    <p className="text-gray-600 mb-4">
                      Bu eşya için yaşam döngüsü takibini etkinleştirmek isterseniz:
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Takip Başlat
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Maintenance Tab */}
              <TabsContent value="maintenance" className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-blue-600" />
                    Bakım Geçmişi
                  </h2>

                  {lifecycleData?.maintenanceHistory && lifecycleData.maintenanceHistory.length > 0 ? (
                    <div className="space-y-3">
                      {lifecycleData.maintenanceHistory.map((record: any) => (
                        <div key={record.id} className="border-l-4 border-blue-600 pl-4 py-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{record.type}</h4>
                            <span className="text-sm text-gray-600">
                              {new Date(record.date).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{record.description}</p>
                          {record.cost && (
                            <p className="text-sm mt-2 font-semibold text-green-600">
                              Maliyet: ${(record.cost / 100).toFixed(2)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                      <p className="text-gray-600">Henüz bakım kaydı yok</p>
                    </div>
                  )}

                  <Button className="mt-6 w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Bakım Kaydı Ekle
                  </Button>
                </div>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">İşlem Geçmişi</h2>

                  {itemTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {itemTransactions.map((trans) => (
                        <div key={trans.id} className="flex items-center justify-between py-3 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            {trans.type === 'sale' ? (
                              <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : trans.type === 'purchase' ? (
                              <TrendingDown className="w-5 h-5 text-orange-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-blue-600" />
                            )}
                            <div>
                              <p className="font-semibold capitalize">{trans.type}</p>
                              <p className="text-sm text-gray-600">
                                {trans.fromStatus} → {trans.toStatus}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {trans.amount && (
                              <p className="font-semibold">${(trans.amount / 100).toFixed(2)}</p>
                            )}
                            <p className="text-sm text-gray-600">
                              {new Date(trans.timestamp).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-600">Henüz işlem geçmişi yok</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-6">Belgeler & Sertifikalar</h2>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Warranties */}
                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-800">
                        <Shield className="w-5 h-5" />
                        Garantiler
                      </h3>
                      {itemWarranties.length > 0 ? (
                        <div className="space-y-2">
                          {itemWarranties.map(warranty => (
                            <div key={warranty.id} className="text-sm">
                              <p className="font-semibold">{warranty.type}</p>
                              <p className="text-xs text-gray-600">
                                {new Date(warranty.endDate).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Garanti yok</p>
                      )}
                      <Button size="sm" className="w-full mt-3">
                        <Plus className="w-3 h-3 mr-1" />
                        Garanti Ekle
                      </Button>
                    </div>

                    {/* Insurance */}
                    <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-800">
                        <Zap className="w-5 h-5" />
                        Sigorta
                      </h3>
                      {itemInsurances.length > 0 ? (
                        <div className="space-y-2">
                          {itemInsurances.map(insurance => (
                            <div key={insurance.id} className="text-sm">
                              <p className="font-semibold">{insurance.provider}</p>
                              <p className="text-xs text-gray-600">
                                Tutar: ${(insurance.coverageAmount / 100).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Sigorta yok</p>
                      )}
                      <Button size="sm" className="w-full mt-3">
                        <Plus className="w-3 h-3 mr-1" />
                        Sigorta Ekle
                      </Button>
                    </div>

                    {/* Appraisals */}
                    <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-800">
                        <FileText className="w-5 h-5" />
                        Ekspetiz
                      </h3>
                      {itemAppraisals.length > 0 ? (
                        <div className="space-y-2">
                          {itemAppraisals.map(appraisal => (
                            <div key={appraisal.id} className="text-sm">
                                <p className="font-semibold">${(appraisal.estimatedValue / 100).toFixed(2)}</p>
                              <p className="text-xs text-gray-600">
                                {new Date(appraisal.date).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Ekspetiz yok</p>
                      )}
                      <Button size="sm" className="w-full mt-3">
                        <Plus className="w-3 h-3 mr-1" />
                        Ekspetiz Iste
                      </Button>
                    </div>

                    {/* Financing */}
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                        <CreditCard className="w-5 h-5" />
                        Finansman
                      </h3>
                      {itemFinancing.length > 0 ? (
                        <div className="space-y-2">
                          {itemFinancing.map(financing => (
                            <div key={financing.id} className="text-sm">
                              <p className="font-semibold">${(financing.monthlyPayment / 100).toFixed(2)}/ay</p>
                              <p className="text-xs text-gray-600">
                                {financing.term} ay
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Finansman yok</p>
                      )}
                      <Button size="sm" className="w-full mt-3">
                        <Plus className="w-3 h-3 mr-1" />
                        Finansman
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Actions & Quick Stats */}
          <div>
            {/* Action Cards */}
            <div className="space-y-4">
              {/* Share to Marketplace */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold mb-3">Pazara Sunun</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Bu eşyayı pazar yerine ekleyerek satabilirsiniz.
                </p>
                <Link href="/inventory">
                  <Button className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Pazar Yerine Ekle
                  </Button>
                </Link>
              </div>

              {/* Tracking Status */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Takip Durumu
                </h3>
                {lifecycleData ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Yaşam Döngüsü</span>
                      <Badge className="bg-blue-100 text-blue-800 border-0">Aktif</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bakım Kaydı</span>
                      <span className="font-semibold">{lifecycleData.maintenanceHistory?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Garantiler</span>
                      <span className="font-semibold">{itemWarranties.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sigorta</span>
                      <span className="font-semibold">{itemInsurances.length}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-yellow-600" />
                    <p className="text-sm text-gray-600">Takip aktif değil</p>
                    <Button size="sm" className="w-full mt-3">
                      Takip Başlat
                    </Button>
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold mb-4">Hızlı İşlemler</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Soru Sor
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Rapor İndir
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Düzenle
                  </Button>
                  <Button variant="destructive" className="w-full justify-start" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Sil
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
