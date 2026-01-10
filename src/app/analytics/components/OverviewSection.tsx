"use client";

import React, { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Activity, Users, MessageSquare, BrainCircuit } from "lucide-react";

const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran"]; 

export function OverviewSection() {
  const conversations = useAppStore((s) => s.conversations);
  const messages = useAppStore((s) => s.messages);
  const calls = useAppStore((s) => s.calls);

  const totalUsers = 4; // demo metric for cards
  const activeContents = 41; // demo metric for cards
  const interactionScore = 12234; // demo metric for cards

  const growthData = useMemo(() => {
    // Build simple demo dataset for the last 6 months
    return months.map((m, i) => ({
      month: m,
      yeniKullanicilar: 10 + i * 8,
      yeniIcerikler: 15 + i * 12,
    }));
  }, []);

  const featureUsageData = [
    { name: "Tuval Oluşturma", usage: 3800 },
    { name: "Puanlama", usage: 3200 },
    { name: "Paylaşım", usage: 2400 },
    { name: "Yorum Yapma", usage: 2900 },
    { name: "AI Asistan", usage: 2100 },
  ];

  const userSegmentData = [
    { name: "Aktif Kullanıcı", value: 320, fill: "#60a5fa" },
    { name: "Ara Sıra Giren", value: 180, fill: "#34d399" },
    { name: "Güçlü Kullanıcı", value: 120, fill: "#f472b6" },
    { name: "Yeni Kullanıcı", value: 220, fill: "#facc15" },
  ];

  // Calculated from store
  const totalConversations = conversations?.length || 0;
  const totalMessages = Object.values(messages || {}).reduce((s, arr) => s + (arr?.length || 0), 0);
  const ongoingCalls = (calls || []).filter((c: any) => c?.status !== "ended").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5"/>Toplam Kullanıcı</CardTitle>
            <CardDescription>%1.2 geçen aydan</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5"/>Aktif İçerik Sayısı</CardTitle>
            <CardDescription>+180.1% son 1 ayda</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{activeContents}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5"/>Etkileşim Oranı</CardTitle>
            <CardDescription>+19% son 1 ayda</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">+{interactionScore.toLocaleString("tr-TR")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BrainCircuit className="h-5 w-5"/>Mesaj/Arama</CardTitle>
            <CardDescription>{totalConversations} konuşma, {ongoingCalls} aktif arama</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalMessages}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Kullanıcı ve İçerik Artışı</CardTitle>
          <CardDescription>Son 6 aydaki yeni kullanıcı ve içerik sayıları.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="yeniKullanicilar" name="Yeni Kullanıcılar" fill="hsl(var(--muted-foreground))" />
              <Bar dataKey="yeniIcerikler" name="Yeni İçerikler" fill="hsl(var(--foreground))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="features" className="w-full">
        <TabsList>
          <TabsTrigger value="features">Özellik Popülerliği</TabsTrigger>
          <TabsTrigger value="segments">Aktif Kullanıcı Segmentleri</TabsTrigger>
        </TabsList>
        <TabsContent value="features">
          <Card>
            <CardHeader><CardTitle className="text-lg">Özellik Popülerliği</CardTitle></CardHeader>
            <CardContent className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureUsageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={140} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="usage" fill="hsl(var(--accent))" name="Kullanım" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="segments">
          <Card>
            <CardHeader><CardTitle className="text-lg">Aktif Kullanıcı Segmentleri</CardTitle></CardHeader>
            <CardContent className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userSegmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {userSegmentData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
