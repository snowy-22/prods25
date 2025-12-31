'use client';

import React from 'react';
import { Bot, User, ThumbsUp, ThumbsDown, Copy, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export interface ChatMessageProps {
  id: string;
  role: 'user' | 'model' | 'assistant';
  content: Array<{ text?: string; toolRequest?: any; toolResponse?: any }>;
  timestamp?: Date;
  reactions?: Array<{ type: string; count: number }>;
  onReaction?: (messageId: string, type: string) => void;
  onDelete?: (messageId: string) => void;
  showActions?: boolean;
}

export function ChatMessage({
  id,
  role,
  content,
  timestamp,
  reactions = [],
  onReaction,
  onDelete,
  showActions = true,
}: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);
  const isUser = role === 'user';

  const handleCopy = () => {
    const textContent = content
      .map((part) => ('text' in part ? part.text : ''))
      .join('\n');
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 group animate-in fade-in-50 slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col gap-1 max-w-[75%]">
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl shadow-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          )}
        >
          {content.map((part, i) => {
            if ('text' in part && part.text) {
              return (
                <div
                  key={i}
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: part.text.replace(/\n/g, '<br />'),
                  }}
                />
              );
            }
            if ('toolRequest' in part) {
              return (
                <div key={i} className="text-xs opacity-70 italic">
                  🔧 {part.toolRequest?.name || 'Tool'} executing...
                </div>
              );
            }
            if ('toolResponse' in part) {
              return (
                <div key={i} className="text-xs opacity-70">
                  ✓ {part.toolResponse?.name || 'Tool'} completed
                </div>
              );
            }
            return null;
          })}
        </div>

        {showActions && (
          <div className="flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            {onReaction && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onReaction(id, 'thumbsUp')}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onReaction(id, 'thumbsDown')}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => onDelete(id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {reactions.length > 0 && (
          <div className="flex gap-1">
            {reactions.map((reaction) => (
              <div
                key={reaction.type}
                className="text-xs bg-muted px-2 py-0.5 rounded-full"
              >
                {reaction.type === 'thumbsUp' ? '👍' : '👎'} {reaction.count}
              </div>
            ))}
          </div>
        )}

        {timestamp && (
          <div className="text-[10px] text-muted-foreground px-1">
            {timestamp.toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
