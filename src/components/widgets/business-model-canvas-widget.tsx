"use client";

import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BMCSection {
  id: string;
  title: string;
  key: keyof BMCData;
  color: string;
}

interface BMCData {
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valueProposition: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
}

interface BusinessModelCanvasProps {
  onLoad?: () => void;
  size?: "small" | "medium" | "large";
  onDataChange?: (data: BMCData) => void;
}

const BMC_SECTIONS: BMCSection[] = [
  {
    id: "key-partners",
    title: "İŞ ORTAKLIĞı",
    key: "keyPartners",
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "key-activities",
    title: "TEMEL FAALİYETLER",
    key: "keyActivities",
    color: "bg-orange-50 border-orange-200",
  },
  {
    id: "key-resources",
    title: "TEMEL KAYNAKLAR",
    key: "keyResources",
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    id: "value-prop",
    title: "DEĞERLENDİRME YAPISI",
    key: "valueProposition",
    color: "bg-red-50 border-red-200",
  },
  {
    id: "customer-relations",
    title: "MÜŞTERİ İLİŞKİSİ",
    key: "customerRelationships",
    color: "bg-purple-50 border-purple-200",
  },
  {
    id: "channels",
    title: "KANALLAR",
    key: "channels",
    color: "bg-pink-50 border-pink-200",
  },
  {
    id: "customer-segments",
    title: "MÜŞTERİ SEGMENTLERİ",
    key: "customerSegments",
    color: "bg-green-50 border-green-200",
  },
  {
    id: "cost-structure",
    title: "MALİYET YAPISI",
    key: "costStructure",
    color: "bg-indigo-50 border-indigo-200",
  },
  {
    id: "revenue-streams",
    title: "GELİR KAYNAKLAR",
    key: "revenueStreams",
    color: "bg-cyan-50 border-cyan-200",
  },
];

const INITIAL_DATA: BMCData = {
  keyPartners: "Müşteri odaklarımız, danışma ortaklarımız, taş çıkma tekelleri...",
  keyActivities:
    "Başarılı olmek için temel ölçütler, ön temel işlemsellik, optimizasyon...",
  keyResources:
    "Neden farklı bir değerlendirzirmek tek bir cümleyle açıklanmak işlemsellik ve ikna edici bir değeri sağlar?",
  valueProposition:
    "Kolayca kopya çalınabileceğini yaya satın alınacağını ayarlayan avantajlar",
  customerRelationships:
    "Müşteri oryantasyonu, uzman danışmanı, müşteri müşteri desteği, insanlar kaynakları...",
  channels:
    "SEO, sosyal medya, çevrimdışı satış, ortalar...",
  customerSegments:
    "Müşterilenin nasıl ulaşılır? SEO, sosyal medya, çevrimdışı satış, ortaklar...",
  costStructure:
    "Müşteri odaklarımız, danışma ortaklarımız, insanlar kaynaklılıkları...",
  revenueStreams:
    "Ürün abonelikleri, reklamlı ücretleri, himet bedelleri, komisyonlar...",
};

