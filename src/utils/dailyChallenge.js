import { getLocalDateString } from './streak';
import { computeSessionAccuracyPercent } from './progression';

export const DAILY_CHALLENGE_BONUS_XP = 15;

/** @typedef {'sessions' | 'accuracy_session' | 'mistake_free_rounds'} DailyChallengeType */

const VARIANTS = [
  { type: 'sessions', target: 2 },
  { type: 'accuracy_session', target: 80 },
  { type: 'mistake_free_rounds', target: 3 },
];

function hashDay(dateStr) {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = Math.imul(31, h) + dateStr.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

/**
 * Deterministic challenge for a calendar day (same day → same challenge until stored).
 * @param {string} dateStr YYYY-MM-DD
 */
export function generateDailyChallengeForDate(dateStr) {
  const idx = hashDay(dateStr) % VARIANTS.length;
  const v = VARIANTS[idx];
  return {
    date: dateStr,
    type: v.type,
    target: v.target,
    progress: 0,
    completed: false,
    xpAwarded: false,
  };
}

function sanitizeInt(n) {
  const x = Number(n);
  return Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0;
}

const KNOWN_TYPES = new Set(['sessions', 'accuracy_session', 'mistake_free_rounds']);

/**
 * Reset challenge when the calendar day changes; otherwise restore saved state.
 * @param {unknown} raw
 * @param {string} todayStr
 */
export function normalizeDailyChallenge(raw, todayStr) {
  const fresh = generateDailyChallengeForDate(todayStr);
  if (!raw || typeof raw !== 'object') return fresh;
  if (raw.date !== todayStr) return fresh;
  const type = KNOWN_TYPES.has(raw.type) ? raw.type : fresh.type;
  const target = sanitizeInt(raw.target) || fresh.target;
  return {
    date: todayStr,
    type,
    target,
    progress: sanitizeInt(raw.progress),
    completed: Boolean(raw.completed),
    xpAwarded: Boolean(raw.xpAwarded),
  };
}

/**
 * Apply a completed session toward today's challenge. Awards are handled by caller.
 * @param {object} challenge
 * @param {{ roundsCompleted?: number, correctAnswers?: number, wrongAnswers?: number, sessionCompleted?: boolean }} sessionMeta
 * @returns {{ challenge: object, xpBonus: number }}
 */
export function applySessionToDailyChallenge(challenge, sessionMeta) {
  const today = getLocalDateString();
  let c = { ...challenge };
  if (!c || c.date !== today) {
    c = generateDailyChallengeForDate(today);
  }

  let xpBonus = 0;
  if (c.completed && c.xpAwarded) {
    return { challenge: c, xpBonus: 0 };
  }

  const sessionCompleted = Boolean(sessionMeta?.sessionCompleted);
  if (!sessionCompleted) {
    return { challenge: c, xpBonus: 0 };
  }

  const roundsCompleted = sanitizeInt(sessionMeta.roundsCompleted);
  const correctAnswers = sanitizeInt(sessionMeta.correctAnswers);
  const wrongAnswers = sanitizeInt(sessionMeta.wrongAnswers);
  const acc = computeSessionAccuracyPercent(roundsCompleted, correctAnswers, wrongAnswers);

  let progress = c.progress;

  switch (c.type) {
    case 'sessions':
      progress = Math.min(c.target, progress + 1);
      break;
    case 'accuracy_session':
      if (acc >= c.target) {
        progress = c.target;
      }
      break;
    case 'mistake_free_rounds':
      if (wrongAnswers === 0 && roundsCompleted > 0) {
        progress = Math.min(c.target, progress + roundsCompleted);
      }
      break;
    default:
      break;
  }

  const completed = progress >= c.target;
  c = {
    ...c,
    progress,
    completed,
  };

  if (completed && !c.xpAwarded) {
    xpBonus = DAILY_CHALLENGE_BONUS_XP;
    c.xpAwarded = true;
  }

  return { challenge: c, xpBonus };
}
