// LandingPageDemoGrid.tsx
// Demo grid for landing page, shows example content and allows hero word change
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const demoItems = [
  {
    title: 'YouTube Canlı',
    description: 'YouTube canlı yayını embed örneği',
    url: 'https://www.youtube.com/embed/5qap5aO4i9A',
    type: 'video',
    color: 'from-red-500 to-yellow-400',
    heroWord: 'Yayın Akışını',
  },
  {
    title: 'Web Sitesi',
    description: 'Bir web sitesini ekranda gösterin',
    url: 'https://www.wikipedia.org',
    type: 'iframe',
    color: 'from-blue-500 to-cyan-400',
    heroWord: 'İnternet Deneyimini',
  },
  {
    title: 'Sunum',
    description: 'Sunum veya eğitim içeriği',
    url: 'https://docs.google.com/presentation/d/1GJ6w9Qw6w8Qw6w8Qw6w8Qw6w8Qw6w8Qw6w8Qw6w8Qw',
    type: 'iframe',
    color: 'from-purple-500 to-pink-400',
    heroWord: 'Sunum & Eğitim Araçları',
  },
  {
    title: 'AI Asistan',
    description: 'Yapay zeka ile sohbet',
    url: '/ai',
    type: 'ai',
    color: 'from-green-500 to-lime-400',
    heroWord: 'Yapay Zeka ve 3D Dünyası',
  },
];

export const LandingPageDemoGrid: React.FC<{
  onHeroWordChange?: (word: string) => void;
  isHeaderVisible?: boolean;
  onToggleHeader?: () => void;
}> = ({ onHeroWordChange, isHeaderVisible, onToggleHeader }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {demoItems.map((item, idx) => (
        <Card key={item.title} className={`bg-gradient-to-br ${item.color} p-0 overflow-hidden relative`}>
          <CardHeader className="z-10 relative">
            <CardTitle className="text-white drop-shadow-lg">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="z-10 relative">
            <p className="text-white/80 mb-4">{item.description}</p>
            {item.type === 'video' && (
              <iframe
                src={item.url}
                title={item.title}
                className="w-full aspect-video rounded-lg border border-white/20 shadow-lg"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
            {item.type === 'iframe' && (
              <iframe
                src={item.url}
                title={item.title}
                className="w-full h-48 rounded-lg border border-white/20 shadow-lg bg-white"
              />
            )}
            {item.type === 'ai' && (
              <Button asChild variant="secondary" className="mt-2">
                <a href="/login">AI Asistanı Dene</a>
              </Button>
            )}
            <div className="mt-4 flex gap-2">
              {onHeroWordChange && (
                <Button size="sm" variant="outline" onClick={() => onHeroWordChange(item.heroWord)}>
                  Hero Yazısını Göster
                </Button>
              )}
              {onToggleHeader && (
                <Button size="sm" variant="ghost" onClick={onToggleHeader}>
                  {isHeaderVisible ? 'Headerı Gizle' : 'Headerı Göster'}
                </Button>
              )}
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-black/30 z-0" />
        </Card>
      ))}
    </div>
  );
};
