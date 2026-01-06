/**
 * Shared Folder Public Page
 * 
 * URL slug ile paylaşılan klasörleri herkese açık göster
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSharedFolderBySlug, SharedFolder } from '@/lib/slug-utils';
import { trackSharedFolderView } from '@/lib/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Share2, Eye, Calendar, User, ExternalLink, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';

export default function SharedFolderPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { isInitialized } = useAnalytics();

  const [sharedFolder, setSharedFolder] = useState<SharedFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const loadSharedFolder = async () => {
      try {
        setLoading(true);
        setError(null);

        const folder = await getSharedFolderBySlug(slug);

        if (!folder) {
          setError('Bu paylaşım bulunamadı veya süresi dolmuş.');
          return;
        }

        setSharedFolder(folder);

        // Track view
        if (isInitialized) {
          await trackSharedFolderView(slug, folder.folder_id, folder.title);
        }
      } catch (err) {
        console.error('Error loading shared folder:', err);
        setError('Paylaşım yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadSharedFolder();
  }, [slug, isInitialized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Paylaşım yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !sharedFolder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Paylaşım Bulunamadı</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ana Sayfaya Dön
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiresIn = sharedFolder.expires_at
    ? formatDistanceToNow(new Date(sharedFolder.expires_at), { locale: tr, addSuffix: true })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">CanvasFlow</h1>
              <p className="text-xs text-muted-foreground">Paylaşılan Klasör</p>
            </div>
          </div>

          <Link href="/">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              CanvasFlow'u Keşfet
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-6">
          {/* Title Card */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <CardTitle className="text-3xl font-bold">{sharedFolder.title}</CardTitle>
                  {sharedFolder.description && (
                    <CardDescription className="text-base">
                      {sharedFolder.description}
                    </CardDescription>
                  )}
                </div>

                <Badge variant="secondary" className="text-xs">
                  <Eye className="mr-1 h-3 w-3" />
                  {sharedFolder.access_count} görüntülenme
                </Badge>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>Paylaşan: CanvasFlow Kullanıcısı</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(sharedFolder.created_at), {
                      locale: tr,
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {expiresIn && (
                  <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Süresi {expiresIn} doluyor</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Folder Content Preview */}
              <div className="p-6 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-center text-muted-foreground">
                  📁 <strong>{sharedFolder.title}</strong> klasörünün içeriğini görmek için{' '}
                  <Link href="/" className="text-primary hover:underline font-medium">
                    CanvasFlow'a katılın
                  </Link>
                </p>
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <Link href="/" className="flex-1">
                  <Button className="w-full" size="lg">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    CanvasFlow'u Dene
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: sharedFolder.title,
                        text: sharedFolder.description || sharedFolder.title,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link kopyalandı!');
                    }
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Paylaş
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CanvasFlow Nedir?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Web içeriklerini (videolar, resimler, websiteleri) ve widget'ları (saat, notlar,
                  yapılacaklar) dinamik bir dijital tuval üzerinde organize edin.
                </p>
                <p>
                  Grid veya serbest canvas düzenlemelerinde klasörlerinizi yönetin, paylaşın ve
                  keşfedin.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Neden CanvasFlow?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-1.5">
                  <li>✅ Tamamen ücretsiz başlangıç</li>
                  <li>✅ Çoklu sekme desteği</li>
                  <li>✅ Cloud senkronizasyon</li>
                  <li>✅ Yapay zeka asistanı</li>
                  <li>✅ Sosyal paylaşım özellikleri</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24 py-8 bg-background/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} CanvasFlow. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
