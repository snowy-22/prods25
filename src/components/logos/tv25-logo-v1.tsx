// TV25 Logo - Version 1: Modern Split Typography
export function TV25LogoV1({ className = "", size = 120 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.4}
      viewBox="0 0 300 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background glow effect */}
      <defs>
        <linearGradient id="tv25-gradient-v1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="glow-v1">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* TV text */}
      <text
        x="20"
        y="80"
        fontSize="72"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#tv25-gradient-v1)"
        filter="url(#glow-v1)"
        letterSpacing="-2"
      >
        TV
      </text>
      
      {/* 25 text */}
      <text
        x="150"
        y="80"
        fontSize="72"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#tv25-gradient-v1)"
        filter="url(#glow-v1)"
        letterSpacing="-2"
      >
        25
      </text>
      
      {/* Separator line */}
      <line
        x1="135"
        y1="30"
        x2="135"
        y2="90"
        stroke="url(#tv25-gradient-v1)"
        strokeWidth="3"
        opacity="0.6"
      />
    </svg>
  );
}
