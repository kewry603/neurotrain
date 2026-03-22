import { useState } from 'react';
import BrainIcon from '../components/BrainIcon';
import DailyChallengeCard from '../components/DailyChallengeCard';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import ProgressCard from '../components/ProgressCard';
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
      { labelKey: 'memory', active: true, screen: 'memory' },
      { labelKey: 'focus', active: false, screen: 'focus' },
    ],
    [
      { labelKey: 'numbers', active: false, screen: 'numbers' },
      { labelKey: 'wordMemory', active: false, screen: 'wordMemory' },
    ],
  ];

  const categoryButtonClass = (cat, extra = '') =>
    `text-center text-sm font-semibold px-3 py-3 rounded-2xl transition-all duration-150 motion-reduce:transition-none active:scale-[0.96] min-h-[48px] w-full ${extra} ${
      cat.active
        ? 'text-cyan-300'
        : cat.screen
          ? 'text-white/85 hover:text-white cursor-pointer'
          : 'text-white/35 cursor-default'
    }`;

  return (
    <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden" style={{ background: 'linear-gradient(170deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)' }}>

      {/* Vignette — dark edges give depth like a premium screen */}
      <div className="vignette pointer-events-none absolute inset-0 z-[2]" />

      {/* Soft central ambient light — diffused, not neon */}
      <div
        className="pointer-events-none absolute left-1/2 top-[25%] h-96 w-96 -translate-x-1/2 rounded-full blur-[80px]"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.10) 0%, rgba(37,99,235,0.05) 55%, transparent 75%)' }}
      />
      {/* Corner accent lights */}
      <div
        className="pointer-events-none absolute right-[-40px] top-[-20px] h-48 w-48 rounded-full blur-[60px] opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.8), transparent)' }}
      />
      <div
        className="pointer-events-none absolute bottom-[22%] left-[-40px] h-44 w-44 rounded-full blur-[55px] opacity-18"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.7), transparent)' }}
      />

      <header className="relative z-[3] flex items-center justify-between px-4 pb-1 pt-3 sm:px-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/50">Good morning</p>
          <p className="text-base font-bold text-white">Mr. Melo</p>
        </div>
        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={handleMute} />
          <LanguageToggle />
        </div>
      </header>

      <div
        className="relative z-[3] flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-20"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Hero */}
        <section className="flex flex-shrink-0 flex-col items-center px-4 pt-3 sm:px-5">
          {/* Logo — softer, diffused glow (not neon) */}
          <div className="relative mb-3 animate-float motion-reduce:animate-none">
            <div
              className="pointer-events-none absolute inset-[-14px] rounded-full blur-2xl opacity-22 animate-glow-shift motion-reduce:animate-none"
              style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.5) 0%, rgba(99,102,241,0.3) 55%, transparent 80%)' }}
            />
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-[40%_40%_36%_36%]"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1.5px solid rgba(255,255,255,0.18)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              <BrainIcon className="h-10 w-10" />
            </div>
          </div>

          {/* Title with very subtle luminous glow */}
          <h1
            className="mb-1 text-center text-2xl font-extrabold tracking-tight text-white"
            style={{ textShadow: '0 0 40px rgba(56,189,248,0.30), 0 2px 4px rgba(0,0,0,0.30)' }}
          >
            {t('appTitle')}
          </h1>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.22em] text-white/40">
            {t('appSubtitle')}
          </p>
          <p className="mb-4 w-full text-center text-sm leading-relaxed text-white/60">
            {t('appTagline')}
          </p>

          <button
            type="button"
            onClick={handleStart}
            className="btn-primary w-full !min-h-[48px] !py-3"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
            </svg>
            {t('startTraining')}
          </button>
        </section>

        {/* Cards */}
        <div className="flex flex-shrink-0 flex-col gap-3 px-4 sm:px-5">
          <DailyChallengeCard />
          <ProgressCard />
        </div>

        {/* Game shortcuts */}
        <div className="relative z-20 w-full flex-shrink-0 px-4 pb-6 sm:px-5">
          <p className="mb-2 text-2xs font-semibold uppercase tracking-widest text-white/35">
            Train
          </p>
          <div className="grid w-full grid-cols-2 gap-3">
            {categoryGrid.map((row) =>
              row.map((cat) => (
                <button
                  key={cat.labelKey}
                  type="button"
                  onClick={() => goToCategory(cat.screen)}
                  className={categoryButtonClass(cat)}
                  style={
                    cat.active
                      ? {
                          background: 'rgba(14,165,233,0.14)',
                          border: '1px solid rgba(14,165,233,0.38)',
                          boxShadow: '0 0 20px rgba(14,165,233,0.18), 0 4px 16px rgba(0,0,0,0.22)',
                        }
                      : cat.screen
                        ? {
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }
                  }
                >
                  {t(`homeCategories.${cat.labelKey}`)}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
