'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Cpu,
  MemoryStick,
  Network,
  RefreshCw,
  Activity,
  HardDrive,
  Wifi,
  AlertCircle,
} from 'lucide-react';
import { usePCMonitor } from '@/hooks/use-pc-monitor';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PCMonitorWidgetProps {
  size?: 'small' | 'medium' | 'large';
  refreshInterval?: number;
}

export function PCMonitorWidget({ 
  size = 'medium',
  refreshInterval = 1000,
}: PCMonitorWidgetProps) {
  const { stats, isSupported, error, refresh } = usePCMonitor(refreshInterval);
  
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const formatBytes = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  const formatSpeed = (kbps: number) => {
    if (kbps >= 1024) {
      return `${(kbps / 1024).toFixed(1)} MB/s`;
    }
    return `${kbps.toFixed(0)} KB/s`;
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!isSupported) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            PC monitoring desteklenmiyor
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "w-full h-full flex flex-col",
      isSmall && "text-xs"
    )}>
      <CardHeader className={cn(
        "pb-2 flex flex-row items-center justify-between space-y-0",
        isSmall && "p-3"
      )}>
        <CardTitle className={cn(
          "flex items-center gap-2",
          isSmall && "text-sm",
          !isSmall && !isLarge && "text-base",
          isLarge && "text-lg"
        )}>
          <Activity className={cn(
            "animate-pulse",
            isSmall && "h-4 w-4",
            !isSmall && "h-5 w-5"
          )} />
          PC Monitör
        </CardTitle>
        
        <Button
          variant="ghost"
          size={isSmall ? 'sm' : 'icon'}
          onClick={refresh}
          className="h-7 w-7"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className={cn(
        "flex-1 space-y-3 overflow-auto",
        isSmall && "space-y-2 p-3 pt-0"
      )}>
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* CPU Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className={cn(
                "text-blue-500",
                isSmall && "h-4 w-4",
                !isSmall && "h-5 w-5"
              )} />
              <span className={cn(
                "font-semibold",
                isSmall && "text-xs",
                !isSmall && "text-sm"
              )}>
                CPU
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-mono font-bold",
                getUsageColor(stats.cpu.usage),
                isSmall && "text-xs",
                !isSmall && "text-sm"
              )}>
                {stats.cpu.usage.toFixed(1)}%
              </span>
              {!isSmall && (
                <Badge variant="outline" className="text-[10px] px-1">
                  {stats.cpu.cores} cores
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={stats.cpu.usage} 
            className={cn("h-2", getProgressColor(stats.cpu.usage))}
          />
        </div>

        <Separator />

        {/* Memory Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MemoryStick className={cn(
                "text-purple-500",
                isSmall && "h-4 w-4",
                !isSmall && "h-5 w-5"
              )} />
              <span className={cn(
                "font-semibold",
                isSmall && "text-xs",
                !isSmall && "text-sm"
              )}>
                RAM
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-mono font-bold",
                getUsageColor(stats.memory.percentage),
                isSmall && "text-xs",
                !isSmall && "text-sm"
              )}>
                {stats.memory.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <Progress 
            value={stats.memory.percentage} 
            className={cn("h-2", getProgressColor(stats.memory.percentage))}
          />
          
          {!isSmall && (
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{formatBytes(stats.memory.used)} kullanılıyor</span>
              <span>{formatBytes(stats.memory.total)} toplam</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Network Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Network className={cn(
              "text-green-500",
              isSmall && "h-4 w-4",
              !isSmall && "h-5 w-5"
            )} />
            <span className={cn(
              "font-semibold",
              isSmall && "text-xs",
              !isSmall && "text-sm"
            )}>
              Ağ
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1 text-muted-foreground">
                <HardDrive className="h-3 w-3" />
                <span className="text-[10px]">İndirme</span>
              </div>
              <div className={cn(
                "font-mono font-bold text-green-600",
                isSmall && "text-xs",
                !isSmall && "text-sm"
              )}>
                {formatSpeed(stats.network.downloadSpeed)}
              </div>
            </div>
            
            <div className="space-y-1 p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Wifi className="h-3 w-3" />
                <span className="text-[10px]">Yükleme</span>
              </div>
              <div className={cn(
                "font-mono font-bold text-blue-600",
                isSmall && "text-xs",
                !isSmall && "text-sm"
              )}>
                {formatSpeed(stats.network.uploadSpeed)}
              </div>
            </div>
          </div>
          
          {!isSmall && stats.network.latency > 0 && (
            <div className="text-[10px] text-muted-foreground text-center">
              Gecikme: {stats.network.latency.toFixed(0)}ms
            </div>
          )}
        </div>

        {/* Timestamp */}
        {isLarge && (
          <div className="text-[10px] text-muted-foreground text-center pt-2">
            Son güncelleme: {new Date(stats.timestamp).toLocaleTimeString('tr-TR')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PCMonitorWidget;
