// TV25 Logo - Version 2: Retro TV Icon Style
export function TV25LogoV2({ className = "", size = 120 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="tv25-gradient-v2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="glow-v2">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* TV Screen */}
      <rect
        x="15"
        y="30"
        width="90"
        height="60"
        rx="8"
        stroke="url(#tv25-gradient-v2)"
        strokeWidth="4"
        fill="none"
        filter="url(#glow-v2)"
      />
      
      {/* TV Antennas */}
      <line x1="45" y1="30" x2="35" y2="15" stroke="url(#tv25-gradient-v2)" strokeWidth="3" strokeLinecap="round"/>
      <line x1="75" y1="30" x2="85" y2="15" stroke="url(#tv25-gradient-v2)" strokeWidth="3" strokeLinecap="round"/>
      
      {/* TV text inside screen */}
      <text
        x="60"
        y="57"
        fontSize="20"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#tv25-gradient-v2)"
        textAnchor="middle"
        letterSpacing="-1"
      >
        TV
      </text>
      
      {/* 25 text inside screen */}
      <text
        x="60"
        y="77"
        fontSize="20"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#tv25-gradient-v2)"
        textAnchor="middle"
        letterSpacing="-1"
      >
        25
      </text>
      
      {/* TV Stand */}
      <rect
        x="45"
        y="90"
        width="30"
        height="8"
        rx="2"
        fill="url(#tv25-gradient-v2)"
      />
      <rect
        x="52"
        y="98"
        width="16"
        height="8"
        rx="2"
        fill="url(#tv25-gradient-v2)"
      />
    </svg>
  );
}
