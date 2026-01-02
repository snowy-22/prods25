'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import { MacroDefinition, MacroAction, MacroActionType } from '@/lib/initial-content';
import {
  Plus, Trash2, Edit, Play, Pause, Volume2, VolumeX, SkipForward, Maximize, Code, Globe,
  FileText, Copy, Trash, Search, Zap, ScreenShare, Clock, Settings, ChevronDown, ChevronUp, Edit3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MacroEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  macroId?: string;
}

type MacroActionTypeOption = MacroActionType;

const ACTION_TYPES: { value: MacroActionTypeOption; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'navigate', label: 'Gezinti', icon: <Globe className="w-4 h-4" />, description: 'Başka öğeye git' },
  { value: 'play', label: 'Oynat', icon: <Play className="w-4 h-4" />, description: 'Oynatıcı başlat' },
  { value: 'pause', label: 'Duraklat', icon: <Pause className="w-4 h-4" />, description: 'Oynatıcı duraklat' },
  { value: 'mute', label: 'Sessize Al', icon: <VolumeX className="w-4 h-4" />, description: 'Sesi kapat' },
  { value: 'volume', label: 'Ses Seviyesi', icon: <Volume2 className="w-4 h-4" />, description: 'Ses seviyesini ayarla' },
  { value: 'speed', label: 'Hız', icon: <Settings className="w-4 h-4" />, description: 'Oynatma hızını ayarla' },
  { value: 'skip', label: 'Atla', icon: <SkipForward className="w-4 h-4" />, description: 'Sonraki öğeye git' },
  { value: 'fullscreen', label: 'Tam Ekran', icon: <Maximize className="w-4 h-4" />, description: 'Tam ekran modunu aç/kapat' },
  { value: 'layout', label: 'Düzen', icon: <Settings className="w-4 h-4" />, description: 'Düzeni değiştir' },
  { value: 'theme', label: 'Tema', icon: <Settings className="w-4 h-4" />, description: 'Temayı değiştir' },
  { value: 'execute-script', label: 'Script Çalıştır', icon: <Code className="w-4 h-4" />, description: 'Özel kod çalıştır' },
  { value: 'open-url', label: 'URL Aç', icon: <Globe className="w-4 h-4" />, description: 'Web sayfası aç' },
  { value: 'create-item', label: 'Öğe Oluştur', icon: <Plus className="w-4 h-4" />, description: 'Yeni öğe ekle' },
  { value: 'delete-item', label: 'Öğe Sil', icon: <Trash className="w-4 h-4" />, description: 'Öğeyi sil' },
  { value: 'copy-item', label: 'Öğeyi Kopyala', icon: <Copy className="w-4 h-4" />, description: 'Öğeyi panoya kopyala' },
  { value: 'paste-item', label: 'Öğeyi Yapıştır', icon: <FileText className="w-4 h-4" />, description: 'Öğeyi yapıştır' },
  { value: 'search', label: 'Ara', icon: <Search className="w-4 h-4" />, description: 'Arama paneli aç' },
  { value: 'ai-chat', label: 'AI Sohbet', icon: <Zap className="w-4 h-4" />, description: 'AI sohbet aç' },
  { value: 'screenshot', label: 'Ekran Görüntüsü', icon: <ScreenShare className="w-4 h-4" />, description: 'Ekran görüntüsü al' },
  { value: 'wait', label: 'Bekle', icon: <Clock className="w-4 h-4" />, description: 'Belirli süre bekle' },
];

