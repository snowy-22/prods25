// BouncingDvd.tsx
// Animated DVD logo bouncing effect for landing page hero

import React, { useRef, useEffect, useState } from 'react';

const COLORS = [
  '#00eaff', '#ff00c8', '#ffea00', '#00ff8f', '#ff6b00', '#a200ff', '#ff003c', '#00ffea', '#ffb300', '#00ff57', '#ff007b', '#00baff', '#ff00a2', '#aaff00', '#ff5e00', '#00ffb3', '#ff00e1', '#00ffea', '#ffb300', '#00ff57', '#ff007b', '#00baff', '#ff00a2', '#aaff00', '#ff5e00', '#00ffb3', '#ff00e1',
];

interface BouncingDvdProps {
  text?: string;
}

export const BouncingDvd: React.FC<BouncingDvdProps> = ({ text = 'tv25.app' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.parentElement?.clientWidth || window.innerWidth;
    let height = canvas.parentElement?.clientHeight || window.innerHeight;
    setSize({ width, height });
    canvas.width = width;
    canvas.height = height;

    let x = Math.random() * (width - 120);
    let y = Math.random() * (height - 60);
    let dx = 2 + Math.random() * 2;
    let dy = 2 + Math.random() * 2;
    let colorIdx = Math.floor(Math.random() * COLORS.length);

    function drawDvdLogo(x: number, y: number, color: string) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.roundRect(0, 0, 120, 60, 16);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = 'bold 24px Inter, Arial, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 60, 32);
      ctx.restore();
    }

    let animationFrameId: number;
    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      drawDvdLogo(x, y, COLORS[colorIdx]);
      x += dx;
      y += dy;
      if (x + 120 > width || x < 0) {
        dx = -dx;
        colorIdx = (colorIdx + 1) % COLORS.length;
        setColorIndex(colorIdx);
      }
      if (y + 60 > height || y < 0) {
        dy = -dy;
        colorIdx = (colorIdx + 1) % COLORS.length;
        setColorIndex(colorIdx);
      }
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Responsive resize
  useEffect(() => {
    function handleResize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      setSize({ width, height });
      canvas.width = width;
      canvas.height = height;
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={size.width}
      height={size.height}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0.7,
      }}
      aria-label="Bouncing DVD animation"
    />
  );
};
