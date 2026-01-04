
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ContentItem, KeyboardShortcut, Gesture, MacroDefinition, MacroPadLayout, PlayerControlGroup } from './initial-content';
import { User } from '@supabase/supabase-js';
import { Message, Conversation, Group, Call, GroupMember, PermissionLevel, PrivateAccount, MessageSearchFilter } from './messaging-types';
import { HueBridge, HueLight, HueScene, HueSync } from './hue-types';
import { GridModeState } from './layout-engine';
import { 
  subscribeToCanvasChanges, 
  unsubscribeFromCanvasChanges, 
  loadAllCanvasData, 
  loadUserPreferences, 
  debouncedSyncToCloud,
  saveUserPreferences,
  migrateLocalStorageToCloud,
  SyncDataType 
} from './supabase-sync';

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

export type TabGroup = {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
  tabIds: string[];
};

export type Tab = ContentItem & {
    activeViewId: string;
    isTemporary?: boolean;
    groupId?: string; // Hangi gruba ait
    history: string[];
    historyIndex: number;
    navigationHistory: string[]; // Breadcrumb navigasyon geçmişi
    navigationIndex: number;
    undoRedoStack: Array<{ activeViewId: string; timestamp: number }>;
    undoRedoIndex: number;
    lastAccessedAt?: number; // Sekmeye son erişim zamanı
    hasActiveMedia?: boolean; // Video/ses oynatıcısı var mı
    hasActiveTimer?: boolean; // Aktif saat/sayaç var mı
};

export type NewTabBehavior = 'chrome-style' | 'library' | 'folder' | 'custom';
export type StartupBehavior = 'last-session' | 'new-tab' | 'library' | 'folder' | 'custom';

interface AppStore {
  user: User | null;
  username: string | null;
  tabs: Tab[];
  tabGroups: TabGroup[];
  activeTabId: string;
  tabAccessHistory: Array<{ tabId: string; timestamp: number }>; // Son 3 sekme geçmişi
  newTabBehavior: NewTabBehavior;
  startupBehavior: StartupBehavior;
  customNewTabContent?: ContentItem;
  customStartupContent?: ContentItem;
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

  // Grid Mode State (Izgara Modu)
  gridModeState: GridModeState;

  // Messaging State
  conversations: Conversation[];
  groups: Group[];
  messages: Record<string, Message[]>;
  calls: Call[];
  activeCall?: Call;
  currentGroupId?: string;
  currentConversationId?: string;
  privateAccounts: Record<string, PrivateAccount>;

  // Philips Hue Integration (Personal API)
  hueBridges: HueBridge[];
  hueLights: HueLight[];
  hueScenes: HueScene[];
  hueSyncs: HueSync[];
  selectedBridgeId?: string;
  hueIsLoading: boolean;
  hueError?: string;

  // YouTube & Google API Keys (User-specific)
  youtubeApiKey?: string;
  googleApiKey?: string;
  youtubeMetadataEnabled: boolean;

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
  
  // Grid Mode Actions
  setGridModeEnabled: (enabled: boolean) => void;
  setGridModeType: (type: 'vertical' | 'square') => void;
  setGridColumns: (columns: number) => void;
  setGridCurrentPage: (page: number) => void;
  
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
  updateTabMediaState: (tabId: string, hasActiveMedia: boolean, hasActiveTimer: boolean) => void;
  
  // Tab Group Actions
  createTabGroup: (name: string, color: string, tabIds: string[]) => void;
  updateTabGroup: (groupId: string, updates: Partial<TabGroup>) => void;
  deleteTabGroup: (groupId: string) => void;
  addTabToGroup: (tabId: string, groupId: string) => void;
  removeTabFromGroup: (tabId: string) => void;
  
  // New Tab/Startup Behavior
  setNewTabBehavior: (behavior: NewTabBehavior) => void;
  setStartupBehavior: (behavior: StartupBehavior) => void;
  setCustomNewTabContent: (content: ContentItem) => void;
  setCustomStartupContent: (content: ContentItem) => void;

