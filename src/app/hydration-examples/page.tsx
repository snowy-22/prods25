'use client';

import { useState, useEffect } from 'react';
import { HydrationWrapper, ClientOnly, DeferredComponent, useSafeLocalStorage } from '@/components/hydration-wrapper';

/**
 * HYDRATION ÖRNEKLERI - Next.js 16 App Router
 * 
 * Hydration Sorunu Nedir?
 * ========================
 * Server-side render (SSR) sırasında HTML üretilir.
 * Browser'a gelen bu HTML, React tarafından "hydrate" edilir (etkileşim eklenir).
 * Eğer server'da render edilen HTML, browser'daki render'dan farklıysa:
 * - Warning: Text content did not match
 * - Hata: Expected server HTML to contain...
 * 
 * Sık Nedenler:
 * 1. new Date() - Server ve client'da farklı zamanlar
 * 2. Math.random() - Server ve client farklı değerler üretir
 * 3. localStorage/sessionStorage - Server'da erişim yok
 * 4. window/document objesi - Server'da yok
 * 5. useEffect bağımlılıkları yanlış
 * 
 * Çözümler:
 * =========
 */

// ✅ ÖRNEK 1: Hydration Wrapper ile Async Component
export function Example1_HydrationWrapper() {
  return (
    <HydrationWrapper>
      <div className="p-4 border rounded-lg bg-blue-50">
        <h3 className="font-bold mb-2">✅ Örnek 1: HydrationWrapper</h3>
        <p className="text-sm text-slate-700">
          Bu bileşen sadece hydration bitince render edilir.
          Dinamik içerik burada güvenli.
        </p>
        <DynamicContent />
      </div>
    </HydrationWrapper>
  );
}

// ✅ ÖRNEK 2: ClientOnly Component
export function Example2_ClientOnly() {
  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="font-bold mb-2">✅ Örnek 2: ClientOnly</h3>
      <p className="text-sm text-slate-700">
        Server'da skip edilir, sadece client'da render edilir.
      </p>
      <ClientOnly>
        <WindowAccessComponent />
      </ClientOnly>
    </div>
  );
}

// ✅ ÖRNEK 3: useEffect ile Hydration Kontrolü
export function Example3_UseEffect() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-purple-50">
      <h3 className="font-bold mb-2">✅ Örnek 3: useEffect Pattern</h3>
      {!mounted ? (
        <p className="text-sm text-slate-600">Yükleniyor...</p>
      ) : (
        <p className="text-sm text-slate-700">
          Şu an: {new Date().toLocaleTimeString('tr-TR')}
        </p>
      )}
    </div>
  );
}

// ✅ ÖRNEK 4: Safe localStorage Hook
export function Example4_SafeLocalStorage() {
  const [theme, setTheme] = useSafeLocalStorage('app-theme', 'light');

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="font-bold mb-2">✅ Örnek 4: useSafeLocalStorage</h3>
      <p className="text-sm text-slate-700 mb-3">
        Tema: <strong>{theme || 'Yükleniyor...'}</strong>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setTheme('light')}
          className="text-xs px-3 py-1 rounded bg-white border"
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className="text-xs px-3 py-1 rounded bg-slate-700 text-white"
        >
          Dark
        </button>
      </div>
    </div>
  );
}

// ✅ ÖRNEK 5: Conditional Rendering
export function Example5_ConditionalRendering() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-pink-50">
      <h3 className="font-bold mb-2">✅ Örnek 5: Conditional Rendering</h3>
      
      {/* Server'da gösterilir */}
      {!isHydrated && (
        <p className="text-sm text-slate-600">
          📡 Server render (skeleton, placeholder, vb)
        </p>
      )}

      {/* Sadece client'da gösterilir */}
      {isHydrated && (
        <div className="text-sm space-y-2">
          <p className="text-slate-700">✓ Hydration tamamlandı</p>
          <p className="text-xs text-slate-600">
            RAM: {Math.round(performance.memory?.usedJSHeapSize / 1048576)}MB
          </p>
        </div>
      )}
    </div>
  );
}

// ✅ ÖRNEK 6: Deferred Loading (Lazy)
export function Example6_DeferredComponent() {
  return (
    <div className="p-4 border rounded-lg bg-cyan-50">
      <h3 className="font-bold mb-2">✅ Örnek 6: Deferred Component</h3>
      <p className="text-sm text-slate-700 mb-3">
        Heavy component lazy loading:
      </p>
      <DeferredComponent>
        <HeavyComponent />
      </DeferredComponent>
    </div>
  );
}

// ✅ ÖRNEK 7: RSC ve Client Component Kombinasyonu
export function Example7_RSCPattern() {
  return (
    <div className="p-4 border rounded-lg bg-orange-50">
      <h3 className="font-bold mb-2">✅ Örnek 7: RSC + Client Pattern</h3>
      <p className="text-sm text-slate-700 mb-3">
        Server'da verileri al, client'da görüntüle:
      </p>
      <StaticDataWrapper>
        <ClientInteractiveComponent />
      </StaticDataWrapper>
    </div>
  );
}

