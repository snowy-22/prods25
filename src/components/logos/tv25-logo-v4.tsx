// TV25 Logo - Version 4: Bold Stacked (TV / 25 vertical)
export function TV25LogoV4({ className = "", size = 100 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="tv25-gradient-v4" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="glow-v4">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* TV text */}
      <text
        x="50"
        y="45"
        fontSize="48"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#tv25-gradient-v4)"
        textAnchor="middle"
        filter="url(#glow-v4)"
        letterSpacing="-2"
      >
        TV
      </text>
      
      {/* Separator line */}
      <line
        x1="25"
        y1="60"
        x2="75"
        y2="60"
        stroke="url(#tv25-gradient-v4)"
        strokeWidth="2"
        opacity="0.5"
      />
      
      {/* 25 text */}
      <text
        x="50"
        y="100"
        fontSize="48"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#tv25-gradient-v4)"
        textAnchor="middle"
        filter="url(#glow-v4)"
        letterSpacing="-2"
      >
        25
      </text>
    </svg>
  );
}
