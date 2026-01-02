'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  ChevronRight,
  CheckCircle,
  Circle,
  Play,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { Timeline, Action, ActionType } from '@/lib/recording-studio-types';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: string;
  action?: ActionType;
  example?: {
    code: string;
    description: string;
  };
  tips?: string[];
  resources?: Array<{ title: string; url: string }>;
}

interface TutorialModeProps {
  onStepComplete?: (stepId: string) => void;
  onLoadExample?: (timeline: Timeline) => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'intro',
    title: 'Recording Studio\'ya Hoşgeldin',
    description: 'Sunum tarzında sahne geçişleri ve otomasyonlar oluştur',
    content: `Recording Studio, web sayfanızda yapılan işlemleri milisaniye hassasiyeti ile 
    otomatikleştiren ve kaydeden güçlü bir araçtır. Sunumlar, eğitim videoları ve 
    demo'lar oluşturmak için ideal.`,
    tips: [
      'Timeline\'ı kullanarak aksiyonları programla',
      'Sahneler arasında smooth geçişler ekle',
      'Otomatik kayıt ile her şeyi video\'ya al',
      'Playback hızını kontrol et (0.25x - 4x)',
    ],
  },
  {
    id: 'scenes',
    title: 'Sahneler (Scenes)',
    description: 'Timeline\'ı sahnelere böl ve organize et',
    content: `Sahneler, timeline\'ınızın temel yapı taşlarıdır. Her sahne bir dizi aksiyon içerir
    ve belirli bir süre boyunca oynatılır. Sahneler sırayla oynatılır ve aralarında
    transition (geçiş) efektleri ekleyebilirsiniz.`,
    example: {
      code: `const scene1 = {
  id: 'scene-1',
  name: 'Açılış',
  duration: 5000, // 5 saniye
  actions: [
    { type: 'zoom', duration: 2000 },
    { type: 'wait', duration: 3000 }
  ]
}`,
      description: '5 saniyelik bir açılış sahnesi örneği',
    },
    tips: [
      'Her sahneye anlamlı bir isim ver',
      'Sahne süresi >= tüm aksiyonlarının toplamı olmalı',
      'Birden fazla aksiyon paralel çalışabilir',
    ],
  },
  {
    id: 'actions',
    title: 'Aksiyonlar (Actions)',
    description: '12 farklı aksiyon tipi ve nasıl kullanılacağı',
    content: `Aksiyonlar sahne içinde gerçekleşen olaylardır. Scroll, zoom, navigation,
    stil değişikliği vb. gibi işlemleri otomatikleştirebilirsiniz.`,
    tips: [
      'scroll: Sayfayı kaydır (smooth animasyon destekli)',
      'zoom: Canvas zoom seviyesini değiştir',
      'navigate: Farklı sayfaya git',
      'style-change: Öğe stillerini güncelle',
      'animation: Fade, scale, rotate gibi efektler',
      'wait: Belirtilen süre bekle',
    ],
  },
  {
    id: 'easing',
    title: 'Easing Fonksiyonları',
    description: 'Animasyonları smooth hale getir',
    content: `Easing fonksiyonları, aksiyonların başlangıçtan sonuna kadar nasıl ilerleyeceğini
    belirler. Linear hareket yerine, acceleration ve deceleration ekler.`,
    example: {
      code: `const action = {
  type: 'scroll',
  duration: 2000,
  easing: 'ease-in-out-cubic', // yumuşak başlangıç ve bitiş
  targetPosition: { x: 0, y: 500 }
}`,
      description: 'Cubic easing ile smooth scroll',
    },
    tips: [
      'linear: Sabit hız (doğal yok)',
      'ease-in: Yavaş başlangıç, hızlı bitiş',
      'ease-out: Hızlı başlangıç, yavaş bitiş',
      'ease-in-out: Yavaş başlangıç ve bitiş',
      'bounce: Sıçrama efekti',
      'sine, quad, cubic, quart, expo vb. matematiksel curves',
    ],
  },
  {
    id: 'timing',
    title: 'Zamanlama (Timing)',
    description: 'Milisaniye hassasiyeti ile aksiyonları zamanla',
    content: `Her aksiyon bir başlangıç zamanı (startTime) ve süresi (duration) ile tanımlanır.
    Aksiyonlar paralel veya sırayla çalışabilir.`,
    example: {
      code: `// Paralel aksiyonlar
const actions = [
  { type: 'zoom', startTime: 0, duration: 2000 },
  { type: 'scroll', startTime: 500, duration: 2000 } // 500ms sonra başla
]

// Sonuç: zoom 0-2000ms, scroll 500-2500ms (0.5 saniye overlap)`,
      description: 'Paralel aksiyon örneği',
    },
    tips: [
      'startTime + duration = aksiyon bitişi',
      'Maksimum startTime + duration = sahne süresi',
      'Aksiyonlar overlap edebilir (paralel)',
      'Süreli kontrol için Timeline Editor\'ı kullan',
    ],
  },
  {
    id: 'transitions',
    title: 'Sahne Geçişleri (Transitions)',
    description: 'Sahneler arasında smooth efektler',
    content: `Transitions, bir sahneden diğerine geçtiğinde görsel efekt ekler. Fade, slide,
    zoom gibi 13 farklı geçiş tipi mevcuttur.`,
    example: {
      code: `const transition = {
  fromSceneId: 'scene-1',
  toSceneId: 'scene-2',
  type: 'fade', // solma efekti
  duration: 800, // 0.8 saniye
  easing: 'ease-in-out'
}`,
      description: 'Fade transition örneği',
    },
    tips: [
      'fade: Saydamlık efekti',
      'slide-left/right/up/down: Kaydırma',
      'zoom-in/out: Yakınlaş/Uzaklaş',
      'rotate: Döndürme',
      'blur: Bulanıklaştırma',
      'wipe: Sürükleme efekti',
    ],
  },
  {
    id: 'recording',
    title: 'Otomatik Kayıt',
    description: 'Otomasyonları video olarak kaydet',
    content: `Recording Studio, timeline oynatılırken otomatik olarak ekranı kaydedebilir.
    Bu sayede sunumlarınız, eğitim videoları vb. çok kolayca oluşturabilirsiniz.`,
    tips: [
      '"Otomatik Kayıt" seçeneğini etkin bırak',
      'Play\'e bastığında kayıt otomatik başlar',
      'Stop\'a bastığında kayıt biter',
      'Audio + Video kaydı mümkün',
      'İndir butonuyla MP4 olarak indir',
    ],
  },
  {
    id: 'playback',
    title: 'Oynatma Kontrolleri',
    description: 'Timeline\'ı oynat ve kontrol et',
    content: `Oluşturduğunuz timeline\'ı çeşitli şekillerde oynatabilirsiniz. Hız, loop,
    seek gibi kontroller mevcuttur.`,
    tips: [
      'Play: Oynatma başlat',
      'Pause: Duraklat',
      'Stop: Durdur ve başa dön',
      'Speed: 0.25x - 4x arasında hız kontrol',
      'Loop: Sonsuz tekrar oynatma',
      'Seek: Belirli bir noktaya git',
    ],
  },
];

