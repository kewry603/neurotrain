import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import { playSound, toggleMute, isMuted } from '../utils/sound';
import { useFinishSessionProgress } from '../hooks/useFinishSessionProgress';
import { usePremium } from '../context/PremiumContext';
import PremiumHardGateModal from '../components/PremiumHardGateModal';

// ─── Phases ───────────────────────────────────────────────────────────────────
// SELECT   → difficulty selection
// PREVIEW  → shapes displayed for memorization
// HIDE     → shapes disappear; brief blank forces the memory to engage
// QUESTION → question appears; player selects an answer
// RESULT   → correct/incorrect feedback; player manually continues
// FINISHED → session results
const PHASE = {
  SELECT:   'select',
  PREVIEW:  'preview',
  HIDE:     'hide',
  QUESTION: 'question',
  RESULT:   'result',
  FINISHED: 'finished',
};

const TOTAL_ROUNDS = 5;   // rounds per session
const HIDE_MS      = 500; // ms of blank screen between preview and question

// ─── Difficulty ───────────────────────────────────────────────────────────────
// count     : [min, max] number of shapes shown each round
// previewMs : how long the shapes are visible (timer bar + transition to HIDE phase)
// Same value every round — driven only by difficulty; easy baseline, medium +1s, hard +2s vs prior medium/hard tuning.
const DIFFICULTIES = {
  easy: {
    id: 'easy', count: [3, 4], previewMs: 2000,
    emoji: '🌱', color: '#10b981', glow: 'rgba(16,185,129,0.65)',
  },
  medium: {
    id: 'medium', count: [5, 7], previewMs: 3000,
    emoji: '⚡', color: '#f59e0b', glow: 'rgba(245,158,11,0.65)',
  },
  hard: {
    id: 'hard', count: [8, 10], previewMs: 3600,
    emoji: '🔥', color: '#ef4444', glow: 'rgba(239,68,68,0.65)',
  },
};

const DIFF_ORDER  = ['easy', 'medium', 'hard'];
const SHAPE_TYPES = ['circle', 'square', 'triangle'];
const COLOR_KEYS  = ['red', 'blue', 'green', 'yellow', 'purple'];

// ─── Visual data for shapes and colors ───────────────────────────────────────
const COLORS = {
  red:    { fill: '#ef4444', glow: 'rgba(239,68,68,0.55)'  },
  blue:   { fill: '#3b82f6', glow: 'rgba(59,130,246,0.55)' },
  green:  { fill: '#10b981', glow: 'rgba(16,185,129,0.55)' },
  yellow: { fill: '#f59e0b', glow: 'rgba(245,158,11,0.55)' },
  purple: { fill: '#a855f7', glow: 'rgba(168,85,247,0.55)' },
};

// Shape labels (plural) used when building question text
const SHAPE_LABEL = {
  circle:   { en: 'circles',   es: 'círculos',   enS: 'a circle',   esS: 'algún círculo'   },
  square:   { en: 'squares',   es: 'cuadrados',  enS: 'a square',   esS: 'algún cuadrado'  },
  triangle: { en: 'triangles', es: 'triángulos', enS: 'a triangle', esS: 'algún triángulo' },
};

// Color labels — masculine plural (pairs with shape nouns) and feminine (pairs with "figuras")
const COLOR_MASC = {
  red:    { en: 'red',    es: 'rojos'    },
  blue:   { en: 'blue',   es: 'azules'   },
  green:  { en: 'green',  es: 'verdes'   },
  yellow: { en: 'yellow', es: 'amarillos'},
  purple: { en: 'purple', es: 'morados'  },
};
const COLOR_FEM = {
  red: 'rojas', blue: 'azules', green: 'verdes', yellow: 'amarillas', purple: 'moradas',
};

