'use client';

import { useEffect } from 'react';
import { useAchievements } from '@/components/ui/achievement-notification';

/**
 * Achievement Loader - localStorage'dan başarımları yükler ve ekranda gösterir
 * Auth sonrası sayfalar arası geçişte başarımların görünmesini sağlar
 */
export function AchievementLoader() {
  const { addAchievement } = useAchievements();

  useEffect(() => {
    // localStorage'dan pending achievements'ı oku
    const pendingAchievementsRaw = localStorage.getItem('pending-achievements');
    if (!pendingAchievementsRaw) return;

    try {
      const pendingAchievements = JSON.parse(pendingAchievementsRaw);
      
      if (Array.isArray(pendingAchievements) && pendingAchievements.length > 0) {
        // Her başarımı sırasıyla ekle (sequential display için)
        pendingAchievements.forEach((achievement: any) => {
          addAchievement(achievement);
        });

        // localStorage'ı temizle (başarımlar gösterildi)
        localStorage.removeItem('pending-achievements');
        console.log('✓ Başarımlar yüklendi ve localStorage temizlendi');
      }
    } catch (error) {
      console.error('Başarımlar yüklenirken hata:', error);
      // Hatalı veriyi temizle
      localStorage.removeItem('pending-achievements');
    }
  }, [addAchievement]);

  // Bu component hiçbir şey render etmez, sadece side effect çalıştırır
  return null;
}
