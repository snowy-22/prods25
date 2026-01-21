/**
 * MCP (Model Context Protocol) Module
 * 
 * Provides MCP server implementation for CanvasFlow
 * - JSON-RPC 2.0 compliant
 * - HTTP and SSE transport
 * - Full tools/resources/prompts support
 */

// Re-export types from main types file
export type { MCPTool, MCPResource, MCPPrompt, MCPServer } from '../types';

export {
  // Server
  CanvasFlowMCPServer,
  createMCPServer,
  getAvailableMCPTools,
  MCP_SERVER_INFO,
  type MCPRequest,
  type MCPResponse,
} from './server';

export {
  // Transport
  SSEConnectionManager,
  MCPHTTPClient,
} from './transport';

// MCP Event Types
export interface MCPEvents {
  // Tool lifecycle
  'tool:start': { toolName: string; params: Record<string, any> };
  'tool:complete': { toolName: string; result: any; durationMs: number };
  'tool:error': { toolName: string; error: string };
  
  // Resource changes
  'resource:updated': { uri: string; mimeType?: string };
  'resource:created': { uri: string; mimeType?: string };
  'resource:deleted': { uri: string };
  
  // Connection events
  'connection:established': { clientId: string };
  'connection:closed': { clientId: string; reason?: string };
  
  // Server events
  'server:ready': { capabilities: string[] };
  'server:error': { code: number; message: string };
}

// MCP Configuration
export interface MCPConfig {
  // Server settings
  serverName: string;
  serverVersion: string;
  
  // Capabilities
  enableTools: boolean;
  enableResources: boolean;
  enablePrompts: boolean;
  
  // Transport
  transport: 'http' | 'sse' | 'stdio';
  
  // Authentication
  requireAuth: boolean;
  apiKeyHeader?: string;
  
  // Limits
  maxToolExecutionTime: number;
  maxResourceSize: number;
}

export const DEFAULT_MCP_CONFIG: MCPConfig = {
  serverName: 'CanvasFlow MCP Server',
  serverVersion: '1.0.0',
  enableTools: true,
  enableResources: true,
  enablePrompts: true,
  transport: 'http',
  requireAuth: false,
  maxToolExecutionTime: 30000,
  maxResourceSize: 10 * 1024 * 1024, // 10MB
};

// Quick setup helper
export function setupMCPClient(baseUrl: string = '/api/mcp') {
  // Import dynamically to avoid circular dependency
  const { MCPHTTPClient: Client } = require('./transport');
  return new Client(baseUrl);
}