// ─── Question text builder ────────────────────────────────────────────────────
// Generates a human-readable question string in the active language.
function formatQuestion(q, lang) {
  const es = lang === 'es';
  switch (q.type) {
    case 'total_count':
      return es
        ? '¿Cuántas figuras viste en total?'
        : 'How many shapes did you see in total?';
    case 'count_shape': {
      const s = SHAPE_LABEL[q.shape];
      return es ? `¿Cuántos ${s.es} viste?` : `How many ${s.en} did you see?`;
    }
    case 'count_color': {
      const cEn = COLOR_MASC[q.color].en;
      const cEs = COLOR_FEM[q.color];
      return es
        ? `¿Cuántas figuras ${cEs} viste?`
        : `How many ${cEn} shapes did you see?`;
    }
    case 'count_color_shape': {
      const s  = SHAPE_LABEL[q.shape];
      const cM = COLOR_MASC[q.color];
      return es
        ? `¿Cuántos ${s.es} ${cM.es} viste?`
        : `How many ${cM.en} ${s.en} did you see?`;
    }
    case 'has_shape': {
      const s = SHAPE_LABEL[q.shape];
      return es ? `¿Viste ${s.esS}?` : `Did you see ${s.enS}?`;
    }
    case 'has_color': {
      const cEn = COLOR_MASC[q.color].en;
      const cEs = COLOR_FEM[q.color];
      return es ? `¿Viste figuras ${cEs}?` : `Did you see any ${cEn} shapes?`;
    }
    default:
      return '';
  }
}

// Converts a raw option value into a display label (handles yes/no + numbers)
function formatOption(opt, lang) {
  if (typeof opt === 'number') return String(opt);
  if (opt === 'yes') return lang === 'es' ? 'Sí' : 'Yes';
  return 'No';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randBetween(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

/**
 * Build 4 plausible numeric answer options centred around the correct value.
 * All options stay in [0, maxCount + 2] to feel realistic.
 */
function makeCountOptions(correct, maxCount) {
  const opts = new Set([correct]);
  const pool = [];
  for (let d = 1; d <= 6; d++) {
    if (correct - d >= 0)              pool.push(correct - d);
    if (correct + d <= maxCount + 2)   pool.push(correct + d);
  }
  for (const c of shuffle(pool)) {
    if (opts.size >= 4) break;
    opts.add(c);
  }
  return shuffle([...opts]).slice(0, 4);
}

/** Generate a random scene: array of {id, shape, color} objects. */
function generateScene(count) {
  return Array.from({ length: count }, (_, id) => ({
    id,
    shape: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
    color: COLOR_KEYS [Math.floor(Math.random() * COLOR_KEYS.length)],
  }));
}

/**
 * Generate a question object from the current scene.
 * Randomly picks one of six question templates and computes the correct answer
 * and three plausible distractors.
 */
function generateQuestion(scene) {
  const total = scene.length;

  // Build frequency maps
  const shapeCounts      = {};
  const colorCounts      = {};
  const colorShapeCounts = {};
  scene.forEach(({ shape, color }) => {
    shapeCounts[shape] = (shapeCounts[shape] || 0) + 1;
    colorCounts[color] = (colorCounts[color] || 0) + 1;
    const k = `${color}_${shape}`;
    colorShapeCounts[k] = (colorShapeCounts[k] || 0) + 1;
  });

  const types = [
    'count_color_shape', 'count_shape', 'count_color',
    'total_count', 'has_shape', 'has_color',
  ];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === 'total_count') {
    return { type, correct: total, options: makeCountOptions(total, total) };
  }
  if (type === 'count_shape') {
    const shape   = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
    const correct = shapeCounts[shape] || 0;
    return { type, shape, correct, options: makeCountOptions(correct, total) };
  }
  if (type === 'count_color') {
    const color   = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
    const correct = colorCounts[color] || 0;
    return { type, color, correct, options: makeCountOptions(correct, total) };
  }
  if (type === 'count_color_shape') {
    const color   = COLOR_KEYS [Math.floor(Math.random() * COLOR_KEYS.length)];
    const shape   = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
    const correct = colorShapeCounts[`${color}_${shape}`] || 0;
    return { type, color, shape, correct, options: makeCountOptions(correct, total) };
  }
  if (type === 'has_shape') {
    const shape   = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
    const correct = (shapeCounts[shape] || 0) > 0 ? 'yes' : 'no';
    return { type, shape, correct, options: shuffle(['yes', 'no']) };
  }
  // has_color
  const color   = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
  const correct = (colorCounts[color] || 0) > 0 ? 'yes' : 'no';
  return { type: 'has_color', color, correct, options: shuffle(['yes', 'no']) };
}

// ─── ShapeIcon ────────────────────────────────────────────────────────────────
// Renders a single colored shape as an SVG with a soft glow.
function ShapeIcon({ shape, color, size }) {
  const { fill, glow } = COLORS[color];
  const glowPx = Math.round(size / 5);
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100"
      style={{ filter: `drop-shadow(0 0 ${glowPx}px ${glow})` }}
    >
      {shape === 'circle'   && <circle cx="50" cy="50" r="44" fill={fill} />}
      {shape === 'square'   && <rect x="8" y="8" width="84" height="84" rx="10" fill={fill} />}
      {shape === 'triangle' && <polygon points="50,8 94,92 6,92" fill={fill} />}
    </svg>
  );
}

