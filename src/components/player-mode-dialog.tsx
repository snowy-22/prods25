'use client';

import { 
  LayoutGrid, 
  Grid3x3, 
  Move3d,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from 'react';
import { useAppStore } from '@/lib/store';

export type PlayerMode = 'grid' | 'canvas';

interface PlayerModeOption {
  id: PlayerMode;
  title: string;
  description: string;
  icon: any;
}

const modes: PlayerModeOption[] = [
  {
    id: 'grid',
    title: 'Izgara Modu',
    description: 'Duyarlı ızgara düzeninde organize edilmiş içerik. Otomatik akış ve kaydırma desteği.',
    icon: LayoutGrid
  },
  {
    id: 'canvas',
    title: 'Tuval Modu',
    description: 'Sınırsız 2D canvas alanında özgür konumlandırma. Hizalama, mesafe ölçümleri ve flow chart dinamikleri.',
    icon: Move3d
  }
];

export function PlayerModeDialog() {
  const { layoutMode, setLayoutMode } = useAppStore();
  const [open, setOpen] = useState(false);

  const handleSelect = (modeId: PlayerMode) => {
    setLayoutMode(modeId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Modu: {modes.find(m => m.id === layoutMode)?.title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Görüntüleme Modu Seçin</DialogTitle>
          <DialogDescription>
            İçeriğin nasıl görüntüleneceğini ve organize edileceğini belirleyen düzeni seçin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleSelect(mode.id)}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all hover:bg-accent",
                layoutMode === mode.id ? "border-primary bg-accent" : "border-transparent bg-card"
              )}
            >
              <div className={cn(
                "p-2 rounded-md",
                layoutMode === mode.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <mode.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{mode.title}</h4>
                  {layoutMode === mode.id && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode.description}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Kapat</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
