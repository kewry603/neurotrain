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
    `text-center text-sm font-semibold px-3 py-3 rounded-2xl transition-all duration-200 motion-reduce:transition-none min-h-[48px] w-full ${extra} ${
      cat.active
        ? 'text-cyan-300'
        : cat.screen
          ? 'text-white/85 hover:text-white cursor-pointer'
          : 'text-white/35 cursor-default'
    }`;

  return (
    <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden" style={{ background: 'linear-gradient(170deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)' }}>

      {/* Central radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-[30%] h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(37,99,235,0.10) 50%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute right-[-60px] top-[-40px] h-64 w-64 rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent)' }}
      />
      <div
        className="pointer-events-none absolute bottom-[20%] left-[-50px] h-56 w-56 rounded-full blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.5), transparent)' }}
      />

      <header className="flex items-center justify-between px-4 pb-1 pt-3 sm:px-5">
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
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-20"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Hero */}
        <section className="flex flex-shrink-0 flex-col items-center px-4 pt-2 sm:px-5">
          <div className="relative mb-2 animate-float motion-reduce:animate-none">
            <div
              className="pointer-events-none absolute inset-[-6px] rounded-full blur-xl opacity-50 animate-glow-shift motion-reduce:animate-none"
              style={{ background: 'radial-gradient(circle, #6ee7b7 0%, #7dd3fc 55%, transparent 75%)' }}
            />
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-[40%_40%_36%_36%] border-2 shadow-elevated"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.20)' }}
            >
              <BrainIcon className="h-10 w-10" />
            </div>
          </div>

          <h1 className="mb-0.5 text-center text-2xl font-extrabold tracking-tight text-white">
            {t('appTitle')}
          </h1>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            {t('appSubtitle')}
          </p>
          <p className="mb-3 w-full text-center text-sm leading-snug text-white/70">
            {t('appTagline')}
          </p>

          <button
            type="button"
            onClick={handleStart}
            className="btn-primary w-full shadow-btn !min-h-[46px] !py-2.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
            </svg>
            {t('startTraining')}
          </button>
        </section>

        {/* Cards — gap-3 between them, px-4 shows gradient on sides */}
        <div className="flex flex-shrink-0 flex-col gap-3 px-4 sm:px-5">
          <DailyChallengeCard />
          <ProgressCard />
        </div>

        {/* Game shortcuts */}
        <div className="relative z-20 w-full flex-shrink-0 px-4 pb-5 sm:px-5">
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
                          background: 'rgba(14,165,233,0.18)',
                          border: '1px solid rgba(14,165,233,0.45)',
                          boxShadow: '0 0 18px rgba(14,165,233,0.25)',
                        }
                      : cat.screen
                        ? {
                            background: 'rgba(255,255,255,0.07)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.20)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
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
