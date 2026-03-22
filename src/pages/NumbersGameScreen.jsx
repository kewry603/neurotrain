import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import { playSound, toggleMute, isMuted } from '../utils/sound';
import { useFinishSessionProgress } from '../hooks/useFinishSessionProgress';
import { usePremium } from '../context/PremiumContext';
import PremiumHardGateModal from '../components/PremiumHardGateModal';

// ─── Session & timing ───────────────────────────────────────────────────────────
/** How many rounds one full session lasts (one sequence attempt per round). */
const TOTAL_ROUNDS = 8;

/**
 * Level progression after a full session (8 rounds): Easy → Medium → Hard only.
 * Used on the session-complete overlay: "Go to Medium" / "Go to Hard" calls
 * `beginSession(nextId)` so the next difficulty starts at PREVIEW without SELECT.
 */
const NEXT_DIFFICULTY_AFTER_SESSION = { easy: 'medium', medium: 'hard' };

/**
 * How long the brief success / error flash stays on screen before the game
 * automatically continues. No tap required — this is the core of the smooth flow.
 */
const ROUND_FEEDBACK_MS = 1300;

// ─── Phases ───────────────────────────────────────────────────────────────────
// SELECT         → choose difficulty (instructions + level options)
// PREVIEW        → show the digit sequence briefly
// INPUT          → sequence hidden; player taps digits 0–9 in order
// ROUND_FEEDBACK → short correct / error message (auto-dismisses — no buttons)
// FINISHED       → 8 rounds done; session summary + optional next level + Play Again + Back Home
//
// All difficulties use the same mechanic: digits only (preview strip → recall).
// Harder levels differ by longer sequences, shorter preview, optional input cap — never by switching UI mode.
const PHASE = {
  SELECT:         'select',
  PREVIEW:        'preview',
  INPUT:          'input',
  ROUND_FEEDBACK: 'round_feedback',
  FINISHED:       'finished',
};

// ─── Difficulty (number-based only) ───────────────────────────────────────────
// Unique digits 0–9 per sequence (no repeats) — working memory, not arithmetic.
// Progression: 3 → 4 → 5 digits (gentle ramp for adults 40+). Difficulty scales via
// length, preview time, and (hard only) input time cap — same UI for every level.
const DIFFICULTIES = {
  easy: {
    id: 'easy', length: 3, previewMs: 3000,
    /** No input-phase time limit — comfortable pace. */
    inputLimitMs: null,
    emoji: '🌱', color: '#10b981', glow: 'rgba(16,185,129,0.65)',
  },
  medium: {
    id: 'medium', length: 4, previewMs: 2500,
    inputLimitMs: null,
    emoji: '⚡', color: '#f59e0b', glow: 'rgba(245,158,11,0.65)',
  },
  hard: {
    id: 'hard', length: 5, previewMs: 1800,
    /** Hard: must enter the sequence within this many ms (still digits + keypad only). */
    inputLimitMs: 22000,
    emoji: '🔥', color: '#ef4444', glow: 'rgba(239,68,68,0.65)',
  },
};

const DIFF_ORDER = ['easy', 'medium', 'hard'];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a sequence of `len` unique digits from 0–9. */
function generateSequence(len) {
  return shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, len);
}

/** Sequence length is fixed per level (see `DIFFICULTIES[].length`). */
function sequenceLengthForDifficulty(diffId) {
  return DIFFICULTIES[diffId].length;
}

/**
 * Visual size for each digit in the preview / input strip.
 * Longer sequences use smaller boxes so everything stays ONE horizontal row
 * (reads as a number sequence, not a wrapped “card grid”).
 */
function digitStripMetrics(len) {
  if (len <= 3) return { boxPx: 72, fontRem: 2.05 };
  if (len <= 5) return { boxPx: 54, fontRem: 1.58 };
  return { boxPx: 44, fontRem: 1.28 };
}

