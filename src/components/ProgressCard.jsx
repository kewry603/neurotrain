import { useLanguage } from '../i18n/LanguageContext';
import { useProgress } from '../context/ProgressContext';
import {
  getLevelFromTotalXp,
  getXpToNextLevel,
  getLevelProgressPercent,
} from '../utils/progression';

function StatBadge({ value, label, color }) {
  const colorMap = {
    purple: 'text-violet-300 font-bold',
    pink: 'text-pink-300 font-bold',
    cyan: 'text-cyan-300 font-bold',
    blue: 'text-sky-300 font-bold',
  };
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-lg font-bold ${colorMap[color] ?? 'text-ink'}`}>
        {value}
      </span>
      <span className="text-center text-[9px] font-semibold uppercase tracking-widest text-white/50">
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
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ProgressCard() {
  const { t } = useLanguage();
  const { totalXp, hydrated } = useProgress();

  const level = hydrated ? getLevelFromTotalXp(totalXp) : 1;
  const xpToNext = hydrated ? getXpToNextLevel(totalXp) : 20;
  const ringPct = hydrated ? getLevelProgressPercent(totalXp) : 0;

  return (
    <div
      className="rounded-2xl px-3.5 py-3 transition-transform duration-150 active:scale-[0.985] motion-reduce:active:scale-100"
      style={{
        background: 'rgba(255, 255, 255, 0.065)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.11)',
        boxShadow: '0 6px 28px rgba(0, 0, 0, 0.28), 0 1px 0 rgba(255,255,255,0.08) inset',
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">{t('progress')}</h2>
        <span className="text-xs font-semibold text-sky-400">{t('viewDetails')} →</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <CircularProgress percent={ringPct} size={52} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-extrabold leading-none text-white">{level}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
              {t('progressPlayerLevel')}
            </span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5">
          <StatBadge value={hydrated ? totalXp : '—'} label={t('progressTotalXp')} color="cyan" />
          <StatBadge value={hydrated ? xpToNext : '—'} label={t('progressXpToNext')} color="purple" />
        </div>
      </div>
    </div>
  );
}
