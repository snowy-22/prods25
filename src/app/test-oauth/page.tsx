'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type TestResult = {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
};

export default function OAuthTestPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { id: '1', name: 'Cookie Storage Test', status: 'pending', message: 'Bekliyor...' },
    { id: '2', name: 'Session Test', status: 'pending', message: 'Bekliyor...' },
    { id: '3', name: 'Storage Quota Test', status: 'pending', message: 'Bekliyor...' },
    { id: '4', name: 'Realtime Status Test', status: 'pending', message: 'Bekliyor...' },
  ]);

  const updateTest = (id: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  useEffect(() => {
    const runTests = async () => {
      const supabase = createClient();

      // Test 1: Cookie Storage
      updateTest('1', { status: 'running', message: 'Çalıştırılıyor...' });
      try {
        const cookies = document.cookie.split(';').filter(c => c.includes('sb-'));
        const cookieNames = cookies.map(c => c.split('=')[0].trim());
        
        if (cookies.length >= 3 && cookieNames.includes('sb-access-token')) {
          updateTest('1', {
            status: 'success',
            message: `✅ ${cookies.length} cookie bulundu`,
            details: cookieNames
          });
        } else {
          updateTest('1', {
            status: 'error',
            message: `❌ Yetersiz cookie (${cookies.length}/3)`,
            details: cookieNames
          });
        }
      } catch (error: any) {
        updateTest('1', {
          status: 'error',
          message: '❌ Hata: ' + error.message,
        });
      }

      // Test 2: Session
      updateTest('2', { status: 'running', message: 'Çalıştırılıyor...' });
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (data?.session?.user?.email) {
          updateTest('2', {
            status: 'success',
            message: `✅ Giriş başarılı: ${data.session.user.email}`,
            details: {
              userId: data.session.user.id,
              email: data.session.user.email,
              provider: data.session.user.app_metadata?.provider
            }
          });
        } else {
          updateTest('2', {
            status: 'error',
            message: '❌ Oturum bulunamadı - Lütfen önce giriş yapın',
          });
        }
      } catch (error: any) {
        updateTest('2', {
          status: 'error',
          message: '❌ Hata: ' + error.message,
        });
      }

      // Test 3: Storage Quota
      updateTest('3', { status: 'running', message: 'Çalıştırılıyor...' });
      try {
        const { data, error } = await supabase
          .from('user_storage_quotas')
          .select('*')
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            updateTest('3', {
              status: 'error',
              message: '❌ Quota kaydı yok - Migration çalıştırıldı mı?',
              details: error
            });
          } else if (error.code === '42P01') {
            updateTest('3', {
              status: 'error',
              message: '❌ user_storage_quotas tablosu yok - Migration çalıştırılmalı!',
              details: error
            });
          } else {
            throw error;
          }
        } else if (data) {
          const quotaGB = (data.quota_bytes / (1024 ** 3)).toFixed(2);
          const usedMB = (data.used_bytes / (1024 ** 2)).toFixed(2);
          
          updateTest('3', {
            status: 'success',
            message: `✅ Quota: ${quotaGB} GB, Kullanılan: ${usedMB} MB`,
            details: data
          });
        }
      } catch (error: any) {
        updateTest('3', {
          status: 'error',
          message: '❌ Hata: ' + error.message,
          details: error
        });
      }

      // Test 4: Realtime Status (console log taraması)
      updateTest('4', { status: 'running', message: 'Çalıştırılıyor...' });
      try {
        // Console.log geçmişini tarayamayız, bu yüzden gerçek zamanlı kontrol edelim
        const channel = supabase.channel('test-realtime-check');
        
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: 5 saniye içinde yanıt yok')), 5000)
        );
        
        const realtimeCheck = new Promise((resolve, reject) => {
          channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_preferences' }, () => {})
            .subscribe((status: string) => {
              if (status === 'SUBSCRIBED') {
                resolve('SUBSCRIBED');
              } else if (status === 'CLOSED') {
                reject(new Error('Realtime kapalı - Supabase Dashboard\'da enable edin'));
              }
            });
        });

        const status = await Promise.race([realtimeCheck, timeout]);
        
        channel.unsubscribe();
        
        updateTest('4', {
          status: 'success',
          message: `✅ Realtime aktif: ${status}`,
        });
      } catch (error: any) {
        updateTest('4', {
          status: 'error',
          message: '❌ ' + error.message,
          details: 'REALTIME_SETUP_GUIDE.md dosyasını okuyun ve tabloları aktif edin'
        });
      }
    };

    // 1 saniye bekleyip testleri başlat
    const timer = setTimeout(runTests, 1000);
    return () => clearTimeout(timer);
  }, []);

  const allPassed = tests.every(t => t.status === 'success');
  const anyRunning = tests.some(t => t.status === 'running');
  const anyFailed = tests.some(t => t.status === 'error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">OAuth Test Suite</h1>
              <p className="text-white/60">Otomatik test sonuçları</p>
            </div>
          </div>

          {/* Overall Status */}
          <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
            {anyRunning && (
              <div className="flex items-center gap-3 text-blue-400">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
                <span className="font-medium">Testler çalışıyor...</span>
              </div>
            )}
            {!anyRunning && allPassed && (
              <div className="flex items-center gap-3 text-green-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-lg">Tüm testler başarılı! 🎉</span>
              </div>
            )}
            {!anyRunning && anyFailed && (
              <div className="flex items-center gap-3 text-red-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-lg">Bazı testler başarısız!</span>
              </div>
            )}
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            {tests.map((test) => (
              <div
                key={test.id}
                className={`p-4 rounded-lg border ${
                  test.status === 'success'
                    ? 'bg-green-500/10 border-green-500/30'
                    : test.status === 'error'
                    ? 'bg-red-500/10 border-red-500/30'
                    : test.status === 'running'
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {test.status === 'running' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                      )}
                      {test.status === 'success' && (
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {test.status === 'error' && (
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      {test.status === 'pending' && (
                        <div className="w-4 h-4 rounded-full bg-white/20"></div>
                      )}
                      <span className="font-semibold text-white">{test.name}</span>
                    </div>
                    <p className={`text-sm ${
                      test.status === 'success' ? 'text-green-300' :
                      test.status === 'error' ? 'text-red-300' :
                      test.status === 'running' ? 'text-blue-300' :
                      'text-white/60'
                    }`}>
                      {test.message}
                    </p>
                    {test.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-white/40 hover:text-white/60">
                          Detayları göster
                        </summary>
                        <pre className="mt-2 p-2 bg-black/20 rounded text-xs text-white/80 overflow-x-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-colors"
            >
              🔄 Testleri Tekrar Çalıştır
            </button>
            <a
              href="/auth"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all"
            >
              🔐 OAuth Login Sayfası
            </a>
            <a
              href="/"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-colors"
            >
              🏠 Ana Sayfa
            </a>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h3 className="text-yellow-300 font-semibold mb-2">📋 Test Talimatları</h3>
            <ul className="text-yellow-200/80 text-sm space-y-1">
              <li>1. Önce <code className="bg-black/20 px-1 rounded">/auth</code> sayfasından giriş yapın</li>
              <li>2. Bu sayfayı yenileyerek testleri çalıştırın</li>
              <li>3. Tüm testler yeşil ✅ olmalı</li>
              <li>4. Realtime hatası alırsanız: <code className="bg-black/20 px-1 rounded">REALTIME_SETUP_GUIDE.md</code> dosyasını okuyun</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
