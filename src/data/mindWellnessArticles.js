/**
 * Mind & Wellness articles — ids map to i18n keys under `wellness.articles.<id>`.
 * @typedef {{ id: string, category: 'memory'|'focus'|'mental'|'habits', premium: boolean }} MindWellnessArticle
 */

/** @type {const} */
export const MIND_WELLNESS_CATEGORY_ORDER = ['memory', 'focus', 'mental', 'habits'];

/** @type {readonly MindWellnessArticle[]} */
export const MIND_WELLNESS_ARTICLES = [
  { id: 'memory_sleep', category: 'memory', premium: false },
  { id: 'memory_chunk', category: 'memory', premium: true },
  { id: 'focus_pomodoro', category: 'focus', premium: false },
  { id: 'focus_distraction', category: 'focus', premium: true },
  { id: 'mental_stress', category: 'mental', premium: false },
  { id: 'mental_gratitude', category: 'mental', premium: true },
  { id: 'habits_morning', category: 'habits', premium: false },
  { id: 'habits_consistency', category: 'habits', premium: true },
];
