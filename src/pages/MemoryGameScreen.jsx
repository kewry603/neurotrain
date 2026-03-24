import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgress } from '../context/ProgressContext';
import { usePremium } from '../context/PremiumContext';
import PremiumHardGateModal from '../components/PremiumHardGateModal';
import LanguageToggle from '../components/LanguageToggle';
import MuteButton from '../components/MuteButton';
import { playSound, toggleMute, isMuted } from '../utils/sound';
import { computeSessionAccuracyPercent, computeSessionXpReward } from '../utils/progression';

/** Set by Home “Start Training” so difficulty pick doesn’t play `start` twice. */
const SESSION_START_SKIP_MEMORY_KEY = 'nt_skipSessionStartOnce_memory';

// ─── Game phases ──────────────────────────────────────────────────────────────
const PHASE = {
  SELECT:    'select',
  MEMORIZE:  'memorize',
  COUNTDOWN: 'countdown',
  PLAYING:   'playing',
};

const MISMATCH_DELAY_MS  = 1100;
const SUCCESS_FLASH_MS   = 1800;
const LEVEL_UP_FLASH_MS  = 1800;
const ROUNDS_PER_LEVEL   = 5;   // rounds before advancing to next level

// ─── Difficulty configuration ─────────────────────────────────────────────────
// `pairs` = number of matching pairs → total cards = pairs × 2 (4 / 6 / 8 cards).
// `cols`  = CSS grid columns; deck is built only from `pairs` via `createDeck`.
// Memorize bar duration (pairs unchanged). ~1s on hard; easy/medium scale with grid load.
const DIFFICULTIES = {
  easy: {
    id: 'easy', pairs: 2, cols: 2, memorizeMs: 1650,
    emoji: '🌱', color: '#10b981', glow: 'rgba(16,185,129,0.65)',
    bg: 'rgba(16,185,129,0.1)', gridLabel: '2×2',
  },
  medium: {
    id: 'medium', pairs: 3, cols: 3, memorizeMs: 1350,
    emoji: '⚡', color: '#f59e0b', glow: 'rgba(245,158,11,0.65)',
    bg: 'rgba(245,158,11,0.1)', gridLabel: '3×2',
  },
  hard: {
    id: 'hard', pairs: 4, cols: 4, memorizeMs: 1000,
    emoji: '🔥', color: '#ef4444', glow: 'rgba(239,68,68,0.65)',
    bg: 'rgba(239,68,68,0.1)', gridLabel: '4×2',
  },
  expert: {
    id: 'expert', pairs: 5, cols: 5, memorizeMs: 750,
    emoji: '💎', color: '#a855f7', glow: 'rgba(168,85,247,0.65)',
    bg: 'rgba(168,85,247,0.1)', gridLabel: '5×2',
  },
};
const DIFF_ORDER = ['easy', 'medium', 'hard', 'expert'];