  // Messaging Actions
  createGroup: (group: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'messageCount'>) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  addGroupMember: (groupId: string, member: GroupMember) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  updateMemberRole: (groupId: string, userId: string, role: PermissionLevel) => void;
  addMessage: (message: Message) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  searchMessages: (filter: MessageSearchFilter) => Message[];
  startCall: (call: Call) => void;
  endCall: (callId: string) => void;
  addCallParticipant: (callId: string, participant: { userId: string; userName: string; userAvatar?: string; audioEnabled: boolean; videoEnabled: boolean; screenShareActive: boolean }) => void;
  setPrivateAccount: (account: PrivateAccount) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  setCurrentConversation: (conversationId: string) => void;
  setCurrentGroup: (groupId: string) => void;

  // Keyboard Shortcuts, Macros & Gestures
  keyboardShortcuts: KeyboardShortcut[];
  gestures: Gesture[];
  macros: MacroDefinition[];
  macroPadLayouts: MacroPadLayout[];
  playerControlGroups: PlayerControlGroup[];
  activeMacroPadLayoutId?: string;

  // Cloud Sync State
  isSyncEnabled: boolean;
  lastSyncTime: number | null;

  // Keyboard Shortcuts Actions
  addKeyboardShortcut: (shortcut: KeyboardShortcut) => void;
  updateKeyboardShortcut: (shortcutId: string, updates: Partial<KeyboardShortcut>) => void;
  removeKeyboardShortcut: (shortcutId: string) => void;
  toggleShortcut: (shortcutId: string, enabled: boolean) => void;
  executeShortcutAction: (action: string, params?: any) => void;

  // Gestures Actions
  addGesture: (gesture: Gesture) => void;
  updateGesture: (gestureId: string, updates: Partial<Gesture>) => void;
  removeGesture: (gestureId: string) => void;
  toggleGesture: (gestureId: string, enabled: boolean) => void;

  // Macros Actions
  addMacro: (macro: MacroDefinition) => void;
  updateMacro: (macroId: string, updates: Partial<MacroDefinition>) => void;
  removeMacro: (macroId: string) => void;
  executeMacro: (macroId: string) => Promise<void>;

  // Macro Pad Actions
  addMacroPadLayout: (layout: MacroPadLayout) => void;
  updateMacroPadLayout: (layoutId: string, updates: Partial<MacroPadLayout>) => void;
  removeMacroPadLayout: (layoutId: string) => void;
  setActiveMacroPadLayout: (layoutId: string) => void;

  // Player Control Groups Actions
  addPlayerControlGroup: (group: PlayerControlGroup) => void;
  updatePlayerControlGroup: (groupId: string, updates: Partial<PlayerControlGroup>) => void;
  removePlayerControlGroup: (groupId: string) => void;
  togglePlayerControlPin: (groupId: string, pinned: boolean) => void;
  togglePlayerControlMiniMapPin: (groupId: string, pinned: boolean) => void;

  // Supabase Sync Actions
  initializeCloudSync: () => Promise<void>;
  syncToCloud: (dataType: SyncDataType, data: any) => void;
  loadFromCloud: () => Promise<void>;
  isSyncEnabled: boolean;
  lastSyncTime: number | null;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      user: null,
      username: null,
      tabs: [],
      tabGroups: [],
      activeTabId: '',
      tabAccessHistory: [],
      newTabBehavior: 'chrome-style',
      startupBehavior: 'last-session',
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

      // Grid Mode defaults
      gridModeState: {
        enabled: false,
        type: 'vertical',
        columns: 3,
        currentPage: 1, // Her zaman 1. sayfadan başla
        totalPages: 1,
        itemsPerPage: 3,
        totalItems: 0
      },

      // Messaging defaults
      conversations: [],
      groups: [],
      messages: {},
      calls: [],
      privateAccounts: {},

