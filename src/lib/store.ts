// --- Search History Types ---
export type SearchHistoryItem = {
  id: string;
  query: string;
  createdAt: string;
};
// --- Multi-Tab Split View & Gridify Utilities ---
export type SplitTabSection = {
  id: string;
  tabId: string;
  width: number; // percent or px
  height: number; // percent or px
  x: number;
  y: number;
};

export type SplitViewState = {
  mode: 'single' | 'split-2' | 'split-3' | 'split-grid';
  sections: SplitTabSection[];
};

// Add to AppStore interface:
// splitView: SplitViewState;
// setSplitView: (state: Partial<SplitViewState>) => void;
// splitTabs: (mode: 'split-2' | 'split-3' | 'split-grid') => void;
// gridifySplitView: () => void;
// resizeSplitSection: (sectionId: string, newSize: { width?: number; height?: number }) => void;

// --- Advanced Move/Transfer Utilities ---
/**
 * Move a ContentItem to a new parent (folder/canvas/grid), updating parentId, order, and layoutMode as needed.
 * Supports moving between folders, canvas, and grid, and can be extended for cross-tab/cross-viewport moves.
 */

export function moveContentItem({
  itemId,
  newParentId,
  newOrder = 0,
  newLayoutMode,
  tabs,
  items,
}: {
  itemId: string;
  newParentId: string;
  newOrder?: number;
  newLayoutMode?: 'grid' | 'canvas';
  tabs: Tab[];
  items: ContentItem[];
}): { updatedTabs: Tab[]; updatedItems: ContentItem[] } {
  // Map 'canvas' to 'free' for compatibility
  const normalizeLayoutMode = (mode?: 'grid' | 'canvas' | string): ContentItem['layoutMode'] => {
    if (mode === 'canvas') return 'free';
    if (mode === 'grid') return 'grid';
    if (["studio","presentation","stream","free","carousel"].includes(String(mode))) {
      return mode as ContentItem['layoutMode'];
    }
    return undefined;
  };
  // Find the item
  const item = items.find(i => i.id === itemId);
  if (!item) return { updatedTabs: tabs, updatedItems: items };
  // Remove from old parent
  let updatedItems = items.map(i =>
    i.id === itemId
      ? {
          ...i,
          parentId: newParentId,
          order: newOrder,
          layoutMode: normalizeLayoutMode(newLayoutMode || i.layoutMode)
        } as ContentItem
      : i
  );
  return { updatedTabs: tabs, updatedItems };
}

/**
 * Move multiple ContentItems (batch move), e.g. for drag-select or multi-select moves.
 */

export function moveMultipleContentItems({
  itemIds,
  newParentId,
  newLayoutMode,
  tabs,
  items,
}: {
  itemIds: string[];
  newParentId: string;
  newLayoutMode?: 'grid' | 'canvas';
  tabs: Tab[];
  items: ContentItem[];
}): { updatedTabs: Tab[]; updatedItems: ContentItem[] } {
  const normalizeLayoutMode = (mode?: 'grid' | 'canvas' | string): ContentItem['layoutMode'] => {
    if (mode === 'canvas') return 'free';
    if (mode === 'grid') return 'grid';
    if (["studio","presentation","stream","free","carousel"].includes(String(mode))) {
      return mode as ContentItem['layoutMode'];
    }
    return undefined;
  };
  let updatedItems = items.map(i =>
    itemIds.includes(i.id)
      ? {
          ...i,
          parentId: newParentId,
          layoutMode: normalizeLayoutMode(newLayoutMode || i.layoutMode)
        } as ContentItem
      : i
  );
  return { updatedTabs: tabs, updatedItems };
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ContentItem, KeyboardShortcut, Gesture, MacroDefinition, MacroPadLayout, PlayerControlGroup, Account, CorporateAccount, CorporateMember, AccountType } from './initial-content';
import { User } from '@supabase/supabase-js';
import { Message as MessageData, MessageType, Conversation as ConversationData, Group, Call, GroupMember, PermissionLevel, PrivateAccount, MessageSearchFilter, CallStatus } from './messaging-types';
import { syncLogger } from './logger';

// Simplified conversation interface for store (backward compatible)
export interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isTyping: boolean;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
}

// Simplified message interface for store
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string;
  replyToId?: string;
  reactions: Array<{ emoji: string; userId: string; userName: string }>;
}
import { HueBridge, HueLight, HueScene, HueSync } from './hue-types';
import { GridModeState } from './layout-engine';
import { ShoppingCart, CartItem, Product, Order } from './ecommerce-types';
import { SubscriptionTier } from './subscription-types';
import { createClient } from './supabase/client';
import { 
  subscribeToCanvasChanges, 
  unsubscribeFromCanvasChanges, 
  loadAllCanvasData, 
  loadUserPreferences, 
  debouncedSyncToCloud,
  saveUserPreferences,
  migrateLocalStorageToCloud,
  SyncDataType,
  // Toolkit sync functions
  syncKeyboardShortcuts,
  syncGestures,
  syncMacros,
  syncMacroPads,
  syncPlayerControls,
  loadKeyboardShortcuts,
  loadGestures,
  loadMacros,
  loadMacroPads,
  loadPlayerControls,
  subscribeToToolkitChanges
} from './supabase-sync';
import { AIProviderConfig, AIAgentConfig, DEFAULT_PROVIDERS } from './ai-providers';
import {
  MarketplaceListing,
  ProductLifecycleTracking,
  Warranty,
  Insurance,
  Appraisal,
  FinancingOption,
  InventoryTransaction,
  WishlistItem,
  MarketplaceViewMode,
  InventorySettings,
  InventoryItemStatus,
} from './marketplace-types';
import {
  TrashItem,
  TrashBucket,
  TrashStats,
  RecoveryLog,
  RestoreOption,
} from './trash-types';
import {
  Scene,
  Presentation,
  TransitionEffect,
  Animation,
  ViewportEditorState,
  BroadcastSession,
  StreamSettings,
} from './scene-types';
import {
  ProfileSlug,
  ProfileSlugReference,
  FolderSlug,
  FolderStructure,
  MessageGroup,
  GroupInviteLink,
  CallSession,
  CallHistory,
  ScheduledMeeting,
  MeetingRecording,
  MeetingFollowUp,
  SocialGroup,
  SocialGroupMember,
  SocialGroupPost,
  JoinRequest,
} from './advanced-features-types';

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
export type EcommerceView = 'products' | 'marketplace' | 'cart' | 'orders';



interface AppStore {
  // Search History
  searchHistory: SearchHistoryItem[];
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
    // Split View State
    splitView: SplitViewState;
    setSplitView: (state: Partial<SplitViewState>) => void;
    splitTabs: (mode: 'split-2' | 'split-3' | 'split-grid') => void;
    gridifySplitView: () => void;
    resizeSplitSection: (sectionId: string, newSize: { width?: number; height?: number }) => void;
  user: User | null;
  username: string | null;
  
  // Multi-Account System
  accounts: Account[];
  currentAccountId: string | null;
  currentAccount: Account | null;
  corporateAccounts: CorporateAccount[];
  corporateMembers: CorporateMember[];
  
  tabs: Tab[];
  tabGroups: TabGroup[];
  activeTabId: string;
  tabAccessHistory: Array<{ tabId: string; timestamp: number }>; // Son 3 sekme geçmişi
  newTabBehavior: NewTabBehavior;
  startupBehavior: StartupBehavior;
  customNewTabContent?: ContentItem;
  customStartupContent?: ContentItem;
  isSecondLeftSidebarOpen: boolean;
  activeSecondaryPanel: 'library' | 'social' | 'messages' | 'widgets' | 'notifications' | 'spaces' | 'devices' | 'ai-chat' | 'shopping' | 'profile' | 'advanced-profiles' | 'message-groups' | 'calls' | 'meetings' | 'social-groups' | null;
  isStyleSettingsOpen: boolean;
  isViewportEditorOpen: boolean;
  isSpacesPanelOpen: boolean;
  isDevicesPanelOpen: boolean;
  ecommerceView: EcommerceView;
  searchPanelState: SearchPanelState;
  chatPanels: ChatPanelState[];
  itemToShare: ContentItem | null;
  itemToSave: ContentItem | null;
  itemForInfo: ContentItem | null;
  itemForPreview: ContentItem | null;
  itemToMessage: ContentItem | null;
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
  youtubeVideos: import('./youtube-api').YouTubeVideo[];
  youtubeChannels: any[];
  youtubePlaylists: any[];
  youtubeSearchResults: import('./youtube-api').YouTubeVideo[];
  setYoutubeVideos: (videos: import('./youtube-api').YouTubeVideo[]) => void;
  setYoutubeChannels: (channels: any[]) => void;
  setYoutubePlaylists: (playlists: any[]) => void;
  setYoutubeSearchResults: (results: import('./youtube-api').YouTubeVideo[]) => void;
  searchYoutube: (query: string, filters?: any) => Promise<void>;

  // AI Provider System
  aiProviders: AIProviderConfig[];
  aiAgentConfig: AIAgentConfig;

  // Additional API Keys (grouped by category)
  apiKeys: {
    // Media & Content
    spotify?: string;
    soundcloud?: string;
    vimeo?: string;
    
    // Cloud Storage
    dropbox?: string;
    onedrive?: string;
    googleDrive?: string;
    
    // Communication
    slack?: string;
    discord?: string;
    telegram?: string;
    
    // IoT & Smart Home
    homeAssistant?: string;
    mqtt?: string;
    
    // Analytics & Monitoring
    mixpanel?: string;
    amplitude?: string;
    sentry?: string;
    
    // Other
    weather?: string;
    news?: string;
    translation?: string;
  };

  // E-Commerce & Marketplace State
  shoppingCart: ShoppingCart;
  products: Product[];
  orders: Order[];
  userSubscriptionTier: SubscriptionTier;
  stripeCustomerId?: string;

  // Marketplace & Inventory Management
  marketplaceListings: MarketplaceListing[];
  myInventoryItems: ContentItem[];
  lifecycleTrackings: Record<string, ProductLifecycleTracking>;
  warranties: Warranty[];
  insurances: Insurance[];
  appraisals: Appraisal[];
  financingOptions: FinancingOption[];
  inventoryTransactions: InventoryTransaction[];
  wishlistItems: WishlistItem[];
  marketplaceViewMode: MarketplaceViewMode;
  inventorySettings: InventorySettings;

  // Trash/Recycle Bin System
  trashItems: TrashItem[];
  trashBucket: TrashBucket | null;
  trashStats: TrashStats | null;
  isTrashLoading: boolean;

  // Scenes & Presentations
  scenes: Scene[];
  presentations: Presentation[];
  currentPresentationId: string | null;
  currentSceneId: string;
  viewportEditorState: ViewportEditorState;
  broadcastSessions: BroadcastSession[];
  isSceneEditorOpen: boolean;
  isPreviewMode: boolean;

  // Profile & Social State
  profileCanvasId: string | null;
  socialPosts: ContentItem[];
  mySharedItems: ContentItem[];

  // Actions
  setUser: (user: User | null) => void;
  setUsername: (username: string | null) => void;
  
