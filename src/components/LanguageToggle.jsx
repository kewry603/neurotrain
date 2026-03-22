import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label="Toggle language"
      className="flex min-h-[48px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold tracking-widest shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:border-primary/35 hover:shadow-md"
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
