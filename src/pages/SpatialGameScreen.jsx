import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import { playSound, toggleMute, isMuted } from '../utils/sound';
import { useFinishSessionProgress } from '../hooks/useFinishSessionProgress';
import { usePremium } from '../context/PremiumContext';
import PremiumHardGateModal from '../components/PremiumHardGateModal';

// ─── Session ───────────────────────────────────────────────────────────────────
const TOTAL_ROUNDS = 8;
const ROUND_FEEDBACK_MS = 1300;

/**
 * After a full 8-round session: Easy → Medium → Hard. Session-complete overlay
 * uses this so "Go to Medium" / "Go to Hard" can call `beginSession(nextId)`
 * and skip the difficulty picker.
 */
const NEXT_DIFFICULTY_AFTER_SESSION = { easy: 'medium', medium: 'hard' };

// ─── Phases ───────────────────────────────────────────────────────────────────
// SELECT         → pick difficulty
// PREVIEW        → target cells glow for a few seconds
// INPUT          → neutral grid; player taps exactly `positions` cells
// ROUND_FEEDBACK → brief correct / incorrect (auto-continues)
// FINISHED       → session summary
const PHASE = {
  SELECT:         'select',
  PREVIEW:        'preview',
  INPUT:          'input',
  ROUND_FEEDBACK: 'round_feedback',
  FINISHED:       'finished',
};

/**
 * Difficulty drives: grid side length, how many cells to remember, preview duration.
 * Indices are always 0 … (gridSize² − 1) in row-major order.
 */
const DIFFICULTIES = {
  easy: {
    id: 'easy',
    gridSize: 3,
    positions: 2,
    previewMs: 2800,
    emoji: '🌱',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.65)',
  },
  medium: {
    id: 'medium',
    gridSize: 3,
    positions: 3,
    previewMs: 2200,
    emoji: '⚡',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.65)',
  },
  hard: {
    id: 'hard',
    gridSize: 4,
    positions: 4,
    previewMs: 1800,
    emoji: '🔥',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.65)',
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

/** `count` distinct random cell indices in a `gridSize × gridSize` board. */
function pickTargetIndices(gridSize, count) {
  const total = gridSize * gridSize;
  const pool = shuffle([...Array(total).keys()]);
  return pool.slice(0, count).sort((a, b) => a - b);
}

