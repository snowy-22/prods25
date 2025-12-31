
'use client';

import { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { useWindowSize } from 'react-use';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Bot, User, Send, Loader2, X, Pin, PinOff, Paperclip, Smile, Mic, Video, Phone, MoreHorizontal, Image as ImageIcon, Users, Info, ExternalLink, Share2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { askAi } from '@/ai/flows/assistant-flow';
import { type Message } from '@/ai/flows/assistant-schema';
import { AppLogo } from './icons/app-logo';
import { ChatPanelState } from '@/lib/store';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';


type AiChatDialogProps = {
  panelState: ChatPanelState;
  scale: number;
  initialMessages?: Message[];
  onOpenChange: (open: boolean) => void;
  onStateChange: (newState: Partial<ChatPanelState>) => void;
  onFocus: () => void;
  isPanel?: boolean;
  initialPrompt?: string;
  onNewMessages?: (panelId: string, messages: Message[]) => void;
  onPinToggle: () => void;
  onToolCall?: (name: string, input: any) => void;
};

const exampleMessages: Record<string, Message[]> = {
    'snowy95': [
        { role: 'user', content: [{ text: "İşte geçen haftanın en popülerleri:\n1. Monolink\n2. ARTBAT\n3. Anyma" }] },
        { role: 'user', content: [{ text: "Yeni proje için ilham kaynakları:\n- https://www.behance.net/galleries/interaction" }]},
        { role: 'user', content: [{ text: "Alınacaklar: Süt, ekmek, yumurta" }]}
    ],
    'proje-ekibi': [
        { role: 'user', content: [{ text: "Selam ekip, yeni tasarım taslaklarını inceliyorum. Harika görünüyor!" }] },
        { role: 'model', content: [{ text: "Teşekkürler! Geri bildirimleriniz olursa çekinmeyin." }] },
        { role: 'user', content: [{ text: "Login ekranındaki butonu biraz daha belirgin yapabilir miyiz?" }]},
    ],
    'fatma': [
         { role: 'user', content: [{ text: "Selam Fatma, nasılsın?" }] },
         { role: 'model', content: [{ text: "İyiyim, teşekkürler! Sen nasılsın?" }] },
    ],
    'can': [
        { role: 'model', content: [{ text: "Bu listeye bir göz at: <a href='#' class='text-primary underline'>Spor Kanalları</a>" }] }
    ],
    'asistan': [
        { role: 'model', content: [{ text: "Merhaba! Ben CanvasFlow asistanınız. Size nasıl yardımcı olabilirim?" }] }
    ],
    'gelistiriciler': [
        { role: 'user', content: [{ text: "Yeni sürüm dağıtıma hazır. `main` branch'ini merge ediyorum." }] },
        { role: 'model', content: [{ text: "Anlaşıldı, testleri tekrar çalıştırıyorum."}] }
    ],
    'tasarim-ekibi': [
        { role: 'model', content: [{ text: "Yeni ikon setini Figma'ya yükledim, kontrol edebilir misiniz?"}] },
        { role: 'user', content: [{ text: "Hemen bakıyorum, elinize sağlık!" }] }
    ]
};

export function AiChatDialog({
  panelState,
  scale,
  initialMessages,
  onOpenChange,
  onStateChange,
  onFocus,
  isPanel = false,
  initialPrompt = '',
  onNewMessages,
  onPinToggle,
  onToolCall,
}: AiChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || exampleMessages[panelState.id] || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialPromptSent = useRef(false);
  const { toast } = useToast();
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;

  const processedMessagesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    messages.forEach((msg, index) => {
      if (msg.role === 'model' && !processedMessagesRef.current.has(index)) {
        msg.content.forEach(part => {
          if ('toolRequest' in part) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`Client-side tool call detected: ${part.toolRequest.name}`, part.toolRequest.input);
            }
            onToolCall?.(part.toolRequest.name, part.toolRequest.input);
          }
        });
        processedMessagesRef.current.add(index);
      }
    });
  }, [messages, onToolCall]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };
  
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend) return;

    const userMessage: Message = { role: 'user', content: [{ text: textToSend }] };
    
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
     if (onNewMessages) {
        onNewMessages(panelState.id, newHistory);
    }
    if (!messageText) {
      setInput('');
    }

    if (panelState.id === 'asistan') {
        setIsLoading(true);
        try {
          const response = await askAi({
            history: newHistory,
          });

          const finalHistory = response.history;
          setMessages(finalHistory);
          if (onNewMessages) {
            onNewMessages(panelState.id, finalHistory);
          }

        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error asking AI:', error);
          }
          const errorMessage: Message = {
            role: 'model',
            content: [{ text: 'Üzgünüm, bir hata oluştu.' }],
          };
          setMessages((prev) => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
    }
  };


  useEffect(() => {
    if (initialPrompt && !isInitialPromptSent.current) {
        handleSendMessage(initialPrompt);
        isInitialPromptSent.current = true;
    }
  }, [initialPrompt]);
  
  useEffect(() => {
    setMessages(initialMessages || exampleMessages[panelState.id] || []);
  }, [panelState.id, initialMessages]);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getChatAvatar = () => {
    if (panelState.id === 'snowy95') return <AppLogo className="h-4 w-4" />;
    if (panelState.id === 'asistan') return <Bot className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  }

  const title = panelState.id.charAt(0).toUpperCase() + panelState.id.slice(1);

  const handleAttachment = () => {
    fileInputRef.current?.click();
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        toast({
            title: "Dosya Seçildi",
            description: `${file.name} gönderilmeye hazır. (Özellik yakında eklenecektir)`,
        });
    }
  };

  const handleEmoji = () => {
    toast({ title: 'Çok Yakında!', description: 'Gelişmiş emoji seçici bu alanda yer alacak.' });
  }

  const handleVoiceInput = () => {
    toast({ title: 'Çok Yakında!', description: 'Sesli mesaj, sesli komutlar ve sesli dikte özellikleri bu alanda yer alacak.' });
  }

    const chatContent = (
    <div className={cn("h-full flex flex-col", isPanel ? "p-0" : "p-0")}>
       <div className='flex flex-wrap items-center justify-between gap-2 p-2 border-b cursor-grab handle'>
        <div className='flex items-center gap-2 font-semibold min-w-0'>
          {getChatAvatar()}
          <span className='capitalize truncate'>{title}</span>
        </div>
        <div className="flex items-center flex-wrap gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Phone className="h-4 w-4" />
          </Button>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ImageIcon className="mr-2 h-4 w-4" />
                Paylaşılan Öğeler
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                Kişi/Grup Bilgisi
              </DropdownMenuItem>
               <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                Profile Git
              </DropdownMenuItem>
               <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Kişiyi Paylaş
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPinToggle}>
            {panelState.isPinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
       </div>
        <ScrollArea className="flex-1 px-2" viewportRef={scrollAreaRef}>
          <div className="space-y-6 p-2 pr-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'model' && (
                  <div className="bg-primary rounded-full p-2">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    'p-3 rounded-lg max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content.map((part, i) => {
                    if ('text' in part) {
                      return <p key={`msg-${index}-text-${i}`} dangerouslySetInnerHTML={{ __html: (part.text || "").replace(/\n/g, '<br />') }} />;
                    }
                    if ('toolRequest' in part) {
                      return <p key={`msg-${index}-tool-${i}-${part.toolRequest.name}`} className='text-xs italic text-muted-foreground'>[{part.toolRequest.name}] aracı kullanılıyor...</p>;
                    }
                    return null;
                  })}
                </div>
                {message.role === 'user' && (
                  <div className="bg-secondary rounded-full p-2">
                    <User className="h-5 w-5 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                 <div className="bg-primary rounded-full p-2">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="p-3 rounded-lg bg-muted flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
        {/* Top controls for voice and send */}
        <div className="flex items-center gap-1 px-2 pt-2">
          <Button variant="ghost" size="icon" onClick={handleVoiceInput}>
            <Mic className="h-5 w-5" />
          </Button>
          <Button onClick={() => handleSendMessage()} disabled={isLoading && panelState.id === 'asistan'}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 pt-2 p-2 border-t">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <Button variant="ghost" size="icon" onClick={handleAttachment}>
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button asChild variant="ghost" size="icon">
            <Link href="/scan">
              <Camera className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleEmoji}>
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Bir mesaj yazın..."
            disabled={isLoading && panelState.id === 'asistan'}
            className="flex-1"
          />
        </div>
    </div>
  );

  if (isPanel) {
    return (
        <div className="h-full">
            {chatContent}
        </div>
    )
  };

  if (isMobile) {
      return (
          <div className="fixed inset-0 z-50 bg-background flex flex-col">
              {chatContent}
          </div>
      )
  }

  const invertedScale = 1 / (scale / 100);

  return (
      <Rnd
          position={{ x: panelState.x, y: panelState.y }}
          size={{ width: panelState.width, height: panelState.height }}
          style={{ zIndex: panelState.zIndex, transform: `scale(${invertedScale})`, transformOrigin: 'top left' }}
          minWidth={300}
          minHeight={400}
          bounds="window"
          className="bg-card/80 backdrop-blur-lg border rounded-lg shadow-2xl flex flex-col"
          dragHandleClassName="handle"
          onDragStart={onFocus}
          onResizeStart={onFocus}
          onDragStop={(e, d) => onStateChange({ x: d.x, y: d.y })}
          onResizeStop={(e, direction, ref, delta, position) => {
              onStateChange({
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height),
                  ...position,
              });
          }}
      >
          {chatContent}
      </Rnd>
  );
}
