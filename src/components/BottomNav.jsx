import { useLanguage } from '../i18n/LanguageContext';

const NAV_KEYS = ['home', 'games', 'stats', 'achievements', 'wellness', 'premium'];

const icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  games: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2a7 7 0 017 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 017-7z" />
      <path d="M9 21h6M12 21v-3" />
    </svg>
  ),
  stats: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  achievements: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
        clipRule="evenodd"
      />
    </svg>
  ),
  wellness: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    </svg>
  ),
  premium: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6L12 2z" />
    </svg>
  ),
};

/**
 * @param {{ activeKey?: string, onNavigate?: (screen: string) => void }} props
 */
export default function BottomNav({ activeKey = 'home', onNavigate }) {
  const { t } = useLanguage();

  const go = (key) => {
    if (typeof onNavigate !== 'function') return;
    if (key === 'home') onNavigate('home');
    if (key === 'games') onNavigate('games');
    if (key === 'stats') onNavigate('stats');
    if (key === 'achievements') onNavigate('achievements');
    if (key === 'wellness') onNavigate('wellness');
    if (key === 'premium') onNavigate('premium');
  };

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
      <div className="flex justify-between gap-0.5 px-0.5">
        {NAV_KEYS.map((key) => {
          const active = activeKey === key;
          return (
            <button
              type="button"
              key={key}
              onClick={() => go(key)}
              className={`btn-micro relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 motion-reduce:transition-none ${
                active ? 'text-fuchsia-300' : 'text-slate-400 hover:text-slate-300'
              }`}
              style={
                active
                  ? {
                      background: 'linear-gradient(160deg, rgba(124,58,237,0.28) 0%, rgba(236,72,153,0.12) 100%)',
                      boxShadow: '0 0 22px rgba(124,58,237,0.35), 0 0 12px rgba(236,72,153,0.15), inset 0 1px 0 rgba(255,255,255,0.10)',
                      border: '1px solid rgba(167,139,250,0.35)',
                    }
                  : {}
              }
            >
              {active && (
                <span
                  className="absolute top-1.5 h-1 w-4 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                    boxShadow: '0 0 12px rgba(139,92,246,0.55)',
                  }}
                />
              )}
              {icons[key]}
              <span className="max-w-full truncate text-[7px] font-semibold uppercase tracking-tighter sm:text-[9px] sm:tracking-widest">{t(`nav.${key}`)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