function arraysEqualSorted(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

// ─── Difficulty overlay ───────────────────────────────────────────────────────
function DifficultyOverlay({ onSelect, onBack, t }) {
  const tagKey = { easy: 'spatial.easyTag', medium: 'spatial.mediumTag', hard: 'spatial.hardTag' };

  return (
    <div className="absolute inset-0 z-30 flex min-h-0 flex-col overflow-hidden"
      style={{ background: 'rgba(18,14,46,0.97)', backdropFilter: 'blur(16px)' }}>
      <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, #3b82f6)' }} />

      <div className="relative z-10 flex-shrink-0 px-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))]">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-white/60 hover:text-white transition-all text-xs font-semibold">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>
      </div>

      <div className="app-scroll relative flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-4xl animate-float">🎯</div>
          <h2 className="font-display font-black text-2xl text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)' }}>
            {t('spatial.title')}
          </h2>
          <p className="w-full text-center text-[11px] leading-relaxed text-white/40">
            {t('spatial.howToPlay')}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {DIFF_ORDER.map((id) => {
            const d = DIFFICULTIES[id];
            return (
              <button key={id} type="button" onClick={() => onSelect(id)}
                className="numbers-difficulty-enter relative glass rounded-2xl px-4 py-3.5 flex items-center gap-4 text-left overflow-hidden
                  transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] group"
                style={{ borderColor: `${d.color}35` }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ background: d.color, boxShadow: `0 0 12px ${d.glow}` }} />
                <span className="text-2xl ml-1 flex-shrink-0">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display font-bold text-sm uppercase tracking-wider"
                      style={{ color: d.color, textShadow: `0 0 10px ${d.glow}` }}>
                      {t(`spatial.${id}`)}
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                      style={{ background: `${d.color}22`, color: d.color, border: `1px solid ${d.color}40` }}>
                      {t(tagKey[id])}
                    </span>
                  </div>
                  <p className="text-white/40 text-[11px] leading-snug">{t(`spatial.${id}Desc`)}</p>
                </div>
                <svg className="w-4 h-4 text-white/20 group-hover:text-white/60 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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

// ─── Grid (preview + input share layout; style differs by phase) ─────────────
function SpatialGrid({
  gridSize,
  targetSet,
  selectedSet,
  phase,
  previewMs,
  roundKey,
  onCellTap,
  t,
}) {
  const total = gridSize * gridSize;
  const isPreview = phase === 'preview';
  const isInput = phase === 'input';

  const gap = gridSize === 4 ? 'gap-1.5' : 'gap-2.5';

  return (
    <div className="flex w-full flex-col items-center justify-center gap-6 px-4 sm:px-5">
      <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-semibold text-center">
        {isPreview ? t('spatial.rememberPositions') : t('spatial.tapPositions')}
      </p>

      <div
        className={`grid w-full ${gap}`}
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: total }, (_, i) => {
          const isTarget = targetSet.has(i);
          const isSelected = selectedSet.has(i);

          let cellClass = 'rounded-2xl aspect-square flex items-center justify-center transition-all duration-200 ';
          let cellStyle = {
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)',
          };

          if (isPreview && isTarget) {
            cellStyle = {
              border: '2px solid rgba(168,85,247,0.85)',
              background: 'linear-gradient(145deg, rgba(168,85,247,0.35), rgba(236,72,153,0.2))',
              boxShadow: '0 0 22px rgba(168,85,247,0.55), inset 0 0 20px rgba(168,85,247,0.15)',
            };
            cellClass += ' scale-[1.02]';
          } else if (isInput) {
            if (isSelected) {
              cellStyle = {
                border: '2px solid rgba(168,85,247,0.7)',
                background: 'rgba(168,85,247,0.18)',
                boxShadow: '0 0 14px rgba(168,85,247,0.35)',
              };
            }
          }

          return (
            <button
              key={i}
              type="button"
              disabled={!isInput}
              onClick={() => isInput && onCellTap(i)}
              className={cellClass + (isInput ? ' active:scale-95 hover:scale-[1.03] cursor-pointer' : ' cursor-default')}
              style={cellStyle}
            />
          );
        })}
      </div>

      {isPreview && (
        <div className="w-full flex flex-col gap-1.5">
          <p className="text-white/25 text-[10px] text-center uppercase tracking-widest">{t('spatial.memorizing')}</p>
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
      )}

      {isInput && (
        <p className="text-white/35 text-[11px] font-display">
          {selectedSet.size} / {targetSet.size}
        </p>
      )}
    </div>
  );
}

// ─── Round feedback ───────────────────────────────────────────────────────────
function RoundFeedbackOverlay({ isCorrect, t }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
      style={{ background: 'rgba(18,14,46,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="success-flash-inner relative flex flex-col items-center gap-3 px-6 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: isCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `2px solid ${isCorrect ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.4)'}`,
          }}>
          {isCorrect ? (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>
        <h2 className="font-display font-black text-xl text-transparent bg-clip-text"
          style={{
            backgroundImage: isCorrect
              ? 'linear-gradient(90deg, #34d399, #a855f7, #ec4899)'
              : 'linear-gradient(90deg, #f87171, #ec4899, #a855f7)',
          }}
        >
          {isCorrect ? t('spatial.greatJob') : t('spatial.notQuite')}
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
    nextId === 'medium' ? t('spatial.goToMedium') : nextId === 'hard' ? t('spatial.goToHard') : null;

  const primaryGradient =
    'w-full py-3 rounded-2xl font-display font-bold text-sm tracking-widest uppercase text-white active:scale-95 transition-transform duration-200';
  const secondaryBtn =
    'w-full py-3 rounded-2xl font-display font-bold text-sm tracking-widest uppercase text-white/90 active:scale-95 transition-transform duration-200 glass border border-white/12';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-4 sm:px-5"
      style={{ background: 'rgba(18,14,46,0.96)', backdropFilter: 'blur(16px)' }}>
      <div className="absolute w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, #3b82f6)' }} />
      <div className="win-overlay-inner relative flex w-full flex-col items-center gap-3 px-5 text-center sm:px-6">
        <div className="flex gap-2 text-3xl">
          {[1, 2, 3].map((n) => (
            <span key={n} style={{ opacity: n <= stars ? 1 : 0.18, filter: n <= stars ? 'none' : 'grayscale(1)' }}>⭐</span>
          ))}
        </div>
        <h2 className="font-display font-black text-2xl text-transparent bg-clip-text"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)' }}>
          {t('spatial.sessionDone')}
        </h2>
        <p className="w-full text-xs leading-snug text-white/45">
          {t('spatial.sessionSuccessHint')}
        </p>
        <div className="glass rounded-2xl px-4 py-3 w-full flex flex-col gap-1.5">
          <span className="text-white/35 text-[9px] uppercase tracking-widest">{t('spatial.levelCompleted')}</span>
          <span
            className="font-display font-bold text-sm uppercase tracking-widest"
            style={{ color: completedDiff?.color ?? '#e9d5ff' }}
          >
            {completedDiff?.emoji} {t(`spatial.${completedLevelId}`)}
          </span>
        </div>
        <div className="glass rounded-2xl px-5 py-4 w-full flex flex-col gap-1">
          <span className="text-white/35 text-[9px] uppercase tracking-widest">{t('spatial.scoreLabel')}</span>
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
            {t('spatial.playAgain')}
          </button>
          <button
            type="button"
            onClick={onBackHome}
            className="w-full py-2.5 glass rounded-2xl text-white/70 hover:text-white text-xs font-semibold uppercase tracking-widest"
          >
            {t('spatial.backHome')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SpatialGameScreen({ onNavigate }) {
  const { t } = useLanguage();
  const { isPremium } = usePremium();
  const [showPremiumHardGate, setShowPremiumHardGate] = useState(false);
  const [muted, setMuted] = useState(isMuted());
  const handleMute = () => setMuted(toggleMute());

  const [difficulty, setDifficulty] = useState(null);
  const [phase, setPhase] = useState(PHASE.SELECT);
  const [roundKey, setRoundKey] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);

  /** Sorted indices the player must reproduce (set semantics). */
  const [targetIndices, setTargetIndices] = useState([]);
  /** Player’s current selection during INPUT (toggle cells until count matches). */
  const [selected, setSelected] = useState([]);

  const difficultyRef = useRef(null);
  const sessionXpStampRef = useRef(0);
  const [sessionXpStamp, setSessionXpStamp] = useState(0);
  const currentRoundRef = useRef(1);
  const inputEvaluatedRef = useRef(false);
  const roundOutcomeCorrectRef = useRef(false);
  /** Mirrors `selected` so we can play `tap` outside of setState (avoids duplicate sounds in Strict Mode). */
  const selectedRef = useRef([]);

  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (phase === PHASE.PREVIEW) inputEvaluatedRef.current = false;
  }, [phase, roundKey]);

  const diff = difficulty ? DIFFICULTIES[difficulty] : null;
  const previewMs = diff?.previewMs ?? 2500;
  const gridSize = diff?.gridSize ?? 3;
  const posCount = diff?.positions ?? 2;

  const targetSet = new Set(targetIndices);
  const selectedSet = new Set(selected);

  // PREVIEW → INPUT
  useEffect(() => {
    if (phase !== PHASE.PREVIEW || !diff) return;
    const id = setTimeout(() => {
      setPhase(PHASE.INPUT);
      setSelected([]);
    }, previewMs);
    return () => clearTimeout(id);
  }, [phase, diff, previewMs]);

  // INPUT: when player has chosen exactly `posCount` cells, compare sets
  useEffect(() => {
    if (phase !== PHASE.INPUT) return;
    if (selected.length !== posCount) return;
    if (inputEvaluatedRef.current) return;
    inputEvaluatedRef.current = true;

    const ok = arraysEqualSorted(selected, targetIndices);
    roundOutcomeCorrectRef.current = ok;
    if (ok) {
      playSound('match');
      setScore((s) => s + 1);
    } else {
      playSound('wrong');
    }
    setPhase(PHASE.ROUND_FEEDBACK);
  }, [selected, phase, posCount, targetIndices]);

  // ROUND_FEEDBACK → next round or finished
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
      const d = DIFFICULTIES[difficultyRef.current];
      setTargetIndices(pickTargetIndices(d.gridSize, d.positions));
      setSelected([]);
      setRoundKey((k) => k + 1);
      setCurrentRound((cr) => cr + 1);
      setPhase(PHASE.PREVIEW);
    }, ROUND_FEEDBACK_MS);
    return () => clearTimeout(id);
  }, [phase]);

  const beginSession = useCallback((diffId, options = {}) => {
    if (diffId === 'hard' && !isPremium) {
      setShowPremiumHardGate(true);
      return;
    }
    const { skipStartSound = false } = options;
    if (!skipStartSound) {
      playSound('start');
    }
    const d = DIFFICULTIES[diffId];
    const stamp = Date.now();
    sessionXpStampRef.current = stamp;
    setSessionXpStamp(stamp);
    difficultyRef.current = diffId;
    currentRoundRef.current = 1;
    setDifficulty(diffId);
    setCurrentRound(1);
    setScore(0);
    setTargetIndices(pickTargetIndices(d.gridSize, d.positions));
    setSelected([]);
    setRoundKey((k) => k + 1);
    setPhase(PHASE.PREVIEW);
  }, [isPremium]);

  const handleSessionPlayAgain = useCallback(() => {
    const id = difficultyRef.current;
    if (id) beginSession(id);
  }, [beginSession]);

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

  const handleCellTap = useCallback(
    (idx) => {
      if (phase !== PHASE.INPUT) return;
      const prev = selectedRef.current;
      if (prev.includes(idx)) {
        setSelected((p) => p.filter((i) => i !== idx));
        return;
      }
      if (prev.length >= posCount) return;
      playSound('tap');
      setSelected((p) => {
        if (p.includes(idx) || p.length >= posCount) return p;
        return [...p, idx];
      });
    },
    [phase, posCount]
  );

  const roundOk =
    phase === PHASE.ROUND_FEEDBACK &&
    arraysEqualSorted(selected, targetIndices);

  const showHeader = difficulty && phase !== PHASE.SELECT && phase !== PHASE.FINISHED;

  const sessionFinished = phase === PHASE.FINISHED;
  const spatialXpFingerprint =
    sessionFinished && sessionXpStamp ? `spatial-${sessionXpStamp}` : null;
  useFinishSessionProgress(
    sessionFinished,
    spatialXpFingerprint,
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
        <button type="button" onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-white/60 hover:text-white text-xs font-semibold">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>
        <h1 className="font-display font-bold text-sm tracking-widest text-transparent bg-clip-text"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899)' }}>
          {t('spatial.title')}
        </h1>
        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={handleMute} />
          <LanguageToggle />
        </div>
      </header>

      {showHeader && (
        <div className="flex items-center justify-center gap-2 pb-1 flex-wrap px-2 flex-shrink-0">
          <span className="glass rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: diff.color }}>
            {diff.emoji} {t(`spatial.${difficulty}`)} · {gridSize}×{gridSize}
          </span>
          <span className="text-white/35 text-[9px] font-semibold">
            {t('game.round')} {currentRound}/{TOTAL_ROUNDS}
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 justify-center pb-[max(5rem,env(safe-area-inset-bottom,0px))]">
        {(phase === PHASE.PREVIEW || phase === PHASE.INPUT) && diff && (
          <SpatialGrid
            gridSize={gridSize}
            targetSet={targetSet}
            selectedSet={selectedSet}
            phase={phase === PHASE.PREVIEW ? 'preview' : 'input'}
            previewMs={previewMs}
            roundKey={roundKey}
            onCellTap={handleCellTap}
            t={t}
          />
        )}
      </div>

      {phase === PHASE.SELECT && (
        <DifficultyOverlay onSelect={beginSession} onBack={() => onNavigate('home')} t={t} />
      )}

      {phase === PHASE.ROUND_FEEDBACK && <RoundFeedbackOverlay isCorrect={roundOk} t={t} />}

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
