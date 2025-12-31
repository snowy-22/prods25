'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ConnectionPoint {
  nodeId: string;
  x: number;
  y: number;
}

interface Connection {
  id: string;
  from: ConnectionPoint;
  to: ConnectionPoint;
  type?: 'bezier' | 'straight' | 'smooth';
  animated?: boolean;
  animationStyle?: 'flow' | 'pulse' | 'gradient';
  strokeColor?: string;
  strokeWidth?: number;
}

interface AnimatedConnectionsProps {
  connections: Connection[];
  width?: number;
  height?: number;
  animationSpeed?: number;
  globalAnimated?: boolean;
}

export function AnimatedConnections({
  connections,
  width = 800,
  height = 600,
  animationSpeed = 1,
  globalAnimated = true,
}: AnimatedConnectionsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Generate path based on connection type
  const generatePath = (connection: Connection): string => {
    const { from, to, type = 'bezier' } = connection;

    switch (type) {
      case 'straight':
        return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

      case 'smooth':
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        return `M ${from.x} ${from.y} Q ${midX} ${from.y} ${midX} ${midY} T ${to.x} ${to.y}`;

      case 'bezier':
      default:
        const controlOffsetX = Math.abs(to.x - from.x) * 0.2;
        const controlOffsetY = Math.abs(to.y - from.y) * 0.2;
        const controlX1 = from.x + controlOffsetX;
        const controlX2 = to.x - controlOffsetX;
        const controlY1 = from.y + controlOffsetY;
        const controlY2 = to.y - controlOffsetY;
        return `M ${from.x} ${from.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${to.x} ${to.y}`;
    }
  };

  // Draw animated particles on canvas
  useEffect(() => {
    if (!globalAnimated) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += animationSpeed;

      // Draw flowing particles for each connection
      connections.forEach((connection) => {
        if (!connection.animated) return;

        const { from, to, animationStyle = 'flow', strokeColor = '#FFD93D' } = connection;
        const pathD = generatePath(connection);
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', pathD);

        // For canvas rendering, we'll use SVG path data
        // This is a simplified approach - for production, use a library like Path2D

        switch (animationStyle) {
          case 'flow': {
            // Draw flowing particles along the line
            const t = ((time * 0.01) % 100) / 100;
            
            // Interpolate position along bezier curve
            const x = from.x * Math.pow(1 - t, 3) +
                     3 * (from.x + (to.x - from.x) * 0.2) * t * Math.pow(1 - t, 2) +
                     3 * (to.x - (to.x - from.x) * 0.2) * Math.pow(t, 2) * (1 - t) +
                     to.x * Math.pow(t, 3);
            
            const y = from.y * Math.pow(1 - t, 3) +
                     3 * (from.y + (to.y - from.y) * 0.2) * t * Math.pow(1 - t, 2) +
                     3 * (to.y - (to.y - from.y) * 0.2) * Math.pow(t, 2) * (1 - t) +
                     to.y * Math.pow(t, 3);

            // Draw particle
            ctx.fillStyle = strokeColor;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw trail
            for (let i = 1; i <= 3; i++) {
              const trailT = ((time * 0.01 - i * 0.02) % 100) / 100;
              const trailX = from.x * Math.pow(1 - trailT, 3) +
                            3 * (from.x + (to.x - from.x) * 0.2) * trailT * Math.pow(1 - trailT, 2) +
                            3 * (to.x - (to.x - from.x) * 0.2) * Math.pow(trailT, 2) * (1 - trailT) +
                            to.x * Math.pow(trailT, 3);
              
              const trailY = from.y * Math.pow(1 - trailT, 3) +
                            3 * (from.y + (to.y - from.y) * 0.2) * trailT * Math.pow(1 - trailT, 2) +
                            3 * (to.y - (to.y - from.y) * 0.2) * Math.pow(trailT, 2) * (1 - trailT) +
                            to.y * Math.pow(trailT, 3);

              ctx.globalAlpha = 0.3 / i;
              ctx.beginPath();
              ctx.arc(trailX, trailY, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          }

          case 'pulse': {
            // Draw pulsing line
            const pulse = (Math.sin(time * 0.01) + 1) / 2;
            ctx.strokeStyle = strokeColor;
            ctx.globalAlpha = 0.5 + pulse * 0.3;
            ctx.lineWidth = (connection.strokeWidth || 2) + pulse * 2;
            
            // Simple line (for production, use proper path rendering)
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            break;
          }

          case 'gradient': {
            // Draw gradient-animated line
            const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
            const offset = ((time * 0.01) % 100) / 100;
            
            gradient.addColorStop((offset) % 1, strokeColor);
            gradient.addColorStop((offset + 0.3) % 1, 'transparent');
            
            ctx.strokeStyle = gradient;
            ctx.globalAlpha = 0.6;
            ctx.lineWidth = connection.strokeWidth || 2;
            
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            break;
          }
        }
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [connections, width, height, animationSpeed, globalAnimated]);

  // Mouse tracking for interactive effects (optional)
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="relative w-full h-full">
      {/* SVG for animated connections with markers and decorations */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-auto"
        onMouseMove={handleMouseMove}
        style={{ cursor: 'move' }}
      >
        <defs>
          {/* Arrow markers */}
          <marker
            id="arrowhead-flow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#FFD93D" />
          </marker>

          <marker
            id="arrowhead-pulse"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#6C5CE7" />
          </marker>

          <marker
            id="arrowhead-gradient"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#45B7D1" />
          </marker>

          {/* Gradient definitions */}
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD93D" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFD93D" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#6C5CE7" stopOpacity="0" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render SVG paths with animations */}
        {connections.map((connection) => {
          const pathD = generatePath(connection);
          const strokeColor = connection.strokeColor || '#FFD93D';
          const strokeWidth = connection.strokeWidth || 2;
          const markerMap: Record<string, string> = {
            flow: 'arrowhead-flow',
            pulse: 'arrowhead-pulse',
            gradient: 'arrowhead-gradient',
          };
          const markerId = markerMap[connection.animationStyle || 'flow'];

          return (
            <g key={connection.id}>
              {/* Background glow line */}
              {connection.animated && (
                <motion.path
                  d={pathD}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth + 4}
                  fill="none"
                  opacity={0.2}
                  filter="url(#glow)"
                  animate={{
                    opacity: [0.1, 0.3, 0.1],
                  }}
                  transition={{
                    duration: 2 / animationSpeed,
                    repeat: Infinity,
                  }}
                />
              )}

              {/* Main line */}
              <path
                d={pathD}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                markerEnd={`url(#${markerId})`}
                opacity={connection.animated ? 0.8 : 0.5}
              />

              {/* Animated dash for extra effect */}
              {connection.animated && connection.animationStyle !== 'flow' && (
                <motion.path
                  d={pathD}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray="5,5"
                  animate={{
                    strokeDashoffset: [0, -10],
                  }}
                  transition={{
                    duration: 0.5 / animationSpeed,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  opacity={0.4}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Canvas for particle effects */}
      {globalAnimated && (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute inset-0 pointer-events-none"
        />
      )}
    </div>
  );
}

/**
 * Hook for managing connections between nodes
 */
export function useAnimatedConnections() {
  const [connections, setConnections] = React.useState<Connection[]>([]);

  const addConnection = (connection: Connection) => {
    setConnections((prev) => [...prev, connection]);
  };

  const removeConnection = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  };

  const updateConnection = (connectionId: string, updates: Partial<Connection>) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === connectionId ? { ...c, ...updates } : c))
    );
  };

  const clearConnections = () => {
    setConnections([]);
  };

  return {
    connections,
    addConnection,
    removeConnection,
    updateConnection,
    clearConnections,
  };
}
