import { useLanguage } from '../i18n/LanguageContext';
import BottomNav from '../components/BottomNav';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import { usePremium } from '../context/PremiumContext';
import { useProgress } from '../context/ProgressContext';
import { playSound, toggleMute, isMuted } from '../utils/sound';
import { useState } from 'react';

/**
 * Premium info / placeholder — no payments yet.
 * Demo control lets testers toggle Premium to verify Hard gating end-to-end.
 */
export default function PremiumScreen({ onNavigate, activeNav = 'premium' }) {
  const { t } = useLanguage();
  const { isPremium, setPremium } = usePremium();
  const { mergeAchievementFlags } = useProgress();
  const [muted, setMuted] = useState(isMuted());

  return (
    <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)' }}>
      <div
        className="pointer-events-none absolute right-[-40px] top-[-60px] h-64 w-64 rounded-full blur-3xl opacity-35"
        style={{ background: 'radial-gradient(circle, #ccfbf1, transparent)' }}
      />
      <div
        className="pointer-events-none absolute bottom-[10%] left-[-50px] h-48 w-48 rounded-full blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, #e0f2fe, transparent)' }}
      />

      <header className="relative z-10 flex flex-shrink-0 items-center justify-between px-4 pb-3 pt-[max(1.5rem,env(safe-area-inset-top,0px))] sm:px-5">
        <button
          type="button"
          onClick={() => {
            if (typeof onNavigate === 'function') onNavigate('home');
          }}
          className="flex min-h-[48px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>
        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={() => setMuted(toggleMute())} />
          <LanguageToggle />
        </div>
      </header>

      <div className="app-scroll relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-2 pb-6 sm:px-5">
        <h1
          className="font-display mb-4 px-1 text-center text-3xl font-extrabold leading-tight text-white"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.45), 0 0 40px rgba(124,58,237,0.15)' }}
        >
          {t('premium.title')}
        </h1>

        <button
          type="button"
          onClick={() => {
            playSound('tap');
            if (typeof onNavigate === 'function') onNavigate('about');
          }}
          className="card-lift mb-5 flex w-full min-h-[56px] touch-manipulation items-center justify-between gap-3 rounded-2xl border-2 border-violet-300/40 px-4 py-3 text-left shadow-lg ring-2 ring-white/10 transition-transform motion-reduce:transition-none active:scale-[0.99] motion-reduce:active:scale-100 sm:px-5"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.42) 0%, rgba(59,130,246,0.26) 50%, rgba(236,72,153,0.14) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow:
              '0 0 32px rgba(124,58,237,0.4), 0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.14)',
          }}
        >
          <span className="min-w-0 flex-1">
            <span className="font-display block text-sm font-bold tracking-wide text-white">{t('premium.aboutLink')}</span>
            <span className="mt-0.5 block text-2xs font-medium leading-snug text-white/70">{t('premium.aboutLinkHint')}</span>
          </span>
          <svg className="h-5 w-5 flex-shrink-0 text-white/95" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <p className="mb-6 w-full text-center text-base leading-relaxed text-white/80">
          {t('premium.subtitle')}
        </p>

        <ul className="mb-8 w-full space-y-3 text-left">
          {[
            { key: 'bulletHard', accent: 'text-violet-600' },
            { key: 'bulletExpert', accent: 'text-fuchsia-600' },
            { key: 'bulletWellness', accent: 'text-teal-700' },
            { key: 'bulletProgress', accent: 'text-sky-700' },
            { key: 'bulletFuture', accent: 'text-slate-800' },
          ].map(({ key, accent }) => (
            <li
              key={key}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base leading-snug text-slate-800 shadow-sm"
            >
              <span className={`${accent} mr-3 inline-block w-5 font-bold`}>✓</span>
              {t(`premium.${key}`)}
            </li>
          ))}
        </ul>

        <p className="mt-auto w-full px-2 pb-2 text-center text-sm leading-relaxed text-white/55">
          {t('premium.supportFooter')}
        </p>
      </div>

      {/* Prominent CTA — fixed above bottom nav, consistent with app chrome */}
      <div
        className="relative z-10 flex-shrink-0 px-4 pb-2 pt-5 sm:px-5"
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(180deg, rgba(15, 12, 35, 0.2) 0%, rgba(15, 12, 35, 0.92) 35%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 -12px 40px rgba(0,0,0,0.35)',
        }}
      >
        {!isPremium ? (
          <button
            type="button"
            onClick={() => {
              setPremium(true);
              mergeAchievementFlags({ premiumEver: true });
              playSound('tap');
            }}
            className="btn-primary shadow-btn flex min-h-[56px] w-full touch-manipulation items-center justify-center rounded-2xl px-6 py-4 text-base font-bold tracking-wide"
          >
            {t('premium.unlockCta')}
          </button>
        ) : (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="flex min-h-[56px] w-full cursor-default touch-manipulation items-center justify-center rounded-2xl border border-emerald-400/35 px-6 py-4 text-base font-bold tracking-wide text-emerald-100"
            style={{
              background: 'linear-gradient(160deg, rgba(16, 185, 129, 0.22) 0%, rgba(15, 23, 42, 0.5) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {t('premium.premiumActiveCta')}
          </button>
        )}
        <p className="mt-3 text-center text-2xs font-semibold uppercase tracking-widest text-white/40">
          {t('premium.devNote')}
        </p>
        {isPremium && (
          <button
            type="button"
            onClick={() => {
              setPremium(false);
              playSound('tap');
            }}
            className="mt-3 w-full min-h-[44px] rounded-xl py-2 text-center text-sm font-semibold text-white/55 transition-colors hover:text-white/80"
          >
            {t('premium.disablePreview')}
          </button>
        )}
      </div>

      <div className="relative z-10 flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
        <BottomNav activeKey={activeNav} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
