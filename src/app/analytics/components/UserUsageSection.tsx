"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

export function UserUsageSection() {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Ortalama Oturum Süresi</CardTitle>
          <CardDescription>+%5.2 geçen haftaya göre</CardDescription>
        </CardHeader>
        <CardContent className="text-4xl font-bold">12 dk 45 sn</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Özellik Popülerliği</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featureUsageData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={120} fontSize={12} />
              <Tooltip />
              <Bar dataKey="usage" fill="hsl(var(--foreground))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktif Kullanıcı Segmentleri</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={userSegmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {userSegmentData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
