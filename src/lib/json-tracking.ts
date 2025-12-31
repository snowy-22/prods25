/**
 * JSON-Based Tracking System
 * 
 * Her modül, iframe, export ve işlem JSON formatında takip edilir.
 * Analiz, audit trail ve process automation için gerekli veri sağlar.
 */

import { ContentItem } from './initial-content';

export interface ModuleMetadata {
  id: string;
  moduleId: string;
  type: 'player' | 'folder' | 'widget' | 'iframe' | 'export';
  title: string;
  description?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
  status: 'active' | 'archived' | 'draft' | 'published';
  tags: string[];
  metadata: Record<string, any>;
}

export interface ProcessFlowStep {
  stepId: string;
  name: string;
  type: 'action' | 'decision' | 'subprocess' | 'connection';
  inputModules: string[];
  outputModules: string[];
  position: { x: number; y: number };
  properties: Record<string, any>;
  connections: ProcessFlowConnection[];
}

export interface ProcessFlowConnection {
  id: string;
  fromStepId: string;
  toStepId: string;
  condition?: string;
  label?: string;
  properties: Record<string, any>;
}

export interface ProcessFlowDefinition {
  id: string;
  name: string;
  description?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  steps: ProcessFlowStep[];
  connections: ProcessFlowConnection[];
  triggerConditions: string[];
  metadata: Record<string, any>;
}

export interface ModuleAnalysis {
  moduleId: string;
  moduleName: string;
  analysisDate: string;
  metrics: {
    usageCount: number;
    lastUsedDate: string;
    dependencies: {
      inputModules: Array<{ moduleId: string; moduleName: string }>;
      outputModules: Array<{ moduleId: string; moduleName: string }>;
    };
    performanceMetrics: {
      averageLoadTime: number;
      averageExecutionTime: number;
      errorRate: number;
    };
    dataFlow: {
      inputDataTypes: string[];
      outputDataTypes: string[];
      dataTransformations: string[];
    };
  };
  quality: {
    documentation: number; // 0-100
    testCoverage: number; // 0-100
    maintainability: number; // 0-100
  };
}

export interface WorkflowDiagram {
  id: string;
  name: string;
  description?: string;
  version: number;
  type: 'customer-journey' | 'process-flow' | 'data-flow' | 'system-architecture';
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    position: { x: number; y: number };
    properties: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    properties: Record<string, any>;
  }>;
  metadata: Record<string, any>;
}

export interface DataMatrix {
  id: string;
  name: string;
  description?: string;
  version: number;
  rows: Array<{
    id: string;
    label: string;
    metadata: Record<string, any>;
  }>;
  columns: Array<{
    id: string;
    label: string;
    type: string;
    metadata: Record<string, any>;
  }>;
  cells: Array<{
    rowId: string;
    columnId: string;
    value: any;
    properties: Record<string, any>;
  }>;
}

// Track Module Usage
export class ModuleTracker {
  private modules: Map<string, ModuleMetadata> = new Map();
  private usageLog: Array<{ moduleId: string; timestamp: string; action: string }> = [];

  registerModule(item: ContentItem, type: ModuleMetadata['type']): ModuleMetadata {
    const metadata: ModuleMetadata = {
      id: item.id,
      moduleId: item.id,
      type,
      title: item.title || 'Untitled',
      description: item.description,
      version: 1,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      status: 'active',
      tags: item.tags || [],
      metadata: {
        customData: item.metadata || {},
        dimensions: { width: item.width, height: item.height },
        position: { x: item.x, y: item.y }
      }
    };

    this.modules.set(item.id, metadata);
    this.logUsage(item.id, 'registered');
    return metadata;
  }

  updateModule(itemId: string, updates: Partial<ModuleMetadata>): ModuleMetadata {
    const existing = this.modules.get(itemId);
    if (!existing) throw new Error(`Module ${itemId} not found`);

    const updated = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      updatedAt: new Date().toISOString()
    };

