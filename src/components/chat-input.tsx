'use client';

import React from 'react';
import { Send, Paperclip, Smile, Mic, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  onAttachment?: () => void;
  onEmoji?: () => void;
  onVoice?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  showCamera?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onAttachment,
  onEmoji,
  onVoice,
  placeholder = 'Bir mesaj yazın...',
  disabled = false,
  isLoading = false,
  showCamera = true,
}: ChatInputProps) {
  const handleSend = () => {
    if (value.trim() && !disabled && !isLoading) {
      onSend(value.trim());
      onChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Voice & Send Top Bar */}
      <div className="flex items-center gap-1 px-2 pt-2">
        {onVoice && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onVoice}
            disabled={disabled}
            className="shrink-0"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
        <Button
          onClick={handleSend}
          disabled={disabled || isLoading || !value.trim()}
          size="icon"
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Input Bar */}
      <div className="flex items-center gap-1 p-2">
        {onAttachment && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onAttachment}
            disabled={disabled}
            className="shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        )}

        {showCamera && (
          <Button
            asChild
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="shrink-0"
          >
            <Link href="/scan">
              <Camera className="h-5 w-5" />
            </Link>
          </Button>
        )}

        {onEmoji && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEmoji}
            disabled={disabled}
            className="shrink-0"
          >
            <Smile className="h-5 w-5" />
          </Button>
        )}

        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="flex-1"
        />
      </div>
    </div>
  );
}
