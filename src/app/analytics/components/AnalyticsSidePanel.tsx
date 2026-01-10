"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AnalyticsAssistant } from "./AnalyticsAssistant";
import { ReportGenerator, ReportConfig } from "./ReportGenerator";
import { saveAnalyticsConfig } from "@/lib/analytics-queries";
import { useAppStore } from "@/lib/store";

interface AnalyticsSidePanelProps {
  metrics?: Record<string, any>;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export function AnalyticsSidePanel({ metrics, isOpen = true, onToggle }: AnalyticsSidePanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const user = useAppStore((s) => s.user);

  const handleReportGenerate = async (config: ReportConfig) => {
    if (!user) {
      alert("Lütfen önce giriş yapın");
      return;
    }

    setIsGenerating(true);
    try {
      // Save config to Supabase - transform ReportConfig to analytics-queries format
      const success = await saveAnalyticsConfig(user.id, {
        name: config.name,
        selectedTables: config.selectedTables,
        selectedMetrics: config.selectedMetrics,
        dateRange: {
          startDate: config.startDate,
          endDate: config.endDate,
        },
        frequency: config.frequency,
        enabled: true,
      });

      if (success) {
        alert(`✓ Rapor "${config.name}" başarıyla oluşturuldu!`);
        // Optionally trigger download or email
        if (config.frequency === "once") {
          downloadReport(config);
        }
      } else {
        alert("Rapor oluşturulurken bir hata oluştu");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="border-l p-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggle?.(true)}
          className="w-full"
        >
          ◀ Paneli Aç
        </Button>
      </div>
    );
  }

  return (
    <div className="border-l border-border h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="font-semibold text-sm">Analytics Tools</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle?.(false)}
          className="h-6 w-6 p-0"
        >
          ▶
        </Button>
      </div>

      <Tabs defaultValue="assistant" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b justify-start px-3 bg-transparent h-auto p-0">
          <TabsTrigger value="assistant" className="text-xs">
            🤖 AI Asistanı
          </TabsTrigger>
          <TabsTrigger value="report" className="text-xs">
            📊 Rapor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="flex-1 overflow-hidden m-0 p-3">
          <AnalyticsAssistant metrics={metrics} />
        </TabsContent>

        <TabsContent value="report" className="flex-1 overflow-hidden m-0 p-3">
          <ReportGenerator onGenerate={handleReportGenerate} isLoading={isGenerating} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function downloadReport(config: ReportConfig) {
  const reportData = {
    name: config.name,
    generatedAt: new Date().toISOString(),
    period: {
      start: config.startDate,
      end: config.endDate,
    },
    tables: config.selectedTables,
    metrics: config.selectedMetrics,
    frequency: config.frequency,
  };

  const element = document.createElement("a");
  element.setAttribute("href", `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportData, null, 2))}`);
  element.setAttribute("download", `${config.name.replace(/\s+/g, "_")}_${Date.now()}.json`);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