function ActionEditor({ action, index, onUpdate, onRemove }: {
  action: MacroAction;
  index: number;
  onUpdate: (updatedAction: MacroAction) => void;
  onRemove: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const actionType = ACTION_TYPES.find(a => a.value === action.type);

  return (
    <div className="border rounded-lg bg-card">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs font-semibold text-muted-foreground min-w-6">{index + 1}</span>
          <div className="flex items-center gap-2">
            {actionType?.icon}
            <span className="text-sm font-medium">{actionType?.label}</span>
          </div>
          {action.delay && (
            <Badge variant="outline" className="text-xs">
              +{action.delay}ms
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t space-y-4">
          {/* Action Type Selector */}
          <div className="space-y-2">
            <Label className="text-xs">Eylem Türü</Label>
            <Select value={action.type} onValueChange={(type) => onUpdate({ ...action, type: type as MacroActionType })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {ACTION_TYPES.map(act => (
                  <SelectItem key={act.value} value={act.value}>
                    <div className="flex items-center gap-2">
                      {act.icon}
                      {act.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action-specific Parameters */}
          {action.type === 'volume' && (
            <div className="space-y-2">
              <Label className="text-xs">Ses Seviyesi (0-100)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[action.parameters?.level || 50]}
                  onValueChange={(value) => onUpdate({
                    ...action,
                    parameters: { ...action.parameters, level: value[0] }
                  })}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium min-w-12">{action.parameters?.level || 50}%</span>
              </div>
            </div>
          )}

          {action.type === 'speed' && (
            <div className="space-y-2">
              <Label className="text-xs">Oynatma Hızı (0.5-2.0)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[(action.parameters?.speed || 1) * 10]}
                  onValueChange={(value) => onUpdate({
                    ...action,
                    parameters: { ...action.parameters, speed: value[0] / 10 }
                  })}
                  min={5}
                  max={20}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium min-w-12">{((action.parameters?.speed || 1)).toFixed(1)}x</span>
              </div>
            </div>
          )}

          {action.type === 'navigate' && (
            <div className="space-y-2">
              <Label className="text-xs">Öğe ID</Label>
              <Input
                placeholder="Öğe ID girin..."
                value={action.parameters?.itemId || ''}
                onChange={(e) => onUpdate({
                  ...action,
                  parameters: { ...action.parameters, itemId: e.target.value }
                })}
                className="h-8 text-xs"
              />
            </div>
          )}

          {action.type === 'open-url' && (
            <div className="space-y-2">
              <Label className="text-xs">URL</Label>
              <Input
                placeholder="https://example.com"
                value={action.parameters?.url || ''}
                onChange={(e) => onUpdate({
                  ...action,
                  parameters: { ...action.parameters, url: e.target.value }
                })}
                className="h-8 text-xs"
              />
            </div>
          )}

          {action.type === 'execute-script' && (
            <div className="space-y-2">
              <Label className="text-xs">JavaScript Kodu</Label>
              <Textarea
                placeholder="console.log('Merhaba');"
                value={action.parameters?.code || ''}
                onChange={(e) => onUpdate({
                  ...action,
                  parameters: { ...action.parameters, code: e.target.value }
                })}
                className="text-xs font-mono min-h-20"
              />
            </div>
          )}

          {action.type === 'wait' && (
            <div className="space-y-2">
              <Label className="text-xs">Bekleme Süresi (ms)</Label>
              <Input
                type="number"
                placeholder="1000"
                value={action.parameters?.duration || 1000}
                onChange={(e) => onUpdate({
                  ...action,
                  parameters: { ...action.parameters, duration: parseInt(e.target.value) || 1000 }
                })}
                className="h-8 text-xs"
              />
            </div>
          )}

          {action.type === 'layout' && (
            <div className="space-y-2">
              <Label className="text-xs">Düzen Türü</Label>
              <Select value={action.parameters?.layoutType || 'grid'} onValueChange={(type) => onUpdate({
                ...action,
                parameters: { ...action.parameters, layoutType: type }
              })}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="canvas">Canvas</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Sonraki eyleme kadar gecikme (ms)</Label>
            <Input
              type="number"
              placeholder="0"
              value={action.delay || 0}
              onChange={(e) => onUpdate({
                ...action,
                delay: parseInt(e.target.value) || 0
              })}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-7 text-xs">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eylemi Sil?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Eylem dizisinden kaldırılacak.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemove} className="bg-destructive hover:bg-destructive/90">
                    Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}

export function MacroEditorDialog({ isOpen, onOpenChange, macroId }: MacroEditorProps) {
  const { macros, updateMacro, executeMacro } = useAppStore();
  const { toast } = useToast();

  const macro = macroId ? macros.find(m => m.id === macroId) : null;
  const [name, setName] = useState(macro?.name || 'Yeni Makro');
  const [description, setDescription] = useState(macro?.description || '');
  const [color, setColor] = useState(macro?.color || '#3b82f6');
  const [icon, setIcon] = useState(macro?.icon || 'zap');
  const [actions, setActions] = useState<MacroAction[]>(macro?.actions || []);
  const [isTesting, setIsTesting] = useState(false);

  const handleAddAction = () => {
    const newAction: MacroAction = {
      type: 'play',
      parameters: {},
      delay: 0,
    };
    setActions([...actions, newAction]);
  };

  const handleUpdateAction = (index: number, updatedAction: MacroAction) => {
    const newActions = [...actions];
    newActions[index] = updatedAction;
    setActions(newActions);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
    toast({ title: 'Eylem Silindi' });
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: 'Hata', description: 'Makro adı gerekli', variant: 'destructive' });
      return;
    }

    if (macro && macroId) {
      updateMacro(macroId, {
        name,
        description,
        color,
        icon,
        actions,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Makro Güncellendi', description: `${name} başarıyla kaydedildi` });
    }
    onOpenChange(false);
  };

  const handleTest = async () => {
    if (!macro) {
      toast({ title: 'Hata', description: 'Makro kaydedilmesi gerekiyor', variant: 'destructive' });
      return;
    }

    setIsTesting(true);
    try {
      await executeMacro(macro.id);
      toast({ title: 'Test Tamamlandı', description: `${name} başarıyla çalıştırıldı` });
    } catch (error) {
      toast({ title: 'Test Hatası', description: 'Makro çalıştırılırken hata oluştu', variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Makro Editörü
          </DialogTitle>
          <DialogDescription>
            Makro adını, açıklamasını ve eylem dizisini yapılandırın
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="pr-4 space-y-6">
            {/* Macro Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Makro Bilgileri
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="macro-name" className="text-xs">Makro Adı</Label>
                  <Input
                    id="macro-name"
                    placeholder="Makro adını girin..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="macro-color" className="text-xs">Renk</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="macro-color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-12 rounded cursor-pointer border"
                    />
                    <span className="text-xs text-muted-foreground font-mono">{color}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="macro-desc" className="text-xs">Açıklama</Label>
                <Textarea
                  id="macro-desc"
                  placeholder="Makro ne yapar? Açıklayın..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs min-h-16"
                />
              </div>
            </div>

            {/* Actions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Eylem Dizisi ({actions.length})
                </h3>
                <Button
                  size="sm"
                  onClick={handleAddAction}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Eylem Ekle
                </Button>
              </div>

              {actions.length > 0 ? (
                <div className="space-y-2">
                  {actions.map((action, index) => (
                    <ActionEditor
                      key={index}
                      action={action}
                      index={index}
                      onUpdate={(updated) => handleUpdateAction(index, updated)}
                      onRemove={() => handleRemoveAction(index)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                  <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Henüz eylem eklenmemiş</p>
                  <p className="text-xs mt-1">Makroya otomatik eylem eklemek için "Eylem Ekle" butonunu kullanın</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          {macro && actions.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleTest}
              disabled={isTesting}
              className="h-9 text-xs"
            >
              <Play className="w-4 h-4 mr-1" />
              {isTesting ? 'Test Ediliyor...' : 'Test Et'}
            </Button>
          )}
          <Button onClick={handleSave} className="h-9 text-xs">
            <Zap className="w-4 h-4 mr-1" />
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
