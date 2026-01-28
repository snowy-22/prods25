'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, FileJson, Eye, Download, Copy, Share2, 
  Lock, Clock, AlertTriangle, Check, ExternalLink,
  Maximize2, Minimize2, RefreshCw, Settings,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Types
interface ExportData {
  id: string;
  userId: string;
  sourceId: string;
  sourceType: 'canvas' | 'grid' | 'folder' | 'item';
  type: 'html' | 'json' | 'image' | 'pdf' | 'iframe';
  format: 'standalone' | 'embed' | 'responsive';
  title: string;
  description?: string;
  htmlContent?: string;
  jsonContent?: any;
  imageUrl?: string;
  shareToken: string;
  shortCode: string;
  shareUrl: string;
  shortUrl: string;
  isPublic: boolean;
  passwordHash?: string;
  expiresAt?: string;
  maxViews?: number;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  settings: {
    theme?: 'light' | 'dark' | 'system';
    showHeader?: boolean;
    showFooter?: boolean;
    watermark?: {
      enabled: boolean;
      text?: string;
      position?: string;
      opacity?: number;
    };
    customCss?: string;
    allowInteraction?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Code Editor Component (Lightweight)
const CodeEditor: React.FC<{
  value: string;
  language: 'html' | 'json';
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}> = ({ value, language, onChange, readOnly = false, className }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const formattedValue = useMemo(() => {
    if (language === 'json') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  }, [value, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedValue);
      toast.success('Panoya kopyalandı!');
    } catch {
      toast.error('Kopyalama başarısız');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([formattedValue], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export.${language}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dosya indirildi!');
  };

  return (
    <div className={cn(
      "relative flex flex-col border border-border rounded-lg overflow-hidden",
      isFullscreen && "fixed inset-4 z-50 bg-background",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          {language === 'html' ? (
            <Code className="w-4 h-4 text-orange-500" />
          ) : (
            <FileJson className="w-4 h-4 text-blue-500" />
          )}
          <span className="text-sm font-medium uppercase">{language}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto bg-zinc-950">
        <textarea
          value={formattedValue}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          className={cn(
            "w-full h-full min-h-[300px] p-4 font-mono text-sm",
            "bg-transparent text-zinc-100 resize-none outline-none",
            "selection:bg-blue-500/30",
            readOnly && "cursor-default"
          )}
          style={{
            tabSize: 2,
          }}
        />
      </div>

      {/* Line numbers overlay */}
      <div className="absolute left-0 top-[41px] bottom-0 w-10 bg-zinc-900/50 border-r border-zinc-800 pointer-events-none">
        <div className="pt-4 font-mono text-xs text-zinc-600 text-right pr-2">
          {formattedValue.split('\n').map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Preview Component
const PreviewPane: React.FC<{
  type: 'html' | 'iframe';
  content: string;
  title: string;
  className?: string;
}> = ({ type, content, title, className }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);

  const refresh = () => setKey(k => k + 1);

  const iframeSrcDoc = useMemo(() => {
    if (type === 'html') {
      return content;
    }
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: #1a1a1a; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
  }, [type, content]);

  return (
    <div className={cn(
      "relative flex flex-col border border-border rounded-lg overflow-hidden",
      isFullscreen && "fixed inset-4 z-50 bg-background",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">Önizleme: {title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 bg-zinc-950 min-h-[400px]">
        <iframe
          key={key}
          srcDoc={iframeSrcDoc}
          title={title}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

// Password Gate Component
const PasswordGate: React.FC<{
  onUnlock: (password: string) => void;
  error?: string;
  loading?: boolean;
}> = ({ onUnlock, error, loading }) => {
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-6 bg-card border border-border rounded-xl shadow-xl"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-3 rounded-full bg-amber-500/10">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold">Parola Korumalı</h1>
          <p className="text-sm text-muted-foreground">
            Bu içeriğe erişmek için parolayı girin
          </p>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onUnlock(password);
          }}
          className="mt-6 space-y-4"
        >
          <Input
            type="password"
            placeholder="Parola"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Lock className="w-4 h-4 mr-2" />
            )}
            Kilidi Aç
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

// Expired/Error States
const ExpiredState: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md p-6 bg-card border border-border rounded-xl shadow-xl text-center"
    >
      <div className="p-3 rounded-full bg-red-500/10 mx-auto w-fit">
        <Clock className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-xl font-bold mt-4">İçerik Kullanılamıyor</h1>
      <p className="text-sm text-muted-foreground mt-2">{message}</p>
    </motion.div>
  </div>
);

// Main Share Page Component
export default function SharePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params?.token as string;
  
  // UTM params
  const utm = {
    source: searchParams?.get('utm_source'),
    medium: searchParams?.get('utm_medium'),
    campaign: searchParams?.get('utm_campaign'),
    term: searchParams?.get('utm_term'),
    content: searchParams?.get('utm_content'),
  };

  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'json'>('preview');
  const [editorLayout, setEditorLayout] = useState<'split' | 'tabs'>('split');

  // Fetch export data
  const fetchExport = async (password?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = new URL(`/api/share/${token}`, window.location.origin);
      
      // Add UTM params for analytics
      if (utm.source) url.searchParams.set('utm_source', utm.source);
      if (utm.medium) url.searchParams.set('utm_medium', utm.medium);
      if (utm.campaign) url.searchParams.set('utm_campaign', utm.campaign);
      if (utm.term) url.searchParams.set('utm_term', utm.term);
      if (utm.content) url.searchParams.set('utm_content', utm.content);
      if (password) url.searchParams.set('password', password);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 && data.needsPassword) {
          setNeedsPassword(true);
          return;
        }
        if (res.status === 401) {
          setPasswordError('Yanlış parola');
          return;
        }
        throw new Error(data.error || 'Bir hata oluştu');
      }

      setExportData(data.export);
      setNeedsPassword(false);
      setPasswordError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
      setUnlocking(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchExport();
    }
  }, [token]);

  const handlePasswordSubmit = (password: string) => {
    setUnlocking(true);
    setPasswordError(null);
    fetchExport(password);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: exportData?.title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link kopyalandı!');
      }
    } catch {
      // User cancelled or error
    }
  };

  // Loading state
  if (loading && !needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Password required
  if (needsPassword) {
    return (
      <PasswordGate
        onUnlock={handlePasswordSubmit}
        error={passwordError || undefined}
        loading={unlocking}
      />
    );
  }

  // Error state
  if (error) {
    return <ExpiredState message={error} />;
  }

  // No data
  if (!exportData) {
    return <ExpiredState message="İçerik bulunamadı" />;
  }

  const hasHtml = !!exportData.htmlContent;
  const hasJson = !!exportData.jsonContent;
  const showDualEditor = hasHtml && hasJson;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold truncate max-w-[300px]">
              {exportData.title}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
              {exportData.type}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Paylaş
            </Button>
            
            {showDualEditor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditorLayout(l => l === 'split' ? 'tabs' : 'split')}
              >
                {editorLayout === 'split' ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {exportData.viewCount} görüntüleme
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {exportData.downloadCount} indirme
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            {exportData.shareCount} paylaşım
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {new Date(exportData.createdAt).toLocaleDateString('tr-TR')}
          </span>
        </div>

        {/* Editor Layout */}
        {editorLayout === 'split' && showDualEditor ? (
          /* Split View - Side by Side Editors */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Preview + HTML */}
            <div className="space-y-4">
              <PreviewPane
                type="html"
                content={exportData.htmlContent || ''}
                title={exportData.title}
              />
              <CodeEditor
                value={exportData.htmlContent || ''}
                language="html"
                readOnly
              />
            </div>

            {/* Right: JSON + Iframe Embed */}
            <div className="space-y-4">
              <CodeEditor
                value={JSON.stringify(exportData.jsonContent || {}, null, 2)}
                language="json"
                readOnly
              />
              
              {/* Iframe Embed Code */}
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Embed Kodu
                </h3>
                <div className="font-mono text-xs bg-zinc-950 text-zinc-300 p-3 rounded overflow-x-auto">
                  {`<iframe src="${exportData.shareUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `<iframe src="${exportData.shareUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`
                    );
                    toast.success('Embed kodu kopyalandı!');
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Kopyala
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Tab View */
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Önizleme
              </TabsTrigger>
              {hasHtml && (
                <TabsTrigger value="html" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  HTML
                </TabsTrigger>
              )}
              {hasJson && (
                <TabsTrigger value="json" className="flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  JSON
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="preview">
              <PreviewPane
                type={exportData.type === 'iframe' ? 'iframe' : 'html'}
                content={exportData.htmlContent || ''}
                title={exportData.title}
                className="min-h-[600px]"
              />
            </TabsContent>

            {hasHtml && (
              <TabsContent value="html">
                <CodeEditor
                  value={exportData.htmlContent || ''}
                  language="html"
                  readOnly
                  className="min-h-[600px]"
                />
              </TabsContent>
            )}

            {hasJson && (
              <TabsContent value="json">
                <CodeEditor
                  value={JSON.stringify(exportData.jsonContent || {}, null, 2)}
                  language="json"
                  readOnly
                  className="min-h-[600px]"
                />
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Embed Code Section (for tab view) */}
        {editorLayout === 'tabs' && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Embed Kodu
            </h3>
            <div className="font-mono text-xs bg-zinc-950 text-zinc-300 p-3 rounded overflow-x-auto">
              {`<iframe src="${exportData.shareUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                navigator.clipboard.writeText(
                  `<iframe src="${exportData.shareUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`
                );
                toast.success('Embed kodu kopyalandı!');
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              Kopyala
            </Button>
          </div>
        )}

        {/* Description */}
        {exportData.description && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {exportData.description}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            CanvasFlow ile oluşturuldu •{' '}
            <a href="/" className="hover:text-primary">
              tv25.app
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
