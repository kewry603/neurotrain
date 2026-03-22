import { useState } from 'react';
import BrainIcon from '../components/BrainIcon';
import DailyChallengeCard from '../components/DailyChallengeCard';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import ProgressCard from '../components/ProgressCard';
import BadgesSection from '../components/BadgesSection';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../i18n/LanguageContext';
import { playSound, toggleMute, isMuted } from '../utils/sound';

/** If set, MemoryGameScreen skips its own `start` so we don’t double with hero CTA. */
const SESSION_START_SKIP_MEMORY_KEY = 'nt_skipSessionStartOnce_memory';

export default function HomeScreen({ onNavigate }) {
  const { t } = useLanguage();
  const [muted, setMuted] = useState(isMuted());

  const handleMute = () => setMuted(toggleMute());
  const handleStart = () => {
    try {
      sessionStorage.setItem(SESSION_START_SKIP_MEMORY_KEY, '1');
    } catch {
      /* ignore */
    }
    playSound('start');
    onNavigate('memory');
  };

  const goToCategory = (screen) => {
    if (screen && typeof onNavigate === 'function') onNavigate(screen);
  };

  const categoryGrid = [
    [
      {
        labelKey: 'memory', active: true, screen: 'memory',
        accent: '#8b5cf6',  // violet-500 (primary accent)
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="12" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="2" y="12" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="12" y="12" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        labelKey: 'focus', active: false, screen: 'focus',
        accent: '#c084fc',  // purple-400
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
            <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          </svg>
        ),
      },
    ],
    [
      {
        labelKey: 'numbers', active: false, screen: 'numbers',
        accent: '#e879f9',  // fuchsia-400
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M5 6h10M5 10h6M5 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 13l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        labelKey: 'wordMemory', active: false, screen: 'wordMemory',
        accent: '#f472b6',  // pink-400
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M4 5h12M4 9h8M4 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  ];

  const categoryButtonClass = () =>
    `btn-micro flex flex-col items-center justify-center gap-1 rounded-xl min-h-[52px] w-full cursor-pointer motion-reduce:transition-none`;

  return (
    <div
      className="relative flex h-screen min-h-0 w-full flex-col overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)', maxHeight: '100dvh' }}
    >

      {/* Vignette — dark edges give depth like a premium screen */}
      <div className="vignette pointer-events-none absolute inset-0 z-[2]" />

      {/* Soft central ambient light — diffused, not neon */}
      <div
        className="pointer-events-none absolute left-1/2 top-[25%] h-96 w-96 -translate-x-1/2 rounded-full blur-[80px]"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, rgba(236,72,153,0.06) 55%, transparent 75%)' }}
      />
      {/* Corner accent lights */}
      <div
        className="pointer-events-none absolute right-[-40px] top-[-20px] h-48 w-48 rounded-full blur-[60px] opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.8), transparent)' }}
      />
      <div
        className="pointer-events-none absolute bottom-[22%] left-[-40px] h-44 w-44 rounded-full blur-[55px] opacity-18"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent)' }}
      />

      <header className="relative z-[3] flex items-center justify-between px-4 pb-1 pt-3 sm:px-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Good morning</p>
          <p className="text-base font-bold text-white">Mr. Melo</p>
        </div>
        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={handleMute} />
          <LanguageToggle />
        </div>
      </header>

      {/* Main: fills space between header and nav — no vertical scroll */}
      <div className="relative z-[3] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 sm:px-5">
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 py-1">
          {/* Hero */}
          <section className="flex flex-shrink-0 flex-col items-center pt-1">
            {/* Logo — softer, diffused glow (not neon) */}
            <div className="relative mb-2 animate-float motion-reduce:animate-none">
              <div
                className="pointer-events-none absolute inset-[-12px] rounded-full blur-2xl opacity-22 animate-glow-shift motion-reduce:animate-none"
                style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, rgba(236,72,153,0.18) 55%, transparent 80%)' }}
              />
              <div
                className="relative flex h-12 w-12 items-center justify-center rounded-[40%_40%_36%_36%]"
                style={{
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.35), 0 0 18px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <BrainIcon className="h-9 w-9" />
              </div>
            </div>

            <h1
              className="mb-0.5 text-center text-xl font-extrabold tracking-tight text-white sm:text-2xl"
              style={{ textShadow: '0 0 40px rgba(124,58,237,0.35), 0 0 24px rgba(236,72,153,0.15), 0 2px 4px rgba(0,0,0,0.30)' }}
            >
              {t('appTitle')}
            </h1>
            <p className="mb-0.5 text-2xs font-medium uppercase tracking-[0.22em] text-white/30">
              {t('appSubtitle')}
            </p>
            <p className="mb-2 w-full text-center text-xs leading-snug text-white/50 sm:text-sm">
              {t('appTagline')}
            </p>

            <button
              type="button"
              onClick={handleStart}
              className="btn-primary w-full !min-h-[44px] !py-2.5"
            >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
            </svg>
            {t('startTraining')}
          </button>
          </section>

          {/* Cards — compact on home so full layout fits one screen */}
          <div className="flex min-h-0 shrink-0 flex-col gap-2 overflow-hidden">
            <DailyChallengeCard compact />
            <ProgressCard compact />
            <BadgesSection compact />
          </div>

          {/* Game shortcuts */}
          <div className="relative z-20 w-full flex-shrink-0">
            <p className="mb-1 text-2xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(192,132,252,0.65)' }}>
              Train
            </p>
            <div className="grid w-full grid-cols-2 gap-2">
            {categoryGrid.map((row) =>
              row.map((cat) => {
                const accentRgb = cat.accent
                  ? cat.accent.replace('#', '').match(/.{2}/g).map(h => parseInt(h, 16)).join(',')
                  : '255,255,255';
                return (
                  <button
                    key={cat.labelKey}
                    type="button"
                    onClick={() => goToCategory(cat.screen)}
                    className={categoryButtonClass()}
                    style={
                      cat.active
                        ? {
                            color: cat.accent || '#8b5cf6',
                            background: `linear-gradient(135deg, rgba(${accentRgb},0.18) 0%, rgba(${accentRgb},0.08) 100%)`,
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: `1px solid rgba(${accentRgb},0.42)`,
                            boxShadow: `0 0 22px rgba(${accentRgb},0.24), 0 4px 16px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.10)`,
                          }
                        : {
                            color: cat.accent || 'rgba(255,255,255,0.75)',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.13)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)',
                          }
                    }
                  >
                    <span style={{ opacity: cat.active ? 1 : 0.80 }}>{cat.icon}</span>
                    <span className="text-xs font-semibold tracking-wide" style={{ opacity: cat.active ? 1 : 0.80 }}>
                      {t(`homeCategories.${cat.labelKey}`)}
                    </span>
                  </button>
                );
              })
            )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-[3] flex-shrink-0">
        <BottomNav />
      </div>
    </div>
  );
}
