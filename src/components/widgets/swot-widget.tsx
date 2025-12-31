
'use client';

import React from 'react';

export default function SwotWidget({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  return (
    <div className="grid grid-cols-2 h-full w-full p-4 gap-4 bg-background">
      <div className="flex flex-col p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border-2 border-green-200 dark:border-green-900/50">
        <h3 className="font-bold text-green-700 dark:text-green-400 mb-2">Güçlü Yönler</h3>
        <ul className="text-sm space-y-1 list-disc list-inside opacity-80">
          <li>Hızlı Karar Alma</li>
          <li>Yenilikçi Teknoloji</li>
        </ul>
      </div>
      <div className="flex flex-col p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border-2 border-red-200 dark:border-red-900/50">
        <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">Zayıf Yönler</h3>
        <ul className="text-sm space-y-1 list-disc list-inside opacity-80">
          <li>Sınırlı Bütçe</li>
          <li>Marka Bilinirliği</li>
        </ul>
      </div>
      <div className="flex flex-col p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-900/50">
        <h3 className="font-bold text-blue-700 dark:text-blue-400 mb-2">Fırsatlar</h3>
        <ul className="text-sm space-y-1 list-disc list-inside opacity-80">
          <li>Yeni Pazarlar</li>
          <li>Dijital Dönüşüm</li>
        </ul>
      </div>
      <div className="flex flex-col p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border-2 border-orange-200 dark:border-orange-900/50">
        <h3 className="font-bold text-orange-700 dark:text-orange-400 mb-2">Tehditler</h3>
        <ul className="text-sm space-y-1 list-disc list-inside opacity-80">
          <li>Güçlü Rakipler</li>
          <li>Ekonomik Belirsizlik</li>
        </ul>
      </div>
    </div>
  );
}
