'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Download, Upload, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SpeedTestResult {
  download: number;
  upload: number;
  latency: number;
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

export function SpeedTest() {
  const [results, setResults] = useState<SpeedTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SpeedTestResult[]>([]);

  const measureLatency = async (): Promise<number> => {
    const start = performance.now();
    try {
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
      const end = performance.now();
      return Math.round(end - start);
    } catch {
      return 0;
    }
  };

  const measureDownloadSpeed = async (): Promise<number> => {
    const testFileSize = 1024 * 1024; // 1MB
    const testUrl = `/favicon.ico?t=${Date.now()}`;

    const start = performance.now();
    try {
      const response = await fetch(testUrl, { cache: 'no-store' });
      const blob = await response.blob();
      const end = performance.now();

      const duration = (end - start) / 1000;
      const speedMbps = (blob.size * 8) / (duration * 1000 * 1000);
      return Math.round(speedMbps * 100) / 100;
    } catch {
      return 0;
    }
  };

  const measureUploadSpeed = async (): Promise<number> => {
    const testData = new ArrayBuffer(1024 * 100); // 100KB
    const blob = new Blob([testData]);

    const start = performance.now();
    try {
      const formData = new FormData();
      formData.append('file', blob);

      await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      }).catch(() => {
        // Gracefully handle upload endpoint not existing
      });

      const end = performance.now();
      const duration = (end - start) / 1000;
      const speedMbps = (blob.size * 8) / (duration * 1000 * 1000);
      return Math.round(speedMbps * 100) / 100;
    } catch {
      return 0;
    }
  };

  const runSpeedTest = async () => {
    setLoading(true);
    try {
      const [latency, download, upload] = await Promise.all([
        measureLatency(),
        measureDownloadSpeed(),
        measureUploadSpeed(),
      ]);

      const result: SpeedTestResult = {
        download,
        upload,
        latency,
        timestamp: Date.now(),
      };

      setResults(result);
      setHistory((prev) => [result, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const getSpeedCategory = (mbps: number): string => {
    if (mbps >= 100) return 'Çok Hızlı';
    if (mbps >= 50) return 'Hızlı';
    if (mbps >= 25) return 'İyi';
    if (mbps >= 10) return 'Orta';
    return 'Yavaş';
  };

  const getSpeedColor = (mbps: number): string => {
    if (mbps >= 100) return 'text-green-600';
    if (mbps >= 50) return 'text-emerald-600';
    if (mbps >= 25) return 'text-yellow-600';
    if (mbps >= 10) return 'text-orange-600';
    return 'text-red-600';
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
        className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex items-center gap-3"
      >
        <Zap className="w-6 h-6" />
        <h2 className="text-lg font-bold">İnternet Hız Testi</h2>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {results ? (
          <motion.div
            key={results.timestamp}
            variants={ITEM_VARIANTS}
            className="space-y-6"
          >
            {/* Speed Results Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Download */}
              <motion.div
                variants={ITEM_VARIANTS}
                className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">İndir</span>
                </div>
                <div className={cn('text-3xl font-bold', getSpeedColor(results.download))}>
                  {results.download.toFixed(1)}
                </div>
                <div className="text-xs text-slate-600 mt-1">Mbps</div>
                <div className="text-xs text-slate-500 mt-2">
                  {getSpeedCategory(results.download)}
                </div>
              </motion.div>

              {/* Upload */}
              <motion.div
                variants={ITEM_VARIANTS}
                className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-slate-700">Yükle</span>
                </div>
                <div className={cn('text-3xl font-bold', getSpeedColor(results.upload))}>
                  {results.upload.toFixed(1)}
                </div>
                <div className="text-xs text-slate-600 mt-1">Mbps</div>
                <div className="text-xs text-slate-500 mt-2">
                  {getSpeedCategory(results.upload)}
                </div>
              </motion.div>

              {/* Latency */}
              <motion.div
                variants={ITEM_VARIANTS}
                className="bg-white rounded-lg p-4 border border-green-200 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-slate-700">Ping</span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {results.latency}
                </div>
                <div className="text-xs text-slate-600 mt-1">ms</div>
                <div className="text-xs text-slate-500 mt-2">
                  {results.latency < 50 ? 'Mükemmel' : results.latency < 100 ? 'İyi' : 'Düşük'}
                </div>
              </motion.div>
            </div>

            {/* Test Time */}
            <motion.div variants={ITEM_VARIANTS} className="text-xs text-slate-500 text-center">
              Test zamanı: {new Date(results.timestamp).toLocaleTimeString('tr-TR')}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            variants={ITEM_VARIANTS}
            className="flex flex-col items-center justify-center h-full gap-4 text-slate-600"
          >
            <Zap className="w-12 h-12 opacity-30" />
            <p className="text-sm">Hız testini başlatmak için aşağıdaki düğmeye tıklayın</p>
          </motion.div>
        )}

        {/* History */}
        {history.length > 0 && (
          <motion.div variants={ITEM_VARIANTS} className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Son Testler</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {history.map((test, idx) => (
                <motion.div
                  key={test.timestamp}
                  variants={ITEM_VARIANTS}
                  className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-xs"
                >
                  <span className="text-slate-600">{new Date(test.timestamp).toLocaleTimeString('tr-TR')}</span>
                  <div className="flex gap-3">
                    <span className={cn('font-semibold', getSpeedColor(test.download))}>
                      ↓ {test.download.toFixed(1)} Mbps
                    </span>
                    <span className={cn('font-semibold', getSpeedColor(test.upload))}>
                      ↑ {test.upload.toFixed(1)} Mbps
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <motion.div variants={ITEM_VARIANTS} className="border-t border-slate-200 p-4 bg-white">
        <Button
          onClick={runSpeedTest}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
        >
          {loading ? 'Test Devam Ediyor...' : 'Testi Başlat'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