const ACTION_GUIDES: Record<ActionType, string> = {
  scroll: 'Sayfayı Y ekseninde kaydır. targetPosition.y değerini ayarla.',
  zoom: 'Canvas zoom seviyesini değiştir. fromZoom > toZoom yakınlaş, < ise uzaklaş.',
  navigate: 'Başka bir URL\'ye yönlendir. Otomatik sayfa geçişi.',
  'style-change': 'Hedef öğenin CSS stillerini değiştir (opacity, color, size vb.).',
  'item-change': 'ContentItem özelliklerini güncelle (title, description vb.).',
  'layout-change': 'Grid ↔ Canvas layout geçişi yap.',
  'item-add': 'Yeni item ekle timeline sırasında.',
  'item-remove': 'Var olan item\'ı sil. Fade-out animasyonu ile çıkar.',
  'item-move': 'Item\'ı yeni pozisyona taşı. startPos > targetPos interpolasyon.',
  animation: 'Fade, scale, rotate, slide gibi genel animasyon efektleri uygula.',
  wait: 'Belirtilen süre bekle. Diğer aksiyonların bitmesini beklemek için kullan.',
  'camera-move': 'Canvas kamerasını taşı ve zoom et (pan & zoom).',
};

export function TutorialMode({ onStepComplete, onLoadExample }: TutorialModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedActionGuide, setExpandedActionGuide] = useState<ActionType | null>(null);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  const handleStepComplete = useCallback(() => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep.id);
    setCompletedSteps(newCompleted);

    if (onStepComplete) {
      onStepComplete(currentStep.id);
    }

    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStep.id, completedSteps, currentStepIndex, onStepComplete]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex]);

  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">
                Adım {currentStepIndex + 1} / {TUTORIAL_STEPS.length}
              </span>
              <span className="text-sm text-slate-400">
                {completedSteps.size} tamamlandı
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{
                  width: `${((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{currentStep.title}</CardTitle>
              <p className="text-sm text-slate-400">{currentStep.description}</p>
            </div>
            <BookOpen className="h-6 w-6 text-blue-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Content */}
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {currentStep.content}
          </div>

          <Separator className="bg-slate-700" />

          {/* Example Code */}
          {currentStep.example && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200">
                💡 Örnek: {currentStep.example.description}
              </h4>
              <pre className="p-3 bg-slate-900 rounded text-xs text-slate-300 overflow-x-auto border border-slate-700">
                {currentStep.example.code}
              </pre>
            </div>
          )}

          {/* Tips */}
          {currentStep.tips && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200">📝 İpuçları:</h4>
              <ul className="space-y-1">
                {currentStep.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-400 flex gap-2">
                    <span className="text-blue-400">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator className="bg-slate-700" />

          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStepIndex === 0}
              className="border-slate-600 hover:bg-slate-700"
            >
              ← Önceki
            </Button>

            <Button
              onClick={handleStepComplete}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              ✓ Anladım
            </Button>

            <Button
              variant="outline"
              onClick={handleNextStep}
              disabled={currentStepIndex === TUTORIAL_STEPS.length - 1}
              className="border-slate-600 hover:bg-slate-700"
            >
              Sonraki →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Steps List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tüm Adımlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {TUTORIAL_STEPS.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isActive = index === currentStepIndex;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(index)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2",
                    isActive
                      ? "bg-blue-600 text-white"
                      : isCompleted
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span className="flex-1 text-sm">{step.title}</span>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Types Guide */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Aksiyon Türleri Rehberi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(Object.entries(ACTION_GUIDES) as [ActionType, string][]).map(
            ([actionType, description]) => (
              <button
                key={actionType}
                onClick={() =>
                  setExpandedActionGuide(
                    expandedActionGuide === actionType ? null : actionType
                  )
                }
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between",
                  expandedActionGuide === actionType
                    ? "bg-purple-600/20 border border-purple-500"
                    : "bg-slate-700/50 hover:bg-slate-700 border border-slate-600"
                )}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">{actionType}</span>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expandedActionGuide === actionType && "rotate-90"
                  )}
                />
              </button>
            )
          )}

          {expandedActionGuide && (
            <div className="mt-3 p-3 bg-slate-900 rounded border border-slate-600">
              <p className="text-sm text-slate-300">
                {ACTION_GUIDES[expandedActionGuide]}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="flex gap-2 p-3 bg-blue-500/10 rounded border border-blue-500/30">
        <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-semibold">💡 Öğrenme İpucu:</p>
          <p>Her adımı tamamladıktan sonra "Anladım" butonuna tıkla. Tüm adımları
          tamamladığında sertifika alacaksın!</p>
        </div>
      </div>
    </div>
  );
}

export default TutorialMode;
