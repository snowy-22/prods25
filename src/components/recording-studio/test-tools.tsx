'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Code,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { Timeline, Scene, Action } from '@/lib/recording-studio-types';

interface TestToolsProps {
  timeline: Timeline;
  onActionPreview?: (action: Action, sceneId: string) => void;
}

interface ValidationResult {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  details?: string[];
  actionId?: string;
  sceneId?: string;
}

export function TestTools({ timeline, onActionPreview }: TestToolsProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'simulator' | 'validator'>('timeline');
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [simulatorSpeed, setSimulatorSpeed] = useState(1);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());

  // Timeline Analysis
  const timelineStats = useMemo(() => {
    let totalDuration = 0;
    let totalActions = 0;
    let actionTypeCount: Record<string, number> = {};
    let sceneCount = timeline.scenes?.length || 0;

    timeline.scenes?.forEach((scene) => {
      totalDuration += scene.duration || 0;
      scene.actions?.forEach((action) => {
        totalActions++;
        actionTypeCount[action.type] =
          (actionTypeCount[action.type] || 0) + 1;
      });
    });

    return {
      totalDuration,
      totalActions,
      sceneCount,
      actionTypeCount,
      averageSceneDuration: sceneCount > 0 ? totalDuration / sceneCount : 0,
      averageActionsPerScene: sceneCount > 0 ? totalActions / sceneCount : 0,
    };
  }, [timeline]);

  // Validation Check
  const validationResults = useMemo((): ValidationResult[] => {
    const results: ValidationResult[] = [];

    // Empty timeline check
    if (!timeline.scenes || timeline.scenes.length === 0) {
      results.push({
        type: 'error',
        title: 'Boş Timeline',
        description: 'Timeline\'da herhangi bir sahne bulunmamaktadır.',
      });
      return results;
    }

    // Check each scene
    timeline.scenes.forEach((scene, sceneIndex) => {
      // Scene duration check
      if (!scene.duration || scene.duration <= 0) {
        results.push({
          type: 'error',
          title: 'Geçersiz Sahne Süresi',
          description: `Sahne ${sceneIndex + 1} ("${scene.name}"): Süresi tanımlanmamış veya sıfır.`,
          sceneId: scene.id,
        });
      }

      if (!scene.actions || scene.actions.length === 0) {
        results.push({
          type: 'warning',
          title: 'Boş Sahne',
          description: `Sahne ${sceneIndex + 1} ("${scene.name}"): Hiçbir aksiyon içermiyor.`,
          sceneId: scene.id,
        });
      }

      // Check actions within scene
      scene.actions?.forEach((action, actionIndex) => {
        const actionEnd = (action.startTime || 0) + (action.duration || 0);

        // Action exceeds scene duration
        if (actionEnd > (scene.duration || 0)) {
          results.push({
            type: 'error',
            title: 'Aksiyon Süresi Aşımı',
            description: `Sahne ${sceneIndex + 1}: Aksiyon ${actionIndex + 1} ("${action.type}") 
            sahneden dışarıya taşıyor (${actionEnd}ms > ${scene.duration}ms).`,
            sceneId: scene.id,
            actionId: action.id,
          });
        }

        // Missing required properties
        if (!action.type) {
          results.push({
            type: 'error',
            title: 'Eksik Aksiyon Tipi',
            description: `Sahne ${sceneIndex + 1}: Aksiyon ${actionIndex + 1}'in tipi belirtilmemiş.`,
            sceneId: scene.id,
            actionId: action.id,
          });
        }

        if (action.duration === undefined || action.duration <= 0) {
          results.push({
            type: 'warning',
            title: 'Aksiyon Süresi Sorunu',
            description: `Sahne ${sceneIndex + 1}: Aksiyon ${actionIndex + 1} ("${action.type}") 
            süresi tanımlanmamış veya sıfır.`,
            sceneId: scene.id,
            actionId: action.id,
          });
        }
      });

      // Check transitions
      if (timeline.transitions && timeline.transitions.length > 0) {
        const transitionsFromScene = timeline.transitions.filter(
          (t) => t.fromSceneId === scene.id
        );

        transitionsFromScene.forEach((transition) => {
          if ((transition.duration || 0) > 1000) {
            results.push({
              type: 'info',
              title: 'Uzun Geçiş',
              description: `Geçiş: "${scene.name}" → ${
                timeline.scenes.find((s) => s.id === transition.toSceneId)?.name || 'Bilinmiyor'
              } ${transition.duration}ms (1 saniyeden uzun).`,
              sceneId: scene.id,
            });
          }
        });
      }
    });

    // Performance warnings
    if (timelineStats.totalDuration > 600000) {
      // 10 minutes
      results.push({
        type: 'warning',
        title: 'Uzun Timeline',
        description: `Timeline çok uzun (${(
          timelineStats.totalDuration / 1000
        ).toFixed(1)}s). Başlaşım ve oynatma performansı etkilenebilir.`,
      });
    }

    if (timelineStats.totalActions > 100) {
      results.push({
        type: 'warning',
        title: 'Çok Fazla Aksiyon',
        description: `Timeline\'da ${timelineStats.totalActions} aksiyon var. 
        Performans sorunları yaşayabilirsiniz.`,
      });
    }

    // Success message if no errors
    if (results.filter((r) => r.type === 'error').length === 0) {
      results.unshift({
        type: 'success',
        title: 'Doğrulama Başarılı',
        description: 'Timeline\'da hata bulunmamaktadır. Oynatmaya hazır!',
      });
    }

    return results;
  }, [timeline, timelineStats]);

  const currentScene = timeline.scenes?.[selectedSceneIndex];

  // Simulator
  const SimulatorTab = () => (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Sahne Simulatörü</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scene Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Sahne Seç:
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {timeline.scenes?.map((scene, index) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    setSelectedSceneIndex(index);
                    setSelectedAction(null);
                  }}
                  className={cn(
                    "px-3 py-2 rounded text-xs font-medium whitespace-nowrap transition-all",
                    selectedSceneIndex === index
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  )}
                >
                  {scene.name || `Sahne ${index + 1}`}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Scene Details */}
          {currentScene && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-slate-800 rounded">
                  <p className="text-slate-400">Süresi</p>
                  <p className="font-semibold text-slate-200">
                    {((currentScene.duration || 0) / 1000).toFixed(2)}s
                  </p>
                </div>
                <div className="p-2 bg-slate-800 rounded">
                  <p className="text-slate-400">Aksiyon Sayısı</p>
                  <p className="font-semibold text-slate-200">
                    {currentScene.actions?.length || 0}
                  </p>
                </div>
                <div className="p-2 bg-slate-800 rounded">
                  <p className="text-slate-400">Hız</p>
                  <p className="font-semibold text-slate-200">{simulatorSpeed}x</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Oynatma Hızı: {simulatorSpeed}x
                </label>
                <input
                  type="range"
                  min="0.25"
                  max="4"
                  step="0.25"
                  value={simulatorSpeed}
                  onChange={(e) => setSimulatorSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0.25x</span>
                  <span>1x</span>
                  <span>4x</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Aksiyon Listesi:
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {currentScene.actions?.map((action, index) => (
                    <button
                      key={action.id || index}
                      onClick={() =>
                        setSelectedAction(
                          selectedAction === action.id
                            ? null
                            : action.id || `action-${index}`
                        )
                      }
                      className={cn(
                        "w-full text-left px-2 py-2 rounded text-xs transition-all border",
                        selectedAction === action.id
                          ? "bg-purple-600/20 border-purple-500"
                          : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-200">
                            {action.type}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {action.startTime || 0}ms - {
                              ((action.startTime || 0) + (action.duration || 0))
                            }ms ({action.duration || 0}ms)
                          </p>
                        </div>
                        <Play className="h-3 w-3 text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedAction && (
                <>
                  <Separator className="bg-slate-700" />
                  <Button
                    onClick={() => {
                      const action = currentScene.actions?.find(
                        (a) => a.id === selectedAction
                      );
                      if (action && onActionPreview) {
                        onActionPreview(action, currentScene.id);
                      }
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Aksiyonu Önizle
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Validator Tab
  const ValidatorTab = () => (
    <div className="space-y-3">
      {validationResults.map((result, index) => {
        const isExpanded = expandedResults.has(index);

        return (
          <Card
            key={index}
            className={cn(
              "border",
              result.type === 'error'
                ? 'bg-red-500/10 border-red-500/30'
                : result.type === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : result.type === 'success'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
            )}
          >
            <div
              onClick={() => {
                const newExpanded = new Set(expandedResults);
                if (isExpanded) {
                  newExpanded.delete(index);
                } else {
                  newExpanded.add(index);
                }
                setExpandedResults(newExpanded);
              }}
              className="p-3 cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                {result.type === 'error' && (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                )}
                {result.type === 'warning' && (
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                )}
                {result.type === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                )}
                {result.type === 'info' && (
                  <Clock className="h-4 w-4 text-blue-400" />
                )}
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-200">
                    {result.title}
                  </p>
                  <p className="text-xs text-slate-400">{result.description}</p>
                </div>
              </div>
              {result.details && (
                isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
              )}
            </div>

            {isExpanded && result.details && (
              <div className="border-t border-slate-700 p-3 space-y-1">
                {result.details.map((detail, i) => (
                  <p key={i} className="text-xs text-slate-400">
                    • {detail}
                  </p>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  // Timeline Tab
  const TimelineTab = () => (
    <div className="space-y-4">
      {/* Stats */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Timeline İstatistikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 bg-slate-800 rounded">
              <p className="text-slate-400">Toplam Süre</p>
              <p className="font-semibold text-slate-200">
                {(timelineStats.totalDuration / 1000).toFixed(2)}s
              </p>
            </div>
            <div className="p-2 bg-slate-800 rounded">
              <p className="text-slate-400">Toplam Aksiyon</p>
              <p className="font-semibold text-slate-200">
                {timelineStats.totalActions}
              </p>
            </div>
            <div className="p-2 bg-slate-800 rounded">
              <p className="text-slate-400">Sahne Sayısı</p>
              <p className="font-semibold text-slate-200">
                {timelineStats.sceneCount}
              </p>
            </div>
            <div className="p-2 bg-slate-800 rounded">
              <p className="text-slate-400">Ort. Sahne Süresi</p>
              <p className="font-semibold text-slate-200">
                {(timelineStats.averageSceneDuration / 1000).toFixed(2)}s
              </p>
            </div>
          </div>

          <Separator className="bg-slate-700 my-3" />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-300">Aksiyon Türü Dağılımı:</p>
            <div className="space-y-1">
              {Object.entries(timelineStats.actionTypeCount)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">{type}</span>
                    <Badge variant="outline" className="bg-slate-800">
                      {count}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Visualization */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Timeline Görselleştirmesi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {timeline.scenes?.map((scene, sceneIndex) => (
            <div key={scene.id} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">
                  {scene.name || `Sahne ${sceneIndex + 1}`}
                </span>
                <span className="text-slate-500">
                  {((scene.duration || 0) / 1000).toFixed(2)}s
                </span>
              </div>
              <div className="h-16 bg-slate-800 rounded border border-slate-700 p-1 flex items-center gap-0.5 overflow-x-auto">
                {scene.actions?.map((action, actionIndex) => {
                  const widthPercent =
                    ((action.duration || 100) / (scene.duration || 1000)) * 100;

                  return (
                    <div
                      key={action.id || actionIndex}
                      style={{ width: `${Math.max(widthPercent, 5)}%` }}
                      className={cn(
                        "h-full rounded text-xs font-bold text-white flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity",
                        action.type === 'scroll'
                          ? 'bg-blue-600'
                          : action.type === 'zoom'
                            ? 'bg-purple-600'
                            : action.type === 'animation'
                              ? 'bg-pink-600'
                              : 'bg-slate-600'
                      )}
                      title={`${action.type} (${action.duration}ms)`}
                    >
                      {widthPercent > 15 && action.type.charAt(0)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {(['timeline', 'simulator', 'validator'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            )}
          >
            {tab === 'timeline' && '📊 Timeline'}
            {tab === 'simulator' && '▶️ Simülatör'}
            {tab === 'validator' && '✓ Doğrulama'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'timeline' && <TimelineTab />}
      {activeTab === 'simulator' && <SimulatorTab />}
      {activeTab === 'validator' && <ValidatorTab />}
    </div>
  );
}

export default TestTools;
