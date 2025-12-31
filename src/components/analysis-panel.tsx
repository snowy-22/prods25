'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, PieChart, BarChart, Download, RefreshCw } from 'lucide-react';
import { ModuleAnalysis, WorkflowDiagram, DataMatrix } from '@/lib/json-tracking';

interface AnalysisPanelProps {
  moduleAnalyses?: ModuleAnalysis[];
  workflows?: WorkflowDiagram[];
  dataMatrices?: DataMatrix[];
  isAdminMode?: boolean;
}

export function AnalysisPanel({
  moduleAnalyses = [],
  workflows = [],
  dataMatrices = [],
  isAdminMode = false
}: AnalysisPanelProps) {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  return (
    <div className="w-full h-full overflow-auto p-4 space-y-4">
      {/* Module Analysis Tab */}
      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modules">Modüller</TabsTrigger>
          <TabsTrigger value="workflows">İş Akışları</TabsTrigger>
          <TabsTrigger value="data">Veri Matrisleri</TabsTrigger>
        </TabsList>

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
