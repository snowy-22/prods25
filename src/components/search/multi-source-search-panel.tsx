
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchAiResult, fetchWebResults, fetchYoutubeResults } from '@/lib/search-apis';

export default function MultiSourceSearchPanel() {
  const [query, setQuery] = useState('');
  const searchHistory = useAppStore(s => s.searchHistory);
  const addSearchHistory = useAppStore(s => s.addSearchHistory);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [aiResult, setAiResult] = useState<string>('');
  const [webResults, setWebResults] = useState<any[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live search on query change
  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setAiResult('');
    setWebResults([]);
    setYoutubeResults([]);
    let cancelled = false;
    addSearchHistory(query);
    Promise.all([
      fetchAiResult(query).then(r => { if (!cancelled) setAiResult(r); }).catch(() => { if (!cancelled) setError('AI sonuç alınamadı'); }),
      fetchWebResults(query).then(r => { if (!cancelled) setWebResults(r); }).catch(() => { if (!cancelled) setError('Web sonuç alınamadı'); }),
      fetchYoutubeResults(query).then(r => { if (!cancelled) setYoutubeResults(r); }).catch(() => { if (!cancelled) setError('YouTube sonuç alınamadı'); })
    ]).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [query]);

  // Music context detection (simple)
  const isMusic = /müzik|şarkı|music|song|spotify|apple/i.test(query);

  return (
    <div className="flex flex-col gap-6 p-6 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl shadow-2xl w-full max-w-5xl mx-auto">
      <div className="relative">
        <input
          ref={inputRef}
          className="px-5 py-3 rounded-xl border border-white/20 w-full text-lg mb-2 bg-white/5 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Anahtar kelimeyle arayın..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowHistory(true);
          }}
          onFocus={() => setShowHistory(true)}
          onBlur={() => setTimeout(() => setShowHistory(false), 150)}
          autoFocus
        />
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute left-0 right-0 top-14 z-20 bg-white/90 text-black rounded-xl shadow-lg max-h-64 overflow-y-auto border border-white/30">
            {searchHistory.slice(0, 10).map(item => (
              <button
                key={item.id}
                className="w-full text-left px-4 py-2 hover:bg-indigo-100 text-sm border-b border-white/10 last:border-b-0"
                onMouseDown={e => {
                  e.preventDefault();
                  setQuery(item.query);
                  setShowHistory(false);
                  inputRef.current?.focus();
                }}
              >
                {item.query}
                <span className="float-right text-xs text-gray-400">{new Date(item.createdAt).toLocaleTimeString()}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Result */}
        <div className="bg-white/10 rounded-xl p-4 flex flex-col min-h-[220px]">
          <div className="font-bold mb-3 text-indigo-200 text-lg flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" alt="AI" className="w-6 h-6" />
            AI Sonucu
          </div>
          {loading ? <div className="text-indigo-100 animate-pulse">Yükleniyor...</div> : <div className="text-white/90 whitespace-pre-line">{aiResult}</div>}
          {isMusic && (
            <div className="mt-4">
              <div className="font-semibold text-xs mb-1">Spotify</div>
              <iframe src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M" width="100%" height="80" frameBorder="0" allow="encrypted-media"></iframe>
              <div className="font-semibold text-xs mt-2 mb-1">Apple Music</div>
              <iframe allow="autoplay *; encrypted-media *;" frameBorder="0" height="80" style={{width:'100%',maxWidth:'660px',overflow:'hidden',background:'transparent'}} sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation" src="https://embed.music.apple.com/tr/playlist/turkiye-top-50/pl.4d6b5b3b2b2b4b3b8b3b3b3b3b3b3b3b"></iframe>
            </div>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-white/70">Daha fazla sonuç:</span>
              {/* AI Provider Logos */}
              <a href="https://chat.openai.com" target="_blank" rel="noopener" title="ChatGPT">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" alt="ChatGPT" className="w-6 h-6 hover:scale-110 transition" />
              </a>
              <a href="https://gemini.google.com" target="_blank" rel="noopener" title="Gemini">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Google_Gemini_logo.svg" alt="Gemini" className="w-6 h-6 hover:scale-110 transition" />
              </a>
              <a href="https://claude.ai" target="_blank" rel="noopener" title="Claude">
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Anthropic_Claude_logo.svg" alt="Claude" className="w-6 h-6 hover:scale-110 transition" />
              </a>
              <a href="https://www.perplexity.ai/" target="_blank" rel="noopener" title="Perplexity">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Perplexity_AI_logo.svg" alt="Perplexity" className="w-6 h-6 hover:scale-110 transition" />
              </a>
            </div>
          </div>
        </div>
        {/* Web Results */}
        <div className="bg-white/10 rounded-xl p-4 flex flex-col min-h-[220px]">
          <div className="font-bold mb-3 text-indigo-200 text-lg flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Web" className="w-5 h-5" />
            Web Sonuçları
          </div>
          <div className="flex-1">
            {webResults.length === 0 && !loading && <div className="text-white/60 text-sm">Sonuç yok</div>}
            {webResults.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener"
                className="block text-blue-200 hover:underline mb-1 text-sm truncate cursor-grab"
                draggable
                onDragStart={e => {
                  // Mark as a draggable web result for native drop
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.dropEffect = 'copy';
                  const payload = {
                    type: 'web-link',
                    title: r.title,
                    url: r.url,
                    source: 'web',
                  };
                  e.dataTransfer.setData('application/json', JSON.stringify(payload));
                  // Provide text/plain fallback for browsers stripping custom types
                  e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                }}
                onClick={e => {
                  // Always open in new tab, also for mobile (prevent default if needed)
                  if (window && window.open) {
                    e.preventDefault();
                    window.open(r.url, '_blank', 'noopener');
                  }
                }}
              >
                {r.title}
              </a>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button className="flex items-center gap-1 text-xs underline px-2 py-1 bg-white/5 rounded hover:bg-white/10" onClick={()=>window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`,'_blank')}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-4 h-4" />
              Google'da ara
            </button>
            <button className="flex items-center gap-1 text-xs underline px-2 py-1 bg-white/5 rounded hover:bg-white/10" onClick={()=>window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,'_blank')}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" alt="YouTube" className="w-6 h-4" />
              YouTube'da ara
            </button>
          </div>
        </div>
        {/* YouTube Results */}
        <div className="bg-white/10 rounded-xl p-4 flex flex-col min-h-[220px]">
          <div className="font-bold mb-3 text-indigo-200 text-lg flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" alt="YouTube" className="w-7 h-5" />
            YouTube Sonuçları
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {youtubeResults.slice(0,3).map((v,i)=>(
              <div key={v.id} className="mb-2 cursor-grab" draggable
                onDragStart={e => {
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.dropEffect = 'copy';
                  const payload = {
                    type: 'youtube-video',
                    title: v.title,
                    url: `https://www.youtube.com/watch?v=${v.id}`,
                    videoId: v.id,
                    source: 'youtube',
                  };
                  e.dataTransfer.setData('application/json', JSON.stringify(payload));
                  e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                }}
              >
                <iframe width="100%" height="120" src={`https://www.youtube.com/embed/${v.id}`} title={v.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                <div className="text-xs mt-1 text-white/80 truncate">{v.title}</div>
              </div>
            ))}
            <div className="flex gap-1 mt-2">
              {youtubeResults.slice(3,8).map((v,i)=>(
                <div key={v.id} className="w-1/5 cursor-grab" draggable
                  onDragStart={e => {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.dropEffect = 'copy';
                    const payload = {
                      type: 'youtube-video',
                      title: v.title,
                      url: `https://www.youtube.com/watch?v=${v.id}`,
                      videoId: v.id,
                      source: 'youtube',
                    };
                    e.dataTransfer.setData('application/json', JSON.stringify(payload));
                    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                  }}
                >
                  <iframe width="100%" height="60" src={`https://www.youtube.com/embed/${v.id}`} title={v.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
              ))}
            </div>
          </div>
          <button className="mt-4 text-xs underline" onClick={()=>window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,'_blank')}>Daha fazla sonuç</button>
        </div>
      </div>
    </div>
  );
}
