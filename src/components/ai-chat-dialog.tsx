
'use client';

import { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { useWindowSize } from 'react-use';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Bot, User, Send, Loader2, X, Pin, PinOff, Paperclip, Smile, Mic, MoreHorizontal, Users, ArrowLeft, Search, Volume2, VolumeX, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Message } from '@/ai/flows/assistant-schema';
import { AppLogo } from './icons/app-logo';
import { ChatPanelState } from '@/lib/store';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ChatWindow } from './chat-window';
import type { ChatMessageProps } from './chat-message';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';


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
        { role: 'model', content: [{ text: "Merhaba! Ben tv25 asistanınız. Size nasıl yardımcı olabilirim?" }] }
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

// Contact/Room list for desktop panel and mobile WP/TG navigation
const contactList = [
  { id: 'snowy95', name: 'Snowy95', avatar: '👤', status: 'online', unread: 0, lastMessage: 'Canvas projesi harika!' },
  { id: 'asistan', name: 'AI Asistan', avatar: '🤖', status: 'online', unread: 0, lastMessage: 'Size nasıl yardımcı olabilirim?' },
  { id: 'gelistiriciler', name: 'Geliştiriciler', avatar: '💻', status: 'online', unread: 2, lastMessage: 'Testleri tekrar çalıştırıyorum' },
  { id: 'tasarim-ekibi', name: 'Tasarım Ekibi', avatar: '🎨', status: 'away', unread: 1, lastMessage: 'Figma dosyasını kontrol edin' },
  { id: 'fatma', name: 'Fatma', avatar: '👩', status: 'online', unread: 0, lastMessage: 'İyiyim, teşekkürler!' },
  { id: 'can', name: 'Can', avatar: '⚽', status: 'offline', unread: 0, lastMessage: 'Spor kanalları listesi' },
];

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
  // Mobile: show contact list or chat view
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;
  const [showContactList, setShowContactList] = useState(isMobile);
  
  // Desktop: show/hide contact panel (unlocked mode)
  const [showContactPanel, setShowContactPanel] = useState(!panelState.isPinned);
  const [searchQuery, setSearchQuery] = useState('');

  const [messages, setMessages] = useState<Message[]>(initialMessages || exampleMessages[panelState.id] || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialPromptSent = useRef(false);
  const { toast } = useToast();

  const processedMessagesRef = useRef<Set<number>>(new Set());
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(false);
  const lastSpokenRef = useRef('');

  const callAssistant = async (history: Message[]): Promise<Message[]> => {
    const response = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Assistant service unavailable');
    }

    const data = await response.json();
    return data.history as Message[];
  };

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

  useEffect(() => {
    if (!voiceOverEnabled || typeof window === 'undefined') return;
    const lastAssistant = [...messages].reverse().find(m => m.role === 'model');
    if (!lastAssistant) return;
    const text = lastAssistant.content
      .map(part => ('text' in part ? part.text : ''))
      .join(' ')
      .trim();
    if (!text || text === lastSpokenRef.current) return;

    lastSpokenRef.current = text;
    try {
      window.speechSynthesis?.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      window.speechSynthesis?.speak(utterance);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Speech synthesis failed', err);
      }
    }
  }, [messages, voiceOverEnabled]);

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
          const finalHistory = await callAssistant(newHistory);
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

  // Handle contact selection (mobile: switch to chat, desktop: just update)
  const handleContactSelect = (contactId: string) => {
    onStateChange({ id: contactId });
    setMessages(exampleMessages[contactId] || []);
    if (isMobile) {
      setShowContactList(false);
    }
  };

  // Convert Message to ChatMessageProps
  const convertedMessages: ChatMessageProps[] = messages.map((msg, idx) => ({
    id: `${panelState.id}-${idx}`,
    role: msg.role as 'user' | 'model' | 'assistant',
    content: msg.content,
    timestamp: new Date(),
  }));

  // Filter contacts by search
  const filteredContacts = contactList.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    return () => {
      recognitionRef.current?.stop?.();
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);


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
    if (isListening) {
      recognitionRef.current?.stop?.();
      setIsListening(false);
      return;
    }

    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Ses girişi desteklenmiyor', description: 'Tarayıcınızda Web Speech API bulunamadı.' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = true;
    let transcript = '';

    recognition.onresult = (event: any) => {
      transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(' ');
      setInput(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (transcript.trim()) {
        handleSendMessage(transcript.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    };

  // Toggle wrapper used by UI button (keeps naming consistent)
  const toggleVoiceInput = () => {
    handleVoiceInput();
  };

  // Contact List Component (Mobile + Desktop Panel)
  const ContactListView = () => (
    <div className="h-full flex flex-col">
      {/* Header with search */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sohbetler</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Contact List */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => handleContactSelect(contact.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left',
                panelState.id === contact.id && 'bg-muted'
              )}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-xl">{contact.avatar}</AvatarFallback>
                </Avatar>
                {contact.status === 'online' && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                )}
                {contact.status === 'away' && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-yellow-500 border-2 border-background rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-medium truncate">{contact.name}</p>
                  {contact.unread > 0 && (
                    <Badge variant="default" className="h-5 min-w-[20px] px-1 text-xs">
                      {contact.unread}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {contact.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  // Main Chat View
  const ChatView = () => {
    const currentContact = contactList.find((c) => c.id === panelState.id);
    const title = currentContact?.name || panelState.id.charAt(0).toUpperCase() + panelState.id.slice(1);

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 p-2 border-b cursor-grab handle">
          <div className="flex items-center gap-2 min-w-0">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setShowContactList(true)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>{currentContact?.avatar || '👤'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold truncate">{title}</p>
              <p className="text-xs text-muted-foreground">
                {currentContact?.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant={isListening ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={toggleVoiceInput}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              variant={voiceOverEnabled ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setVoiceOverEnabled(!voiceOverEnabled)}
            >
              {voiceOverEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <UserCircle className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  {showContactPanel ? 'Kişi Listesini Gizle' : 'Kişi Listesini Göster'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPinToggle}>
                  {panelState.isPinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                  {panelState.isPinned ? 'Sabitle Kaldır' : 'Sabitle'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenChange(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Kapat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Modern ChatWindow */}
        <ChatWindow
          messages={convertedMessages}
          input={input}
          onInputChange={setInput}
          onSend={(message) => handleSendMessage(message)}
          onAttachment={handleAttachment}
          onEmoji={handleEmoji}
          onVoice={handleVoiceInput}
          isLoading={isLoading}
          placeholder="Bir mesaj yazın..."
          className="flex-1 flex flex-col"
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  };

  // Desktop: Contact Panel + Chat (when unlocked)
  // Mobile: Either Contact List OR Chat
  const chatContent = !isMobile && !panelState.isPinned && showContactPanel ? (
    <div className="h-full flex">
      <div className="w-72 border-r">{ContactListView()}</div>
      <div className="flex-1">{ChatView()}</div>
    </div>
  ) : isMobile && showContactList ? (
    ContactListView()
  ) : (
    ChatView()
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
          className={cn(
              'bg-card/80 backdrop-blur-lg border rounded-lg shadow-2xl flex flex-col',
              isDropZoneActive && 'border-primary/50 bg-primary/5 shadow-primary/20'
          )}
          dragHandleClassName="handle"
          onDragStart={onFocus}
          onResizeStart={onFocus}
          onDragStop={(e, d) => onStateChange({ x: d.x, y: d.y })}
          onDragOver={(e) => {
              e.preventDefault();
              setIsDropZoneActive(true);
          }}
          onDragLeave={(e) => {
              setIsDropZoneActive(false);
          }}
          onDrop={(e) => {
              e.preventDefault();
              setIsDropZoneActive(false);
              const data = e.dataTransfer.getData('application/json');
              if (data) {
                  try {
                      const droppedItem = JSON.parse(data);
                      // Add dropped item reference as a message
                      const itemReference: Message = {
                          role: 'user',
                          content: [{
                              text: `📎 Referans: "${droppedItem.title}" (${droppedItem.type})`
                          }]
                      };
                      setMessages(prev => [...prev, itemReference]);
                      toast({
                          title: '✓ Item Linked',
                          description: `"${droppedItem.title}" has been linked to this chat.`,
                      });
                  } catch (err) {
                      if (process.env.NODE_ENV === 'development') {
                          console.error('Drop failed:', err);
                      }
                  }
              }
          }}
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
