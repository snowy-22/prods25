'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Message,
  Conversation,
  Group,
  MessageSearchFilter,
  MessageType,
  Call,
  CallStatus,
} from '@/lib/messaging-types';
import { MessageCircle2, Users, Search, Phone, Video, Clock, Send } from 'lucide-react';
import { GroupManagement } from './group-management';

interface MessagingPanelProps {
  conversations: Conversation[];
  groups: Group[];
  messages: Record<string, Message[]>;
  calls: Call[];
  currentUserId: string;
  currentConversationId?: string;
  currentGroupId?: string;
  onAddMessage: (message: Message) => void;
  onSearchMessages: (filter: MessageSearchFilter) => Message[];
  onCreateGroup: (group: any) => void;
  onUpdateGroup: (groupId: string, updates: any) => void;
  onRemoveGroupMember: (groupId: string, userId: string) => void;
  onUpdateMemberRole: (groupId: string, userId: string, role: any) => void;
  onStartCall: (call: Call) => void;
  onSetCurrentConversation: (conversationId: string) => void;
  onSetCurrentGroup: (groupId: string) => void;
}

export function MessagingPanel({
  conversations,
  groups,
  messages,
  calls,
  currentUserId,
  currentConversationId,
  currentGroupId,
  onAddMessage,
  onSearchMessages,
  onCreateGroup,
  onUpdateGroup,
  onRemoveGroupMember,
  onUpdateMemberRole,
  onStartCall,
  onSetCurrentConversation,
  onSetCurrentGroup,
}: MessagingPanelProps) {
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'direct' | 'groups' | 'search' | 'calls'>(
    'direct'
  );

  const directConversations = useMemo(
    () => conversations.filter((c) => c.type === 'direct'),
    [conversations]
  );

  const groupConversations = useMemo(
    () => conversations.filter((c) => c.type === 'group'),
    [conversations]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return onSearchMessages({
      query: searchQuery,
    });
  }, [searchQuery, onSearchMessages]);

  const activeCalls = useMemo(
    () => calls.filter((c) => c.status === CallStatus.ACTIVE || c.status === CallStatus.RINGING),
    [calls]
  );

  const currentConversation = conversations.find((c) => c.id === currentConversationId);
  const currentMessages = currentConversationId ? messages[currentConversationId] || [] : [];

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentConversationId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: currentConversationId,
      senderId: currentUserId,
      senderName: 'You',
      content: messageInput,
      type: MessageType.TEXT,
      reactions: {},
      mentions: [],
      isEdited: false,
      readBy: [currentUserId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddMessage(newMessage);
    setMessageInput('');
  };

  return (
    <div className="h-full flex flex-col bg-card/60 backdrop-blur-md">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
          <TabsTrigger value="direct" className="gap-2">
            <MessageCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Direkt</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Gruplar</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Ara</span>
          </TabsTrigger>
          <TabsTrigger value="calls" className="gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Çağrılar</span>
          </TabsTrigger>
        </TabsList>

        {/* Direct Messages */}
        <TabsContent value="direct" className="flex-1 flex flex-col min-h-0 p-3">
          <ScrollArea className="flex-1 mb-3">
            <div className="space-y-2 pr-4">
              {directConversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Henüz sohbet yok
                </p>
              ) : (
                directConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => onSetCurrentConversation(conv.id)}
                    className={cn(
                      'w-full text-left p-2 rounded-lg border text-sm transition-colors',
                      currentConversationId === conv.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {conv.id}
                      </span>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage?.content || 'Mesaj yok'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Message Area */}
          {currentConversation && (
            <div className="border-t pt-3 space-y-2">
              <ScrollArea className="h-40 border rounded-lg p-2 mb-2 bg-muted/20">
                <div className="space-y-2 pr-4">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'p-2 rounded-lg text-sm',
                        msg.senderId === currentUserId
                          ? 'bg-primary/20 ml-6 text-right'
                          : 'bg-muted/50 mr-6'
                      )}
                    >
                      <p>{msg.content}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Mesaj yazın..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="h-8"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Groups */}
        <TabsContent value="groups" className="flex-1 min-h-0 p-0">
          <GroupManagement
            groups={groups}
            currentUserId={currentUserId}
            onCreateGroup={onCreateGroup}
            onUpdateGroup={onUpdateGroup}
            onRemoveGroupMember={onRemoveGroupMember}
            onUpdateMemberRole={onUpdateMemberRole}
          />
        </TabsContent>

        {/* Search */}
        <TabsContent value="search" className="flex-1 flex flex-col min-h-0 p-3">
          <Input
            placeholder="Mesajlarda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3 h-8"
          />
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchQuery ? 'Sonuç bulunamadı' : 'Ara'}
                </p>
              ) : (
                searchResults.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => onSetCurrentConversation(msg.conversationId)}
                    className="p-2 rounded-lg border hover:bg-muted/50 cursor-pointer text-sm"
                  >
                    <p className="font-medium text-xs text-muted-foreground">
                      {msg.senderName}
                    </p>
                    <p className="truncate">{msg.content}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Calls */}
        <TabsContent value="calls" className="flex-1 flex flex-col min-h-0 p-3">
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {activeCalls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aktif çağrı yok
                </p>
              ) : (
                activeCalls.map((call) => (
                  <Card key={call.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {call.type === 'audio' ? (
                            <Phone className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <Video className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {call.initiatorName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {call.participants.length} katılımcı
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0">
                          {call.status === CallStatus.RINGING ? 'Çınlıyor' : 'Aktif'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
