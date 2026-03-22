import BottomNav from '../components/BottomNav';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import TrainingGameGrid from '../components/TrainingGameGrid';
import { useLanguage } from '../i18n/LanguageContext';
import { toggleMute, isMuted } from '../utils/sound';
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

      <header className="relative z-[3] flex flex-shrink-0 items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-5">
        <h1
          className="font-display text-lg font-bold tracking-tight text-transparent bg-clip-text sm:text-xl"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899)' }}
        >
          {t('gamesTitle')}
        </h1>
        <div className="flex items-center gap-2">
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
