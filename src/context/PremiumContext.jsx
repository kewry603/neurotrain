import { createContext, useContext, useMemo, useState, useCallback } from 'react';

/**
 * Premium state for NeuroTrain (no payment integration yet).
 * `isPremium` gates Hard difficulty across games — see `PremiumHardGateModal` and per-screen checks.
 */
const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremiumState] = useState(false);

  const setPremium = useCallback((value) => {
    setIsPremiumState(!!value);
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
