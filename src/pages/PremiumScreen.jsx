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

      <div className="app-scroll relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-2 pb-4 sm:px-5">
        <h1 className="mb-3 px-1 text-center text-3xl font-extrabold leading-tight text-slate-900">
          {t('premium.title')}
        </h1>
        <p className="mb-8 w-full text-center text-base leading-relaxed text-slate-600">
          {t('premium.subtitle')}
        </p>

        <ul className="mb-10 w-full space-y-3 text-left">
          {[
            { key: 'bulletHard', accent: 'text-primary' },
            { key: 'bulletProgress', accent: 'text-fuchsia-300' },
            { key: 'bulletUpdates', accent: 'text-teal-700' },
            { key: 'bulletSupport', accent: 'text-slate-800' },
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

        <div className="mt-auto w-full space-y-4">
          {!isPremium ? (
            <button
              type="button"
              onClick={() => {
                setPremium(true);
                mergeAchievementFlags({ premiumEver: true });
                playSound('tap');
              }}
              className="btn-primary shadow-btn"
            >
              {t('premium.goPremium')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setPremium(false);
                playSound('tap');
              }}
              className="btn-secondary"
            >
              {t('premium.disablePreview')}
            </button>
          )}
          <p className="text-center text-2xs font-semibold uppercase tracking-widest text-slate-400">
            {t('premium.devNote')}
          </p>
        </div>

        <p className="mt-10 w-full px-2 text-center text-sm leading-relaxed text-slate-500">
          {t('premium.supportFooter')}
        </p>
      </div>

      <div className="relative z-10 flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
        <BottomNav activeKey={activeNav} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
