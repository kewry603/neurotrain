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
        /** Subtle elevation (light theme) */
        'elevated': '0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)',
        'glow-purple': '0 4px 20px rgba(13, 148, 136, 0.22)',
        'glow-pink': '0 4px 20px rgba(8, 145, 178, 0.2)',
        'glow-blue': '0 4px 20px rgba(2, 132, 199, 0.2)',
        'glow-cyan': '0 4px 20px rgba(14, 165, 233, 0.2)',
        'card': '0 2px 12px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
        'btn': '0 4px 14px rgba(13, 148, 136, 0.28)',
      },
      backgroundImage: {
        'app-gradient':
          'linear-gradient(170deg, #a8edcf 0%, #bfddff 55%, #d8d4ff 100%)',
        'card-gradient':
          'linear-gradient(180deg, #f0fdf8 0%, #eef6ff 100%)',
        'btn-gradient':
          'linear-gradient(90deg, #0f766e 0%, #0d9488 45%, #14b8a6 100%)',
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
