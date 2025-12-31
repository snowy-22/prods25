'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContentItem } from '@/lib/initial-content';
import { Bookmark, FolderPlus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SaveDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: ContentItem | null;
  savedItemsFolders: ContentItem[];
  onSaveToFolder: (itemId: string, folderId: string) => void;
  onCreateFolder: (folderName: string) => void;
}

export default function SaveDialog({ 
  isOpen, 
  onOpenChange, 
  item, 
  savedItemsFolders,
  onSaveToFolder,
  onCreateFolder
}: SaveDialogProps) {
  const { toast } = useToast();
  const [selectedFolderId, setSelectedFolderId] = useState<string>('saved-items');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Son seçilen klasörü hatırla (localStorage)
  useEffect(() => {
    const lastFolderId = localStorage.getItem('lastSavedFolderId');
    if (lastFolderId && savedItemsFolders.some(f => f.id === lastFolderId)) {
      setSelectedFolderId(lastFolderId);
    }
  }, [savedItemsFolders]);

  const handleSave = () => {
    if (!item) return;
    
    onSaveToFolder(item.id, selectedFolderId);
    localStorage.setItem('lastSavedFolderId', selectedFolderId);
    
    // Başarı animasyonu
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onOpenChange(false);
    }, 2000);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Klasör adı boş olamaz' });
      return;
    }
    
    onCreateFolder(newFolderName);
    setNewFolderName('');
    setIsCreatingFolder(false);
    
    toast({ title: 'Klasör Oluşturuldu', description: `"${newFolderName}" klasörü kaydedilenler altına eklendi.` });
  };

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange} modal>
        <DialogContent className="sm:max-w-md z-[100] flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Check className="h-12 w-12 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Kaydedildi!</DialogTitle>
          <DialogDescription className="text-center">
            "{item?.title}" kaydedilenlere eklendi.
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Kaydet: {item?.title}
          </DialogTitle>
          <DialogDescription>
            Bu öğeyi kaydedilenler klasörüne ekleyin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isCreatingFolder ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="folder-select">Klasör Seçin</Label>
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                  <SelectTrigger id="folder-select">
                    <SelectValue placeholder="Klasör seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saved-items">📚 Kaydedilenlerim</SelectItem>
                    {savedItemsFolders
                      .filter(f => f.type === 'folder' && f.parentId === 'saved-items')
                      .map(folder => (
                        <SelectItem key={folder.id} value={folder.id}>
                          📁 {folder.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsCreatingFolder(true)}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Yeni Klasör Oluştur
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Yeni Klasör Adı</Label>
                <Input
                  id="folder-name"
                  placeholder="Klasör adı girin..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setIsCreatingFolder(false);
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateFolder} className="flex-1">
                  Oluştur
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                >
                  İptal
                </Button>
              </div>
            </div>
          )}
        </div>

        {!isCreatingFolder && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              <Bookmark className="mr-2 h-4 w-4" />
              Kaydet
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
