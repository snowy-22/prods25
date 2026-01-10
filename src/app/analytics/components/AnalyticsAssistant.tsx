"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AnalyticsAssistantProps {
  metrics?: Record<string, any>;
  onMetricsRequest?: (query: string) => Promise<any>;
}

export function AnalyticsAssistant({ metrics, onMetricsRequest }: AnalyticsAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Merhaba! Ben analitik asistanınızım. Metrikleri soruşturmak, raporlar hakkında tavsiyelerde bulunmak ve veri analizinize yardımcı olmak için buradayım. Size nasıl yardımcı olabilirim?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let assistantResponse = "";

      // Process specific analytics queries
      if (input.toLowerCase().includes("metrik")) {
        assistantResponse = generateMetricsResponse(metrics);
      } else if (input.toLowerCase().includes("rapor")) {
        assistantResponse =
          "Raporlar için sağ paneldeki 'Rapor Oluşturucu' widgetini kullanabilirsiniz. Tablolar, metrikler ve zaman aralığını seçerek özelleştirilmiş raporlar oluşturun. Günlük, haftalık veya aylık olarak otomatikleştirilebilir.";
      } else if (input.toLowerCase().includes("tavsiye")) {
        assistantResponse = generateInsights(metrics);
      } else if (onMetricsRequest) {
        // Call external AI service for custom queries
        const result = await onMetricsRequest(input);
        assistantResponse = result?.response || "Sorgunuzu işleyemedim. Lütfen farklı bir şekilde deneyin.";
      } else {
        assistantResponse = generateGenericResponse(input);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">🤖 Analytics AI</CardTitle>
        <CardDescription>Sorularınızı sorun, öneriler alın</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <div className={`text-xs mt-1 ${msg.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                    {msg.timestamp.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Metrikleri veya tavsiyeleri sorun..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
            className="text-sm"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="sm">
            Gönder
          </Button>
        </div>

        {/* Quick suggestions */}
        <div className="mt-3 flex flex-wrap gap-1">
          <button
            onClick={() => setInput("Metrikleri özetle")}
            className="text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700"
          >
            Özetle
          </button>
          <button
            onClick={() => setInput("Tavsiye veya")}
            className="text-xs px-2 py-1 rounded bg-green-50 hover:bg-green-100 text-green-700"
          >
            Tavsiye
          </button>
          <button
            onClick={() => setInput("Rapor oluştur")}
            className="text-xs px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700"
          >
            Rapor
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function generateMetricsResponse(metrics?: Record<string, any>): string {
  if (!metrics || Object.keys(metrics).length === 0) {
    return "Şu anda metrikleri mevcut değil. Lütfen sekmeler arasında gezinin ve verileri yükleyin.";
  }

  const lines = [
    "**Mevcut Metrikler:**",
    ...Object.entries(metrics)
      .slice(0, 5)
      .map(([key, value]) => `• ${key}: ${typeof value === "number" ? value.toLocaleString("tr-TR") : value}`),
  ];

  if (Object.keys(metrics).length > 5) {
    lines.push(`...ve daha ${Object.keys(metrics).length - 5} metrik daha`);
  }

  return lines.join("\n");
}

function generateInsights(metrics?: Record<string, any>): string {
  const insights = [
    "✓ Kullanıcı etkileşimi son haftada %15 artmış",
    "✓ En sık kullanılan özellik: Video oynatıcı (%42)",
    "⚠ Ortalama yükleme süresi artıyor: 2.1s → 2.4s",
    "💡 Tavsiye: Logları optimize etmek performansı %20 iyileştirebilir",
  ];

  return insights.join("\n");
}

function generateGenericResponse(query: string): string {
  if (query.toLowerCase().includes("ne")) {
    return "Bu analitik paneline hoşgeldiniz! Solda çeşitli metrikler, sağda rapor oluşturucu ve ben (Analytics AI) bulunuyorum. Metrikleri keşfedin, raporlar planlayın ve veri-destekli kararlar alın.";
  }
  if (query.toLowerCase().includes("nasıl")) {
    return "1. Soldaki sekmeler arasında gezinin\n2. Sağda tabloları ve metrikleri seçin\n3. Tarih aralığını belirleyin\n4. Rapor oluştur butonuna tıklayın\n5. Raporunuz otomatik olarak oluşturulacak";
  }
  return "Anladım. 'Metrikler', 'Rapor', 'Tavsiye' veya 'Nasıl' gibi spesifik soruları sormayı deneyin.";
}
