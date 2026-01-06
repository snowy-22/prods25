/**
 * Supabase Real-time Messaging Hooks
 * Live updates for conversations, messages, calls
 */

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Message, Conversation, Call } from './messaging-types';
import { RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient();

// ============================================
// MESSAGES REAL-TIME HOOK
// ============================================
export function useRealtimeMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Initial fetch
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to real-time updates
    const messageChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? (payload.new as Message) : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    setChannel(messageChannel);

    return () => {
      messageChannel.unsubscribe();
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string, type: MessageType = MessageType.TEXT, mediaUrl?: string) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: user.user_metadata?.username || 'User',
        sender_avatar: user.user_metadata?.avatar_url,
        content,
        type,
        media_url: mediaUrl,
      }).select().single();

      return { data, error };
    },
    [conversationId]
  );

  return { messages, loading, sendMessage, channel };
}

// ============================================
// CONVERSATIONS REAL-TIME HOOK
// ============================================
export function useRealtimeConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id, conversations(*)')
        .eq('user_id', user.id);

      if (!error && data) {
        const convs = data
          .map((d: any) => d.conversations)
          .filter(Boolean)
          .sort((a: any, b: any) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        setConversations(convs);
      }
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to conversation updates
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          // Refetch on any change
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { conversations, loading };
}

// ============================================
// TYPING INDICATOR HOOK
// ============================================
export function useTypingIndicator(conversationId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const userName = (payload.new as any).user_name;
          setTypingUsers((prev) => Array.from(new Set([...prev, userName])));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const userName = (payload.old as any).user_name;
          setTypingUsers((prev) => prev.filter((u) => u !== userName));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const userName = user.user_metadata?.username || 'User';

      if (isTyping) {
        // Insert or update typing indicator
        await supabase.from('typing_indicators').upsert({
          conversation_id: conversationId,
          user_id: user.id,
          user_name: userName,
          expires_at: new Date(Date.now() + 5000).toISOString(),
        });
      } else {
        // Remove typing indicator
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }
    },
    [conversationId]
  );

  return { typingUsers, setTyping };
}

// ============================================
// CALLS REAL-TIME HOOK
// ============================================
export function useRealtimeCall(callId?: string) {
  const [call, setCall] = useState<Call | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!callId) return;

    const fetchCall = async () => {
      const { data } = await supabase
        .from('calls')
        .select('*, call_participants(*)')
        .eq('id', callId)
        .single();

      if (data) {
        setCall(data as any);
        setParticipants((data as any).call_participants || []);
      }
    };

    fetchCall();

    const channel = supabase
      .channel(`call:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${callId}`,
        },
        (payload) => {
          setCall(payload.new as Call);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_participants',
          filter: `call_id=eq.${callId}`,
        },
        () => {
          fetchCall();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [callId]);

  return { call, participants };
}

// ============================================
// ONLINE PRESENCE HOOK
// ============================================
export function useOnlinePresence(userId?: string) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`presence:${userId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setIsOnline(Object.keys(state).length > 0);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return isOnline;
}
