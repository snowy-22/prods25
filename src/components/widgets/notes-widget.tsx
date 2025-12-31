'use client';

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Palette, CaseSensitive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ContentItem } from '@/lib/initial-content';
import { useDebounce } from 'react-use';

type NotesWidgetProps = {
    item: ContentItem;
    onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
    size?: 'small' | 'medium' | 'large';
};

export default function NotesWidget({ item, onUpdateItem, size = 'medium' }: NotesWidgetProps) {
  const [content, setContent] = useState(item.content || '');
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(content === 'Notlarınızı buraya yazın...' || content === '');
  const editorRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground relative">
      {size !== 'small' && (
        <div className={cn("p-1 flex items-center gap-1 border-b flex-wrap")}>
          <Button size="icon" variant="ghost" className="h-8 w-8" onMouseDown={(e) => { e.preventDefault(); handleCommand('bold'); }}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onMouseDown={(e) => { e.preventDefault(); handleCommand('italic'); }}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onMouseDown={(e) => { e.preventDefault(); handleCommand('underline'); }}>
            <Underline className="h-4 w-4" />
          </Button>
          {size === 'large' && (
            <>
              <Button size="icon" variant="ghost" className="h-8 w-8" onMouseDown={(e) => { e.preventDefault(); handleCommand('insertUnorderedList'); }}>
                <List className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onMouseDown={(e) => { e.preventDefault(); handleCommand('insertOrderedList'); }}>
                <ListOrdered className="h-4 w-4" />
              </Button>
            </>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Yazı Rengi</label>
                  <input type="color" onChange={(e) => handleColorChange(e, 'foreColor')} className="w-full h-8" />
                  <label className="text-sm font-medium">Arka Plan Rengi</label>
                  <input type="color" onChange={(e) => handleColorChange(e, 'backColor')} className="w-full h-8" />
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <CaseSensitive className="h-4 w-4" />
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
        </div>
      )}
      <div className="flex-1 relative min-h-0">
        {isPlaceholderVisible && (
          <div className={cn(
            "absolute inset-0 p-4 text-muted-foreground pointer-events-none",
            size === 'large' ? "text-2xl" : size === 'medium' ? "text-lg" : "text-sm",
            size === 'small' ? "top-0" : "top-0"
          )}>
            Notlarınızı buraya yazın...
          </div>
        )}
        <div
          ref={editorRef}
          className={cn(
            "h-full w-full p-4 overflow-auto outline-none",
            size === 'large' ? "text-2xl leading-relaxed" : size === 'medium' ? "text-lg" : "text-sm"
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
}
