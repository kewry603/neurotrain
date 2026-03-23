import BottomNav from '../components/BottomNav';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgress } from '../context/ProgressContext';
import { usePremium } from '../context/PremiumContext';
import { getLevelFromTotalXp } from '../utils/progression';
import { toggleMute, isMuted, playSound } from '../utils/sound';
import { useState, useCallback } from 'react';

function MetricCard({ label, value, sub }) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: 'rgba(139, 92, 246, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 6px 28px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <p className="text-[9px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-white/35">{sub}</p>}
    </div>
  );
}

export default function StatsScreen({ onNavigate, activeNav = 'stats' }) {
  const { t } = useLanguage();
  const { isPremium } = usePremium();
  const {
    hydrated,
    currentStreak,
    bestStreak,
    totalSessionsCompleted,
    totalRoundsCompleted,
    overallAccuracy,
    totalXp,
  } = useProgress();
  const [muted, setMuted] = useState(isMuted());

  const handleOpenAchievements = useCallback(() => {
    if (typeof onNavigate !== 'function') return;
    try {
      playSound('tap');
    } catch {
      /* sound must not block navigation */
    }
    onNavigate('achievements');
  }, [onNavigate]);

  const level = hydrated ? getLevelFromTotalXp(totalXp) : 1;
  const dash = '—';

  return (
    <div
      className="relative flex h-screen min-h-0 w-full flex-col overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)', maxHeight: '100dvh' }}
    >
      <div className="vignette pointer-events-none absolute inset-0 z-[2]" />
      <div
        className="pointer-events-none absolute bottom-[15%] right-[-30px] h-48 w-48 rounded-full blur-[60px] opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.35), transparent)' }}
      />

      <header className="relative z-[3] flex flex-shrink-0 items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-5">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex min-h-[44px] items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:text-white glass"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>
        <h1
          className="font-display text-sm font-bold tracking-widest text-transparent bg-clip-text"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899)' }}
        >
          {t('statsTitle')}
        </h1>
        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={() => setMuted(toggleMute())} />
          <LanguageToggle />
        </div>
      </header>

      <div className="app-scroll relative z-[3] flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-2 sm:px-5">
        <p className="mb-3 text-center text-xs text-white/45">{t('statsSubtitle')}</p>

        <button
          type="button"
          onClick={handleOpenAchievements}
          className="mb-4 w-full min-h-[44px] touch-manipulation rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-fuchsia-200 transition-colors hover:text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(236,72,153,0.1) 100%)',
            border: '1px solid rgba(251,191,36,0.28)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {t('statsOpenAchievements')}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label={t('statsCurrentStreak')}
            value={hydrated ? String(Math.max(0, currentStreak)) : dash}
          />
          <MetricCard
            label={t('statsBestStreak')}
            value={hydrated ? String(Math.max(0, bestStreak)) : dash}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <MetricCard
            label={t('statsSessions')}
            value={hydrated ? String(totalSessionsCompleted) : dash}
          />
          <MetricCard
            label={t('statsRounds')}
            value={hydrated ? String(totalRoundsCompleted) : dash}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <MetricCard
            label={t('progressAccuracyLabel')}
            value={hydrated ? `${overallAccuracy}%` : dash}
          />
          <MetricCard label={t('progressTotalXp')} value={hydrated ? String(totalXp) : dash} sub={t('statsLevelSub').replace('{n}', String(level))} />
        </div>

        <div
          className="mt-4 rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(139, 92, 246, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <p className="text-[9px] font-semibold uppercase tracking-widest text-white/40">{t('statsPremiumStatus')}</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {isPremium ? t('statsPremiumActive') : t('statsPremiumFree')}
          </p>
        </div>

        <div className="h-4 shrink-0" aria-hidden="true" />
      </div>

      <div className="relative z-[3] flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
        <BottomNav activeKey={activeNav} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
