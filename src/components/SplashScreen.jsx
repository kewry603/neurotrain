import { useLayoutEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen as CapacitorSplash } from '@capacitor/splash-screen';
import BrainIcon from './BrainIcon';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * In-app launch screen (brain + title). On native, hides the Capacitor splash
 * after this view has painted so the handoff is seamless.
 */
export default function SplashScreen() {
  const { t } = useLanguage();

  useLayoutEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let cancelled = false;
    const hideNative = () => {
      if (cancelled) return;
      CapacitorSplash.hide().catch(() => {});
    };

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(hideNative);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, []);

  return (
    <div
      className="relative flex h-screen min-h-0 w-full flex-col items-center justify-center overflow-hidden px-4"
      style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)', maxHeight: '100dvh' }}
    >
      <div className="vignette pointer-events-none absolute inset-0 z-[2]" />
      <div
        className="pointer-events-none absolute left-1/2 top-[25%] h-96 w-96 -translate-x-1/2 rounded-full blur-[80px]"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, rgba(236,72,153,0.06) 55%, transparent 75%)' }}
      />
      <div
        className="pointer-events-none absolute right-[-40px] top-[-20px] h-48 w-48 rounded-full blur-[60px] opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.8), transparent)' }}
      />
      <div
        className="pointer-events-none absolute bottom-[22%] left-[-40px] h-44 w-44 rounded-full blur-[55px] opacity-18"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent)' }}
      />

      <div className="relative z-[3] flex flex-col items-center justify-center pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
        <div className="relative mb-4 animate-float motion-reduce:animate-none">
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
        <p className="text-2xs font-medium uppercase tracking-[0.22em] text-white/30">{t('appSubtitle')}</p>
      </div>
    </div>
  );
}
