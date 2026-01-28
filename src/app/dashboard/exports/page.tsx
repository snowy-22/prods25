'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, List, Plus, Search, Filter, SortAsc, SortDesc,
  Eye, Download, Share2, Trash2, Edit, ExternalLink, Copy,
  MoreVertical, RefreshCw, Calendar, Clock, TrendingUp,
  FileCode, FileJson, Image as ImageIcon, FileText, Code,
  Globe, Lock, AlertTriangle, Check, X, Loader2,
  BarChart3, PieChart, Activity, Users
} from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

// Types
interface Export {
  id: string;
  userId: string;
  sourceId: string;
  sourceType: 'canvas' | 'grid' | 'folder' | 'item';
  type: 'html' | 'json' | 'image' | 'pdf' | 'iframe';
  format: 'standalone' | 'embed' | 'responsive';
  title: string;
  description?: string;
  shareToken: string;
  shortCode: string;
  shareUrl: string;
  shortUrl: string;
  isPublic: boolean;
  expiresAt?: string;
  maxViews?: number;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface ExportAnalytics {
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  uniqueVisitors: number;
  topSources: Array<{ source: string; count: number }>;
  topDevices: Array<{ device: string; count: number }>;
  viewsOverTime: Array<{ date: string; count: number }>;
}

// Type icon mapping
const typeIcons: Record<string, React.ReactNode> = {
  html: <FileCode className="w-4 h-4 text-orange-500" />,
  json: <FileJson className="w-4 h-4 text-blue-500" />,
  image: <ImageIcon className="w-4 h-4 text-green-500" />,
  pdf: <FileText className="w-4 h-4 text-red-500" />,
  iframe: <Code className="w-4 h-4 text-purple-500" />,
};

// Export Card Component
const ExportCard: React.FC<{
  export_: Export;
  viewMode: 'grid' | 'list';
  onEdit: (export_: Export) => void;
  onDelete: (export_: Export) => void;
  onViewAnalytics: (export_: Export) => void;
}> = ({ export_, viewMode, onEdit, onDelete, onViewAnalytics }) => {
  const copyLink = async (short?: boolean) => {
    const url = short ? export_.shortUrl : export_.shareUrl;
    await navigator.clipboard.writeText(url);
    toast.success('Link kopyalandı!');
  };

  const openPreview = () => {
    window.open(export_.shareUrl, '_blank');
  };

  const isExpired = export_.expiresAt && new Date(export_.expiresAt) < new Date();
  const isMaxed = export_.maxViews && export_.viewCount >= export_.maxViews;

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors",
          (isExpired || isMaxed) && "opacity-60"
        )}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          {typeIcons[export_.type]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{export_.title}</h3>
            {export_.isPublic ? (
              <Globe className="w-3 h-3 text-green-500" />
            ) : (
              <Lock className="w-3 h-3 text-amber-500" />
            )}
            {(isExpired || isMaxed) && (
              <Badge variant="destructive" className="text-xs">
                {isExpired ? 'Süresi doldu' : 'Limit aşıldı'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {export_.shortCode} • {new Date(export_.createdAt).toLocaleDateString('tr-TR')}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {export_.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {export_.downloadCount}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            {export_.shareCount}
          </span>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openPreview}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Önizle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyLink()}>
              <Copy className="w-4 h-4 mr-2" />
              Linki Kopyala
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyLink(true)}>
              <Copy className="w-4 h-4 mr-2" />
              Kısa Link Kopyala
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewAnalytics(export_)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analitik
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(export_)}>
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(export_)}
              className="text-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors",
        (isExpired || isMaxed) && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {typeIcons[export_.type]}
          {export_.isPublic ? (
            <Globe className="w-3 h-3 text-green-500" />
          ) : (
            <Lock className="w-3 h-3 text-amber-500" />
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openPreview}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Önizle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyLink()}>
              <Copy className="w-4 h-4 mr-2" />
              Linki Kopyala
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewAnalytics(export_)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analitik
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(export_)}>
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(export_)}
              className="text-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      <h3 className="font-medium truncate mb-1">{export_.title}</h3>
      <p className="text-xs text-muted-foreground mb-3">
        {export_.shortCode} • {export_.format}
      </p>

      {/* Status badges */}
      {(isExpired || isMaxed) && (
        <Badge variant="destructive" className="text-xs mb-3">
          {isExpired ? 'Süresi doldu' : 'Limit aşıldı'}
        </Badge>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {export_.viewCount}
        </span>
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          {export_.downloadCount}
        </span>
        <span className="flex items-center gap-1">
          <Share2 className="w-3 h-3" />
          {export_.shareCount}
        </span>
      </div>

      {/* Date */}
      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        {new Date(export_.createdAt).toLocaleDateString('tr-TR')}
      </p>
    </motion.div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: number;
  description?: string;
}> = ({ title, value, icon, change, description }) => (
  <div className="p-4 rounded-lg border border-border bg-card">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-muted-foreground">{title}</span>
      {icon}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    {change !== undefined && (
      <p className={cn(
        "text-xs mt-1",
        change >= 0 ? "text-green-500" : "text-red-500"
      )}>
        {change >= 0 ? '+' : ''}{change}% bu hafta
      </p>
    )}
    {description && (
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    )}
  </div>
);

// Main Dashboard Component
export default function ExportsDashboard() {
  const user = useAppStore((s) => s.user);
  
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'viewCount' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [deleteDialog, setDeleteDialog] = useState<Export | null>(null);
  const [analyticsDialog, setAnalyticsDialog] = useState<Export | null>(null);
  const [analytics, setAnalytics] = useState<ExportAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch exports
  const fetchExports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/export');
      const data = await res.json();
      
      if (data.success) {
        setExports(data.exports || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Export\'lar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExports();
    }
  }, [user]);

  // Fetch analytics for specific export
  const fetchAnalytics = async (export_: Export) => {
    try {
      setAnalyticsLoading(true);
      const res = await fetch(`/api/export/${export_.id}/analytics`);
      const data = await res.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Analytics error:', error);
      toast.error('Analitik yüklenemedi');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Delete export
  const handleDelete = async () => {
    if (!deleteDialog) return;
    
    try {
      const res = await fetch(`/api/export/${deleteDialog.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setExports(prev => prev.filter(e => e.id !== deleteDialog.id));
        toast.success('Export silindi');
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      toast.error('Silme başarısız');
    } finally {
      setDeleteDialog(null);
    }
  };

  // Handle analytics dialog
  const handleViewAnalytics = (export_: Export) => {
    setAnalyticsDialog(export_);
    fetchAnalytics(export_);
  };

  // Filter and sort exports
  const filteredExports = useMemo(() => {
    let result = [...exports];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.shortCode.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(e => e.type === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'viewCount') {
        comparison = a.viewCount - b.viewCount;
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [exports, searchQuery, typeFilter, sortBy, sortOrder]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = exports.length;
    const views = exports.reduce((sum, e) => sum + e.viewCount, 0);
    const downloads = exports.reduce((sum, e) => sum + e.downloadCount, 0);
    const shares = exports.reduce((sum, e) => sum + e.shareCount, 0);
    const publicCount = exports.filter(e => e.isPublic).length;
    
    return { total, views, downloads, shares, publicCount };
  }, [exports]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Giriş yapmalısınız</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Export Arşivi</h1>
          <Button onClick={() => toast.info('Yeni export için canvas\'tan export yapın')}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Export
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatsCard
            title="Toplam Export"
            value={stats.total}
            icon={<FileCode className="w-4 h-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Görüntüleme"
            value={stats.views}
            icon={<Eye className="w-4 h-4 text-blue-500" />}
            change={12}
          />
          <StatsCard
            title="İndirme"
            value={stats.downloads}
            icon={<Download className="w-4 h-4 text-green-500" />}
            change={5}
          />
          <StatsCard
            title="Paylaşım"
            value={stats.shares}
            icon={<Share2 className="w-4 h-4 text-purple-500" />}
            change={-2}
          />
          <StatsCard
            title="Herkese Açık"
            value={stats.publicCount}
            icon={<Globe className="w-4 h-4 text-amber-500" />}
            description={`${stats.total - stats.publicCount} gizli`}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Tür" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="image">Görsel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="iframe">iFrame</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sırala" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Tarih</SelectItem>
              <SelectItem value="viewCount">Görüntüleme</SelectItem>
              <SelectItem value="title">İsim</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </Button>

          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" onClick={fetchExports}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredExports.length === 0 ? (
          <div className="text-center py-12">
            <FileCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || typeFilter !== 'all'
                ? 'Sonuç bulunamadı'
                : 'Henüz export yok'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Canvas veya grid\'den export yaparak başlayın
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-2"
            )}>
              {filteredExports.map((export_) => (
                <ExportCard
                  key={export_.id}
                  export_={export_}
                  viewMode={viewMode}
                  onEdit={(e) => toast.info('Düzenleme yakında eklenecek')}
                  onDelete={setDeleteDialog}
                  onViewAnalytics={handleViewAnalytics}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export\'u Sil</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteDialog?.title}&rdquo; export\'unu silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(null)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={!!analyticsDialog} onOpenChange={() => setAnalyticsDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analitik: {analyticsDialog?.title}</DialogTitle>
          </DialogHeader>
          
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{analytics.totalViews}</p>
                  <p className="text-xs text-muted-foreground">Görüntüleme</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{analytics.totalDownloads}</p>
                  <p className="text-xs text-muted-foreground">İndirme</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{analytics.totalShares}</p>
                  <p className="text-xs text-muted-foreground">Paylaşım</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{analytics.uniqueVisitors}</p>
                  <p className="text-xs text-muted-foreground">Tekil Ziyaretçi</p>
                </div>
              </div>

              {/* Top Sources */}
              <div>
                <h4 className="text-sm font-medium mb-2">UTM Kaynakları</h4>
                <div className="space-y-2">
                  {analytics.topSources.length > 0 ? (
                    analytics.topSources.map((source, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{source.source || 'Doğrudan'}</span>
                        <span className="text-muted-foreground">{source.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Veri yok</p>
                  )}
                </div>
              </div>

              {/* Top Devices */}
              <div>
                <h4 className="text-sm font-medium mb-2">Cihazlar</h4>
                <div className="space-y-2">
                  {analytics.topDevices.length > 0 ? (
                    analytics.topDevices.map((device, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{device.device}</span>
                        <span className="text-muted-foreground">{device.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Veri yok</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">Analitik verisi yüklenemedi</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
