'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Copy,
  Check,
  Star,
  Eye,
  Download,
  ChevronRight,
  Clock,
  Zap,
  Users,
  Layers,
  FileText,
} from 'lucide-react';
import { Timeline, Scene, Action, ActionType } from '@/lib/recording-studio-types';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'presentation' | 'tutorial' | 'demo' | 'promotional' | 'documentary';
  duration: number; // in milliseconds
  sceneCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: React.ReactNode;
  timeline: Timeline;
  tips?: string[];
  useCases?: string[];
}

const TEMPLATES: Template[] = [
  {
    id: 'quick-intro',
    name: 'Hızlı Tanıtım',
    description: 'Ürün veya özelliği hızlıca tanıtan kısa video',
    category: 'promotional',
    duration: 5000,
    sceneCount: 3,
    difficulty: 'easy',
    icon: <Zap className="h-5 w-5" />,
    timeline: {
      id: 'quick-intro',
      name: 'Hızlı Tanıtım',
      duration: 5000,
      scenes: [
        {
          id: 'scene-1',
          name: 'Başlık',
          duration: 1500,
          actions: [
            {
              id: 'action-1-1',
              type: 'animation' as ActionType,
              startTime: 0,
              duration: 1500,
              easing: 'ease-out-cubic',
              properties: { animationType: 'fade-in' },
            },
          ],
        },
        {
          id: 'scene-2',
          name: 'İçerik',
          duration: 2500,
          actions: [
            {
              id: 'action-2-1',
              type: 'scroll' as ActionType,
              startTime: 500,
              duration: 2000,
              easing: 'ease-in-out',
              properties: { targetPosition: { x: 0, y: 300 } },
            },
            {
              id: 'action-2-2',
              type: 'zoom' as ActionType,
              startTime: 0,
              duration: 1500,
              easing: 'ease-out',
              properties: { fromZoom: 1.2, toZoom: 1 },
            },
          ],
        },
        {
          id: 'scene-3',
          name: 'Kapanış',
          duration: 1000,
          actions: [
            {
              id: 'action-3-1',
              type: 'animation' as ActionType,
              startTime: 0,
              duration: 1000,
              easing: 'ease-in',
              properties: { animationType: 'fade-out' },
            },
          ],
        },
      ],
      transitions: [
        { id: 'trans-1', fromSceneId: 'scene-1', toSceneId: 'scene-2', type: 'fade', duration: 300, easing: 'ease-in-out' },
        { id: 'trans-2', fromSceneId: 'scene-2', toSceneId: 'scene-3', type: 'fade', duration: 300, easing: 'ease-in-out' },
      ],
    },
    tips: [
      'Başlık sahnesi dikkat çekmek için önemli',
      'İçerikte parallel aksiyonlar (zoom + scroll)',
      'Kapanış sahnesi izleyiciyi etkilemek için smooth',
    ],
    useCases: ['Ürün tanıtımı', 'Feature announcement', 'Social media video'],
  },
  {
    id: 'tutorial-step-by-step',
    name: 'Eğitim: Adım Adım',
    description: 'Adım adım eğitim videosu (4-5 adım)',
    category: 'tutorial',
    duration: 25000,
    sceneCount: 6,
    difficulty: 'medium',
    icon: <Users className="h-5 w-5" />,
    timeline: {
      id: 'tutorial-step-by-step',
      name: 'Eğitim: Adım Adım',
      duration: 25000,
      scenes: [
        {
          id: 'intro',
          name: 'Giriş',
          duration: 3000,
          actions: [
            { id: 'a1', type: 'animation' as ActionType, startTime: 0, duration: 3000, easing: 'ease-out-cubic', properties: { animationType: 'fade-in' } },
          ],
        },
        { id: 'step-1', name: 'Adım 1', duration: 5000, actions: [{ id: 'a2', type: 'scroll' as ActionType, startTime: 0, duration: 4000, easing: 'ease-in-out', properties: { targetPosition: { y: 200 } } }] },
        { id: 'step-2', name: 'Adım 2', duration: 5000, actions: [{ id: 'a3', type: 'scroll' as ActionType, startTime: 0, duration: 4000, easing: 'ease-in-out', properties: { targetPosition: { y: 200 } } }] },
        { id: 'step-3', name: 'Adım 3', duration: 5000, actions: [{ id: 'a4', type: 'scroll' as ActionType, startTime: 0, duration: 4000, easing: 'ease-in-out', properties: { targetPosition: { y: 200 } } }] },
        { id: 'step-4', name: 'Adım 4', duration: 5000, actions: [{ id: 'a5', type: 'scroll' as ActionType, startTime: 0, duration: 4000, easing: 'ease-in-out', properties: { targetPosition: { y: 200 } } }] },
        { id: 'summary', name: 'Özet', duration: 2000, actions: [{ id: 'a6', type: 'animation' as ActionType, startTime: 0, duration: 2000, easing: 'ease-in', properties: { animationType: 'fade-out' } }] },
      ],
      transitions: [
        { id: 't1', fromSceneId: 'intro', toSceneId: 'step-1', type: 'slide-down', duration: 400, easing: 'ease-in-out' },
        { id: 't2', fromSceneId: 'step-1', toSceneId: 'step-2', type: 'slide-down', duration: 400, easing: 'ease-in-out' },
        { id: 't3', fromSceneId: 'step-2', toSceneId: 'step-3', type: 'slide-down', duration: 400, easing: 'ease-in-out' },
        { id: 't4', fromSceneId: 'step-3', toSceneId: 'step-4', type: 'slide-down', duration: 400, easing: 'ease-in-out' },
        { id: 't5', fromSceneId: 'step-4', toSceneId: 'summary', type: 'fade', duration: 300, easing: 'ease-in-out' },
      ],
    },
    tips: [
      'Her adım için 5 saniye yeterli',
      'Scroll aksiyonlarıyla adımlar arasında geçiş yap',
      'Slide transition profesyonel görünüyor',
    ],
    useCases: ['Software tutorial', 'How-to video', 'Training video'],
  },
  {
    id: 'feature-showcase',
    name: 'Özellik Sunumu (Demo)',
    description: 'Yazılım özelliklerini detaylı gösteren demo',
    category: 'demo',
    duration: 30000,
    sceneCount: 5,
    difficulty: 'hard',
    icon: <Eye className="h-5 w-5" />,
    timeline: {
      id: 'feature-showcase',
      name: 'Özellik Sunumu',
      duration: 30000,
      scenes: [
        {
          id: 'title',
          name: 'Başlık',
          duration: 3000,
          actions: [
            { id: 'a1', type: 'animation' as ActionType, startTime: 0, duration: 3000, easing: 'ease-out-cubic', properties: { animationType: 'fade-in' } },
          ],
        },
        {
          id: 'feature-1',
          name: 'Özellik 1: Araç Çubuğu',
          duration: 8000,
          actions: [
            { id: 'a2', type: 'zoom' as ActionType, startTime: 0, duration: 2000, easing: 'ease-out', properties: { fromZoom: 2, toZoom: 1 } },
            { id: 'a3', type: 'scroll' as ActionType, startTime: 2000, duration: 3000, easing: 'ease-in-out', properties: { targetPosition: { y: 150 } } },
            { id: 'a4', type: 'animation' as ActionType, startTime: 5000, duration: 3000, easing: 'ease-out', properties: { animationType: 'scale-up' } },
          ],
        },
        {
          id: 'feature-2',
          name: 'Özellik 2: Panel',
          duration: 8000,
          actions: [
            { id: 'a5', type: 'scroll' as ActionType, startTime: 0, duration: 3000, easing: 'ease-in-out', properties: { targetPosition: { x: 200 } } },
            { id: 'a6', type: 'animation' as ActionType, startTime: 3000, duration: 5000, easing: 'ease-in-out', properties: { animationType: 'fade-in' } },
          ],
        },
        {
          id: 'feature-3',
          name: 'Özellik 3: Etkileşim',
          duration: 8000,
          actions: [
            { id: 'a7', type: 'animation' as ActionType, startTime: 0, duration: 4000, easing: 'ease-out-bounce', properties: { animationType: 'scale-up' } },
            { id: 'a8', type: 'wait' as ActionType, startTime: 4000, duration: 4000, properties: {} },
          ],
        },
        {
          id: 'conclusion',
          name: 'Kapanış',
          duration: 3000,
          actions: [
            { id: 'a9', type: 'animation' as ActionType, startTime: 0, duration: 3000, easing: 'ease-in', properties: { animationType: 'fade-out' } },
          ],
        },
      ],
      transitions: [
        { id: 't1', fromSceneId: 'title', toSceneId: 'feature-1', type: 'zoom-in', duration: 500, easing: 'ease-in-out' },
        { id: 't2', fromSceneId: 'feature-1', toSceneId: 'feature-2', type: 'slide-left', duration: 500, easing: 'ease-in-out' },
        { id: 't3', fromSceneId: 'feature-2', toSceneId: 'feature-3', type: 'slide-left', duration: 500, easing: 'ease-in-out' },
        { id: 't4', fromSceneId: 'feature-3', toSceneId: 'conclusion', type: 'fade', duration: 400, easing: 'ease-in-out' },
      ],
    },
    tips: [
      'Paralel aksiyonlar dinamik görünüm sağlar',
      'Zoom transition profesyonel görünüyor',
      'Özellik arasında beklemeler ekle',
    ],
    useCases: ['Product demo', 'Software walkthrough', 'Feature presentation'],
  },
  {
    id: 'minimalist-presentation',
    name: 'Minimal Sunum',
    description: 'Temiz ve minimal tasarımda sunum',
    category: 'presentation',
    duration: 15000,
    sceneCount: 3,
    difficulty: 'easy',
    icon: <FileText className="h-5 w-5" />,
    timeline: {
      id: 'minimalist-presentation',
      name: 'Minimal Sunum',
      duration: 15000,
      scenes: [
        {
          id: 'slide-1',
          name: 'Başlık Slaydı',
          duration: 5000,
          actions: [
            { id: 'a1', type: 'animation' as ActionType, startTime: 0, duration: 2000, easing: 'ease-out-cubic', properties: { animationType: 'fade-in' } },
            { id: 'a2', type: 'wait' as ActionType, startTime: 2000, duration: 3000, properties: {} },
          ],
        },
        {
          id: 'slide-2',
          name: 'İçerik Slaydı',
          duration: 5000,
          actions: [
            { id: 'a3', type: 'animation' as ActionType, startTime: 0, duration: 1000, easing: 'ease-out', properties: { animationType: 'fade-in' } },
            { id: 'a4', type: 'scroll' as ActionType, startTime: 1000, duration: 3000, easing: 'ease-in-out', properties: { targetPosition: { y: 100 } } },
          ],
        },
        {
          id: 'slide-3',
          name: 'Teşekkür Slaydı',
          duration: 5000,
          actions: [
            { id: 'a5', type: 'animation' as ActionType, startTime: 0, duration: 1500, easing: 'ease-out', properties: { animationType: 'fade-in' } },
            { id: 'a6', type: 'wait' as ActionType, startTime: 1500, duration: 3500, properties: {} },
          ],
        },
      ],
      transitions: [
        { id: 't1', fromSceneId: 'slide-1', toSceneId: 'slide-2', type: 'fade', duration: 300, easing: 'ease-in-out' },
        { id: 't2', fromSceneId: 'slide-2', toSceneId: 'slide-3', type: 'fade', duration: 300, easing: 'ease-in-out' },
      ],
    },
    tips: [
      'Basit ve temiz görünüm',
      'Wait aksiyonları izleyici için nefes alma alanı',
      'Fade transition minimal ama etkili',
    ],
    useCases: ['Corporate presentation', 'Slide show', 'Static content narration'],
  },
];

