/**
 * AI Function Calling Tools
 * Canvas, arama, medya ve sistem araçları
 */

import { AITool, AIToolResult, ToolCategory } from './types';

// Tool Registry
export const AI_TOOLS: Record<string, AITool> = {
  // === Canvas Tools ===
  addPlayerToCanvas: {
    id: 'addPlayerToCanvas',
    name: 'Add Player to Canvas',
    description: 'Add a video, audio, or iframe player to the current canvas',
    category: 'canvas',
    parameters: [
      { name: 'url', type: 'string', description: 'Video/audio/website URL', required: true },
      { name: 'title', type: 'string', description: 'Player title', required: false },
      { name: 'type', type: 'string', description: 'Player type: video, audio, iframe', required: false },
      { name: 'position', type: 'object', description: 'Position {x, y}', required: false },
      { name: 'size', type: 'object', description: 'Size {width, height}', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  createFolder: {
    id: 'createFolder',
    name: 'Create Folder',
    description: 'Create a new folder on the canvas or in the library',
    category: 'canvas',
    parameters: [
      { name: 'name', type: 'string', description: 'Folder name', required: true },
      { name: 'parentId', type: 'string', description: 'Parent folder ID', required: false },
      { name: 'icon', type: 'string', description: 'Folder icon', required: false },
      { name: 'color', type: 'string', description: 'Folder color', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  moveItem: {
    id: 'moveItem',
    name: 'Move Item',
    description: 'Move an item to a new position or folder',
    category: 'canvas',
    parameters: [
      { name: 'itemId', type: 'string', description: 'Item ID to move', required: true },
      { name: 'targetFolderId', type: 'string', description: 'Target folder ID', required: false },
      { name: 'position', type: 'object', description: 'New position {x, y}', required: false },
    ],
    requiresConfirmation: true,
    isEnabled: true,
  },
  
  deleteItem: {
    id: 'deleteItem',
    name: 'Delete Item',
    description: 'Delete an item from the canvas (moves to trash)',
    category: 'canvas',
    parameters: [
      { name: 'itemId', type: 'string', description: 'Item ID to delete', required: true },
      { name: 'permanent', type: 'boolean', description: 'Permanently delete', required: false },
    ],
    requiresConfirmation: true,
    isEnabled: true,
  },
  
  updateItemStyle: {
    id: 'updateItemStyle',
    name: 'Update Item Style',
    description: 'Update the visual style of an item (frame, colors, effects)',
    category: 'canvas',
    parameters: [
      { name: 'itemId', type: 'string', description: 'Item ID', required: true },
      { name: 'frameStyle', type: 'string', description: 'Frame style', required: false },
      { name: 'frameColor', type: 'string', description: 'Frame color', required: false },
      { name: 'frameWidth', type: 'number', description: 'Frame width', required: false },
      { name: 'borderRadius', type: 'number', description: 'Border radius', required: false },
      { name: 'opacity', type: 'number', description: 'Opacity 0-1', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  // === Search Tools ===
  searchYouTube: {
    id: 'searchYouTube',
    name: 'Search YouTube',
    description: 'Search for videos on YouTube',
    category: 'search',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true },
      { name: 'maxResults', type: 'number', description: 'Max results (1-50)', required: false },
      { name: 'type', type: 'string', description: 'Type: video, channel, playlist', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  searchWeb: {
    id: 'searchWeb',
    name: 'Search Web',
    description: 'Search the web for information',
    category: 'search',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true },
      { name: 'type', type: 'string', description: 'Type: web, images, news', required: false },
      { name: 'maxResults', type: 'number', description: 'Max results', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  searchWorkspace: {
    id: 'searchWorkspace',
    name: 'Search Workspace',
    description: 'Search for items in the current workspace',
    category: 'search',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true },
      { name: 'type', type: 'string', description: 'Item type filter', required: false },
      { name: 'folderId', type: 'string', description: 'Folder to search in', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  // === Media Tools ===
  playMedia: {
    id: 'playMedia',
    name: 'Play Media',
    description: 'Play a video or audio item',
    category: 'media',
    parameters: [
      { name: 'itemId', type: 'string', description: 'Media item ID', required: true },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  pauseMedia: {
    id: 'pauseMedia',
    name: 'Pause Media',
    description: 'Pause a playing video or audio',
    category: 'media',
    parameters: [
      { name: 'itemId', type: 'string', description: 'Media item ID', required: true },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  setVolume: {
    id: 'setVolume',
    name: 'Set Volume',
    description: 'Set the volume of a media item',
    category: 'media',
    parameters: [
      { name: 'itemId', type: 'string', description: 'Media item ID', required: true },
      { name: 'volume', type: 'number', description: 'Volume 0-100', required: true },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  captureScreenshot: {
    id: 'captureScreenshot',
    name: 'Capture Screenshot',
    description: 'Capture a screenshot of a player or the canvas',
    category: 'media',
    parameters: [
      { name: 'itemId', type: 'string', description: 'Item ID (optional, captures canvas if not provided)', required: false },
      { name: 'format', type: 'string', description: 'Format: png, jpeg', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  // === Widget Tools ===
  addWidget: {
    id: 'addWidget',
    name: 'Add Widget',
    description: 'Add a widget to the canvas (clock, notes, timer, etc.)',
    category: 'widget',
    parameters: [
      { name: 'type', type: 'string', description: 'Widget type: clock, notes, timer, calendar, weather', required: true },
      { name: 'title', type: 'string', description: 'Widget title', required: false },
      { name: 'position', type: 'object', description: 'Position {x, y}', required: false },
      { name: 'config', type: 'object', description: 'Widget-specific configuration', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  updateWidget: {
    id: 'updateWidget',
    name: 'Update Widget',
    description: 'Update widget settings',
    category: 'widget',
    parameters: [
      { name: 'widgetId', type: 'string', description: 'Widget ID', required: true },
      { name: 'config', type: 'object', description: 'New configuration', required: true },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  // === System Tools ===
  setLayoutMode: {
    id: 'setLayoutMode',
    name: 'Set Layout Mode',
    description: 'Switch between grid and canvas layout modes',
    category: 'system',
    parameters: [
      { name: 'mode', type: 'string', description: 'Mode: grid or canvas', required: true },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  openTab: {
    id: 'openTab',
    name: 'Open Tab',
    description: 'Open a folder or item in a new tab',
    category: 'system',
    parameters: [
      { name: 'itemId', type: 'string', description: 'Item ID to open', required: true },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  closeTab: {
    id: 'closeTab',
    name: 'Close Tab',
    description: 'Close a tab',
    category: 'system',
    parameters: [
      { name: 'tabId', type: 'string', description: 'Tab ID to close', required: true },
    ],
    requiresConfirmation: true,
    isEnabled: true,
  },
  
  toggleSidebar: {
    id: 'toggleSidebar',
    name: 'Toggle Sidebar',
    description: 'Open or close a sidebar panel',
    category: 'system',
    parameters: [
      { name: 'panel', type: 'string', description: 'Panel: library, social, messages, ai-chat', required: true },
      { name: 'open', type: 'boolean', description: 'Open or close', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  // === Communication Tools ===
  sendMessage: {
    id: 'sendMessage',
    name: 'Send Message',
    description: 'Send a message to a conversation',
    category: 'communication',
    parameters: [
      { name: 'conversationId', type: 'string', description: 'Conversation ID', required: true },
      { name: 'content', type: 'string', description: 'Message content', required: true },
    ],
    requiresConfirmation: true,
    isEnabled: true,
  },
  
  createNote: {
    id: 'createNote',
    name: 'Create Note',
    description: 'Create a quick note',
    category: 'communication',
    parameters: [
      { name: 'content', type: 'string', description: 'Note content', required: true },
      { name: 'title', type: 'string', description: 'Note title', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  // === Analysis Tools ===
  analyzeItem: {
    id: 'analyzeItem',
    name: 'Analyze Item',
    description: 'Analyze a canvas item and provide insights',
    category: 'analysis',
    parameters: [
      { name: 'itemId', type: 'string', description: 'Item ID to analyze', required: true },
      { name: 'analysisType', type: 'string', description: 'Type: content, metadata, usage', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
  
  summarizeContent: {
    id: 'summarizeContent',
    name: 'Summarize Content',
    description: 'Summarize the content of a page or document',
    category: 'analysis',
    parameters: [
      { name: 'url', type: 'string', description: 'URL to summarize', required: false },
      { name: 'content', type: 'string', description: 'Text content to summarize', required: false },
      { name: 'maxLength', type: 'number', description: 'Max summary length in words', required: false },
    ],
    requiresConfirmation: false,
    isEnabled: true,
  },
};

// Tool Executor Interface
export interface ToolExecutor {
  execute(toolId: string, params: Record<string, any>): Promise<AIToolResult>;
}

// Tool Result Builder
export function createToolResult(
  toolId: string,
  success: boolean,
  message?: string,
  data?: any,
  error?: string
): AIToolResult {
  return {
    id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    toolId,
    toolName: toolId,
    success,
    result: message ? { message, ...data } : data,
    error,
    duration: 0, // Will be set by executor
    timestamp: new Date().toISOString(),
  };
}

// Legacy helper for backward compatibility - accepts (success, message, data) signature
export function createToolResultLegacy(
  success: boolean,
  message: string,
  data?: Record<string, any>
): AIToolResult {
  return createToolResult('unknown', success, message, data, success ? undefined : message);
}

// Get tools by category
export function getToolsByCategory(category: ToolCategory): AITool[] {
  return Object.values(AI_TOOLS).filter(tool => tool.category === category);
}

// Get enabled tools
export function getEnabledTools(): AITool[] {
  return Object.values(AI_TOOLS).filter(tool => tool.isEnabled);
}

// Get tools requiring confirmation
export function getToolsRequiringConfirmation(): AITool[] {
  return Object.values(AI_TOOLS).filter(tool => tool.requiresConfirmation);
}

// Convert to OpenAI function schema
export function toolToOpenAIFunction(tool: AITool): object {
  const properties: Record<string, any> = {};
  const required: string[] = [];
  
  tool.parameters.forEach(param => {
    properties[param.name] = {
      type: param.type,
      description: param.description,
    };
    if (param.enum) {
      properties[param.name].enum = param.enum;
    }
    if (param.required) {
      required.push(param.name);
    }
  });
  
  return {
    type: 'function',
    function: {
      name: tool.id,
      description: tool.description,
      parameters: {
        type: 'object',
        properties,
        required,
      },
    },
  };
}

// Convert all tools to OpenAI format
export function getAllToolsAsOpenAIFunctions(): object[] {
  return getEnabledTools().map(toolToOpenAIFunction);
}

// Tool validation
export function validateToolParams(
  tool: AITool, 
  params: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  tool.parameters.forEach(param => {
    if (param.required && !(param.name in params)) {
      errors.push(`Missing required parameter: ${param.name}`);
    }
    
    if (param.name in params) {
      const value = params[param.name];
      
      // Type checking
      if (param.type === 'string' && typeof value !== 'string') {
        errors.push(`Parameter ${param.name} must be a string`);
      }
      if (param.type === 'number' && typeof value !== 'number') {
        errors.push(`Parameter ${param.name} must be a number`);
      }
      if (param.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Parameter ${param.name} must be a boolean`);
      }
      if (param.type === 'array' && !Array.isArray(value)) {
        errors.push(`Parameter ${param.name} must be an array`);
      }
      if (param.type === 'object' && (typeof value !== 'object' || value === null)) {
        errors.push(`Parameter ${param.name} must be an object`);
      }
      
      // Enum validation
      if (param.enum && !param.enum.includes(value)) {
        errors.push(`Parameter ${param.name} must be one of: ${param.enum.join(', ')}`);
      }
    }
  });
  
  return { valid: errors.length === 0, errors };
}
