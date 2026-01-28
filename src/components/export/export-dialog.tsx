'use client';

/**
 * Export Dialog Component
 * 
 * Canvas/Folder/Selection'dan HTML, JSON, Image, PDF export
 * - Watermark seçenekleri
 * - Format seçenekleri (standalone, embed, responsive)
 * - Password koruması
 * - UTM parametreleri
 * - Paylaşım seçenekleri
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ContentItem } from '@/lib/initial-content';
import { 
  exportManager, 
  ExportType, 
  ExportFormat, 
  ExportSettings,
  DEFAULT_SETTINGS,
  DEFAULT_WATERMARK,
  SourceType,
  buildUrlWithUtm,
  UTMParams
} from '@/lib/export-manager';
import {
  FileCode,
  FileJson,
  Image as ImageIcon,
  FileText,
  Code2,
  Download,
  Share2,
  Copy,
  Check,
  Loader2,
  Settings,
  Eye,
  EyeOff,
  Link,
  LinkIcon,
  Lock,
  Globe,
  Calendar,
  Hash,
  Sparkles,
  Droplets,
  Layout,
  Smartphone,
  Monitor,
  Palette,
  Type,
  Shield,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Export Türü İkonları
const ExportTypeIcons: Record<ExportType, React.ReactNode> = {
  html: <FileCode className="h-5 w-5" />,
  json: <FileJson className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  pdf: <FileText className="h-5 w-5" />,
  iframe: <Code2 className="h-5 w-5" />,
};

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ContentItem[];
  sourceType: SourceType;
  sourceId: string;
  defaultTitle?: string;
}

export function ExportDialog({
  open,
  onOpenChange,
  items,
  sourceType,
  sourceId,
  defaultTitle = 'My Export',
}: ExportDialogProps) {
  const { toast } = useToast();
  
  // Export ayarları
  const [exportType, setExportType] = useState<ExportType>('html');
  const [format, setFormat] = useState<ExportFormat>('standalone');
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  
  // Settings
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_SETTINGS);
  
  // Watermark
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('tv25.app');
  const [watermarkPosition, setWatermarkPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'>('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(70);
  
  // Sharing
  const [isPublic, setIsPublic] = useState(false);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [maxViews, setMaxViews] = useState<string>('');
  
  // UTM
  const [showUtm, setShowUtm] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  
  // State
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    shareUrl?: string;
    shortUrl?: string;
    embedCode?: string;
    content?: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  
  // Aktif tab
  const [activeTab, setActiveTab] = useState<'export' | 'settings' | 'sharing'>('export');

  // Settings güncelle
  const updateSettings = useCallback((key: keyof ExportSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Export işlemi
  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      // Settings'i güncelle
      const exportSettings: ExportSettings = {
        ...settings,
        watermark: {
          ...DEFAULT_WATERMARK,
          enabled: watermarkEnabled,
          text: watermarkText,
          position: watermarkPosition,
          opacity: watermarkOpacity / 100,
        },
      };

      // Expiry hesapla
      let expiresAt: Date | undefined;
      if (expiresIn !== 'never') {
        const now = new Date();
        switch (expiresIn) {
          case '1h': expiresAt = new Date(now.getTime() + 60 * 60 * 1000); break;
          case '24h': expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); break;
          case '7d': expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); break;
          case '30d': expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); break;
        }
      }

      let result;

      switch (exportType) {
        case 'html':
          result = await exportManager.exportAsHTML(
            items,
            {
              type: 'html',
              format,
              title,
              description,
              settings: exportSettings,
              password: usePassword ? password : undefined,
              expiresAt,
              maxViews: maxViews ? parseInt(maxViews) : undefined,
            },
            sourceType,
            sourceId
          );
          break;

        case 'json':
          result = await exportManager.exportAsJSON(
            items,
            {
              type: 'json',
              format,
              title,
              description,
              settings: exportSettings,
              password: usePassword ? password : undefined,
              expiresAt,
              maxViews: maxViews ? parseInt(maxViews) : undefined,
            },
            sourceType,
            sourceId
          );
          break;

        // TODO: Image ve PDF exportları için screenshot-service kullan
        default:
          throw new Error(`Export type ${exportType} not implemented yet`);
      }

      if (!result.success || !result.export) {
        throw new Error(result.error || 'Export failed');
      }

      // URL'leri oluştur
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tv25.app';
      const utm: UTMParams = {
        source: utmSource || undefined,
        medium: utmMedium || undefined,
        campaign: utmCampaign || undefined,
      };

      const shareUrl = buildUrlWithUtm(
        `${baseUrl}/share/${result.export.shareToken}`,
        utm
      );

      const shortUrl = buildUrlWithUtm(
        `${baseUrl}/s/${result.export.shortCode}`,
        utm
      );

      // Embed code
      const embedCode = `<iframe 
  src="${baseUrl}/embed/${result.export.id}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allowfullscreen
></iframe>`;

      setExportResult({
        shareUrl,
        shortUrl,
        embedCode,
        content: result.content,
      });

      // Public yap (gerekirse)
      if (isPublic) {
        await exportManager.updateExport(result.export.id, { isPublic: true });
      }

      toast({
        title: 'Export başarılı!',
        description: 'Paylaşım linkiniz hazır.',
      });

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export başarısız',
        description: error instanceof Error ? error.message : 'Bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Kopyalama
  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: 'Kopyalandı!',
        description: `${type} panoya kopyalandı.`,
      });
    } catch {
      toast({
        title: 'Kopyalama başarısız',
        variant: 'destructive',
      });
    }
  };

  // Download
  const handleDownload = () => {
    if (!exportResult?.content) return;

    const blob = new Blob([exportResult.content], {
      type: exportType === 'json' ? 'application/json' : 'text/html',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.${exportType === 'json' ? 'json' : 'html'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Export & Share
          </DialogTitle>
          <DialogDescription>
            {items.length} öğeyi {sourceType === 'canvas' ? 'canvas\'tan' : 'seçimden'} export et
          </DialogDescription>
        </DialogHeader>

        {!exportResult ? (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="export">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Ayarlar
                </TabsTrigger>
                <TabsTrigger value="sharing">
                  <Share2 className="h-4 w-4 mr-2" />
                  Paylaşım
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto py-4">
                {/* Export Tab */}
                <TabsContent value="export" className="mt-0 space-y-6">
                  {/* Başlık & Açıklama */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Başlık</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Export başlığı"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Açıklama (opsiyonel)</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Bu export hakkında kısa bir açıklama..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Export Türü */}
                  <div className="space-y-3">
                    <Label>Export Türü</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {(['html', 'json', 'image', 'pdf', 'iframe'] as ExportType[]).map((type) => (
                        <Button
                          key={type}
                          variant={exportType === type ? 'default' : 'outline'}
                          className={cn(
                            'flex flex-col items-center gap-1 h-auto py-3',
                            exportType === type && 'ring-2 ring-primary'
                          )}
                          onClick={() => setExportType(type)}
                          disabled={type === 'image' || type === 'pdf'} // TODO: Implement
                        >
                          {ExportTypeIcons[type]}
                          <span className="text-xs uppercase">{type}</span>
                        </Button>
                      ))}
                    </div>
                    {(exportType === 'image' || exportType === 'pdf') && (
                      <p className="text-xs text-muted-foreground">
                        Bu format yakında eklenecek.
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Format */}
                  <div className="space-y-3">
                    <Label>Format</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={format === 'standalone' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                        onClick={() => setFormat('standalone')}
                      >
                        <Monitor className="h-4 w-4" />
                        <span>Standalone</span>
                      </Button>
                      <Button
                        variant={format === 'embed' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                        onClick={() => setFormat('embed')}
                      >
                        <Code2 className="h-4 w-4" />
                        <span>Embed</span>
                      </Button>
                      <Button
                        variant={format === 'responsive' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                        onClick={() => setFormat('responsive')}
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>Responsive</span>
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-0 space-y-6">
                  {/* Watermark */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        <Label>Watermark</Label>
                      </div>
                      <Switch
                        checked={watermarkEnabled}
                        onCheckedChange={setWatermarkEnabled}
                      />
                    </div>

                    {watermarkEnabled && (
                      <div className="space-y-4 pl-6 border-l-2 border-muted">
                        <div className="space-y-2">
                          <Label htmlFor="watermark-text">Metin</Label>
                          <Input
                            id="watermark-text"
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value)}
                            placeholder="Watermark metni"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Pozisyon</Label>
                            <Select value={watermarkPosition} onValueChange={(v) => setWatermarkPosition(v as any)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="top-left">Sol Üst</SelectItem>
                                <SelectItem value="top-right">Sağ Üst</SelectItem>
                                <SelectItem value="bottom-left">Sol Alt</SelectItem>
                                <SelectItem value="bottom-right">Sağ Alt</SelectItem>
                                <SelectItem value="center">Orta</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Opaklık: {watermarkOpacity}%</Label>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={watermarkOpacity}
                              onChange={(e) => setWatermarkOpacity(parseInt(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Diğer Ayarlar */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <Label>CSS stilleri dahil et</Label>
                      </div>
                      <Switch
                        checked={settings.includeStyles}
                        onCheckedChange={(v) => updateSettings('includeStyles', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <Label>Minify (küçült)</Label>
                      </div>
                      <Switch
                        checked={settings.minify}
                        onCheckedChange={(v) => updateSettings('minify', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layout className="h-4 w-4" />
                        <Label>Responsive tasarım</Label>
                      </div>
                      <Switch
                        checked={settings.responsive}
                        onCheckedChange={(v) => updateSettings('responsive', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        <Label>Metadata dahil et</Label>
                      </div>
                      <Switch
                        checked={settings.includeMetadata}
                        onCheckedChange={(v) => updateSettings('includeMetadata', v)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tema</Label>
                      <Select value={settings.theme} onValueChange={(v) => updateSettings('theme', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Otomatik</SelectItem>
                          <SelectItem value="light">Açık</SelectItem>
                          <SelectItem value="dark">Koyu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Sharing Tab */}
                <TabsContent value="sharing" className="mt-0 space-y-6">
                  {/* Görünürlük */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <div>
                        <Label>Herkese Açık</Label>
                        <p className="text-xs text-muted-foreground">
                          Herkes linke ulaşabilir
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                  </div>

                  <Separator />

                  {/* Şifre Koruması */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <Label>Şifre Koruması</Label>
                      </div>
                      <Switch
                        checked={usePassword}
                        onCheckedChange={setUsePassword}
                      />
                    </div>

                    {usePassword && (
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Şifre girin"
                      />
                    )}
                  </div>

                  <Separator />

                  {/* Süre & Limit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Geçerlilik
                      </Label>
                      <Select value={expiresIn} onValueChange={setExpiresIn}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Süresiz</SelectItem>
                          <SelectItem value="1h">1 saat</SelectItem>
                          <SelectItem value="24h">24 saat</SelectItem>
                          <SelectItem value="7d">7 gün</SelectItem>
                          <SelectItem value="30d">30 gün</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Maks. Görüntüleme
                      </Label>
                      <Input
                        type="number"
                        value={maxViews}
                        onChange={(e) => setMaxViews(e.target.value)}
                        placeholder="Limitsiz"
                        min="1"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* UTM Parametreleri */}
                  <div className="space-y-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setShowUtm(!showUtm)}
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <Label>UTM Parametreleri</Label>
                        <Badge variant="outline" className="text-xs">Analitik</Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        {showUtm ? 'Gizle' : 'Göster'}
                      </Button>
                    </div>

                    {showUtm && (
                      <div className="space-y-4 pl-6 border-l-2 border-muted">
                        <div className="space-y-2">
                          <Label htmlFor="utm-source">Source</Label>
                          <Input
                            id="utm-source"
                            value={utmSource}
                            onChange={(e) => setUtmSource(e.target.value)}
                            placeholder="örn: facebook, twitter, newsletter"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="utm-medium">Medium</Label>
                          <Input
                            id="utm-medium"
                            value={utmMedium}
                            onChange={(e) => setUtmMedium(e.target.value)}
                            placeholder="örn: social, email, cpc"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="utm-campaign">Campaign</Label>
                          <Input
                            id="utm-campaign"
                            value={utmCampaign}
                            onChange={(e) => setUtmCampaign(e.target.value)}
                            placeholder="örn: spring_sale, product_launch"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button onClick={handleExport} disabled={isExporting || !title.trim()}>
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Export ediliyor...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Et
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Export Sonucu */
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-lg">Export Hazır!</h3>
              <p className="text-sm text-muted-foreground">
                Paylaşım linkleriniz oluşturuldu
              </p>
            </div>

            <div className="space-y-4">
              {/* Share URL */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Paylaşım Linki
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={exportResult.shareUrl || ''}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(exportResult.shareUrl || '', 'Link')}
                  >
                    {copied === 'Link' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Short URL */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Kısa Link
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={exportResult.shortUrl || ''}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(exportResult.shortUrl || '', 'Kısa link')}
                  >
                    {copied === 'Kısa link' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Embed Code */}
              {(exportType === 'html' || exportType === 'iframe') && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Embed Kodu
                  </Label>
                  <div className="relative">
                    <Textarea
                      value={exportResult.embedCode || ''}
                      readOnly
                      className="font-mono text-xs h-24"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(exportResult.embedCode || '', 'Embed kodu')}
                    >
                      {copied === 'Embed kodu' ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                İndir
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.open(exportResult.shareUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Önizle
                </Button>
                <Button onClick={() => onOpenChange(false)}>
                  Tamam
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
