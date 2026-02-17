# Cut the Wire — Escape Room Task Design

**Date:** 2026-02-17
**Status:** Approved

## Overview

An interactive "cut the correct wire" puzzle for a physical escape room. Runs as a fullscreen web app on a dedicated tablet/screen. Players see a black screen, tap to start, then must identify and cut the correct wire before a countdown timer expires.

## Game Flow

```
[IDLE: Black Screen] → tap → [ACTIVE: Alarm + Timer + Wires] → cut wire → [WIN | PENALTY | LOSE]
```

### States

1. **Idle** — Black screen with pulsing "CLICK TO START" text. Fullscreen.
2. **Active** — Alarm blares, countdown timer starts, wires displayed. Player cuts wires.
3. **Penalty** — Wrong wire: screen flash red, timer drops by configurable penalty, wire fizzles. Player continues.
4. **Win** — Correct wire: alarm stops, "defused" animation, green success screen.
5. **Lose** — Timer hits 0:00: explosion animation (shake, flash, static), red failure screen.

## Visual Design

- **Theme:** Bomb defusal / military tech
- **Palette:** Dark background (#0a0a0a), red alarm accents, neon wire colors, glowing effects
- **Typography:** Monospace/military (Share Tech Mono, Google Fonts)
- **Timer:** Large LED-style countdown, turns red and pulses under 30s
- **Wires:** Canvas-drawn colored cables with slight curves, connecting terminal blocks. Glow on hover. Cutting cursor on hover.
- **Background:** Dark metal panel (CSS gradient), subtle scanline overlay

## Animations (Canvas + CSS)

- Wire idle: gentle sway, electrical glow pulse
- Wire cut (wrong): snap with spark particles, red flash, screen shake
- Wire cut (correct): clean snip, sparks, remaining wires power down, alarm stops
- Explosion (lose): white flash, shake, static/noise, fail message
- Timer warning: red pulse, alarm pitch increase under 30s

## Audio (Web Audio API)

- Alarm: looping siren
- Wire snip: metallic snap
- Wrong wire: electrical zap
- Explosion: deep boom
- Success: power-down hum

Royalty-free sound effects stored in `assets/audio/`.

## Configuration

Operator edits `js/config.js`:

```js
const CONFIG = {
  timerSeconds: 120,
  penaltySeconds: 30,
  wireCount: 5,
  correctWire: 3,
  wireColors: ['red', 'blue', 'green', 'yellow', 'white'],
};
```

## Technical Approach

- **Vanilla HTML/CSS/JS** — no build tools, no framework
- **Canvas** for wire rendering and particle effects
- **CSS** for UI overlays, timer, screen effects
- **Web Audio API** for sound
- Single `index.html` entry point, modular JS files
- Fullscreen API for immersive experience on dedicated tablet

## File Structure

```
escape-room-oldham/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   ├── game.js
│   ├── renderer.js
│   └── audio.js
├── assets/
│   └── audio/
└── docs/
    └── plans/
```

## Future Considerations

- Swap Canvas animations for Rive (.riv) assets when available
- Add more escape room tasks as separate pages/modules
- Potential migration to Vite for multi-task architecture
