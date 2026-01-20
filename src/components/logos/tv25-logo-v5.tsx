// TV25 Logo - Version 5: Tech Neon Style (Ayrık TV ve 25)
export function TV25LogoV5({ className = "", size = 140 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.35}
      viewBox="0 0 350 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="tv-gradient-v5" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="num-gradient-v5" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="neon-glow-v5">
          <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* TV text with neon effect */}
      <text
        x="30"
        y="75"
        fontSize="80"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#tv-gradient-v5)"
        filter="url(#neon-glow-v5)"
        letterSpacing="-3"
      >
        TV
      </text>
      
      {/* 25 text with neon effect */}
      <text
        x="200"
        y="75"
        fontSize="80"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#num-gradient-v5)"
        filter="url(#neon-glow-v5)"
        letterSpacing="-3"
      >
        25
      </text>
      
      {/* Connecting pulse line */}
      <g opacity="0.6">
        <line x1="160" y1="40" x2="180" y2="40" stroke="url(#tv-gradient-v5)" strokeWidth="2" strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite"/>
        </line>
        <line x1="160" y1="55" x2="180" y2="55" stroke="url(#num-gradient-v5)" strokeWidth="2" strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" from="8" to="0" dur="1s" repeatCount="indefinite"/>
        </line>
        <line x1="160" y1="70" x2="180" y2="70" stroke="url(#tv-gradient-v5)" strokeWidth="2" strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite"/>
        </line>
      </g>
    </svg>
  );
}
