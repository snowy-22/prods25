'use client';

import { ContentItem } from '@/lib/initial-content';

// =====================================
// DRAG SOURCE TYPES
// =====================================
export type DragSourceType =
  | 'library-item'
  | 'canvas-item'
  | 'minimap-item'
  | 'tab-item'
  | 'sidebar-item'
  | 'message-item'
  | 'social-item'
  | 'browser-item'
  | 'filesystem-item'
  | 'widget-item'
  | 'search-result'
  | 'ai-suggestion'
  | 'marketplace-item'
  | 'presentation-item'
  | 'scene-item'
  | 'external-content';

// =====================================
// DROP TARGET TYPES
// =====================================
export type DropTargetType =
  | 'canvas'
  | 'minimap'
  | 'tab'
  | 'sidebar'
  | 'message-thread'
  | 'social-group'
  | 'folder'
  | 'trash'
  | 'new-tab'
  | 'new-folder'
  | 'browser-window'
  | 'external-app'
  | 'presentation-scene'
  | 'widget-zone'
  | 'player-frame'
  | 'grid-cell'
  | 'tab-bar'
  | 'secondary-sidebar'
  | 'primary-sidebar';

// =====================================
// DRAG CONTEXT
// =====================================
export interface DragContext {
  sourceType: DragSourceType;
  targetType: DropTargetType;
  item: ContentItem;
  sourceData?: any;
  targetData?: any;
  /** Drop position relative to target */
  position?: { x: number; y: number };
  /** Keyboard modifiers */
  modifiers?: {
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  };
  /** Original drag event */
  event?: React.DragEvent;
}

// =====================================
// DROP RULES
// =====================================
export interface DropRule {
  id: string;
  sourceTypes: DragSourceType[];
  targetTypes: DropTargetType[];
  condition?: (context: DragContext) => boolean;
  action: (context: DragContext) => Promise<void> | void;
  priority?: number; // Higher priority rules are checked first
  visualFeedback?: {
    acceptColor: string;
    rejectColor: string;
    acceptIcon?: string;
    rejectIcon?: string;
    acceptMessage?: string;
    rejectMessage?: string;
  };
}

// =====================================
// DROP ZONE STATES
// =====================================
export type DropZoneState = 'idle' | 'hover' | 'accept' | 'reject' | 'loading';

// =====================================
// VISUAL FEEDBACK TOKENS
// =====================================
export interface DropToken {
  state: DropZoneState;
  message: string;
  icon?: string;
  color: string;
  animation?: 'pulse' | 'shake' | 'bounce' | 'fade' | 'none';
  /** Custom CSS class */
  className?: string;
}

// =====================================
// DRAG EVENT CALLBACKS
// =====================================
export interface DragEventCallbacks {
  onDragStart?: (context: DragContext) => void;
  onDragOver?: (context: DragContext) => void;
  onDragEnter?: (context: DragContext) => void;
  onDragLeave?: (context: DragContext) => void;
  onDrop?: (context: DragContext) => void | Promise<void>;
  onDragEnd?: (context: DragContext, dropped: boolean) => void;
}

// =====================================
// CROSS-DRAG MANAGER (Singleton)
// =====================================
export class CrossDragManager {
  private static instance: CrossDragManager;
  private rules: DropRule[] = [];
  private activeDrag: DragContext | null = null;
  private listeners: Map<string, Set<(context: DragContext | null) => void>> = new Map();

  static getInstance(): CrossDragManager {
    if (!CrossDragManager.instance) {
      CrossDragManager.instance = new CrossDragManager();
    }
    return CrossDragManager.instance;
  }

  // =====================================
  // RULE MANAGEMENT
  // =====================================
  
