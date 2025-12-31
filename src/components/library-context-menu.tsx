import {
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { ContentItem } from "@/lib/initial-content";
import { FilePlus, FolderPlus, Copy, ClipboardPaste, Trash2, List, Play, Info, Share, Scissors, Home, MonitorSmartphone, Move, Library } from "lucide-react";
import { getIconByName, IconName } from "@/lib/icons";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import React, { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
  
type LibraryContextMenuProps = {
    item: ContentItem | null;
    allItems: ContentItem[];
    panelType: 'library' | 'spaces' | 'devices';
    isViewOwnedByUser: boolean;
    onSetClipboard: (items: { item: ContentItem, operation: 'copy' | 'cut' }[]) => void;
    onPaste: () => void;
    clipboard: { item: ContentItem, operation: 'copy' | 'cut' }[];
    onShowInfo: (item: ContentItem | null) => void;
    onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
    onNewFile: () => void;
    onNewFolder: () => void;
    onNewList: () => void;
    onNewPlayer: () => void;
    onNewCalendar: () => void;
    onNewSpace: () => void;
    onNewDevice: () => void;
    onDeleteItem: (id: string) => void;
};


const MiniLibrary = ({ allItems, onSelectFolder }: { allItems: ContentItem[], onSelectFolder: (folderId: string | null) => void }) => {
    
    const renderFolderTree = (items: ContentItem[], parentId: string | null, level: number) => {
        return items
            .filter(item => item.parentId === parentId)
            .map(item => {
                const isFolder = item.type === 'folder' || item.type === 'list' || item.type === 'inventory' || item.type === 'space';
                if (!isFolder) return null;

                const children = allItems.filter(child => child.parentId === item.id);
                const hasSubFolders = children.some(child => child.type === 'folder' || child.type === 'list');
                const Icon = getIconByName(item.icon as IconName | undefined) || FolderPlus;

                if (hasSubFolders) {
                     return (
                        <ContextMenuSub key={item.id}>
                            <ContextMenuSubTrigger inset>
                               <Icon className="mr-2 h-4 w-4" /> {item.title}
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48">
                                <ContextMenuItem onClick={() => onSelectFolder(item.id)}>
                                    <span className="italic pl-6">Bu klasöre taşı</span>
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                {renderFolderTree(allItems, item.id, level + 1)}
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                     )
                }

                return (
                     <ContextMenuItem key={item.id} inset onClick={() => onSelectFolder(item.id)}>
                        <Icon className="mr-2 h-4 w-4" /> {item.title}
                    </ContextMenuItem>
                );
        });
    }

    return (
         <ContextMenuSubContent className="w-56 p-1">
             <ContextMenuItem onClick={() => onSelectFolder(null)}>
                <Library className="mr-2 h-4 w-4" /> Ana Dizine Taşı
            </ContextMenuItem>
            <ContextMenuSeparator />
            {renderFolderTree(allItems, null, 0)}
        </ContextMenuSubContent>
    )
}


export default function LibraryContextMenu({ 
    item, 
    allItems,
    panelType,
    isViewOwnedByUser,
    onSetClipboard,
    onPaste,
    clipboard,
    onShowInfo,
    onUpdateItem,
    onNewFile,
    onNewFolder,
    onNewList,
    onNewPlayer,
    onNewSpace,
    onNewDevice,
    onDeleteItem,
}: LibraryContextMenuProps) {
    const { toast } = useToast();
    
    const handleCut = () => {
        if(item) {
            onSetClipboard([{ item, operation: 'cut' }]);
        }
    };
    
    const handleCopy = () => {
        if(item) {
            onSetClipboard([{ item, operation: 'copy' }]);
        }
    };

    const handleMove = (targetFolderId: string | null) => {
        if (!item) return;
        onUpdateItem(item.id, { parentId: targetFolderId });
        toast({
            title: "Öğe Taşındı",
            description: `"${item.title}" başarıyla taşındı.`
        })
    }

    if (item) {
        const ItemIcon = getIconByName(item.icon as IconName | undefined);
        return (
            <>
                {isViewOwnedByUser && (
                     <ContextMenuSub>
                        <ContextMenuSubTrigger>
                            <Move className="mr-2 h-4 w-4" />
                            <span>Taşı</span>
                        </ContextMenuSubTrigger>
                        <MiniLibrary allItems={allItems} onSelectFolder={handleMove} />
                    </ContextMenuSub>
                )}
                <ContextMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Öğeyi Kopyala</span>
                    <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                </ContextMenuItem>
                {isViewOwnedByUser && (
                    <>
                        <ContextMenuItem onClick={handleCut}>
                            <Scissors className="mr-2 h-4 w-4" />
                            <span>Kes</span>
                            <ContextMenuShortcut>⌘X</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onDeleteItem(item.id)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground" disabled={item.isDeletable === false}>
                             <Trash2 className="mr-2 h-4 w-4" />
                             <span>Sil</span>
                        </ContextMenuItem>
                    </>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => onShowInfo(item)}>
                    <Info className="mr-2 h-4 w-4" />
                    <span>Bilgi / Ayarlar</span>
                </ContextMenuItem>
                 {ItemIcon && (
                    <ContextMenuItem onClick={() => {}}>
                        <ItemIcon className="mr-2 h-4 w-4" />
                        <span>Türü Değiştir</span>
                    </ContextMenuItem>
                 )}
            </>
        );
    }
    
    // Context menu for the canvas background or empty space
    return (
        <>
            {isViewOwnedByUser ? (
                <>
                    {panelType === 'library' && (
                        <>
                            <ContextMenuItem onClick={onNewPlayer}>
                                <Play className="mr-2 h-4 w-4" />
                                <span>Yeni Oynatıcı</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={onNewList}>
                                <List className="mr-2 h-4 w-4" />
                                <span>Yeni Liste</span>
                            </ContextMenuItem>
                            <ContextMenuItem onClick={onNewFolder}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                <span>Yeni Klasör</span>
                            </ContextMenuItem>
                             <ContextMenuItem onClick={onNewFile}>
                                <FilePlus className="mr-2 h-4 w-4" />
                                <span>Yeni Dosya Ekle</span>
                            </ContextMenuItem>
                        </>
                    )}
                    {panelType === 'spaces' && (
                        <>
                            <ContextMenuItem onClick={onNewSpace}>
                                <Home className="mr-2 h-4 w-4" />
                                <span>Yeni Mekan</span>
                            </ContextMenuItem>
                             <ContextMenuItem onClick={onNewFolder}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                <span>Yeni Mekan Klasörü</span>
                            </ContextMenuItem>
                        </>
                    )}
                    {panelType === 'devices' && (
                         <>
                            <ContextMenuItem onClick={onNewDevice}>
                                <MonitorSmartphone className="mr-2 h-4 w-4" />
                                <span>Yeni Eşya Ekle</span>
                            </ContextMenuItem>
                             <ContextMenuItem onClick={onNewFolder}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                <span>Yeni Eşya Grubu</span>
                            </ContextMenuItem>
                        </>
                    )}
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={onPaste} disabled={clipboard.length === 0}>
                        <ClipboardPaste className="mr-2 h-4 w-4" />
                        <span>Yapıştır</span>
                        <ContextMenuShortcut>⌘V</ContextMenuShortcut>
                    </ContextMenuItem>
                </>
            ) : (
                <ContextMenuItem onClick={() => handleCopy()}>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Tüm Listeyi Kopyala</span>
                </ContextMenuItem>
            )}
            
            <ContextMenuSeparator />

            <ContextMenuItem onClick={() => onShowInfo(null)}>
                <Info className="mr-2 h-4 w-4" />
                <span>Panel Bilgisi</span>
            </ContextMenuItem>
        </>
    );
}
