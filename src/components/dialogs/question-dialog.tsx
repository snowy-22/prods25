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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingTitle?: string;
  sellerName?: string;
  onSubmit: (question: {
    listingId: string;
    category: string;
    content: string;
    isPublic: boolean;
  }) => void;
}

const QUESTION_CATEGORIES = [
  { value: 'condition', label: 'Durumu Hakkında' },
  { value: 'specifications', label: 'Özellikleri Hakkında' },
  { value: 'shipping', label: 'Kargo Hakkında' },
  { value: 'returns', label: 'İade Hakkında' },
  { value: 'payment', label: 'Ödeme Hakkında' },
  { value: 'other', label: 'Diğer' },
];

export function QuestionDialog({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  sellerName,
  onSubmit,
}: QuestionDialogProps) {
  const [category, setCategory] = useState('condition');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('Lütfen sorunuzu yazın');
      return;
    }

    if (content.length < 10) {
      alert('Sorunuz en az 10 karakter olmalı');
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit({
        listingId,
        category,
        content: content.trim(),
        isPublic,
      });

      // Reset form
      setCategory('condition');
      setContent('');
      setIsPublic(true);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Soru Sor</DialogTitle>
          <DialogDescription>
            {listingTitle && (
              <div className="mt-2">
                <p className="line-clamp-1 font-semibold text-gray-900">{listingTitle}</p>
                {sellerName && <p className="text-sm text-gray-600">{sellerName}</p>}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category */}
          <div>
            <label className="text-sm font-semibold block mb-2">Soru Kategorisi</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question Content */}
          <div>
            <label className="text-sm font-semibold block mb-2">Sorabilir misin?</label>
            <Textarea
              placeholder="Burada detaylı ve temiz bir soru yazın..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none h-32"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
              <span>Minimum 10 karakter</span>
              <span>{content.length}/1000</span>
            </div>
          </div>

          {/* Public/Private */}
          <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
            <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-600" />
            <div className="flex-1">
              <label className="text-sm font-semibold block mb-1">Sorunuzu Kimlerin Göreceği</label>
              <select
                value={isPublic ? 'public' : 'private'}
                onChange={(e) => setIsPublic(e.target.value === 'public')}
                className="w-full text-sm border rounded px-2 py-1 bg-white"
              >
                <option value="public">
                  Herkese Açık - Başkalarının cevapları görebilir
                </option>
                <option value="private">
                  Sadece Satıcıya - Yalnızca satıcı görebilir
                </option>
              </select>
            </div>
          </div>

          {/* Info */}
          <div className="flex gap-2 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Satıcı sorunuza 24 saat içinde cevap vermeye çalışacaktır.</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || content.length < 10 || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Soruyu Gönder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
