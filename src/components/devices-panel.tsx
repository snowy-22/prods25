

'use client';

import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { MonitorSmartphone, X, Plus, Link as LinkIcon, Settings, Network, QrCode, TextCursorInput } from "lucide-react";
import { ContentItem } from "@/lib/initial-content";
import { getIconByName, IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "./ui/context-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import Image from "next/image";

const AddDeviceMenu = ({ sessionId }: { sessionId: string }) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`tv25:remote?session=${sessionId}`)}`;
    return (
        <PopoverContent className="w-80 p-0 bg-popover/80 backdrop-blur-lg border-border/50">
            <Tabs defaultValue="list">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="list">Mevcut</TabsTrigger>
                    <TabsTrigger value="new">Yeni Ekle</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="p-2">
                    <p className="text-sm text-muted-foreground p-4 text-center">Mevcut cihaz listesi burada yer alacak.</p>
                </TabsContent>
                <TabsContent value="new" className="p-2">
                    <Tabs defaultValue="network" orientation="vertical" className="h-full flex">
                        <TabsList className="flex flex-col h-auto">
                            <TabsTrigger value="network"><Network className="h-4 w-4"/></TabsTrigger>
                            <TabsTrigger value="url"><LinkIcon className="h-4 w-4"/></TabsTrigger>
                            <TabsTrigger value="id"><TextCursorInput className="h-4 w-4"/></TabsTrigger>
                            <TabsTrigger value="qr"><QrCode className="h-4 w-4"/></TabsTrigger>
                        </TabsList>
                        <TabsContent value="network" className="mt-0 p-2 space-y-2 flex-1">
                            <h4 className="font-semibold">Ağdaki Cihazlar</h4>
                            <p className="text-xs text-muted-foreground">Ağdaki yayınlanabilir cihazlar taranıyor...</p>
                            <Button className="w-full">Tara</Button>
                        </TabsContent>
                         <TabsContent value="url" className="mt-0 p-2 space-y-2 flex-1">
                            <h4 className="font-semibold">URL/IP ile Ekle</h4>
                            <Input placeholder="http://192.168.1.10:8080"/>
                            <Button className="w-full">Ekle</Button>
                        </TabsContent>
                        <TabsContent value="id" className="mt-0 p-2 space-y-2 flex-1">
                             <h4 className="font-semibold">Oturum ID ile Ekle</h4>
                            <Input placeholder="Oturum ID..."/>
                            <Button className="w-full">Ekle</Button>
                        </TabsContent>
                         <TabsContent value="qr" className="mt-0 p-2 space-y-2 text-center flex-1">
                            <h4 className="font-semibold">QR Kod ile Cihaz Ekle</h4>
                            <p className="text-xs text-muted-foreground">Eklenecek cihazda bu QR kodu okutun.</p>
                            <div className="p-1 bg-white rounded-md inline-block mt-2">
                                <Image src={qrCodeUrl} alt="Session QR Code" width={150} height={150} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
            </Tabs>
        </PopoverContent>
    );
};


export default function DevicesPanel({ 
    onClose,
    devices,
    activeDeviceId,
    onDeviceClick,
    onAddNewDevice,
    onShowInfo,
    sessionId,
}: { 
    onClose: () => void,
    devices: ContentItem[],
    activeDeviceId: string | null,
    onDeviceClick: (id: string) => void,
    onAddNewDevice: () => void,
    onShowInfo: (item: ContentItem) => void;
    sessionId: string;
}) {
  const [isDropZoneActive, setIsDropZoneActive] = React.useState(false);

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
              console.log(`Item "${droppedItem.title}" linked to devices panel`);
          } catch (err) {
              if (process.env.NODE_ENV === 'development') {
                  console.error('Drop failed:', err);
              }
          }
      }
  };

  return (
    <div className="w-[350px] border-l bg-card flex-shrink-0 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <MonitorSmartphone />
                Eşyalarım
            </h2>
             <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                         <Button variant="ghost" size="icon"><Plus className="h-4 w-4"/></Button>
                    </PopoverTrigger>
                    <AddDeviceMenu sessionId={sessionId} />
                </Popover>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4"/></Button>
            </div>
        </div>
        <ScrollArea className={`flex-1 transition-colors ${isDropZoneActive ? 'bg-primary/5' : ''}`}>
            <div 
                className="p-2 space-y-1"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {devices.map(device => {
                    const Icon = getIconByName(device.icon as IconName | undefined) || MonitorSmartphone;
                    const isActive = device.id === activeDeviceId;
                    return (
                        <ContextMenu key={device.id}>
                            <ContextMenuTrigger>
                                <div
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2",
                                        isActive ? "bg-primary/10 border-primary" : "bg-muted/50 border-transparent hover:border-muted-foreground/20"
                                    )}
                                    onClick={() => onDeviceClick(device.id)}
                                >
                                    <Icon className="h-6 w-6 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="font-semibold">{device.title}</p>
                                        <p className="text-xs text-muted-foreground">{device.deviceInfo?.os || 'Bilinmeyen İşletim Sistemi'} / {device.deviceInfo?.browser}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {device.isCurrentDevice && <Badge variant="secondary">Bu Cihaz</Badge>}
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <LinkIcon className="h-3 w-3 text-green-500"/>
                                            <span>Bağlandı</span>
                                        </div>
                                    </div>
                                </div>
                            </ContextMenuTrigger>
                             <ContextMenuContent>
                                <ContextMenuItem onClick={() => onShowInfo(device)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Ayarlar
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>

                    )
                })}
            </div>
        </ScrollArea>
    </div>
  );
}
