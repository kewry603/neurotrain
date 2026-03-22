import { useLanguage } from '../i18n/LanguageContext';
import { useProgress } from '../context/ProgressContext';
import {
  getLevelFromTotalXp,
  getXpToNextLevel,
  getLevelProgressPercent,
} from '../utils/progression';

function StatBadge({ value, label, color, compact = false }) {
  const colorMap = {
    purple: 'text-fuchsia-300 font-bold',
    pink: 'text-pink-300 font-bold',
    cyan: 'text-violet-300 font-bold',
    blue: 'text-fuchsia-200 font-bold',
  };
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`font-bold ${compact ? 'text-base' : 'text-lg'} ${colorMap[color] ?? 'text-ink'}`}>
        {value}
      </span>
      <span className="text-center text-[9px] font-semibold uppercase tracking-widest text-white/40">
        {label}
      </span>
    </div>
  );
}

function CircularProgress({ percent, size = 52 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="6" stroke="rgba(255,255,255,0.12)" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth="6"
        stroke="url(#progressGrad)"
        fill="none"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ProgressCard({ compact = false }) {
  const { t } = useLanguage();
  const {
    totalXp,
    hydrated,
    totalRoundsCompleted,
    overallAccuracy,
    totalSessionsCompleted,
    currentStreak,
    streakCelebration,
  } = useProgress();

  const level = hydrated ? getLevelFromTotalXp(totalXp) : 1;
  const xpToNext = hydrated ? getXpToNextLevel(totalXp) : 20;
  const ringPct = hydrated ? getLevelProgressPercent(totalXp) : 0;
  const ringSize = compact ? 44 : 52;

  return (
    <div
      className={`card-lift rounded-2xl motion-reduce:active:scale-100 ${compact ? 'px-3 py-2' : 'px-3.5 py-3'}`}
      style={{
        background: 'rgba(139, 92, 246, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 6px 28px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/90">{t('progress')}</h2>
        <span className="text-xs font-semibold" style={{ color: '#e879f9' }}>{t('viewDetails')} →</span>
      </div>

      <div
        className={`mb-2 rounded-lg px-2 py-1.5 transition-all duration-500 ${
          streakCelebration ? 'bg-fuchsia-500/20 ring-1 ring-fuchsia-400/50' : 'bg-white/[0.04]'
        }`}
      >
        <p className={`text-center text-xs font-semibold ${streakCelebration ? 'text-fuchsia-200' : 'text-white/80'}`}>
          {hydrated ? t('streakDays').replace('{count}', String(Math.max(0, currentStreak))) : '—'}
        </p>
        {streakCelebration && hydrated && (
          <p className="mt-0.5 text-center text-[10px] font-medium text-fuchsia-300/90">{t('streakRewardShort')}</p>
        )}
      </div>

      <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
        <div className="relative flex-shrink-0">
          <CircularProgress percent={ringPct} size={ringSize} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-extrabold leading-none text-white ${compact ? 'text-sm' : 'text-base'}`}>{level}</span>
            <span className={`font-semibold uppercase tracking-wider text-white/45 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
              {t('progressPlayerLevel')}
            </span>
          </div>
        </div>

        <div className={`grid flex-1 grid-cols-2 ${compact ? 'gap-x-2 gap-y-1' : 'gap-x-3 gap-y-1.5'}`}>
          <StatBadge value={hydrated ? totalXp : '—'} label={t('progressTotalXp')} color="cyan" compact={compact} />
          <StatBadge value={hydrated ? xpToNext : '—'} label={t('progressXpToNext')} color="purple" compact={compact} />
        </div>
      </div>

      <div
        className={`grid w-full grid-cols-3 border-t border-white/10 ${compact ? 'mt-1.5 gap-x-1 pt-1.5' : 'mt-2 gap-x-2 pt-2'}`}
      >
        <StatBadge
          value={hydrated ? totalRoundsCompleted : '—'}
          label={t('progressRoundsTotal')}
          color="cyan"
          compact={compact}
        />
        <StatBadge
          value={hydrated ? `${overallAccuracy}%` : '—'}
          label={t('progressAccuracyLabel')}
          color="purple"
          compact={compact}
        />
        <StatBadge
          value={hydrated ? totalSessionsCompleted : '—'}
          label={t('progressSessionsTotal')}
          color="blue"
          compact={compact}
        />
      </div>
    </div>
  );
}
