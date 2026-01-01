import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppProvider } from '@/providers/app-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { LogTracker } from '@/components/log-tracker';

export const metadata: Metadata = {
  title: 'CanvasFlow - Sınırsız Dijital Kanvas',
  description: 'Fikirlerinizi organize edin, projelerinizi yönetin, yaratıcılığınızı keşfedin.',
  keywords: ['canvas', 'dijital kanvas', 'proje yönetimi', 'not alma', 'organizasyon'],
  authors: [{ name: 'CanvasFlow' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'icon',
      url: '/favicon.svg',
      type: 'image/svg+xml',
    },
  },
  openGraph: {
    title: 'CanvasFlow',
    description: 'Fikirleriniz için sınırsız bir kanvas',
    type: 'website',
    images: [
      {
        url: '/favicon.svg',
        width: 192,
        height: 192,
        alt: 'CanvasFlow Logo',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CanvasFlow',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased')}>
        <AuthProvider>
          <AppProvider>
            <LogTracker />
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
