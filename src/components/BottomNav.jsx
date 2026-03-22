import { useLanguage } from '../i18n/LanguageContext';

const navItems = [
  {
    key: 'home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    active: true,
  },
  {
    key: 'train',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 2a7 7 0 017 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 017-7z" />
        <path d="M9 21h6M12 21v-3" />
      </svg>
    ),
    active: false,
  },
  {
    key: 'stats',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    active: false,
  },
  {
    key: 'profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    active: false,
  },
];

export default function BottomNav() {
  const { t } = useLanguage();

  return (
    <nav
      className="px-2 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
      style={{
        background: 'rgba(15, 12, 35, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex justify-around gap-1">
        {navItems.map((item) => (
          <button
            type="button"
            key={item.key}
            className={`btn-micro relative flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 motion-reduce:transition-none ${
              item.active
                ? 'text-fuchsia-300'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            style={
              item.active
                ? {
                    background: 'linear-gradient(160deg, rgba(124,58,237,0.28) 0%, rgba(236,72,153,0.12) 100%)',
                    boxShadow: '0 0 22px rgba(124,58,237,0.35), 0 0 12px rgba(236,72,153,0.15), inset 0 1px 0 rgba(255,255,255,0.10)',
                    border: '1px solid rgba(167,139,250,0.35)',
                  }
                : {}
            }
          >
            {/* Active indicator dot above icon */}
            {item.active && (
              <span
                className="absolute top-1.5 h-1 w-4 rounded-full"
                style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', boxShadow: '0 0 12px rgba(139,92,246,0.55)' }}
              />
            )}
            {item.icon}
            <span className="text-2xs font-semibold uppercase tracking-widest">
              {t(`nav.${item.key}`)}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
