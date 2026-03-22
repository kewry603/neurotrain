import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { BASE_SESSION_XP } from '../utils/progression';
import { applyDailyStreakOpen } from '../utils/streak';
import { computeBadgeUnlocks, normalizeUnlockedBadges } from '../utils/badges';
import { getLocalDateString } from '../utils/streak';
import { applySessionToDailyChallenge, normalizeDailyChallenge } from '../utils/dailyChallenge';
import { normalizeAchievementFlags } from '../utils/achievements';

const STORAGE_KEY = 'neurotrain-progress-v1';

const ProgressContext = createContext(null);

function sanitizeInt(n) {
  const x = Number(n);
  return Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0;
}

/** @param {number} correct @param {number} wrong */
function computeOverallAccuracy(correct, wrong) {
  const den = correct + wrong;
  if (den <= 0) return 0;
  return Math.round((correct / den) * 1000) / 10;
}

function normalizeProgress(data) {
  const totalXp =
    typeof data?.totalXp === 'number' && data.totalXp >= 0 && Number.isFinite(data.totalXp)
      ? data.totalXp
      : 0;
  const totalRoundsCompleted = sanitizeInt(data?.totalRoundsCompleted);
  const totalCorrectAnswers = sanitizeInt(data?.totalCorrectAnswers);
  const totalWrongAnswers = sanitizeInt(data?.totalWrongAnswers);
  const totalSessionsCompleted = sanitizeInt(data?.totalSessionsCompleted);
  const overallAccuracy = computeOverallAccuracy(totalCorrectAnswers, totalWrongAnswers);
  const lastActiveDate =
    typeof data?.lastActiveDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.lastActiveDate)
      ? data.lastActiveDate
      : null;
  const currentStreak = sanitizeInt(data?.currentStreak);
  const bestStreak = sanitizeInt(data?.bestStreak);
  const unlockedBadges = normalizeUnlockedBadges(data?.unlockedBadges);
  const today = getLocalDateString();
  const dailyChallenge = normalizeDailyChallenge(data?.dailyChallenge, today);
  const achievementFlags = normalizeAchievementFlags(data?.achievementFlags);
  return {
    totalXp,
    totalRoundsCompleted,
    totalCorrectAnswers,
    totalWrongAnswers,
    totalSessionsCompleted,
    overallAccuracy,
    lastActiveDate,
    currentStreak,
    bestStreak,
    unlockedBadges,
    dailyChallenge,
    achievementFlags,
  };
}

function getDefaultProgress() {
  return normalizeProgress({});
}

function readStoredProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    const data = JSON.parse(raw);
    return normalizeProgress(data);
  } catch {
    return getDefaultProgress();
  }
}

function writeStoredProgress(progress) {
  try {
    const {
      totalXp,
      totalRoundsCompleted,
      totalCorrectAnswers,
      totalWrongAnswers,
      totalSessionsCompleted,
      lastActiveDate,
      currentStreak,
      bestStreak,
    } = progress;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        totalXp,
        totalRoundsCompleted,
        totalCorrectAnswers,
        totalWrongAnswers,
        totalSessionsCompleted,
      lastActiveDate: lastActiveDate ?? null,
      currentStreak: sanitizeInt(currentStreak),
      bestStreak: sanitizeInt(bestStreak),
      unlockedBadges: normalizeUnlockedBadges(progress.unlockedBadges),
      dailyChallenge: progress.dailyChallenge ?? normalizeDailyChallenge(null, getLocalDateString()),
      achievementFlags: normalizeAchievementFlags(progress.achievementFlags),
      })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Awards dynamic XP for a finished training session (`xpAmount` from `computeSessionXpReward`).
 * `fingerprint` must be unique per completed session so we never double-award.
 *
 * `recordSessionResult` uses the same fingerprint pattern for stats deduplication.
 */
