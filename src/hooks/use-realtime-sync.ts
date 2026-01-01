"use client";

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { ContentItem } from '@/lib/initial-content';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeSync(enabled: boolean = true) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { tabs, activeTabId, updateTab } = useAppStore();

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    
    // Create a broadcast channel for multi-tab sync
    const broadcastChannel = new BroadcastChannel('tv25-sync');
    
    // Listen to changes from other browser tabs
    broadcastChannel.onmessage = (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'ITEM_UPDATED':
          // Find the tab containing this item and update it
          tabs.forEach(tab => {
            if (tab.id === payload.tabId) {
              const updateChildren = (items: ContentItem[] | undefined): ContentItem[] | undefined => {
                if (!items) return items;
                return items.map(item => 
                  item.id === payload.itemId 
                    ? { ...item, ...payload.updates }
                    : { ...item, children: updateChildren(item.children) }
                );
              };
              
              updateTab(tab.id, {
                children: updateChildren(tab.children),
                updatedAt: new Date().toISOString()
              });
            }
          });
          break;
          
        case 'ITEM_ADDED':
          tabs.forEach(tab => {
            if (tab.id === payload.tabId && tab.activeViewId === payload.parentId) {
              const addToChildren = (items: ContentItem[] | undefined, parentId: string): ContentItem[] | undefined => {
                if (!items) return items;
                return items.map(item => {
                  if (item.id === parentId) {
                    return {
                      ...item,
                      children: [...(item.children || []), payload.newItem]
                    };
                  }
                  return { ...item, children: addToChildren(item.children, parentId) };
                });
              };
              
              if (tab.id === payload.parentId) {
                updateTab(tab.id, {
                  children: [...(tab.children || []), payload.newItem]
                });
              } else {
                updateTab(tab.id, {
                  children: addToChildren(tab.children, payload.parentId)
                });
              }
            }
          });
          break;
          
        case 'ITEM_DELETED':
          tabs.forEach(tab => {
            if (tab.id === payload.tabId) {
              const removeFromChildren = (items: ContentItem[] | undefined): ContentItem[] | undefined => {
                if (!items) return items;
                return items
                  .filter(item => item.id !== payload.itemId)
                  .map(item => ({ ...item, children: removeFromChildren(item.children) }));
              };
              
              updateTab(tab.id, {
                children: removeFromChildren(tab.children)
              });
            }
          });
          break;
      }
    };

    // Subscribe to Supabase Realtime (when items table exists)
    const channel = supabase
      .channel('items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items'
        },
        (payload) => {
          console.log('Supabase realtime event:', payload);
          
          // Broadcast to other tabs via BroadcastChannel
          if (payload.eventType === 'INSERT') {
            broadcastChannel.postMessage({
              type: 'ITEM_ADDED',
              payload: {
                tabId: payload.new.tab_id,
                parentId: payload.new.parent_id,
                newItem: payload.new
              }
            });
          } else if (payload.eventType === 'UPDATE') {
            broadcastChannel.postMessage({
              type: 'ITEM_UPDATED',
              payload: {
                tabId: payload.new.tab_id,
                itemId: payload.new.id,
                updates: payload.new
              }
            });
          } else if (payload.eventType === 'DELETE') {
            broadcastChannel.postMessage({
              type: 'ITEM_DELETED',
              payload: {
                tabId: payload.old.tab_id,
                itemId: payload.old.id
              }
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Supabase Realtime status:', status);
      });

    channelRef.current = channel;

    return () => {
      broadcastChannel.close();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [enabled, tabs, activeTabId, updateTab]);

  // Helper function to broadcast changes
  const broadcastChange = (type: string, payload: any) => {
    const channel = new BroadcastChannel('canvasflow-sync');
    channel.postMessage({ type, payload });
    channel.close();
  };

  return {
    broadcastItemUpdate: (tabId: string, itemId: string, updates: Partial<ContentItem>) => {
      broadcastChange('ITEM_UPDATED', { tabId, itemId, updates });
    },
    broadcastItemAdd: (tabId: string, parentId: string, newItem: ContentItem) => {
      broadcastChange('ITEM_ADDED', { tabId, parentId, newItem });
    },
    broadcastItemDelete: (tabId: string, itemId: string) => {
      broadcastChange('ITEM_DELETED', { tabId, itemId });
    }
  };
}
