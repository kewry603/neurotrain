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
    `text-center text-sm font-semibold px-3 py-3 rounded-2xl transition-all duration-200 motion-reduce:transition-none min-h-[48px] w-full border-2 shadow-sm ${extra} ${
      cat.active
        ? 'border-primary/40 bg-primary/10 text-primary shadow-md'
        : cat.screen
          ? 'border-slate-200 bg-white text-slate-800 hover:border-primary/30 hover:bg-slate-50 cursor-pointer'
          : 'border-slate-100 bg-slate-100 text-slate-400 cursor-default'
    }`;

  return (
    <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden" style={{ background: 'linear-gradient(170deg, #a8edcf 0%, #bfddff 55%, #d8d4ff 100%)' }}>

      <div
        className="pointer-events-none absolute left-[-60px] top-[-80px] h-72 w-72 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, #ccfbf1, transparent)' }}
      />
      <div
        className="pointer-events-none absolute right-[-80px] top-[28%] h-64 w-64 rounded-full blur-3xl opacity-35"
        style={{ background: 'radial-gradient(circle, #e0f2fe, transparent)' }}
      />
      <div
        className="pointer-events-none absolute bottom-[18%] left-[-40px] h-48 w-48 rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, #d1fae5, transparent)' }}
      />

      {/* Header — tighter top padding */}
      <header className="flex items-center justify-between px-4 pb-1 pt-3 sm:px-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Good morning</p>
          <p className="text-base font-bold text-slate-900">Mr. Melo</p>
        </div>
        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={handleMute} />
          <LanguageToggle />
        </div>
      </header>

      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain pb-20"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Hero — compact logo + tight copy stack */}
        <section className="flex flex-shrink-0 flex-col items-center px-4 pb-3 pt-1 sm:px-5">
          {/* Logo — reduced from h-20/w-20 → h-14/w-14 */}
          <div className="relative mb-2 animate-float motion-reduce:animate-none">
            <div
              className="pointer-events-none absolute inset-[-6px] rounded-full blur-xl opacity-40 animate-glow-shift motion-reduce:animate-none"
              style={{ background: 'radial-gradient(circle, #99f6e4 0%, #5eead4 55%, transparent 75%)' }}
            />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-[40%_40%_36%_36%] border-2 border-primary/25 bg-white shadow-elevated">
              <BrainIcon className="h-10 w-10" />
            </div>
          </div>

          <h1 className="mb-0.5 text-center text-2xl font-extrabold tracking-tight text-slate-900">
            {t('appTitle')}
          </h1>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t('appSubtitle')}
          </p>
          <p className="mb-3 w-full text-center text-sm leading-snug text-slate-600">
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

        {/* Cards — tighter gap */}
        <div className="flex flex-shrink-0 flex-col gap-2.5 px-4 pb-3 sm:px-5">
          <DailyChallengeCard />
          <ProgressCard />
        </div>

        {/* Game shortcuts */}
        <div className="relative z-20 w-full flex-shrink-0 px-4 pb-4 pt-0 sm:px-5">
          <div className="grid w-full grid-cols-2 gap-x-2.5 gap-y-2.5">
            {categoryGrid.map((row) =>
              row.map((cat) => (
                <button
                  key={cat.labelKey}
                  type="button"
                  onClick={() => goToCategory(cat.screen)}
                  className={categoryButtonClass(cat)}
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
