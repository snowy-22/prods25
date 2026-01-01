"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Lightbulb, CheckCircle2, Clock, Kanban, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_ORDER = ['fikir', 'analiz', 'aksiyon', 'tamam'] as const;
type KaizenStatus = (typeof STATUS_ORDER)[number];

type KaizenItem = {
  id: string;
  title: string;
  owner: string;
  status: KaizenStatus;
  impact: 'düşük' | 'orta' | 'yüksek';
};

const INITIAL_ITEMS: KaizenItem[] = [
  { id: 'kz-1', title: 'Makine setup süresini SMED ile %20 kısalt', owner: 'Ece', status: 'analiz', impact: 'yüksek' },
  { id: 'kz-2', title: 'Hat içi malzeme akışını U-hat yapısına çevir', owner: 'Mert', status: 'aksiyon', impact: 'orta' },
  { id: 'kz-3', title: 'Görsel iş talimatlarını QR ile dijitalleştir', owner: 'Deniz', status: 'fikir', impact: 'orta' },
  { id: 'kz-4', title: 'Hata önleme için poka-yoke switch ekle', owner: 'Sena', status: 'tamam', impact: 'yüksek' },
];

const statusBadgeVariant: Record<KaizenStatus, 'outline' | 'secondary' | 'default'> = {
  fikir: 'outline',
  analiz: 'secondary',
  aksiyon: 'default',
  tamam: 'default',
};

export default function KaizenPlatformWidget() {
  const [items, setItems] = useState<KaizenItem[]>(INITIAL_ITEMS);
  const [newIdea, setNewIdea] = useState('');

  const stats = useMemo(() => ({
    fikir: items.filter((i) => i.status === 'fikir').length,
    analiz: items.filter((i) => i.status === 'analiz').length,
    aksiyon: items.filter((i) => i.status === 'aksiyon').length,
    tamam: items.filter((i) => i.status === 'tamam').length,
  }), [items]);

  const pushIdea = () => {
    if (!newIdea.trim()) return;
    setItems((prev) => [
      { id: `kz-${Date.now()}`, title: newIdea.trim(), owner: 'Sen', status: 'fikir', impact: 'orta' },
      ...prev,
    ]);
    setNewIdea('');
  };

  const advance = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextIndex = (STATUS_ORDER.indexOf(item.status) + 1) % STATUS_ORDER.length;
        return { ...item, status: STATUS_ORDER[nextIndex] };
      })
    );
  };

  return (
    <Card className="h-full w-full">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Kanban className="w-5 h-5 text-primary" />
            <CardTitle>Kaizen Platformu</CardTitle>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3" />{stats.fikir} Fikir</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{stats.analiz} Analiz</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{stats.aksiyon} Aksiyon</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{stats.tamam} Tamam</span>
          </div>
        </div>
        <CardDescription>Fikir → Analiz → Aksiyon → Tamam akışı</CardDescription>
        <div className="flex gap-2">
          <Input
            placeholder="Yeni kaizen fikri..."
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pushIdea()}
          />
          <Button onClick={pushIdea} variant="default">Ekle</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeVariant[item.status]} className="capitalize text-[11px]">
                    {item.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{item.impact} etki</Badge>
                </div>
                <p className="text-sm font-medium leading-snug">{item.title}</p>
                <p className="text-xs text-muted-foreground">Sorumlu: {item.owner}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => advance(item.id)}>
                Sonraki adım
              </Button>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {STATUS_ORDER.map((s, idx) => (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      idx <= STATUS_ORDER.indexOf(item.status) ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                  <span className={cn(idx <= STATUS_ORDER.indexOf(item.status) ? 'text-foreground' : '')}>{s}</span>
                  {idx < STATUS_ORDER.length - 1 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
