/**
 * Realtime Folder Contents Synchronization Hook
 * Syncs folder contents changes instantly to database via Supabase subscriptions
 */

import { useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ContentItem } from '@/lib/initial-content';
import { useToast } from './use-toast';

interface FolderSyncOptions {
  enabled?: boolean;
  debounceMs?: number;
  onRemoteChange?: (changes: ContentItem[]) => void;
}

export function useRealtimeFolderSync(
  folderId: string | null,
  items: ContentItem[],
  onUpdate: (items: ContentItem[]) => void,
  options: FolderSyncOptions = {}
) {
  const { enabled = true, debounceMs = 500, onRemoteChange } = options;
  const { toast } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<string>(JSON.stringify(items));
  const supabaseRef = useRef(
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
  );

  // Sync local changes to database (debounced)
  useEffect(() => {
    if (!enabled || !folderId) return;

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if items actually changed
    const currentJson = JSON.stringify(items);
    if (currentJson === lastSyncRef.current) return;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/content/sync-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderId,
            items: items,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          lastSyncRef.current = currentJson;
          // Successfully synced
        } else {
          console.error('Failed to sync folder contents:', response.statusText);
          toast({
            title: 'Senkronizasyon Hatası',
            description: 'Klasör içeriği senkronize edilemedi',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Folder sync error:', error);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [folderId, items, enabled, debounceMs, toast]);

  // Subscribe to remote changes
  useEffect(() => {
    if (!enabled || !folderId) return;

    const supabase = supabaseRef.current;

    // Listen to folder_content_updated events
    const subscription = supabase
      .channel(`folder:${folderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_items',
          filter: `parent_id=eq.${folderId}`,
        },
        (payload) => {
          console.log('Remote folder content changed:', payload);

          // Fetch updated items
          fetchRemoteItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'content_items',
          filter: `parent_id=eq.${folderId}`,
        },
        (payload) => {
          console.log('New item added to folder:', payload);
          fetchRemoteItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'content_items',
          filter: `parent_id=eq.${folderId}`,
        },
        (payload) => {
          console.log('Item removed from folder:', payload);
          fetchRemoteItems();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to folder updates:', folderId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel subscription error');
        }
      });

    async function fetchRemoteItems() {
      try {
        const response = await fetch(`/api/content/folder/${folderId}`);
        const data = await response.json();

        if (data.items) {
          onUpdate(data.items);
          if (onRemoteChange) {
            onRemoteChange(data.items);
          }
          lastSyncRef.current = JSON.stringify(data.items);

          toast({
            title: 'Klasör Güncellendi',
            description: 'Uzaktan yapılan değişiklikler yüklendi',
          });
        }
      } catch (error) {
        console.error('Failed to fetch remote folder items:', error);
      }
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [folderId, enabled, onUpdate, onRemoteChange, toast]);
}
