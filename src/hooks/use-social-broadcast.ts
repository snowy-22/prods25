'use client';

import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/realtime-js';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

export interface BroadcastEvent {
  type: 'follow' | 'like' | 'comment' | 'share' | 'mention' | 'item_created' | 'item_updated';
  actor: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  target: {
    id: string;
    type: string;
    title: string;
  };
  message: string;
  timestamp: string;
}

export function useSocialBroadcast() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [broadcastEvents, setBroadcastEvents] = useState<BroadcastEvent[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Subscribe to realtime broadcast
  useEffect(() => {
    if (!user?.id) return;

    const broadcastChannel = supabase
      .channel(`social:${user.id}`, {
        config: { broadcast: { self: true } }
      })
      .on('broadcast', { event: 'social_event' }, (payload) => {
        const event = payload.payload as BroadcastEvent;
        
        // Add to events list
        setBroadcastEvents(prev => [event, ...prev].slice(0, 50));
        
        // Show toast notification
        toast({
          title: event.actor.username,
          description: event.message,
          variant: 'default'
        });
      })
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
      })
      .on('presence', { event: 'leave' }, () => {
        setIsConnected(false);
      })
      .subscribe();

    setChannel(broadcastChannel);

    return () => {
      broadcastChannel.unsubscribe();
    };
  }, [user?.id, toast]);

  // Broadcast event
  const broadcastEvent = useCallback(async (event: BroadcastEvent) => {
    if (!channel) return;

    channel.send({
      type: 'broadcast',
      event: 'social_event',
      payload: event
    });
  }, [channel]);

  // Broadcast follow
  const broadcastFollow = useCallback(async (followingId: string, followingUsername: string) => {
    if (!user?.id) return;

    const event: BroadcastEvent = {
      type: 'follow',
      actor: {
        id: user.id,
        username: user.user_metadata?.username || 'Unknown',
        avatar_url: user.user_metadata?.avatar_url
      },
      target: {
        id: followingId,
        type: 'user',
        title: followingUsername
      },
      message: `${user.user_metadata?.username || 'Birisi'} seni takip etmeye başladı`,
      timestamp: new Date().toISOString()
    };

    await broadcastEvent(event);
  }, [user?.id, broadcastEvent]);

  // Broadcast like
  const broadcastLike = useCallback(async (itemId: string, itemTitle: string) => {
    if (!user?.id) return;

    const event: BroadcastEvent = {
      type: 'like',
      actor: {
        id: user.id,
        username: user.user_metadata?.username || 'Unknown',
        avatar_url: user.user_metadata?.avatar_url
      },
      target: {
        id: itemId,
        type: 'item',
        title: itemTitle
      },
      message: `${user.user_metadata?.username || 'Birisi'} "${itemTitle}" beğendi`,
      timestamp: new Date().toISOString()
    };

    await broadcastEvent(event);
  }, [user?.id, broadcastEvent]);

  // Broadcast comment
  const broadcastComment = useCallback(async (itemId: string, itemTitle: string, comment: string) => {
    if (!user?.id) return;

    const event: BroadcastEvent = {
      type: 'comment',
      actor: {
        id: user.id,
        username: user.user_metadata?.username || 'Unknown',
        avatar_url: user.user_metadata?.avatar_url
      },
      target: {
        id: itemId,
        type: 'item',
        title: itemTitle
      },
      message: `${user.user_metadata?.username || 'Birisi'} "${itemTitle}" komentar yaptı: "${comment.substring(0, 50)}..."`,
      timestamp: new Date().toISOString()
    };

    await broadcastEvent(event);
  }, [user?.id, broadcastEvent]);

  return {
    isConnected,
    broadcastEvents,
    broadcastEvent,
    broadcastFollow,
    broadcastLike,
    broadcastComment
  };
}
