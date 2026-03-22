import { computeSessionAccuracyPercent } from './progression';

/** @typedef {{ roundsCompleted?: number, correctAnswers?: number, wrongAnswers?: number, sessionCompleted?: boolean }} SessionMeta */

export const BADGE_IDS = [
  'first_session',
  'accuracy_master',
  'streak_3',
  'sessions_10',
  'perfect_round',
];

const BADGE_SET = new Set(BADGE_IDS);

function sanitizeInt(n) {
  const x = Number(n);
  return Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0;
}

/** @param {unknown} arr */
export function normalizeUnlockedBadges(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.filter((id) => typeof id === 'string' && BADGE_SET.has(id)))].sort();
}

/**
 * Merge newly earned badges from progress + optional session that just completed.
 * @param {string[]} prevUnlocked
 * @param {object} progress — totals after any stat write (includes currentStreak, totalSessionsCompleted, …)
 * @param {SessionMeta | null} sessionMeta
 * @returns {{ unlockedBadges: string[], changed: boolean }}
 */
export function computeBadgeUnlocks(prevUnlocked, progress, sessionMeta) {
  const s = new Set(normalizeUnlockedBadges(prevUnlocked));

  if (sanitizeInt(progress.totalSessionsCompleted) >= 1) s.add('first_session');
  if (sanitizeInt(progress.totalSessionsCompleted) >= 10) s.add('sessions_10');
  if (sanitizeInt(progress.currentStreak) >= 3) s.add('streak_3');

  if (sessionMeta?.sessionCompleted) {
    const rc = sanitizeInt(sessionMeta.roundsCompleted);
    const ca = sanitizeInt(sessionMeta.correctAnswers);
    const wa = sanitizeInt(sessionMeta.wrongAnswers);
    const acc = computeSessionAccuracyPercent(rc, ca, wa);
    if (acc >= 90) s.add('accuracy_master');
    if (wa === 0 && rc > 0) s.add('perfect_round');
  }

  const unlockedBadges = [...s].sort();
  const prevKey = normalizeUnlockedBadges(prevUnlocked).join('\0');
  const nextKey = unlockedBadges.join('\0');
  return { unlockedBadges, changed: prevKey !== nextKey };
}
