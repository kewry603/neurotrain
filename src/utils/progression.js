/**
 * Global XP / level rules for NeuroTrain.
 *
 * Level curve: every 20 total XP you gain one player level.
 *   - 0–19 XP   → Level 1
 *   - 20–39 XP  → Level 2
 *   - 40–59 XP  → Level 3
 *   (level = floor(totalXp / 20) + 1)
 */

export const XP_PER_LEVEL = 20;
export const SESSION_XP_REWARD = 10;

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
