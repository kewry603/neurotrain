/**
 * BrainIcon — head silhouette with brain detail (purple / pink neon accent)
 */
export default function BrainIcon({ className = '' }) {
  const HEAD =
    'M24 3 C17 3, 8 7, 8 17 C8 27, 14 34, 20 37 C21 38, 21 40, 21 44 L27 44 C27 40, 27 38, 28 37 C34 34, 40 27, 40 17 C40 7, 31 3, 24 3 Z';

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hGrad" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#5b21b6" stopOpacity="0.55" />
        </linearGradient>

        <linearGradient id="bGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>

        <radialGradient id="bAura" cx="50%" cy="48%" r="52%">
          <stop offset="0%" stopColor="#e879f9" stopOpacity="0.45" />
          <stop offset="52%" stopColor="#8b5cf6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
        </radialGradient>

        <filter id="sg" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.9" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="ng" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="ag" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>

        <clipPath id="hClip">
          <path d={HEAD} />
        </clipPath>
      </defs>

      <path d={HEAD} fill="rgba(124,58,237,0.08)" />

      <ellipse
        cx="24"
        cy="19"
        rx="12"
        ry="10"
        fill="url(#bAura)"
        filter="url(#ag)"
        clipPath="url(#hClip)"
        className="brain-glow-pulse"
      />

      <path
        d="M24 10 C18 10, 13 13, 13 19 C13 25, 16 28, 20 29 L24 29"
        stroke="url(#bGrad)"
        strokeWidth="1.9"
        strokeLinecap="round"
        filter="url(#sg)"
      />
      <path
        d="M15 16 C14 19, 15 23, 16 26"
        stroke="#8b5cf6"
        strokeWidth="1.0"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M14 27 C16 29, 18 29, 18 27"
        stroke="#c026d3"
        strokeWidth="1.0"
        strokeLinecap="round"
        opacity="0.75"
      />

      <path
        d="M24 10 C30 10, 35 13, 35 19 C35 25, 32 28, 28 29 L24 29"
        stroke="url(#bGrad)"
        strokeWidth="1.9"
        strokeLinecap="round"
        filter="url(#sg)"
      />
      <path
        d="M33 16 C34 19, 33 23, 32 26"
        stroke="#a855f7"
        strokeWidth="1.0"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M34 27 C32 29, 30 29, 30 27"
        stroke="#ec4899"
        strokeWidth="1.0"
        strokeLinecap="round"
        opacity="0.75"
      />

      <line
        x1="24"
        y1="10"
        x2="24"
        y2="29"
        stroke="rgba(139,92,246,0.35)"
        strokeWidth="0.85"
        strokeDasharray="1.8 2.1"
      />

      <line x1="17" y1="19" x2="24" y2="15" stroke="#8b5cf6" strokeWidth="0.75" opacity="0.45" />
      <line x1="31" y1="19" x2="24" y2="15" stroke="#c026d3" strokeWidth="0.75" opacity="0.45" />
      <line x1="17" y1="19" x2="24" y2="24" stroke="#e879f9" strokeWidth="0.70" opacity="0.4" />
      <line x1="31" y1="19" x2="24" y2="24" stroke="#ec4899" strokeWidth="0.70" opacity="0.4" />
      <line x1="24" y1="15" x2="24" y2="24" stroke="#7c3aed" strokeWidth="0.75" opacity="0.45" />

      <circle cx="24" cy="15" r="2.1" fill="#8b5cf6" filter="url(#ng)" className="brain-node-pulse" />
      <circle
        cx="24"
        cy="24"
        r="1.7"
        fill="#ec4899"
        filter="url(#ng)"
        className="brain-node-pulse"
        style={{ animationDelay: '0.9s' }}
      />
      <circle
        cx="17"
        cy="19"
        r="1.6"
        fill="#e879f9"
        filter="url(#ng)"
        className="brain-node-pulse"
        style={{ animationDelay: '0.4s' }}
      />
      <circle
        cx="31"
        cy="19"
        r="1.6"
        fill="#c026d3"
        filter="url(#ng)"
        className="brain-node-pulse"
        style={{ animationDelay: '1.3s' }}
      />

      <path d={HEAD} stroke="url(#hGrad)" strokeWidth="1.6" filter="url(#sg)" />
    </svg>
  );
}
