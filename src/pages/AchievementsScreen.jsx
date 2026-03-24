import { useMemo } from 'react';
import BottomNav from '../components/BottomNav';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgress } from '../context/ProgressContext';
import { usePremium } from '../context/PremiumContext';
import { toggleMute, isMuted } from '../utils/sound';
import { useState } from 'react';
import {
  ACHIEVEMENT_IDS,
  ACHIEVEMENT_EMOJI,
  computeUnlockedAchievementIds,
  countUnlockedAchievements,
} from '../utils/achievements';

export default function AchievementsScreen({ onNavigate, activeNav = 'achievements' }) {
  const { t } = useLanguage();
  const { isPremium } = usePremium();
  const progress = useProgress();
  const { hydrated } = progress;
  const [muted, setMuted] = useState(isMuted());

  const unlockedSet = useMemo(
    () => (hydrated ? computeUnlockedAchievementIds(progress, isPremium) : new Set()),
    [hydrated, progress, isPremium]
  );

  const unlockedCount = useMemo(
    () => (hydrated ? countUnlockedAchievements(progress, isPremium) : 0),
    [hydrated, progress, isPremium]
  );

  const total = ACHIEVEMENT_IDS.length;
  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <div
      className="relative flex h-screen min-h-0 w-full flex-col overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)', maxHeight: '100dvh' }}
    >
      <div className="vignette pointer-events-none absolute inset-0 z-[2]" />
      <div
        className="pointer-events-none absolute left-[-20%] top-[10%] h-56 w-56 rounded-full blur-[70px] opacity-25"
        style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.35), transparent)' }}
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
          style={{ backgroundImage: 'linear-gradient(90deg, #fbbf24, #f472b6)' }}
        >
          {t('achievements.title')}
        </h1>
        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={() => setMuted(toggleMute())} />
          <LanguageToggle />
        </div>
      </header>

      <div className="app-scroll relative z-[3] flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-2 sm:px-5">
        <p className="mb-3 text-center text-xs text-white/45">{t('achievements.subtitle')}</p>

        <div
          className="mb-4 rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(251, 191, 36, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(251, 191, 36, 0.22)',
            boxShadow: '0 6px 28px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-amber-200/80">
              {t('achievements.progressLabel')}
            </p>
            <p className="text-sm font-bold tabular-nums text-white">
              {hydrated ? `${unlockedCount} / ${total}` : '—'}
            </p>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('achievements.progressLabel')}
          >
            <div
              className="h-full rounded-full transition-[width] motion-reduce:transition-none"
              style={{
                width: `${hydrated ? pct : 0}%`,
                background: 'linear-gradient(90deg, #fbbf24, #f472b6)',
                boxShadow: '0 0 12px rgba(251,191,36,0.45)',
              }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-white/40">
            {hydrated && unlockedCount === 0 ? t('achievements.progressHintFresh') : t('achievements.progressHint')}
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] sm:grid-cols-2">
          {ACHIEVEMENT_IDS.map((id) => {
            const unlocked = hydrated && unlockedSet.has(id);
            const emoji = ACHIEVEMENT_EMOJI[id] ?? '◆';
            return (
              <li
                key={id}
                className={`flex gap-3 rounded-2xl px-3.5 py-3 transition-opacity motion-reduce:transition-none ${
                  unlocked ? 'opacity-100' : 'opacity-75'
                }`}
                style={{
                  background: unlocked
                    ? 'rgba(139, 92, 246, 0.1)'
                    : 'rgba(15, 12, 35, 0.55)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: unlocked
                    ? '1px solid rgba(167, 139, 250, 0.35)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: unlocked
                    ? '0 4px 20px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)'
                    : 'inset 0 1px 0 rgba(0,0,0,0.2)',
                }}
              >
                <span
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl ${
                    unlocked ? '' : 'grayscale'
                  }`}
                  style={{
                    background: unlocked ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  aria-hidden
                >
                  {unlocked ? emoji : '🔒'}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-bold leading-snug ${
                      unlocked ? 'text-white' : 'text-white/45'
                    }`}
                  >
                    {t(`achievements.items.${id}.title`)}
                    {!unlocked && (
                      <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/30">
                        {t('achievements.locked')}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/50">{t(`achievements.items.${id}.desc`)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative z-[3] flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
        <BottomNav activeKey={activeNav} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
