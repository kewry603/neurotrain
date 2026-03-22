// ─── NeuroTrain Sound Manager ─────────────────────────────────────────────────
//
// MP3 files live in public/sounds/ → served from the app root, e.g. /sounds/tap.mp3
// Uses import.meta.env.BASE_URL so subpath deploys (Vite `base`) still resolve correctly.
//
// **Preload:** one `HTMLAudioElement` per cue is created at startup and reused so
// `play()` runs immediately after the first decode (no per-tap `new Audio()` delay).
// **Mute** is persisted in `localStorage` (`neurotrain-sound-muted`).
// **Haptics:** short `navigator.vibrate` patterns on correct/incorrect when sound is on.

const STORAGE_MUTED = 'neurotrain-sound-muted';

const SOUNDS = {
  start:           'sounds/start.mp3',
  tap:             'sounds/tap.mp3',
  match:           'sounds/match.mp3',
  wrong:           'sounds/wrong.mp3',
  roundComplete:   'sounds/round-complete.mp3',
  /** Same asset as round-complete; slightly louder “reward” for finishing a session. */
  sessionComplete: 'sounds/round-complete.mp3',
  levelUp:         'sounds/level-up.mp3',
};

/**
 * Per-cue loudness (0–1). Tuned for a calm mix: UI taps low; feedback moderate;
 * milestones slightly louder.
 */
const VOLUMES = {
  start:           0.4,
  tap:             0.2,
  match:           0.38,
  wrong:             0.28,
  roundComplete:   0.48,
  sessionComplete: 0.56,
  levelUp:         0.6,
};

/** Prevent tap spam from stacking too many overlapping clicks. */
const TAP_MIN_INTERVAL_MS = 70;
let lastTapPlayTime = 0;

function readMutedFromStorage() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_MUTED) === '1';
  } catch {
    return false;
  }
}

let _muted = readMutedFromStorage();

/** @param {boolean} next */
export function setMuted(next) {
  _muted = Boolean(next);
  try {
    localStorage.setItem(STORAGE_MUTED, _muted ? '1' : '0');
  } catch {
    /* private mode */
  }
  return _muted;
}

export function toggleMute() {
  return setMuted(!_muted);
}

export function isMuted() {
  return _muted;
}

let _ctx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    _ctx = new AC();
  }
  return _ctx;
}

/** Full URL for a file under public/ (works with Vite base). */
function resolvePublicSoundUrl(relativePath) {
  const base = import.meta.env.BASE_URL || '/';
  try {
    return new URL(relativePath, window.location.origin + base).href;
  } catch {
    const prefix = base.endsWith('/') ? base : `${base}/`;
    const path = relativePath.replace(/^\//, '');
    return `${prefix}${path}`.replace(/([^:]\/)\/+/g, '$1');
  }
}

const failedLoads = new Set();
/** @type {Record<string, HTMLAudioElement | undefined>} */
const preloaded = {};

function createAndPreload(name) {
  const rel = SOUNDS[name];
  if (!rel) return null;
  const audio = new Audio();
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  const src = resolvePublicSoundUrl(rel);
  audio.src = src;
  audio.addEventListener(
    'error',
    () => {
      failedLoads.add(name);
    },
    { once: true }
  );
  audio.load();
  return audio;
}

function ensureAllPreloaded() {
  if (typeof window === 'undefined') return;
  for (const name of Object.keys(SOUNDS)) {
    if (!preloaded[name]) {
      preloaded[name] = createAndPreload(name);
    }
  }
}

// Start loading as soon as the bundle runs in the browser.
ensureAllPreloaded();

/**
 * Idempotent: safe to call from App on mount to catch late hydration.
 */
export function preloadSounds() {
  ensureAllPreloaded();
}

function playSyntheticFallback(name) {
  if (_muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const profiles = {
    start:           { freq: 520, dur: 0.12, type: 'sine' },
    tap:             { freq: 880, dur: 0.06, type: 'sine' },
    match:           { freq: 660, dur: 0.14, type: 'sine' },
    wrong:           { freq: 180, dur: 0.1,  type: 'triangle' },
    roundComplete:   { freq: 440, dur: 0.18, type: 'sine' },
    sessionComplete: { freq: 520, dur: 0.22, type: 'sine' },
    levelUp:         { freq: 740, dur: 0.2,  type: 'sine' },
  };
  const p = profiles[name] || profiles.tap;

  osc.type = p.type;
  osc.frequency.setValueAtTime(p.freq, now);

  const peak = (VOLUMES[name] ?? 0.4) * 0.35;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.02), now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur);

  osc.start(now);
  osc.stop(now + p.dur + 0.02);
}