// ─── Difficulty overlay (instructions + level rows — not playing cards) ───────
function DifficultyOverlay({ onSelect, onBack, t }) {
  const tagKey = { easy: 'numbers.easyTag', medium: 'numbers.mediumTag', hard: 'numbers.hardTag' };

  return (
    <div className="absolute inset-0 z-30 flex min-h-0 flex-col overflow-hidden"
      style={{ background: 'rgba(18,14,46,0.97)', backdropFilter: 'blur(16px)' }}>

      <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full
        blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, #3b82f6)' }} />

      <div className="relative z-10 flex-shrink-0 px-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5
            text-white/60 hover:text-white transition-all text-xs font-semibold"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>
      </div>

      <div className="app-scroll relative flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-4xl animate-float">🔢</div>
          <h2 className="font-display font-black text-2xl text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)' }}>
            {t('numbers.title')}
          </h2>
          <p className="w-full text-center text-[11px] leading-relaxed text-white/40">
            {t('numbers.howToPlay')}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {DIFF_ORDER.map((id) => {
            const d = DIFFICULTIES[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className="numbers-difficulty-enter relative glass rounded-2xl px-4 py-3.5
                  flex items-center gap-4 text-left overflow-hidden
                  transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] group"
                style={{ borderColor: `${d.color}35` }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ background: d.color, boxShadow: `0 0 12px ${d.glow}` }} />
                <span className="text-2xl ml-1 flex-shrink-0">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display font-bold text-sm uppercase tracking-wider"
                      style={{ color: d.color, textShadow: `0 0 10px ${d.glow}` }}>
                      {t(`numbers.${id}`)}
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                      style={{ background: `${d.color}22`, color: d.color, border: `1px solid ${d.color}40` }}>
                      {t(tagKey[id])}
                    </span>
                  </div>
                  <p className="text-white/40 text-[11px] leading-snug">{t(`numbers.${id}Desc`)}</p>
                </div>
                <svg className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Preview: single-row digit strip + depleting bar ────────────────────────────
function PreviewDisplay({ sequence, previewMs, roundKey, t }) {
  const { boxPx, fontRem } = digitStripMetrics(sequence.length);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
      <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] font-semibold">
        {t('numbers.rememberSequence')}
      </p>

      {/* Single horizontal row: always a digit sequence (hard = 6 small digits, not a 2×3 card grid). */}
      <div
        className="flex flex-nowrap justify-center items-center gap-2 w-full max-w-full overflow-x-auto scrollbar-hide py-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {sequence.map((num, i) => (
          <div
            key={`${roundKey}-${i}`}
            className="flex-shrink-0 rounded-2xl flex items-center justify-center"
            style={{
              width: boxPx,
              height: boxPx,
              background: 'rgba(168,85,247,0.1)',
              border: '1.5px solid rgba(168,85,247,0.4)',
              boxShadow: '0 0 18px rgba(168,85,247,0.18)',
              animation: 'feedbackIn 0.35s ease both',
              animationDelay: `${i * 80}ms`,
            }}
          >
            <span
              className="font-display font-black select-none"
              style={{
                fontSize: `${fontRem}rem`,
                color: '#ffffff',
                textShadow: '0 0 22px rgba(168,85,247,0.9), 0 0 44px rgba(168,85,247,0.4)',
              }}
            >
              {num}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full flex flex-col gap-1.5">
        <p className="text-white/25 text-[10px] text-center uppercase tracking-widest">
          {t('numbers.memorizing')}
        </p>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/6">
          <div
            key={roundKey}
            className="memorize-timer-bar h-full rounded-full"
            style={{
              animationDuration: `${previewMs}ms`,
              background: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)',
              boxShadow: '0 0 8px rgba(168,85,247,0.5)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Input slots: same single-row strip as preview (aligned mental model) ────────
function InputSlots({ sequence, playerInput }) {
  const { boxPx, fontRem } = digitStripMetrics(sequence.length);

  return (
    <div
      className="flex flex-nowrap justify-center items-center gap-2 px-3 py-3 w-full max-w-full overflow-x-auto scrollbar-hide"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {sequence.map((_, i) => {
        const entered = playerInput[i];
        const active = i === playerInput.length;

        return (
          <div
            key={i}
            className="flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{
              width: boxPx,
              height: boxPx,
              background:
                entered !== undefined
                  ? 'rgba(168,85,247,0.15)'
                  : active
                  ? 'rgba(168,85,247,0.06)'
                  : 'rgba(255,255,255,0.03)',
              border:
                entered !== undefined
                  ? '1.5px solid rgba(168,85,247,0.5)'
                  : active
                  ? '1.5px solid rgba(168,85,247,0.25)'
                  : '1px solid rgba(255,255,255,0.07)',
              boxShadow: entered !== undefined ? '0 0 12px rgba(168,85,247,0.22)' : 'none',
            }}
          >
            {entered !== undefined ? (
              <span
                className="font-display font-black"
                style={{
                  fontSize: `${fontRem}rem`,
                  color: '#a855f7',
                  textShadow: '0 0 12px rgba(168,85,247,0.8)',
                }}
              >
                {entered}
              </span>
            ) : (
              <span className="text-white/15 text-sm select-none">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Keypad 0–9 ─────────────────────────────────────────────────────────────────
function Keypad({ onTap, onDelete, t }) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="px-4 pb-4 flex flex-col gap-2.5">
      <div className="grid grid-cols-3 gap-2.5">
        {keys.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onTap(n)}
            className="aspect-square rounded-2xl flex items-center justify-center
              font-display font-black text-2xl transition-all duration-150
              active:scale-90 hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onTap(0)}
        className="w-full py-3.5 rounded-2xl flex items-center justify-center
          font-display font-black text-2xl transition-all duration-150
          active:scale-95 hover:scale-[1.02]"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        0
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="w-full py-2.5 glass rounded-2xl flex items-center justify-center gap-2
          text-white/40 hover:text-white/70 text-xs font-semibold uppercase tracking-widest
          transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
          <line x1="18" y1="9" x2="15" y2="12" />
          <line x1="15" y1="9" x2="18" y2="12" />
        </svg>
        {t('numbers.delete')}
      </button>
    </div>
  );
}

// ─── Brief round feedback (no buttons — auto-continues via parent effect) ──────
function RoundFeedbackOverlay({ isCorrect, sequence, playerInput, t }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-5"
      style={{ background: 'rgba(18,14,46,0.92)', backdropFilter: 'blur(12px)' }}>

      <div className="absolute w-64 h-64 rounded-full blur-3xl opacity-18 pointer-events-none"
        style={{
          background: isCorrect
            ? 'radial-gradient(circle, #10b981, #a855f7)'
            : 'radial-gradient(circle, #ef4444, #a855f7)',
        }} />

      <div className="success-flash-inner relative flex w-full flex-col items-center gap-4 px-5 text-center sm:px-6">

        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: isCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `2px solid ${isCorrect ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.4)'}`,
            boxShadow: `0 0 24px ${isCorrect ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.18)'}`,
          }}
        >
          {isCorrect ? (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24"
              stroke="#34d399" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24"
              stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        <h2 className="font-display font-black text-xl text-transparent bg-clip-text leading-tight"
          style={{
            backgroundImage: isCorrect
              ? 'linear-gradient(90deg, #34d399, #a855f7, #ec4899)'
              : 'linear-gradient(90deg, #f87171, #ec4899, #a855f7)',
          }}
        >
          {isCorrect ? t('numbers.greatJob') : t('numbers.notQuite')}
        </h2>

        {/* Wrong attempts: show correct sequence vs yours (still no buttons). */}
        {!isCorrect && (
          <div className="glass rounded-2xl px-4 py-3 flex flex-col gap-3 w-full">
            <div>
              <p className="text-white/35 text-[9px] uppercase tracking-widest mb-1.5">
                {t('numbers.correctSequence')}
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {sequence.map((n, i) => (
                  <span key={i} className="font-display font-bold text-xl text-white">{n}</span>
                ))}
              </div>
            </div>
            <div className="h-px bg-white/8" />
            <div>
              <p className="text-white/35 text-[9px] uppercase tracking-widest mb-1.5">
                {t('numbers.yourInput')}
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {sequence.map((n, i) => {
                  const entered = playerInput[i];
                  const match = entered === n;
                  return (
                    <span
                      key={i}
                      className={`font-display font-bold text-xl ${match ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {entered ?? '?'}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Session complete (after 8 rounds) ──────────────────────────────────────────
function SessionCompleteOverlay({
  score,
  completedLevelId,
  completedDiff,
  onNextLevel,
  onPlayAgain,
  onBackHome,
  t,
}) {
  const accuracy = Math.round((score / TOTAL_ROUNDS) * 100);
  const stars = score >= TOTAL_ROUNDS - 1 ? 3 : score >= Math.ceil(TOTAL_ROUNDS / 2) ? 2 : 1;
  const nextId = NEXT_DIFFICULTY_AFTER_SESSION[completedLevelId];
  const nextLabel =
    nextId === 'medium' ? t('numbers.goToMedium') : nextId === 'hard' ? t('numbers.goToHard') : null;

  const primaryGradient =
    'w-full py-3 rounded-2xl font-display font-bold text-sm tracking-widest uppercase text-white transition-transform duration-200 active:scale-95';
  const secondaryBtn =
    'w-full py-3 rounded-2xl font-display font-bold text-sm tracking-widest uppercase text-white/90 transition-transform duration-200 active:scale-95 glass border border-white/12';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-4 sm:px-5"
      style={{ background: 'rgba(18,14,46,0.96)', backdropFilter: 'blur(16px)' }}>
      <div className="absolute w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, #3b82f6)' }} />

      <div className="win-overlay-inner relative flex w-full flex-col items-center gap-3 px-5 text-center sm:px-6">

        <div className="flex gap-2 text-3xl">
          {[1, 2, 3].map((n) => (
            <span key={n} style={{
              opacity: n <= stars ? 1 : 0.18,
              filter:  n <= stars ? 'none' : 'grayscale(1)',
            }}>⭐</span>
          ))}
        </div>

        <h2 className="font-display font-black text-2xl text-transparent bg-clip-text leading-tight"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)' }}>
          {t('numbers.sessionDone')}
        </h2>
        <p className="w-full text-xs leading-snug text-white/45">
          {t('numbers.sessionSuccessHint')}
        </p>

        <div className="glass rounded-2xl px-4 py-3 w-full flex flex-col gap-1.5">
          <span className="text-white/35 text-[9px] uppercase tracking-widest">{t('numbers.levelCompleted')}</span>
          <span
            className="font-display font-bold text-sm uppercase tracking-widest"
            style={{ color: completedDiff?.color ?? '#e9d5ff' }}
          >
            {completedDiff?.emoji} {t(`numbers.${completedLevelId}`)}
          </span>
        </div>

        <div className="glass rounded-2xl px-5 py-4 w-full flex flex-col gap-1">
          <span className="text-white/35 text-[9px] uppercase tracking-widest">{t('numbers.scoreLabel')}</span>
          <span className="font-display font-black text-4xl text-neon-purple text-glow-purple">
            {score}<span className="text-white/30 text-2xl font-bold">/{TOTAL_ROUNDS}</span>
          </span>
          <span className="text-white/30 text-xs">{accuracy}%</span>
        </div>

        <div className="flex flex-col gap-2.5 w-full mt-1">
          {nextId && nextLabel && (
            <button
              type="button"
              onClick={onNextLevel}
              className={primaryGradient}
              style={{
                background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)',
                boxShadow: '0 0 20px rgba(168,85,247,0.35)',
              }}
            >
              {nextLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onPlayAgain}
            className={nextId ? secondaryBtn : primaryGradient}
            style={
              nextId
                ? undefined
                : {
                    background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)',
                    boxShadow: '0 0 20px rgba(168,85,247,0.35)',
                  }
            }
          >
            {t('numbers.playAgain')}
          </button>
          <button
            type="button"
            onClick={onBackHome}
            className="w-full py-2.5 glass rounded-2xl text-white/70 hover:text-white
              text-xs font-semibold uppercase tracking-widest transition-all duration-200"
          >
            {t('numbers.backHome')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────────
export default function NumbersGameScreen({ onNavigate }) {
  const { t } = useLanguage();
  /** Premium: Hard sessions gated at `beginSession` and when advancing Medium→Hard after a run. */
  const { isPremium } = usePremium();
  const [showPremiumHardGate, setShowPremiumHardGate] = useState(false);
  const [muted, setMuted] = useState(isMuted());
  const handleMute = () => setMuted(toggleMute());

  const [difficulty, setDifficulty] = useState(null);
  const [phase, setPhase] = useState(PHASE.SELECT);
  const [sequence, setSequence] = useState([]);
  const [playerInput, setPlayerInput] = useState([]);
  const [roundKey, setRoundKey] = useState(0);
  /** Current round index within the session: 1 … TOTAL_ROUNDS */
  const [currentRound, setCurrentRound] = useState(1);
  /** Count of rounds answered correctly this session */
  const [score, setScore] = useState(0);

  const difficultyRef = useRef(null);
  /** Set when a session starts — used to build a unique XP award fingerprint (no double-award). */
  const sessionXpStampRef = useRef(0);
  const [sessionXpStamp, setSessionXpStamp] = useState(0);
  /** Keeps the latest round number for the auto-advance timeout (avoids stale closures). */
  const currentRoundRef = useRef(1);
  /**
   * Prevents the input-check effect from firing twice in React Strict Mode (dev),
   * which would otherwise double-count score or re-enter feedback.
   */
  const inputEvaluatedRef = useRef(false);
  /** Set when leaving INPUT → ROUND_FEEDBACK: true = round answered correctly (for round-complete chime). */
  const roundOutcomeCorrectRef = useRef(false);

  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  // Reset the one-shot input guard whenever a new memorization phase begins
  useEffect(() => {
    if (phase === PHASE.PREVIEW) inputEvaluatedRef.current = false;
  }, [phase, roundKey]);

  const diff = difficulty ? DIFFICULTIES[difficulty] : null;
  const previewMs = diff?.previewMs ?? 3000;

  /** Hard only: ms remaining to finish typing (shown as a slim bar — same family as the preview bar). */
  const [inputMsLeft, setInputMsLeft] = useState(null);

  /**
   * Optional input-phase time limit (hard mode): purely numeric pressure — still keypad-only.
   * When time hits zero we end the round as incorrect (same feedback path as a wrong sequence).
   */
  useEffect(() => {
    if (phase !== PHASE.INPUT || !diff?.inputLimitMs) {
      setInputMsLeft(null);
      return;
    }
    const limit = diff.inputLimitMs;
    const start = Date.now();
    setInputMsLeft(limit);
    const id = setInterval(() => {
      const rem = Math.max(0, limit - (Date.now() - start));
      setInputMsLeft(rem);
      if (rem <= 0) {
        clearInterval(id);
        if (!inputEvaluatedRef.current) {
          inputEvaluatedRef.current = true;
          roundOutcomeCorrectRef.current = false;
          playSound('wrong');
          setPhase(PHASE.ROUND_FEEDBACK);
        }
      }
    }, 120);
    return () => clearInterval(id);
  }, [phase, diff, roundKey]);

  // PREVIEW → INPUT after memorization window
  useEffect(() => {
    if (phase !== PHASE.PREVIEW || !diff) return;
    const id = setTimeout(() => {
      setPhase(PHASE.INPUT);
      setPlayerInput([]);
    }, previewMs);
    return () => clearTimeout(id);
  }, [phase, diff, previewMs]);

  // When the player fills all slots, evaluate and go straight to ROUND_FEEDBACK (no confirm step)
  useEffect(() => {
    if (phase !== PHASE.INPUT) return;
    if (sequence.length === 0) return;
    if (playerInput.length !== sequence.length) return;
    if (inputEvaluatedRef.current) return;
    inputEvaluatedRef.current = true;

    const ok = playerInput.every((n, i) => n === sequence[i]);
    roundOutcomeCorrectRef.current = ok;
    if (ok) {
      playSound('match');
      setScore((s) => s + 1);
    } else {
      playSound('wrong');
    }
    setPhase(PHASE.ROUND_FEEDBACK);
  }, [playerInput, sequence, phase]);

  /**
   * Automatic progression after each round:
   * - Stay on ROUND_FEEDBACK for ROUND_FEEDBACK_MS.
   * - If this was the last round (currentRound === TOTAL_ROUNDS) → FINISHED (session summary).
   * - Else → bump currentRound, generate a new sequence, return to PREVIEW.
   *
   * There is no user tap between rounds — the timer alone advances the flow.
   */
  useEffect(() => {
    if (phase !== PHASE.ROUND_FEEDBACK) return;

    const id = setTimeout(() => {
      const r = currentRoundRef.current;

      if (r >= TOTAL_ROUNDS) {
        playSound('sessionComplete');
        setPhase(PHASE.FINISHED);
        return;
      }

      if (roundOutcomeCorrectRef.current) {
        playSound('roundComplete');
      }

      const diffId = difficultyRef.current;
      const len = sequenceLengthForDifficulty(diffId);
      setSequence(generateSequence(len));
      setPlayerInput([]);
      setRoundKey((k) => k + 1);
      setCurrentRound((cr) => cr + 1);
      setPhase(PHASE.PREVIEW);
    }, ROUND_FEEDBACK_MS);

    return () => clearTimeout(id);
  }, [phase]);

  /** Starts a brand-new 8-round session for the chosen difficulty. */
  const beginSession = useCallback((diffId, options = {}) => {
    if (diffId === 'hard' && !isPremium) {
      setShowPremiumHardGate(true);
      return;
    }
    const { skipStartSound = false } = options;
    if (!skipStartSound) {
      playSound('start');
    }
    const stamp = Date.now();
    sessionXpStampRef.current = stamp;
    setSessionXpStamp(stamp);
    difficultyRef.current = diffId;
    currentRoundRef.current = 1;
    setDifficulty(diffId);
    setCurrentRound(1);
    setScore(0);
    setSequence(generateSequence(sequenceLengthForDifficulty(diffId)));
    setPlayerInput([]);
    setRoundKey((k) => k + 1);
    setPhase(PHASE.PREVIEW);
  }, [isPremium]);

  /** Replay: same difficulty, full session reset (round 1, score 0). */
  const handleSessionPlayAgain = useCallback(() => {
    const id = difficultyRef.current;
    if (id) beginSession(id);
  }, [beginSession]);

  /**
   * After 8 rounds on Easy or Medium: jump to the next difficulty and start
   * a new session immediately (PREVIEW), skipping the difficulty picker.
   */
  const handleSessionNextLevel = useCallback(() => {
    const id = difficultyRef.current;
    const next = id ? NEXT_DIFFICULTY_AFTER_SESSION[id] : null;
    if (next) {
      if (next === 'hard' && !isPremium) {
        setShowPremiumHardGate(true);
        return;
      }
      playSound('levelUp');
      beginSession(next, { skipStartSound: true });
    }
  }, [beginSession, isPremium]);

  const handleDigit = useCallback(
    (n) => {
      if (phase !== PHASE.INPUT) return;
      if (playerInput.length >= sequence.length) return;
      playSound('tap');
      setPlayerInput((prev) => [...prev, n]);
    },
    [phase, playerInput.length, sequence.length]
  );

  const handleDelete = useCallback(() => {
    if (phase !== PHASE.INPUT) return;
    if (playerInput.length === 0) return;
    setPlayerInput((prev) => prev.slice(0, -1));
  }, [phase, playerInput.length]);

  const roundFeedbackCorrect =
    phase === PHASE.ROUND_FEEDBACK &&
    playerInput.length === sequence.length &&
    playerInput.every((n, i) => n === sequence[i]);

  const showGameplayHeader = difficulty && phase !== PHASE.SELECT && phase !== PHASE.FINISHED;

  /** Performance-based XP and global stats when the 8-round session summary is shown. */
  const sessionFinished = phase === PHASE.FINISHED;
  const numbersXpFingerprint =
    sessionFinished && sessionXpStamp ? `numbers-${sessionXpStamp}` : null;
  useFinishSessionProgress(
    sessionFinished,
    numbersXpFingerprint,
    TOTAL_ROUNDS,
    score,
    Math.max(0, TOTAL_ROUNDS - score),
    true,
    difficulty ?? 'easy'
  );

  return (
    <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)' }}>

      <div className="absolute top-[-60px] right-[-60px] w-56 h-56 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      <div className="absolute bottom-[-40px] left-[-40px] w-52 h-52 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />

      <header className="flex items-center justify-between px-4 pt-6 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5
            text-white/60 hover:text-white transition-all text-xs font-semibold"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>

        <h1 className="font-display font-bold text-sm tracking-widest text-transparent bg-clip-text"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899)' }}
        >
          {t('numbers.title')}
        </h1>

        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={handleMute} />
          <LanguageToggle />
        </div>
      </header>

      {showGameplayHeader && (
        <div className="flex items-center justify-center gap-2 pb-1 flex-shrink-0 flex-wrap px-2">
          <span
            className="glass rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: diff.color }}
          >
            {diff.emoji} {t(`numbers.${difficulty}`)}
          </span>
          <span className="text-white/35 text-[9px] font-semibold">
            {t('game.round')} {currentRound}/{TOTAL_ROUNDS}
          </span>
          <span className="text-white/25 text-[9px]">
            · {sequence.length} {t('numbers.digits')}
          </span>
        </div>
      )}

      {phase === PHASE.PREVIEW && (
        <PreviewDisplay sequence={sequence} previewMs={previewMs} roundKey={roundKey} t={t} />
      )}

      {phase === PHASE.INPUT && (
        <div className="flex-1 flex flex-col justify-between min-h-0 pb-[max(6rem,env(safe-area-inset-bottom,0px))]">
          <div className="flex flex-col gap-1 pt-2">
            <p className="text-center text-white/35 text-[10px] uppercase tracking-widest">
              {t('numbers.enterSequence')}
            </p>
            {inputMsLeft != null && diff?.inputLimitMs != null && (
              <div className="px-5 pb-1">
                <div className="h-1 rounded-full bg-white/6 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-100 ease-linear"
                    style={{
                      width: `${(inputMsLeft / diff.inputLimitMs) * 100}%`,
                      background:
                        inputMsLeft < diff.inputLimitMs * 0.25
                          ? 'linear-gradient(90deg, #ef4444, #f97316)'
                          : 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)',
                      boxShadow: '0 0 6px rgba(168,85,247,0.35)',
                    }}
                  />
                </div>
              </div>
            )}
            <InputSlots sequence={sequence} playerInput={playerInput} />
          </div>
          <Keypad onTap={handleDigit} onDelete={handleDelete} t={t} />
        </div>
      )}

      {phase === PHASE.SELECT && (
        <DifficultyOverlay
          onSelect={beginSession}
          onBack={() => onNavigate('home')}
          t={t}
        />
      )}

      {phase === PHASE.ROUND_FEEDBACK && (
        <RoundFeedbackOverlay
          isCorrect={roundFeedbackCorrect}
          sequence={sequence}
          playerInput={playerInput}
          t={t}
        />
      )}

      {phase === PHASE.FINISHED && difficulty && diff && (
        <SessionCompleteOverlay
          score={score}
          completedLevelId={difficulty}
          completedDiff={diff}
          onNextLevel={handleSessionNextLevel}
          onPlayAgain={handleSessionPlayAgain}
          onBackHome={() => onNavigate('home')}
          t={t}
        />
      )}

      <PremiumHardGateModal
        open={showPremiumHardGate}
        onClose={() => setShowPremiumHardGate(false)}
        onGoPremium={() => {
          setShowPremiumHardGate(false);
          onNavigate('premium');
        }}
        t={t}
      />
    </div>
  );
}