// ─── DifficultyOverlay ────────────────────────────────────────────────────────
function DifficultyOverlay({ onSelect, onBack, t }) {
  const tagKey = { easy: 'focus.easyTag', medium: 'focus.mediumTag', hard: 'focus.hardTag' };
  return (
    <div className="absolute inset-0 z-30 flex flex-col"
      style={{ background: 'rgba(18,14,46,0.97)', backdropFilter: 'blur(16px)' }}>

      <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full
        blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, #3b82f6)' }} />

      <div className="relative z-10 px-5 pt-5">
        <button onClick={onBack}
          className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5
            text-white/60 hover:text-white transition-all text-xs font-semibold">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5 relative">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-4xl animate-float">⚡</div>
          <h2 className="font-display font-black text-2xl text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)' }}>
            {t('focus.title')}
          </h2>
          <p className="w-full text-center text-[11px] leading-relaxed text-white/40">
            {t('focus.howToPlay')}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {DIFF_ORDER.map((id) => {
            const d = DIFFICULTIES[id];
            return (
              <button key={id} onClick={() => onSelect(id)}
                className="diff-card-enter relative glass rounded-2xl px-4 py-3.5
                  flex items-center gap-4 text-left overflow-hidden
                  transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] group"
                style={{ borderColor: `${d.color}35` }}>
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ background: d.color, boxShadow: `0 0 12px ${d.glow}` }} />
                <span className="text-2xl ml-1 flex-shrink-0">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display font-bold text-sm uppercase tracking-wider"
                      style={{ color: d.color, textShadow: `0 0 10px ${d.glow}` }}>
                      {t(`focus.${id}`)}
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                      style={{ background: `${d.color}22`, color: d.color, border: `1px solid ${d.color}40` }}>
                      {t(tagKey[id])}
                    </span>
                  </div>
                  <p className="text-white/40 text-[11px] leading-snug">{t(`focus.${id}Desc`)}</p>
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

// ─── PreviewDisplay ───────────────────────────────────────────────────────────
// Shows the shape scene. Each shape fades in with a staggered delay so the
// player's attention naturally sweeps across the grid.
function PreviewDisplay({ scene, previewMs, round, t }) {
  const sizePx = scene.length <= 4 ? 72 : scene.length <= 7 ? 62 : 52;
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-7 pb-[max(5rem,env(safe-area-inset-bottom,0px))]">
      <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] font-semibold">
        {t('focus.lookCarefully')}
      </p>

      {/* Shape grid — flex-wrap naturally handles any count */}
      <div className="flex flex-wrap justify-center gap-4">
        {scene.map((item, i) => (
          <div key={item.id} style={{
            animation:      'feedbackIn 0.32s ease both',
            animationDelay: `${i * 55}ms`,
          }}>
            <ShapeIcon shape={item.shape} color={item.color} size={sizePx} />
          </div>
        ))}
      </div>

      {/* Depleting timer bar — key={round} restarts the CSS animation each round */}
      <div className="w-full flex flex-col gap-1.5">
        <p className="text-white/25 text-[10px] text-center uppercase tracking-widest">
          {t('focus.memorizing')}
        </p>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/6">
          <div
            key={round}
            className="memorize-timer-bar h-full rounded-full"
            style={{
              animationDuration: `${previewMs}ms`,
              background: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)',
              boxShadow:  '0 0 8px rgba(168,85,247,0.5)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── HideDisplay ──────────────────────────────────────────────────────────────
// A deliberate half-second blank after the shapes disappear.
// This moment forces the player to hold the scene in working memory
// before the question arrives — that pause IS the cognitive training.
function HideDisplay({ t }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-full flex items-center justify-center glass animate-pulse">
        <span className="font-display font-black text-xl text-neon-purple select-none">?</span>
      </div>
      <p className="text-white/20 text-[9px] uppercase tracking-widest">
        {t('game.getReady')}
      </p>
    </div>
  );
}

// ─── QuestionView ─────────────────────────────────────────────────────────────
// Handles both the interactive QUESTION phase and the RESULT feedback phase.
// In QUESTION: answer buttons are neutral and tappable.
// In RESULT: correct answer glows green, wrong choice is red; Continue appears.
function QuestionView({ question, lang, phase, selected, round, onAnswer, onContinue, t }) {
  const isResult  = phase === PHASE.RESULT;
  const isCorrect = isResult && selected === question.correct;
  const isLast    = round >= TOTAL_ROUNDS;

  return (
    <div className="flex-1 flex flex-col items-center px-5 py-2 gap-4 min-h-0 pb-[max(6rem,env(safe-area-inset-bottom,0px))]">

      {/* Result badge — appears only in RESULT phase */}
      {isResult ? (
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border:     `1px solid ${isCorrect ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.35)'}`,
          }}
        >
          {isCorrect ? (
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          <span className={`text-xs font-semibold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
            {isCorrect ? t('focus.correct') : t('focus.notQuite')}
          </span>
        </div>
      ) : (
        <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold">
          {t('focus.question')}
        </p>
      )}

      {/* Question text */}
      <div className="glass rounded-2xl px-5 py-4 text-center w-full">
        <p className="font-display font-black text-lg leading-snug text-transparent bg-clip-text"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)' }}>
          {formatQuestion(question, lang)}
        </p>
      </div>

      {/* Answer buttons — 2-column grid works for both count (4 options) and yes/no (2 options) */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {question.options.map((opt) => {
          const isRight  = opt === question.correct;
          const isChosen = isResult && opt === selected;
          const showGreen = isResult && isRight;
          const showRed   = isResult && isChosen && !isRight;

          return (
            <button
              key={String(opt)}
              onClick={() => !isResult && onAnswer(opt)}
              className={`py-4 rounded-2xl font-display font-black text-2xl
                transition-all duration-200
                ${!isResult ? 'active:scale-95 hover:scale-[1.02]' : ''}`}
              style={{
                background: showGreen
                  ? 'rgba(16,185,129,0.15)'
                  : showRed
                  ? 'rgba(239,68,68,0.12)'
                  : 'rgba(255,255,255,0.05)',
                border: showGreen
                  ? '1.5px solid rgba(16,185,129,0.5)'
                  : showRed
                  ? '1.5px solid rgba(239,68,68,0.4)'
                  : '1.5px solid rgba(255,255,255,0.1)',
                color: showGreen
                  ? '#34d399'
                  : showRed
                  ? '#f87171'
                  : 'rgba(255,255,255,0.82)',
                boxShadow: showGreen ? '0 0 16px rgba(16,185,129,0.22)' : 'none',
                cursor: isResult ? 'default' : 'pointer',
              }}
            >
              {formatOption(opt, lang)}
            </button>
          );
        })}
      </div>

      {/* Continue / See Results — only visible in RESULT phase */}
      {isResult && (
        <div className="w-full mt-auto">
          <button
            onClick={onContinue}
            className="w-full py-3 rounded-2xl font-display font-bold text-sm tracking-widest
              uppercase text-white transition-transform duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)',
              boxShadow:  '0 0 20px rgba(168,85,247,0.35)',
            }}
          >
            {isLast ? t('focus.seeResults') : t('focus.nextRound')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ResultsScreen ────────────────────────────────────────────────────────────
function ResultsScreen({ correctRounds, onRestart, onChangeLevel, t }) {
  const accuracy = Math.round((correctRounds / TOTAL_ROUNDS) * 100);
  // 3 stars = 4-5 correct, 2 stars = 3 correct, 1 star = 0-2 correct
  const stars = correctRounds >= TOTAL_ROUNDS - 1 ? 3
    : correctRounds >= Math.ceil(TOTAL_ROUNDS / 2) ? 2
    : 1;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-5"
      style={{ background: 'rgba(18,14,46,0.96)', backdropFilter: 'blur(16px)' }}>
      <div className="absolute w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, #3b82f6)' }} />

      <div className="win-overlay-inner relative flex w-full flex-col items-center gap-4 px-5 text-center sm:px-6">

        <div className="flex gap-2 text-3xl">
          {[1, 2, 3].map(n => (
            <span key={n} style={{
              opacity: n <= stars ? 1 : 0.18,
              filter:  n <= stars ? 'none' : 'grayscale(1)',
            }}>⭐</span>
          ))}
        </div>

        <h2 className="font-display font-black text-2xl text-transparent bg-clip-text leading-tight"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)' }}>
          {t('focus.sessionDone')}
        </h2>

        <div className="glass rounded-2xl px-4 py-3 w-full grid grid-cols-3 gap-2">
          {[
            { val: correctRounds,                label: t('focus.correct'),  cls: 'text-emerald-400' },
            { val: TOTAL_ROUNDS - correctRounds, label: t('focus.wrong'),    cls: 'text-red-400'     },
            { val: `${accuracy}%`,               label: t('focus.accuracy'), cls: 'text-neon-purple' },
          ].map(({ val, label, cls }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className={`font-display font-bold text-xl leading-tight ${cls}`}>{val}</span>
              <span className="text-white/30 text-[9px] uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 w-full mt-1">
          <button onClick={onRestart}
            className="w-full py-3 rounded-2xl font-display font-bold text-sm tracking-widest
              uppercase text-white transition-transform duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)',
              boxShadow:  '0 0 20px rgba(168,85,247,0.35)',
            }}>
            {t('focus.playAgain')}
          </button>
          <button onClick={onChangeLevel}
            className="w-full py-2.5 glass rounded-2xl text-white/55 hover:text-white
              text-xs font-semibold uppercase tracking-widest transition-all duration-200">
            {t('focus.changeLevel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function FocusGameScreen({ onNavigate }) {
  const { t, lang } = useLanguage();
  /** Premium: Hard is gated — see `startSession` before any phase change. */
  const { isPremium } = usePremium();
  const [showPremiumHardGate, setShowPremiumHardGate] = useState(false);
  const [muted, setMuted] = useState(isMuted());
  const handleMute = () => setMuted(toggleMute());

  // ── Game state ─────────────────────────────────────────────────────────────
  const [difficulty,    setDifficulty]    = useState(null);
  const [phase,         setPhase]         = useState(PHASE.SELECT);
  const [scene,         setScene]         = useState([]);    // shapes shown this round
  const [question,      setQuestion]      = useState(null);  // question object
  const [selected,      setSelected]      = useState(null);  // player's chosen option
  const [round,         setRound]         = useState(1);
  const [correctRounds, setCorrectRounds] = useState(0);

  // Refs give effects/callbacks stable access to current values
  const difficultyRef = useRef(null);
  const sessionXpStampRef = useRef(0);
  /** Mirrors ref for XP fingerprint — must not read ref during render (eslint react-hooks/refs). */
  const [sessionXpStamp, setSessionXpStamp] = useState(0);
  const roundRef      = useRef(1);
  const lastAnswerCorrectRef = useRef(false);

  const diff = difficulty ? DIFFICULTIES[difficulty] : null;

  // ── PREVIEW → HIDE after the shapes have been shown ───────────────────────
  useEffect(() => {
    if (phase !== PHASE.PREVIEW || !diff) return;
    const timer = setTimeout(() => setPhase(PHASE.HIDE), diff.previewMs);
    return () => clearTimeout(timer);
  }, [phase, diff]);

  // ── HIDE → QUESTION after the blank-screen pause ──────────────────────────
  useEffect(() => {
    if (phase !== PHASE.HIDE) return;
    const timer = setTimeout(() => setPhase(PHASE.QUESTION), HIDE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // ── Start (or restart) a full session ─────────────────────────────────────
  const startSession = useCallback((diffId) => {
    if (diffId === 'hard' && !isPremium) {
      setShowPremiumHardGate(true);
      return;
    }
    playSound('start');
    const d        = DIFFICULTIES[diffId];
    const count    = randBetween(d.count[0], d.count[1]);
    const newScene = generateScene(count);

    const stamp = Date.now();
    sessionXpStampRef.current = stamp;
    setSessionXpStamp(stamp);
    difficultyRef.current = diffId;
    roundRef.current      = 1;

    setDifficulty(diffId);
    setPhase(PHASE.PREVIEW);
    setScene(newScene);
    setQuestion(generateQuestion(newScene));
    setSelected(null);
    setRound(1);
    setCorrectRounds(0);
  }, [isPremium]);

  const handleRestart = useCallback(() => {
    if (difficultyRef.current) startSession(difficultyRef.current);
  }, [startSession]);

  const handleChangeLevel = useCallback(() => {
    difficultyRef.current = null;
    roundRef.current      = 1;
    setSessionXpStamp(0);
    setPhase(PHASE.SELECT);
    setDifficulty(null);
    setScene([]);
    setQuestion(null);
    setSelected(null);
    setRound(1);
    setCorrectRounds(0);
  }, []);

  const focusFinished = phase === PHASE.FINISHED;
  const focusXpFingerprint =
    focusFinished && sessionXpStamp ? `focus-${sessionXpStamp}` : null;
  useFinishSessionProgress(
    focusFinished,
    focusXpFingerprint,
    TOTAL_ROUNDS,
    correctRounds,
    Math.max(0, TOTAL_ROUNDS - correctRounds),
    true,
    difficulty ?? 'easy'
  );

  // ── Player selects an answer ───────────────────────────────────────────────
  const handleAnswer = useCallback((opt) => {
    if (phase !== PHASE.QUESTION || selected !== null) return;

    const correct = opt === question.correct;
    lastAnswerCorrectRef.current = correct;
    setSelected(opt);
    if (correct) {
      playSound('match');
      setCorrectRounds(c => c + 1);
    } else {
      playSound('wrong');
    }
    setPhase(PHASE.RESULT);
  }, [phase, selected, question]);

  // ── Continue to next round or go to final results ─────────────────────────
  const handleContinue = useCallback(() => {
    const isLastRound = roundRef.current >= TOTAL_ROUNDS;
    if (isLastRound) {
      playSound('sessionComplete');
    } else if (lastAnswerCorrectRef.current) {
      playSound('roundComplete');
    }
    if (isLastRound) {
      setPhase(PHASE.FINISHED);
    } else {
      const next   = roundRef.current + 1;
      roundRef.current = next;
      setRound(next);

      const d        = DIFFICULTIES[difficultyRef.current];
      const count    = randBetween(d.count[0], d.count[1]);
      const newScene = generateScene(count);

      setScene(newScene);
      setQuestion(generateQuestion(newScene));
      setSelected(null);
      setPhase(PHASE.PREVIEW);
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)' }}>

      {/* Ambient blobs */}
      <div className="absolute top-[-60px] right-[-60px] w-56 h-56 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      <div className="absolute bottom-[-40px] left-[-40px] w-52 h-52 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />

      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2 flex-shrink-0">
        <button onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5
            text-white/60 hover:text-white transition-all text-xs font-semibold">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>

        <h1 className="font-display font-bold text-sm tracking-widest text-transparent bg-clip-text"
          style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #ec4899)' }}>
          {t('focus.title')}
        </h1>

        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={handleMute} />
          <LanguageToggle />
        </div>
      </header>

      {/* Difficulty + round badge */}
      {difficulty ? (
        <div className="flex items-center justify-center gap-2 pb-1 flex-shrink-0">
          <span className="glass rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: diff.color }}>
            {diff.emoji} {t(`focus.${difficulty}`)}
          </span>
          <span className="text-white/35 text-[9px] font-semibold">
            {t('game.round')} {round}/{TOTAL_ROUNDS}
          </span>
        </div>
      ) : (
        <div className="pb-1 flex-shrink-0" />
      )}

      {/* Phase content */}
      {phase === PHASE.PREVIEW && (
        <PreviewDisplay
          scene={scene}
          previewMs={diff?.previewMs ?? 2000}
          round={round}
          t={t}
        />
      )}

      {phase === PHASE.HIDE && <HideDisplay t={t} />}

      {(phase === PHASE.QUESTION || phase === PHASE.RESULT) && question && (
        <QuestionView
          question={question}
          lang={lang}
          phase={phase}
          selected={selected}
          round={round}
          onAnswer={handleAnswer}
          onContinue={handleContinue}
          t={t}
        />
      )}

      {/* Overlays */}
      {phase === PHASE.SELECT && (
        <DifficultyOverlay
          onSelect={startSession}
          onBack={() => onNavigate('home')}
          t={t}
        />
      )}

      {phase === PHASE.FINISHED && (
        <ResultsScreen
          correctRounds={correctRounds}
          onRestart={handleRestart}
          onChangeLevel={handleChangeLevel}
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