    this.modules.set(itemId, updated);
    this.logUsage(itemId, 'updated');
    return updated;
  }

  logUsage(moduleId: string, action: string): void {
    this.usageLog.push({
      moduleId,
      timestamp: new Date().toISOString(),
      action
    });
  }

  getModuleAnalysis(moduleId: string): ModuleAnalysis {
    const module = this.modules.get(moduleId);
    if (!module) throw new Error(`Module ${moduleId} not found`);

    const usage = this.usageLog.filter(log => log.moduleId === moduleId);
    const lastUsed = usage.length > 0 ? usage[usage.length - 1].timestamp : module.createdAt;

    return {
      moduleId,
      moduleName: module.title,
      analysisDate: new Date().toISOString(),
      metrics: {
        usageCount: usage.length,
        lastUsedDate: lastUsed,
        dependencies: {
          inputModules: [],
          outputModules: []
        },
        performanceMetrics: {
          averageLoadTime: 0,
          averageExecutionTime: 0,
          errorRate: 0
        },
        dataFlow: {
          inputDataTypes: [],
          outputDataTypes: [],
          dataTransformations: []
        }
      },
      quality: {
        documentation: 50,
        testCoverage: 0,
        maintainability: 75
      }
    };
  }

  exportAsJSON(): string {
    return JSON.stringify({
      modules: Array.from(this.modules.values()),
      usageLog: this.usageLog,
      exportDate: new Date().toISOString()
    }, null, 2);
  }
}

// Process Flow Builder
export class ProcessFlowBuilder {
  private definition: ProcessFlowDefinition;

  constructor(id: string, name: string) {
    this.definition = {
      id,
      name,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [],
      connections: [],
      triggerConditions: [],
      metadata: {}
    };
  }

  addStep(step: Omit<ProcessFlowStep, 'connections'>): ProcessFlowStep {
    const newStep: ProcessFlowStep = {
      ...step,
      connections: []
    };
    this.definition.steps.push(newStep);
    return newStep;
  }

  addConnection(from: string, to: string, condition?: string): ProcessFlowConnection {
    const connection: ProcessFlowConnection = {
      id: `conn-${Date.now()}`,
      fromStepId: from,
      toStepId: to,
      condition,
      properties: {}
    };
    this.definition.connections.push(connection);

    // Update step connections
    const fromStep = this.definition.steps.find(s => s.stepId === from);
    if (fromStep) {
      fromStep.connections.push(connection);
    }

    return connection;
  }

  getDefinition(): ProcessFlowDefinition {
    return this.definition;
  }

  exportAsJSON(): string {
    return JSON.stringify(this.definition, null, 2);
  }

  exportAsHTML(): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${this.definition.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .process-flow { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    .step { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #0066cc; border-radius: 4px; }
    .connection { color: #666; margin: 5px 0 5px 20px; font-size: 0.9em; }
    h1 { color: #333; }
    .metadata { color: #999; font-size: 0.85em; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>${this.definition.name}</h1>
  <p>${this.definition.description || 'No description'}</p>
  <div class="process-flow">
    ${this.definition.steps.map((step, idx) => `
      <div class="step">
        <strong>${idx + 1}. ${step.name}</strong>
        <p>${step.type}</p>
        ${step.connections.length > 0 ? `
          <div class="connection">
            ↓ Sonraki Adımlar:
            ${step.connections.map(c => `<div>→ ${this.definition.steps.find(s => s.stepId === c.toStepId)?.name || 'Unknown'}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>
  <div class="metadata">
    <p>Created: ${new Date(this.definition.createdAt).toLocaleString()}</p>
    <p>Version: ${this.definition.version}</p>
  </div>
</body>
</html>
    `;
    return html;
  }
}

// Workflow Diagram Generator
export function createWorkflowDiagram(
  type: WorkflowDiagram['type'],
  items: ContentItem[]
): WorkflowDiagram {
  const diagram: WorkflowDiagram = {
    id: `diagram-${Date.now()}`,
    name: `${type} Diagram`,
    version: 1,
    type,
    nodes: items.map((item, idx) => ({
      id: item.id,
      label: item.title || `Item ${idx + 1}`,
      type: item.type,
      position: { x: item.x || 0, y: item.y || 0 },
      properties: {
        title: item.title,
        description: item.description,
        icon: item.icon
      }
    })),
    edges: [],
    metadata: {
      createdAt: new Date().toISOString(),
      itemCount: items.length
    }
  };

  return diagram;
}

// Data Matrix Creator
export function createDataMatrix(
  name: string,
  rowLabels: string[],
  columnLabels: string[]
): DataMatrix {
  return {
    id: `matrix-${Date.now()}`,
    name,
    version: 1,
    rows: rowLabels.map((label, idx) => ({
      id: `row-${idx}`,
      label,
      metadata: {}
    })),
    columns: columnLabels.map((label, idx) => ({
      id: `col-${idx}`,
      label,
      type: 'text',
      metadata: {}
    })),
    cells: []
  };
}
