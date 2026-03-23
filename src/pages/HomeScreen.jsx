import { useState, useCallback } from 'react';
import BrainIcon from '../components/BrainIcon';
import DailyChallengeCard from '../components/DailyChallengeCard';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import ProgressCard from '../components/ProgressCard';
import BadgesSection from '../components/BadgesSection';
import BottomNav from '../components/BottomNav';
import TrainingGameGrid from '../components/TrainingGameGrid';
import { useLanguage } from '../i18n/LanguageContext';
import { usePremium } from '../context/PremiumContext';
import { playSound, toggleMute, isMuted } from '../utils/sound';

/** If set, MemoryGameScreen skips its own `start` so we don’t double with hero CTA. */
const SESSION_START_SKIP_MEMORY_KEY = 'nt_skipSessionStartOnce_memory';

export default function HomeScreen({ onNavigate, activeNav = 'home' }) {
  const { t } = useLanguage();
  const { isPremium } = usePremium();
  const [muted, setMuted] = useState(isMuted());

  const handleMute = () => setMuted(toggleMute());

  const handleGoPremium = useCallback(() => {
    if (typeof onNavigate !== 'function') return;
    playSound('tap');
    onNavigate('premium');
  }, [onNavigate]);

  const handleMindWellness = useCallback(() => {
    if (typeof onNavigate !== 'function') return;
    playSound('tap');
    onNavigate('wellness');
  }, [onNavigate]);

  const handleAchievements = useCallback(() => {
    if (typeof onNavigate !== 'function') return;
    playSound('tap');
    onNavigate('achievements');
  }, [onNavigate]);

  const handleStart = () => {
    try {
      sessionStorage.setItem(SESSION_START_SKIP_MEMORY_KEY, '1');
    } catch {
      /* ignore */
    }
    playSound('start');
    onNavigate('memory');
  };


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

      <header className="relative z-[3] flex flex-shrink-0 items-center justify-between px-4 pb-1 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Good morning</p>
          <p className="text-base font-bold text-white">Mr. Melo</p>
        </div>
        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={handleMute} />
          <LanguageToggle />
        </div>
      </header>

      {/* Main: scroll when content exceeds viewport (small phones / large text) */}
      <div className="app-scroll relative z-[3] flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 sm:px-5">
        <div className="flex w-full min-h-0 flex-col gap-4 py-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
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

          {/* Mind & Wellness */}
          <button
            type="button"
            onClick={handleMindWellness}
            className="card-lift relative z-[5] flex w-full min-h-[56px] touch-manipulation items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left motion-reduce:transition-none"
            style={{
              background: 'linear-gradient(135deg, rgba(45,212,191,0.12) 0%, rgba(124,58,237,0.08) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(45,212,191,0.28)',
              boxShadow: '0 6px 28px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-white/95">{t('homeMindWellnessTitle')}</p>
              <p className="mt-0.5 text-2xs leading-snug text-white/50">{t('homeMindWellnessSubtitle')}</p>
            </div>
            <span className="flex-shrink-0 text-lg font-semibold text-teal-300/90" aria-hidden="true">
              →
            </span>
          </button>

          {/* Cards */}
          <div className="flex shrink-0 flex-col gap-2">
            {!isPremium && (
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
                <p className="text-xs font-bold uppercase tracking-wider text-white/90">{t('homePremiumPromoTitle')}</p>
                <ul className="mt-2 space-y-1.5 text-2xs leading-snug text-white/65">
                  <li className="flex gap-2">
                    <span className="text-fuchsia-300/90" aria-hidden>
                      ✓
                    </span>
                    <span>{t('homePremiumPromoBullet1')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-fuchsia-300/90" aria-hidden>
                      ✓
                    </span>
                    <span>{t('homePremiumPromoBullet2')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-fuchsia-300/90" aria-hidden>
                      ✓
                    </span>
                    <span>{t('homePremiumPromoBullet3')}</span>
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={handleGoPremium}
                  className="btn-primary mt-3 w-full !min-h-[44px] touch-manipulation !py-2.5 text-sm font-bold"
                >
                  {t('homePremiumPromoCta')}
                </button>
              </div>
            )}
            <DailyChallengeCard compact />
            <ProgressCard compact onViewDetails={typeof onNavigate === 'function' ? () => onNavigate('stats') : undefined} />
            <div>
              <BadgesSection compact />
              {typeof onNavigate === 'function' && (
                <button
                  type="button"
                  onClick={handleAchievements}
                  className="mt-1.5 w-full py-1.5 text-center text-2xs font-semibold text-amber-200/90 transition-colors hover:text-amber-100"
                >
                  {t('achievements.viewAll')} →
                </button>
              )}
            </div>
          </div>

          {/* Game shortcuts */}
          <TrainingGameGrid onNavigate={onNavigate} sectionLabel={t('homeTrainSection')} showSpatial={false} />
        </div>
      </div>

      <div className="relative z-[3] flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
        <BottomNav activeKey={activeNav} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
