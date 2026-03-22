import { normalizeUnlockedBadges } from './badges';

/** @type {readonly string[]} */
export const ACHIEVEMENT_IDS = [
  'ach_first_session',
  'ach_streak_3',
  'ach_streak_7',
  'ach_games_10',
  'ach_first_hard',
  'ach_first_expert',
  'ach_premium',
  'ach_wellness_read',
  'ach_accuracy_ace',
  'ach_perfect_session',
  'ach_daily_challenge',
  'ach_xp_100',
];

/** Optional emoji shown on the Achievements screen (i18n holds copy). */
export const ACHIEVEMENT_EMOJI = {
  ach_first_session: '🎯',
  ach_streak_3: '🔥',
  ach_streak_7: '⚡',
  ach_games_10: '🎮',
  ach_first_hard: '💪',
  ach_first_expert: '🏆',
  ach_premium: '⭐',
  ach_wellness_read: '📖',
  ach_accuracy_ace: '🎖️',
  ach_perfect_session: '✨',
  ach_daily_challenge: '📅',
  ach_xp_100: '💯',
};

function sanitizeInt(n) {
  const x = Number(n);
  return Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0;
}

/**
 * Persisted flags for events not fully modeled by aggregate stats.
 * @param {unknown} raw
 */
export function normalizeAchievementFlags(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      hardSessionComplete: false,
      expertSessionComplete: false,
      wellnessArticleOpened: false,
      premiumEver: false,
    };
  }
  return {
    hardSessionComplete: Boolean(raw.hardSessionComplete),
    expertSessionComplete: Boolean(raw.expertSessionComplete),
    wellnessArticleOpened: Boolean(raw.wellnessArticleOpened),
    premiumEver: Boolean(raw.premiumEver),
  };
}

/**
 * Which achievement ids are unlocked for the current progress snapshot.
 * @param {object} progress — normalized progress from ProgressContext
 * @param {boolean} isPremium
 * @returns {Set<string>}
 */
export function computeUnlockedAchievementIds(progress, isPremium) {
  const flags = normalizeAchievementFlags(progress?.achievementFlags);
  const unlocked = new Set();

  if (sanitizeInt(progress?.totalSessionsCompleted) >= 1) unlocked.add('ach_first_session');
  if (sanitizeInt(progress?.currentStreak) >= 3) unlocked.add('ach_streak_3');
  if (
    Math.max(sanitizeInt(progress?.currentStreak), sanitizeInt(progress?.bestStreak)) >= 7
  ) {
    unlocked.add('ach_streak_7');
  }
  if (sanitizeInt(progress?.totalSessionsCompleted) >= 10) unlocked.add('ach_games_10');
  if (flags.hardSessionComplete) unlocked.add('ach_first_hard');
  if (flags.expertSessionComplete) unlocked.add('ach_first_expert');
  if (isPremium || flags.premiumEver) unlocked.add('ach_premium');
  if (flags.wellnessArticleOpened) unlocked.add('ach_wellness_read');

  const ub = normalizeUnlockedBadges(progress?.unlockedBadges);
  if (ub.includes('accuracy_master')) unlocked.add('ach_accuracy_ace');
  if (ub.includes('perfect_round')) unlocked.add('ach_perfect_session');

  const dc = progress?.dailyChallenge;
  if (dc && typeof dc === 'object' && dc.completed) unlocked.add('ach_daily_challenge');

  if (sanitizeInt(progress?.totalXp) >= 100) unlocked.add('ach_xp_100');

  return unlocked;
}

/**
 * @param {object} progress
 * @param {boolean} isPremium
 */
export function countUnlockedAchievements(progress, isPremium) {
  const s = computeUnlockedAchievementIds(progress, isPremium);
  return ACHIEVEMENT_IDS.filter((id) => s.has(id)).length;
}
