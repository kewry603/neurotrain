import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SESSION_XP_REWARD } from '../utils/progression';

const STORAGE_KEY = 'neurotrain-progress-v1';

const ProgressContext = createContext(null);

function readStoredTotalXp() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const n = data?.totalXp;
    return typeof n === 'number' && n >= 0 && Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeStoredTotalXp(totalXp) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ totalXp }));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Awards +SESSION_XP_REWARD XP for a finished training session.
 * `fingerprint` must be unique per completed session (e.g. "numbers-3") so we never
 * double-award if React re-runs effects (Strict Mode) or the UI re-renders on FINISHED.
 */
export function ProgressProvider({ children }) {
  const [totalXp, setTotalXp] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const awardedFingerprintsRef = useRef(new Set());

  useEffect(() => {
    setTotalXp(readStoredTotalXp());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredTotalXp(totalXp);
  }, [totalXp, hydrated]);

  const awardSessionXp = useCallback((fingerprint) => {
    if (fingerprint == null || fingerprint === '') return;
    if (awardedFingerprintsRef.current.has(fingerprint)) return;
    awardedFingerprintsRef.current.add(fingerprint);
    setTotalXp((x) => x + SESSION_XP_REWARD);
  }, []);

  const value = { totalXp, awardSessionXp, hydrated };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
