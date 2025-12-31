'use client';

import { useState } from 'react';
import { Search, Clock, Star, Folder, Video, Calendar, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';

export function NewTabScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { tabs, openInNewTab } = useAppStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Trigger global search or navigate
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(searchUrl, '_blank');
  };

  // Get recently accessed tabs
  const recentTabs = tabs
    .filter(t => t.lastAccessedAt && t.type !== 'new-tab')
    .sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0))
    .slice(0, 8);

  const shortcuts = [
    { icon: Folder, label: 'Kitaplık', action: () => {} },
    { icon: Video, label: 'Videolar', action: () => {} },
    { icon: Calendar, label: 'Takvim', action: () => {} },
    { icon: Award, label: 'Ödüller', action: () => {} },
    { icon: Star, label: 'Favoriler', action: () => {} },
    { icon: Clock, label: 'Son Ziyaretler', action: () => {} },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      {/* Logo / Branding */}
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
          CanvasFlow
        </h1>
        <p className="text-slate-400 text-lg">Dijital alanınızı keşfedin</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-2xl mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Web'de ara veya URL gir..."
            className="w-full h-14 pl-12 pr-4 text-lg bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-full focus:bg-white/15 focus:border-purple-500 transition-all"
          />
        </div>
      </form>

      {/* Shortcuts Grid */}
      <div className="w-full max-w-4xl mb-12">
        <h2 className="text-white text-xl font-semibold mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {shortcuts.map((shortcut, idx) => (
            <Button
              key={idx}
              variant="ghost"
              onClick={shortcut.action}
              className="h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              <shortcut.icon className="w-8 h-8 text-purple-400" />
              <span className="text-sm text-slate-300">{shortcut.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Recently Visited */}
      {recentTabs.length > 0 && (
        <div className="w-full max-w-4xl">
          <h2 className="text-white text-xl font-semibold mb-4">Son Ziyaret Edilen Sekmeler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentTabs.map((tab) => (
              <Card
                key={tab.id}
                className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer transition-all group"
                onClick={() => {
                  // Switch to existing tab
                  useAppStore.getState().setActiveTab(tab.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {tab.icon && (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
                        {tab.icon.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate group-hover:text-purple-400 transition-colors">
                        {tab.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {new Date(tab.lastAccessedAt || Date.now()).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-8 text-center text-slate-500 text-sm">
        <p>Yeni bir sekme açmak için <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl+T</kbd> tuşlarına basın</p>
      </div>
    </div>
  );
}
