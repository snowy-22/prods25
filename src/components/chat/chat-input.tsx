'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Plus, 
  Mic, 
  Zap,
  MoreVertical,
  Settings
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatInputProps {
  onSubmit: (message: string, attachments?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  allowAttachments?: boolean;
  allowVoice?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  onModelChange?: (model: string) => void;
  currentModel?: string;
}

export function ChatInput({
  onSubmit,
  isLoading = false,
  placeholder = 'Bir şey sorun veya sor...',
  maxLength = 4000,
  allowAttachments = true,
  allowVoice = true,
  suggestions,
  onSuggestionClick,
  onModelChange,
  currentModel,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = Math.min(textareaRef.current.scrollHeight, 150);
      textareaRef.current.style.height = scrollHeight + 'px';
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSubmit(input, attachments);
    setInput('');
    setAttachments([]);
    setShowSuggestions(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleVoiceRecord = async () => {
    if (!allowVoice) return;

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const audioChunks: BlobPart[] = [];
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
          setAttachments(prev => [...prev, file]);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Mikrofon erişimi başarısız:', err);
      }
    }
  };

  const charCount = input.length;
  const charPercentage = (charCount / maxLength) * 100;

  return (
    <div className="space-y-3 p-4 bg-background border-t rounded-t-xl">
      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {attachments.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
              >
                <span className="truncate">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex gap-2">
        {/* Left Actions */}
        <div className="flex gap-1">
          <TooltipProvider>
            {/* Suggestions/Quick Actions */}
            {suggestions && suggestions.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Öneriler</TooltipContent>
              </Tooltip>
            )}

            {/* Attach File */}
            {allowAttachments && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dosya Ekle</TooltipContent>
              </Tooltip>
            )}

            {/* Voice Record */}
            {allowVoice && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isRecording ? 'default' : 'ghost'}
                    size="icon"
                    className={cn(
                      'h-9 w-9',
                      isRecording && 'bg-destructive hover:bg-destructive'
                    )}
                    onClick={toggleVoiceRecord}
                    disabled={isLoading}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRecording ? 'Kaydı Dur' : 'Ses Kaydı'}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {currentModel && onModelChange && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold">Model</div>
                    <DropdownMenuItem onClick={() => onModelChange('gpt-4')}>
                      GPT-4 (Daha Akıllı)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onModelChange('gpt-3.5-turbo')}>
                      GPT-3.5 Turbo (Daha Hızlı)
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem>Dil İşlemleri</DropdownMenuItem>
                <DropdownMenuItem>Gizlilik Ayarları</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </div>

        {/* Textarea */}
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.length > 0) {
                setShowSuggestions(false);
              }
            }}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={isLoading}
            className="resize-none border-0 focus-visible:ring-0 p-0 text-sm"
            rows={1}
          />
        </div>

        {/* Right Actions */}
        <div className="flex flex-col gap-1">
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 p-0"
            size="icon"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Plus className="h-4 w-4" />
              </motion.div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>

          {/* Character Count */}
          {charCount > maxLength * 0.8 && (
            <div className="text-xs text-muted-foreground text-right">
              {charCount}/{maxLength}
            </div>
          )}
        </div>
      </div>

      {/* Character Indicator */}
      {charCount > 0 && (
        <div className="h-0.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              charPercentage > 90
                ? 'bg-destructive'
                : charPercentage > 70
                ? 'bg-amber-500'
                : 'bg-primary'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(charPercentage, 100)}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      )}

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-2 gap-2"
          >
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setInput(suggestion);
                  setShowSuggestions(false);
                  onSuggestionClick?.(suggestion);
                }}
                className="text-left px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm truncate"
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
}
