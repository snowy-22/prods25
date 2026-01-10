"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { initialContent } from "@/lib/initial-content";

export function ContentTable() {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const data = initialContent || [];
    const filter = q.trim().toLowerCase();
    const filtered = !filter
      ? data
      : data.filter((i) => (i.title || "").toLowerCase().includes(filter));
    return filtered.map((i) => ({
      title: i.title,
      type: i.type,
      createdAt: i.createdAt?.slice(0, 10) || "-",
      childCount: (i.children?.length || 0),
      score: (i.hundredPointScale ?? 0).toFixed ? (i.hundredPointScale as number) : 0,
    }));
  }, [q]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>İçerik Veritabanı</CardTitle>
        <CardDescription>Uygulamadaki tüm içerik öğelerini görüntüleyin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="İçerik başlığına göre filtrele..." value={q} onChange={(e) => setQ(e.target.value)} />
        <ScrollArea className="h-[480px] w-full">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="text-left font-medium py-2">Başlık</th>
                <th className="text-left font-medium py-2">Tür</th>
                <th className="text-left font-medium py-2">Oluşturulma</th>
                <th className="text-right font-medium py-2">Alt Öğeler</th>
                <th className="text-right font-medium py-2">Puan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-b border-border/50">
                  <td className="py-3">{r.title}</td>
                  <td className="py-3">{r.type}</td>
                  <td className="py-3">{r.createdAt}</td>
                  <td className="py-3 text-right">{r.childCount}</td>
                  <td className="py-3 text-right">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
