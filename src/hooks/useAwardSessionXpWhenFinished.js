import { useEffect } from 'react';
import { useProgress } from '../context/ProgressContext';

/**
 * When a full training session ends (`isFinished` true), awards +10 XP once per unique
 * `fingerprint` (see ProgressContext). Build fingerprints from a stable value set when
 * the session started, e.g. `numbers-${sessionStartMsRef.current}`.
 */
export function useAwardSessionXpWhenFinished(isFinished, fingerprint) {
  const { awardSessionXp } = useProgress();

  useEffect(() => {
    if (!isFinished || fingerprint == null || fingerprint === '') return;
    awardSessionXp(fingerprint);
  }, [isFinished, fingerprint, awardSessionXp]);
}
