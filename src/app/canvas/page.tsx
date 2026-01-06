
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
import { ViewportEditor } from '../../components/viewport-editor';
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
import CanvasSpaceControl from '@/components/canvas-space-control';
import { NewTabScreen } from '@/components/new-tab-screen';
import { useLocalStorage } from '@/hooks/use-local-storage';
import TabBar from '@/components/tab-bar';
import { useAppStore } from '@/lib/store';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import HeaderControlsMobile from '@/components/header-controls-mobile';
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
import { useRealtimeSync } from '@/hooks/use-realtime-sync';
import { BottomControlBar } from '@/components/bottom-control-bar';
import { MiniMapOverlay } from '@/components/mini-map-overlay';


const MainContentInternal = ({ username }: { username: string | null }) => {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const responsive = useResponsiveLayout();
    const [isMounted, setIsMounted] = useState(false);
    const [allRawItems, setAllRawItems] = useLocalStorage<ContentItem[]>('canvasflow_items', initialContent);
    const itemsRef = useRef<ContentItem[]>(allRawItems);
    
    // Ensure client-side only rendering to prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    useEffect(() => {
        if (!isMounted) return;
        
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
    }, [allRawItems, setAllRawItems, isMounted]);

    const updateItems = useCallback((updater: (prev: ContentItem[]) => ContentItem[]) => {
        const next = updater(itemsRef.current);
        itemsRef.current = next;
        setAllRawItems(next);
    }, [setAllRawItems]);

    // Migration for missing folders
    useEffect(() => {
        if (!isMounted) return;
        
        const currentItems = itemsRef.current;
        const missingFolders = initialContent.filter(initialItem => 
            ['root', 'saved-items', 'welcome-folder', 'trash-folder'].includes(initialItem.id) &&
            !currentItems.some(existingItem => existingItem.id === initialItem.id)
        );

        if (missingFolders.length > 0) {
            updateItems(prev => [...prev, ...missingFolders]);
            toast({ title: "İçerik Güncellendi", description: "Temel klasörler geri yüklendi." });
        }
    }, [updateItems, toast, isMounted]);

    // Ensure all items start with 1x1 grid spans for equal sizing
    useEffect(() => {
        if (!isMounted) return;
        
        const hasNonEqualItems = itemsRef.current.some(item => 
            (item.gridSpanCol && item.gridSpanCol !== 1) || 
            (item.gridSpanRow && item.gridSpanRow !== 1)
        );

        if (hasNonEqualItems) {
            updateItems(prev => prev.map(item => ({
                ...item,
                gridSpanCol: 1,
                gridSpanRow: 1
            })));
        }
    }, [isMounted, updateItems]);

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
    
    // Filter spaces from all items
    const spaces = useMemo(() => allItems.filter(item => item.type === 'space'), [allItems]);

    const state = useAppStore();
    const setUsername = useAppStore(s => s.setUsername);
    const setUser = useAppStore(s => s.setUser);
    const setActiveSecondaryPanel = useAppStore(s => s.setActiveSecondaryPanel);
    const setEcommerceView = useAppStore(s => s.setEcommerceView);
    const ecommerceView = useAppStore(s => s.ecommerceView);
    
    // Enable realtime sync across browser tabs and sessions
    const { broadcastItemUpdate, broadcastItemAdd, broadcastItemDelete } = useRealtimeSync(true);

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

    // Handle e-commerce query params
    useEffect(() => {
        if (!isMounted) return;
        
        const ecommerceParam = searchParams?.get('ecommerce');
        if (ecommerceParam === 'products' || ecommerceParam === 'marketplace' || ecommerceParam === 'cart' || ecommerceParam === 'orders') {
            setActiveSecondaryPanel('shopping');
            setEcommerceView(ecommerceParam as any);
        }
    }, [searchParams, isMounted, setActiveSecondaryPanel, setEcommerceView]);

    // Sync local data to Supabase when logged in
    useEffect(() => {
        const syncData = async () => {
            // Disable sync for now - items table not yet created in Supabase
            return;
            
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
                    if (existingItems === null || existingItems.length === 0) {
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

                        if (dbItems !== null && dbItems.length > 0) {
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
                    // Only show toast if there's an actual error message
                    if (e?.message) {
                        toast({ title: "Senkronizasyon Hatası", description: e.message, variant: "destructive" });
                    }
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
        // Initialize tabs if empty based on startup behavior
        if (state.tabs.length === 0) {
          const currentItems = allRawItems.length > 0 ? allRawItems : initialContent;
          
          // Check startup behavior setting
          if (state.startupBehavior === 'new-tab') {
            // Create chrome-style new tab
            state.createNewTab();
          } else if (state.startupBehavior === 'custom' && state.customStartupContent) {
            // Open custom startup content
            state.openInNewTab(state.customStartupContent, currentItems);
          } else {
            // Default: Open root library (last-session behavior)
            let rootItem = currentItems.find(i => i.id === 'root');
            
            // Fallback to initialContent if root not found in currentItems
            if (!rootItem) {
              rootItem = initialContent.find(i => i.id === 'root');
              console.log('[Canvas] Root not found in currentItems, using initialContent root');
            }
            
            if (rootItem) {
              // Ensure all items includes root and its children
              const allItemsForTab = currentItems.some(i => i.id === 'root') 
                ? currentItems 
                : [...currentItems, rootItem, ...initialContent.filter(i => i.parentId === 'root')];
              
              state.openInNewTab(rootItem, allItemsForTab);
              console.log('[Canvas] Opened root library tab with', allItemsForTab.length, 'items');
            }
          }
        }
      }
    }, [username, state.username, setUsername, state.tabs.length, state.openInNewTab, state.createNewTab, state.startupBehavior, state.customStartupContent, allRawItems]);

    // Fix invalid activeTabId
    useEffect(() => {
        if (state.tabs.length > 0 && !state.tabs.find(t => t.id === state.activeTabId)) {
            state.setActiveTab(state.tabs[0].id);
        }
    }, [state.tabs, state.activeTabId, state.setActiveTab]);

    const activeTab = useMemo(() => state.tabs.find(t => t.id === state.activeTabId), [state.tabs, state.activeTabId]);
    const activeViewId = activeTab?.activeViewId || 'root';
    const normalizedLayoutMode: LayoutMode = state.layoutMode === 'canvas' ? 'canvas' : 'grid';

    const activeView = useMemo(() => {
        const findAndBuildView = (viewId: string): ContentItem | null => {
            // First try to find view in allItems
            let view = allItems.find(i => i.id === viewId);
            
            // If not found and it's root, use initialContent
            if (!view && viewId === 'root') {
                view = initialContent.find(i => i.id === 'root');
            }
            
            // If still not found, return null
            if (!view) {
                console.warn(`[Canvas] View not found: ${viewId}`);
                return null;
            }

            // Find children - try both allItems and initialContent
            let children = allItems.filter(i => i.parentId === view!.id);
            
            // Special handling for root: always ensure we have children
            if (viewId === 'root' || view.id === 'root') {
                if (children.length === 0) {
                    // Try initialContent as fallback
                    const initialChildren = initialContent.filter(i => i.parentId === 'root');
                    if (initialChildren.length > 0) {
                        console.log('[Canvas] Using initialContent children for root:', initialChildren.length);
                        children = initialChildren;
                    }
                }
                
                // If still no children, create default structure
                if (children.length === 0) {
                    console.warn('[Canvas] Root has no children, this should not happen');
                    children = [];
                }
            }

            // Apply sorting based on view's sort settings
            const sortOption = view?.sortOption || 'manual';
            const sortDirection = view?.sortDirection || 'asc';

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
                    return sortDirection === 'asc' ? (a.viewCount || 0) - (b.viewCount || 0) : (b.viewCount || 0) - (a.viewCount || 0);
                }
                if (sortOption === 'platformLikes') {
                    return sortDirection === 'asc' ? (a.likeCount || 0) - (b.likeCount || 0) : (b.likeCount || 0) - (a.likeCount || 0);
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
            
            // Return view with children
            const result = { ...view, children } as ContentItem;
            if (process.env.NODE_ENV === 'development' && viewId === 'root') {
                console.log('[Canvas] Root view built:', {
                    viewId: result.id,
                    childrenCount: result.children?.length || 0,
                    childrenIds: result.children?.map(c => c.id) || []
                });
            }
            return result;
        };
        
        return findAndBuildView(activeViewId);
    }, [activeViewId, allItems]);

    const activeViewChildren = useMemo(() => {
        const children = activeView?.children || [];
        if (process.env.NODE_ENV === 'development') {
            console.log('[Canvas] activeViewChildren:', {
                activeViewId,
                hasActiveView: !!activeView,
                childrenCount: children.length,
                childrenIds: children.map(c => c.id)
            });
        }
        return children;
    }, [activeView, activeViewId]);

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
        if (activeTab) {
            state.pushUndoRedo(activeTab.id, activeTab.activeViewId);
        }

        // Broadcast to other browser tabs in real-time
        if (typeof broadcastItemUpdate === 'function') {
            broadcastItemUpdate(state.activeTabId, itemId, updates);
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
                // Silently fail if items table doesn't exist yet
                console.log("Cloud sync skipped (items table not configured):", error.message);
                if (!error.message?.includes('relation') && !error.message?.includes('does not exist')) {
                    toast({ title: "Buluta Kaydetme", description: "Değişiklikler yerel olarak kaydedildi ancak buluta gönderilemedi.", variant: "default" });
                }
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
                // Silently fail if items table doesn't exist yet
                console.log("Cloud sync skipped (items table not configured):", error.message);
                if (!error.message?.includes('relation') && !error.message?.includes('does not exist')) {
                    toast({ title: "Buluta Kaydetme", description: "Değişiklikler yerel olarak kaydedildi ancak buluta gönderilemedi.", variant: "default" });
                }
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
                // Silently fail if items table doesn't exist yet
                console.log("Cloud sync skipped (items table not configured):", error.message);
                // Only show error if it's not a "relation does not exist" error
                if (!error.message?.includes('relation') && !error.message?.includes('does not exist')) {
                    toast({ title: "Buluta Kaydetme", description: "Öğe yerel olarak eklendi ancak buluta kaydedilemedi.", variant: "default" });
                }
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
        
        // Broadcast to other browser tabs in real-time
        broadcastItemDelete(state.activeTabId, itemId);

        if (state.user) {
            const { error } = await supabase
                .from('items')
                .delete()
                .in('id', idsToDelete);

            if (error) {
                // Silently fail if items table doesn't exist yet
                console.log("Cloud sync skipped (items table not configured):", error.message);
                if (!error.message?.includes('relation') && !error.message?.includes('does not exist')) {
                    toast({ title: "Buluttan Silme", description: "Öğeler yerel olarak silindi ancak buluttan kaldırılamadı.", variant: "default" });
                }
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
                // Get user's YouTube API key from store if metadata is enabled
                const { youtubeApiKey, youtubeMetadataEnabled } = useAppStore.getState();
                const userApiKey = youtubeMetadataEnabled ? youtubeApiKey : undefined;
                
                const metadata = await fetchOembedMetadata(itemData.url, userApiKey);
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
                        icon: metadata.icon || finalItemData.icon,
                        // YouTube-specific metadata
                        videoId: metadata.videoId,
                        channelId: metadata.channelId,
                        channelTitle: metadata.channelTitle,
                        categoryId: metadata.categoryId,
                        tags: metadata.tags,
                        duration: metadata.duration,
                        definition: metadata.definition,
                        dimension: metadata.dimension,
                        caption: metadata.caption,
                        licensedContent: metadata.licensedContent,
                        projection: metadata.projection,
                        dislikeCount: metadata.dislikeCount,
                        favoriteCount: metadata.favoriteCount,
                        content: metadata.content || finalItemData.content
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
                // Silently fail if items table doesn't exist yet
                console.log("Cloud sync skipped (items table not configured):", error.message);
                // Only show error if it's not a "relation does not exist" error
                if (!error.message?.includes('relation') && !error.message?.includes('does not exist')) {
                    toast({ title: "Buluta Kaydetme", description: "Öğe yerel olarak eklendi ancak buluta kaydedilemedi.", variant: "default" });
                }
            }
        }
        
        // Broadcast to other browser tabs in real-time
        broadcastItemAdd(state.activeTabId, parentId || 'root', newItem);

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

    // Listen for search result open events (Ctrl+Click, etc.)
    useEffect(() => {
        const handleAddNewTabFromSearch = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { type, url, title } = customEvent.detail;
            
            if (url) {
                const newItem: Partial<ContentItem> = {
                    type: (type || 'website') as ItemType,
                    url,
                    title: title || url,
                };
                
                // Open in new tab
                state.openInNewTab(
                    newItem as ContentItem,
                    allItems
                );
            }
        };

        window.addEventListener('addNewTabFromSearch', handleAddNewTabFromSearch);
        return () => {
            window.removeEventListener('addNewTabFromSearch', handleAddNewTabFromSearch);
        };
    }, [state, allItems]);

    // Listen for link drop events (from search results or web content)
    useEffect(() => {
        const handleLinkDropped = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { url, title, source, ctrlKey, shiftKey, altKey } = customEvent.detail;
            
            if (!url) return;

            // Determine action based on modifier keys
            if (ctrlKey) {
                // Ctrl+drop: Open in internal new tab
                const newItem: Partial<ContentItem> = {
                    type: 'website',
                    url,
                    title: title || url,
                };
                state.openInNewTab(newItem as ContentItem, allItems);
                toast({
                    title: "Yeni Sekmede Açıldı",
                    description: `${title || 'Website'} yeni sekmede açıldı.`,
                });
            } else if (shiftKey) {
                // Shift+drop: Open in external browser
                window.open(url, '_blank');
                toast({
                    title: "Tarayıcıda Açıldı",
                    description: `${title || 'Website'} tarayıcıda açıldı.`,
                });
            } else if (altKey) {
                // Alt+drop: Open in browser tab window
                window.open(url, '_blank', 'width=800,height=600');
                toast({
                    title: "Yeni Pencerede Açıldı",
                    description: `${title || 'Website'} yeni pencerede açıldı.`,
                });
            } else {
                // Default: Add to current canvas view
                const newItem: Partial<ContentItem> & { type: ItemType } = {
                    type: 'website',
                    url,
                    title: title || url,
                };
                addItemToView(newItem, activeViewId);
                toast({
                    title: "Canvas'a Eklendi",
                    description: `${title || 'Website'} mevcut sayfaya eklendi.`,
                });
            }
        };

        window.addEventListener('linkDropped', handleLinkDropped);
        return () => {
            window.removeEventListener('linkDropped', handleLinkDropped);
        };
    }, [state, allItems, activeViewId, addItemToView, toast]);


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
        const isCtrlOrCmd = (event as React.MouseEvent).ctrlKey || (event as React.MouseEvent).metaKey;

        if (isContainer) {
            if (isCtrlOrCmd || event.detail === 2) {
                // Ctrl+Click or Double-click: Open in new tab
                state.openInNewTab(item, allItems);
            } else if (event.detail === 1 && activeTab) {
                // Single-click: Navigate in same tab with history
                state.pushNavigationHistory(activeTab.id, item.id);
                state.updateTab(activeTab.id, { activeViewId: item.id });
            }
            // Always select the item
            const orderedIds = activeViewChildren.map((i) => i.id);
            state.setSelectedItem(item, event, orderedIds);
        } else if (isPlayer && event.detail === 2) {
            // Double click on player: Open in new tab
            state.openInNewTab(item, allItems);
        } else {
            // Single click on non-container: Just select
            const orderedIds = activeViewChildren.map((i) => i.id);
            state.setSelectedItem(item, event, orderedIds);
        }
    }, [allItems, state, activeViewChildren, activeTab]);

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
    const [isSpaceControlOpen, setIsSpaceControlOpen] = useState(false);
    const [gridSize, setGridSize] = useLocalStorage('canvas-grid-size', 280);
    const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(true);
    const [isMiniMapOpen, setIsMiniMapOpen] = useState(true);
    const [miniMapSize, setMiniMapSize] = useState<'s' | 'm' | 'l' | 'xl'>('m');
    const [sidebarWidth, setSidebarWidth] = useLocalStorage<number>('canvasflow_sidebar_width', 320);
    const [rightSidebarWidth, setRightSidebarWidth] = useLocalStorage<number>('canvasflow_right_sidebar_width', 380);
    const [viewportRect, setViewportRect] = useState<{ top: number; height: number } | undefined>(undefined);
    const canvasScrollRef = useRef<HTMLDivElement>(null);
    
    // Dinamik bottom panel height - tab sayısına göre (responsive)
    const bottomPanelHeight = useMemo(() => {
        const baseHeight = 180; // Base content height
        const tabBarHeight = responsive.isMobile ? 36 : 40; // Tab bar
        const controlBarHeight = responsive.isMobile ? 32 : 32; // Control bar
        return baseHeight + tabBarHeight + controlBarHeight;
    }, [responsive.isMobile]);
    
    // Track canvas scroll for minimap viewport indicator
    useEffect(() => {
        const scrollContainer = canvasScrollRef.current;
        if (!scrollContainer) return;

        const updateViewport = () => {
            const scrollTop = scrollContainer.scrollTop;
            const scrollHeight = scrollContainer.scrollHeight;
            const clientHeight = scrollContainer.clientHeight;
            
            if (scrollHeight <= clientHeight) {
                setViewportRect(undefined);
                return;
            }

            const top = scrollTop / scrollHeight;
            const height = clientHeight / scrollHeight;
            setViewportRect({ top, height });
        };

        scrollContainer.addEventListener('scroll', updateViewport);
        window.addEventListener('resize', updateViewport);
        updateViewport();

        return () => {
            scrollContainer.removeEventListener('scroll', updateViewport);
            window.removeEventListener('resize', updateViewport);
        };
    }, [activeViewId]);

    // Handle minimap item click: scroll to item and select it
    const handleMiniMapItemClick = useCallback((item: ContentItem) => {
        // Select the item
        state.setSelectedItem(item, { ctrlKey: false, shiftKey: false } as any, activeViewChildren.map(i => i.id));
        
        // Scroll to item in canvas
        if (canvasScrollRef.current) {
            const itemElement = document.querySelector(`[data-item-id="${item.id}"]`);
            if (itemElement) {
                itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [state, activeViewChildren]);
    
    // Responsive sidebar widths based on breakpoint
    // Optimized to eliminate gap between player and library
    const responsiveSidebarWidth = responsive.isMobile 
      ? 0 // Hidden on mobile (drawer mode)
      : responsive.isTablet 
        ? 200 // Compact on tablet
        : sidebarWidth; // User-adjustable on desktop (ideally 250-280px)
    
    // Secondary sidebar width - optimized to close gap
    const responsiveRightSidebarWidth = responsive.isMobile
      ? 0 // Hidden on mobile (drawer mode)
      : responsive.isTablet
        ? 260 // Slightly wider on tablet to close gap
        : (rightSidebarWidth || 320); // User-adjustable on desktop, fallback 320px
    
    // Calculate responsive secondary sidebar width (player panel)
    const responsiveSecondaryPanelWidth = responsive.isMobile
      ? 0 // Hidden on mobile (drawer mode)
      : responsive.isTablet
        ? 280 // Compact on tablet to prevent overflow
        : Math.min(360, Math.max(280, responsive.windowWidth * 0.18)); // Responsive between 280px-360px
    const [isResizing, setIsResizing] = useState(false);
    const [isRightResizing, setIsRightResizing] = useState(false);

    // Sync minimap state from active view (using metadata) - per-folder memory
    useEffect(() => {
        // Yeni sekme sayfasında minimap otomatik kapat
        if (activeTab?.type === 'new-tab') {
            setIsMiniMapOpen(false);
            return;
        }
        
        const minimapOpen = (activeView?.metadata as any)?.minimapOpen;
        const minimapSize = (activeView?.metadata as any)?.minimapSize;
        
        // View'ın kendi minimap durumu varsa yükle
        if (minimapOpen !== undefined) {
            setIsMiniMapOpen(minimapOpen);
        } else {
            // Varsayılan: açık
            setIsMiniMapOpen(true);
        }
        
        if (minimapSize) {
            setMiniMapSize(minimapSize as 's' | 'm' | 'l' | 'xl');
        } else {
            // Varsayılan boyut: medium
            setMiniMapSize('m');
        }
    }, [activeView?.id, activeView?.metadata, activeTab?.type]);
    
    // Minimap değiştiğinde view metadata'ya kaydet
    useEffect(() => {
        if (!activeView || activeTab?.type === 'new-tab') return;
        
        const currentMetadata = activeView.metadata || {};
        const needsUpdate = 
            (currentMetadata as any)?.minimapOpen !== isMiniMapOpen ||
            (currentMetadata as any)?.minimapSize !== miniMapSize;
        
        if (needsUpdate) {
            updateItem(activeView.id, {
                metadata: {
                    ...(currentMetadata as object),
                    minimapOpen: isMiniMapOpen,
                    minimapSize: miniMapSize
                } as any
            });
        }
    }, [isMiniMapOpen, miniMapSize, activeView?.id, activeTab?.type]);

    // Left sidebar resize handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
    }, []);

    // Right sidebar resize handlers
    const handleRightMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsRightResizing(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const baseOffset = 56; // primary sidebar fixed width
            const minWidth = responsive.isTablet ? 150 : 200; // smaller min on tablet
            const viewportMax = Math.max(320, (window.innerWidth || 1200) - 420); // leave room for canvas/right
            const maxWidth = Math.min(responsive.isTablet ? 300 : 600, viewportMax);
            const newWidth = e.clientX - baseOffset;
            if (newWidth >= minWidth && newWidth <= maxWidth) {
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
    }, [isResizing, setSidebarWidth, responsive.isTablet]);

    useEffect(() => {
        const handleRightMouseMove = (e: MouseEvent) => {
            if (!isRightResizing) return;
            const minWidth = responsive.isTablet ? 200 : 280; // smaller min on tablet
            const maxWidth = responsive.isTablet ? 400 : 700; // smaller max on tablet
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= minWidth && newWidth <= maxWidth) {
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
    }, [isRightResizing, setRightSidebarWidth, responsive.isTablet]);

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

            // ESC key: Clear selection first, then exit fullscreen
            if (e.key === 'Escape') {
                e.preventDefault();
                
                // If there's a selection, clear it first
                if (state.selectedItemIds.length > 0) {
                    state.clearSelection();
                    return;
                }
                
                // If no selection and in fullscreen, exit fullscreen
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                    return;
                }
            }

            if (isCtrl && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                setIsUiHidden(!isUiHidden);
            }

            // F key: Open global search dialog
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                state.updateSearchPanel({ isOpen: true });
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

    // Show loading while mounting to prevent hydration issues
    if (!isMounted) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <AppLogo className="h-16 w-16 text-primary animate-pulse" />
                    <p className="text-muted-foreground text-sm">Hazırlanıyor...</p>
                </div>
            </div>
        );
    }
    
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
                            isFullscreen={isFullscreen}
                            toggleFullscreen={() => { 
                                if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { document.exitFullscreen(); }
                            }}
                            isUiHidden={isUiHidden}
                            setIsUiHidden={setIsUiHidden}
                            isStyleSettingsOpen={state.isStyleSettingsOpen}
                            toggleStyleSettingsPanel={() => state.togglePanel('isStyleSettingsOpen')}
                            isViewportEditorOpen={state.isViewportEditorOpen}
                            toggleViewportEditor={() => state.togglePanel('isViewportEditorOpen')}
                            activeViewId={activeView?.id}
                            normalizedLayoutMode={normalizedLayoutMode}
                            gridModeState={state.gridModeState}
                            setGridModeEnabled={state.setGridModeEnabled}
                            setGridModeType={state.setGridModeType}
                            setGridColumns={state.setGridColumns}
                            setGridCurrentPage={state.setGridCurrentPage}
                        />
                        {/* Backdrop overlay for mobile/tablet */}
                        {state.isSecondLeftSidebarOpen && (responsive.isMobile || responsive.isTablet) && (
                            <div 
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                                onClick={() => state.togglePanel('isSecondLeftSidebarOpen', false)}
                                aria-hidden="true"
                            />
                        )}
                        
                        {state.isSecondLeftSidebarOpen && (
                            <div 
                                className={cn(
                                    "border-r flex-shrink-0 overflow-hidden bg-background shadow-2xl z-50",
                                    responsive.isMobile || responsive.isTablet
                                        ? "fixed left-14 top-0 bottom-0 animate-in slide-in-from-left duration-300" // Overlay mode
                                        : "relative" // Normal flow on desktop
                                )}
                                style={{ 
                                    width: responsive.isMobile || responsive.isTablet 
                                        ? '280px' 
                                        : `${responsiveSecondaryPanelWidth}px`, 
                                    minWidth: '200px', 
                                    maxWidth: '400px' 
                                }}
                            >
                                <Sidebar className="w-full h-full overflow-y-auto overflow-x-hidden">
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
                                        onNavigateToRoot={() => {
                                            if (activeTab) {
                                                state.pushNavigationHistory(activeTab.id, 'root');
                                                state.updateTab(activeTab.id, { activeViewId: 'root' });
                                            }
                                        }}
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
                                    {/* Desktop Header Controls */}
                                    {responsive.isDesktop && (
                                      <HeaderControls
                                        isFullscreen={isFullscreen} toggleFullscreen={() => { 
                                            if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { document.exitFullscreen(); }
                                        }}
                                        isUiHidden={isUiHidden} setIsUiHidden={setIsUiHidden} 
                                        isStyleSettingsOpen={state.isStyleSettingsOpen}
                                        toggleStyleSettingsPanel={() => state.togglePanel('isStyleSettingsOpen')}
                                        isViewportEditorOpen={state.isViewportEditorOpen}
                                        toggleViewportEditor={() => state.togglePanel('isViewportEditorOpen')}
                                        gridSize={gridSize}
                                        setGridSize={setGridSize}
                                        layoutMode={activeView?.layoutMode || 'grid'}
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
                                        toggleSearchDialog={() => state.updateSearchPanel({ isOpen: true })}
                                        isMiniMapOpen={isMiniMapOpen}
                                        onToggleMiniMap={setIsMiniMapOpen}
                                    />
                                    )}

                                    {/* Mobile/Tablet Header Controls */}
                                    {!responsive.isDesktop && (
                                      <HeaderControlsMobile
                                        isFullscreen={isFullscreen} toggleFullscreen={() => { 
                                            if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { document.exitFullscreen(); }
                                        }}
                                        isUiHidden={isUiHidden} setIsUiHidden={setIsUiHidden} 
                                        isStyleSettingsOpen={state.isStyleSettingsOpen}
                                        toggleStyleSettingsPanel={() => state.togglePanel('isStyleSettingsOpen')}
                                        isViewportEditorOpen={state.isViewportEditorOpen}
                                        toggleViewportEditor={() => state.togglePanel('isViewportEditorOpen')}
                                        gridSize={gridSize}
                                        setGridSize={setGridSize}
                                        layoutMode={(activeView?.layoutMode as any) || 'grid'}
                                        onSetLayoutMode={(mode) => activeView && updateItem(activeView.id, { layoutMode: mode as any })}
                                        activeViewId={activeView?.id}
                                        user={null}
                                      />
                                    )}
                              </div>
                              <div className={cn(
                                 "transition-all duration-300",
                                 isUiHidden && !isTopBarHovered ? "h-0 overflow-hidden" : "h-auto"
                              )}>
                                <TabBar 
                                    tabs={state.tabs}
                                    tabGroups={state.tabGroups}
                                    activeTabId={state.activeTabId}
                                    onTabClick={state.setActiveTab}
                                    onCloseTab={state.closeTab}
                                    onNewTab={state.createNewTab}
                                    onSetLayout={(cols) => {}}
                                    onToggleGroup={(groupId) => {
                                      state.updateTabGroup(groupId, {
                                        collapsed: !state.tabGroups.find(g => g.id === groupId)?.collapsed
                                      });
                                    }}
                                    tabAccessHistory={state.tabAccessHistory}
                                />
                              </div>
                         </div>
                         
                         <div ref={canvasScrollRef} className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden">
                            {state.selectedItemIds.length > 0 && (
                                <div className="absolute top-3 right-3 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-background/90 border shadow-lg backdrop-blur-md">
                                    <span className="text-xs font-semibold">{state.selectedItemIds.length} öğe seçili</span>
                                    <span className="hidden md:inline text-[10px] text-muted-foreground">Shift/Ctrl ile ekle</span>
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => state.clearSelection()}>Temizle</Button>
                                </div>
                            )}
                            {activeTab?.type === 'new-tab' ? (
                                <NewTabScreen />
                            ) : isSingleItemView ? (
                                <WebsitePreview item={activeTab} onLoad={() => {}} />
                            ) : (
                                <Canvas
                                    items={activeViewChildren}
                                    allItems={sidebarItems}
                                    activeView={activeView}
                                    layoutMode={(activeView?.layoutMode as any) || 'grid'}
                                    onSetLayoutMode={(mode) => activeView && updateItem(activeView.id, { layoutMode: mode as any })}
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
                                    isSuspended={isSuspended}
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
                            <MiniMapOverlay
                                items={activeViewChildren}
                                playerControlGroups={state.playerControlGroups}
                                isOpen={isMiniMapOpen}
                                onToggle={setIsMiniMapOpen}
                                onToggleControlPin={(groupId, pinned) => state.togglePlayerControlMiniMapPin(groupId, pinned)}
                                maxItems={(activeView as any)?.coverMaxItems ?? 20}
                                viewportRect={viewportRect}
                                onItemClick={handleMiniMapItemClick}
                                selectedItemIds={state.selectedItemIds}
                            />
                            <Tabs defaultValue="description" className="w-full">
                                {/* Bottom Control Bar - Tabs sol, Controls sağ */}
                                <div className={cn(
                                    "flex gap-2 border-b bg-muted/40",
                                    responsive.isMobile || responsive.isTablet 
                                        ? "flex-col px-2 py-1" 
                                        : "flex-row items-center px-3 py-1.5 justify-between"
                                )}>
                                    {/* Sol Taraf: Açıklamalar/Yorumlar/Analizler Tabs */}
                                    <TabsList className={cn(
                                        "border-b-0 bg-transparent px-1 order-first",
                                        responsive.isMobile || responsive.isTablet 
                                            ? "w-full justify-start h-8" 
                                            : "h-7"
                                    )}>
                                        <TabsTrigger value="description" className="text-xs h-full"><Info className="mr-1 h-3 w-3" /> Açıklamalar</TabsTrigger>
                                        <TabsTrigger value="comments" className="text-xs h-full"><MessageSquare className="mr-1 h-3 w-3" /> Yorumlar</TabsTrigger>
                                        <TabsTrigger value="analytics" className="text-xs h-full"><BarChart className="mr-1 h-3 w-3" /> Analizler</TabsTrigger>
                                    </TabsList>

                                    {/* Sağ Taraf: Navigasyon Araçları */}
                                    <BottomControlBar 
                                        isCollapsed={isBottomPanelCollapsed} 
                                        onToggleCollapse={setIsBottomPanelCollapsed}
                                        gridSize={gridSize}
                                        onGridSizeChange={(val) => {
                                          setGridSize(val);
                                          // Canvas modunda scale güncelle (60-200% zoom)
                                          if ((activeView?.layoutMode as any) === 'canvas' && activeView) {
                                            // Grid size: 160-600px arası
                                            // Scale: 60-200% arası
                                            // 160px = 60%, 280px = 100%, 600px = 200%
                                            const minSize = 160;
                                            const maxSize = 600;
                                            const minScale = 60;
                                            const maxScale = 200;
                                            const normalized = Math.max(0, Math.min(1, (val - minSize) / (maxSize - minSize)));
                                            const newScale = Math.round(minScale + normalized * (maxScale - minScale));
                                            updateItem(activeView.id, { scale: newScale });
                                          }
                                        }}
                                        showMiniMapToggle
                                        isMiniMapOpen={isMiniMapOpen}
                                        onToggleMiniMap={setIsMiniMapOpen}
                                    />
                                </div>
                                {!isBottomPanelCollapsed && (
                                    <div className="relative" style={{ height: bottomPanelHeight - (responsive.isMobile ? 68 : 48) }}>
                                        <TabsContent value="description" className="p-4 h-full overflow-auto">
                                            <p className="text-sm text-muted-foreground">{activeTab.content || 'Bu görünüm için bir açıklama yok.'}</p>
                                        </TabsContent>
                                        <TabsContent value="comments" className="p-4 h-full overflow-auto">
                                            <p className="text-sm text-muted-foreground">Yorum özelliği yakında eklenecektir.</p>
                                        </TabsContent>
                                        <TabsContent value="analytics" className="p-4 h-full overflow-auto">
                                            <p className="text-sm text-muted-foreground">Analiz özelliği yakında eklenecektir.</p>
                                        </TabsContent>
                                    </div>
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
                        )}
                    </div>
                    
                    <div 
                        className={cn(
                            'relative z-40 transition-all duration-300 ease-in-out', 
                            isUiHidden ? 'fixed right-0 top-0 bottom-0 z-50 shadow-2xl' : 'relative',
                            isUiHidden && !isRightSidebarHovered ? 'translate-x-full' : 'translate-x-0'
                        )}
                        style={{ width: state.isViewportEditorOpen ? `${rightSidebarWidth}px` : '0px' }}
                        onMouseEnter={() => isUiHidden && setIsRightSidebarHovered(true)}
                        onMouseLeave={() => isUiHidden && setIsRightSidebarHovered(false)}
                    >
                        {state.isViewportEditorOpen && (
                            <ViewportEditor
                                item={state.selectedItemIds.length > 0 ? allItems.find(i => i.id === state.selectedItemIds[0]) || activeView : activeView}
                                onUpdateItem={(updates) => {
                                    const targetItemId = state.selectedItemIds[0];
                                    const targetItem = targetItemId ? allItems.find(i => i.id === targetItemId) : activeView;
                                    if (targetItem) {
                                        updateItem(targetItem.id, updates);
                                    }
                                }}
                                onClose={() => state.togglePanel('isViewportEditorOpen')}
                            />
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
                    
                    {state.isSpacesPanelOpen && (
                        <SpacesPanel
                            onClose={() => state.togglePanel('isSpacesPanelOpen', false)}
                            spaces={spaces}
                            allItems={allItems}
                            onAddNewSpace={() => {
                                addItemToView(
                                    { type: 'space', title: 'Yeni Mekan', icon: 'home' },
                                    'spaces-folder'
                                );
                            }}
                        />
                    )}
                    
                    {state.isDevicesPanelOpen && (
                        <DevicesPanel
                            onClose={() => state.togglePanel('isDevicesPanelOpen', false)}
                            devices={devices}
                            activeDeviceId={activeBroadcastTargetId}
                            onDeviceClick={setActiveBroadcastTargetId}
                            onAddNewDevice={() => {
                                addItemToView(
                                    { 
                                        type: 'device', 
                                        title: 'Yeni Cihaz',
                                        icon: 'monitor',
                                        deviceInfo: {
                                            os: (navigator.platform || 'Unknown') as any,
                                            browser: (navigator.userAgent.split(' ').pop() || 'Unknown') as any
                                        }
                                    },
                                    'devices-folder'
                                );
                            }}
                            onShowInfo={state.setItemForInfo}
                            sessionId="session-123"
                        />
                    )}

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
                     <SettingsDialog 
                        isOpen={isSettingsOpen} 
                        onOpenChange={setIsSettingsOpen}
                        allItems={allItems} 
                        onRestoreItem={() => {}} 
                        onPermanentlyDeleteItem={(item: any) => deleteItem(item.id)} 
                        onEmptyTrash={() => {}}
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
  const { user, loading } = useAuth();
  const { username: storeUsername, setUsername: setStoreUsername } = useAppStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check localStorage for persisted username (guest mode)
  useEffect(() => {
    if (!isHydrated) return;
    
    if (!storeUsername && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tv25-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.state?.username) {
            setStoreUsername(parsed.state.username);
          }
        }
      } catch (e) {
        console.error('Failed to parse localStorage:', e);
      }
    }
    setHasCheckedStorage(true);
  }, [isHydrated, storeUsername, setStoreUsername]);

  // Sync auth state to store on mount/change
  useEffect(() => {
    if (!isHydrated) return;
    
    if (user) {
      const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
      setStoreUsername(username);
    }
  }, [user, isHydrated, setStoreUsername]);

  useEffect(() => {
    if (!isHydrated || loading || !hasCheckedStorage) return;
    
    // Allow access if:
    // 1. User is authenticated via Supabase
    // 2. Has username in store (guest mode)
    const hasAccess = user || storeUsername;
    
    if (!hasAccess) {
      router.push('/');
    }
  }, [isHydrated, user, storeUsername, loading, router, hasCheckedStorage]);

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

  // Display name: authenticated user > store username > default
  const displayName = user?.user_metadata?.username || storeUsername || 'User';

  return <MainContentInternal username={displayName} />;
}
