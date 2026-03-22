import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label="Toggle language"
      className="flex min-h-[48px] items-center gap-2 rounded-full px-4 text-sm font-semibold tracking-widest transition-all duration-200 motion-reduce:transition-none"
      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
    >
      <span className={lang === 'en' ? 'font-bold text-fuchsia-400' : 'text-slate-400'}>
        EN
      </span>
      <span className="text-white/25">/</span>
      <span className={lang === 'es' ? 'font-bold text-fuchsia-400' : 'text-slate-400'}>
        ES
      </span>
    </button>
  );
}
