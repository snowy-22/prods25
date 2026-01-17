

'use client';

import React, { useState } from 'react';
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Home, X, Plus, Settings, UserPlus, Shield, MonitorSmartphone, ChevronRight, MoreVertical, Edit, Trash2, FolderOpen } from "lucide-react";
import { ContentItem } from "@/lib/initial-content";
import { getIconByName } from "@/lib/icons";
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import SpaceDetailView from './space-detail-view';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const SpaceCard = ({ space, allItems, onSelect, onDelete }: { space: ContentItem, allItems: ContentItem[], onSelect: () => void, onDelete?: () => void }) => {
    const Icon = getIconByName(space.icon) as any;
    const [isDropZoneActive, setIsDropZoneActive] = React.useState(false);
    
    const assignedItems = allItems.filter(item => item.assignedSpaceId === space.id);
    const deviceCount = assignedItems.length;
    const spaceTypeLabel = space.spaceType || 'other';

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDropZoneActive(true);
    };

    const handleDragLeave = () => {
        setIsDropZoneActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDropZoneActive(false);
        const data = e.dataTransfer.getData('application/json');
        if (data) {
            try {
                const droppedItem = JSON.parse(data);
                // Update item to assign to this space
                console.log(`Item "${droppedItem.title}" assigned to space "${space.title}"`);
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Drop failed:', err);
                }
            }
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        // Dropdown menu will handle this
    };

    return (
        <div 
            className={`border rounded-lg overflow-hidden transition-all ${
                isDropZoneActive 
                    ? 'bg-primary/10 border-primary/50 ring-2 ring-primary/30' 
                    : 'bg-card/50 hover:bg-card/80'
            }`}
            onContextMenu={handleContextMenu}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="p-3 flex items-center justify-between bg-muted/50 border-b cursor-pointer hover:bg-muted transition-colors" onClick={onSelect}>
                <div className="flex items-center gap-3 flex-1">
                    {Icon && <Icon className="h-5 w-5 text-primary" />}
                    <div>
                        <h3 className="font-semibold text-foreground">{space.title}</h3>
                        {space.spaceAbbreviation && !space.hideSpaceTypeInUI && (
                            <p className="text-xs text-muted-foreground">{space.spaceAbbreviation}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                                <FolderOpen className="h-4 w-4 mr-2" />
                                Aç
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Sil
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="p-3 space-y-2">
                 <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                    <span>DURUM</span>
                    <Badge variant={deviceCount > 0 ? "default" : "secondary"} className="font-mono text-xs">
                        {deviceCount > 0 ? "AKTİF" : "PASİF"}
                    </Badge>
                </div>
                <div className='space-y-1 pt-2 max-h-20 overflow-y-auto'>
                    {assignedItems.slice(0, 3).map(device => {
                        const DeviceIcon = getIconByName(device.icon) as any;
                        return (
                            <div key={device.id} className="flex items-center justify-between p-1 rounded text-xs hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                    {DeviceIcon && <DeviceIcon className="h-3 w-3 text-muted-foreground" />}
                                    <span>{device.title}</span>
                                </div>
                                <div className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></div>
                            </div>
                        )
                    })}
                    {assignedItems.length > 3 && (
                        <p className="text-xs text-muted-foreground px-1">+{assignedItems.length - 3} daha...</p>
                    )}
                </div>
            </div>
        </div>
    )
}



export default function SpacesPanel({ 
    onClose,
    spaces,
    allItems,
    onAddNewSpace,
    onUpdateSpace,
    onDeleteSpace,
}: { 
    onClose: () => void,
    spaces: ContentItem[],
    allItems: ContentItem[],
    onAddNewSpace: () => void,
    onUpdateSpace?: (spaceId: string, updates: Partial<ContentItem>) => void,
    onDeleteSpace?: (spaceId: string) => void,
}) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const selectedSpace = spaces.find(s => s.id === selectedSpaceId);

  if (selectedSpace) {
    return (
      <div className="w-[500px] border-l bg-card flex flex-col h-full">
        <SpaceDetailView
          space={selectedSpace}
          allItems={allItems}
          onClose={() => setSelectedSpaceId(null)}
          onUpdate={(updates) => {
            if (onUpdateSpace) onUpdateSpace(selectedSpace.id, updates);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-[350px] border-l bg-card flex-shrink-0 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2 font-mono">
                <Home />
                MEKAN KONTROL
            </h2>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onAddNewSpace}><Plus className="h-4 w-4"/></Button>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4"/></Button>
            </div>
        </div>
        <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
                {spaces.map(space => (
                    <SpaceCard 
                        key={space.id} 
                        space={space} 
                        allItems={allItems} 
                        onSelect={() => setSelectedSpaceId(space.id)} 
                        onDelete={() => onDeleteSpace?.(space.id)}
                    />
                ))}
            </div>
        </ScrollArea>
    </div>
  );
}
