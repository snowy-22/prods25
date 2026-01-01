'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, Plus, X, Edit2 } from 'lucide-react';

interface BusinessAnalysis {
  id: string;
  title: string;
  purpose: string;
  goals: string[];
  budget: number;
  resources: string[];
  timeline: string;
  status: 'planning' | 'inprogress' | 'completed' | 'onhold';
  createdAt: string;
  lastUpdated: string;
}

interface BusinessAnalysisFormProps {
  item: any;
  onUpdate: (updates: any) => void;
}

export default function BusinessAnalysisForm({ item, onUpdate }: BusinessAnalysisFormProps) {
  const [analyses, setAnalyses] = useState<BusinessAnalysis[]>(
    item.metadata?.analyses || []
  );

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BusinessAnalysis>>({
    title: '',
    purpose: '',
    goals: [],
    budget: 0,
    resources: [],
    timeline: '',
    status: 'planning',
  });

  const [newGoal, setNewGoal] = useState('');
  const [newResource, setNewResource] = useState('');

  const handleSaveAnalysis = () => {
    if (!formData.title) return;

    const now = new Date().toISOString();

    if (editingId) {
      setAnalyses(
        analyses.map(a =>
          a.id === editingId
            ? { ...a, ...formData, lastUpdated: now }
            : a
        )
      );
      setEditingId(null);
    } else {
      const newAnalysis: BusinessAnalysis = {
        id: `analysis-${Date.now()}`,
        title: formData.title || '',
        purpose: formData.purpose || '',
        goals: formData.goals || [],
        budget: formData.budget || 0,
        resources: formData.resources || [],
        timeline: formData.timeline || '',
        status: formData.status || 'planning',
        createdAt: now,
        lastUpdated: now,
      };
      setAnalyses([...analyses, newAnalysis]);
    }

    resetForm();
  };

  const handleStartEdit = (analysis: BusinessAnalysis) => {
    setEditingId(analysis.id);
    setFormData(analysis);
    setIsAdding(true);
  };

  const handleDeleteAnalysis = (id: string) => {
    setAnalyses(analyses.filter(a => a.id !== id));
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setFormData({
        ...formData,
        goals: [...(formData.goals || []), newGoal],
      });
      setNewGoal('');
    }
  };

  const handleAddResource = () => {
    if (newResource.trim()) {
      setFormData({
        ...formData,
        resources: [...(formData.resources || []), newResource],
      });
      setNewResource('');
    }
  };

  const handleRemoveGoal = (index: number) => {
    setFormData({
      ...formData,
      goals: (formData.goals || []).filter((_, i) => i !== index),
    });
  };

  const handleRemoveResource = (index: number) => {
    setFormData({
      ...formData,
      resources: (formData.resources || []).filter((_, i) => i !== index),
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      purpose: '',
      goals: [],
      budget: 0,
      resources: [],
      timeline: '',
      status: 'planning',
    });
    setIsAdding(false);
    setNewGoal('');
    setNewResource('');
  };

  const handleSaveAll = () => {
    onUpdate({ metadata: { ...item.metadata, analyses } });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-yellow-100 text-yellow-800',
      inprogress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      onhold: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.planning;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: 'Planlama',
      inprogress: 'Devam Ediyor',
      completed: 'Tamamlandı',
      onhold: 'Beklemede',
    };
    return labels[status] || 'Bilinmiyor';
  };

  return (
    <div className="w-full h-full space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>İş Analizi Formu</CardTitle>
          <CardDescription>Proje ve iş analizi raporlarını yönetin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Analysis List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analyses.map(analysis => (
              <div
                key={analysis.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{analysis.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {analysis.purpose}
                    </p>
                  </div>
                  <Badge className={getStatusColor(analysis.status)}>
                    {getStatusLabel(analysis.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Hedefler:</span>
                    <p className="font-medium">{analysis.goals.length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kaynaklar:</span>
                    <p className="font-medium">{analysis.resources.length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bütçe:</span>
                    <p className="font-medium">₺{analysis.budget.toLocaleString('tr-TR')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Zaman:</span>
                    <p className="font-medium text-xs">{analysis.timeline}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartEdit(analysis)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Düzenle
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAnalysis(analysis.id)}
                  >
                    <X className="h-3 w-3 mr-1" /> Sil
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Form */}
          {isAdding ? (
            <Card className="bg-muted/20">
              <CardContent className="pt-6 space-y-3">
                <Input
                  placeholder="Analiz Başlığı"
                  value={formData.title || ''}
                  onChange={e =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />

                <Textarea
                  placeholder="Analiz Amacı"
                  value={formData.purpose || ''}
                  onChange={e =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  rows={2}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Hedefler</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Hedef ekle"
                      value={newGoal}
                      onChange={e => setNewGoal(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') handleAddGoal();
                      }}
                    />
                    <Button onClick={handleAddGoal} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.goals || []).map((goal, idx) => (
                      <Badge key={idx} variant="secondary">
                        {goal}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => handleRemoveGoal(idx)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Kaynaklar</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Kaynak ekle"
                      value={newResource}
                      onChange={e => setNewResource(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') handleAddResource();
                      }}
                    />
                    <Button onClick={handleAddResource} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.resources || []).map((resource, idx) => (
                      <Badge key={idx} variant="outline">
                        {resource}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => handleRemoveResource(idx)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Input
                  type="number"
                  placeholder="Bütçe (₺)"
                  value={formData.budget || ''}
                  onChange={e =>
                    setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })
                  }
                />

                <Input
                  placeholder="Zaman Çizelgesi (örn: 3 Ay)"
                  value={formData.timeline || ''}
                  onChange={e =>
                    setFormData({ ...formData, timeline: e.target.value })
                  }
                />

                <select
                  className="w-full border rounded px-2 py-2"
                  value={formData.status || 'planning'}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      status: e.target.value as any,
                    })
                  }
                >
                  <option value="planning">Planlama</option>
                  <option value="inprogress">Devam Ediyor</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="onhold">Beklemede</option>
                </select>

                <div className="flex gap-2">
                  <Button onClick={handleSaveAnalysis} className="flex-1">
                    <Check className="h-4 w-4 mr-2" /> Kaydet
                  </Button>
                  <Button onClick={resetForm} variant="outline" className="flex-1">
                    İptal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setIsAdding(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Yeni Analiz Ekle
            </Button>
          )}

          <Button onClick={handleSaveAll} className="w-full">
            Tümünü Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
