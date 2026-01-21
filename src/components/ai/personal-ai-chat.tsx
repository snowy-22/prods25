'use client';

/**
 * Personal AI Chat Interface
 * Kullanıcının kendi API anahtarlarıyla çalışan AI chat arayüzü
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Sparkles, Settings2, Loader2,
  RefreshCw, Copy, Check, AlertCircle, Zap, Brain,
  MessageSquare, Trash2, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useOpenAI, 
  useAnthropic, 
  useGoogleAI,
  useApiVault
} from '@/lib/api-vault/hooks';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
}

type AIProvider = 'openai' | 'anthropic' | 'google_ai';

const AI_MODELS: Record<AIProvider, { id: string; name: string; maxTokens: number }[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 128000 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 128000 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 16385 },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', maxTokens: 200000 },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', maxTokens: 200000 },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', maxTokens: 200000 },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', maxTokens: 200000 },
  ],
  google_ai: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', maxTokens: 1000000 },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', maxTokens: 2000000 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', maxTokens: 1000000 },
  ],
};

export function PersonalAIChat() {
  const { hasProvider, isUnlocked } = useApiVault();
  const { client: openaiClient } = useOpenAI();
  const { client: anthropicClient } = useAnthropic();
  const { client: googleClient } = useGoogleAI();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check available providers
  const hasOpenAI = hasProvider('openai');
  const hasAnthropic = hasProvider('anthropic');
  const hasGoogleAI = hasProvider('google_ai');
  const hasAnyProvider = hasOpenAI || hasAnthropic || hasGoogleAI;

  // Set default provider based on availability
  useEffect(() => {
    if (hasOpenAI) setSelectedProvider('openai');
    else if (hasAnthropic) setSelectedProvider('anthropic');
    else if (hasGoogleAI) setSelectedProvider('google_ai');
  }, [hasOpenAI, hasAnthropic, hasGoogleAI]);

  // Update model when provider changes
  useEffect(() => {
    const models = AI_MODELS[selectedProvider];
    if (models?.length) {
      setSelectedModel(models[0].id);
    }
  }, [selectedProvider]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  // Create new conversation
  const createConversation = useCallback(() => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'Yeni Sohbet',
      messages: [],
      model: selectedModel,
      createdAt: new Date()
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversation(newConv);
    return newConv;
  }, [selectedModel]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const currentConv = activeConversation || createConversation();
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    
    // Update conversation with user message
    const updatedMessages = [...currentConv.messages, userMessage];
    const updatedConv = { ...currentConv, messages: updatedMessages };
    setActiveConversation(updatedConv);
    setConversations(prev => prev.map(c => c.id === currentConv.id ? updatedConv : c));
    setInput('');
    setIsLoading(true);
    
    try {
      let response: string = '';
      
      // Call appropriate API
      if (selectedProvider === 'openai' && openaiClient) {
        const result = await openaiClient.chat(
          updatedMessages.map(m => ({ role: m.role, content: m.content })),
          selectedModel
        );
        response = result.choices?.[0]?.message?.content || 'Yanıt alınamadı';
      } else if (selectedProvider === 'anthropic' && anthropicClient) {
        const result = await anthropicClient.chat(
          updatedMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
          selectedModel
        );
        response = result.content?.[0]?.text || 'Yanıt alınamadı';
      } else if (selectedProvider === 'google_ai' && googleClient) {
        const result = await googleClient.chat(
          updatedMessages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content })),
          selectedModel
        );
        response = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Yanıt alınamadı';
      } else {
        throw new Error('Seçili sağlayıcı için API bağlantısı bulunamadı');
      }
      
      // Add assistant response
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        model: selectedModel
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      const finalConv = { 
        ...updatedConv, 
        messages: finalMessages,
        title: updatedMessages.length === 1 
          ? userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '')
          : updatedConv.title
      };
      setActiveConversation(finalConv);
      setConversations(prev => prev.map(c => c.id === currentConv.id ? finalConv : c));
      
    } catch (err: any) {
      console.error('AI chat error:', err);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Hata: ${err.message || 'Beklenmeyen bir hata oluştu'}`,
        timestamp: new Date()
      };
      const errorConv = { ...updatedConv, messages: [...updatedMessages, errorMessage] };
      setActiveConversation(errorConv);
      setConversations(prev => prev.map(c => c.id === currentConv.id ? errorConv : c));
    } finally {
      setIsLoading(false);
    }
  };

  // Copy message
  const copyMessage = async (message: Message) => {
    await navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete conversation
  const deleteConversation = (convId: string) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversation?.id === convId) {
      setActiveConversation(null);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // No AI providers configured
  if (!hasAnyProvider) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Brain className="mx-auto h-12 w-12 mb-4 text-primary" />
          <h3 className="text-lg font-medium mb-2">Kişisel AI Asistan</h3>
          <p className="text-muted-foreground mb-4">
            OpenAI, Anthropic veya Google AI anahtarınızı ekleyerek<br />
            kendi AI asistanınızı kullanmaya başlayın
          </p>
          <Button variant="outline">
            AI Sağlayıcı Ekle
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-[600px] gap-4">
      {/* Conversation List */}
      <div className="w-64 border rounded-lg flex flex-col">
        <div className="p-3 border-b">
          <Button 
            className="w-full"
            onClick={createConversation}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Sohbet
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'p-2 rounded-lg cursor-pointer transition-colors group',
                  activeConversation?.id === conv.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => setActiveConversation(conv)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate flex-1">{conv.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-6 w-6 opacity-0 group-hover:opacity-100',
                      activeConversation?.id === conv.id && 'hover:bg-primary-foreground/10'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs opacity-70 mt-0.5">
                  {conv.messages.length} mesaj • {conv.model}
                </div>
              </div>
            ))}
            
            {conversations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Henüz sohbet yok
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 border rounded-lg flex flex-col">
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {activeConversation?.title || 'AI Asistan'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Provider Select */}
            <Select 
              value={selectedProvider} 
              onValueChange={(v: AIProvider) => setSelectedProvider(v)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hasOpenAI && <SelectItem value="openai">OpenAI</SelectItem>}
                {hasAnthropic && <SelectItem value="anthropic">Anthropic</SelectItem>}
                {hasGoogleAI && <SelectItem value="google_ai">Google AI</SelectItem>}
              </SelectContent>
            </Select>
            
            {/* Model Select */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS[selectedProvider]?.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {activeConversation?.messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                <div 
                  className={cn(
                    'max-w-[80%] rounded-lg p-3 group relative',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.model && (
                    <div className="text-xs opacity-50 mt-1">
                      {message.model}
                    </div>
                  )}
                  
                  {/* Copy button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'absolute -right-8 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
                      message.role === 'user' && '-left-8 -right-auto'
                    )}
                    onClick={() => copyMessage(message)}
                  >
                    {copiedId === message.id ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </motion.div>
            )}
            
            {!activeConversation && (
              <div className="text-center py-16 text-muted-foreground">
                <Sparkles className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Hoş Geldiniz!</h3>
                <p className="text-sm">
                  Yeni bir sohbet başlatın veya mevcut bir sohbeti seçin
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mesajınızı yazın... (Enter ile gönderin)"
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
