'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, ChatMessageProps } from './chat-message';
import { ChatInput, ChatInputProps } from './chat-input';
import { Sparkles } from 'lucide-react';

export interface ChatWindowProps {
  messages: Array<Omit<ChatMessageProps, 'onReaction' | 'onDelete'>>;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (message: string) => void;
  onReaction?: (messageId: string, type: string) => void;
  onDelete?: (messageId: string) => void;
  onAttachment?: () => void;
  onEmoji?: () => void;
  onVoice?: () => void;
  isListening?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showCamera?: boolean;
  className?: string;
}

export function ChatWindow({
  messages,
  input,
  onInputChange,
  onSend,
  onReaction,
  onDelete,
  onAttachment,
  onEmoji,
  onVoice,
  isListening,
  isLoading = false,
  placeholder,
  emptyStateTitle = 'Sohbete başlayın',
  emptyStateDescription = 'Bir mesaj göndererek AI asistanınızla konuşmaya başlayın.',
  showCamera = true,
  className,
}: ChatWindowProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div className={className}>
      <ScrollArea className="flex-1 px-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{emptyStateTitle}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {emptyStateDescription}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                {...message}
                onReaction={onReaction}
                onDelete={onDelete}
              />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      <ChatInput
        value={input}
        onChange={onInputChange}
        onSend={onSend}
        onAttachment={onAttachment}
        onEmoji={onEmoji}
        onVoice={onVoice}
        isListening={isListening}
        isLoading={isLoading}
        placeholder={placeholder}
        showCamera={showCamera}
      />
    </div>
  );
}
