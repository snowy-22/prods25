'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChatMessageComponent, ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, MessageSquare } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string, attachments?: File[]) => Promise<void>;
  onReaction?: (messageId: string, type: 'up' | 'down') => void;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  suggestions?: string[];
  allowAttachments?: boolean;
  allowVoice?: boolean;
  currentModel?: string;
  onModelChange?: (model: string) => void;
}

export function ChatWindow({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onReaction,
  title = 'AI Asistan',
  subtitle,
  isLoading = false,
  suggestions,
  allowAttachments = true,
  allowVoice = true,
  currentModel,
  onModelChange,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 0);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text: string, attachments?: File[]) => {
    setLocalLoading(true);
    try {
      await onSendMessage(text, attachments);
    } finally {
      setLocalLoading(false);
    }
  };

  const emptyState = messages.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 right-4 z-40 flex flex-col h-[600px] w-[420px] max-w-[calc(100vw-32px)] bg-background border rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">{title}</h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="flex flex-col">
              <AnimatePresence mode="popLayout">
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full p-6 text-center"
                  >
                    <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-3" />
                    <h3 className="font-medium text-sm mb-1">Sohbeti Başlat</h3>
                    <p className="text-xs text-muted-foreground mb-6">
                      AI asistanı ile sohbet et, soru sor, kod yazır
                    </p>

                    {suggestions && suggestions.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 w-full">
                        {suggestions.slice(0, 3).map((suggestion, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => {
                              // Trigger message send
                              handleSendMessage(suggestion);
                            }}
                            className="text-left px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs truncate"
                          >
                            {suggestion}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  messages.map((message) => (
                    <ChatMessageComponent
                      key={message.id}
                      message={message}
                      onReaction={onReaction}
                      onCopy={(text) => {
                        navigator.clipboard.writeText(text);
                      }}
                      isLast={messages[messages.length - 1].id === message.id}
                    />
                  ))
                )}

                {/* Loading Indicator */}
                {(isLoading || localLoading) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 p-4 px-6"
                  >
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="h-2 w-2 rounded-full bg-primary"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {/* Input Area */}
          <ChatInput
            onSubmit={handleSendMessage}
            isLoading={isLoading || localLoading}
            placeholder="Bir şey sorun..."
            suggestions={emptyState ? suggestions : undefined}
            allowAttachments={allowAttachments}
            allowVoice={allowVoice}
            currentModel={currentModel}
            onModelChange={onModelChange}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
