'use client';

import { useEffect, useState, ReactNode } from 'react';

/**
 * Hydration Wrapper - SSR/CSR mismatch sorunlarını çözer
 * 
 * Kullanım:
 * <HydrationWrapper>
 *   <YourComponent />
 * </HydrationWrapper>
 * 
 * Bu component sayesinde:
 * - Server-side ve client-side render'lar senkronize olur
 * - Dinamik içerik güvenli bir şekilde render edilir
 * - localStorage ve window objelerine erişim sorunsuz
 */
export function HydrationWrapper({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    // Skeleton loader gösterebi lirsiniz
    return null;
  }

  return <>{children}</>;
}

/**
 * Client-only component - Sadece client-side render edilir
 * SSR'da skip edilir, browser'da render edilir
 * 
 * Kullanım:
 * <ClientOnly>
 *   <ComponentWithWindowAccess />
 * </ClientOnly>
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <>{children}</> : null;
}

/**
 * Deferred Component - İlk load'u hızlı tutar, dinamik içeriği lazy load eder
 * 
 * Kullanım:
 * <DeferredComponent>
 *   <HeavyComponent />
 * </DeferredComponent>
 */
export function DeferredComponent({ children }: { children: ReactNode }) {
  const [isDeferred, setIsDeferred] = useState(false);

  useEffect(() => {
    // Bir frame sonra render et (deferred)
    const timeoutId = setTimeout(() => setIsDeferred(true), 0);
    return () => clearTimeout(timeoutId);
  }, []);

  return isDeferred ? <>{children}</> : null;
}

/**
 * Safe localStorage wrapper - Hydration aman localStorage erişimi
 */
export function useSafeLocalStorage(key: string, defaultValue: string = '') {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    // Sadece browser'da oku
    const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (stored) {
      setValue(stored);
    }
  }, [key]);

  const setStoredValue = (newValue: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, newValue);
      setValue(newValue);
    }
  };

  return [value, setStoredValue] as const;
}
