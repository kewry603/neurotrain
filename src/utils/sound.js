// ─── NeuroTrain Sound Manager ─────────────────────────────────────────────────
//
// MP3 files live in public/sounds/ → served from the app root, e.g. /sounds/tap.mp3
// Uses import.meta.env.BASE_URL so subpath deploys (Vite `base`) still resolve correctly.
//
// Playback waits until the file can play (canplay) so decode/network finish first;
// calling play() on a not-yet-ready Audio element often fails (promise rejection) even
// when the file exists — that was masking real MP3 playback.

const SOUNDS = {
  start:         'sounds/start.mp3',
  tap:           'sounds/tap.mp3',
  match:         'sounds/match.mp3',
  wrong:         'sounds/wrong.mp3',
  roundComplete: 'sounds/round-complete.mp3',
  levelUp:       'sounds/level-up.mp3',
};

/**
 * Per-cue loudness (0–1). Tuned for a calm, non-aggressive mix suitable for adults 40+:
 * frequent UI taps stay low; feedback (match/wrong) moderate; milestone cues slightly
 * louder so they read without shouting.
 *
 * How it’s applied:
 * - **MP3 playback:** `audio.volume = VOLUMES[name]` on each `HTMLAudioElement` before
 *   `play()` (browser linear gain 0 = silent, 1 = full decoded signal).
 * - **Synthetic fallback** (if a file fails): the Web Audio `GainNode` peak is
 *   `(VOLUMES[name] ?? 0.5) * 0.35`, so beeps stay softer than MP3s at the same number.
 */
const VOLUMES = {
  start:         0.4,
  tap:           0.2,
  match:         0.4,
  wrong:         0.3,
  roundComplete: 0.5,
  levelUp:       0.6,
};

let _muted = false;

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
    start:         { freq: 520, dur: 0.12, type: 'sine' },
    tap:           { freq: 880, dur: 0.06, type: 'sine' },
    match:         { freq: 660, dur: 0.14, type: 'sine' },
    wrong:         { freq: 180, dur: 0.1,  type: 'triangle' },
    roundComplete: { freq: 440, dur: 0.18, type: 'sine' },
    levelUp:       { freq: 740, dur: 0.2,  type: 'sine' },
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
 * Play a named sound (MP3 when load succeeds; synthetic only on real failure).
 * @param {'start'|'tap'|'match'|'wrong'|'roundComplete'|'levelUp'} name
 */
export function playSound(name) {
  if (_muted) return;

  const rel = SOUNDS[name];
  if (!rel) {
    console.warn(`[NeuroTrain sound] Unknown sound name: "${name}"`);
    return;
  }

  const src = resolvePublicSoundUrl(rel);
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
          tryFallback(
            `Media error ${err.code} (${err.message || 'unknown'}) for ${src}`
          );
        }
      },
      { once: true }
    );

    audio.addEventListener(
      'canplay',
      () => {
        attemptPlay();
      },
      { once: true }
    );

    audio.src = src;
    audio.load();

    // Cached / very small files may already be ready before `canplay` fires
    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      attemptPlay();
    }
  } catch (err) {
    tryFallback(`Error setting up audio for "${name}": ${err?.message || err}`);
  }
}

export function toggleMute() {
  _muted = !_muted;
  return _muted;
}

export function isMuted() {
  return _muted;
}
