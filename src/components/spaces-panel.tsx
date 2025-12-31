

'use client';

import React from 'react';
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Home, X, Plus, Settings, UserPlus, Shield, MonitorSmartphone } from "lucide-react";
import { ContentItem } from "@/lib/initial-content";
import { getIconByName } from "@/lib/icons";
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

const SpaceCard = ({ space, allItems }: { space: ContentItem, allItems: ContentItem[] }) => {
    const Icon = getIconByName(space.icon) as any;
    
    const assignedItems = allItems.filter(item => item.assignedSpaceId === space.id);
    const deviceCount = assignedItems.length;

    return (
        <div className="border bg-card/50 rounded-lg overflow-hidden">
            <div className="p-3 flex items-center justify-between bg-muted/50 border-b">
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-primary" />}
                    <h3 className="font-semibold text-foreground">{space.title}</h3>
                </div>
                <Badge variant={deviceCount > 0 ? "default" : "secondary"} className="font-mono text-xs">
                    {deviceCount > 0 ? "AKTİF" : "PASİF"}
                </Badge>
            </div>
            <div className="p-3 space-y-2">
                 <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                    <span>CİHAZ DURUMU</span>
                    <span>{deviceCount} CİHAZ BAĞLI</span>
                </div>
                <div className='space-y-1 pt-2'>
                    {assignedItems.map(device => {
                        const DeviceIcon = getIconByName(device.icon) as any;
                        return (
                            <div key={device.id} className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                    {DeviceIcon && <DeviceIcon className="h-4 w-4 text-muted-foreground" />}
                                    <span className="text-sm">{device.title}</span>
                                </div>
                                <div className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <Separator />
            <div className="p-2 flex justify-end gap-1">
                <Button variant="ghost" size="sm"><MonitorSmartphone className="mr-2 h-4 w-4"/> Cihaz Ekle</Button>
                <Button variant="ghost" size="sm"><UserPlus className="mr-2 h-4 w-4"/> Kişi Ekle</Button>
                <Button variant="ghost" size="sm"><Settings className="mr-2 h-4 w-4"/> Yönet</Button>
                <Button variant="ghost" size="sm"><Shield className="mr-2 h-4 w-4"/> İzinler</Button>
            </div>
        </div>
    )
}


export default function SpacesPanel({ 
    onClose,
    spaces,
    allItems,
    onAddNewSpace,
}: { 
    onClose: () => void,
    spaces: ContentItem[],
    allItems: ContentItem[],
    onAddNewSpace: () => void,
}) {
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
                    <SpaceCard key={space.id} space={space} allItems={allItems} />
                ))}
            </div>
        </ScrollArea>
    </div>
  );
}
