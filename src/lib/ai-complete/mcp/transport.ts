/**
 * MCP HTTP Transport
 * HTTP/SSE üzerinden MCP protokolü transportu
 */

import { MCPTransport } from '../types';
import { MCPRequest, MCPResponse, CanvasFlowMCPServer } from './server';

// HTTP Transport için request handler
export interface MCPHTTPHandler {
  handleRequest: (request: MCPRequest) => Promise<MCPResponse>;
  handleSSE: (callback: (event: string, data: any) => void) => () => void;
}

// SSE Connection Manager
export class SSEConnectionManager {
  private connections: Map<string, {
    callback: (event: string, data: any) => void;
    lastPing: number;
  }> = new Map();
  
  private pingInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startPingLoop();
  }
  
  addConnection(id: string, callback: (event: string, data: any) => void) {
    this.connections.set(id, {
      callback,
      lastPing: Date.now(),
    });
  }
  
  removeConnection(id: string) {
    this.connections.delete(id);
  }
  
  broadcast(event: string, data: any) {
    this.connections.forEach((conn, id) => {
      try {
        conn.callback(event, data);
      } catch (error) {
        console.error(`SSE broadcast error for ${id}:`, error);
        this.removeConnection(id);
      }
    });
  }
  
  sendTo(connectionId: string, event: string, data: any) {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.callback(event, data);
    }
  }
  
  private startPingLoop() {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      this.connections.forEach((conn, id) => {
        try {
          conn.callback('ping', { timestamp: now });
          conn.lastPing = now;
        } catch (error) {
          this.removeConnection(id);
        }
      });
    }, 30000); // Ping every 30 seconds
  }
  
  destroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.connections.clear();
  }
  
  getConnectionCount(): number {
    return this.connections.size;
  }
}

// Create HTTP transport config
export function createHTTPTransportConfig(baseUrl: string): MCPTransport {
  return {
    type: 'http',
    url: `${baseUrl}/api/mcp`,
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

// Client for connecting to MCP server
export class MCPHTTPClient {
  private baseUrl: string;
  private sseConnection: EventSource | null = null;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  // Send request to MCP server
  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    const response = await fetch(`${this.baseUrl}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Initialize connection
  async initialize(): Promise<MCPResponse> {
    return this.sendRequest({
      jsonrpc: '2.0',
      id: 'init-1',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        clientInfo: {
          name: 'canvasflow-client',
          version: '1.0.0',
        },
      },
    });
  }
  
  // List tools
  async listTools(): Promise<any[]> {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: 'tools-list-1',
      method: 'tools/list',
    });
    
    return response.result?.tools || [];
  }
  
  // Call a tool
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: `tool-call-${Date.now()}`,
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    });
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.result;
  }
  
  // Connect to SSE for real-time updates
  connectSSE(): void {
    if (typeof EventSource === 'undefined') {
      console.warn('SSE not supported in this environment');
      return;
    }
    
    this.sseConnection = new EventSource(`${this.baseUrl}/api/mcp/events`);
    
    this.sseConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handlers = this.eventHandlers.get(data.type) || new Set();
        handlers.forEach(handler => handler(data.payload));
      } catch (error) {
        console.error('SSE message parse error:', error);
      }
    };
    
    this.sseConnection.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Reconnect after 5 seconds
      setTimeout(() => this.connectSSE(), 5000);
    };
  }
  
  // Subscribe to events
  on(event: string, handler: (data: any) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }
  
  // Disconnect
  disconnect() {
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
    }
    this.eventHandlers.clear();
  }
}

// Global SSE manager instance
let sseManager: SSEConnectionManager | null = null;

export function getSSEManager(): SSEConnectionManager {
  if (!sseManager) {
    sseManager = new SSEConnectionManager();
  }
  return sseManager;
}