function BusinessModelCanvasWidget({
  onLoad,
  size = "medium",
  onDataChange,
}: BusinessModelCanvasProps) {
  const [data, setData] = useState<BMCData>(INITIAL_DATA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingKey, setEditingKey] = useState<keyof BMCData | null>(null);

  const handleDataChange = useCallback(
    (key: keyof BMCData, value: string) => {
      const newData = { ...data, [key]: value };
      setData(newData);
      onDataChange?.(newData);
    },
    [data, onDataChange]
  );

  // Small view - outline with navigation
  if (size === "small" && !isFullscreen) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex flex-col gap-3 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-700">
            İŞ MODELİ CANVAS
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen(true)}
            className="h-6 w-6 p-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Outline Grid */}
        <div className="grid grid-cols-3 gap-2 flex-1">
          {BMC_SECTIONS.map((section, idx) => (
            <div
              key={section.id}
              className={`p-2 rounded border-2 cursor-pointer transition-all ${
                section.color
              } ${currentIndex === idx ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setCurrentIndex(idx)}
            >
              <p className="text-xs font-semibold line-clamp-2">
                {section.title}
              </p>
            </div>
          ))}
        </div>

        {/* Current Section Details */}
        <div className={`${BMC_SECTIONS[currentIndex].color} p-3 rounded border-2`}>
          <p className="text-xs font-bold mb-2">
            {BMC_SECTIONS[currentIndex].title}
          </p>
          <p className="text-xs text-gray-600 line-clamp-3">
            {data[BMC_SECTIONS[currentIndex].key]}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setCurrentIndex((currentIndex - 1 + BMC_SECTIONS.length) % BMC_SECTIONS.length)
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium">
            {currentIndex + 1} / {BMC_SECTIONS.length}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentIndex((currentIndex + 1) % BMC_SECTIONS.length)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Large/Medium view - Full canvas with text editing
  return (
    <div className="w-full h-full bg-white overflow-auto p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">İŞ MODELİ CANVAS</h2>
        {size === "large" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen(false)}
          >
            ✕
          </Button>
        )}
      </div>

      {/* Canvas Grid */}
      <div className="flex-1 grid grid-cols-3 gap-3 auto-rows-fr">
        {/* Top Row: Partners, Activities, Resources, Value, Relationships, Channels */}
        {BMC_SECTIONS.slice(0, 3).map((section) => (
          <Card
            key={section.id}
            className={`${section.color} border-2 p-3 flex flex-col cursor-text hover:shadow-md transition-shadow`}
          >
            <h3 className="text-xs font-bold mb-2 text-gray-800">
              {section.title}
            </h3>
            {editingKey === section.key ? (
              <textarea
                autoFocus
                className="flex-1 text-xs bg-white border rounded p-1 resize-none"
                value={data[section.key]}
                onChange={(e) => handleDataChange(section.key, e.target.value)}
                onBlur={() => setEditingKey(null)}
              />
            ) : (
              <p
                className="text-xs text-gray-700 flex-1 overflow-auto whitespace-pre-wrap"
                onClick={() => setEditingKey(section.key)}
              >
                {data[section.key]}
              </p>
            )}
          </Card>
        ))}

        {/* Center: Value Proposition */}
        <Card
          className={`${BMC_SECTIONS[3].color} border-2 p-3 flex flex-col cursor-text hover:shadow-md transition-shadow col-span-1 row-span-2 justify-center`}
        >
          <h3 className="text-xs font-bold mb-2 text-gray-800 text-center">
            {BMC_SECTIONS[3].title}
          </h3>
          {editingKey === BMC_SECTIONS[3].key ? (
            <textarea
              autoFocus
              className="flex-1 text-xs bg-white border rounded p-1 resize-none"
              value={data[BMC_SECTIONS[3].key]}
              onChange={(e) =>
                handleDataChange(BMC_SECTIONS[3].key, e.target.value)
              }
              onBlur={() => setEditingKey(null)}
            />
          ) : (
            <p
              className="text-xs text-gray-700 flex-1 overflow-auto whitespace-pre-wrap"
              onClick={() => setEditingKey(BMC_SECTIONS[3].key)}
            >
              {data[BMC_SECTIONS[3].key]}
            </p>
          )}
        </Card>

        {/* Right Side: Customer Relationships, Channels */}
        {BMC_SECTIONS.slice(4, 6).map((section) => (
          <Card
            key={section.id}
            className={`${section.color} border-2 p-3 flex flex-col cursor-text hover:shadow-md transition-shadow`}
          >
            <h3 className="text-xs font-bold mb-2 text-gray-800">
              {section.title}
            </h3>
            {editingKey === section.key ? (
              <textarea
                autoFocus
                className="flex-1 text-xs bg-white border rounded p-1 resize-none"
                value={data[section.key]}
                onChange={(e) => handleDataChange(section.key, e.target.value)}
                onBlur={() => setEditingKey(null)}
              />
            ) : (
              <p
                className="text-xs text-gray-700 flex-1 overflow-auto whitespace-pre-wrap"
                onClick={() => setEditingKey(section.key)}
              >
                {data[section.key]}
              </p>
            )}
          </Card>
        ))}

        {/* Bottom Row: Cost Structure, Customer Segments, Revenue */}
        {BMC_SECTIONS.slice(6).map((section) => (
          <Card
            key={section.id}
            className={`${section.color} border-2 p-3 flex flex-col cursor-text hover:shadow-md transition-shadow`}
          >
            <h3 className="text-xs font-bold mb-2 text-gray-800">
              {section.title}
            </h3>
            {editingKey === section.key ? (
              <textarea
                autoFocus
                className="flex-1 text-xs bg-white border rounded p-1 resize-none"
                value={data[section.key]}
                onChange={(e) => handleDataChange(section.key, e.target.value)}
                onBlur={() => setEditingKey(null)}
              />
            ) : (
              <p
                className="text-xs text-gray-700 flex-1 overflow-auto whitespace-pre-wrap"
                onClick={() => setEditingKey(section.key)}
              >
                {data[section.key]}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default BusinessModelCanvasWidget;
