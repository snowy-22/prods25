"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usersData, AnalyticsUser } from "../data";

export function UsersListTable() {
  const [query, setQuery] = useState("");
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return usersData;
    return usersData.filter((u) =>
      [u.name, u.email, u.role].some((v) => v.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kullanıcı Yönetimi</CardTitle>
        <CardDescription>Uygulamadaki kullanıcıları görüntüleyin ve yönetin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Kullanıcı adı veya e-posta ile filtrele..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <ScrollArea className="h-[380px] w-full">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="text-left font-medium py-2">Kullanıcı</th>
                <th className="text-left font-medium py-2">E-posta</th>
                <th className="text-left font-medium py-2">Rol</th>
                <th className="text-left font-medium py-2">Son Giriş</th>
                <th className="text-right font-medium py-2">İçerik Sayısı</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u: AnalyticsUser) => (
                <tr key={u.id} className="border-b border-border/50">
                  <td className="py-3">{u.name}</td>
                  <td className="py-3">{u.email}</td>
                  <td className="py-3">{u.role}</td>
                  <td className="py-3">{u.lastLogin}</td>
                  <td className="py-3 text-right">{u.contentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