export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(getDefaultProgress);
  const [hydrated, setHydrated] = useState(false);
  const [streakCelebration, setStreakCelebration] = useState(false);
  const awardedFingerprintsRef = useRef(new Set());
  const statsFingerprintsRef = useRef(new Set());

  useEffect(() => {
    const base = readStoredProgress();
    const u = applyDailyStreakOpen(base);
    let merged = {
      ...base,
      lastActiveDate: u.lastActiveDate,
      currentStreak: u.currentStreak,
      bestStreak: Math.max(sanitizeInt(base.bestStreak), sanitizeInt(u.currentStreak)),
    };
    const br = computeBadgeUnlocks(merged.unlockedBadges ?? [], merged, null);
    merged = { ...merged, unlockedBadges: br.unlockedBadges };
    const streakChanged =
      merged.lastActiveDate !== base.lastActiveDate || merged.currentStreak !== base.currentStreak;
    if (streakChanged || br.changed) {
      writeStoredProgress(merged);
    }
    setProgress(merged);
    if (u.streakIncreased) setStreakCelebration(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!streakCelebration) return;
    const t = setTimeout(() => setStreakCelebration(false), 3600);
    return () => clearTimeout(t);
  }, [streakCelebration]);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredProgress(progress);
  }, [progress, hydrated]);

  const awardSessionXp = useCallback((fingerprint, xpAmount) => {
    if (fingerprint == null || fingerprint === '') return;
    if (awardedFingerprintsRef.current.has(fingerprint)) return;
    awardedFingerprintsRef.current.add(fingerprint);
    const add =
      typeof xpAmount === 'number' && Number.isFinite(xpAmount) && xpAmount >= 0
        ? Math.round(xpAmount)
        : BASE_SESSION_XP;
    setProgress((p) => ({ ...p, totalXp: p.totalXp + add }));
  }, []);

  const recordSessionResult = useCallback((payload) => {
    const {
      roundsCompleted = 0,
      correctAnswers = 0,
      wrongAnswers = 0,
      sessionCompleted = false,
      fingerprint,
      difficultyId: rawDifficulty,
    } = payload ?? {};
    const difficultyId =
      rawDifficulty != null && rawDifficulty !== ''
        ? String(rawDifficulty).toLowerCase()
        : '';
    if (fingerprint == null || fingerprint === '') return;
    if (statsFingerprintsRef.current.has(fingerprint)) return;
    statsFingerprintsRef.current.add(fingerprint);

    setProgress((prev) => {
      const totalCorrectAnswers = prev.totalCorrectAnswers + sanitizeInt(correctAnswers);
      const totalWrongAnswers = prev.totalWrongAnswers + sanitizeInt(wrongAnswers);
      const totalRoundsCompleted = prev.totalRoundsCompleted + sanitizeInt(roundsCompleted);
      const totalSessionsCompleted =
        prev.totalSessionsCompleted + (sessionCompleted ? 1 : 0);
      const overallAccuracy = computeOverallAccuracy(totalCorrectAnswers, totalWrongAnswers);
      let achievementFlags = { ...normalizeAchievementFlags(prev.achievementFlags) };
      if (sessionCompleted) {
        if (difficultyId === 'hard') achievementFlags.hardSessionComplete = true;
        if (difficultyId === 'expert') achievementFlags.expertSessionComplete = true;
      }
      const next = {
        ...prev,
        totalCorrectAnswers,
        totalWrongAnswers,
        totalRoundsCompleted,
        totalSessionsCompleted,
        overallAccuracy,
        achievementFlags,
      };
      const sessionMeta = {
        roundsCompleted,
        correctAnswers,
        wrongAnswers,
        sessionCompleted,
      };
      const br = computeBadgeUnlocks(prev.unlockedBadges ?? [], next, sessionMeta);
      const today = getLocalDateString();
      const dcPrev = normalizeDailyChallenge(prev.dailyChallenge, today);
      const { challenge: dcNext, xpBonus } = applySessionToDailyChallenge(dcPrev, sessionMeta);
      const totalXp = next.totalXp + xpBonus;
      return {
        ...next,
        totalXp,
        unlockedBadges: br.unlockedBadges,
        dailyChallenge: dcNext,
      };
    });
  }, []);

  const mergeAchievementFlags = useCallback((partial) => {
    setProgress((prev) => {
      const cur = normalizeAchievementFlags(prev.achievementFlags);
      const next = { ...cur };
      if (partial && typeof partial === 'object') {
        if (partial.wellnessArticleOpened) next.wellnessArticleOpened = true;
        if (partial.premiumEver) next.premiumEver = true;
        if (partial.hardSessionComplete) next.hardSessionComplete = true;
        if (partial.expertSessionComplete) next.expertSessionComplete = true;
      }
      return { ...prev, achievementFlags: next };
    });
  }, []);

  const value = {
    ...progress,
    hydrated,
    streakCelebration,
    awardSessionXp,
    recordSessionResult,
    mergeAchievementFlags,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
