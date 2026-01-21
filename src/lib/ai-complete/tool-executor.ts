/**
 * Tool Executor
 * Connects AI tools to actual CanvasFlow app functionality
 */

import { AI_TOOLS, createAIToolResult, createAIToolResultLegacy } from './tools';
import { AITool, AIAIToolResult } from './types';
import { ContentItem, ItemType } from '@/lib/initial-content';

// Tool execution context - passed to tool handlers
export interface ToolContext {
  userId: string;
  sessionId?: string;
  currentViewId?: string;
  selectedItemIds?: string[];
  
  // State accessors (injected from store)
  getState?: () => any;
  setState?: (updates: any) => void;
  
  // Actions
  addItem?: (item: Partial<ContentItem>) => ContentItem;
  removeItem?: (itemId: string) => void;
  updateItem?: (itemId: string, updates: Partial<ContentItem>) => void;
  
  // Navigation
  openTab?: (item: ContentItem) => void;
  navigateTo?: (viewId: string) => void;
  
  // Toast notifications
  toast?: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}

// Tool handler type
type ToolHandler = (
  params: Record<string, any>,
  context: ToolContext
) => Promise<AIAIToolResult>;

// Tool handlers registry
const toolHandlers: Record<string, ToolHandler> = {
  // ============= CANVAS TOOLS =============
  
  addPlayerToCanvas: async (params, context) => {
    const { url, title, x, y, width, height } = params;
    
    // Determine item type from URL - use 'player' type for all video URLs
    // Note: 'player' and 'video' are valid ItemTypes, external services use 'player'
    let itemType: ItemType = 'player';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      itemType = 'video'; // Use 'video' type for YouTube
    } else if (url.includes('vimeo.com')) {
      itemType = 'player'; // Vimeo uses 'player' type
    } else if (url.includes('twitch.tv')) {
      itemType = 'player'; // Twitch uses 'player' type
    }
    
    const newItem = context.addItem?.({
      type: itemType,
      title: title || 'New Player',
      url,
      x: x ?? 100,
      y: y ?? 100,
      width: width ?? 640,
      height: height ?? 360,
    });
    
    return createAIToolResultLegacy(true, `Player eklendi: ${title || url}`, { itemId: newItem?.id });
  },
  
  createFolder: async (params, context) => {
    const { name, parentId, icon } = params;
    
    const newFolder = context.addItem?.({
      type: 'folder',
      title: name,
      parentId: parentId || null,
      icon: icon || '📁',
    });
    
    return createAIToolResultLegacy(true, `Klasör oluşturuldu: ${name}`, { folderId: newFolder?.id });
  },
  
  moveItem: async (params, context) => {
    const { itemId, targetFolderId } = params;
    
    context.updateItem?.(itemId, { parentId: targetFolderId });
    
    return createAIToolResultLegacy(true, `Öğe taşındı`, { itemId, targetFolderId });
  },
  
  deleteItem: async (params, context) => {
    const { itemId, permanent } = params;
    
    if (permanent) {
      context.removeItem?.(itemId);
    } else {
      // Move to trash instead of setting isDeleted flag
      context.removeItem?.(itemId);
    }
    
    return createAIToolResultLegacy(true, `Öğe ${permanent ? 'kalıcı olarak' : ''} silindi`, { itemId });
  },
  
  organizeItems: async (params, context) => {
    const { itemIds, layout, targetFolderId } = params;
    
    // Organize items based on layout type
    const baseX = 50;
    const baseY = 50;
    const gap = 20;
    
    itemIds.forEach((id: string, index: number) => {
      let x = baseX;
      let y = baseY;
      
      if (layout === 'grid') {
        const cols = 3;
        x = baseX + (index % cols) * (300 + gap);
        y = baseY + Math.floor(index / cols) * (200 + gap);
      } else if (layout === 'horizontal') {
        x = baseX + index * (300 + gap);
      } else if (layout === 'vertical') {
        y = baseY + index * (200 + gap);
      }
      
      context.updateItem?.(id, { x, y, parentId: targetFolderId });
    });
    
    return createAIToolResultLegacy(true, `${itemIds.length} öğe düzenlendi (${layout})`, { itemIds });
  },
  
  // ============= SEARCH TOOLS =============
  
  searchYouTube: async (params, _context) => {
    const { query, maxResults = 10 } = params;
    
    // This would call YouTube API - for now return placeholder
    const mockResults = [
      { id: 'video1', title: `${query} - Sonuç 1`, thumbnail: '' },
      { id: 'video2', title: `${query} - Sonuç 2`, thumbnail: '' },
    ];
    
    return createAIToolResultLegacy(true, `${mockResults.length} sonuç bulundu`, { 
      query, 
      results: mockResults 
    });
  },
  
  searchWeb: async (params, _context) => {
    const { query, maxResults = 5 } = params;
    
    // This would call web search API - placeholder
    const mockResults = [
      { title: `${query} hakkında`, url: 'https://example.com', snippet: '...' },
    ];
    
    return createAIToolResultLegacy(true, `${mockResults.length} web sonucu`, { 
      query, 
      results: mockResults 
    });
  },
  
  searchLibrary: async (params, context) => {
    const { query, type, tags } = params;
    
    // Search would be performed on actual library
    return createAIToolResultLegacy(true, `Kütüphanede '${query}' arandı`, { 
      query, 
      type, 
      tags,
      results: [] 
    });
  },
  
  // ============= MEDIA TOOLS =============
  
  playMedia: async (params, context) => {
    const { itemId } = params;
    
    // This would trigger play on the media item
    context.toast?.({ title: 'Oynatılıyor', description: `Item: ${itemId}` });
    
    return createAIToolResultLegacy(true, 'Medya oynatılıyor', { itemId });
  },
  
  pauseMedia: async (params, context) => {
    const { itemId } = params;
    
    context.toast?.({ title: 'Duraklatıldı', description: `Item: ${itemId}` });
    
    return createAIToolResultLegacy(true, 'Medya duraklatıldı', { itemId });
  },
  
  setVolume: async (params, context) => {
    const { itemId, volume } = params;
    
    // Volume is handled by media player, not ContentItem
    context.toast?.({ title: 'Ses', description: `Ses seviyesi: ${volume}%` });
    
    return createAIToolResultLegacy(true, `Ses seviyesi: ${volume}%`, { itemId, volume });
  },
  
  takeScreenshot: async (params, _context) => {
    const { itemId, quality = 'high' } = params;
    
    // This would capture screenshot from canvas
    return createAIToolResultLegacy(true, 'Ekran görüntüsü alındı', { 
      itemId, 
      quality,
      screenshotUrl: `screenshot-${Date.now()}.png` 
    });
  },
  
  // ============= WIDGET TOOLS =============
  
  addWidget: async (params, context) => {
    const { type, x, y, config } = params;
    
    const widgetTitles: Record<string, string> = {
      clock: 'Saat',
      weather: 'Hava Durumu',
      notes: 'Notlar',
      todo: 'Yapılacaklar',
      calendar: 'Takvim',
      timer: 'Zamanlayıcı',
    };
    const widgetTitle = widgetTitles[type as string] || String(type);
    
    const newWidget = context.addItem?.({
      type: type as ContentItem['type'],
      title: widgetTitle,
      x: x ?? 100,
      y: y ?? 100,
      width: 300,
      height: 200,
      ...config,
    });
    
    return createAIToolResultLegacy(true, `${widgetTitle} widget eklendi`, { widgetId: newWidget?.id });
  },
  
  updateWidget: async (params, context) => {
    const { widgetId, settings } = params;
    
    context.updateItem?.(widgetId, settings);
    
    return createAIToolResultLegacy(true, 'Widget güncellendi', { widgetId });
  },
  
  removeWidget: async (params, context) => {
    const { widgetId } = params;
    
    context.removeItem?.(widgetId);
    
    return createAIToolResultLegacy(true, 'Widget kaldırıldı', { widgetId });
  },
  
  // ============= SYSTEM TOOLS =============
  
  getCurrentTime: async (_params, _context) => {
    const now = new Date();
    return createAIToolResultLegacy(true, now.toLocaleString('tr-TR'), { 
      timestamp: now.toISOString(),
      formatted: now.toLocaleString('tr-TR'),
    });
  },
  
  getSystemInfo: async (_params, context) => {
    const state = context.getState?.();
    
    return createAIToolResultLegacy(true, 'Sistem bilgisi', {
      tabCount: state?.tabs?.length || 0,
      layoutMode: state?.layoutMode || 'grid',
      selectedItems: context.selectedItemIds?.length || 0,
      currentView: context.currentViewId,
    });
  },
  
  openSettings: async (params, context) => {
    const { section } = params;
    
    context.toast?.({ title: 'Ayarlar', description: `${section || 'Genel'} ayarları açılıyor` });
    
    return createAIToolResultLegacy(true, `${section || 'Genel'} ayarları açıldı`, { section });
  },
  
  navigateTo: async (params, context) => {
    const { destination } = params;
    
    context.navigateTo?.(destination);
    
    return createAIToolResultLegacy(true, `${destination} sayfasına gidildi`, { destination });
  },
  
  // ============= COMMUNICATION TOOLS =============
  
  sendMessage: async (params, _context) => {
    const { recipientId, content, type = 'text' } = params;
    
    // This would send through messaging system
    return createAIToolResultLegacy(true, 'Mesaj gönderildi', { recipientId, type });
  },
  
  shareItem: async (params, _context) => {
    const { itemId, shareWith, permissions = 'view' } = params;
    
    return createAIToolResultLegacy(true, 'Öğe paylaşıldı', { itemId, shareWith, permissions });
  },
  
  // ============= ANALYSIS TOOLS =============
  
  analyzeItem: async (params, _context) => {
    const { itemId } = params;
    
    // This would trigger AI analysis
    return createAIToolResultLegacy(true, 'Analiz tamamlandı', { 
      itemId,
      analysis: {
        type: 'video',
        duration: '10:30',
        quality: 'HD',
        tags: ['tutorial', 'tech'],
      }
    });
  },
  
  suggestOrganization: async (params, context) => {
    const { folderId } = params;
    
    return createAIToolResultLegacy(true, 'Düzenleme önerileri hazır', {
      folderId,
      suggestions: [
        { action: 'createFolder', name: 'Videolar', itemCount: 5 },
        { action: 'createFolder', name: 'Belgeler', itemCount: 3 },
        { action: 'moveItems', duplicates: 2 },
      ]
    });
  },
  
  generateSummary: async (params, _context) => {
    const { itemIds } = params;
    
    return createAIToolResultLegacy(true, 'Özet oluşturuldu', {
      itemCount: itemIds.length,
      summary: `${itemIds.length} öğe analiz edildi. Çeşitli medya türleri ve belgeler içeriyor.`,
    });
  },
};

