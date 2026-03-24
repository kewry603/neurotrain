import BottomNav from '../components/BottomNav';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import { useLanguage } from '../i18n/LanguageContext';
import { playSound, toggleMute, isMuted } from '../utils/sound';
import { useState } from 'react';

/**
 * Product info + contact — opened from Premium (“About NeuroTrain”).
 */
export default function AboutScreen({ onNavigate, activeNav = 'premium' }) {
  const { t } = useLanguage();
  const [muted, setMuted] = useState(isMuted());
  const email = t('about.contactEmail');

  return (
    <div
      className="relative flex h-screen min-h-0 w-full flex-col overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)', maxHeight: '100dvh' }}
    >
      <div className="vignette pointer-events-none absolute inset-0 z-[2]" />
      <div
        className="pointer-events-none absolute right-[-30px] top-[12%] h-52 w-52 rounded-full blur-[70px] opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.45), transparent)' }}
      />

      <header className="relative z-[3] flex flex-shrink-0 items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-5">
        <button
          type="button"
          onClick={() => {
            playSound('tap');
            if (typeof onNavigate === 'function') onNavigate('premium');
          }}
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
          {t('about.title')}
        </h1>
        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={() => setMuted(toggleMute())} />
          <LanguageToggle />
        </div>
      </header>

      <div className="app-scroll relative z-[3] flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 sm:px-5">
        <div className="mx-auto flex w-full max-w-md flex-col items-center px-1 text-center">
          <h2
            className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.35), 0 0 28px rgba(124,58,237,0.12)' }}
          >
            {t('appTitle')}
          </h2>
          <p className="mt-3 text-sm leading-snug text-white/85 sm:text-base">{t('about.tagline')}</p>
          <p className="mt-2 text-2xs leading-snug text-white/45 sm:text-xs">{t('about.credit')}</p>
          <p className="mt-5 text-sm leading-relaxed text-white/75 sm:text-base">{t('about.mission')}</p>

          <div className="mt-10 w-full border-t border-white/10 pt-8">
            <h2 className="text-2xs font-semibold uppercase tracking-[0.2em] text-white/45">{t('about.contactHeading')}</h2>
            <a
              href={`mailto:${email}`}
              className="mt-3 inline-block break-all text-base font-medium text-sky-200/95 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {email}
            </a>
          </div>

          <p className="mt-8 text-2xs font-medium uppercase tracking-widest text-white/35">{t('about.version')}</p>
        </div>
      </div>

      <div className="relative z-[3] flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
        <BottomNav activeKey={activeNav} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
