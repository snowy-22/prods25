'use client';

import { useState, useCallback } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Wand2,
  Layout,
  Type,
  Palette,
  Box,
  Move,
  Sparkles,
  Copy,
  Download,
  Code,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewportEditorProps {
  item: ContentItem | null;
  onUpdateItem: (updates: Partial<ContentItem>) => void;
  onClose: () => void;
}

type ResponsiveMode = 'desktop' | 'tablet' | 'mobile';

export function ViewportEditor({ item, onUpdateItem, onClose }: ViewportEditorProps) {
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveMode>('desktop');
  const [showCode, setShowCode] = useState(false);

  const handleStyleUpdate = useCallback((key: string, value: any) => {
    if (!item) return;
    
    const currentStyles = item.styles || {};
    onUpdateItem({
      styles: {
        ...currentStyles,
        [key]: value,
      },
    });
  }, [item, onUpdateItem]);

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div className="space-y-3">
          <Wand2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Düzenlemek için bir element seçin
          </p>
        </div>
      </div>
    );
  }

  const styles = item.styles || {};

  const generateCSS = () => {
    const cssLines: string[] = [];
    Object.entries(styles).forEach(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      cssLines.push(`  ${cssKey}: ${value};`);
    });
    return `.${item.type} {\n${cssLines.join('\n')}\n}`;
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Viewport Editor</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCode(!showCode)}
            >
              <Code className="h-4 w-4 mr-1.5" />
              {showCode ? 'Editör' : 'Kod'}
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Responsive Mode Selector */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={responsiveMode === 'desktop' ? 'default' : 'outline'}
            onClick={() => setResponsiveMode('desktop')}
            className="flex-1"
          >
            <Monitor className="h-4 w-4 mr-1.5" />
            Desktop
          </Button>
          <Button
            size="sm"
            variant={responsiveMode === 'tablet' ? 'default' : 'outline'}
            onClick={() => setResponsiveMode('tablet')}
            className="flex-1"
          >
            <Tablet className="h-4 w-4 mr-1.5" />
            Tablet
          </Button>
          <Button
            size="sm"
            variant={responsiveMode === 'mobile' ? 'default' : 'outline'}
            onClick={() => setResponsiveMode('mobile')}
            className="flex-1"
          >
            <Smartphone className="h-4 w-4 mr-1.5" />
            Mobile
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {showCode ? (
          <div className="p-4">
            <div className="bg-muted rounded-lg p-4">
              <pre className="text-xs font-mono">
                <code>{generateCSS()}</code>
              </pre>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-1.5" />
                Kopyala
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-1.5" />
                İndir
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="layout" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mx-4 mb-4">
              <TabsTrigger value="layout">
                <Layout className="h-4 w-4 mr-1.5" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="style">
                <Palette className="h-4 w-4 mr-1.5" />
                Style
              </TabsTrigger>
              <TabsTrigger value="spacing">
                <Box className="h-4 w-4 mr-1.5" />
                Spacing
              </TabsTrigger>
              <TabsTrigger value="effects">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Effects
              </TabsTrigger>
            </TabsList>

            <div className="px-4 pb-4">
              <TabsContent value="layout" className="mt-0 space-y-4">
                <Accordion type="multiple" defaultValue={['display', 'dimensions']} className="w-full">
                  <AccordionItem value="display">
                    <AccordionTrigger className="text-sm">Display & Position</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Display</Label>
                        <Select
                          value={styles.display || 'block'}
                          onValueChange={(value) => handleStyleUpdate('display', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="block">Block</SelectItem>
                            <SelectItem value="flex">Flex</SelectItem>
                            <SelectItem value="grid">Grid</SelectItem>
                            <SelectItem value="inline-block">Inline Block</SelectItem>
                            <SelectItem value="inline-flex">Inline Flex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Select
                          value={styles.position || 'relative'}
                          onValueChange={(value) => handleStyleUpdate('position', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="static">Static</SelectItem>
                            <SelectItem value="relative">Relative</SelectItem>
                            <SelectItem value="absolute">Absolute</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="sticky">Sticky</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(styles.display === 'flex' || styles.display === 'inline-flex') && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <Label>Flex Direction</Label>
                            <Select
                              value={styles.flexDirection || 'row'}
                              onValueChange={(value) => handleStyleUpdate('flexDirection', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="row">Row</SelectItem>
                                <SelectItem value="column">Column</SelectItem>
                                <SelectItem value="row-reverse">Row Reverse</SelectItem>
                                <SelectItem value="column-reverse">Column Reverse</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Justify Content</Label>
                            <Select
                              value={styles.justifyContent || 'flex-start'}
                              onValueChange={(value) => handleStyleUpdate('justifyContent', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="flex-start">Start</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="flex-end">End</SelectItem>
                                <SelectItem value="space-between">Space Between</SelectItem>
                                <SelectItem value="space-around">Space Around</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Align Items</Label>
                            <Select
                              value={styles.alignItems || 'stretch'}
                              onValueChange={(value) => handleStyleUpdate('alignItems', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="flex-start">Start</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="flex-end">End</SelectItem>
                                <SelectItem value="stretch">Stretch</SelectItem>
                                <SelectItem value="baseline">Baseline</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Gap: {styles.gap || '0px'}</Label>
                            <Input
                              type="text"
                              value={styles.gap || '0px'}
                              onChange={(e) => handleStyleUpdate('gap', e.target.value)}
                              placeholder="e.g. 16px, 1rem"
                            />
                          </div>
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="dimensions">
                    <AccordionTrigger className="text-sm">Dimensions</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Width</Label>
                          <Input
                            type="text"
                            value={styles.width || 'auto'}
                            onChange={(e) => handleStyleUpdate('width', e.target.value)}
                            placeholder="auto, 100%, 500px"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Height</Label>
                          <Input
                            type="text"
                            value={styles.height || 'auto'}
                            onChange={(e) => handleStyleUpdate('height', e.target.value)}
                            placeholder="auto, 100%, 500px"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Min Width</Label>
                          <Input
                            type="text"
                            value={styles.minWidth || ''}
                            onChange={(e) => handleStyleUpdate('minWidth', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Min Height</Label>
                          <Input
                            type="text"
                            value={styles.minHeight || ''}
                            onChange={(e) => handleStyleUpdate('minHeight', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Max Width</Label>
                          <Input
                            type="text"
                            value={styles.maxWidth || ''}
                            onChange={(e) => handleStyleUpdate('maxWidth', e.target.value)}
                            placeholder="none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Height</Label>
                          <Input
                            type="text"
                            value={styles.maxHeight || ''}
                            onChange={(e) => handleStyleUpdate('maxHeight', e.target.value)}
                            placeholder="none"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="style" className="mt-0 space-y-4">
                <Accordion type="multiple" defaultValue={['colors', 'typography']} className="w-full">
                  <AccordionItem value="colors">
                    <AccordionTrigger className="text-sm">Colors</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Background</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={styles.backgroundColor || '#ffffff'}
                            onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                            className="w-16 h-9"
                          />
                          <Input
                            type="text"
                            value={styles.backgroundColor || '#ffffff'}
                            onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={styles.color || '#000000'}
                            onChange={(e) => handleStyleUpdate('color', e.target.value)}
                            className="w-16 h-9"
                          />
                          <Input
                            type="text"
                            value={styles.color || '#000000'}
                            onChange={(e) => handleStyleUpdate('color', e.target.value)}
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Opacity: {((parseFloat(styles.opacity as string || '1')) * 100).toFixed(0)}%</Label>
                        <Slider
                          value={[parseFloat(styles.opacity as string || '1') * 100]}
                          onValueChange={([value]) => handleStyleUpdate('opacity', (value / 100).toString())}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="typography">
                    <AccordionTrigger className="text-sm">Typography</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Font Size</Label>
                        <Input
                          type="text"
                          value={styles.fontSize || '14px'}
                          onChange={(e) => handleStyleUpdate('fontSize', e.target.value)}
                          placeholder="14px, 1rem"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Font Weight</Label>
                        <Select
                          value={styles.fontWeight?.toString() || '400'}
                          onValueChange={(value) => handleStyleUpdate('fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">Thin (100)</SelectItem>
                            <SelectItem value="300">Light (300)</SelectItem>
                            <SelectItem value="400">Normal (400)</SelectItem>
                            <SelectItem value="500">Medium (500)</SelectItem>
                            <SelectItem value="600">Semibold (600)</SelectItem>
                            <SelectItem value="700">Bold (700)</SelectItem>
                            <SelectItem value="900">Black (900)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Line Height</Label>
                        <Input
                          type="text"
                          value={styles.lineHeight || '1.5'}
                          onChange={(e) => handleStyleUpdate('lineHeight', e.target.value)}
                          placeholder="1.5, 24px"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Text Align</Label>
                        <Select
                          value={styles.textAlign || 'left'}
                          onValueChange={(value) => handleStyleUpdate('textAlign', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="justify">Justify</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="borders">
                    <AccordionTrigger className="text-sm">Borders</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Border Width</Label>
                        <Input
                          type="text"
                          value={styles.borderWidth || '0px'}
                          onChange={(e) => handleStyleUpdate('borderWidth', e.target.value)}
                          placeholder="1px, 2px"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Border Style</Label>
                        <Select
                          value={styles.borderStyle || 'solid'}
                          onValueChange={(value) => handleStyleUpdate('borderStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="dashed">Dashed</SelectItem>
                            <SelectItem value="dotted">Dotted</SelectItem>
                            <SelectItem value="double">Double</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Border Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={styles.borderColor || '#000000'}
                            onChange={(e) => handleStyleUpdate('borderColor', e.target.value)}
                            className="w-16 h-9"
                          />
                          <Input
                            type="text"
                            value={styles.borderColor || '#000000'}
                            onChange={(e) => handleStyleUpdate('borderColor', e.target.value)}
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Border Radius</Label>
                        <Input
                          type="text"
                          value={styles.borderRadius || '0px'}
                          onChange={(e) => handleStyleUpdate('borderRadius', e.target.value)}
                          placeholder="4px, 50%"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="spacing" className="mt-0 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Padding</Label>
                    <Input
                      type="text"
                      value={styles.padding || '0px'}
                      onChange={(e) => handleStyleUpdate('padding', e.target.value)}
                      placeholder="16px, 1rem 2rem"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Margin</Label>
                    <Input
                      type="text"
                      value={styles.margin || '0px'}
                      onChange={(e) => handleStyleUpdate('margin', e.target.value)}
                      placeholder="16px, 1rem 2rem"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="effects" className="mt-0 space-y-4">
                <Accordion type="multiple" defaultValue={['shadow']} className="w-full">
                  <AccordionItem value="shadow">
                    <AccordionTrigger className="text-sm">Shadow</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Box Shadow</Label>
                        <Input
                          type="text"
                          value={styles.boxShadow || 'none'}
                          onChange={(e) => handleStyleUpdate('boxShadow', e.target.value)}
                          placeholder="0 4px 6px rgba(0,0,0,0.1)"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="transform">
                    <AccordionTrigger className="text-sm">Transform</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Transform</Label>
                        <Input
                          type="text"
                          value={styles.transform || 'none'}
                          onChange={(e) => handleStyleUpdate('transform', e.target.value)}
                          placeholder="rotate(45deg), scale(1.5)"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </ScrollArea>
    </div>
  );
}
