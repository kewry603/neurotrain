import { useLanguage } from '../i18n/LanguageContext';
import { useProgress } from '../context/ProgressContext';
import { BADGE_IDS } from '../utils/badges';

export default function BadgesSection({ compact = true }) {
  const { t } = useLanguage();
  const { hydrated, unlockedBadges = [] } = useProgress();
  const unlockedSet = new Set(unlockedBadges);
  const unlockedCount = hydrated ? unlockedBadges.length : 0;
  const showEmptyHint = hydrated && unlockedCount === 0;

  return (
    <div
      className={`rounded-2xl ${compact ? 'px-3 py-2' : 'px-3.5 py-3'}`}
      style={{
        background: 'rgba(139, 92, 246, 0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-white/80">{t('badgesTitle')}</h2>
      {showEmptyHint && (
        <p className="mb-1.5 text-[10px] leading-snug text-white/40">{t('badgesEmptyHint')}</p>
      )}
      <ul className="flex max-h-[88px] flex-col gap-1 overflow-y-auto pr-0.5">
        {BADGE_IDS.map((id) => {
          const unlocked = hydrated && unlockedSet.has(id);
          return (
            <li
              key={id}
              className={`flex items-start gap-2 rounded-lg px-2 py-1 text-[11px] leading-snug transition-opacity ${
                unlocked ? 'text-white/90' : 'text-white/35'
              }`}
              style={{
                background: unlocked ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)',
              }}
            >
              <span className="mt-0.5 flex-shrink-0 text-sm" aria-hidden>
                {unlocked ? '◆' : '◇'}
              </span>
              <span>
                <span className="font-semibold">{t(`badges.${id}.name`)}</span>
                <span className="block text-[10px] text-white/45">{t(`badges.${id}.desc`)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
