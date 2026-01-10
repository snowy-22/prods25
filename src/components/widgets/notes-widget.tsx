'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Palette, CaseSensitive, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ContentItem } from '@/lib/initial-content';
import { useDebounce } from 'react-use';
import { WidgetSize, DEFAULT_WIDGET_SIZE, getWidgetSizeConfig, getWidgetFeatureFlags } from '@/lib/widget-sizes';
import { ToolkitWidgetWrapper } from '@/components/toolkit-widget-wrapper';

/**
 * Notes Widget - ENHANCED
 * 
 * ✅ 5 Responsive Sizes (XS, S, M, L, XL)
 * ✅ Toolkit Library UI Consistency
 * ✅ Size-dependent toolbar (XS: no toolbar, S: basic, M+: full)
 * ✅ Responsive text editor with proper scaling
 */
type NotesWidgetProps = {
    item: ContentItem;
    onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
    size?: WidgetSize;
    showWrapper?: boolean;
    onSizeChange?: (size: WidgetSize) => void;
};

export default function NotesWidget({ 
  item, 
  onUpdateItem, 
  size = DEFAULT_WIDGET_SIZE,
  showWrapper = true,
  onSizeChange
}: NotesWidgetProps) {
  const [content, setContent] = useState(item.content || '');
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(content === 'Notlarınızı buraya yazın...' || content === '');
  const editorRef = useRef<HTMLDivElement>(null);
  const sizeConfig = getWidgetSizeConfig(size);
  const features = getWidgetFeatureFlags(size);

  useDebounce(() => {
      if (item.content !== content) {
          onUpdateItem(item.id, { content: content });
      }
  }, 500, [content, item.content]);
  
  useEffect(() => {
    // Only update internal state if the incoming content is different
    if (editorRef.current && item.content !== editorRef.current.innerHTML) {
      setContent(item.content || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = item.content || '';
      }
      setIsPlaceholderVisible(!item.content || item.content === '<br>');
    }
  }, [item.id, item.content]);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>, command: 'foreColor' | 'backColor') => {
    handleCommand(command, e.target.value);
  };
  
  const handleFontChange = (font: string) => {
     handleCommand('fontName', font);
  }
  
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    setIsPlaceholderVisible(newContent === '' || newContent === '<br>');
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = `<img src="${event.target?.result}" style="max-width: 100%; height: auto;" />`;
            document.execCommand('insertHTML', false, img);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };
  
  useEffect(() => {
    if (editorRef.current) {
        // To prevent cursor jumping, only set innerHTML if it's different
        if (editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
        }
    }
  }, [content]);

  // Font sizes per size
  const textFontSizes = {
    XS: 'text-xs',
    S: 'text-sm',
    M: 'text-base',
    L: 'text-lg',
    XL: 'text-xl',
  };

  const placeholderFontSizes = {
    XS: 'text-xs',
    S: 'text-sm',
    M: 'text-base',
    L: 'text-lg',
    XL: 'text-2xl',
  };

  // Toolbar her zaman görünür (player frame içinde tam boyut için)
  const editorContent = (
    <div className="absolute inset-0 flex flex-col">
      {/* Toolbar - Responsive: XS/S'de daha az buton */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 flex-wrap p-1 flex-shrink-0 bg-background/95 backdrop-blur-sm">
        {/* Basic formatting (B/I/U) - Always visible */}
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7" 
          onMouseDown={(e) => { e.preventDefault(); handleCommand('bold'); }}
          title="Kalın"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7" 
          onMouseDown={(e) => { e.preventDefault(); handleCommand('italic'); }}
          title="İtalik"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        {/* Underline - Hidden on XS */}
        {size !== 'XS' && (
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-7 w-7" 
            onMouseDown={(e) => { e.preventDefault(); handleCommand('underline'); }}
            title="Altı Çizili"
          >
            <Underline className="h-3.5 w-3.5" />
          </Button>
        )}
        
        {/* List buttons - Hidden on XS/S */}
        {size !== 'XS' && size !== 'S' && (
          <>
            <Button size="icon" variant="ghost" className="h-7 w-7" onMouseDown={(e) => { e.preventDefault(); handleCommand('insertUnorderedList'); }} title="Madde İşaretli Liste">
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onMouseDown={(e) => { e.preventDefault(); handleCommand('insertOrderedList'); }} title="Numaralı Liste">
              <ListOrdered className="h-3.5 w-3.5" />
            </Button>
          </>
        )}

        {/* Color formatting - Hidden on XS/S, Compact popover on M */}
        {size !== 'XS' && size !== 'S' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7" title="Renk">
                <Palette className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("p-2", size === 'M' ? 'w-40' : 'w-auto')}>
              <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium">Yazı Rengi</label>
                  <input type="color" onChange={(e) => handleColorChange(e, 'foreColor')} className="w-full h-7" />
                  <label className="text-xs font-medium">Arka Plan Rengi</label>
                  <input type="color" onChange={(e) => handleColorChange(e, 'backColor')} className="w-full h-7" />
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        {/* Font selection - Only on L/XL */}
        {(size === 'L' || size === 'XL') && (
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7" title="Font">
              <CaseSensitive className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex flex-col gap-1">
                <Button variant="ghost" onMouseDown={(e) => { e.preventDefault(); handleFontChange('Arial');}} className='font-[Arial]'>Arial</Button>
                <Button variant="ghost" onMouseDown={(e) => { e.preventDefault(); handleFontChange('Verdana');}} className='font-[Verdana]'>Verdana</Button>
                <Button variant="ghost" onMouseDown={(e) => { e.preventDefault(); handleFontChange('Georgia');}} className='font-[Georgia]'>Georgia</Button>
                <Button variant="ghost" onMouseDown={(e) => { e.preventDefault(); handleFontChange('Times New Roman');}} className='font-["Times_New_Roman"]'>Times New Roman</Button>
            </div>
          </PopoverContent>
        </Popover>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 relative min-h-0">
        {isPlaceholderVisible && (
          <div className={cn(
            "absolute inset-0 text-muted-foreground pointer-events-none",
            placeholderFontSizes[size],
            sizeConfig.padding
          )}>
            Notlarınızı buraya yazın...
          </div>
        )}
        <div
          ref={editorRef}
          className={cn(
            "h-full w-full overflow-auto outline-none",
            textFontSizes[size],
            sizeConfig.padding,
            size === 'XL' && "leading-relaxed"
          )}
          onInput={handleInput}
          onPaste={handlePaste}
          spellCheck="false"
          contentEditable={true}
          suppressContentEditableWarning={true}
        />
      </div>
    </div>
  );

  if (!showWrapper) {
    return editorContent;
  }

  return (
    <ToolkitWidgetWrapper
      title="Notes"
      icon={<FileText className="h-4 w-4" />}
      size={size}
      onSizeChange={onSizeChange}
      showHeader={false} // Notes widget has its own toolbar
      fullHeight={true}
    >
      {editorContent}
    </ToolkitWidgetWrapper>
  );
}
