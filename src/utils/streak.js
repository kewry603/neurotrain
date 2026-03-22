/**
 * Daily streak helpers — local calendar days (user's timezone).
 */

/** @param {Date} [d] */
export function getLocalDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Whole calendar days between two YYYY-MM-DD strings (a → b). Uses noon local to avoid DST edges.
 * @param {string} dateA
 * @param {string} dateB
 */
export function calendarDaysBetween(dateA, dateB) {
  if (!dateA || !dateB) return NaN;
  const t0 = new Date(`${dateA}T12:00:00`);
  const t1 = new Date(`${dateB}T12:00:00`);
  if (Number.isNaN(t0.getTime()) || Number.isNaN(t1.getTime())) return NaN;
  return Math.round((t1 - t0) / (24 * 60 * 60 * 1000));
}

function sanitizeStreak(n) {
  const x = Number(n);
  return Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0;
}

/**
 * @param {{ lastActiveDate?: string | null, currentStreak?: number }} input
 * @returns {{ lastActiveDate: string, currentStreak: number, streakIncreased: boolean }}
 */
export function applyDailyStreakOpen(input) {
  const today = getLocalDateString();
  const last = input.lastActiveDate && /^\d{4}-\d{2}-\d{2}$/.test(input.lastActiveDate)
    ? input.lastActiveDate
    : null;
  const prev = sanitizeStreak(input.currentStreak);

  if (last === today) {
    return {
      lastActiveDate: today,
      currentStreak: prev > 0 ? prev : 1,
      streakIncreased: false,
    };
  }

  if (!last) {
    return {
      lastActiveDate: today,
      currentStreak: 1,
      streakIncreased: true,
    };
  }

  const gap = calendarDaysBetween(last, today);
  if (gap === 1) {
    return {
      lastActiveDate: today,
      currentStreak: prev + 1,
      streakIncreased: true,
    };
  }

  if (gap > 1) {
    return {
      lastActiveDate: today,
      currentStreak: 1,
      streakIncreased: false,
    };
  }

  // gap <= 0 (clock skew / same day): keep streak, anchor to today
  return {
    lastActiveDate: today,
    currentStreak: Math.max(prev, 1),
    streakIncreased: false,
  };
}
