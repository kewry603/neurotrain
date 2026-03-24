import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import { playSound, toggleMute, isMuted } from '../utils/sound';
import { getWordPoolForLang } from '../data/wordMemoryPools';
import { useFinishSessionProgress } from '../hooks/useFinishSessionProgress';
import { usePremium } from '../context/PremiumContext';
import PremiumHardGateModal from '../components/PremiumHardGateModal';

// ─── Session & timing ───────────────────────────────────────────────────────────
const TOTAL_ROUNDS = 8;
/** Brief success / error flash before the next round (or session end) — no tap required. */
const ROUND_FEEDBACK_MS = 1350;

/** After session: Easy → Medium → Hard → Expert; Expert has no “next” on the summary overlay. */
const NEXT_DIFFICULTY_AFTER_SESSION = { easy: 'medium', medium: 'hard', hard: 'expert' };

// ─── Phases ─────────────────────────────────────────────────────────────────────
// SELECT         → choose difficulty
// READY          → short instructions + Start (calm onboarding each session)
// PREVIEW        → target words visible for a few seconds
// INPUT          → mixed targets + distractors; user taps to select, then Check
// ROUND_FEEDBACK → correct / incorrect (auto-advances)
// FINISHED       → 8 rounds done; score + Play Again / Next / Home
const PHASE = {
  SELECT: 'select',
  READY: 'ready',
  PREVIEW: 'preview',
  INPUT: 'input',
  ROUND_FEEDBACK: 'round_feedback',
  FINISHED: 'finished',
};

/**
 * Per level: how many words to memorize, how many decoys in the mixed list, preview time.
 * Distractors are always drawn from the same pool but never overlap the targets for that round.
 */
const DIFFICULTIES = {
  easy: {
    id: 'easy',
    targets: 3,
    distractors: 2,
    previewMs: 3500,
    emoji: '🌱',
    color: '#10b981',
  },
  medium: {
    id: 'medium',
    targets: 4,
    distractors: 3,
    previewMs: 3000,
    emoji: '⚡',
    color: '#f59e0b',
  },
  hard: {
    id: 'hard',
    targets: 5,
    distractors: 4,
    previewMs: 2500,
    emoji: '🔥',
    color: '#ef4444',
  },
  expert: {
    id: 'expert',
    targets: 6,
    distractors: 5,
    previewMs: 2100,
    emoji: '💎',
    color: '#a855f7',
  },
};

const DIFF_ORDER = ['easy', 'medium', 'hard', 'expert'];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build one round: pick N random targets from the pool, then M distractors from the remainder,
 * then shuffle targets + distractors for the input grid. Targets and distractors are disjoint.
 */
function pickRoundWords(wordPool, cfg) {
  const need = cfg.targets + cfg.distractors;
  if (wordPool.length < need) {
    throw new Error(`Word pool too small: need ${need}, have ${wordPool.length}`);
  }
  const shuffled = shuffle([...wordPool]);
  const targets = shuffled.slice(0, cfg.targets);
  const distractors = shuffled.slice(cfg.targets, cfg.targets + cfg.distractors);
  const mixed = shuffle([...targets, ...distractors]);
  return { targets, distractors, mixed };
}

/** True iff the player selected exactly the target set (order ignored). */
function selectionMatchesTargets(selected, targets) {
  if (selected.length !== targets.length) return false;
  const tset = new Set(targets);
  if (!selected.every((w) => tset.has(w))) return false;
  const sset = new Set(selected);
  return targets.every((w) => sset.has(w));
}

