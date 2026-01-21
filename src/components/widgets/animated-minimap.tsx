'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedMinimapProps {
  width?: number;
  height?: number;
  items?: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    title?: string;
    color?: string;
  }>;
  patternType?: 'dot' | 'grid' | 'lines' | 'gradient';
  animationSpeed?: number;
  showCompass?: boolean;
  showViewport?: boolean;
  onItemClick?: (itemId: string) => void;
  viewportBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function AnimatedMinimap({
  width = 300,
  height = 200,
  items = [],
  patternType = 'dot',
  animationSpeed = 1,
  showCompass = false,
  showViewport = true,
  onItemClick,
  viewportBounds,
}: AnimatedMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Calculate bounds of all items
  const bounds = React.useMemo(() => {
    if (items.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };

    const xs = items.flatMap(item => [item.x, item.x + item.width]);
    const ys = items.flatMap(item => [item.y, item.y + item.height]);

    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  }, [items]);

  const scale = React.useMemo(() => {
    const rangeX = bounds.maxX - bounds.minX || 1000;
    const rangeY = bounds.maxY - bounds.minY || 1000;

    return {
      x: (width - 20) / rangeX,
      y: (height - 20) / rangeY,
    };
  }, [bounds, width, height]);

  // Draw animated background pattern
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const drawDotPattern = () => {
      const dotSize = 2;
      const spacing = 20;

      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          const offset = Math.sin(time * 0.01 * animationSpeed + (x + y) * 0.001) * 0.5;
          const alpha = 0.3 + offset * 0.2;

          ctx.fillStyle = `rgba(100, 150, 200, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawGridPattern = () => {
      ctx.strokeStyle = `rgba(100, 150, 200, 0.2)`;
      ctx.lineWidth = 1;

      // Animated grid
      for (let x = 0; x < width; x += 30) {
        const offset = Math.sin(time * 0.01 * animationSpeed) * 5;
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += 30) {
        const offset = Math.cos(time * 0.01 * animationSpeed) * 5;
        ctx.beginPath();
        ctx.moveTo(0, y + offset);
        ctx.lineTo(width, y + offset);
        ctx.stroke();
      }
    };

    const drawLinesPattern = () => {
      ctx.strokeStyle = `rgba(100, 150, 200, 0.15)`;
      ctx.lineWidth = 1;

      for (let i = 0; i < 5; i++) {
        const offset = (time * 0.02 * animationSpeed + i * 100) % height;
        ctx.beginPath();
        ctx.moveTo(0, offset);
        ctx.lineTo(width, offset);
        ctx.stroke();
      }
    };

    const drawGradientPattern = () => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `rgba(100, 150, 200, ${0.1 + Math.sin(time * 0.005) * 0.1})`);
      gradient.addColorStop(0.5, `rgba(150, 100, 200, ${0.15 + Math.cos(time * 0.005) * 0.1})`);
      gradient.addColorStop(1, `rgba(100, 200, 150, ${0.1 + Math.sin(time * 0.005) * 0.1})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(0, 0, width, height);

      // Draw pattern
      switch (patternType) {
        case 'dot':
          drawDotPattern();
          break;
        case 'grid':
          drawGridPattern();
          break;
        case 'lines':
          drawLinesPattern();
          break;
        case 'gradient':
          drawGradientPattern();
          break;
      }

      // Draw border
      ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);

      time++;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height, patternType, animationSpeed]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked item
    for (const item of items) {
      const itemX = (item.x - bounds.minX) * scale.x + 10;
      const itemY = (item.y - bounds.minY) * scale.y + 10;
      const itemWidth = item.width * scale.x;
      const itemHeight = item.height * scale.y;

      if (
        x >= itemX &&
        x <= itemX + itemWidth &&
        y >= itemY &&
        y <= itemY + itemHeight
      ) {
        onItemClick?.(item.id);
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find hovered item
    let found = false;
    for (const item of items) {
      const itemX = (item.x - bounds.minX) * scale.x + 10;
      const itemY = (item.y - bounds.minY) * scale.y + 10;
      const itemWidth = item.width * scale.x;
      const itemHeight = item.height * scale.y;

      if (
        x >= itemX &&
        x <= itemX + itemWidth &&
        y >= itemY &&
        y <= itemY + itemHeight
      ) {
        setHoveredItemId(item.id);
        found = true;
        break;
      }
    }

    if (!found) setHoveredItemId(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-900/50 backdrop-blur">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredItemId(null)}
          className="cursor-pointer"
        />

        {/* Items overlay */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={height}
        >
          {items.map((item) => {
            const itemX = (item.x - bounds.minX) * scale.x + 10;
            const itemY = (item.y - bounds.minY) * scale.y + 10;
            const itemWidth = Math.max(item.width * scale.x, 8);
            const itemHeight = Math.max(item.height * scale.y, 8);
            const isHovered = hoveredItemId === item.id;

            return (
              <motion.rect
                key={item.id}
                x={itemX}
                y={itemY}
                width={itemWidth}
                height={itemHeight}
                fill={item.color || 'rgba(100, 200, 150, 0.6)'}
                stroke={isHovered ? '#FFD93D' : 'rgba(100, 200, 150, 0.8)'}
                strokeWidth={isHovered ? 2 : 1}
                rx={2}
                animate={{
                  opacity: isHovered ? 1 : 0.7,
                  filter: isHovered ? 'drop-shadow(0 0 6px rgba(255, 217, 61, 0.6))' : 'none',
                }}
                transition={{ duration: 0.2 }}
              />
            );
          })}

          {/* Viewport indicator */}
          {showViewport && viewportBounds && (
            <motion.rect
              x={(viewportBounds.x - bounds.minX) * scale.x + 10}
              y={(viewportBounds.y - bounds.minY) * scale.y + 10}
              width={viewportBounds.width * scale.x}
              height={viewportBounds.height * scale.y}
              fill="none"
              stroke="rgba(255, 217, 61, 0.5)"
              strokeWidth={2}
              strokeDasharray="4,4"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-emerald-400" />
          <span>Items</span>
        </div>
        {showViewport && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-yellow-300 border-dashed" />
            <span>Viewport</span>
          </div>
        )}
      </div>

      {/* Compass */}
      {showCompass && (
        <div className="flex justify-center gap-2 text-slate-500">
          <div className="text-xs">N</div>
          <div className="flex gap-1">
            <button className="p-1 hover:text-slate-300">↖</button>
            <button className="p-1 hover:text-slate-300">↑</button>
            <button className="p-1 hover:text-slate-300">↗</button>
          </div>
        </div>
      )}
    </div>
  );
}
