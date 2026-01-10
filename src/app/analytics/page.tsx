"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { JitsiEmbed } from "@/components/jitsi-embed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { OverviewSection } from "@/app/analytics/components/OverviewSection";
import { UsersListTable } from "@/app/analytics/components/UsersListTable";
import { UserUsageSection } from "@/app/analytics/components/UserUsageSection";
import { ContentTable } from "@/app/analytics/components/ContentTable";
import { LogsTable } from "@/app/analytics/components/LogsTable";
import { AnalyticsSidePanel } from "@/app/analytics/components/AnalyticsSidePanel";
import { getOverviewMetrics, DateRange } from "@/lib/analytics-queries";

export default function AnalyticsPage() {
  const conversations = useAppStore((s) => s.conversations);
  const messagesMap = useAppStore((s) => s.messages);
  const calls = useAppStore((s) => s.calls);

  const [roomName, setRoomName] = useState<string>("");
  const [showJitsi, setShowJitsi] = useState<boolean>(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });

  // Load overview metrics on mount and when date range changes
  useEffect(() => {
    const loadMetrics = async () => {
      const data = await getOverviewMetrics(dateRange);
      setMetrics(data);
    };
    loadMetrics();
  }, [dateRange]);

  const totalMessages = useMemo(() => {
    return Object.values(messagesMap || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  }, [messagesMap]);

  const totalUnread = useMemo(() => {
    return Object.values(messagesMap || {}).reduce(
      (sum, arr) => sum + (arr?.filter((m) => !m.isRead).length || 0),
      0
    );
  }, [messagesMap]);

  const ongoingCalls = useMemo(() => {
    return (calls || []).filter((c) => (c as any)?.status !== "ended");
  }, [calls]);

  const recentConversations = useMemo(() => {
    const arr = [...(conversations || [])];
    arr.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    return arr.slice(0, 8);
  }, [conversations]);

  const recentCalls = useMemo(() => {
    const arr = [...(calls || [])];
    arr.sort((a, b) => (b.startedAt || "").localeCompare(a.startedAt || ""));
    return arr.slice(0, 8);
  }, [calls]);

  function openJitsiForConversation(conversationId: string) {
    setRoomName(`cf-conv-${conversationId}`);
    setShowJitsi(true);
  }

  function openJitsiForCall(callId: string) {
    setRoomName(`cf-call-${callId}`);
    setShowJitsi(true);
  }

  function closeJitsi() {
    setShowJitsi(false);
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground mb-4">Canlı metrikler ve raporlama araçları (sağ panel).</p>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
              <TabsTrigger value="content">İçerik</TabsTrigger>
              <TabsTrigger value="interactions">Etkileşim Analizi</TabsTrigger>
              <TabsTrigger value="data-architecture">Veri Mimarisi</TabsTrigger>
              <TabsTrigger value="app-map">Uygulama Haritası</TabsTrigger>
              <TabsTrigger value="ai-insights">AI Öngörüleri</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <OverviewSection />

              <Card>
                <CardHeader>
                  <CardTitle>Hızlı Jitsi Testi</CardTitle>
                  <CardDescription>Konuşmalar ve aramalar üzerinden hızlı test başlatın.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold mb-2">Son Konuşmalar</h3>
                      <ul className="space-y-2">
                        {recentConversations.map((c) => (
                          <li key={c.id} className="flex items-center justify-between border-b py-2">
                            <div>
                              <div className="font-medium">{c.userName}</div>
                              <div className="text-xs text-muted-foreground">{c.lastMessage}</div>
                            </div>
                            <button onClick={() => openJitsiForConversation(c.id)} className="border px-3 py-1 rounded-md">Jitsi</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Son Aramalar</h3>
                      <ul className="space-y-2">
                        {recentCalls.map((c: any) => (
                          <li key={c.id} className="flex items-center justify-between border-b py-2">
                            <div>
                              <div className="font-medium">{c.title || c.id}</div>
                              <div className="text-xs text-muted-foreground">{c.status || "unknown"}</div>
                            </div>
                            <button onClick={() => openJitsiForCall(c.id)} className="border px-3 py-1 rounded-md">Jitsi</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardDescription>Konuşmalar</CardDescription>
                        <CardTitle className="text-xl">{conversations?.length || 0}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="py-3">
                        <CardDescription>Mesajlar</CardDescription>
                        <CardTitle className="text-xl">{totalMessages}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="py-3">
                        <CardDescription>Okunmamış</CardDescription>
                        <CardTitle className="text-xl">{totalUnread}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="py-3">
                        <CardDescription>Aktif Aramalar</CardDescription>
                        <CardTitle className="text-xl">{ongoingCalls.length}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {showJitsi && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">Jitsi: {roomName}</div>
                        <button onClick={closeJitsi} className="border border-red-500 text-red-500 px-3 py-1 rounded-md">Kapat</button>
                      </div>
                      <div className="h-[480px] border rounded-md overflow-hidden">
                        <JitsiEmbed roomName={roomName} width="100%" height="100%" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Tabs defaultValue="list" className="space-y-3">
                <TabsList>
                  <TabsTrigger value="list">Kullanıcı Listesi</TabsTrigger>
                  <TabsTrigger value="usage">Kullanım Analizleri</TabsTrigger>
                </TabsList>
                <TabsContent value="list">
                  <UsersListTable />
                </TabsContent>
                <TabsContent value="usage">
                  <UserUsageSection />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="content">
              <ContentTable />
            </TabsContent>

            <TabsContent value="interactions">
              <LogsTable />
            </TabsContent>

            <TabsContent value="data-architecture">
              <Card>
                <CardHeader>
                  <CardTitle>Veri Mimarisi</CardTitle>
                  <CardDescription>Varlık ilişkileri ve şema görünümü (yakında).</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Bu bölüm için Entity Diagram/ERD görselleştirmesi eklenecek.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="app-map">
              <Card>
                <CardHeader>
                  <CardTitle>Uygulama Haritası</CardTitle>
                  <CardDescription>Modüller arası etkileşim ve akış (yakında).</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Bu bölüm için topoloji/akış diyagramı eklenecek.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-insights">
              <Card>
                <CardHeader>
                  <CardTitle>AI Öngörüleri</CardTitle>
                  <CardDescription>Davranış tahminleri ve öneriler (yakında).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button className="border px-3 py-1 rounded-md">Analizi Başlat</button>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    <li>Yoğun kullanım saatleri tahmini</li>
                    <li>Özellik kullanım kümeleri</li>
                    <li>Olası tıkanma noktaları</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side Panel */}
      <div className={`${sidePanelOpen ? "w-80" : "w-12"} border-l transition-all duration-300 flex flex-col`}>
        <AnalyticsSidePanel
          metrics={metrics}
          isOpen={sidePanelOpen}
          onToggle={setSidePanelOpen}
        />
      </div>
    </div>
  );
}