/**
 * Light haptics when the device supports it; tied to sound being enabled so
 * “mute” is one clear off switch.
 */
function vibrateForCue(name) {
  if (_muted) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    if (name === 'match') {
      navigator.vibrate(12);
    } else if (name === 'wrong') {
      navigator.vibrate([30, 40, 35]);
    }
  } catch {
    /* ignore */
  }
}

function playFromPreloaded(name) {
  const audio = preloaded[name];
  if (!audio || failedLoads.has(name)) return false;
  if (audio.error) return false;

  const tryPlay = () => {
    try {
      audio.volume = VOLUMES[name] ?? 0.5;
      audio.currentTime = 0;
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {
          playSyntheticFallback(name);
        });
      }
      return true;
    } catch {
      return false;
    }
  };

  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return tryPlay();
  }

  const once = () => {
    audio.removeEventListener('canplay', once);
    tryPlay();
  };
  audio.addEventListener('canplay', once, { once: true });
  return true;
}

/**
 * Play a named sound (preloaded MP3; synthetic only on real failure).
 * @param {'start'|'tap'|'match'|'wrong'|'roundComplete'|'sessionComplete'|'levelUp'} name
 */
export function playSound(name) {
  if (_muted) return;

  const rel = SOUNDS[name];
  if (!rel) {
    console.warn(`[NeuroTrain sound] Unknown sound name: "${name}"`);
    return;
  }

  if (name === 'match' || name === 'wrong') {
    vibrateForCue(name);
  }

  if (name === 'tap') {
    const t = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (t - lastTapPlayTime < TAP_MIN_INTERVAL_MS) return;
    lastTapPlayTime = t;
  }

  if (playFromPreloaded(name)) {
    return;
  }

  if (failedLoads.has(name)) {
    playSyntheticFallback(name);
    return;
  }

  // Rare: element not ready yet — one-shot load + play (legacy path)
  let fallbackUsed = false;
  const tryFallback = (reason) => {
    if (fallbackUsed) return;
    fallbackUsed = true;
    console.warn(`[NeuroTrain sound] ${reason} — synthetic beep for "${name}"`);
    playSyntheticFallback(name);
  };

  try {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = VOLUMES[name] ?? 0.5;
    audio.setAttribute('playsinline', '');
    const src = resolvePublicSoundUrl(rel);
    let playStarted = false;

    const attemptPlay = () => {
      if (playStarted || fallbackUsed) return;
      playStarted = true;
      const p = audio.play();
      if (p !== undefined) {
        p.catch((err) => {
          tryFallback(`play() rejected for "${name}": ${err?.message || err}`);
        });
      }
    };

    audio.addEventListener(
      'error',
      () => {
        const err = audio.error;
        if (err) {
          tryFallback(`Media error ${err.code} (${err.message || 'unknown'}) for ${src}`);
        }
      },
      { once: true }
    );

    audio.addEventListener('canplay', attemptPlay, { once: true });
    audio.src = src;
    audio.load();
    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      attemptPlay();
    }
  } catch (err) {
    tryFallback(`Error setting up audio for "${name}": ${err?.message || err}`);
  }
}
