'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Code,
  Lightbulb,
  Clock,
  Zap,
  Filter,
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  examples?: Array<{
    title: string;
    code: string;
    explanation: string;
  }>;
  tips?: string[];
}

const DOCUMENTATION_SECTIONS: DocSection[] = [
  {
    id: 'timing-basics',
    title: 'Zamanlama Temelleri',
    icon: <Clock className="h-5 w-5" />,
    content: `Zamanlama, Recording Studio\'nun kalbidir. Her aksiyon bir başlangıç zamanı (startTime) 
    ve bir süresi (duration) ile tanımlanır.`,
    examples: [
      {
        title: 'Basit Sıralı Aksiyonlar',
        code: `// Aksiyon 1: 0-2000ms
{ type: 'scroll', startTime: 0, duration: 2000 }

// Aksiyon 2: 2000-4000ms (Aksiyon 1 bittikten sonra)
{ type: 'zoom', startTime: 2000, duration: 2000 }

// Toplam sahne süresi: 4000ms (4 saniye)`,
        explanation:
          'Aksiyonlar sırayla oynatılır. Sonraki aksiyon bir öncekinin bitiminden itibaren başlar.',
      },
      {
        title: 'Paralel Aksiyonlar',
        code: `// Aksiyon 1: 0-3000ms
{ type: 'scroll', startTime: 0, duration: 3000 }

// Aksiyon 2: 500-2500ms (Aksiyon 1 ile overlap ediyor)
{ type: 'zoom', startTime: 500, duration: 2000 }

// Toplam sahne süresi: 3000ms (3 saniye)`,
        explanation:
          'Aksiyonlar başlangıç zamanlarına göre paralel çalışabilir. Bu daha dinamik efektler sağlar.',
      },
      {
        title: 'Gecikmeli Başlangıç',
        code: `// Sahnede hemen hiçbir şey olmuyor
// 2 saniye sonra aksiyon başlıyor
{ type: 'wait', startTime: 0, duration: 2000 }
{ type: 'animation', startTime: 2000, duration: 1500 }

// Toplam: 3500ms (3.5 saniye)`,
        explanation: 'wait aksiyonuyla gecikme oluşturabilirsiniz.',
      },
    ],
    tips: [
      'startTime + duration = aksiyon bitişi zamanı',
      'Maksimum bitişi zamanı ≤ sahne süresi olmalı',
      'Parallel aksiyonlar süslü ve dinamik görünüyor',
      'Sıralı aksiyonlar daha kontrollü ve basit',
    ],
  },
  {
    id: 'easing-functions',
    title: 'Easing Fonksiyonları',
    icon: <Zap className="h-5 w-5" />,
    content: `Easing fonksiyonları, bir aksiyonun başından sonuna kadar nasıl ilerleyeceğini belirler.
    Doğal ve hoş görünüşlü animasyonlar oluşturmak için gereklidir.`,
    examples: [
      {
        title: 'Linear vs Ease-Out',
        code: `// Linear: Sabit hız (doğal değil)
{ type: 'scroll', duration: 2000, easing: 'linear' }

// Ease-Out: Hızlı başlangıç, yavaş bitiş (daha doğal)
{ type: 'scroll', duration: 2000, easing: 'ease-out-cubic' }`,
        explanation:
          'ease-out, UI animasyonları için ideal. Nesne hızlı başlayıp yavaşlayarak durur.',
      },
      {
        title: 'Bounce Efekti',
        code: `// Sıçrayan bir animasyon
{ 
  type: 'animation', 
  duration: 1000, 
  easing: 'bounce-out',
  properties: { fromScale: 0.5, toScale: 1 }
}`,
        explanation:
          'Bounce easing, çocuksu/eğlenceli efektler için harika. Oyuncak gibi davranır.',
      },
      {
        title: 'Elastic Efekti',
        code: `// Elastik bir dalgalanma
{ 
  type: 'animation', 
  duration: 1500, 
  easing: 'elastic-in-out'
}`,
        explanation:
          'Jelly/elastik hareketi simüle eder. Dikkat çekici ve yaratıcı efektler için.',
      },
    ],
    tips: [
      'linear: 0% başlangıç → 100% bitiş (hiç hızlanma yok)',
      'ease-in: Yavaş başla, hızlı bitir',
      'ease-out: Hızlı başla, yavaş bitir (çoğu durumda en iyi)',
      'ease-in-out: Yavaş başla, orta hızlı, yavaş bitir',
      'sine/quad/cubic/quart/expo: Artan güçte easing curves',
      'bounce/elastic: Eğlenceli efektler',
    ],
  },
  {
    id: 'action-types',
    title: 'Aksiyon Türleri Detaylı',
    icon: <Zap className="h-5 w-5" />,
    content: `Recording Studio\'da 12 farklı aksiyon türü vardır. Her birinin özel özellikleri vardır.`,
    examples: [
      {
        title: 'Scroll Aksiyonu',
        code: `{
  type: 'scroll',
  startTime: 0,
  duration: 2000,
  easing: 'ease-in-out',
  targetPosition: {
    x: 0,      // Yatay kaydır (0 = kaydırma yok)
    y: 500     // Dikey kaydır (500px aşağı)
  }
}`,
        explanation:
          'Sayfayı belirtilen pozisyona smooth scroll eder. x ve y değerlerini ayarla.',
      },
      {
        title: 'Zoom Aksiyonu',
        code: `{
  type: 'zoom',
  startTime: 1000,
  duration: 1500,
  easing: 'ease-out',
  fromZoom: 1,    // Başlangıç zoom (1 = %100)
  toZoom: 2       // Bitiş zoom (2 = %200)
}`,
        explanation:
          'Canvas zoom seviyesini değiştirir. 1 normal, <1 uzaklaş, >1 yakınlaş.',
      },
      {
        title: 'Navigate Aksiyonu',
        code: `{
  type: 'navigate',
  startTime: 3000,
  duration: 100,   // Neredeyse instant
  targetUrl: '/about',
  openInNewTab: false
}`,
        explanation:
          'Farklı bir URL\'ye yönlendir. Sunumunda sayfa değiştirmek için ideal.',
      },
      {
        title: 'Animation Aksiyonu',
        code: `{
  type: 'animation',
  startTime: 0,
  duration: 800,
  easing: 'ease-out',
  animationType: 'fade-in',  // fade-in, fade-out, scale-up, scale-down, rotate, slide-left, slide-right
  targetItemId: 'item-123'   // Opsiyonel
}`,
        explanation:
          'Fade, scale, rotate gibi genel animasyon efektleri uygula.',
      },
    ],
    tips: [
      'Her aksiyon türü özel bir amaca hizmet eder',
      'targetItemId varsa, o item üzerinde aksiyon yapılır',
      'Properties, aksiyon türüne göre değişir',
      'Easing, animasyon etkisini büyük ölçüde değiştirir',
    ],
  },
  {
    id: 'timing-templates',
    title: 'Zamanlama Şablonları',
    icon: <Clock className="h-5 w-5" />,
    content: `Yaygın kullanım alanları için hazır zamanlama şablonları. Kopyala-yapıştır ile kullan.`,
    examples: [
      {
        title: 'Hızlı Tanıtım (5 saniye)',
        code: `const quickIntro = {
  scenes: [{
    name: 'Açılış',
    duration: 2000,
    actions: [
      { type: 'zoom', startTime: 0, duration: 2000, fromZoom: 2, toZoom: 1 }
    ]
  }, {
    name: 'İçerik',
    duration: 2000,
    actions: [
      { type: 'scroll', startTime: 0, duration: 2000, targetPosition: { y: 300 } }
    ]
  }, {
    name: 'Kapanış',
    duration: 1000,
    actions: [
      { type: 'animation', startTime: 0, duration: 1000, animationType: 'fade-out' }
    ]
  }]
}`,
        explanation:
          'Zoom in → Scroll → Fade out. Hızlı ve etkili. Toplam: 5 saniye',
      },
      {
        title: 'Eğitim Videosu Yapısı',
        code: `const tutorialStructure = {
  scenes: [
    { name: 'Başlık', duration: 3000 },
    { name: 'Adım 1', duration: 5000 },
    { name: 'Adım 2', duration: 5000 },
    { name: 'Adım 3', duration: 5000 },
    { name: 'Özet', duration: 3000 }
  ]
}

// Toplam: 21 saniye video`,
        explanation:
          'Her adım arasında geçiş efektleri (transitions) ekleyebilirsin.',
      },
      {
        title: 'Demo Sunumu (Slow-motion)',
        code: `const demoShow = {
  scenes: [{
    name: 'Özellik 1',
    duration: 8000, // Uzun süreli
    actions: [
      { type: 'animation', startTime: 0, duration: 2000, animationType: 'fade-in' },
      { type: 'scroll', startTime: 2000, duration: 3000, targetPosition: { y: 200 } },
      { type: 'wait', startTime: 5000, duration: 3000 }
    ]
  }]
}`,
        explanation:
          'Uzun aksiyonlar ve bekleme zamanları. Her detay açıkça görülür.',
      },
    ],
    tips: [
      'Kısa videolar: 3-10 saniye sahneler',
      'Eğitim videoları: 5-15 saniye sahneler',
      'Demo videoları: 8-20 saniye sahneler',
      'Sahneler arasında geçiş süresi de zamanlama\'ya dahil et',
    ],
  },
  {
    id: 'best-practices',
    title: 'En İyi Uygulamalar',
    icon: <Lightbulb className="h-5 w-5" />,
    content: `Recording Studio ile en iyi sonuçlar elde etmek için izlemen gereken önemli kurallar.`,
    tips: [
      '✓ Sahne süresi >= tüm aksiyonlarının toplamı',
      '✓ Açılış ve kapanış sahneleri kısa tutma (2-3 saniye)',
      '✓ ease-out veya ease-in-out easing kullan (doğal görünüyor)',
      '✓ Parallel aksiyonlarla dinamik efektler oluştur',
      '✓ wait aksiyonuyla izleyici için "nefes alma" alanı bırak',
      '✓ Zoom animasyonlarını scroll ile birleştir (profesyonel görünüm)',
      '✗ Çok hızlı zamanlama (0.5s altında aksiyon)',
      '✗ 100+ aksiyon (performans problemi)',
      '✗ Tüm aksiyonları parallel (kaotik görünüyor)',
      '✗ Timeline süresi 10+ dakika (başlangıç yavaş)',
      '→ Zoom 0.25x ve 4x arasında kullan',
      '→ Renk animasyonlarında interpolation kullan',
      '→ Video kaydı için auto-record seçeneğini aç',
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Sorun Giderme',
    icon: <Lightbulb className="h-5 w-5" />,
    content: `Yaygın sorunlar ve çözümleri.`,
    tips: [
      '"Aksiyon oynatılmıyor": startTime ve duration doğru mı? Scene süresi yeterli mi?',
      '"Video kaydı başlamıyor": Browser başka tab\'ında kayıt yapıyor mu? Permissions verdim mi?',
      '"Animasyon pürüzlü": Hız çok hızlı mı? Duration\'ı artır (minimum 300ms).',
      '"Zoom/Scroll keskin": ease-linear yerine ease-in-out kullan.',
      '"Timeline çok uzun yükleniyor": Sahne sayısını azalt veya Validator\'ı kontrol et.',
      '"Geçişler (transitions) görülmüyor": fromSceneId/toSceneId doğru mı? Duration yeterli mi?',
    ],
  },
];

interface HelperDocumentationProps {
  compact?: boolean;
}

export function HelperDocumentation({ compact = false }: HelperDocumentationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    compact ? new Set() : new Set(['timing-basics'])
  );

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = DOCUMENTATION_SECTIONS.filter(
    (section) =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.tips?.some((tip) =>
        tip.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Filter className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Belgelerde ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded text-slate-300',
            'placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors'
          )}
        />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filteredSections.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-center text-slate-400">Sonuç bulunamadı.</p>
            </CardContent>
          </Card>
        ) : (
          filteredSections.map((section) => {
            const isExpanded = expandedSections.has(section.id);

            return (
              <Card key={section.id} className="bg-slate-800 border-slate-700 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full text-left p-4 hover:bg-slate-700/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400">{section.icon}</div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">
                        {section.title}
                      </h3>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <>
                    <Separator className="bg-slate-700" />
                    <CardContent className="pt-4 space-y-4">
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {section.content}
                      </p>

                      {section.examples && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-slate-300">
                            Örnekler:
                          </h4>
                          {section.examples.map((example, idx) => (
                            <div key={idx} className="space-y-2">
                              <p className="text-xs font-medium text-slate-300">
                                {example.title}
                              </p>
                              <pre className="p-2 bg-slate-900 rounded text-xs text-slate-300 overflow-x-auto border border-slate-700">
                                {example.code}
                              </pre>
                              <p className="text-xs text-slate-400">
                                💡 {example.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {section.tips && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-slate-300">
                            İpuçları:
                          </h4>
                          <ul className="space-y-1">
                            {section.tips.map((tip, idx) => (
                              <li key={idx} className="text-xs text-slate-400">
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default HelperDocumentation;
