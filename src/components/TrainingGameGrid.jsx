import { useLanguage } from '../i18n/LanguageContext';

/** Same game shortcuts as Home — keeps navigation consistent. */
const CATEGORY_GRID = [
  [
    {
      labelKey: 'memory',
      active: true,
      screen: 'memory',
      accent: '#8b5cf6',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
          <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="12" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="12" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="12" y="12" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      labelKey: 'focus',
      active: false,
      screen: 'focus',
      accent: '#c084fc',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
  ],
  [
    {
      labelKey: 'numbers',
      active: false,
      screen: 'numbers',
      accent: '#e879f9',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M5 6h10M5 10h6M5 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 13l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      labelKey: 'wordMemory',
      active: false,
      screen: 'wordMemory',
      accent: '#f472b6',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M4 5h12M4 9h8M4 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
  ],
];

const SPATIAL_CAT = {
  labelKey: 'spatial',
  active: false,
  screen: 'spatial',
  accent: '#38bdf8',
  icon: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    </svg>
  ),
};

const btnClass =
  'btn-micro flex flex-col items-center justify-center gap-1 rounded-xl min-h-[52px] w-full cursor-pointer motion-reduce:transition-none';

/**
 * @param {{ onNavigate: (screen: string) => void, sectionLabel?: string, showSpatial?: boolean }} props
 */
export default function TrainingGameGrid({ onNavigate, sectionLabel, showSpatial = false }) {
  const { t } = useLanguage();

  const go = (screen) => {
    if (screen && typeof onNavigate === 'function') onNavigate(screen);
  };

  return (
    <div className="relative z-20 w-full">
      {sectionLabel && (
        <p
          className="mb-2 text-2xs font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(192,132,252,0.65)' }}
        >
          {sectionLabel}
        </p>
      )}
      <div className="grid w-full grid-cols-2 gap-2">
        {CATEGORY_GRID.map((row) =>
          row.map((cat) => {
            const accentRgb = cat.accent
              ? cat.accent.replace('#', '').match(/.{2}/g).map((h) => parseInt(h, 16)).join(',')
              : '255,255,255';
            return (
              <button
                key={cat.labelKey}
                type="button"
                onClick={() => go(cat.screen)}
                className={btnClass}
                style={
                  cat.active
                    ? {
                        color: cat.accent || '#8b5cf6',
                        background: `linear-gradient(135deg, rgba(${accentRgb},0.18) 0%, rgba(${accentRgb},0.08) 100%)`,
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: `1px solid rgba(${accentRgb},0.42)`,
                        boxShadow: `0 0 22px rgba(${accentRgb},0.24), 0 4px 16px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.10)`,
                      }
                    : {
                        color: cat.accent || 'rgba(255,255,255,0.75)',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.13)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)',
                      }
                }
              >
                <span style={{ opacity: cat.active ? 1 : 0.8 }}>{cat.icon}</span>
                <span className="text-xs font-semibold tracking-wide" style={{ opacity: cat.active ? 1 : 0.8 }}>
                  {t(`homeCategories.${cat.labelKey}`)}
                </span>
              </button>
            );
          })
        )}
      </div>
      {showSpatial && (
        <div className="mt-2">
          {(() => {
            const cat = SPATIAL_CAT;
            const accentRgb = cat.accent
              .replace('#', '')
              .match(/.{2}/g)
              .map((h) => parseInt(h, 16))
              .join(',');
            return (
              <button
                type="button"
                onClick={() => go(cat.screen)}
                className={btnClass}
                style={{
                  color: cat.accent,
                  background: `linear-gradient(135deg, rgba(${accentRgb},0.16) 0%, rgba(${accentRgb},0.06) 100%)`,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid rgba(${accentRgb},0.38)`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)`,
                }}
              >
                <span className="opacity-90">{cat.icon}</span>
                <span className="text-xs font-semibold tracking-wide opacity-90">{t(`homeCategories.${cat.labelKey}`)}</span>
              </button>
            );
          })()}
        </div>
      )}
    </div>
  );
}
