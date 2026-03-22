import { useLanguage } from '../i18n/LanguageContext';
import { useProgress } from '../context/ProgressContext';
import { DAILY_CHALLENGE_BONUS_XP } from '../utils/dailyChallenge';

function challengeHeadline(t, type, target) {
  switch (type) {
    case 'sessions':
      return t('dailyChallengeHeadlineSessions').replace('{n}', String(target));
    case 'accuracy_session':
      return t('dailyChallengeHeadlineAccuracy').replace('{n}', String(target));
    case 'mistake_free_rounds':
      return t('dailyChallengeHeadlineRounds').replace('{n}', String(target));
    default:
      return t('dailyChallenge');
  }
}

function progressText(t, type, target, progress, completed) {
  if (completed) return t('dailyChallengeComplete');
  switch (type) {
    case 'sessions':
      return t('dailyChallengeProgressSessions')
        .replace('{current}', String(Math.min(progress, target)))
        .replace('{target}', String(target));
    case 'accuracy_session':
      return t('dailyChallengeProgressAccuracy')
        .replace('{current}', String(Math.min(progress, target)))
        .replace('{target}', String(target));
    case 'mistake_free_rounds':
      return t('dailyChallengeProgressRounds')
        .replace('{current}', String(Math.min(progress, target)))
        .replace('{target}', String(target));
    default:
      return '—';
  }
}

export default function DailyChallengeCard({ compact = false }) {
  const { t } = useLanguage();
  const { hydrated, dailyChallenge } = useProgress();

  const dc = dailyChallenge;
  const type = dc?.type ?? 'sessions';
  const target = dc?.target ?? 2;
  const progress = dc?.progress ?? 0;
  const completed = Boolean(dc?.completed);

  const headline = challengeHeadline(t, type, target);
  const progLine = hydrated ? progressText(t, type, target, progress, completed) : '—';
  const pct =
    target > 0 ? Math.min(100, Math.round((Math.min(progress, target) / target) * 100)) : 0;

  return (
    <div
      className={`card-lift relative overflow-hidden rounded-2xl motion-reduce:active:scale-100 ${compact ? 'px-3 py-2' : 'px-3.5 py-3'}`}
      style={{
        background: 'rgba(139, 92, 246, 0.08)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.45), rgba(236,72,153,0.35))' }}
      />

      <div className="relative">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-widest text-white/55">
              {t('dailyChallenge')}
            </p>
            <h3 className="text-base font-bold leading-tight text-white">{headline}</h3>
          </div>
          <span
            className="flex-shrink-0 rounded-full px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-fuchsia-200"
            style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(236,72,153,0.35)' }}
          >
            {completed ? t('dailyChallengeDone') : t('dailyChallengeInProgress')}
          </span>
        </div>

        <p className={`leading-snug text-white/45 ${compact ? 'mb-1.5 line-clamp-2 text-xs' : 'mb-2.5 text-sm'}`}>
          {t('dailyChallengeDesc')}
        </p>

        <div className={`mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8 ${compact ? '' : ''}`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)',
              boxShadow: '0 0 8px rgba(168,85,247,0.45)',
            }}
          />
        </div>

        <p className="mb-1.5 text-xs font-semibold text-white/75">{progLine}</p>

        <div className={`flex flex-wrap items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 ${compact ? 'py-1' : 'py-1.5'}`}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <svg className="h-3.5 w-3.5 text-fuchsia-400" fill="none" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-semibold text-white/80">{t('dailyChallengeToday')}</span>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 ${compact ? 'py-1' : 'py-1.5'}`}
            style={{ background: 'rgba(139,92,246,0.16)', border: '1px solid rgba(236,72,153,0.28)' }}
          >
            <svg className="h-3.5 w-3.5 text-fuchsia-300" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1l1.9 3.8 4.1.6-3 2.9.7 4.1L8 10.5 4.3 12.4l.7-4.1-3-2.9 4.1-.6z" />
            </svg>
            <span className="text-xs font-bold text-fuchsia-200">
              {t('dailyChallengeBonusXp').replace('{xp}', String(DAILY_CHALLENGE_BONUS_XP))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
