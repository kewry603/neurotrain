import { useEffect } from 'react';
import { useProgress } from '../context/ProgressContext';
import {
  computeSessionAccuracyPercent,
  computeSessionXpReward,
} from '../utils/progression';

/**
 * When a training session ends (`isFinished`), awards performance-based XP and records global stats once per `fingerprint`.
 * `difficultyId`: `'easy' | 'medium' | 'hard'` for difficulty bonus.
 */
export function useFinishSessionProgress(
  isFinished,
  fingerprint,
  roundsCompleted,
  correctAnswers,
  wrongAnswers,
  sessionCompleted = true,
  difficultyId = 'easy'
) {
  const { awardSessionXp, recordSessionResult } = useProgress();

  useEffect(() => {
    if (!isFinished || fingerprint == null || fingerprint === '') return;

    const accuracyPercent = computeSessionAccuracyPercent(
      roundsCompleted,
      correctAnswers,
      wrongAnswers
    );
    const isPerfect =
      Boolean(sessionCompleted) &&
      roundsCompleted > 0 &&
      wrongAnswers === 0;

    const xp = computeSessionXpReward({
      accuracyPercent,
      difficultyId: difficultyId ?? 'easy',
      isPerfect,
    });

    awardSessionXp(fingerprint, xp);
    recordSessionResult({
      fingerprint,
      roundsCompleted,
      correctAnswers,
      wrongAnswers,
      sessionCompleted,
    });
  }, [
    isFinished,
    fingerprint,
    roundsCompleted,
    correctAnswers,
    wrongAnswers,
    sessionCompleted,
    difficultyId,
    awardSessionXp,
    recordSessionResult,
  ]);
}
