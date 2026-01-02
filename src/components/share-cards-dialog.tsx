/**
 * Custom Share Cards
 * Paylaşım ve dışa aktarım için özel kart şablonları
 */

'use client';

import React, { useState } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ShareCardTemplate = 'minimal' | 'detailed' | 'social' | 'portfolio' | 'spotify' | 'custom';

export interface ShareCard {
  id: string;
  template: ShareCardTemplate;
  title: string;
  description: string;
  thumbnail?: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  showMetadata: boolean;
  showStats: boolean;
}

interface ShareCardsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  items: ContentItem[];
}

const CARD_TEMPLATES = {
  minimal: {
    name: 'Minimal',
    description: 'Sadece başlık ve görüntü',
    bgColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#3b82f6',
  },
  detailed: {
    name: 'Detaylı',
    description: 'Açıklama ve metadata ile',
    bgColor: '#f9fafb',
    textColor: '#1f2937',
    accentColor: '#6366f1',
  },
  social: {
    name: 'Sosyal Medya',
    description: 'Share ready, kare format',
    bgColor: '#1f2937',
    textColor: '#ffffff',
    accentColor: '#ec4899',
  },
  portfolio: {
    name: 'Portfolio',
    description: 'Profesyonel görünüm',
    bgColor: '#ffffff',
    textColor: '#374151',
    accentColor: '#059669',
  },
  spotify: {
    name: 'Spotify',
    description: 'Spotify tarzı stil',
    bgColor: '#191414',
    textColor: '#ffffff',
    accentColor: '#1DB954',
  },
  custom: {
    name: 'Özel',
    description: 'Tamamen özelleştirilebilir',
    bgColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#f59e0b',
  },
};

