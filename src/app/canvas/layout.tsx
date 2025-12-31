
'use client';
import { useEffect, useState } from 'react';
import { AppLogo } from '@/components/icons/app-logo';

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Don't redirect here - let the page.tsx handle authentication
  // Just ensure we're hydrated before rendering
  if (!isHydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <AppLogo className="h-16 w-16 text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
