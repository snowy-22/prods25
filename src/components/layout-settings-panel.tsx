

'use client';
import {
  ContentItem,
  CanvasDraft,
} from '@/lib/initial-content';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { X, LayoutGrid, Save, Trash2, Home, Lock, Unlock } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';


export default function LayoutSettingsPanel({
  activeView,
  onClose,
  onUpdate,
  drafts,
  onSaveDraft,
  onDeleteDraft,
}: {
  activeView: ContentItem;
  onClose: () => void;
  onUpdate: (updates: Partial<ContentItem>) => void;
  drafts: CanvasDraft[];
  onSaveDraft: (name: string) => void;
  onDeleteDraft: (id: string) => void;
}) {

    const handleLayoutModeChange = (value: 'grid' | 'studio' | 'presentation' | 'stream' | 'free' | 'carousel') => {
    if (value) {
      onUpdate({ layoutMode: value });
    }
  };
  
  const layoutMode = activeView.layoutMode || 'grid';
  const isLayoutLocked = activeView.lockedLayoutMode || false;
  

  return (
    <div className="w-full h-full bg-card border-l flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <LayoutGrid />
                Düzen Ayarları
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4"/></Button>
        </div>
        <ScrollArea className="flex-1 min-h-0">
            <Accordion type="multiple" defaultValue={['layout', 'templates']} className="w-full">
                <AccordionItem value="layout" className='px-4'>
                    <AccordionTrigger className="py-3 text-sm font-medium">
                        <div className='flex items-center gap-2'>
                            <LayoutGrid className='h-4 w-4'/> <span>Tuval Modu</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Düzen Modu</Label>
                            <Select value={layoutMode} onValueChange={handleLayoutModeChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Düzen modu seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="grid">Izgara (Grid)</SelectItem>
                                    <SelectItem value="carousel">Karusel (Carousel)</SelectItem>
                                    <SelectItem value="free">Serbest (Freeform)</SelectItem>
                                    <SelectItem value="studio">Stüdyo (Dock)</SelectItem>
                                    <SelectItem value="presentation">Sunum (Odak)</SelectItem>
                                    <SelectItem value="stream">Akış (Şerit)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label className="flex items-center gap-2">
                                    {isLayoutLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                    Düzen Modunu Kilitle
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {isLayoutLocked 
                                        ? 'İzleyiciler layout modunu değiştiremez' 
                                        : 'İzleyiciler layout modunu değiştirebilir'}
                                </p>
                            </div>
                            <Switch
                                checked={isLayoutLocked}
                                onCheckedChange={(checked) => onUpdate({ lockedLayoutMode: checked })}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="templates" className='px-4 border-b-0'>
                    <AccordionTrigger className="py-3 text-sm font-medium">
                        <div className='flex items-center gap-2'>
                            <Save className='h-4 w-4'/> <span>Şablonlar</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-2">
                        <Button variant="outline" className="w-full" onClick={() => {
                            const name = prompt('Şablon adı girin:');
                            if (name) onSaveDraft(name);
                        }}>
                            <Save className="mr-2 h-4 w-4" /> Mevcut Düzeni Kaydet
                        </Button>
                        <div className="space-y-1">
                            {drafts.map(draft => (
                                <div key={draft.id} className="flex items-center justify-between gap-2 p-1 rounded-md hover:bg-muted">
                                    <span className="text-sm font-medium">{draft.name}</span>
                                    <div className='flex'>
                                        <Button variant="ghost" size="sm" onClick={() => onUpdate(draft.layout)}>Uygula</Button>
                                        <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => onDeleteDraft(draft.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </ScrollArea>
    </div>
  );
}
