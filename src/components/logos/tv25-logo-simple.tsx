// TV25 Logo - Simple Version: Just "TV 25" text (For Download/Auth)
export function TV25LogoSimple({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.3}
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="simple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="simple-glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* TV */}
      <text
        x="40"
        y="80"
        fontSize="90"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#simple-gradient)"
        filter="url(#simple-glow)"
        letterSpacing="-4"
      >
        TV
      </text>
      
      {/* Space */}
      <rect x="200" y="35" width="4" height="50" rx="2" fill="url(#simple-gradient)" opacity="0.3"/>
      
      {/* 25 */}
      <text
        x="240"
        y="80"
        fontSize="90"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#simple-gradient)"
        filter="url(#simple-glow)"
        letterSpacing="-4"
      >
        25
      </text>
    </svg>
  );
}
