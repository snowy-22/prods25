'use client';

import { TV25LogoV1, TV25LogoV2, TV25LogoV3, TV25LogoV4, TV25LogoV5, TV25LogoSimple } from '@/components/logos';
import { useState } from 'react';

export default function LogosPage() {
  const [downloadStatus, setDownloadStatus] = useState<Record<string, boolean>>({});

  const downloadSVG = (svgId: string, fileName: string) => {
    const svgElement = document.getElementById(svgId);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadStatus(prev => ({ ...prev, [svgId]: true }));
    setTimeout(() => {
      setDownloadStatus(prev => ({ ...prev, [svgId]: false }));
    }, 2000);
  };

  const logos = [
    {
      id: 'logo-simple',
      component: <TV25LogoSimple size={280} />,
      name: 'Simple (TV 25)',
      description: 'Sadece TV ve 25 yazısı - Auth sayfası için ideal',
      fileName: 'tv25-simple.svg',
      recommended: true
    },
    {
      id: 'logo-v1',
      component: <TV25LogoV1 size={200} />,
      name: 'Modern Split',
      description: 'Ayrık tipografi, separator line',
      fileName: 'tv25-modern-split.svg'
    },
    {
      id: 'logo-v2',
      component: <TV25LogoV2 size={150} />,
      name: 'Retro TV Icon',
      description: 'TV ekranı içinde logo',
      fileName: 'tv25-retro-tv.svg'
    },
    {
      id: 'logo-v3',
      component: <TV25LogoV3 size={200} />,
      name: 'Minimal Geometric',
      description: 'Geometrik şekiller + .app suffix',
      fileName: 'tv25-geometric.svg'
    },
    {
      id: 'logo-v4',
      component: <TV25LogoV4 size={130} />,
      name: 'Bold Stacked',
      description: 'Dikey layout, TV üstte 25 altta',
      fileName: 'tv25-stacked.svg'
    },
    {
      id: 'logo-v5',
      component: <TV25LogoV5 size={240} />,
      name: 'Tech Neon',
      description: 'Neon glow efekti, pulse animasyon',
      fileName: 'tv25-neon.svg'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            TV25 Logo Gallery
          </h1>
          <p className="text-white/60 text-lg">
            6 farklı tipografik versiyon - İstediğinizi indirin
          </p>
        </div>

        {/* Logo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all relative group"
            >
              {logo.recommended && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg">
                  ⭐ ÖNERİLEN
                </div>
              )}
              
              {/* Logo Preview */}
              <div className="bg-slate-900/50 rounded-xl p-8 mb-6 flex items-center justify-center min-h-[200px]">
                <div id={logo.id}>
                  {logo.component}
                </div>
              </div>

              {/* Logo Info */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2">{logo.name}</h3>
                <p className="text-white/60 text-sm">{logo.description}</p>
              </div>

              {/* Download Button */}
              <button
                onClick={() => downloadSVG(logo.id, logo.fileName)}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                  downloadStatus[logo.id]
                    ? 'bg-green-600 text-white'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/50'
                }`}
              >
                {downloadStatus[logo.id] ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    İndirildi!
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    SVG İndir
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Kullanım Talimatları</h2>
          <div className="space-y-3 text-white/80">
            <p>
              <strong className="text-cyan-400">1. ÖNERİLEN:</strong> "Simple (TV 25)" versiyonu - Auth sayfası için tasarlandı
            </p>
            <p>
              <strong className="text-blue-400">2. İndirme:</strong> Her logonun altındaki "SVG İndir" butonuna tıklayın
            </p>
            <p>
              <strong className="text-purple-400">3. Kullanım:</strong> İndirilen SVG dosyalarını Figma, Illustrator veya web projenizde kullanabilirsiniz
            </p>
            <p>
              <strong className="text-pink-400">4. Özelleştirme:</strong> Gradient renkleri ve boyutlar component içinde değiştirilebilir
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/test-oauth"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-colors"
          >
            ← OAuth Test
          </a>
          <a
            href="/auth"
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all"
          >
            Auth Sayfası (Logo Önizleme) →
          </a>
          <a
            href="/"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-colors"
          >
            🏠 Ana Sayfa
          </a>
        </div>
      </div>
    </div>
  );
}
