'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { TrashItem, RestoreOption } from '@/lib/trash-types';
import { ContentItem } from '@/lib/initial-content';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, RotateCcw, Trash, Clock, HardDrive, AlertTriangle, Search, X } from 'lucide-react';

interface TrashPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrashPanel: React.FC<TrashPanelProps> = ({ isOpen, onClose }) => {
  const {
    trashItems,
    trashStats,
    moveToTrash,
    restoreFromTrash,
    permanentlyDeleteTrash,
    loadTrashBucket,
    getTrashStats,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'size'>('date');
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);
  const [restoreLocation, setRestoreLocation] = useState<string>('original');
  const [customLocationPath, setCustomLocationPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load trash data on mount
  useEffect(() => {
    if (isOpen) {
      loadTrashBucket();
      getTrashStats();
    }
  }, [isOpen, loadTrashBucket, getTrashStats]);

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    let items = [...trashItems];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.item_type?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'date':
        items.sort(
          (a, b) =>
            new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
        );
        break;
      case 'type':
        items.sort((a, b) => (a.item_type || '').localeCompare(b.item_type || ''));
        break;
      case 'size':
        items.sort((a, b) => {
          const sizeA = JSON.stringify(b.content).length;
          const sizeB = JSON.stringify(a.content).length;
          return sizeA - sizeB;
        });
        break;
    }

