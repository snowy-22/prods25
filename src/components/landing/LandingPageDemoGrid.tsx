// LandingPageDemoGrid.tsx
// Infinite circular carousel with 9 demo pages, hover navigation, random button, mini AI chat, achievements
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Send, Bot, Sparkles, ArrowRight, Dice5, Clock, Calendar, Calculator, Cloud, CloudRain, Sun, Snowflake, Music, Image, FileText, Globe, Zap, Save, UserPlus, Gauge, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { AchievementNotification, useAchievements } from '@/components/ui/achievement-notification';

// Mini AI Chat component for the AI Asistan demo card
const MiniAIChat: React.FC = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai'; text: string}[]>([
    { role: 'ai', text: 'Merhaba! 👋 TV25 hakkında sorularınızı yanıtlayabilirim.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = ['TV25 nedir?', 'Ücretsiz mi?', 'Nasıl başlarım?'];

  const getAIResponse = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes('nedir')) return 'TV25, videolarınızı ve widget\'larınızı tek tuvalde organize eden güçlü bir platform! 🎬';
    if (q.includes('ücretsiz') || q.includes('fiyat')) return 'Evet! Ücretsiz planımız var. Hemen başlayın! 💰';
    if (q.includes('başla') || q.includes('kayıt')) return 'Çok kolay! "Ücretsiz Başla" butonuna tıklayın. 🚀';
    return 'Harika soru! Hemen kayıt olup keşfedin! ✨';
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input.trim() }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: getAIResponse(input) }]);
      setIsTyping(false);
    }, 600);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900/50 to-gray-900/80 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-600/20 border-b border-emerald-500/30">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
          <Bot className="w-3 h-3 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-white">TV25 AI</p>
          <p className="text-[10px] text-emerald-300 flex items-center gap-1">
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />Çevrimiçi
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[80px] max-h-[120px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] px-2 py-1 rounded-xl text-xs ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/90'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 px-2 py-1 rounded-xl flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="px-2 pb-1">
        <div className="flex flex-wrap gap-1">
          {quickReplies.map((reply) => (
            <button key={reply} onClick={() => setInput(reply)} className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600/50">
              {reply}
            </button>
          ))}
        </div>
      </div>
      <div className="p-1.5 border-t border-white/10">
        <div className="flex gap-1">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Sorun..." className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-xs h-7" />
          <Button size="sm" onClick={handleSend} className="bg-emerald-600 hover:bg-emerald-700 h-7 w-7 p-0">
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Mini Widget components for demo
const MiniClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-2">
      <Clock className="w-6 h-6 text-blue-400 mb-1" />
      <p className="text-xl font-mono text-white">{time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
      <p className="text-xs text-white/60">{time.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
    </div>
  );
};

const MiniCalendarWidget: React.FC = () => {
  const today = new Date();
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-800 to-red-900 rounded-lg p-2">
      <Calendar className="w-5 h-5 text-red-300 mb-1" />
      <p className="text-2xl font-bold text-white">{today.getDate()}</p>
      <p className="text-xs text-white/70">{today.toLocaleDateString('tr-TR', { month: 'long' })}</p>
    </div>
  );
};

// 12 şehir için hava durumu verileri (canlı API entegrasyonu için hazır)
const WEATHER_CITIES = [
  { name: 'İstanbul', temp: 22, icon: 'cloudy' },
  { name: 'İzmir', temp: 28, icon: 'sunny' },
  { name: 'Ankara', temp: 18, icon: 'cloudy' },
  { name: 'Eskişehir', temp: 15, icon: 'rainy' },
  { name: 'Adana', temp: 32, icon: 'sunny' },
  { name: 'Trabzon', temp: 20, icon: 'rainy' },
  { name: 'Muğla', temp: 30, icon: 'sunny' },
  { name: 'Antalya', temp: 31, icon: 'sunny' },
  { name: 'Erzurum', temp: 12, icon: 'snowy' },
  { name: 'Gaziantep', temp: 26, icon: 'cloudy' },
  { name: 'Van', temp: 14, icon: 'snowy' },
  { name: 'Bursa', temp: 21, icon: 'cloudy' },
] as const;

