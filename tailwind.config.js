/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        /** Slightly larger scale for 40+ readability */
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      colors: {
        /** Soft teal primary — professional, high contrast on light surfaces */
        primary: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
          light: '#14b8a6',
          soft: '#ccfbf1',
          foreground: '#ffffff',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted: '#475569',
          subtle: '#64748b',
        },
        surface: {
          DEFAULT: '#f1f5f9',
          card: '#ffffff',
          muted: '#e2e8f0',
        },
        /** Kept for game accents; tuned for light UI where referenced */
        neon: {
          purple: '#0d9488',
          pink: '#0891b2',
          blue: '#0284c7',
          cyan: '#0ea5e9',
        },
      },
      boxShadow: {
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.30), 0 2px 8px rgba(0, 0, 0, 0.20)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.45)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.40)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.45)',
        'glow-cyan': '0 0 20px rgba(14, 165, 233, 0.45)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'btn': '0 0 24px rgba(14, 165, 233, 0.40), 0 4px 16px rgba(14, 165, 233, 0.25)',
      },
      backgroundImage: {
        'app-gradient':
          'linear-gradient(170deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)',
        'card-gradient':
          'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.04) 100%)',
        'btn-gradient':
          'linear-gradient(90deg, #0d9488 0%, #0ea5e9 55%, #3b82f6 100%)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        float: 'float 6s ease-in-out infinite',
        'glow-shift': 'glowShift 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glowShift: {
          '0%, 100%': { opacity: '0.85' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
