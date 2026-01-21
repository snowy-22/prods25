'use client';

/**
 * Enhanced AI Chat Component
 * Full-featured AI assistant with voice, vision, and function calling
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff,
  Send, 
  Loader2, 
  Volume2, 
  VolumeX,
  X,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  Settings,
  Trash2,
  Copy,
  RotateCcw,
  Maximize2,
  Minimize2,
  Bot,
  User,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAIAssistant } from '@/lib/ai-complete/hooks';
import type { ChatMessage, VoiceState, CameraState } from '@/lib/ai-complete/types';

interface EnhancedAIChatProps {
  className?: string;
  conversationId?: string;
  initialMessages?: ChatMessage[];
  onMinimize?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  showHeader?: boolean;
}

export function EnhancedAIChat({
  className,
  conversationId,
  initialMessages = [],
  onMinimize,
  onMaximize,
  isMaximized = false,
  showHeader = true,
}: EnhancedAIChatProps) {
  // AI Assistant hook - combines all AI features
  const {
    // Chat
    messages,
    isLoading,
    error,
    sendMessage,
    sendVoiceMessage,
    sendImageMessage,
    clearMessages,
    stopGeneration,
    regenerateLastResponse,
    
    // Voice Input
    voiceInput,
    startVoiceInput,
    stopVoiceInput,
    
    // Voice Output
    voiceOutput,
    speak,
    stopSpeaking,
    
    // Camera
    camera,
    startCamera,
    stopCamera,
    switchCamera,
    
    // Vision
    vision,
    analyzeCurrentFrame,
    captureAndAnalyze,
  } = useAIAssistant({
    conversationId,
    autoSaveHistory: true,
  });
  
  const [input, setInput] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Connect video element to camera stream
  useEffect(() => {
    if (videoRef.current && camera.stream) {
      videoRef.current.srcObject = camera.stream;
    }
  }, [camera.stream]);
  
  // Auto-speak new assistant messages
  useEffect(() => {
    if (autoSpeak && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content) {
        speak(lastMessage.content);
      }
    }
  }, [messages, autoSpeak, speak]);
  
  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && !capturedImage) return;
    
    setInput('');
    
    if (capturedImage) {
      await sendImageMessage(capturedImage, trimmedInput || 'Bu resmi analiz et');
      setCapturedImage(null);
    } else {
      await sendMessage(trimmedInput);
    }
  }, [input, capturedImage, sendMessage, sendImageMessage]);
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // Toggle voice input
  const toggleVoiceInput = () => {
    if (voiceInput.isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };
  
  // Toggle camera
  const toggleCamera = async () => {
    if (camera.isActive) {
      stopCamera();
    } else {
      await startCamera();
    }
  };
  
  // Capture from camera
  const handleCapture = async () => {
    const result = await captureAndAnalyze('Bu görselde ne görüyorsun?');
    if (result) {
      // Result is automatically added to messages
    }
  };
  
  // Capture for manual analysis
  const captureForInput = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
      }
    }
  };
  
  // Copy message content
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };
  
  // Format message content with markdown-like styling
  const formatContent = (content: string) => {
    // Simple formatting - in production use a proper markdown renderer
    return content
      .split('\n')
      .map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>);
  };
  
  return (
    <div className={cn(
      'flex flex-col bg-background border rounded-lg shadow-lg overflow-hidden',
      isMaximized ? 'fixed inset-4 z-50' : 'h-full',
      className
    )}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold">AI Asistan</span>
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className={cn(autoSpeak && 'text-primary')}
                  >
                    {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {autoSpeak ? 'Sesli okumayı kapat' : 'Sesli okumayı aç'}
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={clearMessages}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sohbeti temizle</TooltipContent>
              </Tooltip>
              
              {(onMinimize || onMaximize) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={isMaximized ? onMinimize : onMaximize}
                    >
                      {isMaximized ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isMaximized ? 'Küçült' : 'Büyüt'}
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>
      )}
      
      {/* Camera Preview */}
      {camera.isActive && (
        <div className="relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-32 object-cover"
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={captureForInput}>
              <Camera className="w-4 h-4 mr-1" />
              Yakala
            </Button>
            <Button size="sm" variant="secondary" onClick={handleCapture}>
              <Sparkles className="w-4 h-4 mr-1" />
              Analiz Et
            </Button>
            <Button size="sm" variant="secondary" onClick={switchCamera}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
            <Bot className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="font-medium mb-2">CanvasFlow AI Asistan</h3>
            <p className="text-sm max-w-[300px]">
              Sesli komutlar, görsel analiz ve akıllı içerik yönetimi için size yardımcı olabilirim.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 max-w-[300px]">
              {[
                'Canvas düzenle',
                'Video ara',
                'Widget ekle',
                'Notları organize et'
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2 group',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {/* Image attachment */}
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Attached"
                      className="max-w-full rounded-md mb-2 max-h-48 object-cover"
                    />
                  )}
                  
                  {/* Voice indicator */}
                  {message.metadata?.isVoice && (
                    <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                      <Mic className="w-3 h-3" />
                      Sesli mesaj
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="text-sm whitespace-pre-wrap">
                    {formatContent(message.content)}
                  </div>
                  
                  {/* Tool calls */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="text-xs opacity-70 mb-1">Kullanılan araçlar:</div>
                      {message.toolCalls.map((tool, i) => (
                        <div key={i} className="text-xs bg-background/50 rounded px-2 py-1 mb-1">
                          {tool.name}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyMessage(message.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => speak(message.content)}
                      >
                        <Volume2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="px-4 py-2 border-t">
          <div className="relative inline-block">
            <img
              src={capturedImage}
              alt="Captured"
              className="h-20 rounded-lg object-cover"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => setCapturedImage(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Voice Input Status */}
      {voiceInput.isListening && (
        <div className="px-4 py-2 border-t bg-primary/5 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">
            {voiceInput.interimTranscript || 'Dinleniyor...'}
          </span>
          {voiceInput.transcript && (
            <span className="text-sm">{voiceInput.transcript}</span>
          )}
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 border-t bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      
      {/* Input Area */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-end gap-2">
          {/* Voice Input Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={voiceInput.isListening ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={toggleVoiceInput}
                  disabled={!voiceInput.isSupported}
                >
                  {voiceInput.isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {voiceInput.isListening ? 'Dinlemeyi durdur' : 'Sesli giriş'}
              </TooltipContent>
            </Tooltip>
            
            {/* Camera Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={camera.isActive ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={toggleCamera}
                >
                  {camera.isActive ? (
                    <CameraOff className="w-4 h-4" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {camera.isActive ? 'Kamerayı kapat' : 'Kamerayı aç'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                voiceInput.isListening
                  ? 'Konuşun...'
                  : 'Mesajınızı yazın...'
              }
              className="min-h-[44px] max-h-[120px] pr-12 resize-none"
              disabled={isLoading}
            />
          </div>
          
          {/* Send/Stop Button */}
          {isLoading ? (
            <Button variant="outline" size="icon" onClick={stopGeneration}>
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() && !capturedImage}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Quick Actions */}
        {!isLoading && messages.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={regenerateLastResponse}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Yeniden üret
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedAIChat;
