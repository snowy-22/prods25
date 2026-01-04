'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, PieChart, BarChart, Download, RefreshCw, Bot, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { ModuleAnalysis, WorkflowDiagram, DataMatrix } from '@/lib/json-tracking';
import { getUserAIStats } from '@/lib/ai/ai-logger';
import { useAppStore } from '@/lib/store';

interface AIUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  avgDuration: number;
  topTools: Array<{ tool: string; count: number }>;
  topFlows: Array<{ flow: string; count: number }>;
}

interface AnalysisPanelProps {
  moduleAnalyses?: ModuleAnalysis[];
  workflows?: WorkflowDiagram[];
  dataMatrices?: DataMatrix[];
  aiStats?: AIUsageStats;
  isAdminMode?: boolean;
}

export function AnalysisPanel({
  moduleAnalyses = [],
  workflows = [],
  dataMatrices = [],
  aiStats: initialAiStats,
  isAdminMode = false
}: AnalysisPanelProps) {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [aiStats, setAiStats] = useState<AIUsageStats | null>(initialAiStats || null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const { user } = useAppStore();

  // AI istatistiklerini yükle
  const loadAIStats = async () => {
    if (!user) return;
    
    setIsLoadingStats(true);
    try {
      const stats = await getUserAIStats(user.id, {
        startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Son 7 gün
      });
      setAiStats(stats);
    } catch (error) {
      console.error('Failed to load AI stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!initialAiStats && user) {
      loadAIStats();
    }
  }, [user, initialAiStats]);

  return (
    <div className="w-full h-full overflow-auto p-4 space-y-4">
      {/* Module Analysis Tab */}
      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ai">
            <Bot className="h-4 w-4 mr-2" />
            AI Kullanımı
          </TabsTrigger>
          <TabsTrigger value="modules">Modüller</TabsTrigger>
          <TabsTrigger value="workflows">İş Akışları</TabsTrigger>
          <TabsTrigger value="data">Veri Matrisleri</TabsTrigger>
        </TabsList>

        {/* AI Usage Stats Tab */}
        <TabsContent value="ai" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">AI Kullanım İstatistikleri (Son 7 Gün)</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={loadAIStats}
              disabled={isLoadingStats}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
          </div>

          {!aiStats && !isLoadingStats ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>AI kullanım verisi bulunamadı</p>
            </Card>
          ) : aiStats ? (
            <div className="grid gap-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    <Badge variant="outline">Toplam</Badge>
                  </div>
                  <div className="text-2xl font-bold">{aiStats.totalRequests}</div>
                  <p className="text-xs text-muted-foreground">AI İsteği</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      {aiStats.totalRequests > 0 
                        ? ((aiStats.successfulRequests / aiStats.totalRequests) * 100).toFixed(1) 
                        : 0}%
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{aiStats.successfulRequests}</div>
                  <p className="text-xs text-muted-foreground">Başarılı</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                      {aiStats.failedRequests}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {aiStats.totalRequests > 0 
                      ? ((aiStats.failedRequests / aiStats.totalRequests) * 100).toFixed(1) 
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Hata Oranı</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <BarChart className="h-5 w-5 text-purple-500" />
                    <Badge variant="outline">{aiStats.totalTokensUsed.toLocaleString()}</Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {(aiStats.avgDuration / 1000).toFixed(2)}s
                  </div>
                  <p className="text-xs text-muted-foreground">Ort. Süre</p>
                </Card>
              </div>

              {/* Top Tools */}
              {aiStats.topTools && aiStats.topTools.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    En Çok Kullanılan Tool'lar
                  </h4>
                  <div className="space-y-2">
                    {aiStats.topTools.map((tool, idx) => (
                      <div key={tool.tool} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                            {idx + 1}
                          </Badge>
                          <span className="text-sm font-medium">{tool.tool}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ 
                                width: `${(tool.count / aiStats.topTools[0].count) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold w-12 text-right">{tool.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Top Flows */}
              {aiStats.topFlows && aiStats.topFlows.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    En Çok Kullanılan Flow'lar
                  </h4>
                  <div className="space-y-2">
                    {aiStats.topFlows.map((flow) => (
                      <div key={flow.flow} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm font-medium">{flow.flow}</span>
                        <Badge>{flow.count} kullanım</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Token Usage & Cost Estimate */}
              <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                <h4 className="font-semibold mb-3">Token Kullanımı & Maliyet Tahmini</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Toplam Token</p>
                    <p className="text-2xl font-bold">{aiStats.totalTokensUsed.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tahmini Maliyet</p>
                    <p className="text-2xl font-bold">
                      ${((aiStats.totalTokensUsed / 1000000) * 0.15).toFixed(4)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ≈ ₺{((aiStats.totalTokensUsed / 1000000) * 0.15 * 34).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
              <p className="text-muted-foreground">Yükleniyor...</p>
            </Card>
          )}
        </TabsContent>

        {/* Module Analysis Content */}
        <TabsContent value="modules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Modül Analizi</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Yenile
            </Button>
          </div>

          {moduleAnalyses.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p>Analiz verileri henüz mevcut değil</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {moduleAnalyses.map((analysis) => (
                <Card
                  key={analysis.moduleId}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedModule === analysis.moduleId
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedModule(analysis.moduleId)}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{analysis.moduleName}</h4>
                        <p className="text-xs text-muted-foreground">
                          Son kullanım: {new Date(analysis.metrics.lastUsedDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <Badge variant="outline">v1</Badge>
                    </div>

                    {/* Usage Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Kullanım Sayısı</p>
                        <p className="font-bold">{analysis.metrics.usageCount}</p>
                      </div>
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Hata Oranı</p>
                        <p className="font-bold">{(analysis.metrics.performanceMetrics.errorRate * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Yürütme Süresi</p>
                        <p className="font-bold">{analysis.metrics.performanceMetrics.averageExecutionTime.toFixed(0)}ms</p>
                      </div>
                    </div>

                    {/* Quality Metrics */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Dokümantasyon Kalitesi</span>
                        <span className="font-semibold">{analysis.quality.documentation}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${analysis.quality.documentation}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs">
                        <span>Bakım Kolaylığı</span>
                        <span className="font-semibold">{analysis.quality.maintainability}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${analysis.quality.maintainability}%` }}
                        />
                      </div>
                    </div>

                    {/* Dependencies */}
                    {(analysis.metrics.dependencies.inputModules.length > 0 ||
                      analysis.metrics.dependencies.outputModules.length > 0) && (
                      <div className="pt-2 border-t space-y-2">
                        {analysis.metrics.dependencies.inputModules.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Girdi Modülleri</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysis.metrics.dependencies.inputModules.map((dep) => (
                                <Badge key={dep.moduleId} variant="secondary" className="text-xs">
                                  {dep.moduleName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {analysis.metrics.dependencies.outputModules.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Çıktı Modülleri</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysis.metrics.dependencies.outputModules.map((dep) => (
                                <Badge key={dep.moduleId} variant="secondary" className="text-xs">
                                  {dep.moduleName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Export Options */}
                    {isAdminMode && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="ghost" size="sm" className="flex-1 gap-2 text-xs">
                          <Download className="h-3 w-3" />
                          JSON
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 gap-2 text-xs">
                          <Download className="h-3 w-3" />
                          CSV
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">İş Akışı Diyagramları</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Yenile
            </Button>
          </div>

          {workflows.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p>İş akışı diyagramı henüz oluşturulmamış</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card
                  key={workflow.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedWorkflow === workflow.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{workflow.name}</h4>
                      <Badge>{workflow.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{workflow.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Düğümler: {workflow.nodes.length}</span>
                      <span>Bağlantılar: {workflow.edges.length}</span>
                    </div>

                    {isAdminMode && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="ghost" size="sm" className="flex-1 gap-2 text-xs">
                          <LineChart className="h-3 w-3" />
                          Görselleştir
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 gap-2 text-xs">
                          <Download className="h-3 w-3" />
                          İndir
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Data Matrix Tab */}
        <TabsContent value="data" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Veri Matrisleri</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Yenile
            </Button>
          </div>

          {dataMatrices.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p>Veri matrisi henüz oluşturulmamış</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {dataMatrices.map((matrix) => (
                <Card key={matrix.id} className="p-4 overflow-x-auto">
                  <div className="space-y-2 mb-3">
                    <h4 className="font-semibold text-sm">{matrix.name}</h4>
                    <div className="text-xs text-muted-foreground">
                      {matrix.rows.length} satır × {matrix.columns.length} sütun
                    </div>
                  </div>

                  {/* Simple Table Preview */}
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-1 text-left bg-muted/50">Satır</th>
                          {matrix.columns.slice(0, 3).map((col) => (
                            <th key={col.id} className="border p-1 text-left bg-muted/50">
                              {col.label}
                            </th>
                          ))}
                          {matrix.columns.length > 3 && (
                            <th className="border p-1 text-left text-muted-foreground">
                              +{matrix.columns.length - 3} daha
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {matrix.rows.slice(0, 3).map((row) => (
                          <tr key={row.id}>
                            <td className="border p-1">{row.label}</td>
                            {matrix.columns.slice(0, 3).map((col) => (
                              <td key={`${row.id}-${col.id}`} className="border p-1 text-center">
                                -
                              </td>
                            ))}
                          </tr>
                        ))}
                        {matrix.rows.length > 3 && (
                          <tr>
                            <td colSpan={Math.min(4, matrix.columns.length + 1)} className="border p-1 text-center text-muted-foreground">
                              +{matrix.rows.length - 3} satır daha
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {isAdminMode && (
                    <div className="flex gap-2 pt-3 border-t mt-3">
                      <Button variant="ghost" size="sm" className="flex-1 gap-2 text-xs">
                        <BarChart className="h-3 w-3" />
                        Analiz
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 gap-2 text-xs">
                        <Download className="h-3 w-3" />
                        Excel
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
