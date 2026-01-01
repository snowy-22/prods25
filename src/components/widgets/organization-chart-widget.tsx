'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Edit2, Save } from 'lucide-react';

interface OrgNode {
  id: string;
  title: string;
  position: string;
  color: string;
  children: string[];
}

interface OrganizationChartProps {
  item: any;
  onUpdate: (updates: any) => void;
}

export default function OrganizationChart({ item, onUpdate }: OrganizationChartProps) {
  const [nodes, setNodes] = useState<OrgNode[]>(
    item.metadata?.nodes || [
      {
        id: 'ceo',
        title: 'CEO',
        position: 'Yönetici',
        color: '#FF6B6B',
        children: ['dev', 'sales'],
      },
      {
        id: 'dev',
        title: 'Geliştirme Müdürü',
        position: 'Teknik Lider',
        color: '#4ECDC4',
        children: [],
      },
      {
        id: 'sales',
        title: 'Satış Müdürü',
        position: 'Pazarlama',
        color: '#45B7D1',
        children: [],
      },
    ]
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<OrgNode>>({});

  const handleAddNode = () => {
    const newId = `node-${Date.now()}`;
    const newNode: OrgNode = {
      id: newId,
      title: 'Yeni Pozisyon',
      position: 'Açıklama',
      color: '#95E1D3',
      children: [],
    };
    setNodes([...nodes, newNode]);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    // Remove this node from parent's children
    setNodes(prev =>
      prev.map(n => ({
        ...n,
        children: n.children.filter(childId => childId !== id),
      }))
    );
  };

  const handleStartEdit = (node: OrgNode) => {
    setEditingId(node.id);
    setEditData(node);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      setNodes(nodes.map(n => (n.id === editingId ? { ...n, ...editData } : n)));
      setEditingId(null);
    }
  };

  const handleSaveChart = () => {
    onUpdate({ metadata: { ...item.metadata, nodes } });
  };

  return (
    <div className="w-full h-full space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Organizasyon Şeması</CardTitle>
          <CardDescription>Şirketi/Kuruluşu hiyerarşik yapıda gösterilir</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Organization Chart Visualization */}
          <div className="border rounded-lg p-6 bg-muted/20 min-h-96 overflow-auto">
            <div className="flex justify-center items-start gap-8 flex-wrap">
              {nodes.map(node => (
                <div key={node.id} className="text-center">
                  <div
                    className="rounded-lg p-4 shadow-md text-white min-w-40 cursor-pointer hover:shadow-lg transition-shadow"
                    style={{ backgroundColor: node.color }}
                  >
                    <p className="font-bold">{node.title}</p>
                    <p className="text-xs opacity-90">{node.position}</p>
                  </div>
                  {node.children.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {node.children.length} kişi
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Node Management */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Pozisyonlar</h3>
              <Button onClick={handleAddNode} size="sm">
                <Plus className="h-4 w-4 mr-2" /> Ekle
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {nodes.map(node => (
                <div key={node.id}>
                  {editingId === node.id ? (
                    <div className="border rounded-lg p-3 space-y-2">
                      <Input
                        placeholder="Pozisyon Adı"
                        value={editData.title || ''}
                        onChange={e =>
                          setEditData({ ...editData, title: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Pozisyon Açıklaması"
                        value={editData.position || ''}
                        onChange={e =>
                          setEditData({ ...editData, position: e.target.value })
                        }
                      />
                      <div className="flex gap-2 items-center">
                        <label>Renk:</label>
                        <input
                          type="color"
                          value={editData.color || '#000000'}
                          onChange={e =>
                            setEditData({ ...editData, color: e.target.value })
                          }
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                      </div>
                      <Button
                        onClick={handleSaveEdit}
                        size="sm"
                        className="w-full"
                      >
                        <Save className="h-4 w-4 mr-2" /> Kaydet
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-3 flex items-center justify-between hover:bg-muted/50">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: node.color }}
                      />
                      <div className="flex-1 ml-3">
                        <p className="font-medium text-sm">{node.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {node.position}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(node)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNode(node.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSaveChart} className="w-full">
            Şemayı Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
