'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Copy, ThumbsDown, ThumbsUp, MoreVertical, Code, 
  Heart, Star, Eye, ExternalLink, Save 
} from 'lucide-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContentItem } from '@/lib/initial-content';

const PlayerFrame = dynamic(() => import('@/components/player-frame'), { ssr: false });

export type MessageRole = 'user' | 'assistant' | 'system' | 'error';
export type MessageContentType = 'text' | 'code' | 'image' | 'file' | 'thinking' | 'shared_item';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  contentType?: MessageContentType;
  timestamp: number;
  language?: string; // for code blocks
  codeFilename?: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  sharedItem?: ContentItem;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    temperature?: number;
    citations?: string[];
  };
  reactions?: {
    thumbsUp: number;
    thumbsDown: number;
  };
  userReaction?: 'up' | 'down' | null;
}

interface ChatMessageProps {
  message: ChatMessage;
  isLast?: boolean;
  onReaction?: (messageId: string, type: 'up' | 'down') => void;
  onCopy?: (text: string) => void;
  onDelete?: (messageId: string) => void;
  isLoading?: boolean;
}

export function ChatMessageComponent({
  message,
  isLast = false,
  onReaction,
  onCopy,
  onDelete,
  isLoading = false,
}: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const isThinking = message.contentType === 'thinking';

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-3 py-4 px-4 group',
        isUser && 'justify-end flex-row-reverse',
        isError && 'bg-destructive/5 border-l-2 border-destructive'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {!isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=ai-${message.role}`} />
          <AvatarFallback>{message.role === 'system' ? 'SYS' : 'AI'}</AvatarFallback>
        </Avatar>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          'max-w-2xl flex flex-col gap-2',
          isUser && 'items-end'
        )}
      >
        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
            <span className="text-xs text-muted-foreground">Düşünüyor...</span>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          className={cn(
            'rounded-lg px-4 py-3 break-words',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-none'
              : 'bg-muted text-foreground rounded-bl-none',
            isError && 'bg-destructive/10 border border-destructive/20'
          )}
        >
          {/* Code Block */}
          {message.contentType === 'code' && (
            <div className="space-y-2">
              {message.codeFilename && (
                <div className="flex items-center gap-2 px-3 py-2 bg-black/20 rounded">
                  <Code className="h-3 w-3" />
                  <code className="text-xs font-mono">{message.codeFilename}</code>
                </div>
              )}
              <div className="overflow-x-auto rounded-md bg-black/30">
                <pre className="p-4 text-sm font-mono">
                  <code className="language-{message.language || 'bash'}">
                    {message.content}
                  </code>
                </pre>
              </div>
            </div>
          )}

          {/* Image */}
          {message.contentType === 'image' && message.imageUrl && (
            <div className="space-y-2">
              <img
                src={message.imageUrl}
                alt="İçerik görseli"
                className="max-w-sm rounded-lg"
              />
              {message.content && <p className="text-sm">{message.content}</p>}
            </div>
          )}

          {/* File */}
          {message.contentType === 'file' && (
            <div className="flex items-center gap-3 p-3 bg-black/10 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{message.fileName}</p>
                {message.fileSize && (
                  <p className="text-xs text-muted-foreground">
                    {(message.fileSize / 1024).toFixed(2)} KB
                  </p>
                )}
              </div>
              <Badge variant="outline" className="text-xs">İndir</Badge>
            </div>
          )}

          {/* Shared Item */}
          {message.contentType === 'shared_item' && message.sharedItem && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-primary/20 rounded-lg border border-primary/30">
                <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {message.sharedItem.type === 'video' || message.sharedItem.type === 'youtube' ? (
                    <Play className="h-6 w-6 text-primary" />
                  ) : message.sharedItem.type === '3d' ? (
                    <Box className="h-6 w-6 text-primary" />
                  ) : message.sharedItem.type === 'widget' ? (
                    <Puzzle className="h-6 w-6 text-primary" />
                  ) : (
                    <Grid className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{message.sharedItem.title}</p>
                  <p className="text-[10px] text-muted-foreground uppercase opacity-70">Paylaşılan {message.sharedItem.type}</p>
                  <div className="flex gap-2 mt-1">
                    <Button size="xs" variant="secondary" className="h-5 text-[9px] px-2 py-0">
                      Kitaplığa Ekle
                    </Button>
                    <Button size="xs" variant="secondary" className="h-5 text-[9px] px-2 py-0">
                      Önizle
                    </Button>
                  </div>
                </div>
              </div>
              {message.content && <p className="text-sm italic opacity-80 leading-relaxed">"{message.content}"</p>}
            </div>
          )}

          {/* Text */}
          {message.contentType === 'text' || !message.contentType && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatTime(message.timestamp)}</span>
          {message.metadata?.model && (
            <Badge variant="outline" className="text-xs">
              {message.metadata.model}
            </Badge>
          )}
          {message.metadata?.tokensUsed && (
            <span className="text-muted-foreground">
              {message.metadata.tokensUsed} tokens
            </span>
          )}
        </div>

        {/* Actions - Show on Hover */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1"
          >
            {/* Copy Button */}
            {message.contentType === 'code' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleCopy}
              >
                <Copy className="h-3 w-3 mr-1" />
                {isCopied ? 'Kopyalandı' : 'Kopyala'}
              </Button>
            )}

            {/* Reactions */}
            {!isUser && !isError && (
              <>
                <Button
                  variant={message.userReaction === 'up' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => onReaction?.(message.id, 'up')}
                >
                  <ThumbsUp className="h-3 w-3" />
                  {message.reactions?.thumbsUp || 0}
                </Button>
                <Button
                  variant={message.userReaction === 'down' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => onReaction?.(message.id, 'down')}
                >
                  <ThumbsDown className="h-3 w-3" />
                  {message.reactions?.thumbsDown || 0}
                </Button>
              </>
            )}

            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Kopyala
                </DropdownMenuItem>
                {isUser && (
                  <DropdownMenuItem
                    onClick={() => onDelete?.(message.id)}
                    className="text-destructive"
                  >
                    Sil
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
