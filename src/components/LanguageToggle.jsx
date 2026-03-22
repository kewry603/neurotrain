import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label="Toggle language"
      className="flex min-h-[48px] items-center gap-2 rounded-full border px-4 text-sm font-semibold tracking-widest transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md"
      style={{ background: 'rgba(255,255,255,0.52)', borderColor: 'rgba(255,255,255,0.70)', boxShadow: '0 2px 10px rgba(60,100,180,0.12)' }}
    >
      <span className={lang === 'en' ? 'font-bold text-primary' : 'text-slate-400'}>
        EN
      </span>
      <span className="text-slate-300">/</span>
      <span className={lang === 'es' ? 'font-bold text-primary' : 'text-slate-400'}>
        ES
      </span>
    </button>
  );
}