    return items;
  }, [trashItems, searchQuery, sortBy]);

  // Format bytes to readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Get item size
  const getItemSize = (item: TrashItem): number => {
    return JSON.stringify(item.content).length;
  };

  // Get total size
  const getTotalSize = (): number => {
    return filteredItems.reduce((sum, item) => sum + getItemSize(item), 0);
  };

  // Calculate days until expiration
  const daysUntilExpiration = (expiresAt: string): number => {
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Handle restore
  const handleRestore = async () => {
    if (!selectedItem) return;

    setIsLoading(true);
    try {
      const restoreOptions: RestoreOption = {
        restorationType: restoreLocation === 'original' ? 'original' : 'custom',
        originalParentId: (selectedItem.metadata as any)?.originalParentId,
        parentPath: restoreLocation === 'custom' ? customLocationPath : undefined,
        newParentId:
          restoreLocation === 'custom' ? customLocationPath : undefined,
      };

      await restoreFromTrash(selectedItem.id, restoreOptions);

      setRestoreDialogOpen(false);
      setSelectedItem(null);
      setCustomLocationPath('');
      setRestoreLocation('original');

      // Reload trash
      await loadTrashBucket();
      await getTrashStats();
    } catch (error) {
      console.error('Failed to restore item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async () => {
    if (!selectedItem) return;

    setIsLoading(true);
    try {
      await permanentlyDeleteTrash(selectedItem.id);

      setDeleteConfirmOpen(false);
      setSelectedItem(null);

      // Reload trash
      await loadTrashBucket();
      await getTrashStats();
    } catch (error) {
      console.error('Failed to permanently delete item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle empty trash
  const handleEmptyTrash = async () => {
    setIsLoading(true);
    try {
      // Delete all items permanently
      for (const item of filteredItems) {
        await permanentlyDeleteTrash(item.id);
      }

      setEmptyConfirmOpen(false);

      // Reload trash
      await loadTrashBucket();
      await getTrashStats();
    } catch (error) {
      console.error('Failed to empty trash:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-900 shadow-lg z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Çöp Kutusu</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="items" className="flex-1 flex flex-col">
            <TabsList className="m-4 grid w-auto grid-cols-2">
              <TabsTrigger value="items">Öğeler ({filteredItems.length})</TabsTrigger>
              <TabsTrigger value="stats">İstatistikler</TabsTrigger>
            </TabsList>

            {/* Items Tab */}
            <TabsContent value="items" className="flex-1 overflow-hidden flex flex-col m-0">
              {/* Search and Filter */}
              <div className="border-b px-4 py-3 dark:border-slate-700">
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 bg-transparent p-0 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Tarih</SelectItem>
                      <SelectItem value="type">Tür</SelectItem>
                      <SelectItem value="size">Boyut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items List */}
              {filteredItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div className="flex flex-col items-center gap-4">
                    {/* Büyük Çöp Kutusu İkonu */}
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full blur-2xl opacity-60" />
                      <div className="relative p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600">
                        <Trash2 className="h-20 w-20 text-slate-400 dark:text-slate-500" />
                      </div>
                    </div>
                    <div className="space-y-1 mt-2">
                      <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                        {searchQuery ? 'Sonuç bulunamadı' : 'Çöp Kutusu Boş'}
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-[200px]">
                        {searchQuery 
                          ? 'Farklı bir arama terimi deneyin' 
                          : 'Silinen öğeler burada görünecek'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-2 p-4">
                    {filteredItems.map((item) => (
                      <TrashItemCard
                        key={item.id}
                        item={item}
                        isSelected={selectedItem?.id === item.id}
                        onSelect={() => setSelectedItem(item)}
                        onRestore={() => {
                          setSelectedItem(item);
                          setRestoreDialogOpen(true);
                        }}
                        onDelete={() => {
                          setSelectedItem(item);
                          setDeleteConfirmOpen(true);
                        }}
                        daysUntilExpiration={daysUntilExpiration(item.expires_at)}
                        formatBytes={formatBytes}
                        getItemSize={getItemSize}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  <StatCard
                    icon={<Trash className="h-5 w-5" />}
                    label="Toplam Öğe"
                    value={trashStats?.total_deleted_items ?? 0}
                  />

                  <StatCard
                    icon={<HardDrive className="h-5 w-5" />}
                    label="Toplam Boyut"
                    value={formatBytes(trashStats?.total_size_bytes ?? 0)}
                  />

                  <StatCard
                    icon={<Clock className="h-5 w-5" />}
                    label="En Eski Öğe"
                    value={
                      trashStats?.oldest_item_deleted_at
                        ? formatDistanceToNow(
                            new Date(trashStats.oldest_item_deleted_at),
                            { locale: tr, addSuffix: true }
                          )
                        : '-'
                    }
                  />

                  <StatCard
                    icon={<Clock className="h-5 w-5" />}
                    label="En Yeni Öğe"
                    value={
                      trashStats?.newest_item_deleted_at
                        ? formatDistanceToNow(
                            new Date(trashStats.newest_item_deleted_at),
                            { locale: tr, addSuffix: true }
                          )
                        : '-'
                    }
                  />

                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                        Otomatik Silme
                      </p>
                    </div>
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      Çöp kutusundaki öğeler 30 gün sonra otomatik olarak silinecektir.
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                    <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      Boyut Dağılımı
                    </p>
                    {filteredItems.length > 0 && (
                      <div className="space-y-2">
                        {filteredItems.slice(0, 5).map((item) => (
                          <div key={item.id} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="truncate text-slate-700 dark:text-slate-300">
                                {item.title || 'Adsız'}
                              </span>
                              <span className="text-slate-500">
                                {formatBytes(getItemSize(item))}
                              </span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <div
                                className="h-full bg-blue-500"
                                style={{
                                  width: `${(getItemSize(item) / getTotalSize()) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        {filteredItems.length > 0 && (
          <div className="border-t p-4 dark:border-slate-700">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => setEmptyConfirmOpen(true)}
              disabled={isLoading}
            >
              <Trash className="mr-2 h-4 w-4" />
              Çöp Kutusunu Boşalt
            </Button>
          </div>
        )}
      </div>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Öğeyi Geri Yükle</DialogTitle>
            <DialogDescription>
              {selectedItem?.title || 'Öğe'} nereye geri yüklenmesini istiyorsunuz?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={restoreLocation}
              onValueChange={setRestoreLocation}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Orijinal Konuma</SelectItem>
                <SelectItem value="custom">Özel Konum</SelectItem>
              </SelectContent>
            </Select>

            {restoreLocation === 'custom' && (
              <Input
                placeholder="Hedef klasör yolunu girin"
                value={customLocationPath}
                onChange={(e) => setCustomLocationPath(e.target.value)}
              />
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button
              onClick={handleRestore}
              disabled={
                isLoading || (restoreLocation === 'custom' && !customLocationPath)
              }
            >
              {isLoading ? 'Geri Yükleniyor...' : 'Geri Yükle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Kalıcı Olarak Sil?</AlertDialogTitle>
          <AlertDialogDescription>
            "{selectedItem?.title || 'Bu öğe'}" kalıcı olarak silinecektir. Bu işlem
            geri alınamaz.
          </AlertDialogDescription>
          <div className="flex gap-4">
            <AlertDialogCancel disabled={isLoading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Trash Confirmation */}
      <AlertDialog open={emptyConfirmOpen} onOpenChange={setEmptyConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Çöp Kutusunu Boşalt?</AlertDialogTitle>
          <AlertDialogDescription>
            {filteredItems.length} öğe kalıcı olarak silinecektir. Bu işlem geri
            alınamaz.
          </AlertDialogDescription>
          <div className="flex gap-4">
            <AlertDialogCancel disabled={isLoading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmptyTrash}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? 'Boşaltılıyor...' : 'Boşalt'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/**
 * Trash Item Card Component
 */
interface TrashItemCardProps {
  item: TrashItem;
  isSelected: boolean;
  onSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
  daysUntilExpiration: number;
  formatBytes: (bytes: number) => string;
  getItemSize: (item: TrashItem) => number;
}

const TrashItemCard: React.FC<TrashItemCardProps> = ({
  item,
  isSelected,
  onSelect,
  onRestore,
  onDelete,
  daysUntilExpiration,
  formatBytes,
  getItemSize,
}) => {
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return '📁';
      case 'video':
        return '🎥';
      case 'image':
        return '🖼️';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      case 'widget':
        return '🔧';
      case 'scene':
        return '🎬';
      case 'presentation':
        return '📊';
      default:
        return '📦';
    }
  };

  const getExpirationColor = (days: number) => {
    if (days <= 3) return 'text-red-600 dark:text-red-400';
    if (days <= 7) return 'text-orange-600 dark:text-orange-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  return (
    <div
      className={`rounded-lg border p-3 transition-colors cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-800/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0 mt-0.5">
          {getItemIcon(item.item_type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm truncate text-slate-900 dark:text-white">
              {item.title || 'Adsız'}
            </h3>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {item.item_type}
            </Badge>
          </div>

          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>
                Silinme:{' '}
                {formatDistanceToNow(new Date(item.deleted_at), {
                  locale: tr,
                  addSuffix: true,
                })}
              </span>
              <span className={getExpirationColor(daysUntilExpiration)}>
                {daysUntilExpiration === 0
                  ? 'Bugün silinecek'
                  : `${daysUntilExpiration} gün kaldı`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Boyut: {formatBytes(getItemSize(item))}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onRestore();
            }}
            title="Geri Yükle"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Kalıcı Olarak Sil"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expiration Bar */}
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full transition-colors ${
            daysUntilExpiration <= 3
              ? 'bg-red-500'
              : daysUntilExpiration <= 7
              ? 'bg-orange-500'
              : 'bg-blue-500'
          }`}
          style={{
            width: `${Math.max(10, (daysUntilExpiration / 30) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
};

/**
 * Stat Card Component
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value }) => (
  <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
    <div className="flex items-center gap-3 mb-2">
      <div className="text-slate-600 dark:text-slate-400">{icon}</div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
    </div>
    <div className="text-2xl font-bold text-slate-900 dark:text-white">
      {value}
    </div>
  </div>
);