export function ShareCardsDialog({
  isOpen,
  onOpenChange,
  items,
}: ShareCardsDialogProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<ShareCardTemplate>('detailed');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customCard, setCustomCard] = useState<ShareCard>({
    id: `card-${Date.now()}`,
    template: 'custom',
    title: 'Başlık',
    description: 'Açıklama',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#3b82f6',
    showMetadata: true,
    showStats: true,
  });

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const generateShareCard = (item: ContentItem, template: ShareCardTemplate) => {
    const templateStyle = CARD_TEMPLATES[template];
    return {
      ...customCard,
      id: `${item.id}-card`,
      template,
      title: item.title || 'Untitled',
      description: (item as any).description || '',
      thumbnail: item.icon,
      backgroundColor: templateStyle.bgColor,
      textColor: templateStyle.textColor,
      accentColor: templateStyle.accentColor,
    };
  };

  const exportAsHTML = () => {
    if (selectedItems.length === 0) {
      toast({ title: 'Lütfen en az bir öğe seçin' });
      return;
    }

    const selectedContent = items.filter((item) => selectedItems.includes(item.id));
    const cards = selectedContent.map((item) =>
      generateShareCard(item, selectedTemplate)
    );

    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paylaşım Kartları</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .title {
      text-align: center;
      color: #1f2937;
      margin-bottom: 40px;
      font-size: 2.5em;
      font-weight: 700;
    }
    
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }
    
    .share-card {
      border-radius: 12px;
      padding: 24px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .share-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 16px rgba(0, 0, 0, 0.15);
    }
    
    .card-title {
      font-size: 1.5em;
      font-weight: 700;
      margin-bottom: 12px;
    }
    
    .card-description {
      font-size: 0.95em;
      line-height: 1.6;
      margin-bottom: 16px;
      opacity: 0.9;
    }
    
    .card-meta {
      font-size: 0.85em;
      opacity: 0.7;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid currentColor;
    }
    
    @media (max-width: 768px) {
      .cards-grid {
        grid-template-columns: 1fr;
      }
      
      .title {
        font-size: 1.8em;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">CanvasFlow Paylaşım Kartları</h1>
    <div class="cards-grid">
      ${cards
        .map(
          (card) => `
      <div class="share-card" style="
        background-color: ${card.backgroundColor};
        color: ${card.textColor};
        border: 2px solid ${card.accentColor};
      ">
        <div class="card-title" style="color: ${card.accentColor}">
          ${card.title}
        </div>
        <div class="card-description">
          ${card.description}
        </div>
        ${
          card.showMetadata
            ? `
        <div class="card-meta">
          <strong>Tür:</strong> ${card.template === 'custom' ? 'Özel' : CARD_TEMPLATES[card.template].name}
        </div>
        `
            : ''
        }
      </div>
      `
        )
        .join('')}
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `share-cards-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'HTML başarıyla dışa aktarıldı' });
  };

  const exportAsJSON = () => {
    if (selectedItems.length === 0) {
      toast({ title: 'Lütfen en az bir öğe seçin' });
      return;
    }

    const selectedContent = items.filter((item) => selectedItems.includes(item.id));
    const cards = selectedContent.map((item) =>
      generateShareCard(item, selectedTemplate)
    );

    const json = {
      exportDate: new Date().toISOString(),
      template: selectedTemplate,
      cards,
      metadata: {
        cardCount: cards.length,
        itemCount: selectedContent.length,
      },
    };

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `share-cards-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'JSON başarıyla dışa aktarıldı' });
  };

  const copyPreviewHTML = () => {
    const selectedContent = items.filter((item) => selectedItems.includes(item.id));
    if (selectedContent.length === 0) {
      toast({ title: 'Lütfen en az bir öğe seçin' });
      return;
    }

    const cards = selectedContent.map((item) =>
      generateShareCard(item, selectedTemplate)
    );

    const html = cards
      .map(
        (card) => `
<div style="
  background-color: ${card.backgroundColor};
  color: ${card.textColor};
  border: 2px solid ${card.accentColor};
  border-radius: 12px;
  padding: 24px;
">
  <h3 style="color: ${card.accentColor}; font-size: 1.5em; margin-bottom: 12px;">
    ${card.title}
  </h3>
  <p style="margin-bottom: 12px; line-height: 1.6;">
    ${card.description}
  </p>
</div>
`
      )
      .join('\n');

    navigator.clipboard.writeText(html);
    toast({ title: 'HTML panoya kopyalandı' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paylaşım Kartları</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="template" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template">Şablon Seç</TabsTrigger>
            <TabsTrigger value="items">Öğeleri Seç</TabsTrigger>
            <TabsTrigger value="export">Dışa Aktar</TabsTrigger>
          </TabsList>

          {/* Template Selection */}
          <TabsContent value="template" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {(Object.entries(CARD_TEMPLATES) as Array<[ShareCardTemplate, any]>).map(
                ([key, template]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedTemplate(key)}
                    className={cn(
                      'cursor-pointer rounded-lg p-4 transition-all border-2',
                      selectedTemplate === key
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div
                      className="w-full h-32 rounded-lg mb-3"
                      style={{
                        backgroundColor: template.bgColor,
                        color: template.textColor,
                        borderLeft: `4px solid ${template.accentColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                      }}
                    >
                      <div className="text-center">
                        <p className="font-semibold">{template.name}</p>
                        <p className="text-xs opacity-70">{template.description}</p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </TabsContent>

          {/* Item Selection */}
          <TabsContent value="items" className="space-y-4">
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-gray-500 text-sm">Hiç öğe yok</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300"
                  >
                    <input
                      type="checkbox"
                      id={`item-${item.id}`}
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="rounded"
                    />
                    <label
                      htmlFor={`item-${item.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-medium">{item.title || 'Untitled'}</p>
                      <p className="text-xs text-gray-500">{item.type}</p>
                    </label>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500">
              Seçilen: {selectedItems.length}/{items.length}
            </p>
          </TabsContent>

          {/* Export */}
          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                onClick={exportAsHTML}
                disabled={selectedItems.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                HTML İndir
              </Button>
              <Button
                onClick={exportAsJSON}
                disabled={selectedItems.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                JSON İndir
              </Button>
              <Button
                onClick={copyPreviewHTML}
                disabled={selectedItems.length === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                HTML Kopyala
              </Button>
            </div>

            {selectedItems.length > 0 && (
              <div className="mt-6 space-y-2">
                <Label>Önizleme</Label>
                <div className="rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
                  {items
                    .filter((item) => selectedItems.includes(item.id))
                    .map((item) => {
                      const card = generateShareCard(item, selectedTemplate);
                      return (
                        <div
                          key={card.id}
                          className="mb-4 p-4 rounded-lg"
                          style={{
                            backgroundColor: card.backgroundColor,
                            color: card.textColor,
                            borderLeft: `4px solid ${card.accentColor}`,
                          }}
                        >
                          <p className="font-semibold text-sm">{card.title}</p>
                          <p className="text-xs opacity-75 mt-1">{card.description}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
