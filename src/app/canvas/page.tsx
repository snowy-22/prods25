
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback, CSSProperties, useRef, DragEvent } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  Sheet,
  SheetContent,
} from '@/components/ui/sidebar';
import Canvas from '../../components/canvas';
import {
  ContentItem,
  ItemType,
  addHierarchyAndStats,
  widgetTemplates,
  socialUsers,
  socialContent,
  initialContent,
  SortOption,
  SortDirection,
} from '@/lib/initial-content';
import { fetchOembedMetadata } from '@/lib/oembed-helpers';
import { useToast } from '@/hooks/use-toast';
import PrimarySidebar from '../../components/primary-sidebar';
import SecondarySidebar from '../../components/secondary-sidebar';
import { defaultDrafts } from '@/lib/layouts/broadcast-layout';
import HeaderControls from '../../components/header-controls';
import HeaderInfo from '../../components/header-info';
import GlobalSearch from '../../components/global-search';
import ShareDialog from '../../components/share-dialog';
import SaveDialog from '../../components/save-dialog';
import StyleSettingsPanel from '../../components/style-settings-panel';
import { cn } from '@/lib/utils';
import { AppLogo } from '../../components/icons/app-logo';
import { AiChatDialog } from '../../components/ai-chat-dialog';
import { Message } from '@/ai/flows/assistant-schema';
import AiGuide from '../../components/ai-guide';
import ItemInfoDialog from '../../components/item-info-dialog';
import SettingsDialog from '../../components/settings-dialog';
import { useDevice } from '@/hooks/use-device';
import { useBackgroundTabManager } from '@/hooks/use-background-tab-manager';
import PreviewDialog from '../../components/preview-dialog';
import ShortcutsDialog from '../../components/shortcuts-dialog';
import SpacesPanel from '@/components/spaces-panel';
import DevicesPanel from '@/components/devices-panel';
import { useLocalStorage } from '@/hooks/use-local-storage';
import TabBar from '@/components/tab-bar';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MiniGridPreview from '@/components/mini-grid-preview';
import { Button } from '@/components/ui/button';
import { Import, Info, MessageSquare, BarChart, ChevronUp, ChevronDown, Eye, Maximize, Minimize } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import WebsitePreview from '@/components/widgets/WebsitePreview';
import { createClient } from '@/lib/supabase/client';
import { LayoutMode } from '@/lib/layout-engine';
import { useAuth } from '@/providers/auth-provider';


