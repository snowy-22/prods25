
'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Canvas from '@/components/canvas';
import { useAppStore } from '@/lib/store';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { ContentItem, initialContent, addHierarchyAndStats, widgetTemplates } from '@/lib/initial-content';
import { createClient } from '@/lib/supabase/client';
import { LayoutMode } from '@/lib/layout-engine';

function PopoutContent() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get('itemId');
  const layoutMode = (searchParams.get('layoutMode') as LayoutMode) || 'grid';
  
  const [allRawItems] = useLocalStorage<ContentItem[]>('tv25_items', initialContent);
  const supabase = createClient();
  const setUser = useAppStore(s => s.setUser);
  const setUsername = useAppStore(s => s.setUsername);

  // Supabase Auth Listener (Minimal)
  useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
              setUser(session.user);
              setUsername(session.user.user_metadata.username || session.user.email?.split('@')[0] || 'User');
          }
      });
      return () => subscription.unsubscribe();
  }, [supabase, setUser, setUsername]);

  const allItems = useMemo(() => {
      const itemsToProcess = allRawItems && allRawItems.length > 0 ? allRawItems : initialContent;
      try {
          return addHierarchyAndStats(itemsToProcess);
      } catch (e) {
          console.error("Hierarchy build failed", e);
          return itemsToProcess;
      }
  }, [allRawItems]);

  const activeItem = useMemo(() => {
      if (!itemId) return null;
      return allItems.find(i => i.id === itemId) || null;
  }, [itemId, allItems]);

  const activeViewChildren = useMemo(() => {
      if (!activeItem) return [];
      // If it's a container, show its children
      if (['folder', 'list', 'player', 'inventory', 'space', 'devices', 'calendar', 'saved-items', 'root'].includes(activeItem.type)) {
          return allItems.filter(i => i.parentId === activeItem.id).sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      return [activeItem];
  }, [activeItem, allItems]);

  if (!activeItem) return <div className="flex items-center justify-center h-screen text-muted-foreground">Öğe bulunamadı veya yükleniyor...</div>;

  return (
    <div className="w-full h-screen bg-background overflow-hidden">
        <Canvas
            items={activeViewChildren}
            allItems={allItems}
            activeView={activeItem}
            layoutMode={layoutMode}
            onUpdateItem={() => {}} // Read-only in popout for now? Or implement sync later
            deleteItem={() => {}}
            copyItem={() => {}}
            setHoveredItemId={() => {}}
            selectedItemIds={[]}
            onItemClick={() => {}}
            isLoading={false}
            onLoadComplete={() => {}}
            onShare={() => {}}
            onShowInfo={() => {}}
            onNewItemInPlayer={() => {}}
            onPreviewItem={() => {}}
            activeViewId={activeItem.id}
            username="User"
            isBeingDraggedOver={false}
            focusedItemId={null}
            onFocusCleared={() => {}}
            onAddItem={() => {}}
            onSaveItem={() => {}}
            gridSize={300}
            widgetTemplates={widgetTemplates}
        />
    </div>
  );
}

export default function PopoutPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Yükleniyor...</div>}>
            <PopoutContent />
        </Suspense>
    );
}