  /** Register a new drop rule */
  registerRule(rule: DropRule): void {
    // Avoid duplicate rules
    const existingIndex = this.rules.findIndex(r => r.id === rule.id);
    if (existingIndex !== -1) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
    // Sort by priority (higher first)
    this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /** Unregister a rule by ID */
  unregisterRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /** Get all registered rules */
  getRules(): DropRule[] {
    return [...this.rules];
  }

  /** Clear all rules */
  clearRules(): void {
    this.rules = [];
  }

  // =====================================
  // DROP VALIDATION
  // =====================================
  
  /** Check if drop is allowed */
  canDrop(context: DragContext): boolean {
    return this.rules.some(rule =>
      rule.sourceTypes.includes(context.sourceType) &&
      rule.targetTypes.includes(context.targetType) &&
      (!rule.condition || rule.condition(context))
    );
  }

  /** Find matching rule for context */
  findMatchingRule(context: DragContext): DropRule | undefined {
    return this.rules.find(rule =>
      rule.sourceTypes.includes(context.sourceType) &&
      rule.targetTypes.includes(context.targetType) &&
      (!rule.condition || rule.condition(context))
    );
  }

  /** Execute drop action */
  async executeDrop(context: DragContext): Promise<boolean> {
    const rule = this.findMatchingRule(context);
    if (rule) {
      try {
        await rule.action(context);
        return true;
      } catch (error) {
        console.error('Drop action failed:', error);
        return false;
      }
    }
    return false;
  }

  // =====================================
  // VISUAL FEEDBACK
  // =====================================
  
  /** Get visual feedback token for drop zone */
  getDropToken(context: DragContext): DropToken {
    const canDrop = this.canDrop(context);
    const rule = this.findMatchingRule(context);

    if (canDrop) {
      return {
        state: 'accept',
        message: rule?.visualFeedback?.acceptMessage || this.getAcceptMessage(context),
        icon: rule?.visualFeedback?.acceptIcon || '✅',
        color: rule?.visualFeedback?.acceptColor || '#10b981',
        animation: 'pulse'
      };
    } else {
      // Try to find a rule that matches source/target but fails condition
      const partialRule = this.rules.find(rule =>
        rule.sourceTypes.includes(context.sourceType) &&
        rule.targetTypes.includes(context.targetType)
      );
      
      return {
        state: 'reject',
        message: partialRule?.visualFeedback?.rejectMessage || this.getRejectMessage(context),
        icon: partialRule?.visualFeedback?.rejectIcon || '❌',
        color: partialRule?.visualFeedback?.rejectColor || '#ef4444',
        animation: 'shake'
      };
    }
  }

  // =====================================
  // DRAG STATE MANAGEMENT
  // =====================================
  
  /** Set active drag context */
  setActiveDrag(context: DragContext | null): void {
    this.activeDrag = context;
    this.notifyListeners('dragState', context);
  }

  /** Get active drag context */
  getActiveDrag(): DragContext | null {
    return this.activeDrag;
  }

  /** Check if currently dragging */
  isDragging(): boolean {
    return this.activeDrag !== null;
  }

  // =====================================
  // EVENT LISTENERS
  // =====================================
  
  /** Subscribe to drag state changes */
  subscribe(event: string, callback: (context: DragContext | null) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /** Notify all listeners */
  private notifyListeners(event: string, context: DragContext | null): void {
    this.listeners.get(event)?.forEach(callback => callback(context));
  }

  // =====================================
  // MESSAGE GENERATION
  // =====================================
  
  private getAcceptMessage(context: DragContext): string {
    const messages: Record<string, Record<string, string>> = {
      'canvas-item': {
        'minimap': 'Mini haritaya ekle',
        'tab': 'Sekmeye taşı',
        'folder': 'Klasöre taşı',
        'trash': 'Çöp kutusuna taşı',
        'new-tab': 'Yeni sekmeye aç',
        'grid-cell': 'Hücreye yerleştir',
        'player-frame': 'Player olarak aç'
      },
      'library-item': {
        'canvas': 'Tuval üzerine yerleştir',
        'minimap': 'Mini haritaya ekle',
        'tab': 'Sekmeye aç',
        'new-tab': 'Yeni sekmeye aç',
        'folder': 'Klasöre ekle',
        'grid-cell': 'Hücreye ekle'
      },
      'filesystem-item': {
        'canvas': 'Tuval üzerine yükle',
        'sidebar': 'Kütüphaneye ekle',
        'folder': 'Klasöre yükle'
      },
      'widget-item': {
        'canvas': 'Widget ekle',
        'grid-cell': 'Hücreye widget ekle',
        'widget-zone': 'Widget bölgesine ekle'
      },
      'search-result': {
        'canvas': 'Sonucu tuvale ekle',
        'new-tab': 'Yeni sekmede aç',
        'folder': 'Klasöre kaydet'
      },
      'ai-suggestion': {
        'canvas': 'AI önerisini uygula',
        'new-tab': 'Yeni sekmede aç'
      },
      'tab-item': {
        'tab-bar': 'Sekmeyi taşı',
        'new-folder': 'Sekmeyi grupla'
      },
      'presentation-item': {
        'presentation-scene': 'Sahneye ekle',
        'canvas': 'Tuvale yerleştir'
      },
      'scene-item': {
        'presentation-scene': 'Sahneyi taşı',
        'canvas': 'Sahneyi önizle'
      }
    };

    if (messages[context.sourceType]?.[context.targetType]) {
      return messages[context.sourceType][context.targetType];
    }
    return 'Bırakmak için uygun';
  }

  private getRejectMessage(context: DragContext): string {
    const rejectMessages: Record<string, Record<string, string>> = {
      'message-item': {
        'canvas': 'Mesajlar tuvale eklenemez'
      },
      'social-item': {
        'trash': 'Sosyal içerik silinemez'
      }
    };

    if (rejectMessages[context.sourceType]?.[context.targetType]) {
      return rejectMessages[context.sourceType][context.targetType];
    }
    return 'Bu öğe buraya bırakılamaz';
  }
}

// =====================================
// DEFAULT DROP RULES
// =====================================
export const initializeDefaultRules = (manager: CrossDragManager) => {
  // Library items to canvas/minimap/tab
  manager.registerRule({
    id: 'library-to-canvas',
    sourceTypes: ['library-item'],
    targetTypes: ['canvas', 'minimap', 'new-tab', 'grid-cell'],
    priority: 10,
    action: async (context) => {
      console.log('[CrossDrag] Adding library item:', context.item.title);
    },
    visualFeedback: {
      acceptColor: '#10b981',
      rejectColor: '#ef4444',
      acceptIcon: '➕',
      rejectIcon: '🚫',
      acceptMessage: 'Tuval üzerine yerleştir'
    }
  });

  // Canvas items to various targets
  manager.registerRule({
    id: 'canvas-to-targets',
    sourceTypes: ['canvas-item'],
    targetTypes: ['minimap', 'tab', 'folder', 'trash', 'new-tab', 'grid-cell'],
    priority: 10,
    action: async (context) => {
      console.log('[CrossDrag] Moving canvas item:', context.item.title, 'to', context.targetType);
    },
    visualFeedback: {
      acceptColor: '#3b82f6',
      rejectColor: '#ef4444',
      acceptIcon: '📍',
      rejectIcon: '🚫'
    }
  });

  // Filesystem items to canvas/library
  manager.registerRule({
    id: 'filesystem-to-canvas',
    sourceTypes: ['filesystem-item'],
    targetTypes: ['canvas', 'sidebar', 'folder'],
    priority: 8,
    condition: (context) => {
      // Check file type compatibility
      const allowedTypes = ['image', 'video', 'audio', 'document', 'text', 'player', 'folder'];
      return allowedTypes.includes(context.item.type);
    },
    action: async (context) => {
      console.log('[CrossDrag] Uploading file:', context.item.title);
    },
    visualFeedback: {
      acceptColor: '#8b5cf6',
      rejectColor: '#ef4444',
      acceptIcon: '📁',
      rejectIcon: '🚫',
      acceptMessage: 'Dosyayı yükle'
    }
  });

  // Browser items to canvas
  manager.registerRule({
    id: 'browser-to-canvas',
    sourceTypes: ['browser-item', 'external-content'],
    targetTypes: ['canvas', 'new-tab'],
    priority: 7,
    action: async (context) => {
      console.log('[CrossDrag] Creating web content from browser:', context.item.title);
    },
    visualFeedback: {
      acceptColor: '#f59e0b',
      rejectColor: '#ef4444',
      acceptIcon: '🌐',
      rejectIcon: '🚫',
      acceptMessage: 'Web içeriği oluştur'
    }
  });

  // Widget items to canvas/widget zones
  manager.registerRule({
    id: 'widget-to-canvas',
    sourceTypes: ['widget-item'],
    targetTypes: ['canvas', 'widget-zone', 'grid-cell'],
    priority: 9,
    action: async (context) => {
      console.log('[CrossDrag] Adding widget:', context.item.title);
    },
    visualFeedback: {
      acceptColor: '#06b6d4',
      rejectColor: '#ef4444',
      acceptIcon: '📦',
      rejectIcon: '🚫',
      acceptMessage: 'Widget ekle'
    }
  });

  // Tab items reordering
  manager.registerRule({
    id: 'tab-reorder',
    sourceTypes: ['tab-item'],
    targetTypes: ['tab-bar', 'new-folder'],
    priority: 10,
    action: async (context) => {
      console.log('[CrossDrag] Reordering tab:', context.item.title);
    },
    visualFeedback: {
      acceptColor: '#8b5cf6',
      rejectColor: '#ef4444',
      acceptIcon: '↔️',
      rejectIcon: '🚫',
      acceptMessage: 'Sekmeyi taşı'
    }
  });

  // Search results to various targets
  manager.registerRule({
    id: 'search-to-targets',
    sourceTypes: ['search-result', 'ai-suggestion'],
    targetTypes: ['canvas', 'new-tab', 'folder', 'grid-cell'],
    priority: 8,
    action: async (context) => {
      console.log('[CrossDrag] Adding search result:', context.item.title);
    },
    visualFeedback: {
      acceptColor: '#10b981',
      rejectColor: '#ef4444',
      acceptIcon: '🔍',
      rejectIcon: '🚫',
      acceptMessage: 'Sonucu ekle'
    }
  });

  // Presentation/Scene items
  manager.registerRule({
    id: 'presentation-items',
    sourceTypes: ['presentation-item', 'scene-item'],
    targetTypes: ['presentation-scene', 'canvas'],
    priority: 8,
    action: async (context) => {
      console.log('[CrossDrag] Managing presentation item:', context.item.title);
    },
    visualFeedback: {
      acceptColor: '#ec4899',
      rejectColor: '#ef4444',
      acceptIcon: '🎬',
      rejectIcon: '🚫',
      acceptMessage: 'Sahneye ekle'
    }
  });

  // Marketplace items
  manager.registerRule({
    id: 'marketplace-items',
    sourceTypes: ['marketplace-item'],
    targetTypes: ['canvas', 'folder', 'new-tab'],
    priority: 7,
    action: async (context) => {
      console.log('[CrossDrag] Adding marketplace item:', context.item.title);
    },
    visualFeedback: {
      acceptColor: '#f97316',
      rejectColor: '#ef4444',
      acceptIcon: '🛒',
      rejectIcon: '🚫',
      acceptMessage: 'Ürünü ekle'
    }
  });

  // Sidebar items to minimap/canvas
  manager.registerRule({
    id: 'sidebar-to-targets',
    sourceTypes: ['sidebar-item'],
    targetTypes: ['minimap', 'canvas', 'new-tab'],
    priority: 8,
    action: async (context) => {
      console.log('[CrossDrag] Opening sidebar item:', context.item.title);
    },
    visualFeedback: {
      acceptColor: '#10b981',
      rejectColor: '#ef4444',
      acceptIcon: '📍',
      rejectIcon: '🚫',
      acceptMessage: 'Öğeyi aç'
    }
  });

  // Trash operations
  manager.registerRule({
    id: 'any-to-trash',
    sourceTypes: ['canvas-item', 'library-item', 'widget-item', 'tab-item'],
    targetTypes: ['trash'],
    priority: 5,
    action: async (context) => {
      console.log('[CrossDrag] Moving to trash:', context.item.title);
    },
    visualFeedback: {
      acceptColor: '#ef4444',
      rejectColor: '#6b7280',
      acceptIcon: '🗑️',
      rejectIcon: '🚫',
      acceptMessage: 'Çöp kutusuna at'
    }
  });

  // Folder operations
  manager.registerRule({
    id: 'items-to-folder',
    sourceTypes: ['canvas-item', 'library-item', 'widget-item', 'search-result'],
    targetTypes: ['folder', 'new-folder'],
    priority: 6,
    action: async (context) => {
      console.log('[CrossDrag] Moving to folder:', context.item.title);
    },
    visualFeedback: {
      acceptColor: '#8b5cf6',
      rejectColor: '#ef4444',
      acceptIcon: '📂',
      rejectIcon: '🚫',
      acceptMessage: 'Klasöre taşı'
    }
  });
};

// =====================================
// HELPER FUNCTIONS
// =====================================

/** Create a drag data transfer payload */
export function createDragPayload(
  item: ContentItem,
  sourceType: DragSourceType,
  sourceData?: any
): string {
  return JSON.stringify({
    id: item.id,
    type: item.type,
    title: item.title,
    sourceType,
    sourceData,
    timestamp: Date.now()
  });
}

/** Parse drag data transfer payload */
export function parseDragPayload(data: string): {
  id: string;
  type: string;
  title: string;
  sourceType: DragSourceType;
  sourceData?: any;
  timestamp: number;
} | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/** Get drop effect based on modifiers */
export function getDropEffect(
  context: DragContext
): 'copy' | 'move' | 'link' | 'none' {
  if (!context.modifiers) return 'move';
  
  if (context.modifiers.ctrlKey && context.modifiers.shiftKey) {
    return 'link';
  }
  if (context.modifiers.ctrlKey) {
    return 'copy';
  }
  return 'move';
}

// =====================================
// SINGLETON INSTANCE
// =====================================
let managerInitialized = false;

/** Get initialized CrossDragManager singleton */
export function getCrossDragManager(): CrossDragManager {
  const manager = CrossDragManager.getInstance();
  if (!managerInitialized) {
    initializeDefaultRules(manager);
    managerInitialized = true;
  }
  return manager;
}