const MiniWeatherWidget: React.FC = () => {
  const [cityIndex, setCityIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCityIndex(prev => (prev + 1) % WEATHER_CITIES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const city = WEATHER_CITIES[cityIndex];
  const getIcon = () => {
    switch (city.icon) {
      case 'sunny': return <Sun className="w-6 h-6 text-yellow-300 mb-1" />;
      case 'rainy': return <CloudRain className="w-6 h-6 text-blue-200 mb-1" />;
      case 'snowy': return <Snowflake className="w-6 h-6 text-white mb-1" />;
      default: return <Cloud className="w-6 h-6 text-white mb-1" />;
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-600 to-blue-700 rounded-lg p-2 relative overflow-hidden">
      <div 
        key={city.name}
        className="flex flex-col items-center animate-in slide-in-from-right-4 duration-500"
      >
        {getIcon()}
        <p className="text-xl font-bold text-white">{city.temp}°C</p>
        <p className="text-xs text-white/70">{city.name}</p>
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-1 left-2 right-2 h-0.5 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white/60 rounded-full transition-all duration-[5000ms] ease-linear"
          style={{ width: '100%', animation: 'shrink 5s linear infinite' }}
        />
      </div>
    </div>
  );
};

const MiniMusicWidget: React.FC = () => {
  const [bars, setBars] = useState([8, 12, 10, 14, 9]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => 6 + Math.floor(Math.random() * 14)));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 to-pink-600 rounded-lg p-2">
      <Music className="w-5 h-5 text-white mb-1" />
      <p className="text-xs text-white font-medium">Now Playing</p>
      <div className="flex gap-0.5 mt-1 items-end h-5">
        {bars.map((h, i) => (
          <div 
            key={i} 
            className="w-1 bg-white/80 rounded-full transition-all duration-200" 
            style={{ height: `${h}px` }} 
          />
        ))}
      </div>
    </div>
  );
};

const TODO_ITEMS = [
  { text: '✅ Proje planı oluştur', done: true },
  { text: '⏳ Tasarım mockup', done: false },
  { text: '📌 API entegrasyonu', done: false },
  { text: '🎯 Test senaryoları', done: false },
];

const MiniNotesWidget: React.FC = () => {
  const [currentItem, setCurrentItem] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentItem(prev => (prev + 1) % TODO_ITEMS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const item = TODO_ITEMS[currentItem];
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg p-2">
      <div className="flex items-center gap-1 mb-1">
        <FileText className="w-4 h-4 text-white/80" />
        <span className="text-[10px] text-white/60">Yapılacaklar</span>
      </div>
      <div className="flex-1 flex items-center">
        <div key={currentItem} className="text-xs text-white/90 animate-in fade-in duration-500">
          {item.text}
        </div>
      </div>
      <div className="flex gap-1 mt-1">
        {TODO_ITEMS.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-1.5 h-1.5 rounded-full ${idx === currentItem ? 'bg-white' : 'bg-white/40'}`} 
          />
        ))}
      </div>
    </div>
  );
};

const MiniImageWidget: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-700 rounded-lg p-2">
    <Image className="w-6 h-6 text-white mb-1" />
    <p className="text-xs text-white/70">Galeri</p>
  </div>
);

const CALC_EXPRESSIONS = ['7 × 6 = 42', '15 + 27 = 42', '84 ÷ 2 = 42', '50 - 8 = 42', '6² + 6 = 42'];

const MiniCalculatorWidget: React.FC = () => {
  const [exprIndex, setExprIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setExprIndex(prev => (prev + 1) % CALC_EXPRESSIONS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-2">
      <Calculator className="w-5 h-5 text-green-400 mb-1" />
      <p 
        key={exprIndex} 
        className="text-sm font-mono text-white animate-in fade-in duration-300"
      >
        {CALC_EXPRESSIONS[exprIndex]}
      </p>
    </div>
  );
};

const MiniWebWidget: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-cyan-600 to-teal-700 rounded-lg p-2">
    <Globe className="w-5 h-5 text-white mb-1" />
    <p className="text-xs text-white/80">Web Görünümü</p>
  </div>
);

const MiniSpeedWidget: React.FC = () => {
  const [speed, setSpeed] = useState(125);
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    // Her 4 saniyede bir yeni test simülasyonu
    const testInterval = setInterval(() => {
      setTesting(true);
      setProgress(0);
      
      // Hız değişimi animasyonu
      let step = 0;
      const speedInterval = setInterval(() => {
        step++;
        setProgress((step / 20) * 100);
        setSpeed(Math.floor(50 + Math.random() * 150));
        
        if (step >= 20) {
          clearInterval(speedInterval);
          setTesting(false);
          setSpeed(Math.floor(80 + Math.random() * 100));
        }
      }, 100);
    }, 6000);
    
    return () => clearInterval(testInterval);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-600 to-red-600 rounded-lg p-2 relative">
      <Gauge className={`w-5 h-5 text-yellow-300 mb-1 ${testing ? 'animate-spin' : ''}`} />
      <p className={`text-lg font-bold text-white ${testing ? 'animate-pulse' : ''}`}>
        {speed} <span className="text-xs font-normal">Mbps</span>
      </p>
      <p className="text-[10px] text-white/60">{testing ? 'Test ediliyor...' : 'Hız Testi'}</p>
      {testing && (
        <div className="absolute bottom-1 left-2 right-2 h-0.5 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Demo card types
type CardType = 'video' | 'iframe' | 'ai' | 'slides' | 'widget';
type WidgetType = 'clock' | 'calendar' | 'weather' | 'music' | 'notes' | 'image' | 'calculator' | 'web' | 'speed';

interface DemoCardData {
  title: string;
  type: CardType;
  url?: string;
  gradient: string;
  widgetType?: WidgetType;
}

// Single demo card component
const CARD_SIZE = 'aspect-[4/3]';

const DemoCard: React.FC<{ card: DemoCardData }> = ({ card }) => {
  const { title, type, url, gradient, widgetType } = card;
  
  const renderWidget = () => {
    switch (widgetType) {
      case 'clock': return <MiniClockWidget />;
      case 'calendar': return <MiniCalendarWidget />;
      case 'weather': return <MiniWeatherWidget />;
      case 'music': return <MiniMusicWidget />;
      case 'notes': return <MiniNotesWidget />;
      case 'image': return <MiniImageWidget />;
      case 'calculator': return <MiniCalculatorWidget />;
      case 'web': return <MiniWebWidget />;
      case 'speed': return <MiniSpeedWidget />;
      default: return null;
    }
  };

  return (
    <Card 
      className={`${CARD_SIZE} ${gradient} p-0 overflow-hidden relative`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="absolute inset-0 z-10 flex flex-col">
        <div className="px-2 py-1.5 bg-black/40 backdrop-blur-sm border-b border-white/10">
          <h4 className="text-white font-medium text-xs truncate">{title}</h4>
        </div>
        <div className="flex-1 p-1.5">
          {type === 'video' && url && (
            <iframe 
              src={url} 
              title={title} 
              className="w-full h-full rounded-md border border-white/20" 
              allow="autoplay; encrypted-media" 
              allowFullScreen 
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {type === 'iframe' && url && (
            <iframe 
              src={url} 
              title={title} 
              className="w-full h-full rounded-md border border-white/20 bg-white" 
              sandbox="allow-scripts allow-same-origin"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {type === 'slides' && url && (
            <iframe 
              src={url} 
              title={title} 
              className="w-full h-full rounded-md border border-white/20 bg-white" 
              allowFullScreen
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {type === 'ai' && <MiniAIChat />}
          {type === 'widget' && renderWidget()}
        </div>
      </div>
      <div className="absolute inset-0 bg-black/20 z-0" />
    </Card>
  );
};

// 9 Demo pages with widgets
const demoPages: { id: number; title: string; cards: DemoCardData[] }[] = [
  {
    id: 1, title: 'Medya & Yapay Zeka',
    cards: [
      { title: 'YouTube Canlı', type: 'video', url: 'https://www.youtube.com/embed/jfKfPfyJRdk', gradient: 'bg-gradient-to-br from-red-600 to-orange-500' },
      { title: 'Web Görünümü', type: 'iframe', url: 'https://en.wikipedia.org/wiki/Main_Page', gradient: 'bg-gradient-to-br from-blue-600 to-cyan-500' },
      { title: 'Google Slides', type: 'slides', url: 'https://docs.google.com/presentation/d/e/2PACX-1vQxkq3j6aDt2FZ_Rpe7FdaYCQPXlJzqFN1qqLMqKQylqAWR9qlZQC0Pg8d9w7s6lg/embed?start=false&loop=false&delayms=3000', gradient: 'bg-gradient-to-br from-purple-600 to-pink-500' },
      { title: 'AI Asistan', type: 'ai', gradient: 'bg-gradient-to-br from-emerald-600 to-teal-500' },
      { title: 'Saat', type: 'widget', widgetType: 'clock', gradient: 'bg-gradient-to-br from-slate-700 to-slate-800' },
      { title: 'Hava Durumu', type: 'widget', widgetType: 'weather', gradient: 'bg-gradient-to-br from-sky-500 to-blue-600' },
    ]
  },
  {
    id: 2, title: 'Eğitim & Sunum',
    cards: [
      { title: 'Eğitim Videosu', type: 'video', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', gradient: 'bg-gradient-to-br from-indigo-600 to-purple-500' },
      { title: 'Khan Academy', type: 'iframe', url: 'https://www.khanacademy.org', gradient: 'bg-gradient-to-br from-teal-600 to-green-500' },
      { title: 'Ders Sunumu', type: 'slides', url: 'https://docs.google.com/presentation/d/e/2PACX-1vRK35qQdT3LwX3ckN9kOHkS3Tk7xjTz1KmL9Vw2BFaJJWqB7Rm4JVfTMiTYC3xGHA/embed?start=false&loop=true&delayms=5000', gradient: 'bg-gradient-to-br from-amber-600 to-yellow-500' },
      { title: 'AI Öğretmen', type: 'ai', gradient: 'bg-gradient-to-br from-rose-600 to-pink-500' },
      { title: 'Takvim', type: 'widget', widgetType: 'calendar', gradient: 'bg-gradient-to-br from-red-700 to-red-800' },
      { title: 'Notlar', type: 'widget', widgetType: 'notes', gradient: 'bg-gradient-to-br from-yellow-500 to-amber-600' },
    ]
  },
  {
    id: 3, title: 'Kurumsal Çözümler',
    cards: [
      { title: 'Toplantı Kaydı', type: 'video', url: 'https://www.youtube.com/embed/ysz5S6PUM-U', gradient: 'bg-gradient-to-br from-slate-600 to-gray-500' },
      { title: 'Dashboard', type: 'iframe', url: 'https://grafana.com', gradient: 'bg-gradient-to-br from-orange-600 to-red-500' },
      { title: 'İş Planı', type: 'slides', url: 'https://docs.google.com/presentation/d/e/2PACX-1vQxkq3j6aDt2FZ_Rpe7FdaYCQPXlJzqFN1qqLMqKQylqAWR9qlZQC0Pg8d9w7s6lg/embed?start=true&loop=true&delayms=3000', gradient: 'bg-gradient-to-br from-cyan-600 to-blue-500' },
      { title: 'Kurumsal AI', type: 'ai', gradient: 'bg-gradient-to-br from-violet-600 to-purple-500' },
      { title: 'Hesap Makinesi', type: 'widget', widgetType: 'calculator', gradient: 'bg-gradient-to-br from-gray-600 to-gray-700' },
      { title: 'Hız Testi', type: 'widget', widgetType: 'speed', gradient: 'bg-gradient-to-br from-orange-500 to-red-500' },
    ]
  },
  {
    id: 4, title: 'Yaratıcı İçerik',
    cards: [
      { title: 'Müzik Videosu', type: 'video', url: 'https://www.youtube.com/embed/kJQP7kiw5Fk', gradient: 'bg-gradient-to-br from-pink-600 to-rose-500' },
      { title: 'Dribbble', type: 'iframe', url: 'https://dribbble.com', gradient: 'bg-gradient-to-br from-fuchsia-600 to-pink-500' },
      { title: 'Mood Board', type: 'slides', url: 'https://docs.google.com/presentation/d/e/2PACX-1vRK35qQdT3LwX3ckN9kOHkS3Tk7xjTz1KmL9Vw2BFaJJWqB7Rm4JVfTMiTYC3xGHA/embed?start=true&loop=true&delayms=2000', gradient: 'bg-gradient-to-br from-lime-600 to-green-500' },
      { title: 'Yaratıcı AI', type: 'ai', gradient: 'bg-gradient-to-br from-sky-600 to-cyan-500' },
      { title: 'Galeri', type: 'widget', widgetType: 'image', gradient: 'bg-gradient-to-br from-indigo-600 to-violet-600' },
      { title: 'Müzik', type: 'widget', widgetType: 'music', gradient: 'bg-gradient-to-br from-purple-600 to-pink-500' },
    ]
  },
  {
    id: 5, title: 'Finans & Analitik',
    cards: [
      { title: 'Piyasa Analizi', type: 'video', url: 'https://www.youtube.com/embed/Xn676-fLq7I', gradient: 'bg-gradient-to-br from-green-600 to-emerald-500' },
      { title: 'TradingView', type: 'iframe', url: 'https://tradingview.com', gradient: 'bg-gradient-to-br from-blue-700 to-indigo-500' },
      { title: 'Finansal Rapor', type: 'slides', url: 'https://docs.google.com/presentation/d/e/2PACX-1vQxkq3j6aDt2FZ_Rpe7FdaYCQPXlJzqFN1qqLMqKQylqAWR9qlZQC0Pg8d9w7s6lg/embed?start=false&loop=false&delayms=5000', gradient: 'bg-gradient-to-br from-yellow-600 to-amber-500' },
      { title: 'Finans AI', type: 'ai', gradient: 'bg-gradient-to-br from-teal-600 to-cyan-500' },
      { title: 'Hesap Makinesi', type: 'widget', widgetType: 'calculator', gradient: 'bg-gradient-to-br from-gray-700 to-gray-800' },
      { title: 'Saat', type: 'widget', widgetType: 'clock', gradient: 'bg-gradient-to-br from-slate-600 to-slate-700' },
    ]
  },
  {
    id: 6, title: 'Sağlık & Wellness',
    cards: [
      { title: 'Yoga Dersi', type: 'video', url: 'https://www.youtube.com/embed/v7AYKMP6rOE', gradient: 'bg-gradient-to-br from-teal-500 to-green-400' },
      { title: 'WebMD', type: 'iframe', url: 'https://www.webmd.com', gradient: 'bg-gradient-to-br from-rose-500 to-red-400' },
      { title: 'Beslenme Planı', type: 'slides', url: 'https://docs.google.com/presentation/d/e/2PACX-1vRK35qQdT3LwX3ckN9kOHkS3Tk7xjTz1KmL9Vw2BFaJJWqB7Rm4JVfTMiTYC3xGHA/embed?start=false&loop=true&delayms=4000', gradient: 'bg-gradient-to-br from-purple-500 to-violet-400' },
      { title: 'Sağlık AI', type: 'ai', gradient: 'bg-gradient-to-br from-cyan-500 to-blue-400' },
      { title: 'Takvim', type: 'widget', widgetType: 'calendar', gradient: 'bg-gradient-to-br from-red-600 to-red-700' },
      { title: 'Hava Durumu', type: 'widget', widgetType: 'weather', gradient: 'bg-gradient-to-br from-sky-500 to-cyan-600' },
    ]
  },
  {
    id: 7, title: 'Oyun & Eğlence',
    cards: [
      { title: 'Game Stream', type: 'video', url: 'https://www.youtube.com/embed/M4KC3rhEHf4', gradient: 'bg-gradient-to-br from-violet-600 to-indigo-500' },
      { title: 'IGN', type: 'iframe', url: 'https://ign.com', gradient: 'bg-gradient-to-br from-red-600 to-orange-500' },
      { title: 'Oyun İnceleme', type: 'slides', url: 'https://docs.google.com/presentation/d/e/2PACX-1vQxkq3j6aDt2FZ_Rpe7FdaYCQPXlJzqFN1qqLMqKQylqAWR9qlZQC0Pg8d9w7s6lg/embed?start=true&loop=true&delayms=3000', gradient: 'bg-gradient-to-br from-blue-600 to-purple-500' },
      { title: 'Gaming AI', type: 'ai', gradient: 'bg-gradient-to-br from-green-600 to-lime-500' },
      { title: 'Müzik', type: 'widget', widgetType: 'music', gradient: 'bg-gradient-to-br from-purple-600 to-pink-500' },
      { title: 'Hız Testi', type: 'widget', widgetType: 'speed', gradient: 'bg-gradient-to-br from-orange-600 to-red-600' },
    ]
  },
  {
    id: 8, title: 'Seyahat & Keşif',
    cards: [
      { title: 'Seyahat Vlog', type: 'video', url: 'https://www.youtube.com/embed/5qap5aO4i9A', gradient: 'bg-gradient-to-br from-amber-500 to-orange-500' },
      { title: 'Haritalar', type: 'iframe', url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d385396.3214146036!2d28.731!3d41.005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14caa7040068086b%3A0xe1ccfe98bc01b0d0!2zxLBzdGFuYnVs!5e0!3m2!1str!2str!4v1', gradient: 'bg-gradient-to-br from-emerald-600 to-teal-500' },
      { title: 'Gezi Planı', type: 'slides', url: 'https://docs.google.com/presentation/d/e/2PACX-1vRK35qQdT3LwX3ckN9kOHkS3Tk7xjTz1KmL9Vw2BFaJJWqB7Rm4JVfTMiTYC3xGHA/embed?start=true&loop=true&delayms=3000', gradient: 'bg-gradient-to-br from-sky-500 to-blue-500' },
      { title: 'Seyahat AI', type: 'ai', gradient: 'bg-gradient-to-br from-rose-500 to-pink-500' },
      { title: 'Hava Durumu', type: 'widget', widgetType: 'weather', gradient: 'bg-gradient-to-br from-sky-600 to-blue-700' },
      { title: 'Takvim', type: 'widget', widgetType: 'calendar', gradient: 'bg-gradient-to-br from-red-600 to-rose-600' },
    ]
  },
  {
    id: 9, title: 'Teknoloji & Haberler',
    cards: [
      { title: 'Tech Review', type: 'video', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', gradient: 'bg-gradient-to-br from-gray-700 to-slate-600' },
      { title: 'TechCrunch', type: 'iframe', url: 'https://techcrunch.com', gradient: 'bg-gradient-to-br from-green-600 to-emerald-500' },
      { title: 'Ürün Sunumu', type: 'slides', url: 'https://docs.google.com/presentation/d/e/2PACX-1vQxkq3j6aDt2FZ_Rpe7FdaYCQPXlJzqFN1qqLMqKQylqAWR9qlZQC0Pg8d9w7s6lg/embed?start=false&loop=true&delayms=4000', gradient: 'bg-gradient-to-br from-blue-600 to-indigo-500' },
      { title: 'Tech AI', type: 'ai', gradient: 'bg-gradient-to-br from-violet-600 to-purple-500' },
      { title: 'Hız Testi', type: 'widget', widgetType: 'speed', gradient: 'bg-gradient-to-br from-orange-500 to-red-500' },
      { title: 'Web', type: 'widget', widgetType: 'web', gradient: 'bg-gradient-to-br from-cyan-600 to-teal-600' },
    ]
  },
];

const heroWords = [
  'Medya Akışını', 'Eğitim İçeriklerini', 'Kurumsal Süreçleri', 'Yaratıcı Projeleri',
  'Finansal Verileri', 'Sağlık Bilgilerini', 'Oyun Deneyimini', 'Seyahat Planlarını', 'Teknoloji Haberlerini'
];

// Random Tab Type
interface RandomTab {
  id: number;
  cards: DemoCardData[];
  createdAt: Date;
}

const MAX_RANDOM_TABS = 5;

export const LandingPageDemoGrid: React.FC<{
  onHeroWordChange?: (word: string) => void;
  isHeaderVisible?: boolean;
  onToggleHeader?: () => void;
}> = ({ onHeroWordChange }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [randomCards, setRandomCards] = useState<DemoCardData[] | null>(null);
  const dragState = useRef({ isPointerDown: false, startX: 0, startY: 0 });
  
  // NEW: Tab-based random system
  const [randomTabs, setRandomTabs] = useState<RandomTab[]>([]);
  const [activeRandomTabId, setActiveRandomTabId] = useState<number | null>(null);
  const [showMembershipMessage, setShowMembershipMessage] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { achievements, addAchievement, removeAchievement } = useAchievements();

  const totalPages = demoPages.length;

  // Save current demo data to localStorage
  const saveCurrentDemo = () => {
    // Save regular page demo
    const demoData = {
      page: currentPage,
      cards: demoPages[currentPage].cards,
      timestamp: new Date().toISOString(),
      pageTitle: demoPages[currentPage].title
    };
    localStorage.setItem('landing-demo-save', JSON.stringify(demoData));
    
    // Save each random tab separately
    if (randomTabs.length > 0) {
      const randomTabsData = randomTabs.map((tab, idx) => ({
        id: tab.id,
        cards: tab.cards,
        timestamp: tab.createdAt.toISOString(),
        title: `Rastgele Klasör ${idx + 1}`
      }));
      localStorage.setItem('landing-demo-random-tabs', JSON.stringify(randomTabsData));
      console.log('Random tabs saved:', randomTabsData.length);
    }
    
    console.log('Demo saved:', demoData);
  };

  // Handle sign-up with demo data
  const handleSignUpWithDemo = () => {
    saveCurrentDemo();
    const savedDemo = localStorage.getItem('landing-demo-save');
    const savedRandomTabs = localStorage.getItem('landing-demo-random-tabs');
    
    if (savedDemo || savedRandomTabs) {
      // Store flag to trigger folder creation after auth
      localStorage.setItem('create-first-folder-from-demo', 'true');
      
      // Store count for auth page message
      if (savedRandomTabs) {
        const tabs = JSON.parse(savedRandomTabs);
        localStorage.setItem('demo-random-count', String(tabs.length));
      }
    }
  };

  // Circular navigation - wraps around
  const goToPage = useCallback((page: number) => {
    let newPage = page;
    if (page < 0) newPage = totalPages - 1;
    if (page >= totalPages) newPage = 0;
    setCurrentPage(newPage);
    setTranslateX(0);
    setActiveRandomTabId(null); // Exit random tab view
    onHeroWordChange?.(heroWords[newPage] || 'Dijital Dünyayı');
  }, [totalPages, onHeroWordChange]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  // Get previous and next page indices for peek effect (circular)
  const prevPageIdx = (currentPage - 1 + totalPages) % totalPages;
  const nextPageIdx = (currentPage + 1) % totalPages;

  // Random shuffle function - Now adds as tabs
  const shuffleCards = () => {
    // If already at max, allow re-randomizing current active random tab
    if (randomTabs.length >= MAX_RANDOM_TABS) {
      if (activeRandomTabId !== null) {
        // Re-randomize the active random tab
        const allCards = demoPages.flatMap(p => p.cards);
        const shuffled = [...allCards].sort(() => Math.random() - 0.5).slice(0, 6);
        setRandomTabs(prev => prev.map(tab => 
          tab.id === activeRandomTabId 
            ? { ...tab, cards: shuffled, createdAt: new Date() }
            : tab
        ));
      } else {
        // Show membership message
        setShowMembershipMessage(true);
        setTimeout(() => setShowMembershipMessage(false), 3000);
      }
      return;
    }
    
    // Create new random tab
    const allCards = demoPages.flatMap(p => p.cards);
    const shuffled = [...allCards].sort(() => Math.random() - 0.5).slice(0, 6);
    const newTabId = Date.now();
    
    const newTab: RandomTab = {
      id: newTabId,
      cards: shuffled,
      createdAt: new Date()
    };
    
    setRandomTabs(prev => [...prev, newTab]);
    setActiveRandomTabId(newTabId);
  };

  // Navigate to a random tab
  const goToRandomTab = (tabId: number) => {
    setActiveRandomTabId(tabId);
    setRandomCards(null); // Clear old random state
  };

  // Navigate back to regular pages
  const goToRegularPage = (page: number) => {
    setActiveRandomTabId(null);
    goToPage(page);
  };

  // Get current cards (from active random tab or from page)
  const currentCards = activeRandomTabId !== null
    ? randomTabs.find(t => t.id === activeRandomTabId)?.cards || demoPages[currentPage].cards
    : demoPages[currentPage].cards;

  // Touch/Mouse handlers for swipe (prevent scroll issues)
  const handleStart = (
    clientX: number,
    clientY: number,
    e?: React.MouseEvent | React.TouchEvent
  ) => {
    dragState.current = { isPointerDown: true, startX: clientX, startY: clientY };
    setIsDragging(false);
    setTranslateX(0);
    if (e) {
      e.stopPropagation();
    }
  };

  const handleMove = (
    clientX: number,
    clientY: number,
    e?: React.MouseEvent | React.TouchEvent
  ) => {
    const { isPointerDown, startX, startY } = dragState.current;
    if (!isPointerDown) return;

    const diffX = clientX - startX;
    const diffY = Math.abs(clientY - startY);

    // If vertical intent is stronger, allow native scroll
    if (!isDragging && diffY > Math.abs(diffX)) {
      return;
    }

    // Activate drag only after a small horizontal threshold to avoid blocking taps
    const dragThreshold = 8;
    if (!isDragging && Math.abs(diffX) < dragThreshold) {
      return;
    }

    if (!isDragging) {
      setIsDragging(true);
    }

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const maxDrag = 200;
    setTranslateX(Math.max(-maxDrag, Math.min(maxDrag, diffX)));
  };

  const handleEnd = (e?: React.MouseEvent | React.TouchEvent) => {
    const { isPointerDown } = dragState.current;
    if (!isPointerDown) return;

    dragState.current.isPointerDown = false;

    if (!isDragging) {
      setTranslateX(0);
      if (e) {
        e.stopPropagation();
      }
      return;
    }

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsDragging(false);
    const threshold = 60;
    if (translateX > threshold) {
      prevPage();
    } else if (translateX < -threshold) {
      nextPage();
    } else {
      setTranslateX(0);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'ArrowRight') nextPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage]);

  return (
    <div className="relative w-full">
      {/* Section Snap Scroll Container */}
      <div
        className="snap-y snap-mandatory overflow-y-auto h-[calc(100vh-120px)]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Each demo page as a snap section */}
        {demoPages.map((page, idx) => (
          <section
            key={idx}
            className="snap-start min-h-[80vh] flex flex-col justify-center items-center"
          >
            <h3 className="text-center text-xl font-bold text-white mb-4">{page.title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-5xl mx-auto px-4">
              {page.cards.map((card, cidx) => (
                <DemoCard key={`${idx}-${cidx}`} card={card} />
              ))}
            </div>
          </section>
        ))}
      </div>
      {/* Bottom CTA */}
      <div className="mt-4 flex flex-col items-center gap-3">
        <Link href="/auth" onClick={handleSignUpWithDemo}>
          <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-8 py-6 text-lg gap-2 shadow-lg shadow-emerald-500/25">
            <UserPlus className="w-5 h-5" />
            Hemen Üye Ol ve Kullanmaya Başla
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <p className="text-white/50 text-sm">Ücretsiz kayıt ol, hemen kullanmaya başla!</p>
      </div>
    </div>
  );
};
