// src/components/widgets/mindmap-widget.tsx

'use client';
import { BrainCircuit, Plus, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
}

const MindmapNode = ({ node, onUpdate, size = 'medium' }: { node: NodeData, onUpdate: (id: string, newLabel: string) => void, size?: string }) => {
    return (
        <div
            className={cn(
                "absolute p-2 bg-secondary rounded-lg shadow-md border-2 border-primary transition-all",
                size === 'small' ? "p-1" : size === 'large' ? "p-4" : "p-2"
            )}
            style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}
        >
            <input 
                type="text"
                value={node.label}
                onChange={(e) => onUpdate(node.id, e.target.value)}
                className={cn(
                    "bg-transparent text-center outline-none",
                    size === 'small' ? "w-16 text-[10px]" : size === 'large' ? "w-40 text-lg" : "w-24 text-sm"
                )}
            />
        </div>
    );
};


export default function MindmapWidget({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
    const [nodes, setNodes] = useState<NodeData[]>([
        { id: '1', label: 'Ana Fikir', x: 200, y: 150 },
    ]);
    const [edges, setEdges] = useState<EdgeData[]>([]);
    const [zoom, setZoom] = useState(1);

    const addNode = (parentId: string) => {
        const parentNode = nodes.find(n => n.id === parentId);
        if (!parentNode) return;

        const newNodeId = (nodes.length + 1).toString();
        const newNode: NodeData = {
            id: newNodeId,
            label: 'Yeni Düğüm',
            x: parentNode.x + Math.random() * 200 - 100,
            y: parentNode.y + 100,
        };
        const newEdge: EdgeData = {
            id: `${parentId}-${newNodeId}`,
            source: parentId,
            target: newNodeId,
        };
        setNodes([...nodes, newNode]);
        setEdges([...edges, newEdge]);
    };
    
    const updateNode = (id: string, newLabel: string) => {
        setNodes(nodes.map(n => n.id === id ? {...n, label: newLabel} : n));
    }
    

  return (
    <div className="relative h-full w-full bg-muted overflow-hidden group">
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setZoom(z => Math.min(z + 0.1, 2))}>
                <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>
                <ZoomOut className="h-4 w-4" />
            </Button>
        </div>

        <div 
            className="w-full h-full transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
            {edges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if(!sourceNode || !targetNode) return null;
                return (
                     <svg key={edge.id} className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <line x1={sourceNode.x} y1={sourceNode.y} x2={targetNode.x} y2={targetNode.y} stroke="hsl(var(--primary))" strokeWidth={size === 'small' ? "1" : "2"} />
                    </svg>
                )
            })}
            {nodes.map(node => (
                <div key={node.id} onDoubleClick={() => addNode(node.id)}>
                    <MindmapNode node={node} onUpdate={updateNode} size={size} />
                </div>
            ))}
        </div>

        {size === 'large' && (
            <div className="absolute bottom-4 left-4 p-4 bg-background/80 backdrop-blur rounded-lg border shadow-lg max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Zihin Haritası İpucu</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                    Yeni bir düğüm eklemek için mevcut bir düğüme çift tıklayın. Düğümleri sürükleyerek düzenleyebilirsiniz (yakında).
                </p>
            </div>
        )}
    </div>
  );
}
