'use client';

import React, { useState } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { 
  MapPin, Home, ChevronLeft, Settings, Plus, Trash2, Edit2, 
  Map, Grid, Package, Box, FileText, Eye, EyeOff 
} from 'lucide-react';
import { getIconByName } from '@/lib/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FloorPlanCamera } from './floor-plan-camera';
import { AISketchModule } from './ai-sketch-module';

const SPACE_TYPES = {
  residential: { label: 'Ev', icon: 'home' },
  commercial: { label: 'Ticari', icon: 'briefcase' },
  storage: { label: 'Depo', icon: 'archive' },
  garage: { label: 'Garaj', icon: 'car' },
  office: { label: 'Ofis', icon: 'laptop' },
  other: { label: 'Diğer', icon: 'box' },
};

export default function SpaceDetailView({
  space,
  allItems,
  onClose,
  onUpdate,
}: {
  space: ContentItem;
  allItems: ContentItem[];
  onClose: () => void;
  onUpdate: (updates: Partial<ContentItem>) => void;
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [floorPlanPreview, setFloorPlanPreview] = useState<string | null>(space.floorPlanUrl || null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSketchOpen, setIsSketchOpen] = useState(false);
  const [editData, setEditData] = useState({
    title: space.title || '',
    address: space.address || '',
    spaceType: space.spaceType || 'residential',
    spaceAbbreviation: space.spaceAbbreviation || '',
    hideAddressInUI: space.hideAddressInUI || false,
    hideSpaceTypeInUI: space.hideSpaceTypeInUI || false,
  });

  const spaceItems = allItems.filter(item => item.assignedSpaceId === space.id);
  const spaceTypeInfo = SPACE_TYPES[editData.spaceType as keyof typeof SPACE_TYPES] || SPACE_TYPES.other;
  const SpaceTypeIcon = getIconByName(spaceTypeInfo.icon) as any;

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleFloorPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFloorPlanPreview(dataUrl);
        onUpdate({ floorPlanUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFloorPlan = () => {
    setFloorPlanPreview(null);
    onUpdate({ floorPlanUrl: undefined });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              {SpaceTypeIcon && <SpaceTypeIcon className="h-5 w-5 text-primary" />}
              <h1 className="text-xl font-bold">{editData.title}</h1>
              {editData.spaceAbbreviation && (
                <Badge variant="secondary">{editData.spaceAbbreviation}</Badge>
              )}
            </div>
            {editData.address && !editData.hideAddressInUI && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {editData.address}
              </div>
            )}
          </div>
        </div>
        <Button 
          variant={isEditing ? "default" : "outline"} 
          size="sm" 
          onClick={() => {
            if (isEditing) handleSave();
            else setIsEditing(!isEditing);
          }}
        >
          {isEditing ? 'Kaydet' : <><Edit2 className="h-4 w-4 mr-2" /> Düzenle</>}
        </Button>
      </div>

      {/* Edit Mode */}
      {isEditing && (
        <div className="border-b p-4 space-y-4 bg-muted/30">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mekan Adı</Label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                placeholder="Örn: Merkez Ev, Ofis"
              />
            </div>
            <div className="space-y-2">
              <Label>Kısaltma</Label>
              <Input
                value={editData.spaceAbbreviation}
                onChange={(e) => setEditData({ ...editData, spaceAbbreviation: e.target.value })}
                placeholder="Örn: ME"
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mekan Tipi</Label>
            <Select value={editData.spaceType} onValueChange={(value: any) => setEditData({ ...editData, spaceType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SPACE_TYPES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Adres</Label>
            <Input
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              placeholder="Mekan adresi"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                id="hideAddress"
                checked={editData.hideAddressInUI}
                onCheckedChange={(checked) => setEditData({ ...editData, hideAddressInUI: !!checked })}
              />
              <Label htmlFor="hideAddress" className="cursor-pointer flex items-center gap-2">
                <EyeOff className="h-4 w-4" /> Adresi Gizle
              </Label>
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                id="hideType"
                checked={editData.hideSpaceTypeInUI}
                onCheckedChange={(checked) => setEditData({ ...editData, hideSpaceTypeInUI: !!checked })}
              />
              <Label htmlFor="hideType" className="cursor-pointer flex items-center gap-2">
                <EyeOff className="h-4 w-4" /> Mekan Tipini Gizle
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
          <TabsTrigger value="profile" className="flex gap-2">
            <FileText className="h-4 w-4" /> Künye
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex gap-2">
            <Map className="h-4 w-4" /> Plan
          </TabsTrigger>
          <TabsTrigger value="items" className="flex gap-2">
            <Package className="h-4 w-4" /> Eşyalar
          </TabsTrigger>
          <TabsTrigger value="containers" className="flex gap-2">
            <Box className="h-4 w-4" /> Konteynerler
          </TabsTrigger>
        </TabsList>

        {/* Künye Tab */}
        <TabsContent value="profile" className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mekan Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Adı</p>
                      <p className="font-semibold">{editData.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kısaltma</p>
                      <p className="font-mono font-semibold">{editData.spaceAbbreviation || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipi</p>
                    <p className="font-semibold">{spaceTypeInfo.label}</p>
                  </div>
                  {editData.address && (
                    <div>
                      <p className="text-sm text-muted-foreground">Adresi</p>
                      <p className="font-semibold">{editData.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Özet</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{spaceItems.length}</p>
                    <p className="text-xs text-muted-foreground">Eşya</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {spaceItems.filter(i => i.type === 'hue-light').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Işık</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {(space.containerInventory || []).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Konteyner</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan" className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Kat Planı</CardTitle>
                  <CardDescription>AI kroki ve kamera desteğiyle plan çiz</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {floorPlanPreview ? (
                    <div className="space-y-2">
                      <div className="border rounded-lg overflow-hidden bg-muted/50">
                        <img 
                          src={floorPlanPreview} 
                          alt="Kat Planı" 
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full"
                        onClick={handleRemoveFloorPlan}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Sil
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg aspect-video flex items-center justify-center bg-muted/50">
                      <div className="text-center">
                        <Grid className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Kat planı henüz yüklenmedi</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG veya PDF</p>
                        <label>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={handleFloorPlanUpload}
                            className="hidden"
                          />
                          <Button className="mt-3" size="sm" asChild>
                            <span>
                              <Plus className="h-4 w-4 mr-2" /> Yükle
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsCameraOpen(true)}
                    >
                      📸 Kamera
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsSketchOpen(true)}
                    >
                      🤖 AI Kroki
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Eşyalar Tab */}
        <TabsContent value="items" className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {spaceItems.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Bu mekanda henüz eşya yok.
                  </CardContent>
                </Card>
              ) : (
                spaceItems.map(item => {
                  const ItemIcon = getIconByName(item.icon) as any;
                  return (
                    <Card key={item.id} className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="py-3 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {ItemIcon && <ItemIcon className="h-5 w-5 text-muted-foreground" />}
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.type}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{item.quantity || 1}x</Badge>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Konteynerler Tab */}
        <TabsContent value="containers" className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {!space.containerInventory || space.containerInventory.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Konteyner yapısı henüz oluşturulmadı.
                    <Button className="mt-4 w-full" size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Konteyner Ekle
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                space.containerInventory.map((container, idx) => (
                  <Card key={container.id}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Box className="h-4 w-4" />
                          <CardTitle className="text-base">{container.name}</CardTitle>
                        </div>
                        <Badge variant="outline">{container.items.length} item</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0 px-4 pb-3">
                      <p className="text-xs text-muted-foreground mb-2">Tür: {container.type}</p>
                      <div className="space-y-1">
                        {container.items.map(itemId => {
                          const item = allItems.find(i => i.id === itemId);
                          return item ? (
                            <p key={itemId} className="text-sm">• {item.title}</p>
                          ) : null;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Camera Modal */}
      <FloorPlanCamera
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          setFloorPlanPreview(dataUrl);
          onUpdate({ floorPlanUrl: dataUrl });
        }}
      />

      {/* AI Sketch Modal */}
      <AISketchModule
        isOpen={isSketchOpen}
        onClose={() => setIsSketchOpen(false)}
        onSave={(dataUrl) => {
          setFloorPlanPreview(dataUrl);
          onUpdate({ floorPlanUrl: dataUrl });
        }}
      />
    </div>
  );
}