      // Hue defaults
      hueBridges: [],
      hueLights: [],
      hueScenes: [],
      hueSyncs: [],
      hueIsLoading: false,

      // YouTube & Google API defaults
      youtubeMetadataEnabled: true,

      // Keyboard Shortcuts, Macros & Gestures defaults
      keyboardShortcuts: [],
      gestures: [],
      macros: [],
      macroPadLayouts: [],
      playerControlGroups: [],

      // Cloud Sync defaults
      isSyncEnabled: false,
      lastSyncTime: null,

      setUser: (user) => {
        set({ user });
        if (user) {
          // Initialize cloud sync when user logs in
          get().initializeCloudSync();
        } else {
          // Cleanup when user logs out
          unsubscribeFromCanvasChanges();
          set({ isSyncEnabled: false });
        }
      },
      setUsername: (username) => set({ username }),
      setActiveTab: (activeTabId) => {
        const { tabs } = get();
        const activeTab = tabs.find(t => t.id === activeTabId);
        const isLibraryTab = activeTab && (activeTab.id === 'root' || activeTab.type === 'root');

        get().recordTabAccess(activeTabId);
        set({ 
          activeTabId,
          isSecondLeftSidebarOpen: !!isLibraryTab,
          activeSecondaryPanel: isLibraryTab ? 'library' : get().activeSecondaryPanel
        });
      },
      setTabs: (tabs) => {
        set({ tabs });
        get().syncToCloud('tabs', tabs);
      },
      setIsUiHidden: (isUiHidden) => set({ isUiHidden }),
      setPointerFrameEnabled: (pointerFrameEnabled) => set({ pointerFrameEnabled }),
      setAudioTrackerEnabled: (audioTrackerEnabled) => set({ audioTrackerEnabled }),
      setMouseTrackerEnabled: (mouseTrackerEnabled) => set({ mouseTrackerEnabled }),
      setVirtualizerMode: (virtualizerMode) => set({ virtualizerMode }),
      setVisualizerMode: (visualizerMode) => set({ visualizerMode }),
      
      // Grid Mode Actions
      setGridModeEnabled: (enabled) => set({ gridModeState: { ...get().gridModeState, enabled } }),
      setGridModeType: (type) => set({ gridModeState: { ...get().gridModeState, type, currentPage: 1 } }),
      setGridColumns: (columns) => set({ gridModeState: { ...get().gridModeState, columns, currentPage: 1 } }),
      setGridCurrentPage: (page) => set({ gridModeState: { ...get().gridModeState, currentPage: page } }),
      