const MainContentInternal = ({ username }: { username: string | null }) => {
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();
    const [allRawItems, setAllRawItems] = useLocalStorage<ContentItem[]>('canvasflow_items', initialContent);
    const itemsRef = useRef<ContentItem[]>(allRawItems);
    
    useEffect(() => {
        if (!allRawItems || allRawItems.length === 0) {
            setAllRawItems(initialContent);
        } else if (allRawItems.length > 0) {
            // Ensure root folder exists in allRawItems
            const hasRoot = allRawItems.some(i => i.id === 'root');
            if (!hasRoot) {
                // Root missing, merge with initialContent
                const rootItem = initialContent.find(i => i.id === 'root');
                if (rootItem) {
                    setAllRawItems([rootItem, ...allRawItems]);
                }
            }
        }
        itemsRef.current = allRawItems.length > 0 ? allRawItems : initialContent;
    }, [allRawItems, setAllRawItems]);

    const updateItems = useCallback((updater: (prev: ContentItem[]) => ContentItem[]) => {
        const next = updater(itemsRef.current);
        itemsRef.current = next;
        setAllRawItems(next);
    }, [setAllRawItems]);

    // Migration for missing folders
    useEffect(() => {
        const currentItems = itemsRef.current;
        const missingFolders = initialContent.filter(initialItem => 
            ['root', 'saved-items', 'welcome-folder', 'trash-folder'].includes(initialItem.id) &&
            !currentItems.some(existingItem => existingItem.id === initialItem.id)
        );

        if (missingFolders.length > 0) {
            updateItems(prev => [...prev, ...missingFolders]);
            toast({ title: "İçerik Güncellendi", description: "Temel klasörler geri yüklendi." });
        }
    }, [updateItems, toast]);

    // Reset all grid spans to 1x1 for equal sizing (one-time migration)
    useEffect(() => {
        const hasResetGridSpans = localStorage.getItem('canvasflow_grid_spans_reset');
        if (!hasResetGridSpans) {
            const needsReset = itemsRef.current.some(item => 
                (item.gridSpanCol && item.gridSpanCol !== 1) || 
                (item.gridSpanRow && item.gridSpanRow !== 1)
            );

            if (needsReset) {
                updateItems(prev => prev.map(item => ({
                    ...item,
                    gridSpanCol: 1,
                    gridSpanRow: 1
                })));
                localStorage.setItem('canvasflow_grid_spans_reset', 'true');
                toast({ title: "Düzen Güncellendi", description: "Tüm öğeler eşit boyuta getirildi." });
            }
        }
    }, [updateItems, toast]);

    const [isSyncing, setIsSyncing] = useState(false);
    const hasSyncedRef = useRef(false);
    
    const allItems = useMemo(() => {
        const itemsToProcess = allRawItems && allRawItems.length > 0 ? allRawItems : initialContent;
        try {
            return addHierarchyAndStats(itemsToProcess);
        } catch (e) {
            console.error("Hierarchy build failed, using raw items", e);
            return itemsToProcess;
        }
    }, [allRawItems]);

    const sidebarItems = useMemo(() => allItems, [allItems]);

    const state = useAppStore();
    const setUsername = useAppStore(s => s.setUsername);
    const setUser = useAppStore(s => s.setUser);

    // Supabase Auth Listener
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setUser(session.user);
                setUsername(session.user.user_metadata.username || session.user.email?.split('@')[0] || 'User');
            } else {
                setUser(null);
                setUsername(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, setUser, setUsername]);

    // Sync local data to Supabase when logged in
    useEffect(() => {
        const syncData = async () => {
            if (state.user && !hasSyncedRef.current && !isSyncing) {
                setIsSyncing(true);
                try {
                    // Check if user already has items in DB
                    const { data: existingItems, error: fetchError } = await supabase
                        .from('items')
                        .select('id')
                        .limit(1);

                    if (fetchError) throw fetchError;

                    // If no items in DB, sync local items
                    if (!existingItems || existingItems.length === 0) {
                        const itemsToSync = allRawItems.map(item => ({
                            id: item.id,
                            user_id: state.user!.id,
                            parent_id: item.parentId,
                            type: item.type,
                            title: item.title,
                            content: item.content,
                            url: item.url,
                            icon: item.icon,
                            styles: item.styles,
                            order: item.order,
                            metadata: {
                                thumbnail_url: item.thumbnail_url,
                                author_name: item.author_name,
                                published_at: item.published_at,
                                viewCount: item.viewCount,
                                likeCount: item.likeCount,
                                commentCount: item.commentCount,
                                logo: item.logo,
                                coverImage: item.coverImage,
                                gridSketch: item.gridSketch
                            }
                        }));

                        const { error: upsertError } = await supabase
                            .from('items')
                            .upsert(itemsToSync);

                        if (upsertError) throw upsertError;
                        toast({ title: "Bulut Senkronizasyonu", description: "Verileriniz başarıyla buluta aktarıldı." });
                    } else {
                        // If items exist in DB, fetch them and update local storage
                        const { data: dbItems, error: dbFetchError } = await supabase
                            .from('items')
                            .select('*');

                        if (dbFetchError) throw dbFetchError;

                        if (dbItems && dbItems.length > 0) {
                            const mappedItems: ContentItem[] = dbItems.map(item => ({
                                ...item,
                                parentId: item.parent_id,
                                thumbnail_url: item.metadata?.thumbnail_url,
                                author_name: item.metadata?.author_name,
                                published_at: item.metadata?.published_at,
                                viewCount: item.metadata?.viewCount,
                                likeCount: item.metadata?.likeCount,
                                commentCount: item.metadata?.commentCount,
                                logo: item.metadata?.logo,
                                coverImage: item.metadata?.coverImage,
                                gridSketch: item.metadata?.gridSketch
                            }));
                            setAllRawItems(mappedItems);
                        }
                    }
                    hasSyncedRef.current = true;
                } catch (e: any) {
                    console.error("Sync failed", e);
                    toast({ title: "Senkronizasyon Hatası", description: e.message, variant: "destructive" });
                } finally {
                    setIsSyncing(false);
                }
            }
        };

        syncData();
    }, [state.user, supabase, toast, isSyncing, allRawItems]);

    useEffect(() => {
      if (username) {
        if (state.username !== username) {
          setUsername(username);
        }
        // Initialize tabs if empty
        if (state.tabs.length === 0) {
          const currentItems = allRawItems.length > 0 ? allRawItems : initialContent;
          const rootItem = currentItems.find(i => i.id === 'root') || currentItems[0];
          if (rootItem) {
            state.openInNewTab(rootItem, currentItems);
          }
        }
      }
    }, [username, state.username, setUsername, state.tabs.length, state.openInNewTab, allRawItems]);

    // Fix invalid activeTabId
    useEffect(() => {
        if (state.tabs.length > 0 && !state.tabs.find(t => t.id === state.activeTabId)) {
            state.setActiveTab(state.tabs[0].id);
        }
    }, [state.tabs, state.activeTabId, state.setActiveTab]);

    const activeTab = useMemo(() => state.tabs.find(t => t.id === state.activeTabId), [state.tabs, state.activeTabId]);
    const activeViewId = activeTab?.activeViewId || 'root';

    const activeView = useMemo(() => {
        const findAndBuildView = (viewId: string): ContentItem | null => {
            let view = allItems.find(i => i.id === viewId);
            if (!view && viewId === 'root') {
                view = initialContent.find(i => i.id === 'root');
            }
            if (!view) return null;

            let children = allItems.filter(i => i.parentId === view.id);
            
            // If no children found and this is root, use initialContent as fallback
            if (children.length === 0 && viewId === 'root' && allItems.length > 0) {
                // allItems is non-empty but has no children - might be data corruption
                // Fallback to initialContent children
                children = initialContent.filter(i => i.parentId === 'root');
            } else if (children.length === 0 && viewId === 'root') {
                // allItems is empty or root has no children at all
                children = initialContent.filter(i => i.parentId === 'root');
            }
            
            // DEBUG
            if (viewId === 'root') {
                console.log('[DEBUG] Root view found:', { 
                    viewId, 
                    viewFound: !!view, 
                    allItemsCount: allItems.length,
                    childrenCount: children.length,
                    childrenIds: children.map(c => c.id),
                    rootFromInitialContent: !!initialContent.find(i => i.id === 'root'),
                    allItemsIncludeRoot: allItems.some(i => i.id === 'root'),
                    parentIdRootItems: allItems.filter(i => i.parentId === 'root').map(c => c.id),
                    initialContentRootItems: initialContent.filter(i => i.parentId === 'root').map(c => c.id)
                });
            }

            // Apply sorting based on view's sort settings
            const sortOption = view.sortOption || 'manual';
            const sortDirection = view.sortDirection || 'asc';

            children = children.sort((a, b) => {
                if (sortOption === 'manual') {
                    return (a.order ?? 0) - (b.order ?? 0);
                }
                if (sortOption === 'name') {
                    return sortDirection === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
                }
                if (sortOption === 'createdAt') {
                    return sortDirection === 'asc' ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
                if (sortOption === 'updatedAt') {
                    return sortDirection === 'asc' ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime() : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                }
                if (sortOption === 'averageRating') {
                    return sortDirection === 'asc' ? (a.averageRating || 0) - (b.averageRating || 0) : (b.averageRating || 0) - (a.averageRating || 0);
                }
                if (sortOption === 'itemCount') {
                    return sortDirection === 'asc' ? (a.itemCount || 0) - (b.itemCount || 0) : (b.itemCount || 0) - (a.itemCount || 0);
                }
                if (sortOption === 'platformViews') {
                    return sortDirection === 'asc' ? (a.platformViewCount || 0) - (b.platformViewCount || 0) : (b.platformViewCount || 0) - (a.platformViewCount || 0);
                }
                if (sortOption === 'platformLikes') {
                    return sortDirection === 'asc' ? (a.platformLikeCount || 0) - (b.platformLikeCount || 0) : (b.platformLikeCount || 0) - (a.platformLikeCount || 0);
                }
                if (sortOption === 'sourceViews') {
                    return sortDirection === 'asc' ? (a.viewCount || 0) - (b.viewCount || 0) : (b.viewCount || 0) - (a.viewCount || 0);
                }
                if (sortOption === 'sourceLikes') {
                    return sortDirection === 'asc' ? (a.likeCount || 0) - (b.likeCount || 0) : (b.likeCount || 0) - (a.likeCount || 0);
                }
                if (sortOption === 'sourceCreatedAt') {
                    if (!a.published_at && !b.published_at) return 0;
                    if (!a.published_at) return sortDirection === 'asc' ? 1 : -1;
                    if (!b.published_at) return sortDirection === 'asc' ? -1 : 1;
                    return sortDirection === 'asc' ? new Date(a.published_at).getTime() - new Date(b.published_at).getTime() : new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
                }
                return 0;
            });
            
            return { ...view, children: children } as ContentItem;
        };
        
        return findAndBuildView(activeViewId);
    }, [activeViewId, allItems]);

    const activeViewChildren = useMemo(() => activeView?.children || [], [activeView]);

    // Track background tab media/timer state
    const { isSuspended } = useBackgroundTabManager(
        activeTab?.id || '',
        activeViewId,
        activeViewChildren
    );

    // Fix invalid activeViewId
    useEffect(() => {
        if (activeTab && !activeView && itemsRef.current.length > 0) {
             const currentItems = itemsRef.current;
             const rootExists = currentItems.some(i => i.id === 'root');
             const fallbackId = rootExists ? 'root' : currentItems[0].id;
             
             if (activeTab.activeViewId !== fallbackId) {
                 state.updateTab(activeTab.id, { activeViewId: fallbackId });
             }
        }
    }, [activeTab, activeView, state.updateTab]);
    
    const updateItem = useCallback(async (itemId: string, updates: Partial<ContentItem>) => {
        // Push to undo/redo stack if this is a contentItem update
        if (activeTab && !updates.activeViewId) {
            state.pushUndoRedo(activeTab.id, activeTab.activeViewId);
        }

        updateItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId
                    ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                    : item
            )
        );

        if (state.user) {
            const { error } = await supabase
                .from('items')
                .update(updates)
                .eq('id', itemId);
            
            if (error) {
                console.error("Supabase update failed", error);
                toast({ title: "Güncelleme Hatası", description: "Değişiklikler buluta kaydedilemedi.", variant: "destructive" });
            }
        }
    }, [updateItems, state.user, supabase, toast, activeTab, state]);

    const bulkUpdateItems = useCallback(async (itemIds: string[], updates: Partial<ContentItem>) => {
        updateItems(prevItems =>
            prevItems.map(item =>
                itemIds.includes(item.id)
                    ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                    : item
            )
        );

        if (state.user) {
            const { error } = await supabase
                .from('items')
                .update(updates)
                .in('id', itemIds);
            
            if (error) {
                console.error("Supabase bulk update failed", error);
                toast({ title: "Güncelleme Hatası", description: "Değişiklikler buluta kaydedilemedi.", variant: "destructive" });
            }
        }
    }, [updateItems, state.user, supabase, toast]);

    const addItem = useCallback(async (item: ContentItem) => {
        setAllRawItems(prevItems => [...prevItems, item]);

        if (state.user) {
            const { error } = await supabase
                .from('items')
                .insert({
                    id: item.id,
                    user_id: state.user.id,
                    parent_id: item.parentId,
                    type: item.type,
                    title: item.title,
                    content: item.content,
                    url: item.url,
                    icon: item.icon,
                    styles: item.styles,
                    order: item.order,
                    metadata: {
                        thumbnail_url: item.thumbnail_url,
                        author_name: item.author_name,
                        published_at: item.published_at,
                        viewCount: item.viewCount,
                        likeCount: item.likeCount,
                        commentCount: item.commentCount,
                        logo: item.logo,
                        coverImage: item.coverImage,
                        gridSketch: item.gridSketch
                    }
                });

            if (error) {
                console.error("Supabase insert failed", error);
                toast({ title: "Ekleme Hatası", description: "Yeni öğe buluta kaydedilemedi.", variant: "destructive" });
            }
        }
    }, [setAllRawItems, state.user, supabase, toast]);

    const deleteItem = useCallback(async (itemId: string) => {
        const childrenIdsToDelete: string[] = [];
        const visited = new Set<string>();
        
        const findChildren = (parentId: string) => {
            if (visited.has(parentId)) return;
            visited.add(parentId);
            
            const children = itemsRef.current.filter(i => i.parentId === parentId && i.id !== parentId);
            for (const child of children) {
                childrenIdsToDelete.push(child.id);
                findChildren(child.id);
            }
        };
        findChildren(itemId);
        const idsToDelete = [itemId, ...childrenIdsToDelete];

        updateItems(prevItems => prevItems.filter(item => !idsToDelete.includes(item.id)));

        if (state.user) {
            const { error } = await supabase
                .from('items')
                .delete()
                .in('id', idsToDelete);

            if (error) {
                console.error("Supabase delete failed", error);
                toast({ title: "Silme Hatası", description: "Öğeler buluttan silinemedi.", variant: "destructive" });
            }
        }
    }, [updateItems, state.user, supabase, toast]);
     const addItemToView = useCallback(async (itemData: Partial<ContentItem> & { type: ItemType }, parentId: string | null, index?: number): Promise<ContentItem> => {
        const now = new Date().toISOString();
        const finalParentId = parentId;
        const currentItems = itemsRef.current;
        
        // If item already exists in our state, we are moving it
        if (itemData.id && currentItems.some(i => i.id === itemData.id)) {
            const existingItem = currentItems.find(i => i.id === itemData.id)!;
            const updatedItem = { 
                ...existingItem, 
                parentId: finalParentId,
                updatedAt: now,
                gridSpanCol: existingItem.gridSpanCol || 1,
                gridSpanRow: existingItem.gridSpanRow || 1
            };

            updateItems(prevItems => {
                const filtered = prevItems.filter(i => i.id !== itemData.id);
                const parentChildren = filtered.filter(i => i.parentId === finalParentId);
                
                let targetIndex = index ?? parentChildren.length;
                
                const shiftedItems = filtered.map(item => {
                    if (item.parentId === finalParentId && (item.order || 0) >= targetIndex) {
                        return { ...item, order: (item.order || 0) + 1 };
                    }
                    return item;
                });

                return [...shiftedItems, { ...updatedItem, order: targetIndex }];
            });

            return updatedItem;
        }

        let finalItemData: Partial<ContentItem> & { type: ItemType } = { ...itemData };

        if (itemData.url && ['website', 'video', 'image', 'audio'].includes(itemData.type)) {
             try {
                const metadata = await fetchOembedMetadata(itemData.url);
                 if (!('error' in metadata)) {
                    finalItemData = { 
                        ...finalItemData, 
                        title: metadata.title || finalItemData.title,
                        thumbnail_url: metadata.thumbnail_url,
                        author_name: metadata.author_name,
                        published_at: metadata.published_at,
                        viewCount: metadata.viewCount,
                        likeCount: metadata.likeCount,
                        commentCount: metadata.commentCount,
                        html: metadata.html,
                        provider_name: metadata.provider_name,
                        icon: metadata.icon || finalItemData.icon
                    };
                 }
             } catch (e) {
                 console.error("Failed to fetch metadata", e);
             }
        }
        
        if (!finalItemData.title && finalItemData.url) {
            try {
                const urlObj = new URL(finalItemData.url);
                finalItemData.title = urlObj.hostname;
            } catch {
                finalItemData.title = 'Yeni Öğe';
            }
        }
        
        // Re-fetch current items after potential async metadata fetch
        const latestItems = itemsRef.current;
        const parentChildren = latestItems.filter(i => i.parentId === finalParentId);
        let targetIndex;
        if (index !== undefined) {
          targetIndex = index;
        } else {
            const lastSelectedItemId = state.selectedItemIds[state.selectedItemIds.length - 1];
            if (lastSelectedItemId) {
                const lastSelectedIndex = parentChildren.findIndex(i => i.id === lastSelectedItemId);
                if (lastSelectedIndex !== -1) {
                    targetIndex = lastSelectedIndex + 1;
                } else {
                    targetIndex = parentChildren.length;
                }
            } else {
                 targetIndex = parentChildren.length;
            }
        }

        const baseItem: Omit<ContentItem, 'type'|'title'> = {
            id: `${finalItemData.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            url: '', 
            createdAt: now, 
            updatedAt: now, 
            parentId: finalParentId, 
            order: targetIndex,
            styles: { width: '100%', height: '100%' },
            gridSpanCol: 1,
            gridSpanRow: 1
        };
        
        const newItem: ContentItem = {
            ...baseItem,
            title: finalItemData.title || `Yeni ${finalItemData.type}`,
            icon: finalItemData.icon || finalItemData.type as any,
            ...finalItemData,
        };
        
        updateItems(prevItems => {
            // Shift order of subsequent items
            const shiftedItems = prevItems.map(item => {
                if (item.parentId === finalParentId && (item.order || 0) >= targetIndex!) {
                    return { ...item, order: (item.order || 0) + 1 };
                }
                return item;
            });
            return [...shiftedItems, newItem];
        });

        // Save to database if user is logged in
        if (state.user) {
            const { error } = await supabase
                .from('items')
                .insert({
                    id: newItem.id,
                    user_id: state.user.id,
                    parent_id: newItem.parentId,
                    type: newItem.type,
                    title: newItem.title,
                    content: newItem.content,
                    url: newItem.url,
                    icon: newItem.icon,
                    styles: newItem.styles,
                    order: newItem.order,
                    metadata: {
                        thumbnail_url: newItem.thumbnail_url,
                        author_name: newItem.author_name,
                        published_at: newItem.published_at,
                        viewCount: newItem.viewCount,
                        likeCount: newItem.likeCount,
                        commentCount: newItem.commentCount,
                        logo: newItem.logo,
                        coverImage: newItem.coverImage,
                        gridSketch: newItem.gridSketch
                    }
                });

            if (error) {
                console.error("Supabase insert failed", error);
                toast({ title: "Ekleme Hatası", description: "Yeni öğe buluta kaydedilemedi.", variant: "destructive" });
            }
        }

        return newItem;
    }, [updateItems, state.selectedItemIds, state.user, supabase, toast]);
    
    const addFolderWithItems = useCallback(async (folderName: string, itemsToAdd: { type: ItemType; url: string }[], parentId: string | null) => {
        console.log(`Creating folder "${folderName}" with ${itemsToAdd.length} items`);
        const folder = await addItemToView({ type: 'folder', title: folderName }, parentId);
        console.log(`Folder created with ID: ${folder.id}`);
        
        for (let i = 0; i < itemsToAdd.length; i++) {
            const itemData = itemsToAdd[i];
            console.log(`Adding item ${i + 1}/${itemsToAdd.length} to folder:`, itemData.url);
            await addItemToView({ ...itemData, url: itemData.url }, folder.id);
        }
        console.log(`Finished adding ${itemsToAdd.length} items to folder`);

    }, [addItemToView]);
    
    // Listen for custom event from scan page
    useEffect(() => {
        const handleAddScannedItems = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { items } = customEvent.detail;
            
            if (items && Array.isArray(items)) {
                 const savedItemsFolderId = 'saved-items'; 
                 items.forEach(item => {
                    const { url, ...restOfItem } = item;
                    addItemToView(restOfItem, savedItemsFolderId);
                });
            }
        };

        window.addEventListener('addScannedItems', handleAddScannedItems);
        return () => {
            window.removeEventListener('addScannedItems', handleAddScannedItems);
        };
    }, [addItemToView]);


    const handleGridDrop = useCallback((result: DropResult) => {
        if (!result.destination) return;

        // Handle Tab Reordering
        if (result.type === 'tab') {
            const newTabs = [...state.tabs];
            const [reorderedTab] = newTabs.splice(result.source.index, 1);
            newTabs.splice(result.destination.index, 0, reorderedTab);
            state.setTabs(newTabs);
            return;
        }

        // Handle Item Drop onto Tab
        if (result.type === 'canvas-item' && result.destination.droppableId.startsWith('tab-drop-')) {
            const targetTabId = result.destination.droppableId.replace('tab-drop-', '');
            const targetTab = state.tabs.find(t => t.id === targetTabId);
            if (!targetTab) return;

            const draggedItemId = result.draggableId;
            const isDraggedItemSelected = state.selectedItemIds.includes(draggedItemId);
            const itemsToMove = isDraggedItemSelected ? state.selectedItemIds : [draggedItemId];

            itemsToMove.forEach(id => {
                updateItem(id, { parentId: targetTab.activeViewId === 'root' ? null : targetTab.activeViewId });
            });
            
            state.clearSelection();
            return;
        }

        // Handle Item Reordering in Canvas
        if (result.type === 'canvas-item' && result.destination.droppableId === 'canvas-droppable') {
            if (!activeViewChildren) return;
            
            const items = [...activeViewChildren];
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);

            const orderMap = new Map(items.map((item, index) => [item.id, index]));
            const currentParentId = activeViewId === 'root' ? null : activeViewId;

            setAllRawItems(prev => prev.map(item => {
                if (item.parentId === currentParentId && orderMap.has(item.id)) {
                    return { ...item, order: orderMap.get(item.id) };
                }
                return item;
            }));
        }
    }, [activeViewChildren, allRawItems, activeViewId, setAllRawItems, state, updateItem]);


    const handleSetView = useCallback((item: ContentItem | null) => {
        if (!activeTab) return;
        const newViewId = item ? item.id : 'root';
        state.updateTab(activeTab.id, { 
            activeViewId: newViewId,
            history: [...activeTab.history.slice(0, activeTab.historyIndex + 1), newViewId],
            historyIndex: activeTab.historyIndex + 1
        });
    }, [activeTab, state]);

    const onItemClick = useCallback((item: ContentItem, event: React.MouseEvent | React.TouchEvent) => {
        event.stopPropagation();
        const isContainer = ['folder', 'list', 'inventory', 'space', 'calendar', 'saved-items', 'root'].includes(item.type);
        const isPlayer = ['video', 'website', 'iframe', '3dplayer'].includes(item.type);

        if (event.detail === 2 && (isContainer || isPlayer)) { // Double click
             state.openInNewTab(item, allItems);
        } else { // Single click
            const orderedIds = activeViewChildren.map((i) => i.id);
            state.setSelectedItem(item, event, orderedIds);
        }
    }, [allItems, state, activeViewChildren]);

    const tabSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const handleDragUpdate = useCallback((update: any) => {
        if (update.type === 'canvas-item' && update.destination?.droppableId.startsWith('tab-drop-')) {
            const targetTabId = update.destination.droppableId.replace('tab-drop-', '');
            if (targetTabId !== state.activeTabId) {
                if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);
                tabSwitchTimeoutRef.current = setTimeout(() => {
                    state.setActiveTab(targetTabId);
                }, 800); // 800ms delay before switching tabs
            }
        } else {
            if (tabSwitchTimeoutRef.current) {
                clearTimeout(tabSwitchTimeoutRef.current);
                tabSwitchTimeoutRef.current = null;
            }
        }
    }, [state]);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const isUiHidden = state.isUiHidden;
    const setIsUiHidden = state.setIsUiHidden;
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [gridSize, setGridSize] = useLocalStorage('canvas-grid-size', 280);
    const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useLocalStorage<number>('canvasflow_sidebar_width', 320);
    const [rightSidebarWidth, setRightSidebarWidth] = useLocalStorage<number>('canvasflow_right_sidebar_width', 380);
    const [isResizing, setIsResizing] = useState(false);
    const [isRightResizing, setIsRightResizing] = useState(false);

    // Left sidebar resize handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    // Right sidebar resize handlers
    const handleRightMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsRightResizing(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = e.clientX - 56; // 56px primary sidebar sabit genişlik
            if (newWidth >= 200 && newWidth <= 600) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => setIsResizing(false);

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, setSidebarWidth]);

    useEffect(() => {
        const handleRightMouseMove = (e: MouseEvent) => {
            if (!isRightResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 280 && newWidth <= 700) {
                setRightSidebarWidth(newWidth);
            }
        };

        const handleRightMouseUp = () => setIsRightResizing(false);

        if (isRightResizing) {
            document.addEventListener('mousemove', handleRightMouseMove);
            document.addEventListener('mouseup', handleRightMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleRightMouseMove);
            document.removeEventListener('mouseup', handleRightMouseUp);
        };
    }, [isRightResizing, setRightSidebarWidth]);

    const handleUserCardClick = useCallback((user: { id: string; title: string }) => {
        state.addChatPanel({
            id: user.id,
            isOpen: true,
            isPinned: false,
            isDraggable: true,
            x: 100 + (state.chatPanels.length * 20),
            y: 100 + (state.chatPanels.length * 20),
            width: 400,
            height: 500,
            zIndex: 100 + state.chatPanels.length
        });
    }, [state]);

    const toggleAiChatPanel = useCallback(() => {
        handleUserCardClick({ id: 'asistan', title: 'Asistan' });
    }, [handleUserCardClick]);

    const setActiveViewCallback = useCallback((item: ContentItem) => {
        state.openInNewTab(item, sidebarItems);
    }, [state, sidebarItems]);

    const onAddWidgetCallback = useCallback((widgetData: any) => {
        addItemToView(widgetData, activeViewId);
    }, [addItemToView, activeViewId]);

    const handleShareDialogOpenChange = useCallback((open: boolean) => {
        if (!open) {
            state.setItemToShare(null);
        }
    }, [state]);

    const handleSaveDialogOpenChange = useCallback((open: boolean) => {
        if (!open) {
            state.setItemToSave(null);
        }
    }, [state]);

    const handleItemInfoDialogOpenChange = useCallback(() => {
        state.setItemForInfo(null);
    }, [state]);

    const handlePreviewDialogOpenChange = useCallback(() => {
        state.setItemForPreview(null);
    }, [state]);

    const handleToolCall = useCallback(async (toolName: string, args: any) => {
        console.log(`Tool call: ${toolName}`, args);
        
        switch (toolName) {
            case 'highlightElement':
                const elementId = args.elementId;
                const element = document.querySelector(`[data-item-id="${elementId}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'animate-pulse');
                    setTimeout(() => {
                        element.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'animate-pulse');
                    }, 3000);
                } else {
                    toast({
                        title: "Öğe bulunamadı",
                        description: `${elementId} ID'li öğe şu anki görünümde değil.`,
                        variant: "destructive"
                    });
                }
                break;
                
            case 'addPlayerTool':
                const { url, title, type } = args;
                await addItemToView({
                    type: (type || 'video') as ItemType,
                    url: url,
                    title: title || 'AI Tarafından Eklendi',
                    icon: (type === 'video' ? 'video' : 'file') as any
                }, activeViewId === 'root' ? null : activeViewId);
                toast({
                    title: "Öğe Eklendi",
                    description: `${title || url} başarıyla tuvale eklendi.`
                });
                break;
                
            default:
                console.warn(`Unhandled tool call: ${toolName}`);
        }
    }, [activeViewId, addItemToView, toast]);
    const [isLeftSidebarHovered, setIsLeftSidebarHovered] = useState(false);
    const [isTopBarHovered, setIsTopBarHovered] = useState(false);
    const [isBottomBarHovered, setIsBottomBarHovered] = useState(false);
    const [isRightSidebarHovered, setIsRightSidebarHovered] = useState(false);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrl = e.ctrlKey || e.metaKey;
            const target = e.target as HTMLElement | null;
            if (target && (target.closest('input, textarea') || target.getAttribute('contenteditable') === 'true')) {
                return;
            }

            if (isCtrl && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                setIsUiHidden(!isUiHidden);
            }
            
            // Undo/Redo shortcuts
            if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (activeTab && (activeTab.undoRedoIndex || 0) > 0) {
                    state.undo(activeTab.id);
                    const newIndex = (activeTab.undoRedoIndex || 0) - 1;
                    const item = activeTab.undoRedoStack?.[newIndex];
                    if (item) {
                        state.updateTab(activeTab.id, { activeViewId: item.activeViewId });
                    }
                }
            }
            
            if (isCtrl && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                if (activeTab && (activeTab.undoRedoIndex || 0) < ((activeTab.undoRedoStack || []).length - 1)) {
                    state.redo(activeTab.id);
                    const newIndex = (activeTab.undoRedoIndex || 0) + 1;
                    const item = activeTab.undoRedoStack?.[newIndex];
                    if (item) {
                        state.updateTab(activeTab.id, { activeViewId: item.activeViewId });
                    }
                }
            }

            // Clipboard shortcuts
            if (isCtrl && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                if (state.selectedItemIds.length === 0) return;
                const itemsToCopy = sidebarItems.filter((i) => state.selectedItemIds.includes(i.id));
                if (itemsToCopy.length > 0) {
                    state.setClipboard(itemsToCopy.map((item) => ({ item, operation: 'copy' })));
                }
            }

            if (isCtrl && e.key.toLowerCase() === 'x') {
                e.preventDefault();
                if (state.selectedItemIds.length === 0) return;
                const itemsToCut = sidebarItems.filter((i) => state.selectedItemIds.includes(i.id));
                if (itemsToCut.length > 0) {
                    state.setClipboard(itemsToCut.map((item) => ({ item, operation: 'cut' })));
                }
            }

            if (isCtrl && e.key.toLowerCase() === 'v') {
                if (state.clipboard.length === 0) return;
                e.preventDefault();
                state.clipboard.forEach(({ item, operation }) => {
                    const payload = operation === 'copy' ? { ...item, id: undefined } : item;
                    addItemToView(payload as any, activeViewId === 'root' ? null : activeViewId);
                });
                if (state.clipboard[0]?.operation === 'cut') {
                    state.setClipboard([]);
                }
            }

            // Delete key for selected items
            if (e.key === 'Delete' && state.selectedItemIds.length > 0) {
                e.preventDefault();
                const itemsToDelete = sidebarItems.filter((i) => state.selectedItemIds.includes(i.id) && i.isDeletable !== false);
                itemsToDelete.forEach((item) => deleteItem(item.id));
                state.clearSelection();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isUiHidden, setIsUiHidden, activeTab, state, sidebarItems, addItemToView, activeViewId]);

    // Broadcasting Logic
    const [activeBroadcastTargetId, setActiveBroadcastTargetId] = useState<string | null>(null);
    const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

    useEffect(() => {
        broadcastChannelRef.current = new BroadcastChannel('canvasflow_broadcast');
        
        broadcastChannelRef.current.onmessage = (event) => {
            const { type, payload, targetId } = event.data;
            
            // If we are the target, update our state
            if (targetId === 'all' || targetId === 'current-session') {
                if (type === 'NAVIGATE') {
                    const item = allItems.find(i => i.id === payload.viewId);
                    if (item) {
                        state.updateTab(state.activeTabId, { activeViewId: item.id });
                    } else if (payload.viewId === 'root') {
                        state.updateTab(state.activeTabId, { activeViewId: 'root' });
                    }
                }
            }
        };

        return () => {
            broadcastChannelRef.current?.close();
        };
    }, [allItems, state]);

    // Send broadcast when view changes
    useEffect(() => {
        if (activeBroadcastTargetId && broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
                type: 'NAVIGATE',
                payload: { viewId: activeViewId },
                targetId: activeBroadcastTargetId
            });
        }
    }, [activeViewId, activeBroadcastTargetId]);

    const devices = useMemo(() => {
        return allItems.filter(i => i.parentId === 'devices-folder');
    }, [allItems]);

    
    if (!activeTab || !activeView) {
        return <div className="flex h-screen w-full items-center justify-center bg-background"><AppLogo className="h-16 w-16 text-primary" /></div>;
    }
    
    const isSingleItemView = activeTab.url && ['website', 'video', 'image', 'scan'].includes(activeTab.type);

    return (
        <DragDropContext onDragEnd={handleGridDrop} onDragUpdate={handleDragUpdate}>
            <SidebarProvider open={state.isSecondLeftSidebarOpen} onOpenChange={(open) => state.togglePanel('isSecondLeftSidebarOpen', open)}>
                <div className={cn("flex h-screen w-screen bg-background text-foreground overflow-hidden relative", isUiHidden && "main-ui-hidden")}>
                    {isUiHidden && (
                        <>
                            <div 
                                className="ui-trigger-zone ui-trigger-zone-left"
                                onMouseEnter={() => setIsLeftSidebarHovered(true)}
                            />
                            <div 
                                className="ui-trigger-zone ui-trigger-zone-top"
                                onMouseEnter={() => setIsTopBarHovered(true)}
                            />
                            <div 
                                className="ui-trigger-zone ui-trigger-zone-bottom"
                                onMouseEnter={() => setIsBottomBarHovered(true)}
                            />
                            <div 
                                className="ui-trigger-zone ui-trigger-zone-right"
                                onMouseEnter={() => setIsRightSidebarHovered(true)}
                            />
                        </>
                    )}

                    <div 
                        className={cn(
                            'flex h-full transition-all duration-300 ease-in-out flex-shrink-0', 
                            isUiHidden ? 'fixed left-0 top-0 bottom-0 z-50 shadow-2xl' : 'relative',
                            isUiHidden && !isLeftSidebarHovered ? '-translate-x-full' : 'translate-x-0'
                        )}
                        onMouseEnter={() => isUiHidden && setIsLeftSidebarHovered(true)}
                        onMouseLeave={() => isUiHidden && setIsLeftSidebarHovered(false)}
                    >
                        <PrimarySidebar
                            username={state.username || ''} setUsername={state.setUsername}
                            activeSecondaryPanel={state.activeSecondaryPanel} setActiveSecondaryPanel={state.setActiveSecondaryPanel}
                            isSecondLeftSidebarOpen={state.isSecondLeftSidebarOpen} toggleSecondLeftSidebar={(open) => state.togglePanel('isSecondLeftSidebarOpen', open)}
                            toggleSearchDialog={() => state.updateSearchPanel({ isOpen: true })}
                            toggleSettingsDialog={() => setIsSettingsOpen(true)}
                            onUpdateItem={updateItem} allItems={allItems} onSetView={(item) => item ? state.updateTab(state.activeTabId, { activeViewId: item.id }) : handleSetView(null) }
                            unreadMessagesCount={0} unreadNotificationsCount={0}
                            onShare={state.setItemToShare}
                            sessionId={"session-123"}
                            devices={devices}
                            activeBroadcastTargetId={activeBroadcastTargetId}
                            onSetBroadcastTarget={setActiveBroadcastTargetId}
                            isSpacesPanelOpen={state.isSpacesPanelOpen}
                            isDevicesPanelOpen={state.isDevicesPanelOpen}
                            toggleSpacesPanel={() => state.togglePanel('isSpacesPanelOpen')}
                            toggleDevicesPanel={() => state.togglePanel('isDevicesPanelOpen')}
                        />
                        {state.isSecondLeftSidebarOpen && (
                            <div className="border-r relative" style={{ width: `${sidebarWidth}px` }}>
                                <Sidebar className="w-full h-full">
                             <SecondarySidebar
                                    type={state.activeSecondaryPanel || 'library'}
                                    allItems={sidebarItems}
                                    widgetTemplates={widgetTemplates}
                                    onSetView={(item) => item ? state.updateTab(state.activeTabId, { activeViewId: item.id }) : handleSetView(null) }
                                    activeView={activeView}
                                    draggedItem={state.draggedItem}
                                    setDraggedItem={state.setDraggedItem}
                                    onDeleteItem={deleteItem}
                                    onSetClipboard={state.setClipboard}
                                    onPaste={()=>{}}
                                    clipboard={state.clipboard}
                                    onShowInfo={state.setItemForInfo}
                                    onPreviewItem={state.setItemForPreview}
                                    onShare={state.setItemToShare}
                                    onTogglePinItem={(item) => updateItem(item.id, { isPinned: !item.isPinned })}
                                    onRenameItem={(id, name) => updateItem(id, { title: name })}
                                    onUpdateItem={updateItem}
                                    onOpenInNewTab={state.openInNewTab}
                                    onToolCall={handleToolCall}
                                    username={state.username || 'Guest'}
                                    onNewFolder={() => addItemToView({ type: 'folder' }, activeViewId)}
                                    onNewList={() => addItemToView({ type: 'list' }, activeViewId)}
                                    onNewPlayer={() => addItemToView({type: 'player', title: 'URL Ekle', content: ''}, activeViewId)}
                                    expandedItems={state.expandedItems}
                                    onToggleExpansion={state.toggleExpansion}
                                    onSaveItem={(item) => {
                                        state.setItemToSave(item);
                                    }}
                                    selectedItemIds={state.selectedItemIds}
                                    onItemClick={onItemClick}
                                    socialUsers={socialUsers} 
                                    socialContent={socialContent}
                                    onWidgetClick={(widgetData) => addItemToView(widgetData as any, activeViewId)}
                                    onAddItem={addItemToView}
                                    onAddFolderWithItems={addFolderWithItems}
                                    onUserCardClick={handleUserCardClick}
                                />
                            </Sidebar>
                                <div
                                    onMouseDown={handleMouseDown}
                                    className={cn(
                                        "w-1 hover:w-2 bg-transparent hover:bg-primary/20 cursor-col-resize transition-all absolute right-0 top-0 bottom-0 z-50",
                                        isResizing && "bg-primary/40 w-2"
                                    )}
                                />
                            </div>
                        )}
                    </div>
                    
                    <div id="main-column" className="flex flex-col flex-1 h-full relative min-w-0">

                         <div 
                             className={cn(
                                 "transition-all duration-500 ease-in-out z-[60] bg-background/60 backdrop-blur-md border-b", 
                                 isUiHidden ? "fixed top-0 left-0 right-0 shadow-lg" : "relative",
                                 isUiHidden && !isTopBarHovered ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
                             )}
                             onMouseEnter={() => isUiHidden && setIsTopBarHovered(true)}
                             onMouseLeave={() => isUiHidden && setIsTopBarHovered(false)}
                          >
                              <div className="p-2 flex items-center justify-between gap-4">
                                <HeaderInfo
                                        activeView={activeView} allItems={sidebarItems}
                                        onNavigateHistory={(direction) => {
                                            if (direction === 'back') {
                                                const currentItem = sidebarItems.find(i => i.id === activeViewId);
                                                if (currentItem?.parentId) {
                                                    state.updateTab(state.activeTabId, { activeViewId: currentItem.parentId });
                                                } else if (activeViewId !== 'root') {
                                                    state.updateTab(state.activeTabId, { activeViewId: 'root' });
                                                }
                                            }
                                        }}
                                        onNavigateSibling={(direction) => {
                                            const currentItem = sidebarItems.find(i => i.id === activeViewId);
                                            const parentId = currentItem?.parentId || null;
                                            const siblings = sidebarItems
                                                .filter(i => i.parentId === parentId)
                                                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                                            
                                            const currentIndex = siblings.findIndex(s => s.id === activeViewId);
                                            if (direction === 'next-sibling' && currentIndex < siblings.length - 1) {
                                                state.updateTab(state.activeTabId, { activeViewId: siblings[currentIndex + 1].id });
                                            } else if (direction === 'prev-sibling' && currentIndex > 0) {
                                                state.updateTab(state.activeTabId, { activeViewId: siblings[currentIndex - 1].id });
                                            }
                                        }}
                                        onNavigateToRoot={() => state.updateTab(state.activeTabId, { activeViewId: 'root' })}
                                        onUpdateItem={updateItem} username={state.username || 'Guest'}
                                        onShare={state.setItemToShare}
                                        onSaveItem={(item) => {
                                            state.setItemToSave(item);
                                        }}
                                        canNavigateBack={(activeTab?.navigationIndex || 0) > 0}
                                        canNavigateForward={(activeTab?.navigationIndex || 0) < ((activeTab?.navigationHistory || []).length - 1)}
                                        onNavigateBack={() => {
                                            if (activeTab && (activeTab.navigationIndex || 0) > 0) {
                                                state.popNavigationHistory(activeTab.id);
                                                const newIndex = (activeTab.navigationIndex || 0) - 1;
                                                const viewId = activeTab.navigationHistory?.[newIndex];
                                                if (viewId) {
                                                    state.updateTab(activeTab.id, { activeViewId: viewId });
                                                }
                                            }
                                        }}
                                        onNavigateForward={() => {
                                            if (activeTab && (activeTab.navigationIndex || 0) < ((activeTab.navigationHistory || []).length - 1)) {
                                                const newIndex = (activeTab.navigationIndex || 0) + 1;
                                                const viewId = activeTab.navigationHistory?.[newIndex];
                                                if (viewId) {
                                                    state.updateTab(activeTab.id, { activeViewId: viewId, navigationIndex: newIndex });
                                                }
                                            }
                                        }}
                                    />
                                    <HeaderControls
                                        isFullscreen={isFullscreen} toggleFullscreen={() => { 
                                            if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { document.exitFullscreen(); }
                                        }}
                                        isUiHidden={isUiHidden} setIsUiHidden={setIsUiHidden} 
                                        isStyleSettingsOpen={state.isStyleSettingsOpen}
                                        toggleStyleSettingsPanel={() => state.togglePanel('isStyleSettingsOpen')}
                                        gridSize={gridSize}
                                        setGridSize={setGridSize}
                                        layoutMode={activeView?.layoutMode === 'canvas' ? 'canvas' : 'grid'}
                                        onSetLayoutMode={(mode) => activeView && updateItem(activeView.id, { layoutMode: mode })}
                                        activeViewId={activeView?.id}
                                        canUndo={(activeTab?.undoRedoIndex || 0) > 0}
                                        canRedo={(activeTab?.undoRedoIndex || 0) < ((activeTab?.undoRedoStack || []).length - 1)}
                                        onUndo={() => {
                                            if (activeTab && (activeTab.undoRedoIndex || 0) > 0) {
                                                state.undo(activeTab.id);
                                                const newIndex = (activeTab.undoRedoIndex || 0) - 1;
                                                const item = activeTab.undoRedoStack?.[newIndex];
                                                if (item) {
                                                    state.updateTab(activeTab.id, { activeViewId: item.activeViewId });
                                                }
                                            }
                                        }}
                                        onRedo={() => {
                                            if (activeTab && (activeTab.undoRedoIndex || 0) < ((activeTab.undoRedoStack || []).length - 1)) {
                                                state.redo(activeTab.id);
                                                const newIndex = (activeTab.undoRedoIndex || 0) + 1;
                                                const item = activeTab.undoRedoStack?.[newIndex];
                                                if (item) {
                                                    state.updateTab(activeTab.id, { activeViewId: item.activeViewId });
                                                }
                                            }
                                        }}
                                    />
                              </div>
                              <div className={cn(
                                 "transition-all duration-300",
                                 isUiHidden && !isTopBarHovered ? "h-0 overflow-hidden" : "h-auto"
                              )}>
                                <TabBar 
                                    tabs={state.tabs}
                                    activeTabId={state.activeTabId}
                                    onTabClick={state.setActiveTab}
                                    onCloseTab={state.closeTab}
                                    onNewTab={state.createNewTab}
                                    onSetLayout={(cols) => {}}
                                    tabAccessHistory={state.tabAccessHistory}
                                />
                              </div>
                         </div>
                         
                         <div className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden">
                            {state.selectedItemIds.length > 0 && (
                                <div className="absolute top-3 right-3 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-background/90 border shadow-lg backdrop-blur-md">
                                    <span className="text-xs font-semibold">{state.selectedItemIds.length} öğe seçili</span>
                                    <span className="hidden md:inline text-[10px] text-muted-foreground">Shift/Ctrl ile ekle</span>
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => state.clearSelection()}>Temizle</Button>
                                </div>
                            )}
                            {isSingleItemView ? (
                                <WebsitePreview item={activeTab} onLoad={() => {}} />
                            ) : (
                                <Canvas
                                    items={activeViewChildren}
                                    allItems={sidebarItems}
                                    activeView={activeView}
                                    layoutMode={activeView?.layoutMode === 'canvas' ? 'canvas' : 'grid'}
                                    onUpdateItem={updateItem}
                                    onAddItem={addItemToView}
                                    onPaste={() => {
                                        if (state.clipboard.length > 0) {
                                            state.clipboard.forEach(({ item, operation }) => {
                                                const payload = operation === 'copy' ? { ...item, id: undefined } : item;
                                                addItemToView(payload as any, activeViewId);
                                            });
                                            if (state.clipboard[0].operation === 'cut') {
                                                state.setClipboard([]);
                                            }
                                        }
                                    }}
                                    onShowFolderProperties={() => {
                                        if (activeView) state.setItemForInfo(activeView);
                                    }}
                                    widgetTemplates={widgetTemplates}
                                    onSetView={(item) => state.updateTab(state.activeTabId, { activeViewId: item.id })}
                                    deleteItem={deleteItem}
                                    copyItem={(id) => {
                                        const item = sidebarItems.find(i=>i.id === id);
                                        if(item) state.setClipboard([{ item, operation: 'copy' }]);
                                    }}
                                    setHoveredItemId={state.setHoveredItem}
                                    hoveredItemId={state.hoveredItemId}
                                    selectedItemIds={state.selectedItemIds}
                                    onItemClick={onItemClick}
                                    isLoading={false}
                                    onLoadComplete={()=>{}}
                                    onShare={state.setItemToShare}
                                    onShowInfo={state.setItemForInfo}
                                    onNewItemInPlayer={(id, url) => updateItem(id, { url })}
                                    onPreviewItem={state.setItemForPreview}
                                    onOpenInNewTab={(item) => state.openInNewTab(item, allItems)}
                                    activeViewId={activeViewId}
                                    username={state.username || 'Guest'}
                                    isBeingDraggedOver={!!state.draggedItem}
                                    focusedItemId={state.focusedItemId}
                                    onFocusCleared={() => state.setFocusedItem(null)}
                                    onSaveItem={(item) => {
                                        state.setItemToSave(item);
                                    }}
                                    gridSize={gridSize}
                                    isSuspended={activeTab?.isSuspended || false}
                                />
                            )}
                         </div>
                         <div 
                            className={cn(
                                "p-0 bg-background border-t transition-all duration-300",
                                isUiHidden ? "fixed bottom-0 left-0 right-0 z-[60] shadow-[0_-10px_20px_rgba(0,0,0,0.1)]" : "relative",
                                isUiHidden && !isBottomBarHovered ? "translate-y-full" : "translate-y-0"
                            )}
                            onMouseEnter={() => isUiHidden && setIsBottomBarHovered(true)}
                            onMouseLeave={() => isUiHidden && setIsBottomBarHovered(false)}
                         >
                            <Tabs defaultValue="description" className="w-full">
                                <div className="flex justify-between items-center pr-2">
                                    <TabsList className="px-2 border-b-0 w-full justify-start rounded-none bg-transparent">
                                        <TabsTrigger value="description"><Info className="mr-2 h-4 w-4" /> Açıklamalar</TabsTrigger>
                                        <TabsTrigger value="comments"><MessageSquare className="mr-2 h-4 w-4" /> Yorumlar</TabsTrigger>
                                        <TabsTrigger value="analytics"><BarChart className="mr-2 h-4 w-4" /> Analizler</TabsTrigger>
                                    </TabsList>
                                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsBottomPanelCollapsed(!isBottomPanelCollapsed)}>
                                        {isBottomPanelCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {!isBottomPanelCollapsed && (
                                    <>
                                        <TabsContent value="description" className="p-4 h-32 overflow-auto">
                                            <p className="text-sm text-muted-foreground">{activeTab.content || 'Bu görünüm için bir açıklama yok.'}</p>
                                        </TabsContent>
                                        <TabsContent value="comments" className="p-4 h-32 overflow-auto">
                                            <p className="text-sm text-muted-foreground">Yorum özelliği yakında eklenecektir.</p>
                                        </TabsContent>
                                        <TabsContent value="analytics" className="p-4 h-32 overflow-auto">
                                            <p className="text-sm text-muted-foreground">Analiz özelliği yakında eklenecektir.</p>
                                        </TabsContent>
                                    </>
                                )}
                            </Tabs>
                        </div>
                    </div>
                    <div 
                        className={cn(
                            'relative z-40 transition-all duration-300 ease-in-out', 
                            isUiHidden ? 'fixed right-0 top-0 bottom-0 z-50 shadow-2xl' : 'relative',
                            isUiHidden && !isRightSidebarHovered ? 'translate-x-full' : 'translate-x-0'
                        )}
                        style={{ width: state.isStyleSettingsOpen ? `${rightSidebarWidth}px` : '0px' }}
                        onMouseEnter={() => isUiHidden && setIsRightSidebarHovered(true)}
                        onMouseLeave={() => isUiHidden && setIsRightSidebarHovered(false)}
                    >
                        {state.isStyleSettingsOpen && (
                            <>
                                <div
                                    onMouseDown={handleRightMouseDown}
                                    className={cn(
                                        "w-1 hover:w-2 bg-transparent hover:bg-primary/20 cursor-col-resize transition-all absolute left-0 top-0 bottom-0 z-50",
                                        isRightResizing && "bg-primary/40 w-2"
                                    )}
                                />
                                <StyleSettingsPanel
                                    activeView={activeView} onClose={() => state.togglePanel('isStyleSettingsOpen')}
                                    onUpdate={(updates) => updateItem(activeView.id, updates)}
                                    onSyncAll={() => {
                                        const childIds = activeViewChildren.map(i => i.id);
                                        bulkUpdateItems(childIds, { 
                                            styles: {}, 
                                            frameEffect: 'none', 
                                            frameColor: undefined, 
                                            frameWidth: undefined, 
                                            frameStyle: 'solid' 
                                        });
                                        toast({ title: 'Tüm hücreler eşitlendi', description: 'Özel stiller temizlendi.' });
                                    }}
                                />
                            </>
                        )}
                    </div>
                    
                    {state.chatPanels.map(panel => (
                        <AiChatDialog
                            key={panel.id}
                            panelState={panel}
                            scale={100}
                            onOpenChange={(open) => !open && state.removeChatPanel(panel.id)}
                            onStateChange={(newState) => state.updateChatPanel(panel.id, newState)}
                            onFocus={() => {
                                // Bring to front
                                const maxZ = Math.max(...state.chatPanels.map(p => p.zIndex));
                                state.updateChatPanel(panel.id, { zIndex: maxZ + 1 });
                            }}
                            onPinToggle={() => state.updateChatPanel(panel.id, { isPinned: !panel.isPinned })}
                            onToolCall={handleToolCall}
                        />
                    ))}

                    <GlobalSearch
                        panelState={state.searchPanelState}
                        onStateChange={state.updateSearchPanel}
                        allItems={sidebarItems}
                        setActiveView={setActiveViewCallback}
                        setOpenAccordions={()=>{}}
                        toggleAiChatPanel={toggleAiChatPanel}
                        onAddWidget={onAddWidgetCallback}
                        onAddItem={addItemToView}
                        activeViewId={activeViewId}
                        onAddFolderWithItems={addFolderWithItems}
                    />
                    <ShareDialog isOpen={!!state.itemToShare} onOpenChange={handleShareDialogOpenChange} item={state.itemToShare} onUpdateItem={updateItem} />
                    <SaveDialog 
                        isOpen={!!state.itemToSave} 
                        onOpenChange={handleSaveDialogOpenChange} 
                        item={state.itemToSave}
                        savedItemsFolders={sidebarItems.filter(i => i.parentId === 'saved-items' || i.id === 'saved-items')}
                        onSaveToFolder={(itemId, folderId) => {
                            updateItem(itemId, { parentId: folderId });
                            const folder = sidebarItems.find(i => i.id === folderId);
                            toast({ title: 'Kaydedildi', description: `"${folder?.title || 'Kaydedilenler'}" klasörüne eklendi.` });
                        }}
                        onCreateFolder={(folderName) => {
                            addItemToView({ type: 'folder', title: folderName }, 'saved-items');
                        }}
                    />
                    <ItemInfoDialog item={state.itemForInfo} allItems={allItems} onOpenChange={handleItemInfoDialogOpenChange} onUpdateItem={updateItem} />
                     <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} onClearHistory={() => {}}
                        allItems={allItems} onRestoreItem={() => {}} onPermanentlyDeleteItem={(item) => deleteItem(item.id)} onEmptyTrash={() => {}}
                        sessionId={"session-123"}
                        onResetData={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                    />
                     <PreviewDialog
                        item={state.itemForPreview} context={{items: activeViewChildren, currentIndex: activeViewChildren.findIndex(i => i.id === state.itemForPreview?.id) }} 
                        isOpen={!!state.itemForPreview} onOpenChange={handlePreviewDialogOpenChange}
                        onNavigate={(dir) => {
                            const currentIndex = activeViewChildren.findIndex(i => i.id === state.itemForPreview?.id);
                            const newIndex = dir === 'next' ? (currentIndex + 1) % activeViewChildren.length : (currentIndex - 1 + activeViewChildren.length) % activeViewChildren.length;
                            state.setItemForPreview(activeViewChildren[newIndex]);
                        }}
                        onSetView={(item) => state.openInNewTab(item, allItems)}
                        updateItem={updateItem}
                        onShare={state.setItemToShare}
                        onSaveItem={(item) => {
                            state.setItemToSave(item);
                        }}
                    />
                      {isUiHidden && (
                        <div className="fixed top-4 right-4 z-50 group">
                             <div 
                                className={cn("opacity-20 hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 p-1 bg-background/50 backdrop-blur-md rounded-lg border", isTopBarHovered && "opacity-100")}
                                onMouseEnter={() => setIsTopBarHovered(true)}
                                onMouseLeave={() => setIsTopBarHovered(false)}
                             >
                               <AppLogo className="h-8 w-8 ml-2"/>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className='h-9 w-9' onClick={() => setIsUiHidden(false)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Arayüzü Göster</p></TooltipContent>
                                    </Tooltip>
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className='h-9 w-9' onClick={() => { 
                                                if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { document.exitFullscreen(); }
                                            }}>
                                                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    )}
                </div>
            </SidebarProvider>
        </DragDropContext>
    )
}


export default function CanvasPage() {
  const [username] = useLocalStorage<string | null>('canvasflow_username', null);
  const { user, loading } = useAuth();
  const { username: storeUsername } = useAppStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || loading) return;
    
    // Allow access if:
    // 1. User is authenticated via Supabase
    // 2. Has a username in local storage (demo profiles)
    // 3. Has username in store (guest mode)
    const hasAccess = user || username || storeUsername;
    
    if (!hasAccess) {
      router.push('/');
    }
  }, [isHydrated, user, username, storeUsername, loading, router]);

  if (!isHydrated || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <AppLogo className="h-16 w-16 text-primary animate-pulse" />
          <p className="text-muted-foreground text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Display name priority: authenticated user > local storage > store
  const displayName = user?.user_metadata?.username || username || storeUsername || 'User';

  return <MainContentInternal username={displayName} />;
}