// ─── Card pool ────────────────────────────────────────────────────────────────
const ALL_CARD_TYPES = [
  { id: 'fire',      emoji: '🔥', color: '#f97316', glow: 'rgba(249,115,22,0.65)',  bg: 'rgba(249,115,22,0.13)'  },
  { id: 'star',      emoji: '⭐', color: '#f59e0b', glow: 'rgba(245,158,11,0.65)',  bg: 'rgba(245,158,11,0.13)'  },
  { id: 'diamond',   emoji: '💎', color: '#06b6d4', glow: 'rgba(6,182,212,0.65)',   bg: 'rgba(6,182,212,0.13)'   },
  { id: 'rocket',    emoji: '🚀', color: '#a855f7', glow: 'rgba(168,85,247,0.65)',  bg: 'rgba(168,85,247,0.13)'  },
  { id: 'brain',     emoji: '🧠', color: '#ec4899', glow: 'rgba(236,72,153,0.65)',  bg: 'rgba(236,72,153,0.13)'  },
  { id: 'bolt',      emoji: '⚡', color: '#eab308', glow: 'rgba(234,179,8,0.65)',   bg: 'rgba(234,179,8,0.13)'   },
  { id: 'moon',      emoji: '🌙', color: '#3b82f6', glow: 'rgba(59,130,246,0.65)',  bg: 'rgba(59,130,246,0.13)'  },
  { id: 'crystal',   emoji: '🔮', color: '#8b5cf6', glow: 'rgba(139,92,246,0.65)',  bg: 'rgba(139,92,246,0.13)'  },
  { id: 'target',    emoji: '🎯', color: '#ef4444', glow: 'rgba(239,68,68,0.65)',   bg: 'rgba(239,68,68,0.13)'   },
  { id: 'wave',      emoji: '🌊', color: '#a855f7', glow: 'rgba(124,58,237,0.65)',  bg: 'rgba(124,58,237,0.13)'  },
  { id: 'butterfly', emoji: '🦋', color: '#d946ef', glow: 'rgba(217,70,239,0.65)',  bg: 'rgba(217,70,239,0.13)'  },
  { id: 'snowflake', emoji: '❄️', color: '#7dd3fc', glow: 'rgba(125,211,252,0.65)', bg: 'rgba(125,211,252,0.13)' },
  { id: 'trophy',    emoji: '🏆', color: '#fbbf24', glow: 'rgba(251,191,36,0.65)',  bg: 'rgba(251,191,36,0.13)'  },
  { id: 'clover',    emoji: '🍀', color: '#22c55e', glow: 'rgba(34,197,94,0.65)',   bg: 'rgba(34,197,94,0.13)'   },
  { id: 'dragon',    emoji: '🐉', color: '#f43f5e', glow: 'rgba(244,63,94,0.65)',   bg: 'rgba(244,63,94,0.13)'   },
  { id: 'planet',    emoji: '🪐', color: '#6366f1', glow: 'rgba(99,102,241,0.65)',  bg: 'rgba(99,102,241,0.13)'  },
  { id: 'sun',       emoji: '☀️', color: '#fb923c', glow: 'rgba(251,146,60,0.65)',  bg: 'rgba(251,146,60,0.13)'  },
  { id: 'comet',     emoji: '☄️', color: '#a78bfa', glow: 'rgba(167,139,250,0.65)', bg: 'rgba(167,139,250,0.13)' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Builds exactly `pairs × 2` cards: first `pairs` emoji types, each duplicated. */
function createDeck(diffId) {
  const diff = DIFFICULTIES[diffId];
  const pairCount = diff.pairs;
  return shuffle(
    ALL_CARD_TYPES.slice(0, pairCount).flatMap((type) => [
      { ...type, uid: `${type.id}-a` },
      { ...type, uid: `${type.id}-b` },
    ])
  );
}

// ─── Card back ────────────────────────────────────────────────────────────────
function CardBack() {
  return (
    <div className="w-full h-full rounded-[inherit] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(224,242,254,0.5) 100%)',
        border: '1px solid rgba(13,148,136,0.28)',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3"  stroke="rgba(13,148,136,0.65)"  strokeWidth="1.2" />
        <circle cx="12" cy="12" r="6"  stroke="rgba(13,148,136,0.2)" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="12" y1="6"  x2="12" y2="3"  stroke="rgba(13,148,136,0.45)" strokeWidth="1" strokeLinecap="round" />
        <line x1="12" y1="21" x2="12" y2="18" stroke="rgba(13,148,136,0.45)" strokeWidth="1" strokeLinecap="round" />
        <line x1="6"  y1="12" x2="3"  y2="12" stroke="rgba(13,148,136,0.45)" strokeWidth="1" strokeLinecap="round" />
        <line x1="21" y1="12" x2="18" y2="12" stroke="rgba(13,148,136,0.45)" strokeWidth="1" strokeLinecap="round" />
        <circle cx="12" cy="3"  r="0.9" fill="rgba(13,148,136,0.55)" />
        <circle cx="12" cy="21" r="0.9" fill="rgba(13,148,136,0.55)" />
        <circle cx="3"  cy="12" r="0.9" fill="rgba(13,148,136,0.55)" />
        <circle cx="21" cy="12" r="0.9" fill="rgba(13,148,136,0.55)" />
      </svg>
    </div>
  );
}

// ─── Card front ───────────────────────────────────────────────────────────────
function CardFront({ card, isMatched, isMismatch, isJustMatched, isMemorize, variant }) {
  const emojiSize = variant === 'lg' ? 'text-5xl' : variant === 'sm' ? 'text-[15px]' : 'text-[26px]';
  const badge =
    variant === 'lg' ? { outer: 'w-5 h-5 top-1.5 right-1.5', inner: 'text-[10px]' } :
    variant === 'sm' ? { outer: 'w-2.5 h-2.5 top-0.5 right-0.5', inner: 'text-[6px]' } :
                       { outer: 'w-3.5 h-3.5 top-1 right-1',     inner: 'text-[8px]'  };

  return (
    <div
      className={[
        'w-full h-full rounded-[inherit] flex items-center justify-center relative',
        isMismatch    ? 'is-mismatch'       : '',
        isJustMatched ? 'card-just-matched' : '',
      ].join(' ')}
      style={{
        background: isMatched
          ? `linear-gradient(145deg, ${card.bg.replace('0.13','0.28')}, #ffffff)`
          : isMemorize
          ? `linear-gradient(145deg, ${card.bg.replace('0.13','0.2')}, #f8fafc)`
          : `linear-gradient(145deg, ${card.bg}, #ffffff)`,
        border: isMatched
          ? `1.5px solid ${card.color}75`
          : isMemorize ? `1px solid ${card.color}50`
          : isMismatch ? '1.5px solid rgba(239,68,68,0.5)'
          : '1px solid rgba(15,23,42,0.1)',
        boxShadow: isMatched
          ? `0 0 18px ${card.glow}, inset 0 0 16px ${card.bg.replace('0.13','0.2')}`
          : isMemorize ? `0 0 8px ${card.glow.replace('0.65','0.3')}` : 'none',
      }}
    >
      <span className={`${emojiSize} leading-none select-none`}
        style={{ filter: isMatched || isMemorize ? 'none' : 'saturate(0.85)' }}>
        {card.emoji}
      </span>
      {isMatched && (
        <div
          className={`absolute rounded-full flex items-center justify-center ${badge.outer}`}
          style={{ background: card.color, boxShadow: `0 0 7px ${card.glow}` }}
        >
          <span className={`text-white font-black leading-none ${badge.inner}`}>✓</span>
        </div>
      )}
    </div>
  );
}

// ─── Single memory card ───────────────────────────────────────────────────────
function MemoryCard({ card, isFaceUp, isMatched, isMismatch, isJustMatched,
                      isMemorize, isGameLocked, isLocked, staggerMs, index, variant, onClick }) {
  const cursor = isMatched || isGameLocked ? 'cursor-default'
    : isLocked && !isFaceUp ? 'cursor-not-allowed'
    : 'cursor-pointer';

  return (
    <div className={`card-scene rounded-xl ${cursor}`} onClick={onClick}>
      <div
        className={['card-inner rounded-xl', isFaceUp ? 'is-flipped' : ''].join(' ')}
        style={{ transitionDelay: `${staggerMs * index}ms` }}
      >
        <div className="card-face card-face-back rounded-xl"><CardBack /></div>
        <div className="card-face card-face-front rounded-xl">
          <CardFront
            card={card} isMatched={isMatched} isMismatch={isMismatch}
            isJustMatched={isJustMatched} isMemorize={isMemorize} variant={variant}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Difficulty selection overlay ─────────────────────────────────────────────
function DifficultyOverlay({ onSelect, onBack, t }) {
  const tagKey = { easy: 'easyTag', medium: 'mediumTag', hard: 'hardTag', expert: 'expertTag' };

  return (
    <div className="absolute inset-0 z-30 flex min-h-0 flex-col overflow-hidden bg-white/98 backdrop-blur-md"
    >
      <div className="pointer-events-none absolute left-1/2 top-[-60px] h-80 w-80 -translate-x-1/2 rounded-full
        blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, #ccfbf1, #e0f2fe)' }} />

      {/* Back to home */}
      <div className="relative z-10 flex-shrink-0 px-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))]">
        <button onClick={onBack}
          className="flex min-h-[48px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('game.back')}
        </button>
      </div>

      <div className="app-scroll relative flex min-h-0 flex-1 flex-col items-center gap-8 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-4xl animate-float">🧠</div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            NeuroTrain
          </h2>
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            {t('game.selectLevel')}
          </p>
        </div>

        <div className="flex w-full flex-col gap-4">
          {DIFF_ORDER.map((id) => {
            const d = DIFFICULTIES[id];
            return (
              <button key={id} onClick={() => onSelect(id)}
                className="diff-card-enter group relative flex min-h-[72px] items-center gap-4 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition-transform duration-150 hover:scale-[1.01] hover:border-slate-300 active:scale-[0.99]"
                style={{ borderColor: `${d.color}40` }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ background: d.color, boxShadow: `0 0 12px ${d.glow}` }} />
                <span className="text-2xl ml-1 flex-shrink-0">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base font-bold uppercase tracking-wider"
                      style={{ color: d.color }}>
                      {t(`game.${id}`)}
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                      style={{ background: `${d.color}22`, color: d.color, border: `1px solid ${d.color}40` }}>
                      {t(`game.${tagKey[id]}`)}
                    </span>
                  </div>
                  <p className="text-sm leading-snug text-slate-600">{t(`game.${id}Desc`)}</p>
                </div>
                <div className="mr-1 flex flex-shrink-0 flex-col items-center">
                  <span className="text-lg font-bold leading-none" style={{ color: d.color }}>
                    {d.gridLabel}
                  </span>
                  <span className="mt-0.5 text-2xs text-slate-400">grid</span>
                </div>
                <svg className="h-5 w-5 flex-shrink-0 text-slate-300 transition-colors group-hover:text-primary"
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

// ─── Round progress dots (easy/medium only, 5 dots) ───────────────────────────
function RoundDots({ roundInLevel, color, glow }) {
  return (
    <div className="flex items-center gap-[5px]">
      {[1, 2, 3, 4, 5].map((i) => {
        const done    = i < roundInLevel;
        const current = i === roundInLevel;
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width:  current ? '9px' : '6px',
              height: current ? '9px' : '6px',
              background: (done || current) ? color : 'rgba(15,23,42,0.12)',
              opacity: done ? 1 : current ? 0.85 : 0.35,
              boxShadow: current ? `0 0 7px ${glow}` : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Success flash ────────────────────────────────────────────────────────────
function SuccessFlash({ roundInLevel, difficulty, seconds, moves, efficiency, t }) {
  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const effLabel =
    efficiency >= 90 ? '🏆' :
    efficiency >= 70 ? '⭐' :
    efficiency >= 50 ? '👍' : '🔁';

  const isMaxLevel   = difficulty === 'expert';
  const isLastRound  = roundInLevel >= ROUNDS_PER_LEVEL;
  const levelingUp   = isLastRound && !isMaxLevel;

  // Label for "Round X / 5 complete" or "Round X complete" (expert: endless)
  const roundLabel = isMaxLevel
    ? String(roundInLevel)
    : `${roundInLevel}/5`;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-5"
      style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}>
      <div className="pointer-events-none absolute h-72 w-72 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, #a7f3d0 0%, #ccfbf1 65%, transparent 100%)' }} />

      <div className="success-flash-inner nt-memory-round-success-panel relative flex w-full flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-6 text-center shadow-elevated sm:px-6">

        {/* Check circle */}
        <div className="nt-feedback-result-icon w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(16,185,129,0.12)',
            border: '2px solid rgba(16,185,129,0.50)',
            boxShadow: '0 0 28px rgba(16,185,129,0.30)',
          }}
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24"
            stroke="#34d399" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Headline */}
        <div>
          <h2 className="text-2xl font-extrabold leading-tight text-slate-900">
            {t('game.greatJob')}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {t('game.roundCompleted').replace('{round}', roundLabel)}
          </p>
        </div>

        {/* Stats */}
        <div className="grid w-full grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
          {[
            { val: fmt(seconds),                  label: t('game.time'),       cls: 'text-violet-300'   },
            { val: String(moves).padStart(2,'0'), label: t('game.moves'),      cls: 'text-primary'   },
            { val: `${effLabel} ${efficiency}%`,  label: t('game.efficiency'), cls: 'text-emerald-700' },
          ].map(({ val, label, cls }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className={`text-base font-bold leading-tight ${cls}`}>{val}</span>
              <span className="text-2xs font-semibold uppercase tracking-widest text-slate-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Next-action label + depleting bar */}
        <div className="flex w-full flex-col gap-2">
          <p className={`text-center text-2xs font-semibold uppercase tracking-widest ${
            levelingUp ? 'text-amber-700' : 'text-slate-500'
          }`}>
            {levelingUp ? t('game.levelUpIncoming') : t('game.nextRound')}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="success-auto-bar h-full rounded-full"
              style={{
                background: levelingUp
                  ? 'linear-gradient(90deg, #f59e0b, #ec4899)'
                  : 'linear-gradient(90deg, #10b981, #a855f7, #ec4899)',
                boxShadow: levelingUp
                  ? '0 0 8px rgba(245,158,11,0.5)'
                  : '0 0 8px rgba(16,185,129,0.45)',
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Level-up flash ───────────────────────────────────────────────────────────
function LevelUpFlash({ nextDiffId, t }) {
  const d = DIFFICULTIES[nextDiffId];

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-5"
      style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}>

      {/* Colored ambient for the new level */}
      <div className="pointer-events-none absolute h-72 w-72 rounded-full blur-3xl opacity-35"
        style={{ background: `radial-gradient(circle, ${d.color} 0%, #ccfbf1 65%, transparent 100%)` }} />

      <div className="level-up-flash-inner nt-level-up-emphasis relative flex w-full flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-6 text-center shadow-elevated sm:px-6">

        {/* Up-arrow icon in next level's color */}
        <div className="nt-feedback-result-icon w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: `${d.color}18`,
            border: `2px solid ${d.color}65`,
            boxShadow: `0 0 32px ${d.glow}`,
          }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24"
            stroke={d.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </div>

        {/* Headline */}
        <div>
          <h2 className="font-display font-black text-2xl text-transparent bg-clip-text leading-tight"
            style={{ backgroundImage: `linear-gradient(90deg, ${d.color}, #ec4899, #a855f7)` }}>
            {t('game.levelUp')}
          </h2>
          <p className="text-white/40 text-xs mt-0.5">{t('game.levelUpSubtitle')}</p>
        </div>

        {/* Next level preview card */}
        <div className="glass rounded-2xl px-5 py-3 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{d.emoji}</span>
            <span className="font-display font-bold text-base uppercase tracking-wider"
              style={{ color: d.color, textShadow: `0 0 12px ${d.glow}` }}>
              {t(`game.${nextDiffId}`)}
            </span>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-sm" style={{ color: d.color }}>{d.gridLabel}</p>
            <p className="text-white/30 text-[10px]">{d.memorizeMs / 1000}s mem</p>
          </div>
        </div>

        {/* Auto-advance bar */}
        <div className="w-full flex flex-col gap-1.5">
          <p className="text-white/30 text-[10px] uppercase tracking-widest">{t('game.nextRound')}</p>
          <div className="h-1 rounded-full overflow-hidden bg-white/6">
            <div className="success-auto-bar h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${d.color}, #a855f7, #ec4899)`,
                boxShadow: `0 0 8px ${d.glow}`,
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Memorize banner ──────────────────────────────────────────────────────────
function MemorizeBanner({ t, duration }) {
  return (
    <div className="w-full flex flex-col gap-1.5 px-4">
      <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl"
        style={{
          background: 'rgba(168,85,247,0.13)',
          border: '1px solid rgba(168,85,247,0.45)',
          boxShadow: '0 0 16px rgba(168,85,247,0.18)',
        }}
      >
        <span className="text-base leading-none">🧠</span>
        <span className="font-display font-bold text-[11px] uppercase tracking-widest text-neon-purple text-glow-purple">
          {t('game.memorizePhase')}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/6">
        <div className="memorize-timer-bar h-full rounded-full"
          style={{
            animationDuration: `${duration}ms`,
            background: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)',
            boxShadow: '0 0 8px rgba(168,85,247,0.5)',
          }}
        />
      </div>
    </div>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function CountdownDisplay({ num, t }) {
  const isGo = num === 0;
  return (
    <div className="w-full flex flex-col items-center justify-center gap-0.5 px-4">
      {!isGo && (
        <span className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">
          {t('game.getReady')}
        </span>
      )}
      <span key={num} className={isGo ? 'go-pop' : 'countdown-pop'}
        style={{
          fontFamily: 'Orbitron, sans-serif', fontWeight: 900,
          fontSize: isGo ? '2rem' : '2.5rem', lineHeight: 1,
          color: isGo ? '#34d399' : '#ffffff', display: 'inline-block', userSelect: 'none',
          textShadow: isGo
            ? '0 0 24px rgba(52,211,153,0.9), 0 0 48px rgba(52,211,153,0.4)'
            : '0 0 20px rgba(255,255,255,0.55), 0 0 40px rgba(168,85,247,0.3)',
        }}
      >
        {isGo ? t('game.go') : num}
      </span>
    </div>
  );
}

// ─── Feedback banner ──────────────────────────────────────────────────────────
function FeedbackBanner({ feedback }) {
  if (!feedback) return null;
  const isMatch = feedback.type === 'match';
  return (
    <div
      className={`w-full flex items-center justify-center gap-2 py-1.5 mx-4 rounded-xl
        text-xs font-semibold tracking-wide ${feedback.exiting ? 'feedback-exit' : 'feedback-enter'}`}
      style={{
        background: isMatch ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
        border: `1px solid ${isMatch ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}`,
        color: isMatch ? '#34d399' : '#f87171',
        boxShadow: isMatch ? '0 0 12px rgba(16,185,129,0.2)' : '0 0 12px rgba(239,68,68,0.2)',
      }}
    >
      <span className="text-sm leading-none">{isMatch ? '✓' : '✗'}</span>
      <span>{feedback.msg}</span>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mx-4 mb-1 flex-shrink-0">
      <div className="h-1 rounded-full bg-white/6 overflow-hidden">
        <div className="progress-bar-fill h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #a855f7, #ec4899, #3b82f6)',
            boxShadow: pct > 0 ? '0 0 8px rgba(168,85,247,0.5)' : 'none',
          }}
        />
      </div>
    </div>
  );
}

// ─── Main game screen ─────────────────────────────────────────────────────────
export default function MemoryGameScreen({ onNavigate }) {
  const { t } = useLanguage();
  const { awardSessionXp, recordSessionResult } = useProgress();
  /** Premium: Hard difficulty requires `isPremium` — checked on level pick and on in-run level-up to Hard. */
  const { isPremium } = usePremium();
  const [muted, setMuted] = useState(isMuted());
  const [showPremiumHardGate, setShowPremiumHardGate] = useState(false);

  const handleMute = () => setMuted(toggleMute());

  const [difficulty,    setDifficulty]    = useState(null);
  const [phase,         setPhase]         = useState(PHASE.SELECT);
  const [countdownNum,  setCountdownNum]  = useState(3);
  const [cards,         setCards]         = useState([]);
  const [selected,      setSelected]      = useState([]);
  const [matched,       setMatched]       = useState(new Set());
  const [justMatched,   setJustMatched]   = useState(new Set());
  const [mismatch,      setMismatch]      = useState([]);
  const [moves,         setMoves]         = useState(0);
  const [score,         setScore]         = useState(0);
  const [seconds,       setSeconds]       = useState(0);
  const [timerRunning,  setTimerRunning]  = useState(false);
  const [locked,        setLocked]        = useState(false);
  const [feedback,      setFeedback]      = useState(null);
  const [roundInLevel,  setRoundInLevel]  = useState(1);
  const [successFlash,  setSuccessFlash]  = useState(false);
  const [levelUpFlash,  setLevelUpFlash]  = useState(false);

  const feedbackTimer    = useRef(null);
  const roundInLevelRef  = useRef(1);   // synchronous access to current round
  const levelUpTargetRef = useRef(null); // next difficulty id, set before levelUpFlash
  /** Memory Matrix has no single “session end” screen — we grant performance XP every 8 cleared boards. */
  const sessionXpStampRef = useRef(0);
  const memoryRoundsTowardXpRef = useRef(0);
  const mismatchCountSinceXpRef = useRef(0);
  const prevSuccessFlashRef = useRef(false);

  const diff         = difficulty ? DIFFICULTIES[difficulty] : null;
  const totalPairs   = diff?.pairs ?? 0;
  const isGameLocked = phase !== PHASE.PLAYING;
  const staggerMs    = cards.length > 0 ? Math.floor(280 / cards.length) : 0;
  const cardVariant  = diff?.cols === 2 ? 'lg' : diff?.cols >= 5 ? 'sm' : 'md';
  const gridGap      = diff?.cols === 6 ? '4px' : diff?.cols === 5 ? '6px' : '10px';

  // Every time a grid is fully cleared, successFlash pulses; count 8 clears → XP + global stats (8 “rounds”, mismatches as wrong).
  useEffect(() => {
    if (successFlash && !prevSuccessFlashRef.current) {
      prevSuccessFlashRef.current = true;
      memoryRoundsTowardXpRef.current += 1;
      if (memoryRoundsTowardXpRef.current >= 8) {
        memoryRoundsTowardXpRef.current -= 8;
        const batchFp = `memory-${sessionXpStampRef.current}-${Date.now()}`;
        const wrong = mismatchCountSinceXpRef.current;
        mismatchCountSinceXpRef.current = 0;
        const correct = 8;
        const accuracyPercent = computeSessionAccuracyPercent(8, correct, wrong);
        const isPerfect = wrong === 0;
        const xp = computeSessionXpReward({
          accuracyPercent,
          difficultyId: difficulty ?? 'easy',
          isPerfect,
        });
        awardSessionXp(batchFp, xp);
        recordSessionResult({
          fingerprint: batchFp,
          roundsCompleted: 8,
          correctAnswers: correct,
          wrongAnswers: wrong,
          sessionCompleted: true,
          difficultyId: difficulty ?? 'easy',
        });
      }
    }
    if (!successFlash) prevSuccessFlashRef.current = false;
  }, [successFlash, difficulty, awardSessionXp, recordSessionResult]);

  // ── Phase 1: memorize → countdown ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== PHASE.MEMORIZE || !diff) return;
    const timer = setTimeout(() => {
      setPhase(PHASE.COUNTDOWN);
      setCountdownNum(3);
    }, diff.memorizeMs);
    return () => clearTimeout(timer);
  }, [phase, diff]);

  // ── Phase 2: countdown 3→2→1→GO!→playing ───────────────────────────────────
  useEffect(() => {
    if (phase !== PHASE.COUNTDOWN) return;
    if (countdownNum < 0) { setPhase(PHASE.PLAYING); return; }
    const timer = setTimeout(
      () => setCountdownNum(n => n - 1),
      countdownNum === 0 ? 500 : 950
    );
    return () => clearTimeout(timer);
  }, [phase, countdownNum]);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // ── Win detection step 1: detect → show success flash ──────────────────────
  // successFlash must NOT be in deps (changing it would re-run cleanup and kill the timer)
  useEffect(() => {
    if (phase !== PHASE.PLAYING) return;
    if (totalPairs === 0) return;
    if (matched.size !== totalPairs) return;
    setTimerRunning(false);
    setSuccessFlash(true);
  }, [matched, totalPairs, phase]);

  // ── Win detection step 2: success flash timer → next round or level up ─────
  useEffect(() => {
    if (!successFlash) return;
    const timer = setTimeout(() => {
      // Round wrap chime — skip when this win triggers a difficulty jump (`levelUp` plays instead).
      const willLevelUp =
        roundInLevelRef.current >= ROUNDS_PER_LEVEL && difficulty !== 'expert';
      if (!willLevelUp) {
        playSound('roundComplete');
      }
      setSuccessFlash(false);
      startNextRound();
    }, SUCCESS_FLASH_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successFlash, difficulty]);

  // ── Level-up flash timer → apply level change ───────────────────────────────
  useEffect(() => {
    if (!levelUpFlash) return;
    const timer = setTimeout(() => {
      const nextDiffId = levelUpTargetRef.current;
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      // Apply all state changes for the new level
      setLevelUpFlash(false);
      setDifficulty(nextDiffId);
      roundInLevelRef.current = 1;
      setRoundInLevel(1);
      setCards(createDeck(nextDiffId));
      setPhase(PHASE.MEMORIZE);
      setCountdownNum(3);
      setSelected([]);
      setMatched(new Set());
      setJustMatched(new Set());
      setMismatch([]);
      setMoves(0);
      setSeconds(0);
      setTimerRunning(false);
      setLocked(false);
      setFeedback(null);
      // score accumulates across all rounds and levels
    }, LEVEL_UP_FLASH_MS);
    return () => clearTimeout(timer);
  }, [levelUpFlash]);

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const showFeedback = useCallback((type, msg) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ type, msg, exiting: false });
    feedbackTimer.current = setTimeout(() => {
      setFeedback(f => f ? { ...f, exiting: true } : null);
      feedbackTimer.current = setTimeout(() => setFeedback(null), 230);
    }, type === 'match' ? 1300 : 950);
  }, []);

  // ── Start next round — same level, or trigger level-up ─────────────────────
  const startNextRound = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);

    if (roundInLevelRef.current >= ROUNDS_PER_LEVEL && difficulty !== 'expert') {
      const nextDiffId = DIFF_ORDER[DIFF_ORDER.indexOf(difficulty) + 1];
      // Premium gate: Hard and Expert require Premium — stay on tier, restart round cycle.
      if ((nextDiffId === 'hard' || nextDiffId === 'expert') && !isPremium) {
        setShowPremiumHardGate(true);
        roundInLevelRef.current = 1;
        setRoundInLevel(1);
        setCards(createDeck(difficulty));
        setPhase(PHASE.MEMORIZE);
        setCountdownNum(3);
        setSelected([]);
        setMatched(new Set());
        setJustMatched(new Set());
        setMismatch([]);
        setMoves(0);
        setSeconds(0);
        setTimerRunning(false);
        setLocked(false);
        setFeedback(null);
        return;
      }
      // Last round of this level → trigger level-up
      levelUpTargetRef.current = nextDiffId;
      playSound('levelUp');
      setLevelUpFlash(true);
      return;
    }

    // Continue at same level with incremented round
    roundInLevelRef.current += 1;
    setRoundInLevel(roundInLevelRef.current);
    setCards(createDeck(difficulty));
    setPhase(PHASE.MEMORIZE);
    setCountdownNum(3);
    setSelected([]);
    setMatched(new Set());
    setJustMatched(new Set());
    setMismatch([]);
    setMoves(0);
    setSeconds(0);
    setTimerRunning(false);
    setLocked(false);
    setFeedback(null);
    // score accumulates across rounds
  }, [difficulty, isPremium]);

  // ── Full reset (used by difficulty select + restart) ────────────────────────
  const handleSelectDifficulty = useCallback((diffId) => {
    // Premium gate: Hard and Expert sessions require Premium.
    if ((diffId === 'hard' || diffId === 'expert') && !isPremium) {
      setShowPremiumHardGate(true);
      return;
    }
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    try {
      if (sessionStorage.getItem(SESSION_START_SKIP_MEMORY_KEY)) {
        sessionStorage.removeItem(SESSION_START_SKIP_MEMORY_KEY);
      } else {
        playSound('start');
      }
    } catch {
      playSound('start');
    }
    sessionXpStampRef.current = Date.now();
    memoryRoundsTowardXpRef.current = 0;
    mismatchCountSinceXpRef.current = 0;
    roundInLevelRef.current = 1;
    setDifficulty(diffId);
    setRoundInLevel(1);
    setCards(createDeck(diffId));
    setPhase(PHASE.MEMORIZE);
    setCountdownNum(3);
    setSelected([]);
    setMatched(new Set());
    setJustMatched(new Set());
    setMismatch([]);
    setMoves(0);
    setScore(0);
    setSeconds(0);
    setTimerRunning(false);
    setLocked(false);
    setSuccessFlash(false);
    setLevelUpFlash(false);
    setFeedback(null);
  }, [isPremium]);

  const goToSelect = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    memoryRoundsTowardXpRef.current = 0;
    mismatchCountSinceXpRef.current = 0;
    roundInLevelRef.current = 1;
    setPhase(PHASE.SELECT);
    setCards([]);
    setDifficulty(null);
    setRoundInLevel(1);
    setSelected([]);
    setMatched(new Set());
    setJustMatched(new Set());
    setMismatch([]);
    setMoves(0);
    setScore(0);
    setSeconds(0);
    setTimerRunning(false);
    setLocked(false);
    setSuccessFlash(false);
    setLevelUpFlash(false);
    setFeedback(null);
  }, []);

  const restart = useCallback(() => {
    if (difficulty) handleSelectDifficulty(difficulty);
  }, [difficulty, handleSelectDifficulty]);

  // ── Card click ──────────────────────────────────────────────────────────────
  const handleCardClick = useCallback((uid) => {
    if (phase !== PHASE.PLAYING || locked) return;
    const card = cards.find(c => c.uid === uid);
    if (!card || matched.has(card.id) || selected.includes(uid)) return;

    const next = [...selected, uid];
    // Tap only on the first card of a pair; on a mismatch only `wrong` plays (no tap + wrong).
    if (next.length === 1) {
      playSound('tap');
    }
    if (!timerRunning) setTimerRunning(true);

    setSelected(next);

    if (next.length === 2) {
      setLocked(true);
      setMoves(m => m + 1);
      const [a, b] = next.map(u => cards.find(c => c.uid === u));

      if (a.id === b.id) {
        playSound('match');
        const newMatched = new Set([...matched, a.id]);
        setMatched(newMatched);
        setJustMatched(prev => new Set([...prev, a.id]));
        setTimeout(() => {
          setJustMatched(prev => { const n = new Set(prev); n.delete(a.id); return n; });
        }, 520);
        const bonus  = Math.max(0, 60 - Math.floor(seconds / Math.max(newMatched.size, 1)) * 3);
        const gained = 100 + bonus;
        setScore(s => s + gained);
        showFeedback('match', `${t('game.matchFound')}  +${gained}`);
        setSelected([]);
        setLocked(false);
      } else {
        playSound('wrong');
        mismatchCountSinceXpRef.current += 1;
        setMismatch(next);
        showFeedback('mismatch', t('game.tryAgain'));
        setTimeout(() => {
          setSelected([]);
          setMismatch([]);
          setLocked(false);
        }, MISMATCH_DELAY_MS);
      }
    }
  }, [phase, locked, matched, selected, cards, timerRunning, seconds, showFeedback, t]);

  const pairsFound = matched.size;
  const efficiency =
    pairsFound > 0 && moves > 0
      ? Math.max(0, Math.min(100, Math.round((totalPairs / Math.max(moves, totalPairs)) * 100)))
      : 0;

  return (
    <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)' }}>

      {/* Ambient blobs */}
      <div className="absolute top-[-60px] right-[-60px] w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
      <div className="absolute bottom-[-40px] left-[-40px] w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />

      {/* ── Header ── */}
      <header className="flex flex-shrink-0 items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top,0px))]">
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
          {t('game.title')}
        </h1>
        <div className="flex items-center gap-2">
          <MuteButton muted={muted} onToggle={handleMute} />
          <LanguageToggle />
        </div>
      </header>

      {/* ── Level + round progress badge ── */}
      {difficulty ? (
        <div className="flex flex-col items-center gap-1.5 pb-1.5 flex-shrink-0">
          {/* Level pill + change button */}
          <div className="flex items-center gap-2">
            <span className="glass rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: diff.color, boxShadow: `0 0 10px ${diff.glow.replace('0.65','0.2')}` }}>
              {diff.emoji} {t(`game.${difficulty}`)} · {diff.gridLabel}
            </span>
            {phase === PHASE.PLAYING && (
              <button onClick={goToSelect}
                className="glass rounded-full px-2.5 py-0.5 text-[10px] text-white/35
                  hover:text-white/70 transition-all font-semibold uppercase tracking-widest">
                {t('game.changeLevel')}
              </button>
            )}
          </div>
          {/* Round dots (easy/medium/hard: 5 dots; expert: endless round #) */}
          <div className="flex items-center gap-2">
            {difficulty !== 'expert' ? (
              <>
                <RoundDots roundInLevel={roundInLevel} color={diff.color} glow={diff.glow} />
                <span className="text-white/35 text-[9px] font-semibold">
                  {t('game.round')} {roundInLevel}/5
                </span>
              </>
            ) : (
              <span className="text-[9px] font-semibold uppercase tracking-widest"
                style={{ color: diff.color }}>
                {t('game.round')} {roundInLevel}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="pb-1.5 flex-shrink-0" />
      )}

      {/* ── Stats row ── */}
      <div className="flex items-center justify-between px-4 py-2 mx-4 mb-1 glass rounded-2xl flex-shrink-0">
        {[
          { val: fmt(seconds), label: t('game.time'),
            cls: timerRunning ? 'text-fuchsia-400 text-glow-cyan' : 'text-slate-500', w: 'min-w-[52px]' },
          { val: String(moves).padStart(2,'0'), label: t('game.moves'),
            cls: 'text-neon-pink text-glow-pink', w: 'min-w-[40px]' },
          { val: score, label: t('game.score'),
            cls: 'text-neon-purple text-glow-purple', w: 'min-w-[48px]' },
          { val: <>{pairsFound}<span className="text-white/25 text-xs">/{totalPairs}</span></>,
            label: t('game.pairs'), cls: 'text-amber-400', w: 'min-w-[44px]' },
        ].reduce((acc, item, i, arr) => {
          acc.push(
            <div key={item.label} className={`flex flex-col items-center gap-0.5 ${item.w}`}>
              <span className={`font-display font-bold text-base leading-none transition-colors ${item.cls}`}>
                {item.val}
              </span>
              <span className="text-white/35 text-[9px] uppercase tracking-widest">{item.label}</span>
            </div>
          );
          if (i < arr.length - 1) acc.push(<div key={`d${i}`} className="w-px h-8 bg-white/10" />);
          return acc;
        }, [])}
      </div>

      {/* ── Progress bar ── */}
      <ProgressBar value={pairsFound} max={totalPairs} />

      {/* ── Phase display ── */}
      <div className="flex-shrink-0 h-14 flex items-center mb-1">
        {phase === PHASE.MEMORIZE  && <MemorizeBanner  t={t} duration={diff?.memorizeMs ?? 1000} />}
        {phase === PHASE.COUNTDOWN && <CountdownDisplay num={countdownNum} t={t} />}
        {phase === PHASE.PLAYING   && (
          <div className="w-full">
            {timerRunning
              ? <FeedbackBanner feedback={feedback} />
              : <p className="text-center text-white/30 text-[10px] uppercase tracking-widest">
                  {t('game.tapToStart')}
                </p>
            }
          </div>
        )}
      </div>

      {/* ── Card grid ── */}
      <div className="app-scroll flex min-h-0 flex-1 flex-col justify-start overflow-y-auto px-4 py-1">
        <div className="relative my-auto w-full min-h-0">
          {phase === PHASE.COUNTDOWN && (
            <div className="absolute inset-0 rounded-2xl z-10 pointer-events-none"
              style={{ background: 'rgba(18,14,46,0.35)', backdropFilter: 'blur(1px)' }} />
          )}
          {cards.length > 0 && (
            <div className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${diff?.cols ?? 4}, 1fr)`,
                gap: gridGap,
              }}
            >
              {cards.map((card, index) => {
                const isFaceUp = isGameLocked
                  ? true
                  : selected.includes(card.uid) || matched.has(card.id);
                return (
                  <div key={card.uid} className="aspect-square">
                    <MemoryCard
                      card={card}
                      isFaceUp={isFaceUp}
                      isMatched={matched.has(card.id)}
                      isMismatch={mismatch.includes(card.uid)}
                      isJustMatched={justMatched.has(card.id)}
                      isMemorize={isGameLocked}
                      isGameLocked={isGameLocked}
                      isLocked={locked}
                      staggerMs={staggerMs}
                      index={index}
                      variant={cardVariant}
                      onClick={() => handleCardClick(card.uid)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Restart button — extra bottom inset for mobile home indicator / gesture bar ── */}
      <div className="flex-shrink-0 px-4 pt-1 pb-[max(6rem,env(safe-area-inset-bottom,0px))]">
        <button onClick={restart}
          className="w-full py-2.5 glass rounded-2xl text-white/55 hover:text-white
            text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2
            transition-all duration-200 hover:shadow-glow-purple"
          disabled={phase === PHASE.SELECT}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M3 12a9 9 0 109-9 9 9 0 00-6.93 3.25" />
            <polyline points="3 3 3 9 9 9" />
          </svg>
          {t('game.restart')}
        </button>
      </div>

      {/* ── Difficulty select overlay ── */}
      {phase === PHASE.SELECT && (
        <DifficultyOverlay
          onSelect={handleSelectDifficulty}
          onBack={() => onNavigate('home')}
          t={t}
        />
      )}

      {/* ── Success flash (auto-advances after each round) ── */}
      {successFlash && (
        <SuccessFlash
          roundInLevel={roundInLevel}
          difficulty={difficulty}
          seconds={seconds}
          moves={moves}
          efficiency={efficiency}
          t={t}
        />
      )}

      {/* ── Level-up flash (shown when advancing to next difficulty) ── */}
      {levelUpFlash && (
        <LevelUpFlash nextDiffId={levelUpTargetRef.current} t={t} />
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