  // Multi-Account Actions
  switchAccount: (accountId: string) => Promise<void>;
  switchToCorporateAccount: (corporateId: string) => Promise<void>;
  addAccount: (account: Account) => void;
  removeAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<Account>) => void;
  createCorporateAccount: (account: Omit<CorporateAccount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addCorporateMember: (member: Omit<CorporateMember, 'id' | 'joinedAt'>) => void;
  removeCorporateMember: (memberId: string) => void;
  updateCorporateMember: (memberId: string, updates: Partial<CorporateMember>) => void;
  setCurrentAccount: (account: Account | null) => void;
  
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
  togglePanel: (panel: 'isSecondLeftSidebarOpen' | 'isStyleSettingsOpen' | 'isSpacesPanelOpen' | 'isDevicesPanelOpen' | 'isViewportEditorOpen', open?: boolean) => void;
  setActiveSecondaryPanel: (panel: AppStore['activeSecondaryPanel']) => void;
  setEcommerceView: (view: EcommerceView) => void;
  updateSearchPanel: (update: Partial<SearchPanelState>) => void;
  setItemToShare: (item: ContentItem | null) => void;
  setItemToSave: (item: ContentItem | null) => void;
  setItemForInfo: (item: ContentItem | null) => void;
  setItemForPreview: (item: ContentItem | null) => void;
  setItemToMessage: (item: ContentItem | null) => void;
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

  // AI Provider Actions
  addAIProvider: (provider: AIProviderConfig) => void;
  updateAIProvider: (providerId: string, updates: Partial<AIProviderConfig>) => void;
  removeAIProvider: (providerId: string) => void;
  setDefaultAIProvider: (providerId: string) => void;
  updateAIAgentConfig: (updates: Partial<AIAgentConfig>) => void;

  // API Keys Actions
  setApiKey: (category: string, key: string, value: string) => void;
  clearApiKey: (key: string) => void;

  // YouTube & Google API Actions
  setYoutubeApiKey: (key?: string) => void;
  setGoogleApiKey: (key?: string) => void;
  setYoutubeMetadataEnabled: (enabled: boolean) => void;

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

  // Toolkit Cloud Sync Actions
  syncToolkitKeyboardShortcuts: () => Promise<void>;
  syncToolkitGestures: () => Promise<void>;
  syncToolkitMacros: () => Promise<void>;
  syncToolkitMacroPads: () => Promise<void>;
  syncToolkitPlayerControls: () => Promise<void>;
  loadToolkitFromCloud: () => Promise<void>;
  initializeToolkitCloudSync: () => Promise<void>;

  // Comprehensive Live Data Sync Actions
  syncCanvasItem: (item: ContentItem) => Promise<void>;
  syncAllCanvasItems: (items: ContentItem[]) => Promise<void>;
  loadCanvasItemsFromCloud: () => Promise<ContentItem[]>;
  saveSearchQuery: (query: string, type: string, resultsCount?: number, metadata?: any) => Promise<void>;
  loadSearchHistory: (limit?: number) => Promise<any[]>;
  saveAIConversation: (conversationId: string, title: string, contextItems?: any[], metadata?: any) => Promise<void>;
  saveAIMessage: (conversationId: string, role: 'user' | 'assistant' | 'system', content: string, sequenceNumber: number, toolCalls?: any[], toolResults?: any[], metadata?: any) => Promise<void>;
  loadAIConversations: () => Promise<any[]>;
  loadAIMessages: (conversationId: string) => Promise<any[]>;
  saveFrameStyleUpdate: (itemId: string, styleType: string, previousValue: any, newValue: any, appliedBy?: string, metadata?: any) => Promise<void>;
  loadFrameStyleHistory: (itemId?: string, limit?: number) => Promise<any[]>;
  saveLayoutState: (viewId: string, layoutMode: string, viewportSettings?: any, zoomLevel?: number, scrollPosition?: any, visibleItems?: string[]) => Promise<void>;
  loadLayoutState: (viewId: string) => Promise<any | null>;
  trackInteraction: (itemId: string, interactionType: string, durationMs?: number, metadata?: any) => Promise<void>;
  subscribeToCanvasItemsChanges: () => () => void;
  subscribeToSearchHistoryChanges: () => () => void;
  subscribeToAIChatChanges: () => () => void;

  // Multi-Tab Sync Actions (Tüm Sekmeler Arası Senkronizasyon)
  trackMultiTabSync: (deviceId: string, tabId: string, entityType: any, entityId: string, action: any, changeData?: any) => Promise<void>;
  subscribeToMultiTabSync: () => () => void;

  // Sharing System Actions (Paylaşım Sistemi)
  createSharedItem: (itemId: string, itemType: string) => Promise<any>;
  grantSharingPermission: (sharedItemId: string, granteeUserId: string | null, granteeEmail: string | null, role: string, permissions: any, expiresAt?: string) => Promise<any>;
  createSharingLink: (sharedItemId: string, settings: any) => Promise<any>;
  logSharingAccess: (sharingLinkId: string, userId: string | null, ipAddress: string | null, userAgent: string, action: string) => Promise<void>;
  getSharedItems: () => Promise<any[]>;

  // Social Realtime Actions (Sosyal Canlı Güncellemeler)
  logSocialEvent: (eventType: string, targetEntityType: string, targetEntityId: string, actorId: string, eventData?: any) => Promise<void>;
  subscribeSocialEvents: () => () => void;

  // Message Delivery Actions (Mesaj Gönderimi)
  updateMessageDelivery: (messageId: string, status: 'sent' | 'delivered' | 'read', deviceId?: string, tabIds?: string[]) => Promise<void>;
  subscribeMessageDelivery: () => () => void;

  // Unified AI Service Actions (Vercel AI Gateway + Supabase)
  sendAIMessage: (message: string, options?: { conversationId?: string; streaming?: boolean; priority?: 'speed' | 'quality' | 'cost' }) => Promise<any>;
  sendVisionMessage: (message: string, imageUrl: string, options?: { conversationId?: string; streaming?: boolean }) => Promise<any>;
  getAIConversations: (options?: { includeArchived?: boolean; limit?: number }) => Promise<any[]>;
  deleteAIConversation: (conversationId: string) => Promise<void>;
  archiveAIConversation: (conversationId: string, archived: boolean) => Promise<void>;
  pinAIConversation: (conversationId: string, pinned: boolean) => Promise<void>;
  getAIConversationWithMessages: (conversationId: string) => Promise<any>;
  updateAIConversationTitle: (conversationId: string, title: string) => Promise<void>;

  // E-Commerce & Marketplace Actions
  addToCart: (product: Product, quantity: number, variantId?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyDiscountCode: (code: string) => Promise<boolean>;
  removeDiscountCode: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  removeProduct: (productId: string) => void;
  fetchOrders: (userId: string) => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  setUserSubscriptionTier: (tier: SubscriptionTier) => void;
  setStripeCustomerId: (customerId: string) => void;

  // Marketplace & Inventory Actions
  createMarketplaceListing: (item: ContentItem, price: number, description: string) => void;
  updateMarketplaceListing: (listingId: string, updates: Partial<MarketplaceListing>) => void;
  cancelMarketplaceListing: (listingId: string) => void;
  completeSale: (listingId: string, buyerId: string) => void;
  addToWishlist: (item: Partial<WishlistItem>) => void;
  updateWishlistItem: (itemId: string, updates: Partial<WishlistItem>) => void;
  removeFromWishlist: (itemId: string) => void;
  enableLifecycleTracking: (itemId: string) => void;
  updateLifecycleTracking: (itemId: string, updates: Partial<ProductLifecycleTracking>) => void;
  addMaintenanceRecord: (itemId: string, record: Omit<any, 'id'>) => void;
  addWarranty: (warranty: Warranty) => void;
  updateWarranty: (warrantyId: string, updates: Partial<Warranty>) => void;
  addInsurance: (insurance: Insurance) => void;
  updateInsurance: (insuranceId: string, updates: Partial<Insurance>) => void;
  addAppraisal: (appraisal: Appraisal) => void;
  addFinancingOption: (option: FinancingOption) => void;
  updateInventorySettings: (updates: Partial<InventorySettings>) => void;
  setMarketplaceViewMode: (mode: Partial<MarketplaceViewMode>) => void;
  logInventoryTransaction: (transaction: Omit<InventoryTransaction, 'id' | 'timestamp'>) => void;

  // Trash/Recycle Bin Actions
  moveToTrash: (item: ContentItem, reason?: string) => Promise<void>;
  restoreFromTrash: (trashItemId: string, restorePosition?: { x: number; y: number }) => Promise<void>;
  permanentlyDeleteTrash: (trashItemId: string) => Promise<void>;
  loadTrashBucket: () => Promise<void>;
  getTrashStats: () => Promise<void>;
  clearExpiredTrash: () => Promise<void>;

  // Scene & Presentation Actions
  createPresentation: (title: string, description?: string) => Promise<Presentation>;
  updatePresentation: (presentationId: string, updates: Partial<Presentation>) => Promise<void>;
  deletePresentation: (presentationId: string) => Promise<void>;
  loadPresentation: (presentationId: string) => Promise<void>;
  loadPresentations: () => Promise<void>;
  
  createScene: (presentationId: string, title: string) => Promise<Scene>;
  updateScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  addSceneAnimation: (sceneId: string, animation: Animation) => Promise<void>;
  updateSceneAnimation: (sceneId: string, animationId: string, updates: Partial<Animation>) => Promise<void>;
  
  setCurrentPresentation: (presentationId: string) => void;
  setCurrentScene: (sceneId: string) => void;
  setViewportEditorState: (state: Partial<ViewportEditorState>) => void;
  setIsSceneEditorOpen: (isOpen: boolean) => void;
  setIsPreviewMode: (isPreview: boolean) => void;
  
  startBroadcastSession: (presentationId: string, streamSettings: StreamSettings) => Promise<BroadcastSession>;
  endBroadcastSession: (sessionId: string) => Promise<void>;
  updateBroadcastStats: (sessionId: string, stats: Partial<BroadcastSession>) => void;

  // Profile & Social Actions
  setProfileCanvasId: (id: string | null) => void;
  addSocialPost: (post: ContentItem) => void;
  updateSocialPost: (postId: string, updates: Partial<ContentItem>) => void;
  removeSocialPost: (postId: string) => void;
  addMySharedItem: (item: ContentItem) => void;
  removeMySharedItem: (itemId: string) => void;

  // Advanced Features State
  profileSlugs: ProfileSlug[];
  profileSlugReferences: ProfileSlugReference[];
  folderSlugs: FolderSlug[];
  folderStructure: FolderStructure | null;
  messageGroups: MessageGroup[];
  messageGroupInviteLinks: GroupInviteLink[];
  callSessions: CallSession[];
  callHistory: CallHistory[];
  scheduledMeetings: ScheduledMeeting[];
  meetingRecordings: MeetingRecording[];
  meetingFollowUps: MeetingFollowUp[];
  socialGroups: SocialGroup[];
  socialGroupMembers: SocialGroupMember[];
  socialGroupPosts: SocialGroupPost[];
  joinRequests: JoinRequest[];

  // Advanced Features Actions
  // Profile Slugs
  createProfileSlug: (displayName: string, bio?: string, profileImageUrl?: string) => Promise<ProfileSlug | null>;
  updateProfileSlug: (slugId: string, updates: Partial<ProfileSlug>) => Promise<void>;
  deleteProfileSlug: (slugId: string) => Promise<void>;
  getProfileBySlug: (slug: string) => Promise<ProfileSlug | null>;
  createProfileReference: (targetSlug: string, relationshipType: 'follow' | 'friend' | 'subscriber' | 'collaborator') => Promise<ProfileSlugReference | null>;

  // Folder Slugs
  createFolderSlug: (folderId: string, displayName: string, parentSlug?: string) => Promise<FolderSlug | null>;
  updateFolderSlug: (slugId: string, updates: Partial<FolderSlug>) => Promise<void>;
  deleteFolderSlug: (slugId: string) => Promise<void>;
  getFolderStructure: () => Promise<FolderStructure | null>;

  // Message Groups
  createMessageGroup: (name: string, memberIds: string[], isPrivate?: boolean) => Promise<MessageGroup | null>;
  updateMessageGroup: (groupId: string, updates: Partial<MessageGroup>) => Promise<void>;
  deleteMessageGroup: (groupId: string) => Promise<void>;
  addMessageGroupMember: (groupId: string, userId: string, role?: string) => Promise<void>;
  removeMessageGroupMember: (groupId: string, userId: string) => Promise<void>;
  createMessageGroupInviteLink: (groupId: string, expiresIn?: number, maxUses?: number) => Promise<GroupInviteLink | null>;

  // Calls
  initiateCall: (callType: 'direct' | 'group' | 'conference' | 'webinar', participantIds: string[]) => Promise<CallSession | null>;
  addCallParticipant2: (callId: string, userId: string) => Promise<void>;
  removeCallParticipant: (callId: string, userId: string) => Promise<void>;
  toggleCallAudio: (callId: string, enabled: boolean) => Promise<void>;
  toggleCallVideo: (callId: string, enabled: boolean) => Promise<void>;
  toggleScreenShare: (callId: string, enabled: boolean) => Promise<void>;
  endCallSession: (callId: string) => Promise<void>;
  logCallHistory: (callId: string) => Promise<void>;

  // Meetings
  createScheduledMeeting: (title: string, startTime: string, endTime: string, participantIds: string[], recurrence?: string, agenda?: string) => Promise<ScheduledMeeting | null>;
  updateScheduledMeeting: (meetingId: string, updates: Partial<ScheduledMeeting>) => Promise<void>;
  deleteScheduledMeeting: (meetingId: string) => Promise<void>;
  addMeetingParticipant: (meetingId: string, userId: string, email?: string) => Promise<void>;
  removeMeetingParticipant: (meetingId: string, userId: string) => Promise<void>;
  startMeetingRecording: (meetingId: string) => Promise<MeetingRecording | null>;
  stopMeetingRecording: (recordingId: string) => Promise<void>;
  addMeetingFollowUp: (meetingId: string, action: string, assignedTo: string, dueDate: string) => Promise<void>;

  // Social Groups
  createSocialGroup: (name: string, category: string, isPrivate?: boolean) => Promise<SocialGroup | null>;
  updateSocialGroup: (groupId: string, updates: Partial<SocialGroup>) => Promise<void>;
  deleteSocialGroup: (groupId: string) => Promise<void>;
  inviteToSocialGroup: (groupId: string, userId: string) => Promise<void>;
  postToSocialGroup: (groupId: string, content: string, mediaUrls?: string[]) => Promise<SocialGroupPost | null>;
  requestJoinSocialGroup: (groupId: string) => Promise<JoinRequest | null>;
  approveSocialGroupJoinRequest: (requestId: string) => Promise<void>;
  rejectSocialGroupJoinRequest: (requestId: string) => Promise<void>;
  removeSocialGroupMember: (groupId: string, userId: string) => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Search History
      searchHistory: [],
      addSearchHistory: (query) => set((state) => {
        if (!query.trim()) return {};
        const newItem: SearchHistoryItem = {
          id: `search-${Date.now()}`,
          query: query.trim(),
          createdAt: new Date().toISOString(),
        };
        // Avoid duplicates in a row
        const filtered = state.searchHistory.filter(h => h.query !== newItem.query);
        return { searchHistory: [newItem, ...filtered].slice(0, 50) };
      }),
      clearSearchHistory: () => set({ searchHistory: [] }),
      user: null,
      username: null,
      
      // Multi-Account defaults
      accounts: [],
      currentAccountId: null,
      currentAccount: null,
      corporateAccounts: [],
      corporateMembers: [],
      
      tabs: [],
      tabGroups: [],
      activeTabId: '',
      tabAccessHistory: [],
      newTabBehavior: 'chrome-style',
      startupBehavior: 'last-session',
      isSecondLeftSidebarOpen: true,
      activeSecondaryPanel: 'library',
      isStyleSettingsOpen: false,
      isViewportEditorOpen: false,
      isSpacesPanelOpen: false,
      ecommerceView: 'products',
      isDevicesPanelOpen: false,
      searchPanelState: { isOpen: false, isDraggable: true, x: 50, y: 50, width: 600, height: 500 },
      chatPanels: [],
      itemToShare: null,
      itemToSave: null,
      itemForInfo: null,
      itemForPreview: null,
      itemToMessage: null,
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
      conversations: [
        // AI Asistan ile sohbet
        {
          id: 'conv-ai-assistant',
          userId: 'ai-assistant',
          userName: 'AI Asistan',
          userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai-assistant',
          lastMessage: 'Merhaba! Size nasıl yardımcı olabilirim?',
          lastMessageTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 dakika önce
          unreadCount: 0,
          isOnline: true,
          isTyping: false,
          isPinned: true,
          isMuted: false,
          isArchived: false,
          isGroup: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 hafta önce
          updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        // Kendi notlarınız
        {
          id: 'conv-self-notes',
          userId: 'self',
          userName: 'Kendi Notlarım',
          userAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Ben',
          lastMessage: 'Proje için yapılacaklar listesi',
          lastMessageTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 dakika önce
          unreadCount: 0,
          isOnline: true,
          isTyping: false,
          isPinned: true,
          isMuted: false,
          isArchived: false,
          isGroup: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 1 ay önce
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
      ],
      groups: [],
      messages: {
        'conv-ai-assistant': [
          {
            id: 'msg-ai-1',
            conversationId: 'conv-ai-assistant',
            senderId: 'ai-assistant',
            senderName: 'AI Asistan',
            senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai-assistant',
            type: MessageType.TEXT,
            content: 'Merhaba! Ben CanvasFlow AI asistanınızım. Size nasıl yardımcı olabilirim?',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            isRead: true,
            reactions: [],
          },
          {
            id: 'msg-user-1',
            conversationId: 'conv-ai-assistant',
            senderId: 'current-user',
            senderName: 'Siz',
            type: MessageType.TEXT,
            content: 'Merhaba! Projem için yardım istiyorum.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 60).toISOString(),
            isRead: true,
            reactions: [],
          },
          {
            id: 'msg-ai-2',
            conversationId: 'conv-ai-assistant',
            senderId: 'ai-assistant',
            senderName: 'AI Asistan',
            senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai-assistant',
            type: MessageType.TEXT,
            content: 'Tabii ki! Hangi konuda yardıma ihtiyacınız var? Canvas düzenlemeleri, widget ekleme, AI entegrasyonları veya başka bir konu mu?',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 2).toISOString(),
            isRead: true,
            reactions: [],
          },
          {
            id: 'msg-user-2',
            conversationId: 'conv-ai-assistant',
            senderId: 'current-user',
            senderName: 'Siz',
            type: MessageType.TEXT,
            content: 'Video playerlar ve layout düzenlemeleri hakkında bilgi almak istiyorum.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 5).toISOString(),
            isRead: true,
            reactions: [],
          },
          {
            id: 'msg-ai-3',
            conversationId: 'conv-ai-assistant',
            senderId: 'ai-assistant',
            senderName: 'AI Asistan',
            senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai-assistant',
            type: MessageType.TEXT,
            content: 'Harika! CanvasFlow\'da video playerlar için birkaç seçeneğiniz var:\n\n1. **YouTube Player**: Doğrudan YouTube URL\'lerini ekleyebilirsiniz\n2. **Video Widget**: Kendi video dosyalarınızı yükleyebilirsiniz\n3. **Iframe Player**: Vimeo, Twitch gibi platformları embed edebilirsiniz\n\nLayout düzenlemelerinde ise Grid ve Canvas modları arasında seçim yapabilirsiniz. Hangi modu tercih edersiniz?',
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            isRead: true,
            reactions: [{ emoji: '👍', userId: 'current-user', userName: 'Siz' }],
          },
        ],
        'conv-self-notes': [
          {
            id: 'msg-note-1',
            conversationId: 'conv-self-notes',
            senderId: 'current-user',
            senderName: 'Siz',
            type: MessageType.TEXT,
            content: '📝 Proje için yapılacaklar:\n\n✅ Canvas layout düzeni\n✅ Widget entegrasyonları\n⏳ AI asistan konfigürasyonu\n⏳ Philips Hue entegrasyonu\n📌 E-commerce modülü\n📌 Recording studio özellikleri',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            isRead: true,
            reactions: [],
          },
          {
            id: 'msg-note-2',
            conversationId: 'conv-self-notes',
            senderId: 'current-user',
            senderName: 'Siz',
            type: MessageType.TEXT,
            content: '🎨 Tasarım notları:\n- Ana renk paleti: Mavi-mor gradient\n- Font: Inter (sistem fontu)\n- Animasyonlar: Framer Motion\n- UI Components: Radix UI + Tailwind',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
            isRead: true,
            reactions: [],
          },
          {
            id: 'msg-note-3',
            conversationId: 'conv-self-notes',
            senderId: 'current-user',
            senderName: 'Siz',
            type: MessageType.TEXT,
            content: '💡 Fikirler:\n- Drag & drop ile widget ekleme\n- Klavye kısayolları sistemi\n- Macro pad desteği\n- Multi-tab workspace\n- Real-time collaboration',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
            isRead: true,
            reactions: [{ emoji: '💡', userId: 'current-user', userName: 'Siz' }],
          },
          {
            id: 'msg-note-4',
            conversationId: 'conv-self-notes',
            senderId: 'current-user',
            senderName: 'Siz',
            type: MessageType.TEXT,
            content: '🔧 Teknik detaylar:\n- Next.js 16 + React 19\n- Supabase (PostgreSQL)\n- Zustand state management\n- Genkit AI framework\n- Tailwind CSS 4',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
            isRead: true,
            reactions: [],
          },
          {
            id: 'msg-note-5',
            conversationId: 'conv-self-notes',
            senderId: 'current-user',
            senderName: 'Siz',
            type: MessageType.TEXT,
            content: '📊 Performans hedefleri:\n- First Load: < 2s\n- Time to Interactive: < 3s\n- Lighthouse Score: 90+\n- Bundle size: Optimize edilmiş',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            isRead: true,
            reactions: [],
          },
        ],
      },
      calls: [],
      privateAccounts: {},

      // Hue defaults
      hueBridges: [],
      hueLights: [],
      hueScenes: [],
      hueSyncs: [],
      hueIsLoading: false,

      // YouTube & Google API defaults
      youtubeApiKey: undefined,
      youtubeMetadataEnabled: true,
      youtubeVideos: [],
      youtubeChannels: [],
      youtubePlaylists: [],
      youtubeSearchResults: [],
      setYoutubeVideos: (videos) => set({ youtubeVideos: videos }),
      setYoutubeChannels: (channels) => set({ youtubeChannels: channels }),
      setYoutubePlaylists: (playlists) => set({ youtubePlaylists: playlists }),
      setYoutubeSearchResults: (results) => set({ youtubeSearchResults: results }),
      searchYoutube: async (query, filters) => {
        const { youtubeApiKey } = get();
        if (!youtubeApiKey) return;
        const { searchYouTube } = await import('./youtube-api');
        const results = await searchYouTube(youtubeApiKey, query, filters);
        set({ youtubeSearchResults: results });
      },

      // AI Provider defaults - Dummy setup
      aiProviders: DEFAULT_PROVIDERS.map((p, idx) => ({
        ...p,
        id: `provider-${idx}`,
        apiKey: undefined // API keys will be set by user if needed
      })),

      // --- Split View State ---
      splitView: {
        mode: 'single',
        sections: [
          { id: 'section-0', tabId: '', width: 100, height: 100, x: 0, y: 0 }
        ]
      },
      setSplitView: (state) => set((s) => ({ splitView: { ...s.splitView, ...state } })),
      splitTabs: (mode) => set((s) => {
        const { tabs, activeTabId } = s;
        let sections: SplitTabSection[] = [];
        if (mode === 'split-2') {
          const tabIds = [activeTabId, tabs.find(t => t.id !== activeTabId)?.id || activeTabId];
          sections = [
            { id: 'section-0', tabId: tabIds[0], width: 50, height: 100, x: 0, y: 0 },
            { id: 'section-1', tabId: tabIds[1], width: 50, height: 100, x: 50, y: 0 }
          ];
        } else if (mode === 'split-3') {
          const tabIds = [activeTabId, ...tabs.filter(t => t.id !== activeTabId).slice(0,2).map(t => t.id)];
          sections = [
            { id: 'section-0', tabId: tabIds[0], width: 33.33, height: 100, x: 0, y: 0 },
            { id: 'section-1', tabId: tabIds[1], width: 33.33, height: 100, x: 33.33, y: 0 },
            { id: 'section-2', tabId: tabIds[2], width: 33.34, height: 100, x: 66.66, y: 0 }
          ];
        } else if (mode === 'split-grid') {
          // 2x2 grid for up to 4 tabs
          const tabIds = [activeTabId, ...tabs.filter(t => t.id !== activeTabId).slice(0,3).map(t => t.id)];
          sections = [
            { id: 'section-0', tabId: tabIds[0], width: 50, height: 50, x: 0, y: 0 },
            { id: 'section-1', tabId: tabIds[1], width: 50, height: 50, x: 50, y: 0 },
            { id: 'section-2', tabId: tabIds[2], width: 50, height: 50, x: 0, y: 50 },
            { id: 'section-3', tabId: tabIds[3], width: 50, height: 50, x: 50, y: 50 }
          ];
        } else {
          sections = [{ id: 'section-0', tabId: activeTabId, width: 100, height: 100, x: 0, y: 0 }];
        }
        return { splitView: { mode, sections } };
      }),
      gridifySplitView: () => set((s) => {
        const { splitView } = s;
        // Convert current split sections to grid layout (equal size)
        const n = splitView.sections.length;
        const gridSize = Math.ceil(Math.sqrt(n));
        const sections = splitView.sections.map((sec, i) => {
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          return {
            ...sec,
            width: 100 / gridSize,
            height: 100 / gridSize,
            x: (100 / gridSize) * col,
            y: (100 / gridSize) * row
          };
        });
        return { splitView: { ...splitView, mode: 'split-grid', sections } };
      }),
      resizeSplitSection: (sectionId, newSize) => set((s) => {
        const { splitView } = s;
        const sections = splitView.sections.map(sec =>
          sec.id === sectionId ? { ...sec, ...newSize } : sec
        );
        return { splitView: { ...splitView, sections } };
      }),
      aiAgentConfig: {
        mode: 'manual',
        defaultProvider: 'provider-0',
        fallbackProviders: [],
        autoSelectByCost: false,
        autoSelectBySpeed: false,
        autoSelectByCapability: false
      },

      // Additional API Keys defaults
      apiKeys: {},

      // Keyboard Shortcuts, Macros & Gestures defaults
      keyboardShortcuts: [],
      gestures: [],
      macros: [],
      macroPadLayouts: [],
      playerControlGroups: [],

      // Cloud Sync defaults
      isSyncEnabled: true,
      lastSyncTime: null,

      // E-Commerce & Marketplace defaults
      shoppingCart: {
        id: '',
        userId: '',
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        discountCode: undefined,
        lastModified: new Date().toISOString(),
      },
      products: [
        {
          id: 'prod-1',
          title: 'Premium Video Kursu',
          description: 'Web geliştirme üzerine kapsamlı video eğitim serisi. 50+ saat içerik, proje dosyaları ve sertifika dahil.',
          price: 9900, // $99.00
          currency: 'USD' as const,
          type: 'digital' as const,
          status: 'active' as const,
          sku: 'COURSE-WEB-001',
          quantity: 999,
          unlimited: true,
          image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
          images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'],
          category: 'Eğitim',
          tags: ['video', 'kurs', 'web development', 'dijital'],
          metadata: { duration: '50 hours', level: 'intermediate' },
          sellerId: 'system',
          sellerName: 'CanvasFlow Academy',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-2',
          title: 'Designer Mouse Pad',
          description: 'Profesyonel tasarımcılar için büyük boy mousepad. Anti-slip taban, yıkanabilir yüzey.',
          price: 2999, // $29.99
          currency: 'USD' as const,
          type: 'physical' as const,
          status: 'active' as const,
          sku: 'ACC-MOUSE-001',
          quantity: 45,
          lowStockThreshold: 10,
          unlimited: false,
          image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
          images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'],
          category: 'Aksesuar',
          tags: ['mouse pad', 'gaming', 'design', 'fiziksel'],
          metadata: { dimensions: '90x40cm', material: 'fabric' },
          sellerId: 'system',
          sellerName: 'CanvasFlow Store',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-3',
          title: 'UI/UX Design Template Pack',
          description: 'Figma ve Sketch için 100+ hazır UI komponenti. Dashboard, landing page ve mobil app şablonları.',
          price: 4900, // $49.00
          currency: 'USD' as const,
          type: 'digital' as const,
          status: 'active' as const,
          sku: 'TEMPLATE-UI-001',
          quantity: 999,
          unlimited: true,
          image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
          images: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400'],
          category: 'Tasarım',
          tags: ['figma', 'sketch', 'ui', 'template', 'dijital'],
          metadata: { format: 'figma, sketch', components: 100 },
          sellerId: 'system',
          sellerName: 'CanvasFlow Design',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-4',
          title: 'Premium Mechanical Keyboard',
          description: 'RGB aydınlatmalı, hot-swap mekanik klavye. Cherry MX Blue switch, alüminyum kasa.',
          price: 14900, // $149.00
          currency: 'USD' as const,
          type: 'physical' as const,
          status: 'active' as const,
          sku: 'KB-MECH-001',
          quantity: 12,
          lowStockThreshold: 5,
          unlimited: false,
          image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400',
          images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?w=400'],
          category: 'Elektronik',
          tags: ['keyboard', 'mechanical', 'gaming', 'fiziksel'],
          metadata: { switch: 'Cherry MX Blue', layout: 'TKL' },
          sellerId: 'system',
          sellerName: 'CanvasFlow Store',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-5',
          title: 'AI Chatbot Development Kit',
          description: 'OpenAI GPT-4 entegrasyonu için hazır kod paketi. React, Node.js ve Python örnekleri dahil.',
          price: 7900, // $79.00
          currency: 'USD' as const,
          type: 'digital' as const,
          status: 'active' as const,
          sku: 'CODE-AI-001',
          quantity: 999,
          unlimited: true,
          image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
          images: ['https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400'],
          category: 'Yazılım',
          tags: ['ai', 'chatbot', 'development', 'code', 'dijital'],
          metadata: { includes: 'React, Node.js, Python', api: 'OpenAI GPT-4' },
          sellerId: 'system',
          sellerName: 'CanvasFlow Dev Tools',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-6',
          title: 'Wireless Webcam 4K',
          description: 'Profesyonel streaming için 4K webcam. Auto-focus, geniş açı lens, dahili mikrofon.',
          price: 8900, // $89.00
          currency: 'USD' as const,
          type: 'physical' as const,
          status: 'active' as const,
          sku: 'CAM-4K-001',
          quantity: 28,
          lowStockThreshold: 10,
          unlimited: false,
          image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400',
          images: ['https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400'],
          category: 'Elektronik',
          tags: ['webcam', '4k', 'streaming', 'fiziksel'],
          metadata: { resolution: '4K 30fps', connection: 'USB-C' },
          sellerId: 'system',
          sellerName: 'CanvasFlow Store',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      orders: [],
      userSubscriptionTier: 'guest',
      stripeCustomerId: undefined,

      // Marketplace & Inventory defaults
      marketplaceListings: [],
      myInventoryItems: [],
      lifecycleTrackings: {},
      warranties: [],
      insurances: [],
      appraisals: [],
      financingOptions: [],
      inventoryTransactions: [],
      wishlistItems: [],
      marketplaceViewMode: {
        mode: 'grid',
        showImages: true,
        showPrices: true,
        showCondition: true,
        showLifecycle: false,
        columns: 3,
      },
      inventorySettings: {
        enableLifecycleTracking: true,
        autoDepreciation: true,
        depreciationMethod: 'linear',
        enableInsuranceTracking: true,
        enableWarrantyTracking: true,
        enableAppraisals: true,
        reminderDays: 30,
        defaultCurrency: 'USD',
      },

      // Trash/Recycle Bin defaults
      trashItems: [],
      trashBucket: null,
      trashStats: null,
      isTrashLoading: false,

      // Scenes & Presentations defaults
      scenes: [],
      presentations: [],
      currentPresentationId: null,
      currentSceneId: '',
      viewportEditorState: {
          showAnimations: true,
          showTransitions: true,
          showGuides: true,
        currentSceneId: '',
        zoom: 1,
        panX: 0,
        panY: 0,
        selectedItemIds: [],
        currentTool: 'select',
        showRulers: true,
        snapToGrid: true,
        gridSize: 10,
        showLayers: true,
        showProperties: true,
        showTimeline: true,
        isFullscreen: false,
        isPreviewMode: false,
        remoteControls: [],
        codeSnapshots: [],
      },
      broadcastSessions: [],
      isSceneEditorOpen: false,
      isPreviewMode: false,

      // Profile & Social defaults
      profileCanvasId: null,
      socialPosts: [],
      mySharedItems: [],

      // Advanced Features defaults
      profileSlugs: [],
      profileSlugReferences: [],
      folderSlugs: [],
      folderStructure: null,
      messageGroups: [],
      messageGroupInviteLinks: [],
      callSessions: [],
      callHistory: [],
      scheduledMeetings: [],
      meetingRecordings: [],
      meetingFollowUps: [],
      socialGroups: [],
      socialGroupMembers: [],
      socialGroupPosts: [],
      joinRequests: [],

      setUser: (user) => {
        set({ user });
        if (user) {
          // Initialize cloud sync when user logs in (fire and forget with error handling)
          get().initializeCloudSync().catch(err => {
            console.error('Cloud sync initialization failed:', err);
          });
        } else {
          // Cleanup when user logs out
          unsubscribeFromCanvasChanges();
          set({ isSyncEnabled: false });
        }
      },
      setUsername: (username) => set({ username }),
      
      // Multi-Account Actions
      switchAccount: async (accountId) => {
        const account = get().accounts.find(a => a.id === accountId);
        if (!account) throw new Error(`Account ${accountId} not found`);
        set({ currentAccountId: accountId, currentAccount: account });
      },
      switchToCorporateAccount: async (corporateId) => {
        const account = get().corporateAccounts.find(a => a.id === corporateId);
        if (!account) throw new Error(`Corporate account ${corporateId} not found`);
        set({ currentAccountId: corporateId, currentAccount: account });
      },
      addAccount: (account) => set((state) => ({
        accounts: [...state.accounts, account]
      })),
      removeAccount: (accountId) => set((state) => ({
        accounts: state.accounts.filter(a => a.id !== accountId),
        currentAccountId: state.currentAccountId === accountId ? null : state.currentAccountId,
        currentAccount: state.currentAccount?.id === accountId ? null : state.currentAccount
      })),
      updateAccount: (accountId, updates) => set((state) => ({
        accounts: state.accounts.map(a => a.id === accountId ? { ...a, ...updates } : a),
        currentAccount: state.currentAccount?.id === accountId ? { ...state.currentAccount, ...updates } : state.currentAccount
      })),
      createCorporateAccount: (account) => set((state) => {
        const now = new Date().toISOString();
        const newAccount: CorporateAccount = {
          ...account,
          id: `corp-${Date.now()}`,
          createdAt: now,
          updatedAt: now
        };
        return { corporateAccounts: [...state.corporateAccounts, newAccount] };
      }),
      addCorporateMember: (member) => set((state) => {
        const newMember: CorporateMember = {
          ...member,
          id: `member-${Date.now()}`,
          joinedAt: new Date().toISOString()
        };
        return { corporateMembers: [...state.corporateMembers, newMember] };
      }),
      removeCorporateMember: (memberId) => set((state) => ({
        corporateMembers: state.corporateMembers.filter(m => m.id !== memberId)
      })),
      updateCorporateMember: (memberId, updates) => set((state) => ({
        corporateMembers: state.corporateMembers.map(m => m.id === memberId ? { ...m, ...updates } : m)
      })),
      setCurrentAccount: (account) => set({ currentAccount: account, currentAccountId: account?.id || null }),
      
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

      setTabGroups: (tabGroups: TabGroup[]): void => {
        set({ tabGroups });
        // get().syncToCloud('tabGroups', tabGroups); // 'tabGroups' is not a valid SyncDataType, so skip sync or use a valid type if needed
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
      setEcommerceView: (view) => set({ ecommerceView: view }),
      setActiveSecondaryPanel: (panel) => set({ activeSecondaryPanel: panel, isSecondLeftSidebarOpen: !!panel }),
      updateSearchPanel: (update) => set((state) => ({ searchPanelState: { ...state.searchPanelState, ...update } })),
      setItemToShare: (item) => set({ itemToShare: item }),
      setItemToSave: (item) => set({ itemToSave: item }),
      setItemForInfo: (item) => set({ itemForInfo: item }),
      setItemForPreview: (item) => set({ itemForPreview: item }),
      setItemToMessage: (item) => set({ itemToMessage: item }),
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
              ? { ...g, tabIds: Array.from(new Set([...g.tabIds, tabId])) }
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
      endCall: (callId) => set((state) => {
        const calls = state.calls.map(c => 
          c.id === callId 
            ? { ...c, status: CallStatus.ENDED, endedAt: new Date().toISOString() }
            : c
        );
        return {
          calls,
          activeCall: state.activeCall?.id === callId ? undefined : state.activeCall
        };
      }),
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
              blockedUsers: Array.from(new Set([...account.blockedUsers, userId]))
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
      addHueBridge: (bridge: HueBridge) => set((state) => ({
        hueBridges: [...state.hueBridges, bridge]
      })),
      updateHueBridge: (bridgeId: string, updates: Partial<HueBridge>) => set((state) => ({
        hueBridges: state.hueBridges.map(b => 
          b.id === bridgeId ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
        )
      })),
      removeHueBridge: (bridgeId: string) => set((state) => ({
        hueBridges: state.hueBridges.filter(b => b.id !== bridgeId),
        hueLights: state.hueLights.filter(l => l.bridgeId !== bridgeId),
        hueScenes: state.hueScenes.filter(s => s.bridgeId !== bridgeId),
        hueSyncs: state.hueSyncs.filter(sy => sy.bridgeId !== bridgeId)
      })),
      setSelectedBridgeId: (bridgeId: string) => set({ selectedBridgeId: bridgeId }),
      addHueLight: (light: HueLight) => set((state) => ({
        hueLights: [...state.hueLights, light]
      })),
      updateHueLight: (lightId: string, updates: Partial<HueLight>) => set((state) => ({
        hueLights: state.hueLights.map(l => 
          l.id === lightId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
        )
      })),
      removeHueLight: (lightId: string) => set((state) => ({
        hueLights: state.hueLights.filter(l => l.id !== lightId)
      })),
      addHueScene: (scene: HueScene) => set((state) => ({
        hueScenes: [...state.hueScenes, scene]
      })),
      updateHueScene: (sceneId: string, updates: Partial<HueScene>) => set((state) => ({
        hueScenes: state.hueScenes.map(s => 
          s.id === sceneId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        )
      })),
      removeHueScene: (sceneId: string) => set((state) => ({
        hueScenes: state.hueScenes.filter(s => s.id !== sceneId)
      })),
      addHueSync: (sync: HueSync) => set((state) => ({
        hueSyncs: [...state.hueSyncs, sync]
      })),
      updateHueSync: (syncId: string, updates: Partial<HueSync>) => set((state) => ({
        hueSyncs: state.hueSyncs.map(sy => 
          sy.id === syncId ? { ...sy, ...updates, updatedAt: new Date().toISOString() } : sy
        )
      })),
      removeHueSync: (syncId: string) => set((state) => ({
        hueSyncs: state.hueSyncs.filter(sy => sy.id !== syncId)
      })),
      setHueLoading: (loading: boolean) => set({ hueIsLoading: loading }),
      setHueError: (error: string | undefined) => set({ hueError: error }),

      // YouTube & Google API Actions
      setYoutubeApiKey: (key) => set({ youtubeApiKey: key }),
      setGoogleApiKey: (key) => set({ googleApiKey: key }),
      setYoutubeMetadataEnabled: (enabled) => set({ youtubeMetadataEnabled: enabled }),

      // AI Provider Actions
      addAIProvider: (provider) => set((state) => ({
        aiProviders: [...state.aiProviders, provider]
      })),
      updateAIProvider: (providerId, updates) => set((state) => ({
        aiProviders: state.aiProviders.map(p =>
          p.id === providerId ? { ...p, ...updates } : p
        )
      })),
      removeAIProvider: (providerId) => set((state) => ({
        aiProviders: state.aiProviders.filter(p => p.id !== providerId)
      })),
      setDefaultAIProvider: (providerId) => set((state) => ({
        aiProviders: state.aiProviders.map(p => ({
          ...p,
          isDefault: p.id === providerId
        })),
        aiAgentConfig: {
          ...state.aiAgentConfig,
          defaultProvider: providerId
        }
      })),
      updateAIAgentConfig: (updates) => set((state) => ({
        aiAgentConfig: { ...state.aiAgentConfig, ...updates }
      })),

      // API Keys Actions
      setApiKey: (category, key, value) => set((state) => ({
        apiKeys: {
          ...state.apiKeys,
          [key]: value
        }
      })),
      clearApiKey: (key) => set((state) => {
        const newApiKeys = { ...state.apiKeys };
        delete newApiKeys[key as keyof typeof newApiKeys];
        return { apiKeys: newApiKeys };
      }),

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

          // Load preferences - now automatically creates defaults if not exists
          const prefs = await loadUserPreferences(user.id);
          if (prefs) {
            set({
              layoutMode: prefs.layout_mode || 'grid',
              newTabBehavior: prefs.new_tab_behavior || 'chrome-style',
              startupBehavior: prefs.startup_behavior || 'last-session',
              gridModeState: prefs.grid_mode_state || get().gridModeState,
            });

            if (prefs.ui_settings) {
              const ui = prefs.ui_settings;
              set({
                isSecondLeftSidebarOpen: ui.isSecondLeftSidebarOpen !== false, // default true
                activeSecondaryPanel: (ui.activeSecondaryPanel as AppStore['activeSecondaryPanel']) || 'library',
                pointerFrameEnabled: ui.pointerFrameEnabled === true,
                audioTrackerEnabled: ui.audioTrackerEnabled === true,
                mouseTrackerEnabled: ui.mouseTrackerEnabled === true,
                virtualizerMode: ui.virtualizerMode === true,
                visualizerMode: (ui.visualizerMode as any) || 'off',
              });
            }
          }

          set({ lastSyncTime: Date.now() });
          console.log('User preferences loaded from cloud');
        } catch (error) {
          console.error('Failed to load from cloud:', error);
        }
      },

      // Toolkit Cloud Sync Actions
      syncToolkitKeyboardShortcuts: async () => {
        const { user, keyboardShortcuts } = get();
        if (!user || !keyboardShortcuts.length) return;
        
        try {
          await syncKeyboardShortcuts(user.id, keyboardShortcuts);
          set({ lastSyncTime: Date.now() });
        } catch (error) {
          console.error('Failed to sync keyboard shortcuts:', error);
        }
      },

      syncToolkitGestures: async () => {
        const { user, gestures } = get();
        if (!user || !gestures.length) return;
        
        try {
          await syncGestures(user.id, gestures);
          set({ lastSyncTime: Date.now() });
        } catch (error) {
          console.error('Failed to sync gestures:', error);
        }
      },

      syncToolkitMacros: async () => {
        const { user, macros } = get();
        if (!user || !macros.length) return;
        
        try {
          await syncMacros(user.id, macros);
          set({ lastSyncTime: Date.now() });
        } catch (error) {
          console.error('Failed to sync macros:', error);
        }
      },

      syncToolkitMacroPads: async () => {
        const { user, macroPadLayouts } = get();
        if (!user || !macroPadLayouts.length) return;
        
        try {
          await syncMacroPads(user.id, macroPadLayouts);
          set({ lastSyncTime: Date.now() });
        } catch (error) {
          console.error('Failed to sync macro pads:', error);
        }
      },

      syncToolkitPlayerControls: async () => {
        const { user, playerControlGroups } = get();
        if (!user || !playerControlGroups.length) return;
        
        try {
          await syncPlayerControls(user.id, playerControlGroups);
          set({ lastSyncTime: Date.now() });
        } catch (error) {
          console.error('Failed to sync player controls:', error);
        }
      },

      loadToolkitFromCloud: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const [shortcuts, gestures, macros, pads, controls] = await Promise.all([
            loadKeyboardShortcuts(user.id),
            loadGestures(user.id),
            loadMacros(user.id),
            loadMacroPads(user.id),
            loadPlayerControls(user.id),
          ]);

          set({
            keyboardShortcuts: shortcuts,
            gestures,
            macros,
            macroPadLayouts: pads,
            playerControlGroups: controls,
            lastSyncTime: Date.now(),
          });

          console.log('Toolkit data loaded from cloud');
        } catch (error) {
          console.error('Failed to load toolkit from cloud:', error);
        }
      },

      initializeToolkitCloudSync: async () => {
        const { user } = get();
        if (!user) return;

        try {
          // Load toolkit data from cloud
          await get().loadToolkitFromCloud();

          // Subscribe to toolkit changes
          subscribeToToolkitChanges(user.id, (payload) => {
            const state = get();
            
            switch (payload.entityType) {
              case 'keyboard':
                // Reload keyboard shortcuts
                loadKeyboardShortcuts(user.id).then(data => {
                  set({ keyboardShortcuts: data });
                });
                break;
              case 'gesture':
                // Reload gestures
                loadGestures(user.id).then(data => {
                  set({ gestures: data });
                });
                break;
              case 'macro':
                // Reload macros
                loadMacros(user.id).then(data => {
                  set({ macros: data });
                });
                break;
              case 'macro_pad':
                // Reload macro pads
                loadMacroPads(user.id).then(data => {
                  set({ macroPadLayouts: data });
                });
                break;
              case 'player_control':
                // Reload player controls
                loadPlayerControls(user.id).then(data => {
                  set({ playerControlGroups: data });
                });
                break;
            }
          });

          console.log('Toolkit cloud sync initialized');
        } catch (error) {
          console.error('Failed to initialize toolkit cloud sync:', error);
        }
      },

      // E-Commerce & Marketplace Actions
      addToCart: (product, quantity, variantId) => set((state) => {
        const now = new Date().toISOString();
        const cart = state.shoppingCart;
        
        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
          item => item.productId === product.id
        );

        let newItems: CartItem[];
        if (existingItemIndex >= 0) {
          // Update quantity
          newItems = cart.items.map((item, idx) => 
            idx === existingItemIndex 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `cart-item-${Date.now()}`,
            productId: product.id,
            quantity,
            price: product.price,
            selectedVariant: variantId ? { color: variantId } : undefined,
            addedAt: now,
          };
          
          newItems = [...cart.items, newItem];
        }

        // Recalculate totals - simple calculation
        const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = Math.round(subtotal * 0.10); // 10% tax
        const shipping = 1000; // $10 flat rate in cents
        const discountAmount = cart.discount || 0;
        const total = subtotal + tax + shipping - discountAmount;

        return {
          shoppingCart: {
            ...cart,
            items: newItems,
            subtotal,
            tax,
            shipping,
            total,
            lastModified: now,
          }
        };
      }),

      removeFromCart: (itemId) => set((state) => {
        const now = new Date().toISOString();
        const cart = state.shoppingCart;
        const newItems = cart.items.filter(item => item.id !== itemId);

        // Recalculate totals
        const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = Math.round(subtotal * 0.10);
        const shipping = 1000;
        const discountAmount = cart.discount || 0;
        const total = subtotal + tax + shipping - discountAmount;

        return {
          shoppingCart: {
            ...cart,
            items: newItems,
            subtotal,
            tax,
            shipping,
            total,
            lastModified: now,
          }
        };
      }),

      updateCartItemQuantity: (itemId, quantity) => set((state) => {
        const now = new Date().toISOString();
        const cart = state.shoppingCart;
        
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          const newItems = cart.items.filter(item => item.id !== itemId);
          const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const tax = Math.round(subtotal * 0.10);
          const shipping = 1000;
          const discountAmount = cart.discount || 0;
          const total = subtotal + tax + shipping - discountAmount;
          
          return {
            shoppingCart: {
              ...cart,
              items: newItems,
              subtotal,
              tax,
              shipping,
              total,
              lastModified: now,
            }
          };
        }

        const newItems = cart.items.map(item => 
          item.id === itemId 
            ? { ...item, quantity }
            : item
        );

        // Recalculate totals
        const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = Math.round(subtotal * 0.10);
        const shipping = 1000;
        const discountAmount = cart.discount || 0;
        const total = subtotal + tax + shipping - discountAmount;

        return {
          shoppingCart: {
            ...cart,
            items: newItems,
            subtotal,
            tax,
            shipping,
            total,
            lastModified: now,
          }
        };
      }),

      clearCart: () => set((state) => ({
        shoppingCart: {
          id: state.shoppingCart.id,
          userId: state.shoppingCart.userId,
          items: [],
          subtotal: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0,
          discountCode: undefined,
          lastModified: new Date().toISOString(),
        }
      })),

      applyDiscountCode: async (code) => {
        // DUMMY: Mock discount codes for testing
        const validCodes: Record<string, number> = {
          'DEMO10': 0.10,
          'TEST20': 0.20,
          'MOCK30': 0.30,
        };

        const discountPercent = validCodes[code.toUpperCase()];
        if (!discountPercent) {
          console.log('✓ [MOCK] Discount code not found:', code);
          return false;
        }

        set((state) => {
          const now = new Date().toISOString();
          const cart = state.shoppingCart;
          const discountAmount = Math.round(cart.subtotal * discountPercent);
          const total = cart.subtotal + cart.tax + cart.shipping - discountAmount;

          console.log('✓ [MOCK] Discount applied:', code, `${(discountPercent * 100).toFixed(0)}% off`);
          return {
            shoppingCart: {
              ...cart,
              discountCode: code.toUpperCase(),
              discount: discountAmount,
              total,
              lastModified: now,
            }
          };
        });

        return true;
      },

      removeDiscountCode: () => set((state) => {
        const now = new Date().toISOString();
        const cart = state.shoppingCart;
        const total = cart.subtotal + cart.tax + cart.shipping;

        return {
          shoppingCart: {
            ...cart,
            discountCode: undefined,
            discount: 0,
            total,
            lastModified: now,
          }
        };
      }),

      addProduct: (product) => set((state) => ({
        products: [...state.products, product]
      })),

      updateProduct: (productId, updates) => set((state) => ({
        products: state.products.map(p => 
          p.id === productId ? { ...p, ...updates } : p
        )
      })),

      removeProduct: (productId) => set((state) => ({
        products: state.products.filter(p => p.id !== productId)
      })),

      fetchOrders: async (userId) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          // Transform Supabase data to match store Order type
          const orders = data.map(order => ({
            id: order.id,
            userId: order.user_id,
            items: Array.isArray(order.items) ? order.items : [],
            subtotal: order.subtotal || 0,
            tax: order.tax || 0,
            shipping: order.shipping || 0,
            discount: order.discount || 0,
            total: order.total || 0,
            shippingAddress: order.shipping_address,
            paymentStatus: order.payment_status || 'pending',
            paymentMethod: order.payment_method || '',
            transactionId: order.payment_id,
            status: order.status || 'pending',
            trackingNumber: order.tracking_number,
            estimatedDelivery: order.estimated_delivery,
            notes: order.notes,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            completedAt: order.completed_at,
          }));
          set({ orders });
        }
      },

      createOrder: async (orderData) => {
        // DUMMY: Mock order creation
        const user = get().user;
        if (!user) throw new Error('User not authenticated');
        
        const now = new Date().toISOString();
        const orderId = `order-${Date.now()}`;
        
        // Create mock order in local state
        const newOrder: Order = {
          id: orderId,
          userId: user.id,
          items: orderData.items || [],
          subtotal: orderData.subtotal || 0,
          tax: orderData.tax || 0,
          shipping: orderData.shipping || 0,
          discount: orderData.discount || 0,
          total: orderData.total || 0,
          shippingAddress: orderData.shippingAddress,
          paymentStatus: 'pending',
          paymentMethod: 'mock',
          transactionId: `mock-${Date.now()}`,
          status: 'pending',
          trackingNumber: `MOCK-${Math.random().toString(36).substring(7).toUpperCase()}`,
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: '[MOCK] Demo order',
          createdAt: now,
          updatedAt: now,
        };
        
        console.log('✓ [MOCK] Order created:', orderId, `Total: $${(newOrder.total / 100).toFixed(2)}`);
        
        set((state) => ({
          orders: [...state.orders, newOrder]
        }));
        
        return newOrder;
      },

      updateOrderStatus: (orderId, status) => set((state) => {
        const now = new Date().toISOString();
        return {
          orders: state.orders.map(o => 
            o.id === orderId 
              ? { ...o, status, updatedAt: now }
              : o
          )
        };
      }),

      setUserSubscriptionTier: (tier) => {
        console.log('✓ [MOCK] Subscription tier set:', tier);
        set({ userSubscriptionTier: tier });
      },

      setStripeCustomerId: (customerId) => {
        console.log('✓ [MOCK] Stripe customer ID set (dummy):', customerId);
        // Dummy implementation - no actual Stripe integration
        set({ stripeCustomerId: `mock-${Date.now()}` });
      },

      // Comprehensive Live Data Sync Actions
      syncCanvasItem: async (item) => {
        const { user } = get();
        if (!user) return;
        
        await (await import('./supabase-sync')).syncCanvasItem(user.id, item);
      },

      syncAllCanvasItems: async (items) => {
        const { user } = get();
        if (!user) return;
        
        await (await import('./supabase-sync')).syncCanvasItems(user.id, items);
      },

      loadCanvasItemsFromCloud: async () => {
        const { user } = get();
        if (!user) return [];
        
        return await (await import('./supabase-sync')).loadCanvasItems(user.id);
      },

      saveSearchQuery: async (query, type, resultsCount, metadata) => {
        const { user } = get();
        if (!user) return;
        
        await (await import('./supabase-sync')).saveSearchQuery(
          user.id,
          query,
          type as any,
          resultsCount,
          metadata
        );
      },

      loadSearchHistory: async (limit) => {
        const { user } = get();
        if (!user) return [];
        
        return await (await import('./supabase-sync')).loadSearchHistory(user.id, limit);
      },

      saveAIConversation: async (conversationId, title, contextItems, metadata) => {
        const { user } = get();
        if (!user) return;
        
        await (await import('./supabase-sync')).saveAIConversation(
          user.id,
          conversationId,
          title,
          contextItems,
          metadata
        );
      },

      saveAIMessage: async (conversationId, role, content, sequenceNumber, toolCalls, toolResults, metadata) => {
        const { user } = get();
        if (!user) return;
        
        await (await import('./supabase-sync')).saveAIMessage(
          user.id,
          conversationId,
          role,
          content,
          sequenceNumber,
          toolCalls,
          toolResults,
          metadata
        );
      },

      loadAIConversations: async () => {
        const { user } = get();
        if (!user) return [];
        
        return await (await import('./supabase-sync')).loadAIConversations(user.id);
      },

      loadAIMessages: async (conversationId) => {
        return await (await import('./supabase-sync')).loadAIMessages(conversationId);
      },

      saveFrameStyleUpdate: async (itemId, styleType, previousValue, newValue, appliedBy, metadata) => {
        const { user } = get();
        if (!user) return;
        
        await (await import('./supabase-sync')).saveFrameStyleUpdate(
          user.id,
          itemId,
          styleType as any,
          previousValue,
          newValue,
          appliedBy as any,
          metadata
        );
      },

      loadFrameStyleHistory: async (itemId, limit) => {
        const { user } = get();
        if (!user) return [];
        
        return await (await import('./supabase-sync')).loadFrameStyleHistory(user.id, itemId, limit);
      },

      saveLayoutState: async (viewId, layoutMode, viewportSettings, zoomLevel, scrollPosition, visibleItems) => {
        const { user } = get();
        if (!user) return;
        
        await (await import('./supabase-sync')).saveLayoutState(
          user.id,
          viewId,
          layoutMode as any,
          undefined, // gridColumns
          undefined, // gridRows
          viewportSettings,
          zoomLevel,
          scrollPosition,
          visibleItems
        );
      },

      loadLayoutState: async (viewId) => {
        const { user } = get();
        if (!user) return null;
        
        return await (await import('./supabase-sync')).loadLayoutState(user.id, viewId);
      },

      trackInteraction: async (itemId, interactionType, durationMs, metadata) => {
        const { user } = get();
        if (!user) return;
        
        await (await import('./supabase-sync')).trackInteraction(
          user.id,
          itemId,
          interactionType as any,
          durationMs,
          metadata
        );
      },

      subscribeToCanvasItemsChanges: () => {
        const { user } = get();
        if (!user) return () => {};
        
        (async () => {
          const { subscribeToCanvasItems } = await import('./supabase-sync');
          subscribeToCanvasItems(user.id, (payload) => {
            console.log('Canvas items changed:', payload);
            get().loadCanvasItemsFromCloud();
          });
        })();
        
        return () => {};
      },

      subscribeToSearchHistoryChanges: () => {
        const { user } = get();
        if (!user) return () => {};
        
        (async () => {
          const { subscribeToSearchHistory } = await import('./supabase-sync');
          subscribeToSearchHistory(user.id, (payload) => {
            console.log('Search history changed:', payload);
          });
        })();
        
        return () => {};
      },

      subscribeToAIChatChanges: () => {
        const { user } = get();
        if (!user) return () => {};
        
        (async () => {
          const { subscribeToAIChat } = await import('./supabase-sync');
          subscribeToAIChat(user.id, (payload) => {
            console.log('AI chat changed:', payload);
          });
        })();
        
        return () => {};
      },

      // Multi-Tab Sync Actions (Tüm Sekmeler Arası Senkronizasyon)
      trackMultiTabSync: async (deviceId, tabId, entityType, entityId, action, changeData) => {
        const { user } = get();
        if (!user) return;
        
        const { trackMultiTabSync } = await import('./supabase-sync');
        await trackMultiTabSync(
          user.id,
          deviceId,
          tabId,
          entityType,
          entityId,
          action,
          changeData
        );
      },

      subscribeToMultiTabSync: () => {
        const { user } = get();
        if (!user) return () => {};
        
        const { subscribeToMultiTabSync } = require('./supabase-sync');
        const unsubscribe = subscribeToMultiTabSync(user.id, (payload: any) => {
          console.log('Multi-tab sync event:', payload);
          // Tüm sekmelerde otomatik güncelle
          if (payload.new) {
            const { entity_type, action, new_state } = payload.new;
            // UI'ı güncelle
            console.log(`Updated ${entity_type} (${action}):`, new_state);
          }
        });
        
        return unsubscribe;
      },

      // Sharing System Actions (Paylaşım Sistemi)
      createSharedItem: async (itemId, itemType) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        const { createSharedItem } = await import('./supabase-sync');
        return await createSharedItem(user.id, itemId, itemType);
      },

      grantSharingPermission: async (sharedItemId, granteeUserId, granteeEmail, role, permissions, expiresAt) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        const { grantSharingPermission } = await import('./supabase-sync');
        return await grantSharingPermission(
          sharedItemId,
          granteeUserId,
          granteeEmail,
          role as 'owner' | 'viewer' | 'commenter' | 'editor',
          permissions,
          user.id,
          expiresAt
        );
      },

      createSharingLink: async (sharedItemId, settings) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        const { createSharingLink } = await import('./supabase-sync');
        return await createSharingLink(sharedItemId, user.id, settings);
      },

      logSharingAccess: async (sharingLinkId, userId, ipAddress, userAgent, action) => {
        const { logSharingAccess } = await import('./supabase-sync');
        await logSharingAccess(sharingLinkId, userId, ipAddress, userAgent, action as 'view' | 'comment' | 'download' | 'share');
      },

      getSharedItems: async () => {
        const { user } = get();
        if (!user) return [];
        
        const { getSharedItems } = await import('./supabase-sync');
        return await getSharedItems(user.id);
      },

      // Social Realtime Actions (Sosyal Canlı Güncellemeler)
      logSocialEvent: async (eventType, targetEntityType, targetEntityId, actorId, eventData) => {
        const { user } = get();
        if (!user) return;
        
        const { logSocialEvent } = await import('./supabase-sync');
        await logSocialEvent(
          user.id,
          eventType,
          targetEntityType,
          targetEntityId,
          actorId,
          eventData
        );
      },

      subscribeSocialEvents: () => {
        const { user } = get();
        if (!user) return () => {};
        
        const { subscribeToSocialEvents } = require('./supabase-sync');
        const unsubscribe = subscribeToSocialEvents(user.id, (payload: any) => {
          console.log('Social event:', payload);
          // Post, comment, like vb. güncellemeler burada işlenir
          if (payload.new) {
            const { event_type, target_entity_type } = payload.new;
            console.log(`Social event: ${event_type} on ${target_entity_type}`);
          }
        });
        
        return unsubscribe;
      },

      // Message Delivery Actions (Mesaj Gönderimi)
      updateMessageDelivery: async (messageId, status, deviceId, tabIds) => {
        const { user } = get();
        if (!user) return;
        
        const { updateMessageDelivery } = await import('./supabase-sync');
        await updateMessageDelivery(messageId, user.id, status, deviceId, tabIds);
      },

      subscribeMessageDelivery: () => {
        const { user } = get();
        if (!user) return () => {};
        
        const { subscribeToMessageDelivery } = require('./supabase-sync');
        const unsubscribe = subscribeToMessageDelivery(user.id, (payload: any) => {
          console.log('Message delivery status:', payload);
          // Mesaj durumu güncellemelerini işle
          if (payload.new) {
            const { status, delivered_at, read_at } = payload.new;
            console.log(`Message status: ${status}`);
          }
        });
        
        return unsubscribe;
      },

      // AI Conversation Management Actions (Genkit AI + Supabase)
      sendAIMessage: async (message, options) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        // Import conversation service and assistant flow
        const { aiConversationService } = await import('./ai-conversation-service');
        const { askAi } = await import('@/ai/flows/assistant-flow');
        
        // Generate or use existing conversation ID
        const conversationId = options?.conversationId || `conv-${Date.now()}-${user.id.slice(0, 8)}`;
        
        // Create conversation if new
        if (!options?.conversationId) {
          await aiConversationService.createConversation(
            user.id,
            conversationId,
            message.slice(0, 50) + (message.length > 50 ? '...' : '')
          );
        }
        
        // Load history for context
        // Convert history to correct type for askAi
        const rawHistory = await aiConversationService.loadConversationHistory(conversationId);
        const messageCount = rawHistory.length;
        // Map to expected format if needed
        const history = rawHistory.map((msg: any) => ({
          role: (['user', 'model', 'tool'].includes(msg.role) ? msg.role : 'user') as 'user' | 'model' | 'tool',
          content: [{ text: msg.content }],
        }));
        
        // Save user message
        await aiConversationService.saveMessage(
          user.id,
          conversationId,
          'user',
          message,
          messageCount
        );
        
        // Call Genkit AI assistant
        // askAi expects history in a specific format, so adapt if needed
        const result = await askAi({ history });
        // If result is a string, treat as response; if object, destructure
        let response = '', toolCalls = undefined, toolResults = undefined;
        if (typeof result === 'string') {
          response = result;
        } else if ('response' in result) {
          response = String(result.response);
          toolCalls = (result as any).toolCalls;
          toolResults = (result as any).toolResults;
        }
        await aiConversationService.saveMessage(
          user.id,
          conversationId,
          'assistant',
          response || '',
          messageCount + 1,
          toolCalls,
          toolResults
        );
        return {
          conversationId,
          response,
          toolCalls,
          toolResults,
        };
      },

      sendVisionMessage: async (message, imageUrl, options) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        // Vision messages use same flow as regular messages
        // but with image URL in the message
        return await get().sendAIMessage(
          `${message}\n\nImage: ${imageUrl}`,
          options
        );
      },

      getAIConversations: async (options) => {
        const { user } = get();
        if (!user) return [];
        
        const { aiConversationService } = await import('./ai-conversation-service');
        return await aiConversationService.getConversations(user.id, options);
      },

      deleteAIConversation: async (conversationId) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        const { aiConversationService } = await import('./ai-conversation-service');
        await aiConversationService.deleteConversation(user.id, conversationId);
      },

      archiveAIConversation: async (conversationId, archived) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        const { aiConversationService } = await import('./ai-conversation-service');
        await aiConversationService.archiveConversation(user.id, conversationId, archived);
      },

      pinAIConversation: async (conversationId, pinned) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        const { aiConversationService } = await import('./ai-conversation-service');
        await aiConversationService.pinConversation(user.id, conversationId, pinned);
      },

      getAIConversationWithMessages: async (conversationId) => {
        const { user } = get();
        if (!user) throw new Error('Conversation not found');
        
        const { aiConversationService } = await import('./ai-conversation-service');
        return await aiConversationService.getConversationWithMessages(user.id, conversationId);
      },

      updateAIConversationTitle: async (conversationId, title) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        const { aiConversationService } = await import('./ai-conversation-service');
        await aiConversationService.updateConversationTitle(user.id, conversationId, title);
      },

      // Marketplace & Inventory Actions
      createMarketplaceListing: (item, price, description) => set((state) => {
        const now = new Date().toISOString();
        const listing: MarketplaceListing = {
          id: `listing-${Date.now()}`,
          itemId: item.id,
          sellerId: state.user?.id || 'unknown',
          sellerName: state.username || 'Unknown User',
          status: 'active',
          title: item.title || 'Untitled Item',
          description,
          price: price * 100, // Convert to cents
          images: (item as any).images || [],
          category: (item as any).category || 'Other',
          condition: 'good',
          shippingOptions: [{
            id: 'standard',
            method: 'standard',
            price: 1000, // $10
            estimatedDays: 5,
          }],
          views: 0,
          favorites: 0,
          questions: [],
          offers: [],
          createdAt: now,
          updatedAt: now,
          listedAt: now,
        };

        // Log transaction
        const transaction: InventoryTransaction = {
          id: `trans-${Date.now()}`,
          itemId: item.id,
          type: 'sale',
          fromStatus: 'owned',
          toStatus: 'for-sale',
          amount: price * 100,
          timestamp: now,
        };

        return {
          marketplaceListings: [...state.marketplaceListings, listing],
          inventoryTransactions: [...state.inventoryTransactions, transaction],
        };
      }),

      updateMarketplaceListing: (listingId, updates) => set((state) => ({
        marketplaceListings: state.marketplaceListings.map(l =>
          l.id === listingId
            ? { ...l, ...updates, updatedAt: new Date().toISOString() }
            : l
        ),
      })),

      cancelMarketplaceListing: (listingId) => set((state) => {
        const listing = state.marketplaceListings.find(l => l.id === listingId);
        if (!listing) return state;

        const transaction: InventoryTransaction = {
          id: `trans-${Date.now()}`,
          itemId: listing.itemId,
          type: 'transfer',
          fromStatus: 'for-sale',
          toStatus: 'owned',
          notes: 'Listing cancelled',
          timestamp: new Date().toISOString(),
        };

        return {
          marketplaceListings: state.marketplaceListings.map(l =>
            l.id === listingId
              ? { ...l, status: 'cancelled', updatedAt: new Date().toISOString() }
              : l
          ),
          inventoryTransactions: [...state.inventoryTransactions, transaction],
        };
      }),

      completeSale: (listingId, buyerId) => set((state) => {
        const listing = state.marketplaceListings.find(l => l.id === listingId);
        if (!listing) return state;

        const now = new Date().toISOString();
        const transaction: InventoryTransaction = {
          id: `trans-${Date.now()}`,
          itemId: listing.itemId,
          type: 'sale',
          fromStatus: 'for-sale',
          toStatus: 'sold',
          amount: listing.price,
          counterparty: buyerId,
          notes: `Sold for $${(listing.price / 100).toFixed(2)}`,
          timestamp: now,
        };

        return {
          marketplaceListings: state.marketplaceListings.map(l =>
            l.id === listingId
              ? { ...l, status: 'sold', soldAt: now, updatedAt: now }
              : l
          ),
          inventoryTransactions: [...state.inventoryTransactions, transaction],
        };
      }),

      addToWishlist: (item) => set((state) => ({
        wishlistItems: [...state.wishlistItems, {
          id: `wishlist-${Date.now()}`,
          userId: state.user?.id || 'unknown',
          status: 'interested',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...item,
        } as WishlistItem],
      })),

      updateWishlistItem: (itemId, updates) => set((state) => ({
        wishlistItems: state.wishlistItems.map(item =>
          item.id === itemId
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item
        ),
      })),

      removeFromWishlist: (itemId) => set((state) => ({
        wishlistItems: state.wishlistItems.filter(item => item.id !== itemId),
      })),

      enableLifecycleTracking: (itemId) => set((state) => {
        if (state.lifecycleTrackings[itemId]) return state;

        const now = new Date().toISOString();
        const tracking: ProductLifecycleTracking = {
          itemId,
          currentStage: 'good',
          maintenanceHistory: [],
          condition: {
            overall: 100,
            appearance: 100,
            functionality: 100,
          },
          isTrackingEnabled: true,
          createdAt: now,
          updatedAt: now,
        };

        return {
          lifecycleTrackings: {
            ...state.lifecycleTrackings,
            [itemId]: tracking,
          },
        };
      }),

      updateLifecycleTracking: (itemId, updates) => set((state) => {
        const existing = state.lifecycleTrackings[itemId];
        if (!existing) return state;

        return {
          lifecycleTrackings: {
            ...state.lifecycleTrackings,
            [itemId]: {
              ...existing,
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      }),

      addMaintenanceRecord: (itemId: string, record: Omit<any, 'id'>) => set((state) => {
        const existing = state.lifecycleTrackings[itemId];
        if (!existing) return state;

        const newRecord: any = {
          ...record,
          id: `maint-${Date.now()}`,
          date: record.date || new Date().toISOString(),
          type: record.type || 'service',
          description: record.description || '',
        };

        return {
          lifecycleTrackings: {
            ...state.lifecycleTrackings,
            [itemId]: {
              ...existing,
              maintenanceHistory: [...(existing.maintenanceHistory || []), newRecord],
              updatedAt: new Date().toISOString(),
            },
          },
        };
      }),

      addWarranty: (warranty) => set((state) => ({
        warranties: [...state.warranties, warranty],
      })),

      updateWarranty: (warrantyId, updates) => set((state) => ({
        warranties: state.warranties.map(w =>
          w.id === warrantyId
            ? { ...w, ...updates, updatedAt: new Date().toISOString() }
            : w
        ),
      })),

      addInsurance: (insurance) => set((state) => ({
        insurances: [...state.insurances, insurance],
      })),

      updateInsurance: (insuranceId, updates) => set((state) => ({
        insurances: state.insurances.map(ins =>
          ins.id === insuranceId
            ? { ...ins, ...updates, updatedAt: new Date().toISOString() }
            : ins
        ),
      })),

      addAppraisal: (appraisal) => set((state) => ({
        appraisals: [...state.appraisals, appraisal],
      })),

      addFinancingOption: (option) => set((state) => ({
        financingOptions: [...state.financingOptions, option],
      })),

      updateInventorySettings: (updates) => set((state) => ({
        inventorySettings: { ...state.inventorySettings, ...updates },
      })),

      setMarketplaceViewMode: (mode) => set((state) => ({
        marketplaceViewMode: { ...state.marketplaceViewMode, ...mode },
      })),

      logInventoryTransaction: (transaction) => set((state) => ({
        inventoryTransactions: [...state.inventoryTransactions, {
          ...transaction,
          id: `trans-${Date.now()}`,
          timestamp: new Date().toISOString(),
        }],
      })),

      // Trash/Recycle Bin Actions
      moveToTrash: async (item, reason) => {
        const { user } = get();
        if (!user) return;
        try {
          // Allow only folders and player-like items in trash
          const allowedTypes = new Set<ContentItem['type']>(['folder', 'player', 'video', 'audio', '3dplayer']);

          const hasPersonalization = (ci: ContentItem): boolean => {
            const hasRatings = (ci.ratings && ci.ratings.length > 0) || typeof ci.myRating === 'number';
            const hasTags = !!(ci.tags && ci.tags.length);
            const hasComments = !!(ci.comments && ci.comments.length) || (typeof ci.commentCount === 'number' && ci.commentCount > 0);
            const hasStyles = !!(ci.styles && Object.keys(ci.styles).length > 0);
            const hasFrame = !!(ci.frameEffect || ci.frameColor || ci.frameWidth || ci.frameStyle);
            const hasLayout = !!(ci.x || ci.y || ci.width || ci.height || ci.gridSpanCol || ci.gridSpanRow || ci.layoutMode || ci.baseFrameStyles);
            const hasContent = !!(ci.content && ci.content.trim().length > 0) || !!ci.html;
            const hasFlags = !!(ci.isPinned || ci.isLiked || ci.priority || ci.visibleMetrics?.length);
            return hasRatings || hasTags || hasComments || hasStyles || hasFrame || hasLayout || hasContent || hasFlags;
          };

          // Skip keeping in trash if type not allowed or not personalized
          if (!allowedTypes.has(item.type)) {
            console.log('[Trash] Skipping unsupported type:', item.type, item.id);
            return;
          }
          if (!hasPersonalization(item)) {
            console.log('[Trash] Skipping unpersonalized item:', item.type, item.id);
            return;
          }

          const { moveToTrash } = await import('./supabase-sync');
          await moveToTrash(user.id, item.id, item, reason);
          const { loadTrashBucket } = await import('./supabase-sync');
          const items = await loadTrashBucket(user.id);
          set({ trashItems: items });
        } catch (error) {
          console.error('Failed to move item to trash:', error);
        }
      },

      restoreFromTrash: async (trashItemId, restorePosition) => {
        const { user } = get();
        if (!user) return;
        try {
          const { restoreFromTrash, loadTrashBucket } = await import('./supabase-sync');
          await restoreFromTrash(user.id, trashItemId, restorePosition);
          const items = await loadTrashBucket(user.id);
          set({ trashItems: items });
        } catch (error) {
          console.error('Failed to restore item from trash:', error);
        }
      },

      permanentlyDeleteTrash: async (trashItemId) => {
        const { user } = get();
        if (!user) return;
        try {
          const { permanentlyDeleteTrash, loadTrashBucket } = await import('./supabase-sync');
          await permanentlyDeleteTrash(user.id, trashItemId);
          const items = await loadTrashBucket(user.id);
          set({ trashItems: items });
        } catch (error) {
          console.error('Failed to permanently delete trash item:', error);
        }
      },

      loadTrashBucket: async () => {
        const { user } = get();
        if (!user) return;
        try {
          set({ isTrashLoading: true });
          const { loadTrashBucket } = await import('./supabase-sync');
          const items = await loadTrashBucket(user.id);
          set({ trashItems: items, isTrashLoading: false });
        } catch (error) {
          console.error('Failed to load trash bucket:', error);
          set({ isTrashLoading: false });
        }
      },

      getTrashStats: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const { getTrashStats } = await import('./supabase-sync');
          const stats = await getTrashStats(user.id);
          set({ trashStats: stats as any });
        } catch (error) {
          console.error('Failed to get trash stats:', error);
        }
      },

      clearExpiredTrash: async () => {
        try {
          await get().loadTrashBucket();
        } catch (error) {
          console.error('Failed to clear expired trash:', error);
        }
      },

      // Scene & Presentation Actions
      createPresentation: async (title, description) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        try {
          const { savePresentation } = await import('./supabase-sync');
          const presentation: Presentation = {
            id: `pres-${Date.now()}`,
            user_id: user.id,
            title,
            description,
            scenes: [],
            total_duration: 0,
            settings: {
              autoPlay: false,
              autoPlayDelay: 5000,
              loop: false,
              loopDelay: 0,
              quality: 'high',
              recordingEnabled: false,
              analyticsEnabled: true
            },
            tags: [],
            category: 'uncategorized',
            is_draft: true,
            is_published: false,
            is_featured: false,
            metadata: {},
            statistics: {
              views: 0,
              totalDuration: 0,
              completionRate: 0,
              avgWatchTime: 0,
              viewHistory: []
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          await savePresentation(user.id, presentation);
          set((state) => ({ presentations: [...state.presentations, presentation] }));
          return presentation;
        } catch (error) {
          console.error('Failed to create presentation:', error);
          throw error;
        }
      },

      updatePresentation: async (presentationId, updates) => {
        const { user } = get();
        if (!user) return;
        try {
          const { savePresentation } = await import('./supabase-sync');
          const presentation = get().presentations.find(p => p.id === presentationId);
          if (!presentation) return;
          const updated = { ...presentation, ...updates, updated_at: new Date().toISOString() };
          await savePresentation(user.id, updated);
          set((state) => ({
            presentations: state.presentations.map(p => p.id === presentationId ? updated : p)
          }));
        } catch (error) {
          console.error('Failed to update presentation:', error);
        }
      },

      deletePresentation: async (presentationId) => {
        const { user } = get();
        if (!user) return;
        try {
          set((state) => ({
            presentations: state.presentations.filter(p => p.id !== presentationId),
            scenes: state.scenes.filter(s => s.presentation_id !== presentationId)
          }));
        } catch (error) {
          console.error('Failed to delete presentation:', error);
        }
      },

      loadPresentation: async (presentationId) => {
        const { user } = get();
        if (!user) return;
        try {
          const { loadPresentation } = await import('./supabase-sync');
          const data = await loadPresentation(user.id, presentationId);
          if (data) {
            set({
              currentPresentationId: presentationId,
              scenes: data.scenes || []
            });
          }
        } catch (error) {
          console.error('Failed to load presentation:', error);
        }
      },

      loadPresentations: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const { getPopularPresentations } = await import('./supabase-sync');
          const presentations = await getPopularPresentations(user.id);
          set({ presentations: presentations as any });
        } catch (error) {
          console.error('Failed to load presentations:', error);
        }
      },

      createScene: async (presentationId, title) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        try {
          const { saveScene } = await import('./supabase-sync');
          const sceneCount = get().scenes.filter(s => s.presentation_id === presentationId).length;
          const scene: Scene = {
            id: `scene-${Date.now()}`,
            user_id: user.id,
            presentation_id: presentationId,
            title,
            background: { type: 'color', value: '#ffffff' },
            items: [],
            width: 1920,
            height: 1080,
            aspectRatio: '16:9',
            duration: 5000,
            auto_advance: true,
            advance_delay: 0,
            transition: { id: `trans-${Date.now()}`, type: 'fade', duration: 500, ease: 'ease-in-out' },
            animations: [],
            order: sceneCount,
            is_visible: true,
            is_locked: false,
            tags: [],
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            accessed_at: new Date().toISOString()
          };
          await saveScene(user.id, scene);
          set((state) => ({ scenes: [...state.scenes, scene] }));
          return scene;
        } catch (error) {
          console.error('Failed to create scene:', error);
          throw error;
        }
      },

      updateScene: async (sceneId, updates) => {
        const { user } = get();
        if (!user) return;
        try {
          const { saveScene } = await import('./supabase-sync');
          const scene = get().scenes.find(s => s.id === sceneId);
          if (!scene) return;
          const updated = { ...scene, ...updates, updated_at: new Date().toISOString() };
          await saveScene(user.id, updated);
          set((state) => ({
            scenes: state.scenes.map(s => s.id === sceneId ? updated : s)
          }));
        } catch (error) {
          console.error('Failed to update scene:', error);
        }
      },

      deleteScene: async (sceneId) => {
        const { user } = get();
        if (!user) return;
        try {
          const scene = get().scenes.find(s => s.id === sceneId);
          if (!scene) return;
          set((state) => ({
            scenes: state.scenes.filter(s => s.id !== sceneId)
          }));
        } catch (error) {
          console.error('Failed to delete scene:', error);
        }
      },

      addSceneAnimation: async (sceneId, animation) => {
        const { user } = get();
        if (!user) return;
        try {
          const scene = get().scenes.find(s => s.id === sceneId);
          if (!scene) return;
          const updated = {
            ...scene,
            animations: [...(scene.animations || []), animation],
            updated_at: new Date().toISOString()
          };
          const { saveScene } = await import('./supabase-sync');
          await saveScene(user.id, updated);
          set((state) => ({
            scenes: state.scenes.map(s => s.id === sceneId ? updated : s)
          }));
        } catch (error) {
          console.error('Failed to add animation:', error);
        }
      },

      updateSceneAnimation: async (sceneId, animationId, updates) => {
        const { user } = get();
        if (!user) return;
        try {
          const scene = get().scenes.find(s => s.id === sceneId);
          if (!scene) return;
          const updated = {
            ...scene,
            animations: (scene.animations || []).map(a => 
              a.id === animationId ? { ...a, ...updates } : a
            ),
            updated_at: new Date().toISOString()
          };
          const { saveScene } = await import('./supabase-sync');
          await saveScene(user.id, updated);
          set((state) => ({
            scenes: state.scenes.map(s => s.id === sceneId ? updated : s)
          }));
        } catch (error) {
          console.error('Failed to update animation:', error);
        }
      },

      setCurrentPresentation: (presentationId) => set({ currentPresentationId: presentationId }),

      setCurrentScene: (sceneId) => set({ currentSceneId: sceneId }),

      setViewportEditorState: (state) => set((s) => ({
        viewportEditorState: { ...s.viewportEditorState, ...state }
      })),

      setIsSceneEditorOpen: (isOpen) => set({ isSceneEditorOpen: isOpen }),

      setIsPreviewMode: (isPreview) => set({ isPreviewMode: isPreview }),

      startBroadcastSession: async (presentationId, streamSettings) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        try {
          const session: BroadcastSession = {
            id: `broadcast-${Date.now()}`,
            user_id: user.id,
            presentation_id: presentationId,
            stream_settings: streamSettings,
            status: 'starting',
            started_at: new Date().toISOString(),
            viewers: 0,
            peak_viewers: 0,
            comments: 0,
            likes: 0,
            shares: 0,
            metadata: {},
            // created_at removed, not in BroadcastSession type
          };
          set((state) => ({ broadcastSessions: [...state.broadcastSessions, session] }));
          return session;
        } catch (error) {
          console.error('Failed to start broadcast:', error);
          throw error;
        }
      },

      endBroadcastSession: async (sessionId) => {
        try {
          set((state) => ({
            broadcastSessions: state.broadcastSessions.map(s => 
              s.id === sessionId
                ? { ...s, status: 'ended', ended_at: new Date().toISOString() }
                : s
            )
          }));
        } catch (error) {
          console.error('Failed to end broadcast:', error);
        }
      },

      updateBroadcastStats: (sessionId, stats) => set((state) => ({
        broadcastSessions: state.broadcastSessions.map(s => 
          s.id === sessionId ? { ...s, ...stats } : s
        )
      })),

      // Profile & Social Actions
      setProfileCanvasId: (id) => set({ profileCanvasId: id }),
      addSocialPost: (post) => set((state) => ({
        socialPosts: [post, ...state.socialPosts]
      })),
      updateSocialPost: (postId, updates) => set((state) => ({
        socialPosts: state.socialPosts.map(p => p.id === postId ? { ...p, ...updates } : p)
      })),
      removeSocialPost: (postId) => set((state) => ({
        socialPosts: state.socialPosts.filter(p => p.id !== postId)
      })),
      addMySharedItem: (item) => set((state) => ({
        mySharedItems: [...state.mySharedItems, item]
      })),
      removeMySharedItem: (itemId) => set((state) => ({
        mySharedItems: state.mySharedItems.filter(i => i.id !== itemId)
      })),

      // Advanced Features Actions
      // Profile Slugs
      createProfileSlug: async (displayName, bio, profileImageUrl) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const slug = displayName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);
        const { data, error } = await supabase
          .from('profile_slugs')
          .insert({ user_id: user.id, slug, display_name: displayName, bio, profile_image_url: profileImageUrl, is_primary: true, public: true })
          .select()
          .single();
        
        if (!error && data) {
          set((state) => ({ profileSlugs: [...state.profileSlugs, data] }));
          return data;
        }
        return null;
      },
      updateProfileSlug: async (slugId, updates) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { error } = await supabase
          .from('profile_slugs')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', slugId);
        
        if (!error) {
          set((state) => ({
            profileSlugs: state.profileSlugs.map(s => s.id === slugId ? { ...s, ...updates } : s)
          }));
        }
      },
      deleteProfileSlug: async (slugId) => {
        const supabase = createClient();
        const { error } = await supabase.from('profile_slugs').delete().eq('id', slugId);
        if (!error) {
          set((state) => ({ profileSlugs: state.profileSlugs.filter(s => s.id !== slugId) }));
        }
      },
      getProfileBySlug: async (slug) => {
        const supabase = createClient();
        const { data, error } = await supabase.from('profile_slugs').select('*').eq('slug', slug).single();
        return data || null;
      },
      createProfileReference: async (targetSlug, relationshipType) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const { data, error } = await supabase
          .from('profile_slug_references')
          .insert({ source_user_id: user.id, target_profile_slug: targetSlug, relationship_type: relationshipType })
          .select()
          .single();
        
        if (!error && data) {
          set((state) => ({ profileSlugReferences: [...state.profileSlugReferences, data] }));
          return data;
        }
        return null;
      },

      // Folder Slugs
      createFolderSlug: async (folderId, displayName, parentSlug) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const slug = displayName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);
        const { data, error } = await supabase
          .from('folder_slugs')
          .insert({ folder_id: folderId, user_id: user.id, slug, display_name: displayName, parent_slug: parentSlug, is_public: true })
          .select()
          .single();
        
        if (!error && data) {
          set((state) => ({ folderSlugs: [...state.folderSlugs, data] }));
          return data;
        }
        return null;
      },
      updateFolderSlug: async (slugId, updates) => {
        const supabase = createClient();
        const { error } = await supabase.from('folder_slugs').update(updates).eq('id', slugId);
        if (!error) {
          set((state) => ({ folderSlugs: state.folderSlugs.map(s => s.id === slugId ? { ...s, ...updates } : s) }));
        }
      },
      deleteFolderSlug: async (slugId) => {
        const supabase = createClient();
        const { error } = await supabase.from('folder_slugs').delete().eq('id', slugId);
        if (!error) {
          set((state) => ({ folderSlugs: state.folderSlugs.filter(s => s.id !== slugId) }));
        }
      },
      getFolderStructure: async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const { data } = await supabase.from('folder_slugs').select('*').eq('user_id', user.id);
        if (data) {
          // FolderStructure expects a single folder structure, not { folders, hierarchy }
          // If data is an array, return the first or adapt as needed
          const structure: FolderStructure = Array.isArray(data) ? data[0] : data;
          set({ folderStructure: structure });
          return structure;
        }
        return null;
      },

      // Message Groups
      createMessageGroup: async (name, memberIds, isPrivate) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);
        const { data, error } = await supabase
          .from('message_groups')
          .insert({ name, slug, created_by: user.id, is_private: isPrivate ?? false, message_count: 0 })
          .select()
          .single();
        
        if (!error && data) {
          set((state) => ({ messageGroups: [...state.messageGroups, data] }));
          return data;
        }
        return null;
      },
      updateMessageGroup: async (groupId, updates) => {
        const supabase = createClient();
        await supabase.from('message_groups').update(updates).eq('id', groupId);
        set((state) => ({ messageGroups: state.messageGroups.map(g => g.id === groupId ? { ...g, ...updates } : g) }));
      },
      deleteMessageGroup: async (groupId) => {
        const supabase = createClient();
        await supabase.from('message_groups').delete().eq('id', groupId);
        set((state) => ({ messageGroups: state.messageGroups.filter(g => g.id !== groupId) }));
      },
      addMessageGroupMember: async (groupId, userId, role) => {
        const supabase = createClient();
        await supabase.from('group_members').insert({ group_id: groupId, user_id: userId, role: role ?? 'member' });
      },
      removeMessageGroupMember: async (groupId, userId) => {
        const supabase = createClient();
        await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
      },
      createMessageGroupInviteLink: async (groupId, expiresIn, maxUses) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString() : null;
        
        const { data, error } = await supabase
          .from('group_invite_links')
          .insert({ group_id: groupId, token, created_by: user.id, expires_at: expiresAt, max_uses: maxUses })
          .select()
          .single();
        
        if (!error && data) {
          set((state) => ({ messageGroupInviteLinks: [...state.messageGroupInviteLinks, data] }));
          return data;
        }
        return null;
      },

      // Calls
      initiateCall: async (callType, participantIds) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const { data, error } = await supabase
          .from('call_sessions')
          .insert({ initiator_id: user.id, call_type: callType, status: 'pending' })
          .select()
          .single();
        
        if (!error && data) {
          set((state) => ({ callSessions: [...state.callSessions, data] }));
          return data;
        }
        return null;
      },
      addCallParticipant2: async (callId, userId) => {
        const supabase = createClient();
        await supabase.from('call_participants').insert({ call_id: callId, user_id: userId, is_active: true });
      },
      removeCallParticipant: async (callId, userId) => {
        const supabase = createClient();
        await supabase.from('call_participants').delete().eq('call_id', callId).eq('user_id', userId);
      },
      toggleCallAudio: async (callId, enabled) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from('call_participants').update({ audio_enabled: enabled }).eq('call_id', callId).eq('user_id', user.id);
      },
      toggleCallVideo: async (callId, enabled) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from('call_participants').update({ video_enabled: enabled }).eq('call_id', callId).eq('user_id', user.id);
      },
      toggleScreenShare: async (callId, enabled) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from('call_participants').update({ screen_share_enabled: enabled }).eq('call_id', callId).eq('user_id', user.id);
      },
      endCallSession: async (callId) => {
        const supabase = createClient();
        await supabase.from('call_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', callId);
        set((state) => ({ callSessions: state.callSessions.map(c => c.id === callId ? { ...c, status: 'ended' } : c) }));
      },
      logCallHistory: async (callId) => {
        const supabase = createClient();
        const session = get().callSessions.find(c => c.id === callId);
        if (session) {
          const { data, error } = await supabase
            .from('call_history')
            .insert({ call_id: callId, user_id: session.initiator_id, duration_seconds: 0 })
            .select()
            .single();
          
          if (!error && data) {
            set((state) => ({ callHistory: [...state.callHistory, data] }));
          }
        }
      },

      // Meetings
      createScheduledMeeting: async (title, startTime, endTime, participantIds, recurrence, agenda) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const slug = title.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);
        const { data, error } = await supabase
          .from('scheduled_meetings')
          .insert({ user_id: user.id, title, slug, start_time: startTime, end_time: endTime, recurrence, agenda, status: 'scheduled' })
          .select()
          .single();
        
        if (!error && data) {
          set((state) => ({ scheduledMeetings: [...state.scheduledMeetings, data] }));
          return data;
        }
        return null;
      },
      updateScheduledMeeting: async (meetingId, updates) => {
        const supabase = createClient();
        await supabase.from('scheduled_meetings').update(updates).eq('id', meetingId);
        set((state) => ({ scheduledMeetings: state.scheduledMeetings.map(m => m.id === meetingId ? { ...m, ...updates } : m) }));
      },
      deleteScheduledMeeting: async (meetingId) => {
        const supabase = createClient();
        await supabase.from('scheduled_meetings').delete().eq('id', meetingId);
        set((state) => ({ scheduledMeetings: state.scheduledMeetings.filter(m => m.id !== meetingId) }));
      },
      addMeetingParticipant: async (meetingId, userId, email) => {
        const supabase = createClient();
        await supabase.from('meeting_participants').insert({ meeting_id: meetingId, user_id: userId, email, rsvp_status: 'pending' });
      },
      removeMeetingParticipant: async (meetingId, userId) => {
        const supabase = createClient();
        await supabase.from('meeting_participants').delete().eq('meeting_id', meetingId).eq('user_id', userId);
      },
      startMeetingRecording: async (meetingId) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('meeting_recordings')
          .insert({ meeting_id: meetingId, status: 'recording', started_at: new Date().toISOString() })
          .select()
          .single();
        
        if (!error && data) {
          set((state) => ({ meetingRecordings: [...state.meetingRecordings, data] }));
          return data;
        }
        return null;
      },
      stopMeetingRecording: async (recordingId) => {
        const supabase = createClient();
        await supabase.from('meeting_recordings').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', recordingId);
      },
      addMeetingFollowUp: async (meetingId, action, assignedTo, dueDate) => {
        const supabase = createClient();
        await supabase.from('meeting_follow_ups').insert({ meeting_id: meetingId, action, assigned_to: assignedTo, due_date: dueDate, status: 'pending' });
      },

      // Social Groups
      createSocialGroup: async (name, category, isPrivate) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);
        const { data, error } = await supabase
          .from('social_groups')
          .insert({ name, slug, category, created_by: user.id, is_private: isPrivate ?? false, member_count: 1 })
          .select()
          .single();
        
        if (!error && data) {
          set((state) => ({ socialGroups: [...state.socialGroups, data] }));
          return data;
        }
        return null;
      },
      updateSocialGroup: async (groupId, updates) => {
        const supabase = createClient();
        await supabase.from('social_groups').update(updates).eq('id', groupId);
        set((state) => ({ socialGroups: state.socialGroups.map(g => g.id === groupId ? { ...g, ...updates } : g) }));
      },
      deleteSocialGroup: async (groupId) => {
        const supabase = createClient();
        await supabase.from('social_groups').delete().eq('id', groupId);
        set((state) => ({ socialGroups: state.socialGroups.filter(g => g.id !== groupId) }));
      },
      inviteToSocialGroup: async (groupId, userId) => {
        const supabase = createClient();
        await supabase.from('social_group_invites').insert({ group_id: groupId, user_id: userId, status: 'pending' });
      },
      postToSocialGroup: async (groupId, content, mediaUrls) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const { data, error } = await supabase
          .from('social_group_posts')
          .insert({ group_id: groupId, user_id: user.id, content, media: mediaUrls })
          .select()
          .single();
        
        if (!error && data) {
          set((state) => ({ socialGroupPosts: [...state.socialGroupPosts, data] }));
          return data;
        }
        return null;
      },
      requestJoinSocialGroup: async (groupId) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const { data, error } = await supabase
          .from('join_requests')
          .insert({ group_id: groupId, user_id: user.id, status: 'pending' })
          .select()
          .single();
        
        if (!error && data) {
          set((state) => ({ joinRequests: [...state.joinRequests, data] }));
          return data;
        }
        return null;
      },
      approveSocialGroupJoinRequest: async (requestId) => {
        const supabase = createClient();
        await supabase.from('join_requests').update({ status: 'approved' }).eq('id', requestId);
      },
      rejectSocialGroupJoinRequest: async (requestId) => {
        const supabase = createClient();
        await supabase.from('join_requests').update({ status: 'rejected' }).eq('id', requestId);
      },
      removeSocialGroupMember: async (groupId, userId) => {
        const supabase = createClient();
        await supabase.from('social_group_members').delete().eq('group_id', groupId).eq('user_id', userId);
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
        searchHistory: state.searchHistory,
      }),
    }
  )
);