      setLayoutMode: (layoutMode) => {
        const normalized = layoutMode === 'canvas' ? 'canvas' : 'grid';
        set({ layoutMode: normalized });
        const { user } = get();
        if (user) {
          saveUserPreferences(user.id, { layout_mode: normalized });
        }
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
        const { tabs, newTabBehavior, customNewTabContent } = get();
        
        // Chrome-style new tab behavior
        if (newTabBehavior === 'chrome-style') {
          const newId = `tab-${Date.now()}`;
          const now = new Date().toISOString();
          
          const newTab: Tab = {
            id: newId,
            title: 'Yeni Sekme',
            type: 'new-tab',
            activeViewId: newId,
            createdAt: now,
            updatedAt: now,
            parentId: null,
            isDeletable: true,
            history: [newId],
            historyIndex: 0,
            navigationHistory: [newId],
            navigationIndex: 0,
            undoRedoStack: [{ activeViewId: newId, timestamp: Date.now() }],
            undoRedoIndex: 0
          };
          
          set({ 
            tabs: [...tabs, newTab], 
            activeTabId: newId,
            isSecondLeftSidebarOpen: false,
            activeSecondaryPanel: null
          });
          return;
        }
        
        // Library behavior
        if (newTabBehavior === 'library') {
          // Open root library in new tab
          set({ 
            isSecondLeftSidebarOpen: true,
            activeSecondaryPanel: 'library'
          });
          return;
        }
        
        // Custom behavior
        if (newTabBehavior === 'custom' && customNewTabContent) {
          const newId = customNewTabContent.id;
          const existingTab = tabs.find(t => t.id === newId);
          if (existingTab) {
            set({ activeTabId: newId });
            return;
          }
          
          const now = new Date().toISOString();
          const newTab: Tab = {
            ...customNewTabContent,
            activeViewId: customNewTabContent.id,
            history: [customNewTabContent.id],
            historyIndex: 0,
            navigationHistory: [customNewTabContent.id],
            navigationIndex: 0,
            undoRedoStack: [{ activeViewId: customNewTabContent.id, timestamp: Date.now() }],
            undoRedoIndex: 0
          };
          
          set({ 
            tabs: [...tabs, newTab], 
            activeTabId: newId
          });
          return;
        }
        
        // Default: Legacy 3-panel layout (fallback)
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
          layoutMode: 'grid'
        };
        set({ 
          tabs: [...tabs, newTab], 
          activeTabId: newId,
          isSecondLeftSidebarOpen: true,
          activeSecondaryPanel: 'library'
        });
      },
      updateTab: (tabId, updates) => {
        set((state) => {
          const newTabs = state.tabs.map((t) => (t.id === tabId ? { ...t, ...updates } : t));
          get().syncToCloud('tabs', newTabs);
          return { tabs: newTabs };
        });
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
        get().syncToCloud('expanded_items', newExpanded);
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
            t.id === tabId ? { ...t, lastAccessedAt: now } : t
          )
        };
      }),
      updateTabMediaState: (tabId, hasActiveMedia, hasActiveTimer) => set((state) => ({
        tabs: state.tabs.map(t => 
          t.id === tabId ? { ...t, hasActiveMedia, hasActiveTimer } : t
        )
      })),
      
      // Tab Group Actions
      createTabGroup: (name, color, tabIds) => set((state) => ({
        tabGroups: [...state.tabGroups, {
          id: `group-${Date.now()}`,
          name,
          color,
          collapsed: false,
          tabIds
        }],
        tabs: state.tabs.map(tab => 
          tabIds.includes(tab.id) ? { ...tab, groupId: `group-${Date.now()}` } : tab
        )
      })),
      updateTabGroup: (groupId, updates) => set((state) => ({
        tabGroups: state.tabGroups.map(g => 
          g.id === groupId ? { ...g, ...updates } : g
        )
      })),
      deleteTabGroup: (groupId) => set((state) => ({
        tabGroups: state.tabGroups.filter(g => g.id !== groupId),
        tabs: state.tabs.map(tab => 
          tab.groupId === groupId ? { ...tab, groupId: undefined } : tab
        )
      })),
      addTabToGroup: (tabId, groupId) => set((state) => {
        const group = state.tabGroups.find(g => g.id === groupId);
        if (!group) return state;
        
        return {
          tabGroups: state.tabGroups.map(g => 
            g.id === groupId 
              ? { ...g, tabIds: [...new Set([...g.tabIds, tabId])] }
              : g
          ),
          tabs: state.tabs.map(tab => 
            tab.id === tabId ? { ...tab, groupId } : tab
          )
        };
      }),
      removeTabFromGroup: (tabId) => set((state) => ({
        tabGroups: state.tabGroups.map(g => ({
          ...g,
          tabIds: g.tabIds.filter(id => id !== tabId)
        })),
        tabs: state.tabs.map(tab => 
          tab.id === tabId ? { ...tab, groupId: undefined } : tab
        )
      })),
      
      // New Tab/Startup Behavior Settings
      setNewTabBehavior: (behavior) => set({ newTabBehavior: behavior }),
      setStartupBehavior: (behavior) => set({ startupBehavior: behavior }),
      setCustomNewTabContent: (content) => set({ customNewTabContent: content }),
      setCustomStartupContent: (content) => set({ customStartupContent: content }),

      // Messaging Actions
      createGroup: (group) => set((state) => ({
        groups: [...state.groups, {
          ...group,
          id: `group-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0,
        }]
      })),
      updateGroup: (groupId, updates) => set((state) => ({
        groups: state.groups.map(g => g.id === groupId ? { ...g, ...updates } : g)
      })),
      addGroupMember: (groupId, member) => set((state) => ({
        groups: state.groups.map(g => 
          g.id === groupId 
            ? { ...g, members: [...g.members, member] }
            : g
        )
      })),
      removeGroupMember: (groupId, userId) => set((state) => ({
        groups: state.groups.map(g => 
          g.id === groupId 
            ? { ...g, members: g.members.filter(m => m.userId !== userId) }
            : g
        )
      })),
      updateMemberRole: (groupId, userId, role) => set((state) => ({
        groups: state.groups.map(g => 
          g.id === groupId 
            ? { ...g, members: g.members.map(m => m.userId === userId ? { ...m, role } : m) }
            : g
        )
      })),
      addMessage: (message) => set((state) => ({
        messages: {
          ...state.messages,
          [message.conversationId]: [...(state.messages[message.conversationId] || []), message]
        }
      })),
      editMessage: (messageId, content) => set((state) => {
        const updatedMessages: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(state.messages)) {
          updatedMessages[convId] = msgs.map(m => 
            m.id === messageId 
              ? { ...m, content, isEdited: true, editedAt: new Date().toISOString() }
              : m
          );
        }
        return { messages: updatedMessages };
      }),
      deleteMessage: (conversationId, messageId) => set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId]?.filter(m => m.id !== messageId) || []
        }
      })),
      searchMessages: (filter) => {
        const { query, conversationId, senderId, type, startDate, endDate } = filter;
        const allMessages = Object.values(get().messages).flat();
        return allMessages.filter(msg => {
          if (conversationId && msg.conversationId !== conversationId) return false;
          if (senderId && msg.senderId !== senderId) return false;
          if (type && msg.type !== type) return false;
          if (query && !msg.content.toLowerCase().includes(query.toLowerCase())) return false;
          if (startDate && new Date(msg.createdAt) < new Date(startDate)) return false;
          if (endDate && new Date(msg.createdAt) > new Date(endDate)) return false;
          return true;
        });
      },
      startCall: (call) => set((state) => ({
        calls: [...state.calls, call],
        activeCall: call
      })),
      endCall: (callId) => set((state) => ({
        calls: state.calls.map(c => c.id === callId ? { ...c, status: 'ended' as const, endedAt: new Date().toISOString() } : c),
        activeCall: state.activeCall?.id === callId ? undefined : state.activeCall
      })),
      addCallParticipant: (callId, participant) => set((state) => ({
        calls: state.calls.map(c => 
          c.id === callId 
            ? { ...c, participants: [...c.participants, participant] }
            : c
        )
      })),
      setPrivateAccount: (account) => set((state) => ({
        privateAccounts: {
          ...state.privateAccounts,
          [account.userId]: account
        }
      })),
      blockUser: (userId) => set((state) => {
        const currentUser = state.user?.id;
        if (!currentUser) return state;
        const account = state.privateAccounts[currentUser] || { userId: currentUser, privacyLevel: 'public', blockedUsers: [], allowedFollowers: [], followRequests: [], acceptedFollowers: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        return {
          privateAccounts: {
            ...state.privateAccounts,
            [currentUser]: {
              ...account,
              blockedUsers: [...new Set([...account.blockedUsers, userId])]
            }
          }
        };
      }),
      unblockUser: (userId) => set((state) => {
        const currentUser = state.user?.id;
        if (!currentUser) return state;
        const account = state.privateAccounts[currentUser];
        if (!account) return state;
        return {
          privateAccounts: {
            ...state.privateAccounts,
            [currentUser]: {
              ...account,
              blockedUsers: account.blockedUsers.filter(id => id !== userId)
            }
          }
        };
      }),
      setCurrentConversation: (conversationId) => set({ currentConversationId: conversationId }),
      setCurrentGroup: (groupId) => set({ currentGroupId: groupId }),

      // Hue Actions
      addHueBridge: (bridge) => set((state) => ({
        hueBridges: [...state.hueBridges, bridge]
      })),
      updateHueBridge: (bridgeId, updates) => set((state) => ({
        hueBridges: state.hueBridges.map(b => 
          b.id === bridgeId ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
        )
      })),
      removeHueBridge: (bridgeId) => set((state) => ({
        hueBridges: state.hueBridges.filter(b => b.id !== bridgeId),
        hueLights: state.hueLights.filter(l => l.bridgeId !== bridgeId),
        hueScenes: state.hueScenes.filter(s => s.bridgeId !== bridgeId),
        hueSyncs: state.hueSyncs.filter(sy => sy.bridgeId !== bridgeId)
      })),
      setSelectedBridgeId: (bridgeId) => set({ selectedBridgeId: bridgeId }),
      addHueLight: (light) => set((state) => ({
        hueLights: [...state.hueLights, light]
      })),
      updateHueLight: (lightId, updates) => set((state) => ({
        hueLights: state.hueLights.map(l => 
          l.id === lightId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
        )
      })),
      removeHueLight: (lightId) => set((state) => ({
        hueLights: state.hueLights.filter(l => l.id !== lightId)
      })),
      addHueScene: (scene) => set((state) => ({
        hueScenes: [...state.hueScenes, scene]
      })),
      updateHueScene: (sceneId, updates) => set((state) => ({
        hueScenes: state.hueScenes.map(s => 
          s.id === sceneId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        )
      })),
      removeHueScene: (sceneId) => set((state) => ({
        hueScenes: state.hueScenes.filter(s => s.id !== sceneId)
      })),
      addHueSync: (sync) => set((state) => ({
        hueSyncs: [...state.hueSyncs, sync]
      })),
      updateHueSync: (syncId, updates) => set((state) => ({
        hueSyncs: state.hueSyncs.map(sy => 
          sy.id === syncId ? { ...sy, ...updates, updatedAt: new Date().toISOString() } : sy
        )
      })),
      removeHueSync: (syncId) => set((state) => ({
        hueSyncs: state.hueSyncs.filter(sy => sy.id !== syncId)
      })),
      setHueLoading: (loading) => set({ hueIsLoading: loading }),
      setHueError: (error) => set({ hueError: error }),

      // YouTube & Google API Actions
      setYoutubeApiKey: (key) => set({ youtubeApiKey: key }),
      setGoogleApiKey: (key) => set({ googleApiKey: key }),
      setYoutubeMetadataEnabled: (enabled) => set({ youtubeMetadataEnabled: enabled }),

      // Keyboard Shortcuts Actions
      addKeyboardShortcut: (shortcut) => set((state) => ({
        keyboardShortcuts: [...state.keyboardShortcuts, shortcut]
      })),
      updateKeyboardShortcut: (shortcutId, updates) => set((state) => ({
        keyboardShortcuts: state.keyboardShortcuts.map(s =>
          s.id === shortcutId ? { ...s, ...updates } : s
        )
      })),
      removeKeyboardShortcut: (shortcutId) => set((state) => ({
        keyboardShortcuts: state.keyboardShortcuts.filter(s => s.id !== shortcutId)
      })),
      toggleShortcut: (shortcutId, enabled) => set((state) => ({
        keyboardShortcuts: state.keyboardShortcuts.map(s =>
          s.id === shortcutId ? { ...s, isEnabled: enabled } : s
        )
      })),
      executeShortcutAction: (action, params) => {
        // Action execution logic will be handled by a separate keyboard manager
        console.log('Execute shortcut action:', action, params);
      },

      // Gestures Actions
      addGesture: (gesture) => set((state) => ({
        gestures: [...state.gestures, gesture]
      })),
      updateGesture: (gestureId, updates) => set((state) => ({
        gestures: state.gestures.map(g =>
          g.id === gestureId ? { ...g, ...updates } : g
        )
      })),
      removeGesture: (gestureId) => set((state) => ({
        gestures: state.gestures.filter(g => g.id !== gestureId)
      })),
      toggleGesture: (gestureId, enabled) => set((state) => ({
        gestures: state.gestures.map(g =>
          g.id === gestureId ? { ...g, isEnabled: enabled } : g
        )
      })),

      // Macros Actions
      addMacro: (macro) => set((state) => ({
        macros: [...state.macros, macro]
      })),
      updateMacro: (macroId, updates) => set((state) => ({
        macros: state.macros.map(m =>
          m.id === macroId ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
        )
      })),
      removeMacro: (macroId) => set((state) => ({
        macros: state.macros.filter(m => m.id !== macroId)
      })),
      executeMacro: async (macroId) => {
        const { macros } = get();
        const macro = macros.find(m => m.id === macroId);
        if (!macro || !macro.isEnabled) return;

        // Execute actions sequentially
        for (const action of macro.actions) {
          if (action.delay) {
            await new Promise(resolve => setTimeout(resolve, action.delay));
          }
          // Action execution logic will be handled by macro executor
          console.log('Execute macro action:', action);
        }
      },

      // Macro Pad Actions
      addMacroPadLayout: (layout) => set((state) => ({
        macroPadLayouts: [...state.macroPadLayouts, layout]
      })),
      updateMacroPadLayout: (layoutId, updates) => set((state) => ({
        macroPadLayouts: state.macroPadLayouts.map(l =>
          l.id === layoutId ? { ...l, ...updates } : l
        )
      })),
      removeMacroPadLayout: (layoutId) => set((state) => ({
        macroPadLayouts: state.macroPadLayouts.filter(l => l.id !== layoutId)
      })),
      setActiveMacroPadLayout: (layoutId) => set({ activeMacroPadLayoutId: layoutId }),

      // Player Control Groups Actions
      addPlayerControlGroup: (group) => set((state) => ({
        playerControlGroups: [...state.playerControlGroups, group]
      })),
      updatePlayerControlGroup: (groupId, updates) => set((state) => ({
        playerControlGroups: state.playerControlGroups.map(g =>
          g.id === groupId ? { ...g, ...updates } : g
        )
      })),
      removePlayerControlGroup: (groupId) => set((state) => ({
        playerControlGroups: state.playerControlGroups.filter(g => g.id !== groupId)
      })),
      togglePlayerControlPin: (groupId, pinned) => set((state) => ({
        playerControlGroups: state.playerControlGroups.map(g =>
          g.id === groupId ? { ...g, isPinned: pinned } : g
        )
      })),
      togglePlayerControlMiniMapPin: (groupId, pinned) => set((state) => ({
        playerControlGroups: state.playerControlGroups.map(g =>
          g.id === groupId ? { ...g, isPinnedToMiniMap: pinned } : g
        )
      })),

      // Supabase Sync Actions
      initializeCloudSync: async () => {
        const { user } = get();
        if (!user) return;

        try {
          // Migrate local storage to cloud if needed
          await migrateLocalStorageToCloud(user.id);

          // Load data from cloud
          await get().loadFromCloud();

          // Subscribe to real-time changes
          subscribeToCanvasChanges(user.id, ({ dataType, data }) => {
            const state = get();
            
            switch (dataType) {
              case 'tabs':
                set({ tabs: data });
                break;
              case 'expanded_items':
                set({ expandedItems: data });
                break;
              case 'settings':
                // Update preferences
                if (data.layout_mode) set({ layoutMode: data.layout_mode });
                if (data.new_tab_behavior) set({ newTabBehavior: data.new_tab_behavior });
                if (data.startup_behavior) set({ startupBehavior: data.startup_behavior });
                if (data.grid_mode_state) set({ gridModeState: data.grid_mode_state });
                if (data.ui_settings) {
                  const ui = data.ui_settings;
                  set({
                    isSecondLeftSidebarOpen: ui.isSecondLeftSidebarOpen ?? state.isSecondLeftSidebarOpen,
                    activeSecondaryPanel: ui.activeSecondaryPanel ?? state.activeSecondaryPanel,
                    pointerFrameEnabled: ui.pointerFrameEnabled ?? state.pointerFrameEnabled,
                    audioTrackerEnabled: ui.audioTrackerEnabled ?? state.audioTrackerEnabled,
                    mouseTrackerEnabled: ui.mouseTrackerEnabled ?? state.mouseTrackerEnabled,
                    virtualizerMode: ui.virtualizerMode ?? state.virtualizerMode,
                    visualizerMode: ui.visualizerMode ?? state.visualizerMode,
                  });
                }
                break;
            }
          });

          set({ isSyncEnabled: true, lastSyncTime: Date.now() });
        } catch (error) {
          console.error('Failed to initialize cloud sync:', error);
        }
      },

      syncToCloud: (dataType, data) => {
        const { user, isSyncEnabled } = get();
        if (!user || !isSyncEnabled) return;
        
        debouncedSyncToCloud(dataType, data, user.id);
        set({ lastSyncTime: Date.now() });
      },

      loadFromCloud: async () => {
        const { user } = get();
        if (!user) return;

        try {
          // Load all canvas data
          const data = await loadAllCanvasData(user.id);
          if (data) {
            if (data.tabs) set({ tabs: data.tabs });
            if (data.expandedItems) set({ expandedItems: data.expandedItems });
          }

          // Load preferences
          const prefs = await loadUserPreferences(user.id);
          if (prefs) {
            set({
              layoutMode: prefs.layout_mode,
              newTabBehavior: prefs.new_tab_behavior,
              startupBehavior: prefs.startup_behavior,
              gridModeState: prefs.grid_mode_state || get().gridModeState,
            });

            if (prefs.ui_settings) {
              const ui = prefs.ui_settings;
              set({
                isSecondLeftSidebarOpen: ui.isSecondLeftSidebarOpen ?? true,
                activeSecondaryPanel: ui.activeSecondaryPanel ?? 'library',
                pointerFrameEnabled: ui.pointerFrameEnabled ?? false,
                audioTrackerEnabled: ui.audioTrackerEnabled ?? false,
                mouseTrackerEnabled: ui.mouseTrackerEnabled ?? false,
                virtualizerMode: ui.virtualizerMode ?? false,
                visualizerMode: ui.visualizerMode ?? 'off',
              });
            }
          }

          set({ lastSyncTime: Date.now() });
        } catch (error) {
          console.error('Failed to load from cloud:', error);
        }
      },
    }),
    {
      name: 'tv25-storage',
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
        tabGroups: state.tabGroups,
        activeTabId: state.activeTabId,
        newTabBehavior: state.newTabBehavior,
        startupBehavior: state.startupBehavior,
        customNewTabContent: state.customNewTabContent,
        customStartupContent: state.customStartupContent,
        isSecondLeftSidebarOpen: state.isSecondLeftSidebarOpen,
        activeSecondaryPanel: state.activeSecondaryPanel,
        gridModeState: state.gridModeState,
        expandedItems: state.expandedItems,
        // API Keys (persisted for user convenience and privacy)
        youtubeApiKey: state.youtubeApiKey,
        googleApiKey: state.googleApiKey,
        youtubeMetadataEnabled: state.youtubeMetadataEnabled,
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
