'use client';

/**
 * AI Chat Test Component
 * 
 * Test interface for Genkit AI + Supabase integration
 * Features:
 * - Send messages to AI assistant
 * - View conversation history
 * - Test tool calling (YouTube search, web scraping)
 * - Conversation management (pin, archive, delete)
 * - Real-time message updates
 */

import { useAppStore } from '@/lib/store';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Plus, Archive, Pin, Trash2, ChevronLeft, Sparkles, Youtube, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  tool_calls?: any[];
  tool_results?: any[];
}

interface Conversation {
  id: string;
  title: string;
  message_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  last_message_at: string;
}

export function AIChatTest() {
  const { 
    sendAIMessage, 
    getAIConversations, 
    getAIConversationWithMessages,
    deleteAIConversation,
    archiveAIConversation,
    pinAIConversation,
    updateAIConversationTitle
  } = useAppStore();

  // State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string>();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [showArchived]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConvId) {
      loadMessages(currentConvId);
    } else {
      setMessages([]);
    }
  }, [currentConvId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convs = await getAIConversations({ 
        includeArchived: showArchived,
        limit: 50 
      });
      
      // Sort: pinned first, then by last message time
      const sorted = convs.sort((a: Conversation, b: Conversation) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.last_message_at || b.created_at).getTime() - 
               new Date(a.last_message_at || a.created_at).getTime();
      });
      
      setConversations(sorted);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const conversation = await getAIConversationWithMessages(conversationId);
      setMessages(conversation.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input;
    setInput('');
    setLoading(true);

    // Optimistically add user message to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const result = await sendAIMessage(userMessage, {
        conversationId: currentConvId,
        priority: 'speed',
        streaming: false
      });

      // Update conversation ID if new
      if (!currentConvId) {
        setCurrentConvId(result.conversationId);
      }

      // Reload messages to get actual data from DB
      await loadMessages(result.conversationId);
      
      // Reload conversation list
      await loadConversations();
    } catch (error) {
      console.error('AI error:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setCurrentConvId(undefined);
    setMessages([]);
    setInput('');
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    
    try {
      await deleteAIConversation(convId);
      
      // Clear if deleting current conversation
      if (convId === currentConvId) {
        handleNewConversation();
      }
      
      await loadConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleArchiveConversation = async (convId: string, archived: boolean) => {
    try {
      await archiveAIConversation(convId, archived);
      await loadConversations();
    } catch (error) {
      console.error('Failed to archive conversation:', error);
    }
  };

  const handlePinConversation = async (convId: string, pinned: boolean) => {
    try {
      await pinAIConversation(convId, pinned);
      await loadConversations();
    } catch (error) {
      console.error('Failed to pin conversation:', error);
    }
  };

  const handleUpdateTitle = async (convId: string, newTitle: string) => {
    try {
      await updateAIConversationTitle(convId, newTitle);
      setEditingTitle(undefined);
      await loadConversations();
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderToolCalls = (toolCalls?: any[]) => {
    if (!toolCalls || toolCalls.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {toolCalls.map((call, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            {call.name === 'youtubeSearch' && <Youtube className="w-3 h-3" />}
            {call.name === 'pageScraper' && <Globe className="w-3 h-3" />}
            <span>Used {call.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const currentConversation = conversations.find(c => c.id === currentConvId);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar: Conversations */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Conversations
            </h2>
            <Button
              onClick={handleNewConversation}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowArchived(false)}
              variant={!showArchived ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              Active
            </Button>
            <Button
              onClick={() => setShowArchived(true)}
              variant={showArchived ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              Archived
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <AnimatePresence>
              {conversations.map(conv => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setCurrentConvId(conv.id)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all group relative",
                    currentConvId === conv.id 
                      ? "bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 shadow-sm" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingTitle === conv.id ? (
                        <input
                          type="text"
                          defaultValue={conv.title}
                          autoFocus
                          onBlur={(e) => handleUpdateTitle(conv.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateTitle(conv.id, e.currentTarget.value);
                            } else if (e.key === 'Escape') {
                              setEditingTitle(undefined);
                            }
                          }}
                          className="w-full bg-white dark:bg-gray-800 border rounded px-2 py-1 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div 
                          className="font-semibold truncate text-sm flex items-center gap-1"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingTitle(conv.id);
                          }}
                        >
                          {conv.is_pinned && <Pin className="w-3 h-3 text-blue-500" />}
                          {conv.title}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {conv.message_count} messages • {formatDate(conv.last_message_at || conv.created_at)}
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinConversation(conv.id, !conv.is_pinned);
                        }}
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        title={conv.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className={cn(
                          "w-3 h-3",
                          conv.is_pinned && "fill-current text-blue-500"
                        )} />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveConversation(conv.id, !conv.is_archived);
                        }}
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        title={conv.is_archived ? 'Unarchive' : 'Archive'}
                      >
                        <Archive className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0 text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {conversations.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main: Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentConversation ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg">{currentConversation.title}</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currentConversation.message_count} messages
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg">New Conversation</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Start chatting with AI
                    </p>
                  </div>
                </>
              )}
            </div>

            {currentConversation && (
              <Button
                onClick={handleNewConversation}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                New Chat
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <AnimatePresence>
              {messages.map((message, idx) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' && "justify-end"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className={cn(
                    "rounded-2xl px-4 py-3 max-w-[80%]",
                    message.role === 'user' 
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" 
                      : message.role === 'system'
                        ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                        : "bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
                  )}>
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    
                    {message.tool_calls && renderToolCalls(message.tool_calls)}
                    
                    <div className={cn(
                      "text-xs mt-2 opacity-70",
                      message.role === 'user' ? "text-white" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {formatDate(message.created_at)}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">U</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask AI anything... (Try: 'Search YouTube for React tutorials')"
                className="flex-1 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-6"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>

            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>💡 Try asking: "Search YouTube for tutorials", "Explain React hooks", "What's trending?"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
