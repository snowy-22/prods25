/**
 * CanvasFlow MCP (Model Context Protocol) Server
 * AI araçlarını MCP protokolü üzerinden sunar
 */

import { MCPServer, MCPTransport, MCPTool, MCPToolResult } from '../types';
import { AI_TOOLS, validateToolParams, createToolResult } from '../tools';

// MCP Protocol Types
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

// MCP Error Codes
export const MCPErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Custom errors
  TOOL_NOT_FOUND: -32000,
  TOOL_EXECUTION_ERROR: -32001,
  AUTHENTICATION_ERROR: -32002,
};

// Server Info
export const MCP_SERVER_INFO = {
  name: 'canvasflow-mcp',
  version: '1.0.0',
  capabilities: {
    tools: true,
    resources: true,
    prompts: true,
    sampling: false,
  },
};

// Convert AI_TOOLS to MCP format
export function getAvailableMCPTools(): MCPTool[] {
  return Object.values(AI_TOOLS).map(tool => ({
    name: tool.id || tool.name,
    description: tool.description,
    inputSchema: {
      type: 'object',
      properties: tool.parameters.reduce((acc, param) => {
        acc[param.name] = {
          type: param.type,
          description: param.description,
          ...(param.enum ? { enum: param.enum } : {}),
        };
        return acc;
      }, {} as Record<string, any>),
      required: tool.parameters.filter(p => p.required).map(p => p.name),
    },
  }));
}

// Tool Executor (to be implemented by app)
export type ToolExecutorFn = (
  toolName: string, 
  params: Record<string, any>
) => Promise<any>;

// MCP Server Implementation
export class CanvasFlowMCPServer {
  private transport: MCPTransport;
  private toolExecutor: ToolExecutorFn;
  private isInitialized: boolean = false;
  
  constructor(transport: MCPTransport, toolExecutor: ToolExecutorFn) {
    this.transport = transport;
    this.toolExecutor = toolExecutor;
  }
  
  // Handle incoming requests
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
          
        case 'tools/list':
          return this.handleToolsList(request);
          
        case 'tools/call':
          return this.handleToolCall(request);
          
        case 'resources/list':
          return this.handleResourcesList(request);
          
        case 'prompts/list':
          return this.handlePromptsList(request);
          
        case 'ping':
          return this.createResponse(request.id, { pong: true });
          
        default:
          return this.createError(
            request.id,
            MCPErrorCodes.METHOD_NOT_FOUND,
            `Method not found: ${request.method}`
          );
      }
    } catch (error: any) {
      return this.createError(
        request.id,
        MCPErrorCodes.INTERNAL_ERROR,
        error.message
      );
    }
  }
  
  // Initialize handler
  private handleInitialize(request: MCPRequest): MCPResponse {
    this.isInitialized = true;
    
    return this.createResponse(request.id, {
      protocolVersion: '2024-11-05',
      serverInfo: MCP_SERVER_INFO,
      capabilities: MCP_SERVER_INFO.capabilities,
    });
  }
  
  // List available tools
  private handleToolsList(request: MCPRequest): MCPResponse {
    const tools = getAvailableMCPTools();
    
    return this.createResponse(request.id, {
      tools,
    });
  }
  
  // Execute a tool
  private async handleToolCall(request: MCPRequest): Promise<MCPResponse> {
    const { name, arguments: args } = request.params || {};
    
    if (!name) {
      return this.createError(
        request.id,
        MCPErrorCodes.INVALID_PARAMS,
        'Tool name is required'
      );
    }
    
    const tool = AI_TOOLS[name];
    if (!tool) {
      return this.createError(
        request.id,
        MCPErrorCodes.TOOL_NOT_FOUND,
        `Tool not found: ${name}`
      );
    }
    
    // Validate parameters
    const validation = validateToolParams(tool, args || {});
    if (!validation.valid) {
      return this.createError(
        request.id,
        MCPErrorCodes.INVALID_PARAMS,
        validation.errors.join(', ')
      );
    }
    
    try {
      // Execute tool
      const result = await this.toolExecutor(name, args || {});
      
      return this.createResponse(request.id, {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
          },
        ],
        isError: false,
      });
    } catch (error: any) {
      return this.createResponse(request.id, {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      });
    }
  }
  
  // List resources (canvas items, folders, etc.)
  private handleResourcesList(request: MCPRequest): MCPResponse {
    // Resources would be dynamically generated from canvas state
    return this.createResponse(request.id, {
      resources: [
        {
          uri: 'canvasflow://library',
          name: 'Library',
          description: 'User library containing all folders and items',
          mimeType: 'application/json',
        },
        {
          uri: 'canvasflow://current-view',
          name: 'Current View',
          description: 'Currently active canvas view',
          mimeType: 'application/json',
        },
        {
          uri: 'canvasflow://selected-items',
          name: 'Selected Items',
          description: 'Currently selected items on canvas',
          mimeType: 'application/json',
        },
      ],
    });
  }
  
  // List available prompts
  private handlePromptsList(request: MCPRequest): MCPResponse {
    return this.createResponse(request.id, {
      prompts: [
        {
          name: 'analyze-canvas',
          description: 'Analyze the current canvas layout and provide suggestions',
          arguments: [],
        },
        {
          name: 'organize-items',
          description: 'Suggest organization for items in a folder',
          arguments: [
            {
              name: 'folderId',
              description: 'ID of the folder to organize',
              required: true,
            },
          ],
        },
        {
          name: 'find-content',
          description: 'Find relevant content based on user query',
          arguments: [
            {
              name: 'query',
              description: 'Search query',
              required: true,
            },
          ],
        },
      ],
    });
  }
  
  // Helper: Create response
  private createResponse(id: string | number, result: any): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }
  
  // Helper: Create error response
  private createError(
    id: string | number, 
    code: number, 
    message: string, 
    data?: any
  ): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message, data },
    };
  }
  
  // Process incoming message (for HTTP transport)
  async processMessage(message: string): Promise<string> {
    try {
      const request = JSON.parse(message) as MCPRequest;
      const response = await this.handleRequest(request);
      return JSON.stringify(response);
    } catch (error) {
      return JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: MCPErrorCodes.PARSE_ERROR,
          message: 'Invalid JSON',
        },
      });
    }
  }
  
  // Get server info
  getServerInfo() {
    return MCP_SERVER_INFO;
  }
  
  // Check if initialized
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Factory function
export function createMCPServer(
  transport: MCPTransport,
  toolExecutor: ToolExecutorFn
): CanvasFlowMCPServer {
  return new CanvasFlowMCPServer(transport, toolExecutor);
}
