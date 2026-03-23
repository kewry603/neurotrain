import { useState, useCallback, useMemo, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import PremiumHardGateModal from '../components/PremiumHardGateModal';
import { MIND_WELLNESS_ARTICLES, MIND_WELLNESS_CATEGORY_ORDER } from '../data/mindWellnessArticles';
import { useLanguage } from '../i18n/LanguageContext';
import { usePremium } from '../context/PremiumContext';
import { useProgress } from '../context/ProgressContext';
import { playSound, toggleMute, isMuted } from '../utils/sound';

/**
 * Mental wellness articles — list + optional detail; premium articles use PremiumHardGateModal.
 */
export default function MindWellnessScreen({ onNavigate, activeNav = 'wellness' }) {
  const { t } = useLanguage();
  const { isPremium } = usePremium();
  const { mergeAchievementFlags } = useProgress();
  const [muted, setMuted] = useState(isMuted());
  const [selectedId, setSelectedId] = useState(null);
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  const byCategory = useMemo(() => {
    /** @type {Record<string, typeof MIND_WELLNESS_ARTICLES>} */
    const m = {};
    for (const c of MIND_WELLNESS_CATEGORY_ORDER) m[c] = [];
    for (const a of MIND_WELLNESS_ARTICLES) {
      m[a.category]?.push(a);
    }
    return m;
  }, []);

  const goBack = useCallback(() => {
    if (typeof onNavigate === 'function') onNavigate('home');
  }, [onNavigate]);

  const handleReadMore = useCallback(
    (article) => {
      playSound('tap');
      if (article.premium && !isPremium) {
        setShowPremiumGate(true);
        return;
      }
      setSelectedId(article.id);
    },
    [isPremium]
  );

  const closeDetail = useCallback(() => setSelectedId(null), []);

  useEffect(() => {
    if (selectedId) mergeAchievementFlags({ wellnessArticleOpened: true });
  }, [selectedId, mergeAchievementFlags]);

  const selectedArticle = useMemo(
    () => MIND_WELLNESS_ARTICLES.find((a) => a.id === selectedId) ?? null,
    [selectedId]
  );

  const bodyParagraphs = selectedId
    ? String(t(`wellness.articles.${selectedId}.body`) || '')
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  if (selectedArticle) {
    return (
      <div
        className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)' }}
      >
        <div className="vignette pointer-events-none absolute inset-0 z-[2]" />
        <header className="relative z-[3] flex flex-shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-5">
          <button
            type="button"
            onClick={() => {
              playSound('tap');
              closeDetail();
            }}
            className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:text-white glass"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {t('wellness.backToList')}
          </button>
          <div className="flex items-center gap-2">
            <MuteButton muted={muted} onToggle={() => setMuted(toggleMute())} />
            <LanguageToggle />
          </div>
        </header>

        <div className="app-scroll relative z-[3] flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-1 sm:px-5">
          <h1 className="mb-3 font-display text-xl font-bold leading-snug text-white sm:text-2xl">
            {t(`wellness.articles.${selectedArticle.id}.title`)}
          </h1>
          <div className="space-y-4 text-sm leading-relaxed text-white/75">
            {bodyParagraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)' }}
    >
      <div className="vignette pointer-events-none absolute inset-0 z-[2]" />

      <header className="relative z-[3] flex flex-shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-5">
        <button
          type="button"
          onClick={goBack}
          className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:text-white glass"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>
        <h1
          className="min-w-0 flex-1 text-center font-display text-sm font-bold tracking-tight text-transparent bg-clip-text sm:text-base"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899)' }}
        >
          {t('wellness.title')}
        </h1>
        <div className="flex w-[72px] shrink-0 justify-end gap-2 sm:w-[80px]">
          <MuteButton muted={muted} onToggle={() => setMuted(toggleMute())} />
          <LanguageToggle />
        </div>
      </header>

      <div className="app-scroll relative z-[3] flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-2 pt-1 sm:px-5">
        <p className="mb-4 text-center text-xs leading-relaxed text-white/45">{t('wellness.subtitle')}</p>

        <div className="flex flex-col gap-6 pb-2">
          {MIND_WELLNESS_CATEGORY_ORDER.map((cat) => {
            const items = byCategory[cat] ?? [];
            if (items.length === 0) return null;
            return (
              <section key={cat}>
                <h2 className="mb-2 text-2xs font-bold uppercase tracking-widest text-fuchsia-300/80">
                  {t(`wellness.categories.${cat}`)}
                </h2>
                <div className="flex flex-col gap-3">
                  {items.map((article) => (
                    <div
                      key={article.id}
                      className="rounded-2xl p-4"
                      style={{
                        background: 'rgba(139, 92, 246, 0.08)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold leading-snug text-white">{t(`wellness.articles.${article.id}.title`)}</h3>
                        {article.premium && (
                          <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200/95">
                            {isPremium ? '✓' : t('wellness.premiumBadge')}
                          </span>
                        )}
                      </div>
                      <p className="mb-3 text-xs leading-relaxed text-white/55">{t(`wellness.articles.${article.id}.desc`)}</p>
                      <button
                        type="button"
                        onClick={() => handleReadMore(article)}
                        className="w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-95 active:scale-[0.99]"
                        style={{
                          background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)',
                          boxShadow: '0 0 16px rgba(168,85,247,0.25)',
                        }}
                      >
                        {t('wellness.readMore')}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="relative z-[3] flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
        <BottomNav activeKey={activeNav} onNavigate={onNavigate} />
      </div>

      <PremiumHardGateModal
        open={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        onGoPremium={() => {
          setShowPremiumGate(false);
          if (typeof onNavigate === 'function') onNavigate('premium');
        }}
        t={t}
        titleKey="wellness.premiumLockedTitle"
        messageKey="wellness.premiumLockedMessage"
      />
    </div>
  );
}
