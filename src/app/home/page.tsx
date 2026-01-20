'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Home page - redirects to canvas
 * 
 * This page serves as the main entry point.
 * URL structure:
 * - tv25.app/home → Ana sayfa (Canvas'a yönlendirir)
 * - tv25.app/[username] → Kullanıcı profil kanvası
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to canvas for now
    // In the future, this could be a custom home page
    router.replace('/canvas');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    </div>
  );
}
