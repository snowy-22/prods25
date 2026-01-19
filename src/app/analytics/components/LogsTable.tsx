"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const MOCK_LOGS = [
  {
    ts: "2025-12-24 10:30:00",
    user: "Ali Yılmaz",
    event: "Uygulama Başlatıldı",
    load: 1240,
    openFolder: 456,
    personalFolder: 1800,
    device: "Windows 11 - Chrome (120.0.6099.129)",
  },
  {
    ts: "2025-12-24 11:15:22",
    user: "Zeynep Yılmaz",
    event: "Tuval Değiştirildi",
    load: 856,
    openFolder: 328,
    personalFolder: 1200,
    device: "macOS Sonoma - Safari (17.2.1)",
  },
  {
    ts: "2025-12-24 12:05:45",
    user: "Ahmet Çelik",
    event: "AI Analizi Başlatıldı",
    load: 2180,
    openFolder: 606,
    personalFolder: 2500,
    device: "Ubuntu 22.04 - Firefox (121.0)",
  },
  {
    ts: "2025-12-24 12:45:10",
    user: "Guest",
    event: "Sayfa Yüklendi",
    load: 1560,
    openFolder: 506,
    personalFolder: 2000,
    device: "iOS 17.2 - Mobile Safari (17.2)",
  },
];

export function LogsTable() {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const f = q.trim().toLowerCase();
    if (!f) return MOCK_LOGS;
    return MOCK_LOGS.filter((r) =>
      [r.ts, r.user, r.event, r.device].some((x) => x.toLowerCase().includes(f))
    );
  }, [q]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sistem ve Etkileşim Logları</CardTitle>
        <CardDescription>Kullanıcı etkileşimleri, yükleme süreleri ve cihaz bilgilerini takip edin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Olay veya kullanıcı ile filtrele..." value={q} onChange={(e) => setQ(e.target.value)} />
        <ScrollArea className="h-[420px] w-full">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="text-left font-medium py-2">Zaman Damgası</th>
                <th className="text-left font-medium py-2">Kullanıcı</th>
                <th className="text-left font-medium py-2">Olay</th>
                <th className="text-right font-medium py-2">Yükleme (ms)</th>
                <th className="text-right font-medium py-2">Klasör Açılış (ms)</th>
                <th className="text-right font-medium py-2">Kişisel Klasör (ms)</th>
                <th className="text-left font-medium py-2">Cihaz Bilgisi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-b border-border/50">
                  <td className="py-3">{r.ts}</td>
                  <td className="py-3">{r.user}</td>
                  <td className="py-3">{r.event}</td>
                  <td className="py-3 text-right">{r.load}ms</td>
                  <td className="py-3 text-right">{r.openFolder}ms</td>
                  <td className="py-3 text-right">{r.personalFolder}ms</td>
                  <td className="py-3">{r.device}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
