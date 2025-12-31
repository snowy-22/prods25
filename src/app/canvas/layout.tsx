
'use client';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppLogo } from '@/components/icons/app-logo';

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [username] = useLocalStorage<string | null>('canvasflow_username', null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only redirect if we are hydrated and username is still null
    if (isHydrated && username === null) {
      router.push('/');
    }
  }, [username, router, isHydrated]);

  // While not hydrated or username is null, show loading.
  if (!isHydrated || username === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <AppLogo className="h-16 w-16 text-primary" />
      </div>
    );
  }

  // If there's a username, render the canvas page.
  return <>{children}</>;
}
