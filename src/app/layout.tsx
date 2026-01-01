import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppProvider } from '@/providers/app-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { LogTracker } from '@/components/log-tracker';
import { VercelAnalytics } from '@/components/vercel-analytics';

export const metadata: Metadata = {
  title: 'tv25 - Sınırsız Dijital Kanvas',
  description: 'Fikirlerinizi organize edin, projelerinizi yönetin, yaratıcılığınızı keşfedin.',
  keywords: ['canvas', 'dijital kanvas', 'proje yönetimi', 'not alma', 'organizasyon'],
  authors: [{ name: 'tv25' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover', // For notched phones
  },
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
    title: 'tv25',
    description: 'Fikirleriniz için sınırsız bir kanvas',
    type: 'website',
    images: [
      {
        url: '/favicon.svg',
        width: 192,
        height: 192,
        alt: 'tv25 Logo',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'tv25',
    startupImage: [
      {
        url: '/apple-touch-icon.png',
        media: '(device-width: 390px) and (device-height: 844px)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  manifest: '/manifest.json',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* Viewport & iOS Support */}
        <meta charSet="utf-8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="tv25" />
        
        {/* Safe Area Support (notched phones) */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=yes, minimum-scale=1, maximum-scale=5" />
        
        {/* iOS Fixed Position Fix */}
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Prevent iOS zoom on input focus */}
        <style>{`
          @supports (padding: max(0px)) {
            html {
              padding-left: max(0px, env(safe-area-inset-left));
              padding-right: max(0px, env(safe-area-inset-right));
              padding-top: max(0px, env(safe-area-inset-top));
              padding-bottom: max(0px, env(safe-area-inset-bottom));
            }
          }
          
          /* iOS 15+ Input Fix */
          input, textarea, select {
            font-size: 16px; /* Prevents zoom on iOS */
          }
          
          /* Prevent double tap zoom */
          input[type="text"], input[type="email"], input[type="password"], 
          textarea, button, [role="button"] {
            touch-action: manipulation;
          }
        `}</style>
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased overflow-hidden')}>
        <AuthProvider>
          <AppProvider>
            <LogTracker />
            {children}
            <VercelAnalytics />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
