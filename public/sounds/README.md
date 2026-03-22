# Sound files (MP3)

Place these files in **this folder** so they load as `/sounds/…` in the app:

| File | Used for |
|------|----------|
| `start.mp3` | Start training / session start |
| `tap.mp3` | Taps (cards, keys, cells, etc.) |
| `match.mp3` | Correct answer / pair (soft success) |
| `wrong.mp3` | Wrong answer / mismatch (soft error) |
| `round-complete.mp3` | Round finished (mid-session) |
| `round-complete.mp3` | Session finished — same asset, slightly higher gain via `sessionComplete` cue |
| `level-up.mp3` | Level up (Memory Matrix) |

If a file is missing, **NeuroTrain** plays a short **synthetic beep** instead so you still get audio feedback.

## Sound on/off

Mute state is stored in **`localStorage`** under key **`neurotrain-sound-muted`** (`1` = muted, `0` or absent = sound on). The speaker button in the header toggles this.
