'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, DollarSign } from 'lucide-react';

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingTitle?: string;
  sellingPrice: number;
  onSubmit: (offer: {
    listingId: string;
    offerPrice: number;
    message?: string;
  }) => void;
}

export function OfferDialog({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  sellingPrice,
  onSubmit,
}: OfferDialogProps) {
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const offerAmount = offerPrice ? parseInt(offerPrice) : 0;
  const discount = sellingPrice > 0 ? Math.round(((sellingPrice - offerAmount) / sellingPrice) * 100) : 0;

  const handleSubmit = async () => {
    if (!offerPrice || offerAmount <= 0) {
      alert('Geçerli bir teklif fiyatı girin');
      return;
    }

    if (offerAmount >= sellingPrice) {
      alert('Teklif fiyatı satış fiyatından az olmalıdır');
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit({
        listingId,
        offerPrice: offerAmount,
        message: message || undefined,
      });

      // Reset form
      setOfferPrice('');
      setMessage('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Teklif Ver</DialogTitle>
          <DialogDescription>
            {listingTitle && <span className="line-clamp-1">{listingTitle}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selling Price Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-gray-600">Satış Fiyatı</p>
            <p className="text-2xl font-bold text-blue-600">
              ${(sellingPrice / 100).toFixed(2)}
            </p>
          </div>

          {/* Offer Price Input */}
          <div>
            <label className="text-sm font-semibold block mb-2">Teklif Fiyatı</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                placeholder="0.00"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="pl-8"
              />
            </div>

            {offerAmount > 0 && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">İndirim:</span>
                <Badge variant={discount > 0 ? 'default' : 'secondary'}>
                  {discount > 0 ? `%${discount} düşük` : 'Daha pahalı'}
                </Badge>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-semibold block mb-2">Mesaj (Opsiyonel)</label>
            <Textarea
              placeholder="Teklifinizi desteklemek için birkaç kelime yazın..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none h-20"
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/200</p>
          </div>

          {/* Warning */}
          {offerAmount > 0 && discount <= 0 && (
            <div className="flex gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Teklifiniz satış fiyatına eşit veya daha yüksek. Satıcı bunu kabul etme olasılığı düşüktür.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!offerPrice || offerAmount <= 0 || offerAmount >= sellingPrice || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Teklifi Gönder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
