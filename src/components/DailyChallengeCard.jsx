import { useLanguage } from '../i18n/LanguageContext';

export default function DailyChallengeCard() {
  const { t } = useLanguage();

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-3.5 py-3"
      style={{
        background: 'rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.13)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-40"
        style={{ background: 'radial-gradient(circle, #99f6e4, #bfddff)' }}
      />

      <div className="relative">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-widest text-white/50">
              {t('dailyChallenge')}
            </p>
            <h3 className="text-base font-bold leading-tight text-white">{t('dailyChallengeLabel')}</h3>
          </div>
          <span
            className="flex-shrink-0 rounded-full px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-emerald-300"
            style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.30)' }}
          >
            {t('readyLabel')}
          </span>
        </div>

        <p className="mb-2.5 text-sm leading-snug text-white/65">{t('dailyChallengeDesc')}</p>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <svg className="h-3.5 w-3.5 text-sky-400" fill="none" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-semibold text-white/80">{t('dailyChallengeTime')}</span>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(14,165,233,0.14)', border: '1px solid rgba(14,165,233,0.28)' }}
          >
            <svg className="h-3.5 w-3.5 text-sky-400" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1l1.9 3.8 4.1.6-3 2.9.7 4.1L8 10.5 4.3 12.4l.7-4.1-3-2.9 4.1-.6z" />
            </svg>
            <span className="text-xs font-bold text-sky-300">{t('dailyChallengeXP')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
