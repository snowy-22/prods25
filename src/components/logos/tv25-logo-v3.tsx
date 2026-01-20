// TV25 Logo - Version 3: Minimal Geometric
export function TV25LogoV3({ className = "", size = 120 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.5}
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="tv25-gradient-v3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      
      {/* Geometric TV shape */}
      <rect
        x="20"
        y="20"
        width="40"
        height="40"
        rx="6"
        stroke="url(#tv25-gradient-v3)"
        strokeWidth="4"
        fill="none"
      />
      
      {/* TV antenna dot */}
      <circle cx="40" cy="15" r="3" fill="url(#tv25-gradient-v3)" />
      
      {/* Text TV */}
      <text
        x="70"
        y="52"
        fontSize="36"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#tv25-gradient-v3)"
        letterSpacing="-1"
      >
        TV
      </text>
      
      {/* Dot separator */}
      <circle cx="125" cy="45" r="4" fill="url(#tv25-gradient-v3)" opacity="0.6" />
      
      {/* Text 25 */}
      <text
        x="140"
        y="52"
        fontSize="36"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#tv25-gradient-v3)"
        letterSpacing="-1"
      >
        25
      </text>
      
      {/* .app suffix */}
      <text
        x="20"
        y="85"
        fontSize="16"
        fontWeight="500"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="url(#tv25-gradient-v3)"
        opacity="0.7"
      >
        .app
      </text>
    </svg>
  );
}