interface TemplateLibraryProps {
  onLoadTemplate?: (timeline: Timeline) => void;
}

export function TemplateLibrary({ onLoadTemplate }: TemplateLibraryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<Template['category'] | 'all'>('all');

  const filteredTemplates =
    filter === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === filter);

  const handleCopyTemplate = (templateId: string) => {
    setCopied(templateId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLoadTemplate = (timeline: Timeline) => {
    if (onLoadTemplate) {
      onLoadTemplate(timeline);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'presentation', 'tutorial', 'demo', 'promotional', 'documentary'] as const).map(
          (category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={cn(
                'px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-all',
                filter === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              )}
            >
              {category === 'all'
                ? 'Tümü'
                : category === 'presentation'
                  ? 'Sunumlar'
                  : category === 'tutorial'
                    ? 'Eğitim'
                    : category === 'demo'
                      ? 'Demo'
                      : category === 'promotional'
                        ? 'Tanıtım'
                        : 'Belgesel'}
            </button>
          )
        )}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={cn(
              'bg-slate-800 border-slate-700 cursor-pointer transition-all hover:border-slate-600',
              selectedTemplate?.id === template.id && 'border-blue-500 ring-1 ring-blue-500'
            )}
            onClick={() => setSelectedTemplate(template)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <div className="text-slate-400">{template.icon}</div>
                  <div>
                    <CardTitle className="text-sm text-slate-200">
                      {template.name}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      {template.description}
                    </p>
                  </div>
                </div>
                <Star className="h-4 w-4 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="bg-slate-700 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {(template.duration / 1000).toFixed(1)}s
                </Badge>
                <Badge variant="outline" className="bg-slate-700 text-xs">
                  <Layers className="h-3 w-3 mr-1" />
                  {template.sceneCount} sahne
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    template.difficulty === 'easy'
                      ? 'bg-green-500/20 text-green-400'
                      : template.difficulty === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {template.difficulty === 'easy'
                    ? 'Kolay'
                    : template.difficulty === 'medium'
                      ? 'Orta'
                      : 'Zor'}
                </Badge>
              </div>

              <Separator className="bg-slate-700" />

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyTemplate(template.id);
                  }}
                  className="border-slate-600 hover:bg-slate-700 text-xs"
                >
                  {copied === template.id ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Kopyala
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadTemplate(template.timeline);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Yükle
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Details */}
      {selectedTemplate && (
        <Card className="bg-slate-800 border-slate-700 overflow-hidden">
          <CardHeader className="pb-3 bg-slate-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {selectedTemplate.name} - Detaylar
              </CardTitle>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-slate-400 hover:text-slate-300"
              >
                ✕
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-300">Açıklama:</p>
              <p className="text-sm text-slate-400">{selectedTemplate.description}</p>
            </div>

            <Separator className="bg-slate-700" />

            {selectedTemplate.useCases && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-300">Kullanım Alanları:</p>
                <ul className="text-sm text-slate-400 space-y-1">
                  {selectedTemplate.useCases.map((useCase, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-blue-400">→</span>
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedTemplate.tips && (
              <>
                <Separator className="bg-slate-700" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-300">İpuçları:</p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    {selectedTemplate.tips.map((tip, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-amber-400">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator className="bg-slate-700" />

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-slate-900 rounded">
                <p className="text-slate-400">Süresi</p>
                <p className="font-semibold text-slate-200">
                  {(selectedTemplate.duration / 1000).toFixed(1)}s
                </p>
              </div>
              <div className="p-2 bg-slate-900 rounded">
                <p className="text-slate-400">Sahneler</p>
                <p className="font-semibold text-slate-200">
                  {selectedTemplate.sceneCount}
                </p>
              </div>
              <div className="p-2 bg-slate-900 rounded">
                <p className="text-slate-400">Zorluk</p>
                <p className="font-semibold text-slate-200">
                  {selectedTemplate.difficulty === 'easy'
                    ? 'Kolay'
                    : selectedTemplate.difficulty === 'medium'
                      ? 'Orta'
                      : 'Zor'}
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                handleLoadTemplate(selectedTemplate.timeline);
                setSelectedTemplate(null);
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Şablonu Yükle ve Kullan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TemplateLibrary;
