'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useSafeLocalStorage } from '@/components/hydration-wrapper';

export interface GuestSession {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  isGuest: true;
  email?: string;
}

/**
 * Guest Login Hook - Misafir oturumu yönetimi
 * 
 * Kullanım:
 * const { guestSession, isGuest, loginAsGuest, logout } = useGuestLogin();
 */
export function useGuestLogin() {
  const router = useRouter();
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useSafeLocalStorage('guest_session_id', '');

  // Oturumu yükle
  useEffect(() => {
    if (sessionId) {
      // Mevcut oturumu al
      const session: GuestSession = {
        id: sessionId,
        createdAt: localStorage.getItem(`guest_created_${sessionId}`) || new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        isGuest: true,
      };
      setGuestSession(session);
    }
    setIsLoading(false);
  }, [sessionId]);

  // Misafir olarak giriş yap
  const loginAsGuest = () => {
    const newSessionId = uuidv4();
    const now = new Date().toISOString();
    
    setSessionId(newSessionId);
    localStorage.setItem(`guest_created_${newSessionId}`, now);
    
    const session: GuestSession = {
      id: newSessionId,
      createdAt: now,
      lastActivityAt: now,
      isGuest: true,
    };
    
    setGuestSession(session);
    router.push('/guest-canvas');
  };

  // Oturum kapat
  const logout = () => {
    if (sessionId) {
      localStorage.removeItem(`guest_created_${sessionId}`);
      localStorage.removeItem('guest_session_id');
    }
    setGuestSession(null);
    setSessionId('');
    router.push('/');
  };

  // Etkinlik kaydı
  const logActivity = () => {
    if (guestSession) {
      const updated = {
        ...guestSession,
        lastActivityAt: new Date().toISOString(),
      };
      setGuestSession(updated);
    }
  };

  return {
    guestSession,
    isGuest: !!guestSession,
    isLoading,
    loginAsGuest,
    logout,
    logActivity,
  };
}

/**
 * Guest Analytics Tracker - Misafir kullanıcı istatistikleri
 * 
 * Kullanım:
 * const { trackEvent, trackView } = useGuestAnalytics();
 * trackEvent('button_click', { buttonName: 'Sign Up' });
 */
export function useGuestAnalytics() {
  const { guestSession } = useGuestLogin();
  const [events, setEvents] = useState<any[]>([]);

  const trackEvent = (eventName: string, data: Record<string, any> = {}) => {
    if (!guestSession) return;

    const event = {
      id: uuidv4(),
      sessionId: guestSession.id,
      eventName,
      data,
      timestamp: new Date().toISOString(),
    };

    // LocalStorage'a kaydet
    const storedEvents = JSON.parse(localStorage.getItem('guest_events') || '[]');
    storedEvents.push(event);
    localStorage.setItem('guest_events', JSON.stringify(storedEvents.slice(-100))); // Son 100 event

    setEvents([...events, event]);
  };

  const trackView = (pageName: string) => {
    trackEvent('page_view', { page: pageName });
  };

  const trackConversion = (conversionType: string, value: number = 0) => {
    trackEvent('conversion', { type: conversionType, value });
  };

  return {
    trackEvent,
    trackView,
    trackConversion,
    events,
  };
}

/**
 * Guest Auth Guard - Misafir kontrolü
 * 
 * Kullanım:
 * if (!guestSession && !isAuth) {
 *   return <GuestAuthGuard onLoginClick={handleLogin} />;
 * }
 */
export function GuestAuthGuard({
  onLoginClick,
  onSignupClick,
  onGuestClick,
}: {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onGuestClick: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-2xl max-w-md">
        <h2 className="text-2xl font-bold mb-2">Bu özelliği kullanmak için giriş yapın</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Hesap oluşturun veya misafir olarak devam edin
        </p>

        <div className="space-y-3">
          <button
            onClick={onSignupClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
          >
            Üye Ol
          </button>
          <button
            onClick={onLoginClick}
            className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium py-3 rounded-lg transition"
          >
            Giriş Yap
          </button>
          <button
            onClick={onGuestClick}
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium py-3 rounded-lg transition border border-slate-300 dark:border-slate-600"
          >
            Misafir Olarak Devam Et
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
          Misafir modunda sınırlı özelliklerle canvas'ı keşfedebilirsiniz
        </p>
      </div>
    </div>
  );
}
