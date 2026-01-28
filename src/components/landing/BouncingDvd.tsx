// BouncingDvd.tsx
// Animated DVD logo bouncing effect for landing page hero - with logo support

import React, { useRef, useEffect, useState } from 'react';

const COLORS = [
  '#00eaff', '#ff00c8', '#ffea00', '#00ff8f', '#ff6b00', '#a200ff', '#ff003c', '#00ffea', '#ffb300', '#00ff57', '#ff007b', '#00baff', '#ff00a2', '#aaff00', '#ff5e00', '#00ffb3', '#ff00e1',
];

interface BouncingDvdProps {
  text?: string;
  showLogo?: boolean;
}

export const BouncingDvd: React.FC<BouncingDvdProps> = ({ text = 'tv25.app', showLogo = true }) => {
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

    // Responsive sizing - smaller on mobile
    const isMobile = width < 400;
    const boxWidth = isMobile ? 70 : 90;
    const boxHeight = isMobile ? 35 : 45;
    const fontSize = isMobile ? 12 : 16;
    const logoSize = isMobile ? 18 : 24;
    const cornerRadius = isMobile ? 8 : 12;

    let x = Math.random() * (width - boxWidth);
    let y = Math.random() * (height - boxHeight);
    let dx = 1.5 + Math.random() * 1.5;
    let dy = 1.5 + Math.random() * 1.5;
    let colorIdx = Math.floor(Math.random() * COLORS.length);

    function drawDvdLogo(x: number, y: number, color: string) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      
      // Background rounded rect
      ctx.beginPath();
      ctx.roundRect(0, 0, boxWidth, boxHeight, cornerRadius);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      if (showLogo) {
        // Draw minimal logo (simplified TV icon)
        const logoX = boxWidth / 2 - logoSize / 2;
        const logoY = (boxHeight - logoSize - fontSize * 0.6) / 2;
        
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.9;
        
        // Simple TV/monitor icon
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, logoSize, logoSize * 0.7, 3);
        ctx.fill();
        
        // Screen inner
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.roundRect(logoX + 2, logoY + 2, logoSize - 4, logoSize * 0.7 - 4, 2);
        ctx.fill();
        
        // Stand
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(logoX + logoSize / 2 - 2, logoY + logoSize * 0.7, 4, 3);
        ctx.fillRect(logoX + logoSize / 2 - 5, logoY + logoSize * 0.7 + 2, 10, 2);
        
        ctx.globalAlpha = 1;
        
        // Text below logo
        ctx.font = `bold ${fontSize * 0.7}px Inter, Arial, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, boxWidth / 2, boxHeight - 4);
      } else {
        // Just text, centered
        ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, boxWidth / 2, boxHeight / 2);
      }
      
      ctx.restore();
    }

    let animationFrameId: number;
    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      drawDvdLogo(x, y, COLORS[colorIdx]);
      x += dx;
      y += dy;
      if (x + boxWidth > width || x < 0) {
        dx = -dx;
        colorIdx = (colorIdx + 1) % COLORS.length;
        setColorIndex(colorIdx);
      }
      if (y + boxHeight > height || y < 0) {
        dy = -dy;
        colorIdx = (colorIdx + 1) % COLORS.length;
        setColorIndex(colorIdx);
      }
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [text, showLogo]);

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
        opacity: 0.65,
      }}
      aria-label="Bouncing DVD animation with logo"
    />
  );
};