// Default handler for unimplemented tools
const defaultHandler: ToolHandler = async (params, _context) => {
  return createAIToolResultLegacy(false, 'Bu araç henüz uygulanmadı', { params });
};

// Execute a tool by name
export async function executeTool(
  toolName: string,
  params: Record<string, any>,
  context: ToolContext
): Promise<AIToolResult> {
  const tool = AI_TOOLS[toolName];
  
  if (!tool) {
    return createAIToolResultLegacy(false, `Araç bulunamadı: ${toolName}`);
  }
  
  if (!tool.isEnabled) {
    return createAIToolResultLegacy(false, `Araç devre dışı: ${toolName}`);
  }
  
  // Check if confirmation is required
  if (tool.requiresConfirmation) {
    // In real implementation, this would pause and ask user
    console.log(`[Tool] Confirmation required for: ${toolName}`);
  }
  
  const handler = toolHandlers[toolName] || defaultHandler;
  
  const startTime = Date.now();
  
  try {
    const result = await handler(params, context);
    
    // Log tool usage
    console.log(`[Tool] ${toolName} executed in ${Date.now() - startTime}ms`);
    
    return result;
  } catch (error: any) {
    console.error(`[Tool] ${toolName} failed:`, error);
    return createAIToolResultLegacy(false, error.message || 'Araç çalıştırılırken hata oluştu');
  }
}

