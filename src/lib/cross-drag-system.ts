'use client';

import { ContentItem } from '@/lib/initial-content';

// Drag & Drop Types
export type DragSourceType =
  | 'library-item'
  | 'canvas-item'
  | 'minimap-item'
  | 'tab-item'
  | 'sidebar-item'
  | 'message-item'
  | 'social-item'
  | 'browser-item'
  | 'filesystem-item';

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
  | 'external-app';

// Drag Context
export interface DragContext {
  sourceType: DragSourceType;
  targetType: DropTargetType;
  item: ContentItem;
  sourceData?: any;
  targetData?: any;
}

// Drop Rules - hangi öğeler nereye bırakılabilir
export interface DropRule {
  sourceTypes: DragSourceType[];
  targetTypes: DropTargetType[];
  condition?: (context: DragContext) => boolean;
  action: (context: DragContext) => Promise<void> | void;
  visualFeedback?: {
    acceptColor: string;
    rejectColor: string;
    acceptIcon?: string;
    rejectIcon?: string;
  };
}

// Drop Zone States
export type DropZoneState = 'idle' | 'hover' | 'accept' | 'reject' | 'loading';

// Visual Feedback Tokens
export interface DropToken {
  state: DropZoneState;
  message: string;
  icon?: string;
  color: string;
  animation?: string;
}

// Cross-Drag Manager
export class CrossDragManager {
  private static instance: CrossDragManager;
  private rules: DropRule[] = [];
  private activeDrag: DragContext | null = null;

  static getInstance(): CrossDragManager {
    if (!CrossDragManager.instance) {
      CrossDragManager.instance = new CrossDragManager();
    }
    return CrossDragManager.instance;
  }

  // Register drop rules
  registerRule(rule: DropRule): void {
    this.rules.push(rule);
  }

  // Check if drop is allowed
  canDrop(context: DragContext): boolean {
    return this.rules.some(rule =>
      rule.sourceTypes.includes(context.sourceType) &&
      rule.targetTypes.includes(context.targetType) &&
      (!rule.condition || rule.condition(context))
    );
  }

  // Execute drop action
  async executeDrop(context: DragContext): Promise<void> {
    const rule = this.rules.find(rule =>
      rule.sourceTypes.includes(context.sourceType) &&
      rule.targetTypes.includes(context.targetType) &&
      (!rule.condition || rule.condition(context))
    );

    if (rule) {
      await rule.action(context);
    }
  }

  // Get visual feedback for drop zone
  getDropToken(context: DragContext): DropToken {
    const canDrop = this.canDrop(context);
    const rule = this.rules.find(rule =>
      rule.sourceTypes.includes(context.sourceType) &&
      rule.targetTypes.includes(context.targetType)
    );

    if (canDrop) {
      return {
        state: 'accept',
        message: this.getAcceptMessage(context),
        icon: rule?.visualFeedback?.acceptIcon || '✅',
        color: rule?.visualFeedback?.acceptColor || '#10b981',
        animation: 'pulse'
      };
    } else {
      return {
        state: 'reject',
        message: this.getRejectMessage(context),
        icon: rule?.visualFeedback?.rejectIcon || '❌',
        color: rule?.visualFeedback?.rejectColor || '#ef4444',
        animation: 'shake'
      };
    }
  }

  // Set active drag context
  setActiveDrag(context: DragContext | null): void {
    this.activeDrag = context;
  }

  // Get active drag context
  getActiveDrag(): DragContext | null {
    return this.activeDrag;
  }

  private getAcceptMessage(context: DragContext): string {
    const messages: Record<string, Record<string, string>> = {
      'canvas-item': {
        'minimap': 'Mini haritaya ekle',
        'tab': 'Sekmeye taşı',
        'folder': 'Klasöre taşı',
        'trash': 'Çöp kutusuna taşı',
        'new-tab': 'Yeni sekmeye aç'
      },
      'library-item': {
        'canvas': 'Tuval üzerine yerleştir',
        'minimap': 'Mini haritaya ekle',
        'tab': 'Sekmeye aç'
      },
      'filesystem-item': {
        'canvas': 'Tuval üzerine yükle',
        'library': 'Kütüphaneye ekle'
      }
    };

    if (messages[context.sourceType] && messages[context.sourceType][context.targetType]) {
      return messages[context.sourceType][context.targetType];
    }
    return 'Bırakmak için uygun';
  }

  private getRejectMessage(context: DragContext): string {
    return 'Bu öğe buraya bırakılamaz';
  }
}

// Default Drop Rules
export const initializeDefaultRules = (manager: CrossDragManager) => {
  // Canvas items to various targets
  manager.registerRule({
    sourceTypes: ['canvas-item'],
    targetTypes: ['minimap', 'tab', 'folder', 'trash', 'new-tab'],
    action: async (context) => {
      console.log('Moving canvas item:', context);
      // Implementation will be in the components
    },
    visualFeedback: {
      acceptColor: '#3b82f6',
      rejectColor: '#ef4444',
      acceptIcon: '📍',
      rejectIcon: '🚫'
    }
  });

  // Library items to canvas/minimap
  manager.registerRule({
    sourceTypes: ['library-item'],
    targetTypes: ['canvas', 'minimap'],
    action: async (context) => {
      console.log('Adding library item to canvas:', context);
    },
    visualFeedback: {
      acceptColor: '#10b981',
      rejectColor: '#ef4444',
      acceptIcon: '➕',
      rejectIcon: '🚫'
    }
  });

  // Filesystem items to canvas/library
  manager.registerRule({
    sourceTypes: ['filesystem-item'],
    targetTypes: ['canvas', 'sidebar'],
    condition: (context) => {
      // Check file type compatibility
      const allowedTypes = ['image', 'video', 'audio', 'document', 'text'];
      return allowedTypes.includes(context.item.type);
    },
    action: async (context) => {
      console.log('Uploading file:', context);
    },
    visualFeedback: {
      acceptColor: '#8b5cf6',
      rejectColor: '#ef4444',
      acceptIcon: '📁',
      rejectIcon: '🚫'
    }
  });

  // Browser items to canvas
  manager.registerRule({
    sourceTypes: ['browser-item'],
    targetTypes: ['canvas'],
    action: async (context) => {
      console.log('Creating web content from browser:', context);
    },
    visualFeedback: {
      acceptColor: '#f59e0b',
      rejectColor: '#ef4444',
      acceptIcon: '🌐',
      rejectIcon: '🚫'
    }
  });

  // Canvas items to minimap (navigation)
  manager.registerRule({
    sourceTypes: ['canvas-item', 'library-item'],
    targetTypes: ['minimap'],
    action: async (context) => {
      console.log('Navigating to item via minimap:', context);
      // Navigation will be handled by the parent component callback
    },
    visualFeedback: {
      acceptColor: '#06b6d4',
      rejectColor: '#ef4444',
      acceptIcon: '🗺️',
      rejectIcon: '🚫'
    }
  });

  // Sidebar items to minimap
  manager.registerRule({
    sourceTypes: ['sidebar-item'],
    targetTypes: ['minimap'],
    action: async (context) => {
      console.log('Opening sidebar item in minimap view:', context);
    },
    visualFeedback: {
      acceptColor: '#10b981',
      rejectColor: '#ef4444',
      acceptIcon: '📍',
      rejectIcon: '🚫'
    }
  });
};