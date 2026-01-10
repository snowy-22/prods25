"use client";

import React, { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { JitsiEmbed } from "@/components/jitsi-embed";
import { nanoid } from "nanoid";

export default function AnalizPage() {
  const {
    // Sync & environment
    isSyncEnabled,
    lastSyncTime,
    // AI providers & subscriptions
    aiProviders,
    userSubscriptionTier,
    // Commerce & content
    products,
    presentations,
    // Calls (advanced features)
    callSessions,
    callHistory,
  } = useAppStore();

  const [jitsiOpen, setJitsiOpen] = useState(false);
  const [room, setRoom] = useState<string>("");

  const providerCount = aiProviders?.length ?? 0;
  const productCount = products?.length ?? 0;
  const presentationCount = presentations?.length ?? 0;
  const activeCalls = useMemo(
    () => (callSessions || []).filter((c) => c.status === "ongoing").length,
    [callSessions]
  );
  const recentCalls = (callHistory || []).slice(0, 5);

  const openJitsi = () => {
    if (!jitsiOpen) {
      setRoom(`canvasflow-analiz-${nanoid(8)}`);
      setJitsiOpen(true);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Analiz Panelleri</h1>
      <p className="text-sm text-muted-foreground">
        Son eklenen fonksiyonlar ve sistem özetleri için hızlı kontrol paneli.
      </p>

      {/* Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 bg-white/50 dark:bg-gray-900/50">
          <div className="text-sm text-gray-500">AI Sağlayıcıları</div>
          <div className="text-3xl font-bold mt-1">{providerCount}</div>
          <div className="text-xs text-gray-500 mt-1">Varsayılan: {aiProviders?.find(p => p.isDefault)?.name || "-"}</div>
        </div>
        <div className="rounded-lg border p-4 bg-white/50 dark:bg-gray-900/50">
          <div className="text-sm text-gray-500">Ürünler</div>
          <div className="text-3xl font-bold mt-1">{productCount}</div>
          <div className="text-xs text-gray-500 mt-1">Sunumlar: {presentationCount}</div>
        </div>
        <div className="rounded-lg border p-4 bg-white/50 dark:bg-gray-900/50">
          <div className="text-sm text-gray-500">Senkronizasyon</div>
          <div className="text-3xl font-bold mt-1">{isSyncEnabled ? "Aktif" : "Kapalı"}</div>
          <div className="text-xs text-gray-500 mt-1">Son: {lastSyncTime ? new Date(lastSyncTime).toLocaleString("tr-TR") : "-"}</div>
          <div className="text-xs text-gray-500">Abonelik: {userSubscriptionTier}</div>
        </div>
      </section>

      {/* Calls analysis */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 bg-white/50 dark:bg-gray-900/50 lg:col-span-1">
          <h2 className="text-lg font-medium mb-2">Arama Durumu</h2>
          <div className="flex items-center justify-between text-sm">
            <span>Aktif Aramalar</span>
            <span className="font-semibold">{activeCalls}</span>
          </div>
          <div className="mt-3 text-xs text-gray-500">Toplam Oturum: {(callSessions || []).length}</div>
        </div>

        <div className="rounded-lg border p-4 bg-white/50 dark:bg-gray-900/50 lg:col-span-2">
          <h2 className="text-lg font-medium mb-2">Son Arama Kayıtları</h2>
          {recentCalls.length === 0 ? (
            <div className="text-sm text-gray-500">Kayıt bulunamadı.</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentCalls.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-900 text-sm"
                >
                  <div>
                    <div className="font-medium capitalize">{c.call_type}</div>
                    <div className="text-xs text-gray-500">{new Date(c.timestamp).toLocaleString("tr-TR")}</div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {Math.floor((c.duration_seconds || 0) / 60)} dk — {c.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Jitsi quick validation */}
      <section className="rounded-lg border p-4 bg-white/50 dark:bg-gray-900/50">
        <h2 className="text-lg font-medium mb-2">Jitsi Gömülü Test</h2>
        {!jitsiOpen ? (
          <button
            className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={openJitsi}
          >
            Test Görüşmesini Başlat
          </button>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <JitsiEmbed
              roomName={room}
              userName="Analiz Sayfası"
              onEnd={() => setJitsiOpen(false)}
              height={520}
            />
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">
          Not: Bu test, son eklenen Jitsi gömme fonksiyonunun çalışırlığını hızlıca doğrular.
        </div>
      </section>
    </div>
  );
}
