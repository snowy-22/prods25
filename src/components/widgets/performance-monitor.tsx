'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, HardDrive, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  timestamp: number;
}

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const updateMetrics = () => {
      try {
        const perfMemory = (performance as any).memory;
        if (perfMemory) {
          const memoryPercentage = (perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) * 100;
          
          const newMetrics: PerformanceMetrics = {
            memory: {
              used: Math.round(perfMemory.usedJSHeapSize / 1024 / 1024),
              total: Math.round(perfMemory.jsHeapSizeLimit / 1024 / 1024),
              percentage: Math.round(memoryPercentage * 10) / 10,
            },
            timestamp: Date.now(),
          };

          setMetrics(newMetrics);
          setHistory((prev) => [...prev.slice(-59), memoryPercentage]);
        }
      } catch (error) {
        console.error('Error reading performance metrics:', error);
      }

      animationFrameRef.current = requestAnimationFrame(updateMetrics);
    };

    animationFrameRef.current = requestAnimationFrame(updateMetrics);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const getMemoryColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getMemoryBgColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-100';
    if (percentage >= 70) return 'bg-orange-100';
    if (percentage >= 50) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const getBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 70) return 'bg-orange-600';
    if (percentage >= 50) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  // Create SVG mini chart
  const createChart = () => {
    if (history.length === 0) return null;

    const width = 200;
    const height = 80;
    const chartHeight = 60;
    const maxValue = 100;

    const points = history.map((value, idx) => {
      const x = (idx / history.length) * width;
      const y = height - (value / maxValue) * chartHeight - 10;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="w-full h-auto">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="text-blue-500"
        />
        <polyline
          points={points}
          fill="url(#gradient)"
          opacity="0.3"
          className="text-blue-500"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" className="text-blue-400" stopOpacity="0.5" />
            <stop offset="100%" className="text-blue-400" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={CONTAINER_VARIANTS}
      className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <motion.div
        variants={ITEM_VARIANTS}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center gap-3"
      >
        <Activity className="w-6 h-6" />
        <h2 className="text-lg font-bold">Sistem Performans</h2>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {metrics ? (
          <motion.div
            key={metrics.timestamp}
            variants={ITEM_VARIANTS}
            className="space-y-6"
          >
            {/* Memory Usage */}
            <motion.div variants={ITEM_VARIANTS} className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn('p-2 rounded-lg', getMemoryBgColor(metrics.memory.percentage))}>
                    <HardDrive className={cn('w-5 h-5', getMemoryColor(metrics.memory.percentage))} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700">Bellek Kullanımı</h3>
                    <p className="text-xs text-slate-500">JavaScript Heap</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn('text-2xl font-bold', getMemoryColor(metrics.memory.percentage))}>
                    {metrics.memory.percentage.toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-500">{metrics.memory.used} MB / {metrics.memory.total} MB</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.memory.percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn('h-full transition-colors', getBarColor(metrics.memory.percentage))}
                />
              </div>

              {/* Status */}
              <div className="mt-3 text-xs font-medium">
                {metrics.memory.percentage >= 90 ? (
                  <span className="text-red-600">⚠️ Kritik - Bellek tamamen kullanılıyor</span>
                ) : metrics.memory.percentage >= 70 ? (
                  <span className="text-orange-600">⚠️ Uyarı - Yüksek bellek kullanımı</span>
                ) : metrics.memory.percentage >= 50 ? (
                  <span className="text-yellow-600">ℹ️ Normal - Orta seviye kullanım</span>
                ) : (
                  <span className="text-green-600">✓ İyi - Düşük bellek kullanımı</span>
                )}
              </div>
            </motion.div>

            {/* CPU Performance */}
            <motion.div variants={ITEM_VARIANTS} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Cpu className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700">İşlemci Performans</h3>
                  <p className="text-xs text-slate-500">Web Vitals</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <motion.div variants={ITEM_VARIANTS} className="bg-slate-50 p-2 rounded">
                  <p className="text-xs text-slate-600">FCP</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {performance.getEntriesByName('first-contentful-paint')[0]?.startTime?.toFixed(0) || 'N/A'} ms
                  </p>
                </motion.div>
                <motion.div variants={ITEM_VARIANTS} className="bg-slate-50 p-2 rounded">
                  <p className="text-xs text-slate-600">LCP</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {performance.getEntriesByType('largest-contentful-paint')[0]?.startTime?.toFixed(0) || 'N/A'} ms
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Memory Trend */}
            {history.length > 0 && (
              <motion.div variants={ITEM_VARIANTS} className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Gauge className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-slate-700">Bellek Trendi (60s)</h3>
                </div>
                <div className="text-slate-600">
                  {createChart()}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={ITEM_VARIANTS}
            className="flex flex-col items-center justify-center h-full gap-4 text-slate-600"
          >
            <Activity className="w-12 h-12 opacity-30" />
            <p className="text-sm">Sistem performans verileriniz yükleniyor...</p>
          </motion.div>
        )}
      </div>

      {/* Footer Info */}
      <motion.div variants={ITEM_VARIANTS} className="border-t border-slate-200 p-4 bg-white text-xs text-slate-600">
        <p>Gerçek zamanlı sistem metrikleri • Güncelleme aralığı: ~16ms</p>
      </motion.div>
    </motion.div>
  );
}
