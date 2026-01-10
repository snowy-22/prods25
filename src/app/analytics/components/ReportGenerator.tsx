"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AVAILABLE_TABLES = ["Kullanıcılar", "Mesajlar", "Aramalar", "İçerik", "Loglar"];
export const AVAILABLE_METRICS = [
  "Toplam Sayı",
  "Etkinlik Oranı",
  "Ortalama Süre",
  "Trend Analizi",
  "Dağılım İstatistikleri",
  "Sistem Performansı",
];

export interface ReportConfig {
  name: string;
  selectedTables: string[];
  selectedMetrics: string[];
  startDate: string;
  endDate: string;
  frequency: "once" | "daily" | "weekly" | "monthly";
}

interface ReportGeneratorProps {
  onGenerate: (config: ReportConfig) => Promise<void>;
  isLoading?: boolean;
}

export function ReportGenerator({ onGenerate, isLoading }: ReportGeneratorProps) {
  const [reportName, setReportName] = useState("");
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [frequency, setFrequency] = useState<"once" | "daily" | "weekly" | "monthly">("once");

  const handleTableToggle = (table: string) => {
    setSelectedTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  };

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  };

  const handleGenerate = async () => {
    if (!reportName.trim()) {
      alert("Lütfen rapor adı girin");
      return;
    }
    if (selectedTables.length === 0) {
      alert("Lütfen en az bir tablo seçin");
      return;
    }
    if (selectedMetrics.length === 0) {
      alert("Lütfen en az bir metrik seçin");
      return;
    }

    await onGenerate({
      name: reportName,
      selectedTables,
      selectedMetrics,
      startDate,
      endDate,
      frequency,
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">📊 Rapor Oluşturucu</CardTitle>
        <CardDescription>Özel raporlar oluşturun ve planlayın</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 overflow-y-auto">
        {/* Report Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Rapor Adı</label>
          <Input
            placeholder="Örn: Aylık Kullanıcı Raporu"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Başlangıç</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bitiş</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium mb-1">Frekans</label>
          <Select value={frequency} onValueChange={(v: any) => setFrequency(v)} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once">Bir Kez</SelectItem>
              <SelectItem value="daily">Günlük</SelectItem>
              <SelectItem value="weekly">Haftalık</SelectItem>
              <SelectItem value="monthly">Aylık</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tables Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Tablolar</label>
          <div className="space-y-2">
            {AVAILABLE_TABLES.map((table) => (
              <label key={table} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedTables.includes(table)}
                  onCheckedChange={() => handleTableToggle(table)}
                  disabled={isLoading}
                />
                <span className="text-sm">{table}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Metrics Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Metrikler</label>
          <div className="space-y-2">
            {AVAILABLE_METRICS.map((metric) => (
              <label key={metric} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedMetrics.includes(metric)}
                  onCheckedChange={() => handleMetricToggle(metric)}
                  disabled={isLoading}
                />
                <span className="text-sm">{metric}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex-1"
            variant="default"
          >
            {isLoading ? "Oluşturuluyor..." : "Rapor Oluştur"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => {
              setReportName("");
              setSelectedTables([]);
              setSelectedMetrics([]);
            }}
          >
            Sıfırla
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
