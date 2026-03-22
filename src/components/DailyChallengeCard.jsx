import { useLanguage } from '../i18n/LanguageContext';

export default function DailyChallengeCard() {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-card-gradient px-3.5 py-3 shadow-card">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-30"
        style={{ background: 'radial-gradient(circle, #99f6e4, #e0f2fe)' }}
      />

      <div className="relative">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-widest text-slate-500">
              {t('dailyChallenge')}
            </p>
            <h3 className="text-base font-bold leading-tight text-slate-900">{t('dailyChallengeLabel')}</h3>
          </div>
          <span className="flex-shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-emerald-800">
            {t('readyLabel')}
          </span>
        </div>

        <p className="mb-2.5 text-sm leading-snug text-slate-600">{t('dailyChallengeDesc')}</p>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-semibold text-slate-800">{t('dailyChallengeTime')}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5">
            <svg className="h-3.5 w-3.5 text-primary" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1l1.9 3.8 4.1.6-3 2.9.7 4.1L8 10.5 4.3 12.4l.7-4.1-3-2.9 4.1-.6z" />
            </svg>
            <span className="text-xs font-bold text-primary">{t('dailyChallengeXP')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
