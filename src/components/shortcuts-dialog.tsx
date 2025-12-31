
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Keyboard, X } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

type ShortcutAction = 'toggleUI' | 'toggleFullscreen' | 'openSearch' | 'openSettings' | 'openShortcuts';

type Shortcut = {
  action: ShortcutAction;
  name: string;
  defaultShortcut: string;
  customShortcut?: string;
};

const initialShortcuts: Shortcut[] = [
  { action: 'toggleUI', name: 'Arayüzü Gizle/Göster', defaultShortcut: 'Ctrl + .' },
  { action: 'toggleFullscreen', name: 'Tam Ekran', defaultShortcut: 'F11' },
  { action: 'openSearch', name: 'Arama Penceresini Aç', defaultShortcut: 'Ctrl + K' },
  { action: 'openSettings', name: 'Ayarları Aç', defaultShortcut: 'Ctrl + ,' },
  { action: 'openShortcuts', name: 'Kısayolları Görüntüle', defaultShortcut: 'Ctrl + Shift + -' },
];

interface ShortcutsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShortcutsDialog({ isOpen, onOpenChange }: ShortcutsDialogProps) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [editingShortcut, setEditingShortcut] = useState<ShortcutAction | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [newShortcut, setNewShortcut] = useState('');

  useEffect(() => {
    // Load from localStorage on mount
    const savedShortcuts = localStorage.getItem('canvas_shortcuts');
    if (savedShortcuts) {
      setShortcuts(JSON.parse(savedShortcuts));
    } else {
      setShortcuts(initialShortcuts);
    }
  }, []);

  const handleSetShortcut = (action: ShortcutAction, keys: string[]) => {
    const shortcutString = keys.join(' + ');
    const updatedShortcuts = shortcuts.map(sc =>
      sc.action === action ? { ...sc, customShortcut: shortcutString } : sc
    );
    setShortcuts(updatedShortcuts);
    localStorage.setItem('canvas_shortcuts', JSON.stringify(updatedShortcuts));
    setEditingShortcut(null);
    setPopoverOpen(false);
  };
  
  const handleKeyDown = (event: KeyboardEvent) => {
    event.preventDefault();
    const keys: string[] = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        keys.push(event.key.toUpperCase());
    }
    if (editingShortcut && keys.length > 1) {
        handleSetShortcut(editingShortcut, keys);
    }
  };

  useEffect(() => {
    if (popoverOpen) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [popoverOpen, editingShortcut]);
  
  const startEditing = (action: ShortcutAction) => {
    setEditingShortcut(action);
    setPopoverOpen(true);
  };

  const handleResetShortcut = (action: ShortcutAction) => {
     const updatedShortcuts = shortcuts.map(sc =>
      sc.action === action ? { ...sc, customShortcut: undefined } : sc
    );
    setShortcuts(updatedShortcuts);
    localStorage.setItem('canvas_shortcuts', JSON.stringify(updatedShortcuts));
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Keyboard /> Klavye Kısayolları</DialogTitle>
          <DialogDescription>
            Uygulama içi eylemler için klavye kısayollarını görüntüleyin ve özelleştirin.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Eylem</TableHead>
                <TableHead>Atanan Kısayol</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shortcuts.map((shortcut) => (
                <TableRow key={shortcut.action}>
                  <TableCell className="font-medium">{shortcut.name}</TableCell>
                  <TableCell>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      {shortcut.customShortcut || shortcut.defaultShortcut}
                    </kbd>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {shortcut.customShortcut && (
                         <Button variant="ghost" size="sm" onClick={() => handleResetShortcut(shortcut.action)}>Sıfırla</Button>
                    )}
                    <Popover open={popoverOpen && editingShortcut === shortcut.action} onOpenChange={(open) => { if (!open) { setPopoverOpen(false); setEditingShortcut(null); } }}>
                         <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => startEditing(shortcut.action)}>Değiştir</Button>
                         </PopoverTrigger>
                         <PopoverContent className="w-auto p-4">
                            <div className="text-center">
                                <p className="text-sm font-medium">Yeni kısayol tuşlarına basın...</p>
                                <p className="text-xs text-muted-foreground">(Esc ile iptal)</p>
                            </div>
                         </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
