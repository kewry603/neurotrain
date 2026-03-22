import { createContext, useContext, useMemo, useState, useCallback } from 'react';

/**
 * Premium state for NeuroTrain (no payment integration yet).
 * `isPremium` gates Hard difficulty across games — see `PremiumHardGateModal` and per-screen checks.
 */
const STORAGE_KEY = 'neurotrain_premium';

const PremiumContext = createContext(null);

/** @returns {boolean} */
function readStoredPremium() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === '') return false;
    const parsed = JSON.parse(raw);
    return parsed === true;
  } catch {
    return false;
  }
}

/** @param {boolean} value */
function writeStoredPremium(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(!!value));
  } catch {
    /* quota / private mode */
  }
}

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremiumState] = useState(() => readStoredPremium());

  const setPremium = useCallback((value) => {
    const next = !!value;
    setIsPremiumState(next);
    writeStoredPremium(next);
  }, []);

  const value = useMemo(
    () => ({
      isPremium,
      setPremium,
    }),
    [isPremium, setPremium]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return ctx;
}