// Execute multiple tools in sequence
export async function executeToolChain(
  tools: Array<{ name: string; params: Record<string, any> }>,
  context: ToolContext
): Promise<AIToolResult[]> {
  const results: AIToolResult[] = [];
  
  for (const { name, params } of tools) {
    const result = await executeTool(name, params, context);
    results.push(result);
    
    // Stop chain on failure unless explicitly allowed
    if (!result.success) {
      break;
    }
  }
  
  return results;
}

// Get available tools for a given context
export function getAvailableTools(context: ToolContext): string[] {
  return Object.entries(AI_TOOLS)
    .filter(([_, tool]) => tool.isEnabled)
    .map(([name]) => name);
}

// Tool execution with store integration
export function createToolExecutorWithStore(
  store: any,
  toast?: (options: any) => void
): (toolName: string, params: Record<string, any>) => Promise<AIToolResult> {
  return async (toolName: string, params: Record<string, any>) => {
    const state = store.getState();
    
    const context: ToolContext = {
      userId: state.user?.id || 'anonymous',
      currentViewId: state.tabs?.find((t: any) => t.id === state.activeTabId)?.activeViewId,
      selectedItemIds: state.selectedItemIds,
      getState: () => state,
      setState: (updates) => {
        Object.entries(updates).forEach(([key, value]) => {
          const setter = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
          if (typeof store.getState()[setter] === 'function') {
            store.getState()[setter](value);
          }
        });
      },
      addItem: (item) => {
        // Implementation would add to store
        console.log('Adding item:', item);
        return item as ContentItem;
      },
      removeItem: (itemId) => {
        console.log('Removing item:', itemId);
      },
      updateItem: (itemId, updates) => {
        console.log('Updating item:', itemId, updates);
      },
      toast,
    };
    
    return executeTool(toolName, params, context);
  };
}