// ===== HELPER COMPONENTS =====

function DynamicContent() {
  const [count, setCount] = useState(0);
  return (
    <div className="mt-3 p-2 bg-white rounded border-l-2 border-blue-500">
      <p className="text-xs mb-2">Dinamik Counter: {count}</p>
      <button
        onClick={() => setCount(c => c + 1)}
        className="text-xs px-2 py-1 rounded bg-blue-600 text-white"
      >
        +1
      </button>
    </div>
  );
}

function WindowAccessComponent() {
  const [screenSize, setScreenSize] = useState('');

  useEffect(() => {
    setScreenSize(`${window.innerWidth}x${window.innerHeight}`);
  }, []);

  return (
    <div className="mt-3 p-2 bg-white rounded border-l-2 border-green-500">
      <p className="text-xs text-slate-700">
        Ekran Boyutu: {screenSize || 'Yükleniyor...'}
      </p>
    </div>
  );
}

function HeavyComponent() {
  return (
    <div className="mt-3 p-2 bg-white rounded border-l-2 border-cyan-500 text-xs">
      <p>⚡ Heavy component yüklendi (Deferred)</p>
      <ul className="mt-2 ml-4 list-disc text-slate-600 space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>Veri {i + 1}</li>
        ))}
      </ul>
    </div>
  );
}

function StaticDataWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 p-2 bg-white rounded border-l-2 border-orange-500">
      <p className="text-xs text-slate-600 mb-2">📊 Server Data:</p>
      {children}
    </div>
  );
}

function ClientInteractiveComponent() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="text-xs space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 hover:underline"
      >
        {isExpanded ? '▼' : '▶'} Detayları Aç
      </button>
      {isExpanded && (
        <div className="ml-4 p-2 bg-slate-100 rounded text-slate-700">
          <p>✓ Client tarafından interaktif hale getirildi</p>
          <p>✓ useEffect, onClick, vb kullanılabilir</p>
        </div>
      )}
    </div>
  );
}

// ===== DEMO SAYFASI =====

export default function HydrationExamplesPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Hydration Örnekleri</h1>
        <p className="text-slate-600 mb-8">
          Next.js 16 App Router'da SSR/CSR mismatch sorunlarını çözmek için pattern'ler
        </p>

        <div className="space-y-4">
          <Example1_HydrationWrapper />
          <Example2_ClientOnly />
          <Example3_UseEffect />
          <Example4_SafeLocalStorage />
          <Example5_ConditionalRendering />
          <Example6_DeferredComponent />
          <Example7_RSCPattern />
        </div>

        {/* Best Practices */}
        <div className="mt-12 p-6 bg-white rounded-lg border-2 border-green-500">
          <h2 className="text-xl font-bold mb-4">✅ Best Practices</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <strong>1. Conditional Mounting</strong>
              <code className="block bg-slate-100 p-2 mt-1 text-xs rounded">
                {`const [isMounted, setIsMounted] = useState(false);
useEffect(() => setIsMounted(true), []);
return isMounted ? <Component /> : <Skeleton />;`}
              </code>
            </div>

            <div>
              <strong>2. useEffect ile Synchronization</strong>
              <code className="block bg-slate-100 p-2 mt-1 text-xs rounded">
                {`useEffect(() => {
  // Bu sadece client'da çalışır
  setValue(localStorage.getItem('key'));
}, []);`}
              </code>
            </div>

            <div>
              <strong>3. HydrationWrapper kullan</strong>
              <code className="block bg-slate-100 p-2 mt-1 text-xs rounded">
                {`<HydrationWrapper>
  <DynamicComponent />
</HydrationWrapper>`}
              </code>
            </div>

            <div>
              <strong>4. Suppressed Warnings</strong>
              <code className="block bg-slate-100 p-2 mt-1 text-xs rounded">
                {`// Bileşeni 'use client' mark'la
'use client'`}
              </code>
            </div>
          </div>
        </div>

        {/* Debugging */}
        <div className="mt-6 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <h2 className="text-lg font-bold mb-3">🔍 Hydration Sorunlarını Hata Ayıklama</h2>
          <ol className="space-y-2 text-sm list-decimal list-inside text-slate-700">
            <li>DevTools Console'da "Warning: Text content did not match" ara</li>
            <li>Uyarı hangi component'den geldiğini bulup inspect et</li>
            <li>Server render (SSR) vs Client render'ı karşılaştır</li>
            <li>useEffect, useState'i kontrol et</li>
            <li>new Date(), Math.random(), localStorage çağrılarını kontrol et</li>
            <li>suppressHydrationWarning prop'unu gerekirse kullan (son çare)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
