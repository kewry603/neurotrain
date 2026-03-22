/**
 * Global XP / level rules for NeuroTrain.
 *
 * Level curve: every 20 total XP you gain one player level.
 *   - 0–19 XP   → Level 1
 *   - 20–39 XP  → Level 2
 *   - 40–59 XP  → Level 3
 *   (level = floor(totalXp / 20) + 1)
 *
 * Session XP (performance-based):
 *   Base 5 + accuracy band + difficulty + optional perfect bonus.
 */

export const XP_PER_LEVEL = 20;

/** Minimum XP for completing a reported session (before bonuses). */
export const BASE_SESSION_XP = 5;

/** +2 when the session had no wrong answers (see `computeSessionXpReward`). */
export const PERFECT_SESSION_BONUS = 2;

/** @param {number} accuracyPercent 0–100 */
export function getAccuracyBonusXp(accuracyPercent) {
  const a = Math.max(0, Math.min(100, Number(accuracyPercent) || 0));
  if (a >= 90) return 5;
  if (a >= 75) return 3;
  if (a >= 60) return 1;
  return 0;
}

/** @param {string} difficultyId `'easy' | 'medium' | 'hard' | 'expert'` */
export function getDifficultyBonusXp(difficultyId) {
  const id = String(difficultyId ?? 'easy').toLowerCase();
  if (id === 'expert') return 6;
  if (id === 'hard') return 4;
  if (id === 'medium') return 2;
  return 0;
}

/**
 * Session accuracy from correct vs wrong counts (same formula as global stats).
 * @returns {number} 0–100 with one decimal
 */
export function computeSessionAccuracyPercent(roundsCompleted, correctAnswers, wrongAnswers) {
  const c = Math.max(0, Number(correctAnswers) || 0);
  const w = Math.max(0, Number(wrongAnswers) || 0);
  const denom = c + w;
  if (denom <= 0) return 0;
  return Math.min(100, Math.round((c / denom) * 1000) / 10);
}

/**
 * Total XP for one finished session (before duplicate-fingerprint guard).
 * @param {{ accuracyPercent: number, difficultyId?: string, isPerfect: boolean }} opts
 */
export function computeSessionXpReward({ accuracyPercent, difficultyId = 'easy', isPerfect = false }) {
  let xp = BASE_SESSION_XP;
  xp += getAccuracyBonusXp(accuracyPercent);
  xp += getDifficultyBonusXp(difficultyId);
  if (isPerfect) xp += PERFECT_SESSION_BONUS;
  return Math.max(0, Math.round(xp));
}

/** Player level (starts at 1 at 0 XP). */
export function getLevelFromTotalXp(totalXp) {
  const safe = Math.max(0, Math.floor(Number(totalXp) || 0));
  return Math.floor(safe / XP_PER_LEVEL) + 1;
}

/** XP accumulated within the current level band (0 … XP_PER_LEVEL-1). */
export function getXpIntoCurrentLevel(totalXp) {
  const safe = Math.max(0, Math.floor(Number(totalXp) || 0));
  return safe % XP_PER_LEVEL;
}

/**
 * How many more XP until the next level threshold.
 * At exactly 0 XP → need 20 to reach level 2.
 * At 20 XP (start of level 2) → need 20 more to reach level 3.
 */
export function getXpToNextLevel(totalXp) {
  const safe = Math.max(0, Math.floor(Number(totalXp) || 0));
  const into = safe % XP_PER_LEVEL;
  if (into === 0 && safe > 0) return XP_PER_LEVEL;
  return XP_PER_LEVEL - into;
}

/** 0–100 for a circular bar within the current level. */
export function getLevelProgressPercent(totalXp) {
  return (getXpIntoCurrentLevel(totalXp) / XP_PER_LEVEL) * 100;
}
