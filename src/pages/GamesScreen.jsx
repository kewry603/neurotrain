import BottomNav from '../components/BottomNav';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import TrainingGameGrid from '../components/TrainingGameGrid';
import { useLanguage } from '../i18n/LanguageContext';
import { toggleMute, isMuted, playSound } from '../utils/sound';
import { useState } from 'react';

/**
 * Hub for launching training games — same shortcuts as Home, plus Spatial.
 */
export default function GamesScreen({ onNavigate, activeNav = 'games' }) {
  const { t } = useLanguage();
  const [muted, setMuted] = useState(isMuted());

  return (
    <div
      className="relative flex h-screen min-h-0 w-full flex-col overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)', maxHeight: '100dvh' }}
    >
      <div className="vignette pointer-events-none absolute inset-0 z-[2]" />
      <div
        className="pointer-events-none absolute left-1/2 top-[20%] h-72 w-72 -translate-x-1/2 rounded-full blur-[70px]"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
      />

      <header className="relative z-[3] flex flex-shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-5">
        <button
          type="button"
          onClick={() => {
            if (typeof onNavigate !== 'function') return;
            playSound('tap');
            onNavigate('home');
          }}
          className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:text-white glass"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>
        <h1
          className="font-display min-w-0 flex-1 truncate text-center text-lg font-bold tracking-tight text-transparent bg-clip-text sm:text-xl"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899)' }}
        >
          {t('gamesTitle')}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <MuteButton muted={muted} onToggle={() => setMuted(toggleMute())} />
          <LanguageToggle />
        </div>
      </header>

      <div className="app-scroll relative z-[3] flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 sm:px-5">
        <div className="flex w-full min-h-0 flex-col gap-4 py-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <p className="text-center text-xs leading-relaxed text-white/45">{t('gamesSubtitle')}</p>
          <TrainingGameGrid onNavigate={onNavigate} sectionLabel={t('gamesPickGame')} showSpatial />
        </div>
      </div>

      <div className="relative z-[3] flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
        <BottomNav activeKey={activeNav} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
