/**
 * Canvas Link Sharing Toolbar
 * Canvas'ta link paylaşımı odaklı araç
 */

'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Share2,
  Link,
  Copy,
  Download,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  QrCode,
} from 'lucide-react';

interface CanvasShareToolbarProps {
  canvasTitle?: string;
  canvasUrl?: string;
  onExportHTML?: () => void;
  onExportJSON?: () => void;
}

export function CanvasShareToolbar({
  canvasTitle = 'CanvasFlow',
  canvasUrl = typeof window !== 'undefined' ? window.location.href : '',
  onExportHTML,
  onExportJSON,
}: CanvasShareToolbarProps) {
  const { toast } = useToast();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [shareMessage, setShareMessage] = useState(
    `${canvasTitle} - ${canvasUrl}`
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Panoya kopyalandı' });
  };

  const generateQRCode = async () => {
    // Basit QR code URL (üretim için qrserver veya benzer kullanabilirsiniz)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      canvasUrl
    )}`;
    return qrUrl;
  };

  const shareOnSocial = (platform: string) => {
    const platforms: { [key: string]: string } = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(canvasUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canvasUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canvasUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(canvasTitle)}&body=${encodeURIComponent(shareMessage)}`,
    };

    if (platforms[platform]) {
      window.open(platforms[platform], '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Paylaş
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Link & Copy */}
          <DropdownMenuItem onClick={() => setShowLinkDialog(true)}>
            <Link className="h-4 w-4 mr-2" />
            <span>Bağlantı Paylaş</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => copyToClipboard(canvasUrl)}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4 mr-2" />
            <span>URL Kopyala</span>
          </DropdownMenuItem>

          {/* QR Code */}
          <DropdownMenuItem onClick={() => setShowQRDialog(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            <span>QR Kod</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Social Media */}
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-gray-500 mb-1">Sosyal Medya</p>
          </div>

          <DropdownMenuItem onClick={() => shareOnSocial('twitter')}>
            <Twitter className="h-4 w-4 mr-2" />
            <span>Twitter'da Paylaş</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => shareOnSocial('facebook')}>
            <Facebook className="h-4 w-4 mr-2" />
            <span>Facebook'ta Paylaş</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => shareOnSocial('linkedin')}>
            <Linkedin className="h-4 w-4 mr-2" />
            <span>LinkedIn'de Paylaş</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => shareOnSocial('email')}>
            <Mail className="h-4 w-4 mr-2" />
            <span>E-posta ile Paylaş</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Export */}
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-gray-500 mb-1">Dışa Aktar</p>
          </div>

          {onExportHTML && (
            <DropdownMenuItem onClick={onExportHTML}>
              <Download className="h-4 w-4 mr-2" />
              <span>HTML İndir</span>
            </DropdownMenuItem>
          )}

          {onExportJSON && (
            <DropdownMenuItem onClick={onExportJSON}>
              <Download className="h-4 w-4 mr-2" />
              <span>JSON İndir</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bağlantı Paylaş</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* URL */}
            <div className="space-y-2">
              <Label>Bağlantı</Label>
              <div className="flex gap-2">
                <Input value={canvasUrl} readOnly className="flex-1" />
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(canvasUrl)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Share Message */}
            <div className="space-y-2">
              <Label>Paylaşım Mesajı</Label>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm resize-none"
                rows={3}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(shareMessage)}
                className="w-full flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Mesajı Kopyala
              </Button>
            </div>

            {/* Social Quick Share */}
            <div className="space-y-2">
              <Label>Sosyal Medyada Paylaş</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => shareOnSocial('twitter')}
                  className="flex items-center gap-2"
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => shareOnSocial('facebook')}
                  className="flex items-center gap-2"
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => shareOnSocial('linkedin')}
                  className="flex items-center gap-2"
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => shareOnSocial('email')}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Kod</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                canvasUrl
              )}`}
              alt="QR Code"
              className="rounded-lg border-2 border-gray-200"
            />
            <Button
              onClick={() => {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  canvasUrl
                )}`;
                const a = document.createElement('a');
                a.href = qrUrl;
                a.download = `qr-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast({ title: 'QR kod indirildi' });
              }}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              İndir
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Bu QR kodu tarayarak canvas'a hızlı erişim sağlayabilirsiniz
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
