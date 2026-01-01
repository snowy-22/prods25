"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock3, ListChecks, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

type Sprint = {
  id: string;
  name: string;
  range: string;
  focus: string;
  status: 'hazırlık' | 'aktif' | 'tamam';
  items: { title: string; owner: string; status: 'todo' | 'doing' | 'done' }[];
};

const SPRINTS: Sprint[] = [
  {
    id: 'sprint-18',
    name: 'Sprint 18',
    range: '06 - 17 Ocak',
    focus: 'Auth yenileme + widget rollout',
    status: 'aktif',
    items: [
      { title: 'Supabase oturum yenileme', owner: 'Buse', status: 'doing' },
      { title: 'Widget kütüphanesi arama', owner: 'Kaan', status: 'todo' },
      { title: 'AI rehber iyileştirmeleri', owner: 'Deniz', status: 'done' },
    ],
  },
  {
    id: 'sprint-19',
    name: 'Sprint 19',
    range: '20 - 31 Ocak',
    focus: 'Mobil performans + offline',
    status: 'hazırlık',
    items: [
      { title: 'Canvas offline cache', owner: 'Ege', status: 'todo' },
      { title: 'Animasyon optimizasyonu', owner: 'Selin', status: 'todo' },
      { title: 'QA regression paketi', owner: 'Berke', status: 'todo' },
    ],
  },
];

const statusColor: Record<Sprint['status'], string> = {
  hazırlık: 'bg-amber-100 text-amber-800 border-amber-200',
  aktif: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  tamam: 'bg-slate-100 text-slate-800 border-slate-200',
};

export default function AgileCalendarWidget() {
  return (
    <Card className="h-full w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <CardTitle>Agile Takvimi & Program</CardTitle>
          </div>
          <Button size="sm" variant="outline" className="gap-2">
            <Play className="w-4 h-4" /> Planı Aç
          </Button>
        </div>
        <CardDescription>Sprint aralığı, odak ve görev durumu</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {SPRINTS.map((sprint) => (
          <div key={sprint.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('capitalize border', statusColor[sprint.status])}>
                    {sprint.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{sprint.range}</span>
                </div>
                <p className="font-semibold leading-snug">{sprint.name}</p>
                <p className="text-sm text-muted-foreground">{sprint.focus}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1 justify-end"><Clock3 className="w-3 h-3" /> 2 hafta</div>
                <div className="flex items-center gap-1 justify-end"><ListChecks className="w-3 h-3" /> {sprint.items.filter(i => i.status === 'done').length}/{sprint.items.length} tamam</div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {sprint.items.map((item) => (
                <div key={item.title} className="flex items-center justify-between rounded-md border px-2 py-1.5 bg-muted/40">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', item.status === 'done' ? 'bg-emerald-500' : item.status === 'doing' ? 'bg-amber-500' : 'bg-slate-400')} />
                    <span className="text-sm">{item.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.owner}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
