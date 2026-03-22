/**
 * Shown when the user picks Hard (or would enter Hard) without Premium.
 * Does not start the game — “Go Premium” navigates to the Premium info screen.
 */
export default function PremiumHardGateModal({ open, onClose, onGoPremium, t }) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[80] flex items-center justify-center px-5"
      style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-hard-gate-title"
    >
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-elevated">
        <p id="premium-hard-gate-title" className="mb-2 text-xl font-bold text-slate-900">
          {t('premium.hardLockedTitle')}
        </p>
        <p className="mb-6 text-base leading-relaxed text-slate-600">{t('premium.hardLockedMessage')}</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onGoPremium}
            className="btn-primary shadow-btn"
          >
            {t('premium.goPremium')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            {t('premium.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