// ─── Overlays ───────────────────────────────────────────────────────────────────
function DifficultyOverlay({ onSelect, onBack, t }) {
  const tagKey = {
    easy: 'wordMemory.easyTag',
    medium: 'wordMemory.mediumTag',
    hard: 'wordMemory.hardTag',
    expert: 'wordMemory.expertTag',
  };
  return (
    <div
      className="absolute inset-0 z-30 flex min-h-0 flex-col overflow-hidden"
      style={{ background: 'rgba(18,14,46,0.97)', backdropFilter: 'blur(16px)' }}
    >
      <div
        className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, #3b82f6)' }}
      />
      <div className="relative z-10 flex-shrink-0 px-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-white/60 hover:text-white transition-all text-xs font-semibold"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5 relative">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-4xl animate-float">📝</div>
          <h2
            className="font-display font-black text-2xl text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)' }}
          >
            {t('wordMemory.title')}
          </h2>
          <p className="w-full text-center text-[11px] leading-relaxed text-white/40">{t('wordMemory.howToPlay')}</p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          {DIFF_ORDER.map((id) => {
            const d = DIFFICULTIES[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className="w-full py-3 px-4 rounded-2xl glass border border-white/10 text-left transition-all duration-200 active:scale-[0.98] hover:border-white/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-sm" style={{ color: d.color }}>
                    {d.emoji} {t(`wordMemory.${id}`)}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-white/35">{t(tagKey[id])}</span>
                </div>
                <p className="text-white/40 text-[10px] mt-1">{t(`wordMemory.${id}Desc`)}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RoundFeedbackOverlay({ isCorrect, t }) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      style={{ background: 'rgba(18,14,46,0.88)', backdropFilter: 'blur(10px)' }}
    >
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.15)',
            border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.45)' : 'rgba(248,113,113,0.35)'}`,
          }}
        >
          {isCorrect ? (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>
        <h2
          className="font-display font-black text-xl text-transparent bg-clip-text"
          style={{
            backgroundImage: isCorrect
              ? 'linear-gradient(90deg, #34d399, #a855f7, #ec4899)'
              : 'linear-gradient(90deg, #f87171, #ec4899, #a855f7)',
          }}
        >
          {isCorrect ? t('wordMemory.greatJob') : t('wordMemory.notQuite')}
        </h2>
      </div>
    </div>
  );
}

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
    nextId === 'medium'
      ? t('wordMemory.goToMedium')
      : nextId === 'hard'
        ? t('wordMemory.goToHard')
        : nextId === 'expert'
          ? t('wordMemory.goToExpert')
          : null;
  const primaryGradient =
    'w-full py-3 rounded-2xl font-display font-bold text-sm tracking-widest uppercase text-white transition-transform duration-200 active:scale-95';
  const secondaryBtn =
    'w-full py-3 rounded-2xl font-display font-bold text-sm tracking-widest uppercase text-white/90 transition-transform duration-200 active:scale-95 glass border border-white/12';

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center px-4 sm:px-5"
      style={{ background: 'rgba(18,14,46,0.96)', backdropFilter: 'blur(16px)' }}
    >
      <div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, #3b82f6)' }}
      />
      <div className="win-overlay-inner relative flex w-full flex-col items-center gap-3 px-5 text-center sm:px-6">
        <div className="flex gap-2 text-3xl">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              style={{
                opacity: n <= stars ? 1 : 0.18,
                filter: n <= stars ? 'none' : 'grayscale(1)',
              }}
            >
              ⭐
            </span>
          ))}
        </div>
        <h2
          className="font-display font-black text-2xl text-transparent bg-clip-text"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)' }}
        >
          {t('wordMemory.sessionDone')}
        </h2>
        <p className="w-full text-xs leading-snug text-white/45">{t('wordMemory.sessionSuccessHint')}</p>
        <div className="glass rounded-2xl px-4 py-3 w-full flex flex-col gap-1.5">
          <span className="text-white/35 text-[9px] uppercase tracking-widest">{t('wordMemory.levelCompleted')}</span>
          <span
            className="font-display font-bold text-sm uppercase tracking-widest"
            style={{ color: completedDiff?.color ?? '#e9d5ff' }}
          >
            {completedDiff?.emoji} {t(`wordMemory.${completedLevelId}`)}
          </span>
        </div>
        <div className="glass rounded-2xl px-5 py-4 w-full flex flex-col gap-1">
          <span className="text-white/35 text-[9px] uppercase tracking-widest">{t('wordMemory.scoreLabel')}</span>
          <span className="font-display font-black text-4xl text-neon-purple text-glow-purple">
            {score}
            <span className="text-white/30 text-2xl font-bold">/{TOTAL_ROUNDS}</span>
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
            {t('wordMemory.playAgain')}
          </button>
          <button
            type="button"
            onClick={onBackHome}
            className="w-full py-2.5 glass rounded-2xl text-white/70 hover:text-white text-xs font-semibold uppercase tracking-widest"
          >
            {t('wordMemory.backHome')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function WordMemoryScreen({ onNavigate }) {
  const { t, lang } = useLanguage();
  const { isPremium } = usePremium();
  const [showPremiumHardGate, setShowPremiumHardGate] = useState(false);
  const [muted, setMuted] = useState(isMuted());
  const handleMute = () => setMuted(toggleMute());

  const [difficulty, setDifficulty] = useState(null);
  const [phase, setPhase] = useState(PHASE.SELECT);
  const [roundKey, setRoundKey] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);

  const [targetWords, setTargetWords] = useState([]);
  const [mixedOptions, setMixedOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [lastRoundCorrect, setLastRoundCorrect] = useState(true);

  const difficultyRef = useRef(null);
  const sessionXpStampRef = useRef(0);
  const [sessionXpStamp, setSessionXpStamp] = useState(0);
  const currentRoundRef = useRef(1);
  const selectedRef = useRef([]);
  const roundOutcomeCorrectRef = useRef(false);

  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const diff = difficulty ? DIFFICULTIES[difficulty] : null;
  const previewMs = diff?.previewMs ?? 3500;

  /**
   * Draw fresh targets + distractors for the current difficulty.
   * Called when leaving READY (first round) and when leaving ROUND_FEEDBACK (rounds 2–8).
   */
  const generateRoundPack = useCallback(() => {
    const diffId = difficultyRef.current;
    const cfg = DIFFICULTIES[diffId];
    const pool = getWordPoolForLang(lang);
    const pack = pickRoundWords(pool, cfg);
    setTargetWords(pack.targets);
    setMixedOptions(pack.mixed);
    setSelected([]);
    setRoundKey((k) => k + 1);
  }, [lang]);

  const beginSession = useCallback(
    (diffId) => {
      if ((diffId === 'hard' || diffId === 'expert') && !isPremium) {
        setShowPremiumHardGate(true);
        return;
      }
      const stamp = Date.now();
      sessionXpStampRef.current = stamp;
      setSessionXpStamp(stamp);
      difficultyRef.current = diffId;
      currentRoundRef.current = 1;
      setDifficulty(diffId);
      setCurrentRound(1);
      setScore(0);
      setTargetWords([]);
      setMixedOptions([]);
      setSelected([]);
      setPhase(PHASE.READY);
    },
    [isPremium]
  );

  const handleSessionPlayAgain = useCallback(() => {
    const id = difficultyRef.current;
    if (id) beginSession(id);
  }, [beginSession]);

  const handleSessionNextLevel = useCallback(() => {
    const id = difficultyRef.current;
    const next = id ? NEXT_DIFFICULTY_AFTER_SESSION[id] : null;
    if (next) {
      if ((next === 'hard' || next === 'expert') && !isPremium) {
        setShowPremiumHardGate(true);
        return;
      }
      playSound('levelUp');
      beginSession(next);
    }
  }, [beginSession, isPremium]);

  /** READY → generate words and show PREVIEW */
  const handleStartRound = useCallback(() => {
    playSound('start');
    generateRoundPack();
    setPhase(PHASE.PREVIEW);
  }, [generateRoundPack]);

  /** PREVIEW → INPUT after memorization window (automatic — no tap). */
  useEffect(() => {
    if (phase !== PHASE.PREVIEW || !diff) return;
    const id = setTimeout(() => {
      setPhase(PHASE.INPUT);
    }, previewMs);
    return () => clearTimeout(id);
  }, [phase, diff, previewMs, roundKey]);

  const handleToggleWord = useCallback(
    (word) => {
      if (phase !== PHASE.INPUT) return;
      const prev = selectedRef.current;
      if (prev.includes(word)) {
        setSelected((p) => p.filter((w) => w !== word));
        return;
      }
      playSound('tap');
      setSelected((p) => (p.includes(word) ? p : [...p, word]));
    },
    [phase]
  );

  /** Submit selection; compare as sets (order-free). */
  const handleCheck = useCallback(() => {
    if (phase !== PHASE.INPUT) return;
    const ok = selectionMatchesTargets(selected, targetWords);
    roundOutcomeCorrectRef.current = ok;
    setLastRoundCorrect(ok);
    if (ok) {
      playSound('match');
      setScore((s) => s + 1);
    } else {
      playSound('wrong');
    }
    setPhase(PHASE.ROUND_FEEDBACK);
  }, [phase, selected, targetWords]);

  /**
   * Automatic progression after each round:
   * stay on ROUND_FEEDBACK for ROUND_FEEDBACK_MS, then either FINISHED (after round 8)
   * or next round PREVIEW with newly generated words. No extra confirmation on success.
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
      generateRoundPack();
      setCurrentRound((cr) => cr + 1);
      currentRoundRef.current = r + 1;
      setPhase(PHASE.PREVIEW);
    }, ROUND_FEEDBACK_MS);
    return () => clearTimeout(id);
  }, [phase, generateRoundPack]);

  const showGameplayHeader =
    difficulty && phase !== PHASE.SELECT && phase !== PHASE.FINISHED && phase !== PHASE.READY;

  const wmFinished = phase === PHASE.FINISHED;
  const wordMemXpFingerprint =
    wmFinished && sessionXpStamp ? `wordMemory-${sessionXpStamp}` : null;
  useFinishSessionProgress(
    wmFinished,
    wordMemXpFingerprint,
    TOTAL_ROUNDS,
    score,
    Math.max(0, TOTAL_ROUNDS - score),
    true,
    difficulty ?? 'easy'
  );

  const previewProgress =
    phase === PHASE.PREVIEW ? (
      <PreviewTimerBar key={roundKey} durationMs={previewMs} />
    ) : null;

  return (
    <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)' }}>
      <div
        className="absolute top-[-60px] right-[-60px] w-56 h-56 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }}
      />
      <div
        className="absolute bottom-[-40px] left-[-40px] w-52 h-52 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}
      />

      <header className="flex flex-shrink-0 items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-white/60 hover:text-white transition-all text-xs font-semibold"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>
        <h1
          className="font-display font-bold text-sm tracking-widest text-transparent bg-clip-text"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899)' }}
        >
          {t('wordMemory.title')}
        </h1>
        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={handleMute} />
          <LanguageToggle />
        </div>
      </header>

      {showGameplayHeader && diff && (
        <div className="flex items-center justify-center gap-2 pb-1 flex-shrink-0 flex-wrap px-2">
          <span
            className="glass rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: diff.color }}
          >
            {diff.emoji} {t(`wordMemory.${difficulty}`)}
          </span>
          <span className="text-white/35 text-[9px] font-semibold">
            {t('game.round')} {currentRound}/{TOTAL_ROUNDS}
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 px-4 pb-[max(6rem,env(safe-area-inset-bottom,0px))]">
        {phase === PHASE.SELECT && <DifficultyOverlay onSelect={beginSession} onBack={() => onNavigate('home')} t={t} />}

        {phase === PHASE.READY && diff && (
          <div className="flex w-full flex-col items-center gap-5 px-2 py-6 text-center">
            <div className="text-5xl opacity-90">🧠</div>
            <div>
              <h2
                className="font-display font-black text-xl text-transparent bg-clip-text mb-2"
                style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)' }}
              >
                {t('wordMemory.readyTitle')}
              </h2>
              <p className="w-full text-center text-sm leading-relaxed text-white/55">{t('wordMemory.readyBody')}</p>
            </div>
            <button
              type="button"
              onClick={handleStartRound}
              className="w-full py-3.5 rounded-2xl font-display font-bold text-sm tracking-widest uppercase text-white transition-transform duration-200 active:scale-95"
              style={{
                background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)',
                boxShadow: '0 0 20px rgba(168,85,247,0.35)',
              }}
            >
              {t('wordMemory.beginRound')}
            </button>
          </div>
        )}

        {phase === PHASE.PREVIEW && diff && (
          <div className="flex min-h-0 w-full flex-col items-center gap-4 py-4">
            <p className="text-white/40 text-[10px] uppercase tracking-widest text-center">{t('wordMemory.memorizeWords')}</p>
            <p className="w-full text-center text-xs text-white/35">{t('wordMemory.previewSubtitle')}</p>
            <div className="flex w-full flex-col gap-2.5">
              {targetWords.map((w) => (
                <div
                  key={`${roundKey}-${w}`}
                  className="glass rounded-2xl px-5 py-4 text-center border border-white/10"
                >
                  <span className="font-display font-bold text-lg sm:text-xl text-white tracking-tight">{w}</span>
                </div>
              ))}
            </div>
            {previewProgress}
          </div>
        )}

        {phase === PHASE.INPUT && diff && (
          <div className="flex-1 flex flex-col min-h-0 gap-3">
            <div className="text-center flex-shrink-0 pt-1">
              <p className="text-white/50 text-sm font-semibold">{t('wordMemory.inputTitle')}</p>
              <p className="mt-1 w-full text-center text-[11px] leading-snug text-white/35">{t('wordMemory.inputSubtitle')}</p>
              <p className="text-white/30 text-[10px] mt-2">
                {t('wordMemory.selectedCount').replace('{n}', String(selected.length))}
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-wrap content-start justify-center gap-2.5 py-1">
              {mixedOptions.map((w) => {
                const isOn = selected.includes(w);
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleToggleWord(w)}
                    className={`min-h-[52px] px-4 py-3 rounded-2xl font-display font-semibold text-base text-center transition-all duration-200 active:scale-[0.98] max-w-full ${
                      isOn
                        ? 'border-2 border-neon-purple bg-neon-purple/20 text-white shadow-[0_0_16px_rgba(168,85,247,0.35)]'
                        : 'glass border border-white/10 text-white/90 hover:border-white/25'
                    }`}
                    aria-pressed={isOn}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleCheck}
              className="w-full py-3.5 rounded-2xl font-display font-bold text-sm tracking-widest uppercase text-white flex-shrink-0 transition-transform duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)',
                boxShadow: '0 0 18px rgba(168,85,247,0.3)',
              }}
            >
              {t('wordMemory.checkAnswers')}
            </button>
          </div>
        )}

        {phase === PHASE.ROUND_FEEDBACK && <RoundFeedbackOverlay isCorrect={lastRoundCorrect} t={t} />}

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
      </div>

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

/** Slim countdown bar during PREVIEW — same family as other NeuroTrain games. */
function PreviewTimerBar({ durationMs }) {
  const [pct, setPct] = useState(100);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const rem = Math.max(0, durationMs - (Date.now() - start));
      setPct((rem / durationMs) * 100);
      if (rem <= 0) clearInterval(id);
    }, 80);
    return () => clearInterval(id);
  }, [durationMs]);
  return (
    <div className="w-full px-4 pt-3 sm:px-5">
      <div className="h-1 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-100 ease-linear"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)',
            boxShadow: '0 0 6px rgba(168,85,247,0.35)',
          }}
        />
      </div>
    </div>
  );
}
