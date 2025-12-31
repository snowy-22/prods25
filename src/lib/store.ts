
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ContentItem } from './initial-content';
import { User } from '@supabase/supabase-js';

export type SearchPanelState = {
  isOpen: boolean;
  isDraggable: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ChatPanelState = {
  id: string;
  isOpen: boolean;
  isPinned: boolean;
  isDraggable: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
};

export type Tab = ContentItem & {
    activeViewId: string;
    isTemporary?: boolean;
    history: string[];
    historyIndex: number;
    navigationHistory: string[]; // Breadcrumb navigasyon geçmişi
    navigationIndex: number;
    undoRedoStack: Array<{ activeViewId: string; timestamp: number }>;
    undoRedoIndex: number;
    lastAccessedAt?: number; // Sekmeye son erişim zamanı
    isSuspended?: boolean; // Arka plan sekmeleri için duraklatma durumu
    hasActiveMedia?: boolean; // Video/ses oynatıcısı var mı
    hasActiveTimer?: boolean; // Aktif saat/sayaç var mı
};

interface AppStore {
  user: User | null;
  username: string | null;
  tabs: Tab[];
  activeTabId: string;
  tabAccessHistory: Array<{ tabId: string; timestamp: number }>; // Son 3 sekme geçmişi
  isSecondLeftSidebarOpen: boolean;
  activeSecondaryPanel: 'library' | 'social' | 'messages' | 'widgets' | 'notifications' | 'spaces' | 'devices' | 'ai-chat' | null;
  isStyleSettingsOpen: boolean;
  isSpacesPanelOpen: boolean;
  isDevicesPanelOpen: boolean;
  searchPanelState: SearchPanelState;
  chatPanels: ChatPanelState[];
  itemToShare: ContentItem | null;
  itemToSave: ContentItem | null;
  itemForInfo: ContentItem | null;
  itemForPreview: ContentItem | null;
  clipboard: { item: ContentItem; operation: 'copy' | 'cut' }[];
  expandedItems: string[];
  hoveredItemId: string | null;
  selectedItemIds: string[];
  draggedItem: any | null;
  focusedItemId: string | null;
  layoutMode: 'grid' | 'canvas';
  isUiHidden: boolean;
  
  // Frame/Border Settings
  pointerFrameEnabled: boolean;
  audioTrackerEnabled: boolean;
  mouseTrackerEnabled: boolean;
  virtualizerMode: boolean;
  visualizerMode: 'off' | 'bars' | 'wave' | 'circular' | 'particles';

  // Actions
  setUser: (user: User | null) => void;
  setUsername: (username: string | null) => void;
  setActiveTab: (tabId: string) => void;
  setTabs: (tabs: Tab[]) => void;
  setLayoutMode: (mode: 'grid' | 'canvas') => void;
  setIsUiHidden: (hidden: boolean) => void;
  setPointerFrameEnabled: (enabled: boolean) => void;
  setAudioTrackerEnabled: (enabled: boolean) => void;
  setMouseTrackerEnabled: (enabled: boolean) => void;
  setVirtualizerMode: (enabled: boolean) => void;
  setVisualizerMode: (mode: 'off' | 'bars' | 'wave' | 'circular' | 'particles') => void;
  openInNewTab: (item: ContentItem, allItems: ContentItem[], isTemporary?: boolean) => void;
  createNewTab: () => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  closeTab: (tabId: string) => void;
  togglePanel: (panel: 'isSecondLeftSidebarOpen' | 'isStyleSettingsOpen' | 'isSpacesPanelOpen' | 'isDevicesPanelOpen', open?: boolean) => void;
  setActiveSecondaryPanel: (panel: AppStore['activeSecondaryPanel']) => void;
  updateSearchPanel: (update: Partial<SearchPanelState>) => void;
  setItemToShare: (item: ContentItem | null) => void;
  setItemToSave: (item: ContentItem | null) => void;
  setItemForInfo: (item: ContentItem | null) => void;
  setItemForPreview: (item: ContentItem | null) => void;
  setClipboard: (items: { item: ContentItem; operation: 'copy' | 'cut' }[]) => void;
  toggleExpansion: (itemId: string) => void;
  setHoveredItem: (itemId: string | null) => void;
  setSelectedItem: (item: ContentItem, event: React.MouseEvent | React.TouchEvent, orderedIds?: string[]) => void;
  clearSelection: () => void;
  setDraggedItem: (item: any | null) => void;
  setFocusedItem: (itemId: string | null) => void;
  addChatPanel: (panel: ChatPanelState) => void;
  removeChatPanel: (panelId: string) => void;
  updateChatPanel: (panelId: string, updates: Partial<ChatPanelState>) => void;
  pushNavigationHistory: (tabId: string, viewId: string) => void;
  popNavigationHistory: (tabId: string) => void;
  pushUndoRedo: (tabId: string, viewId: string) => void;
  undo: (tabId: string) => void;
  redo: (tabId: string) => void;
  recordTabAccess: (tabId: string) => void;
  suspendBackgroundTabs: () => void;
  updateTabMediaState: (tabId: string, hasActiveMedia: boolean, hasActiveTimer: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      user: null,
      username: null,
      tabs: [],
      activeTabId: '',
      tabAccessHistory: [],
      isSecondLeftSidebarOpen: true,
      activeSecondaryPanel: 'library',
      isStyleSettingsOpen: false,
      isSpacesPanelOpen: false,
      isDevicesPanelOpen: false,
      searchPanelState: { isOpen: false, isDraggable: true, x: 50, y: 50, width: 600, height: 500 },
      chatPanels: [],
      itemToShare: null,
      itemToSave: null,
      itemForInfo: null,
      itemForPreview: null,
      clipboard: [],
      expandedItems: [],
      hoveredItemId: null,
      selectedItemIds: [],
      draggedItem: null,
      focusedItemId: null,
      layoutMode: 'grid',
      isUiHidden: false,
      
      // Frame/Border Settings defaults
      pointerFrameEnabled: false,
      audioTrackerEnabled: false,
      mouseTrackerEnabled: false,
      virtualizerMode: false,
      visualizerMode: 'off',

      setUser: (user) => set({ user }),
      setUsername: (username) => set({ username }),
      setActiveTab: (activeTabId) => {
        get().recordTabAccess(activeTabId);
        set({ activeTabId });
        get().suspendBackgroundTabs();
      },
      setTabs: (tabs) => set({ tabs }),
      setIsUiHidden: (isUiHidden) => set({ isUiHidden }),
      setPointerFrameEnabled: (pointerFrameEnabled) => set({ pointerFrameEnabled }),
      setAudioTrackerEnabled: (audioTrackerEnabled) => set({ audioTrackerEnabled }),
      setMouseTrackerEnabled: (mouseTrackerEnabled) => set({ mouseTrackerEnabled }),
      setVirtualizerMode: (virtualizerMode) => set({ virtualizerMode }),
      setVisualizerMode: (visualizerMode) => set({ visualizerMode }),
      setLayoutMode: (layoutMode) => {
        const normalized = layoutMode === 'canvas' ? 'canvas' : 'grid';
        set({ layoutMode: normalized });
        // Canvas: hide extra chrome for focus; Grid: keep default panels
        if (normalized === 'canvas') {
          set({ 
            isSecondLeftSidebarOpen: true,
            activeSecondaryPanel: 'library',
            isUiHidden: false
          });
        } else {
          set({ isUiHidden: false });
        }
      },
      openInNewTab: (item, allItems, isTemporary) => {
        const { tabs } = get();
        // Check if a tab with this item already exists
        const existingTab = tabs.find(t => t.id === item.id);
        if (existingTab) {
          const isLibraryTab = item.id === 'root' || item.type === 'root';
          set({ 
            activeTabId: item.id,
            isSecondLeftSidebarOpen: isLibraryTab,
            activeSecondaryPanel: isLibraryTab ? 'library' : get().activeSecondaryPanel
          });
          return;
        }
        
        // For containers, the activeViewId is the item's ID.
        // For non-containers, we might want to show the parent or just the item itself in a special view.
        // For now, let's assume we want to view the item.
        const isContainer = ['folder', 'list', 'inventory', 'space', 'devices', 'calendar', 'saved-items', 'root', 'awards-folder', 'spaces-folder', 'devices-folder'].includes(item.type);
        
        const activeViewId = item.id; // Always set the item itself as the active view
        
        const newTab: Tab = { 
            ...item, 
            activeViewId, 
            isTemporary,
            history: [activeViewId],
            historyIndex: 0,
            navigationHistory: [activeViewId],
            navigationIndex: 0,
            undoRedoStack: [{ activeViewId, timestamp: Date.now() }],
            undoRedoIndex: 0
        };
        const isLibraryTab = item.id === 'root' || item.type === 'root';
        set({ 
          tabs: [...tabs, newTab], 
          activeTabId: item.id,
          isSecondLeftSidebarOpen: isLibraryTab,
          activeSecondaryPanel: isLibraryTab ? 'library' : get().activeSecondaryPanel
        });
      },
      createNewTab: () => {
        const { tabs } = get();
        const newId = `tab-${Date.now()}`;
        const now = new Date().toISOString();
        
        // Create library panel (1/3)
        const libraryPanelId = `library-panel-${Date.now()}`;
        const libraryPanel: ContentItem = {
          id: libraryPanelId,
          type: 'folder',
          title: 'Kitaplık',
          icon: 'library',
          parentId: newId,
          createdAt: now,
          updatedAt: now,
          isDeletable: false,
          order: 0,
          styles: {
            width: '33.33%',
            height: '100%'
          }
        };
        
        // Create search panel (2/3)
        const searchPanelId = `search-panel-${Date.now()}`;
        const searchPanel: ContentItem = {
          id: searchPanelId,
          type: 'search',
          title: 'Gelişmiş Arama',
          icon: 'search',
          parentId: newId,
          createdAt: now,
          updatedAt: now,
          isDeletable: false,
          order: 1,
          content: 'Web destekli yapay zeka arama asistanı',
          styles: {
            width: '33.33%',
            height: '100%'
          }
        };
        
        // Create search tabs panel (3/3)
        const searchTabsPanelId = `search-tabs-${Date.now()}`;
        const searchTabsPanel: ContentItem = {
          id: searchTabsPanelId,
          type: 'folder',
          title: 'Arama Sekmeleri',
          icon: 'tabs',
          parentId: newId,
          createdAt: now,
          updatedAt: now,
          isDeletable: false,
          order: 2,
          content: 'Ön yüklü arama sekmeleri ve hızlı erişim',
          styles: {
            width: '33.33%',
            height: '100%'
          }
        };
        
        const newTab: Tab = {
          id: newId,
          title: 'Yeni Sekme',
          type: 'folder',
          activeViewId: newId,
          createdAt: now,
          updatedAt: now,
          parentId: null,
          isDeletable: false,
          children: [libraryPanel, searchPanel, searchTabsPanel],
          history: [newId],
          historyIndex: 0,
          navigationHistory: [newId],
          navigationIndex: 0,
          undoRedoStack: [{ activeViewId: newId, timestamp: Date.now() }],
          undoRedoIndex: 0,
          layoutMode: 'grid',
          styles: {
            gridColumns: 3,
            gridRows: 1,
            gap: 0,
            padding: 0
          }
        };
        set({ 
          tabs: [...tabs, newTab], 
          activeTabId: newId,
          isSecondLeftSidebarOpen: true,
          activeSecondaryPanel: 'library'
        });
      },
      updateTab: (tabId, updates) => {
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, ...updates } : t)),
        }));
      },
      closeTab: (tabId) => {
        const { tabs, activeTabId } = get();
        const newTabs = tabs.filter(t => t.id !== tabId);
        let newActiveId = activeTabId;
        if (activeTabId === tabId && newTabs.length > 0) {
          newActiveId = newTabs[newTabs.length - 1].id;
        }
        set({ tabs: newTabs, activeTabId: newActiveId });
      },
      togglePanel: (panel, open) => set((state) => ({ [panel]: open !== undefined ? open : !state[panel] })),
      setActiveSecondaryPanel: (panel) => set({ activeSecondaryPanel: panel, isSecondLeftSidebarOpen: !!panel }),
      updateSearchPanel: (update) => set((state) => ({ searchPanelState: { ...state.searchPanelState, ...update } })),
      setItemToShare: (item) => set({ itemToShare: item }),
      setItemToSave: (item) => set({ itemToSave: item }),
      setItemForInfo: (item) => set({ itemForInfo: item }),
      setItemForPreview: (item) => set({ itemForPreview: item }),
      setClipboard: (clipboard) => set({ clipboard }),
      toggleExpansion: (itemId) => set((state) => {
        const newExpanded = state.expandedItems.includes(itemId)
          ? state.expandedItems.filter(id => id !== itemId)
          : [...state.expandedItems, itemId];
        return { expandedItems: newExpanded };
      }),
      setHoveredItem: (itemId) => set({ hoveredItemId: itemId }),
      setSelectedItem: (item, event, orderedIds) => set((state) => {
        let newSelected = [...state.selectedItemIds];
        const isCtrl = (event as any)?.ctrlKey || (event as any)?.metaKey;
        const isShift = (event as any)?.shiftKey;

        if (isShift && orderedIds && orderedIds.length > 0 && state.selectedItemIds.length > 0) {
          const anchorId = state.selectedItemIds[state.selectedItemIds.length - 1];
          const startIndex = orderedIds.indexOf(anchorId);
          const endIndex = orderedIds.indexOf(item.id);

          if (startIndex !== -1 && endIndex !== -1) {
            const [from, to] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
            const rangeIds = orderedIds.slice(from, to + 1);
            newSelected = Array.from(new Set([...state.selectedItemIds, ...rangeIds]));
            return { selectedItemIds: newSelected };
          }
        }

        if (isCtrl) {
          if (newSelected.includes(item.id)) newSelected = newSelected.filter(id => id !== item.id);
          else newSelected.push(item.id);
        } else {
          newSelected = [item.id];
        }
        return { selectedItemIds: newSelected };
      }),
      clearSelection: () => set({ selectedItemIds: [] }),
      setDraggedItem: (item) => set({ draggedItem: item }),
      setFocusedItem: (itemId) => set({ focusedItemId: itemId }),
      addChatPanel: (panel) => set((state) => {
        if (state.chatPanels.some(p => p.id === panel.id)) return state;
        return { chatPanels: [...state.chatPanels, panel] };
      }),
      removeChatPanel: (panelId) => set((state) => ({
        chatPanels: state.chatPanels.filter(p => p.id !== panelId)
      })),
      updateChatPanel: (panelId, updates) => set((state) => ({
        chatPanels: state.chatPanels.map(p => p.id === panelId ? { ...p, ...updates } : p)
      })),
      pushNavigationHistory: (tabId, viewId) => set((state) => ({
        tabs: state.tabs.map(t => {
          if (t.id === tabId) {
            const navHistory = [...(t.navigationHistory || [])];
            const navIndex = (t.navigationIndex || 0) + 1;
            navHistory.splice(navIndex);
            navHistory.push(viewId);
            return { ...t, navigationHistory: navHistory, navigationIndex: navIndex };
          }
          return t;
        })
      })),
      popNavigationHistory: (tabId) => set((state) => ({
        tabs: state.tabs.map(t => {
          if (t.id === tabId && (t.navigationIndex || 0) > 0) {
            return { ...t, navigationIndex: (t.navigationIndex || 0) - 1 };
          }
          return t;
        })
      })),
      pushUndoRedo: (tabId, viewId) => set((state) => ({
        tabs: state.tabs.map(t => {
          if (t.id === tabId) {
            const stack = [...(t.undoRedoStack || [])];
            const index = (t.undoRedoIndex || 0) + 1;
            stack.splice(index);
            stack.push({ activeViewId: viewId, timestamp: Date.now() });
            return { ...t, undoRedoStack: stack, undoRedoIndex: index };
          }
          return t;
        })
      })),
      undo: (tabId) => set((state) => ({
        tabs: state.tabs.map(t => {
          if (t.id === tabId && (t.undoRedoIndex || 0) > 0) {
            return { ...t, undoRedoIndex: (t.undoRedoIndex || 0) - 1 };
          }
          return t;
        })
      })),
      redo: (tabId) => set((state) => ({
        tabs: state.tabs.map(t => {
          if (t.id === tabId && (t.undoRedoIndex || 0) < ((t.undoRedoStack || []).length - 1)) {
            return { ...t, undoRedoIndex: (t.undoRedoIndex || 0) + 1 };
          }
          return t;
        })
      })),
      recordTabAccess: (tabId) => set((state) => {
        const now = Date.now();
        const newHistory = [
          { tabId, timestamp: now },
          ...state.tabAccessHistory.filter(h => h.tabId !== tabId)
        ].slice(0, 3);
        return {
          tabAccessHistory: newHistory,
          tabs: state.tabs.map(t => 
            t.id === tabId ? { ...t, lastAccessedAt: now, isSuspended: false } : t
          )
        };
      }),
      suspendBackgroundTabs: () => set((state) => {
        const activeTabIds = new Set([
          state.activeTabId,
          ...state.tabAccessHistory.slice(0, 3).map(h => h.tabId)
        ]);
        return {
          tabs: state.tabs.map(tab => {
            if (!activeTabIds.has(tab.id) && !tab.hasActiveMedia && !tab.hasActiveTimer) {
              return { ...tab, isSuspended: true };
            }
            return tab;
          })
        };
      }),
      updateTabMediaState: (tabId, hasActiveMedia, hasActiveTimer) => set((state) => ({
        tabs: state.tabs.map(t => 
          t.id === tabId ? { ...t, hasActiveMedia, hasActiveTimer } : t
        )
      })),
    }),
    {
      name: 'canvasflow-storage',
      version: 2,
      migrate: (persistedState: any, _version: number) => {
        // Ensure search dialog does not auto-open after rehydration
        if (persistedState && persistedState.searchPanelState) {
          const { searchPanelState } = persistedState;
          persistedState.searchPanelState = {
            // preserve persisted layout props
            isDraggable: searchPanelState.isDraggable ?? true,
            x: searchPanelState.x ?? 50,
            y: searchPanelState.y ?? 50,
            width: searchPanelState.width ?? 600,
            height: searchPanelState.height ?? 500,
            // drop any previous isOpen value
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        username: state.username,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        isSecondLeftSidebarOpen: state.isSecondLeftSidebarOpen,
        activeSecondaryPanel: state.activeSecondaryPanel,
        // Do not persist isOpen to avoid auto-opening on first load
        searchPanelState: {
          isDraggable: state.searchPanelState.isDraggable,
          x: state.searchPanelState.x,
          y: state.searchPanelState.y,
          width: state.searchPanelState.width,
          height: state.searchPanelState.height,
        },
      }),
    }
  )
);
