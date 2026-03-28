# React Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the escape room prop app from vanilla JS to Vite + React + TypeScript, fixing wire state reset on resize, hit detection issues, and text overlap on small screens.

**Architecture:** Vite SPA with React components per screen. Game state lives in React (useState), canvas rendering and audio stay as imperative classes wrapped via hooks/refs. No router, no global state library.

**Tech Stack:** Vite, React 18, TypeScript, CSS (split per component)

---

## File Map

### New Files (Create)

| File | Responsibility |
|------|---------------|
| `src/main.tsx` | React entry point, renders `<App>` |
| `src/App.tsx` | Screen switcher, activeScreen state, overlays |
| `src/config.ts` | CONFIG object (same values as current `js/config.js`) |
| `src/lib/AudioManager.ts` | Audio class (ported from `js/audio.js` with types) |
| `src/lib/WireRenderer.ts` | Canvas renderer (ported from `js/renderer.js` with bug fixes) |
| `src/hooks/useTimer.ts` | Countdown timer hook (seconds-based) |
| `src/hooks/useAudio.ts` | AudioManager singleton hook |
| `src/hooks/useCountdown.ts` | Millisecond-precision countdown hook (for countdown activity) |
| `src/components/MenuScreen.tsx` | Activity selection menu |
| `src/components/IdleScreen.tsx` | "Click to initiate" screen |
| `src/components/WireDefusalGame.tsx` | Wrapper: owns timer + cutWires, switches wire/code phases |
| `src/components/WireDefusalScreen.tsx` | Wire cutting UI with canvas |
| `src/components/WireCanvas.tsx` | Canvas element + WireRenderer integration |
| `src/components/CodeEntryScreen.tsx` | Keypad code entry UI |
| `src/components/CountdownScreen.tsx` | Standalone countdown timer activity |
| `src/components/WinScreen.tsx` | Success result screen |
| `src/components/LoseScreen.tsx` | Failure result screen |
| `src/styles/global.css` | Reset, container, scanlines, flash, shake, responsive base |
| `src/styles/menu.css` | Menu screen styles |
| `src/styles/wire-defusal.css` | Wire defusal + timer display styles |
| `src/styles/code-entry.css` | Code entry screen styles |
| `src/styles/countdown.css` | Countdown timer activity styles |
| `src/styles/results.css` | Win/lose screen styles |
| `vite.config.ts` | Vite configuration |
| `tsconfig.json` | TypeScript configuration |

### Modified Files

| File | Change |
|------|--------|
| `index.html` | Replace contents with Vite entry point (single `<div id="root">` + script tag) |
| `package.json` | Created by `npm init` during scaffold |

### Files Removed After Migration

The old `js/` and `css/` directories will be deleted in the final task after verifying the React app works.

---

## Task 1: Scaffold Vite + React + TypeScript Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`
- Modify: `index.html`

- [ ] **Step 1: Initialize Vite project**

Run from the project root. We initialize manually rather than using `create-vite` to avoid overwriting existing files:

```bash
npm init -y
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
});
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Replace index.html with Vite entry point**

Replace the entire contents of `index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#000000">
  <title>ESCAPE ROOM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 5: Create src/main.tsx**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 6: Create src/App.tsx (placeholder)**

```typescript
export default function App() {
  return <div id="game-container">Hello Escape Room</div>;
}
```

- [ ] **Step 7: Create src/styles/global.css (minimal for now)**

```css
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  font-family: 'Share Tech Mono', monospace;
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

#game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background:
    radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #0a0a0a 70%),
    linear-gradient(180deg, #0d0d1a 0%, #0a0a0a 100%);
  overflow: hidden;
  color: white;
}
```

- [ ] **Step 8: Add scripts to package.json**

Add to the `"scripts"` section:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 9: Add node_modules and dist to .gitignore**

Create or append to `.gitignore`:

```
node_modules/
dist/
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts, browser shows "Hello Escape Room" with dark background at `http://localhost:5173`.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json .gitignore index.html src/main.tsx src/App.tsx src/styles/global.css
git commit -m "feat: scaffold Vite + React + TypeScript project"
```

---

## Task 2: Config and Audio/Timer Hooks

**Files:**
- Create: `src/config.ts`, `src/lib/AudioManager.ts`, `src/hooks/useAudio.ts`, `src/hooks/useTimer.ts`

- [ ] **Step 1: Create src/config.ts**

```typescript
export const CONFIG = {
  timerSeconds: 480,
  penaltySeconds: 20,
  codePenaltySeconds: 10,
  correctCode: '1977',
  wireCount: 5,
  correctWire: 3,
  wireColors: ['#ff3333', '#3388ff', '#33ff88', '#ffdd33', '#ffffff'],
  wireLabels: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'WHITE'],
  countdownSeconds: 90,
} as const;
```

- [ ] **Step 2: Create src/lib/AudioManager.ts**

Port the existing `js/audio.js` class with TypeScript types. The logic is identical — only types are added:

```typescript
export class AudioManager {
  private ctx: AudioContext | null = null;
  private alarmOscillators: OscillatorNode[] = [];
  private alarmGain: GainNode | null = null;
  private isAlarmPlaying = false;
  private _alarmInterval: ReturnType<typeof setInterval> | null = null;

  private ensureContext(): void {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startAlarm(): void {
    this.ensureContext();
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    this.alarmGain = this.ctx!.createGain();
    this.alarmGain.gain.value = 0.3;
    this.alarmGain.connect(this.ctx!.destination);

    const osc1 = this.ctx!.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 440;
    osc1.connect(this.alarmGain);
    osc1.start();

    const osc2 = this.ctx!.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 523.25;
    osc2.connect(this.alarmGain);
    osc2.start();

    this.alarmOscillators = [osc1, osc2];

    this._alarmInterval = setInterval(() => {
      const now = this.ctx!.currentTime;
      osc1.frequency.linearRampToValueAtTime(660, now + 0.5);
      osc2.frequency.linearRampToValueAtTime(784, now + 0.5);
      setTimeout(() => {
        if (!this.isAlarmPlaying) return;
        const now2 = this.ctx!.currentTime;
        osc1.frequency.linearRampToValueAtTime(440, now2 + 0.5);
        osc2.frequency.linearRampToValueAtTime(523.25, now2 + 0.5);
      }, 500);
    }, 1000);
  }

  stopAlarm(): void {
    this.isAlarmPlaying = false;
    if (this._alarmInterval) clearInterval(this._alarmInterval);
    this.alarmOscillators.forEach(osc => {
      try { osc.stop(); } catch (_) {}
    });
    this.alarmOscillators = [];
    if (this.alarmGain) {
      this.alarmGain.disconnect();
      this.alarmGain = null;
    }
  }

  playSnip(): void {
    this.ensureContext();
    const duration = 0.08;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'square';
    osc.frequency.value = 2000;
    gain.gain.setValueAtTime(0.4, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + duration);
  }

  playZap(): void {
    this.ensureContext();
    const duration = 0.3;
    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + duration);
    gain.connect(this.ctx!.destination);

    for (let i = 0; i < 5; i++) {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 100 + Math.random() * 300;
      osc.connect(gain);
      osc.start();
      osc.stop(this.ctx!.currentTime + duration);
    }
  }

  playExplosion(): void {
    this.ensureContext();
    const duration = 1.5;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx!.currentTime + duration);
    gain.gain.setValueAtTime(0.6, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + duration);

    const bufferSize = this.ctx!.sampleRate * 0.5;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx!.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx!.createGain();
    noiseGain.gain.setValueAtTime(0.5, this.ctx!.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.5);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx!.destination);
    noise.start();
  }

  playSuccess(): void {
    this.ensureContext();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx!.currentTime + 1.5);
    gain.gain.setValueAtTime(0.3, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 1.5);
  }

  playTick(): void {
    this.ensureContext();
    const duration = 0.03;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'square';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.15, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + duration);
  }

  playTimesUp(): void {
    this.ensureContext();
    const now = this.ctx!.currentTime;
    for (let i = 0; i < 3; i++) {
      const start = now + i * 0.6;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600 - i * 100, start);
      osc.frequency.linearRampToValueAtTime(400 - i * 100, start + 0.4);

      const blastGain = this.ctx!.createGain();
      blastGain.gain.setValueAtTime(0.4, start);
      blastGain.gain.setValueAtTime(0.4, start + 0.3);
      blastGain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

      osc.connect(blastGain);
      blastGain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    }
  }

  stopAll(): void {
    this.stopAlarm();
  }
}
```

- [ ] **Step 3: Create src/hooks/useAudio.ts**

```typescript
import { useRef } from 'react';
import { AudioManager } from '../lib/AudioManager';

export function useAudio(): AudioManager {
  const ref = useRef<AudioManager | null>(null);
  if (!ref.current) {
    ref.current = new AudioManager();
  }
  return ref.current;
}
```

- [ ] **Step 4: Create src/hooks/useTimer.ts**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  initialSeconds: number;
  running: boolean;
  onExpire: () => void;
}

export function useTimer({ initialSeconds, running, onExpire }: UseTimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onExpireRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const applyPenalty = useCallback((seconds: number) => {
    setTimeRemaining(prev => {
      const next = Math.max(0, prev - seconds);
      if (next <= 0) {
        onExpireRef.current();
      }
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    // Caller controls via `running` prop — this is a no-op kept for API completeness
  }, []);

  const reset = useCallback(() => {
    setTimeRemaining(initialSeconds);
  }, [initialSeconds]);

  return { timeRemaining, applyPenalty, stop, reset };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/config.ts src/lib/AudioManager.ts src/hooks/useAudio.ts src/hooks/useTimer.ts
git commit -m "feat: add config, AudioManager, and timer/audio hooks"
```

---

## Task 3: Global Styles and Overlays

**Files:**
- Modify: `src/styles/global.css`
- Create: `src/styles/results.css`

- [ ] **Step 1: Complete src/styles/global.css**

Replace the placeholder with the full global styles. This includes screen transitions, scanlines, flash, shake, and responsive base:

```css
/* === RESET & BASE === */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  font-family: 'Share Tech Mono', monospace;
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* === GAME CONTAINER === */
#game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background:
    radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #0a0a0a 70%),
    linear-gradient(180deg, #0d0d1a 0%, #0a0a0a 100%);
  overflow: hidden;
}

/* === SCREENS === */
.screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
}

.screen.active {
  opacity: 1;
  pointer-events: auto;
}

/* === SCANLINE OVERLAY === */
.scanlines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
}

/* === SCREEN FLASH === */
.screen-flash {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 90;
  opacity: 0;
  transition: opacity 0.1s ease;
}

.screen-flash.red {
  background: rgba(255, 0, 0, 0.4);
  opacity: 1;
}

.screen-flash.white {
  background: rgba(255, 255, 255, 0.9);
  opacity: 1;
}

.screen-flash.fade-out {
  transition: opacity 0.5s ease;
  opacity: 0;
}

/* === SCREEN SHAKE === */
@keyframes shake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-8px, -5px); }
  20% { transform: translate(7px, 8px); }
  30% { transform: translate(-6px, 3px); }
  40% { transform: translate(5px, -7px); }
  50% { transform: translate(-4px, 6px); }
  60% { transform: translate(8px, -3px); }
  70% { transform: translate(-3px, 5px); }
  80% { transform: translate(6px, -8px); }
  90% { transform: translate(-7px, 4px); }
}

#game-container.shaking {
  animation: shake 0.4s ease-in-out;
}

#game-container.shaking-heavy {
  animation: shake 0.8s ease-in-out;
}

/* === SHARED === */
@keyframes pulse-text {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@keyframes pulse-timer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timer-label {
  font-size: clamp(0.6rem, 1.5vw, 0.9rem);
  color: #888;
  letter-spacing: 0.4em;
  margin-bottom: 0.5rem;
}

/* === CORNER MENU BUTTON === */
.corner-menu-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 50;
  background: none;
  border: 1px solid rgba(102, 102, 102, 0.3);
  color: #666;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.7rem;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
}

.corner-menu-btn:hover {
  color: #ff3333;
  border-color: rgba(255, 51, 51, 0.5);
}

/* === IDLE SCREEN === */
.idle-content {
  text-align: center;
}

.idle-title {
  font-size: clamp(2rem, 5vw, 4rem);
  color: #ff3333;
  text-shadow: 0 0 20px rgba(255, 51, 51, 0.5), 0 0 40px rgba(255, 51, 51, 0.2);
  letter-spacing: 0.3em;
  margin-bottom: 1rem;
}

.idle-subtitle {
  font-size: clamp(0.8rem, 2vw, 1.2rem);
  color: #666;
  letter-spacing: 0.5em;
  margin-bottom: 4rem;
}

.idle-prompt {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  color: #ff3333;
  letter-spacing: 0.2em;
  animation: pulse-text 2s ease-in-out infinite;
}

/* === RESPONSIVE: SMALL SCREENS === */
@media (max-height: 480px) {
  .idle-subtitle {
    margin-bottom: 2rem;
  }
}

@media (max-width: 480px) {
  .idle-title {
    letter-spacing: 0.15em;
  }

  .idle-subtitle {
    letter-spacing: 0.2em;
    margin-bottom: 2rem;
  }
}
```

- [ ] **Step 2: Create src/styles/results.css**

```css
/* === WIN SCREEN === */
.win-screen {
  background: radial-gradient(ellipse at center, #0a2a0a 0%, #0a0a0a 70%);
}

.result-content {
  text-align: center;
}

.win-screen .result-icon {
  font-size: clamp(4rem, 10vw, 8rem);
  color: #33ff88;
  text-shadow: 0 0 30px rgba(51, 255, 136, 0.6);
  margin-bottom: 1rem;
}

.win-screen .result-title {
  font-size: clamp(2rem, 5vw, 4rem);
  color: #33ff88;
  text-shadow: 0 0 20px rgba(51, 255, 136, 0.4);
  letter-spacing: 0.3em;
  margin-bottom: 1rem;
}

.win-screen .result-subtitle {
  font-size: clamp(0.8rem, 2vw, 1.2rem);
  color: #228855;
  letter-spacing: 0.4em;
}

/* === LOSE SCREEN === */
.lose-screen {
  background: radial-gradient(ellipse at center, #2a0a0a 0%, #0a0a0a 70%);
}

.lose-screen .result-icon {
  font-size: clamp(4rem, 10vw, 8rem);
  color: #ff3333;
  text-shadow: 0 0 30px rgba(255, 51, 51, 0.6);
  margin-bottom: 1rem;
}

.lose-screen .result-title {
  font-size: clamp(2rem, 5vw, 4rem);
  color: #ff3333;
  text-shadow: 0 0 20px rgba(255, 51, 51, 0.4);
  letter-spacing: 0.3em;
  margin-bottom: 1rem;
}

.lose-screen .result-subtitle {
  font-size: clamp(0.8rem, 2vw, 1.2rem);
  color: #882222;
  letter-spacing: 0.4em;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css src/styles/results.css
git commit -m "feat: add global styles with responsive breakpoints and result screen styles"
```

---

## Task 4: Menu, Idle, Win, and Lose Screens

**Files:**
- Create: `src/components/MenuScreen.tsx`, `src/components/IdleScreen.tsx`, `src/components/WinScreen.tsx`, `src/components/LoseScreen.tsx`, `src/styles/menu.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create src/styles/menu.css**

```css
.menu-content {
  text-align: center;
}

.menu-title {
  font-size: clamp(2rem, 5vw, 4rem);
  color: #ff3333;
  text-shadow: 0 0 20px rgba(255, 51, 51, 0.5), 0 0 40px rgba(255, 51, 51, 0.2);
  letter-spacing: 0.3em;
  margin-bottom: 1rem;
}

.menu-subtitle {
  font-size: clamp(0.8rem, 2vw, 1.2rem);
  color: #666;
  letter-spacing: 0.5em;
  margin-bottom: 4rem;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

.menu-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 51, 51, 0.3);
  color: #ff3333;
  font-family: 'Share Tech Mono', monospace;
  font-size: clamp(1rem, 2.5vw, 1.4rem);
  padding: 1.2rem 3rem;
  cursor: pointer;
  letter-spacing: 0.2em;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 300px;
  justify-content: center;
}

.menu-btn:hover {
  background: rgba(255, 51, 51, 0.15);
  border-color: rgba(255, 51, 51, 0.6);
  text-shadow: 0 0 10px rgba(255, 51, 51, 0.5);
}

.menu-btn-icon {
  font-size: 1.5em;
}

.menu-btn-label {
  flex: 1;
  text-align: left;
}

@media (max-width: 480px) {
  .menu-btn {
    min-width: unset;
    width: 90vw;
    padding: 1rem 1.5rem;
  }

  .menu-subtitle {
    letter-spacing: 0.2em;
    margin-bottom: 2rem;
  }
}
```

- [ ] **Step 2: Create src/components/MenuScreen.tsx**

```typescript
import '../styles/menu.css';

type Screen = 'idle' | 'countdown';

interface MenuScreenProps {
  active: boolean;
  onSelect: (screen: Screen) => void;
}

export default function MenuScreen({ active, onSelect }: MenuScreenProps) {
  return (
    <div className={`screen${active ? ' active' : ''}`}>
      <div className="menu-content">
        <div className="menu-title">ESCAPE ROOM</div>
        <div className="menu-subtitle">SELECT ACTIVITY</div>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={() => onSelect('idle')}>
            <span className="menu-btn-icon">&#9889;</span>
            <span className="menu-btn-label">WIRE DEFUSAL</span>
          </button>
          <button className="menu-btn" onClick={() => onSelect('countdown')}>
            <span className="menu-btn-icon">&#9201;</span>
            <span className="menu-btn-label">COUNTDOWN TIMER</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create src/components/IdleScreen.tsx**

```typescript
interface IdleScreenProps {
  active: boolean;
  onStart: () => void;
}

export default function IdleScreen({ active, onStart }: IdleScreenProps) {
  return (
    <div className={`screen${active ? ' active' : ''}`} onClick={active ? onStart : undefined}>
      <div className="idle-content">
        <div className="idle-title">WIRE DEFUSAL SYSTEM</div>
        <div className="idle-subtitle">AUTHORIZED PERSONNEL ONLY</div>
        <div className="idle-prompt">[ CLICK TO INITIATE ]</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create src/components/WinScreen.tsx**

```typescript
import '../styles/results.css';

interface WinScreenProps {
  active: boolean;
  onClick: () => void;
}

export default function WinScreen({ active, onClick }: WinScreenProps) {
  return (
    <div className={`screen win-screen${active ? ' active' : ''}`} onClick={active ? onClick : undefined}>
      <div className="result-content">
        <div className="result-icon">&#10003;</div>
        <div className="result-title">BOMB DEFUSED</div>
        <div className="result-subtitle">SYSTEM NEUTRALIZED</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create src/components/LoseScreen.tsx**

```typescript
import '../styles/results.css';

interface LoseScreenProps {
  active: boolean;
  onClick: () => void;
}

export default function LoseScreen({ active, onClick }: LoseScreenProps) {
  return (
    <div className={`screen lose-screen${active ? ' active' : ''}`} onClick={active ? onClick : undefined}>
      <div className="result-content">
        <div className="result-icon">&#10007;</div>
        <div className="result-title">DETONATION</div>
        <div className="result-subtitle">DEFUSAL FAILED</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update src/App.tsx with screen switching**

```typescript
import { useState, useRef, useCallback } from 'react';
import MenuScreen from './components/MenuScreen';
import IdleScreen from './components/IdleScreen';
import WinScreen from './components/WinScreen';
import LoseScreen from './components/LoseScreen';

type Screen = 'menu' | 'idle' | 'wire-defusal' | 'code-entry' | 'countdown' | 'win' | 'lose';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const containerRef = useRef<HTMLDivElement>(null);

  const flashScreen = useCallback((color: 'red' | 'white') => {
    const flash = containerRef.current?.querySelector('.screen-flash');
    if (!flash) return;
    flash.className = `screen-flash ${color}`;
    setTimeout(() => {
      flash.classList.add('fade-out');
      setTimeout(() => {
        flash.className = 'screen-flash';
      }, 500);
    }, 150);
  }, []);

  const shakeScreen = useCallback((heavy = false) => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.remove('shaking', 'shaking-heavy');
    void el.offsetWidth;
    el.classList.add(heavy ? 'shaking-heavy' : 'shaking');
    setTimeout(() => {
      el.classList.remove('shaking', 'shaking-heavy');
    }, heavy ? 800 : 400);
  }, []);

  const handleMenuSelect = useCallback((selected: 'idle' | 'countdown') => {
    setScreen(selected);
  }, []);

  const handleReturnToMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  const handleIdleStart = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    }
    setScreen('wire-defusal');
  }, []);

  return (
    <div id="game-container" ref={containerRef}>
      <MenuScreen active={screen === 'menu'} onSelect={handleMenuSelect} />
      <IdleScreen active={screen === 'idle'} onStart={handleIdleStart} />
      <WinScreen active={screen === 'win'} onClick={handleReturnToMenu} />
      <LoseScreen active={screen === 'lose'} onClick={handleReturnToMenu} />

      {screen !== 'menu' && (
        <button className="corner-menu-btn" onClick={handleReturnToMenu}>
          &#9666; MENU
        </button>
      )}

      <div className="scanlines" />
      <div className="screen-flash" />
    </div>
  );
}
```

- [ ] **Step 7: Verify dev server shows menu**

```bash
npm run dev
```

Expected: Menu screen with two buttons renders. Clicking "WIRE DEFUSAL" shows idle screen. Clicking idle screen goes to blank (wire-defusal not built yet). Menu button returns to menu.

- [ ] **Step 8: Commit**

```bash
git add src/components/MenuScreen.tsx src/components/IdleScreen.tsx src/components/WinScreen.tsx src/components/LoseScreen.tsx src/styles/menu.css src/App.tsx
git commit -m "feat: add menu, idle, win, and lose screens with navigation"
```

---

## Task 5: WireRenderer with Bug Fixes

**Files:**
- Create: `src/lib/WireRenderer.ts`

This is the canvas renderer ported from `js/renderer.js` with three key bug fixes: (1) cut state read from external Set instead of stored on wire objects, (2) hit detection threshold scales with screen size, (3) proper coordinate normalization.

- [ ] **Step 1: Create src/lib/WireRenderer.ts**

```typescript
import { CONFIG } from '../config';

interface Wire {
  index: number;
  color: string;
  label: string;
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
  sag: number;
  cutProgress: number;
  glowPhase: number;
  swayPhase: number;
}

interface Point {
  x: number;
  y: number;
}

interface BezierPath {
  start: Point;
  cp1: Point;
  cp2: Point;
  end: Point;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  color: string;
  size: number;
}

export class WireRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wires: Wire[] = [];
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private hoveredWire = -1;
  private mouseX = -1;
  private mouseY = -1;
  private time = 0;
  private isRunning = false;
  private width = 0;
  private height = 0;
  private cutWires: Set<number> = new Set();
  private onWireCut: ((index: number) => void) | null = null;

  // Bound handlers for cleanup
  private _onResize: () => void;
  private _onMouseMove: (e: MouseEvent) => void;
  private _onMouseLeave: () => void;
  private _onClick: (e: MouseEvent) => void;
  private _onTouchStart: (e: TouchEvent) => void;
  private _onTouchEnd: (e: TouchEvent) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this._onResize = () => this.resize();
    this._onMouseMove = (e) => this.handleMouseMove(e);
    this._onMouseLeave = () => { this.mouseX = -1; this.mouseY = -1; this.hoveredWire = -1; };
    this._onClick = (e) => this.handleClick(e);
    this._onTouchStart = (e) => this.handleTouch(e);
    this._onTouchEnd = (e) => this.handleTouch(e);

    this.resize();
    window.addEventListener('resize', this._onResize);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mouseleave', this._onMouseLeave);
    canvas.addEventListener('click', this._onClick);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
  }

  setCutWires(cutWires: Set<number>): void {
    this.cutWires = cutWires;
  }

  setOnWireCut(callback: (index: number) => void): void {
    this.onWireCut = callback;
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.isRunning) this.generateWires();
  }

  private generateWires(): void {
    const count = CONFIG.wireCount;
    const margin = this.height * 0.2;
    const availableHeight = this.height - margin * 2;
    const minSpacing = 40;
    const spacing = Math.max(minSpacing, availableHeight / (count + 1));
    const leftX = this.width * 0.1;
    const rightX = this.width * 0.9;

    // Preserve cut progress for already-cut wires
    const oldCutProgress = new Map<number, number>();
    this.wires.forEach(w => {
      if (this.cutWires.has(w.index)) {
        oldCutProgress.set(w.index, w.cutProgress);
      }
    });

    this.wires = [];
    for (let i = 0; i < count; i++) {
      const y = margin + spacing * (i + 1);
      const yOffset = (Math.random() - 0.5) * spacing * 0.3;
      const sag = 20 + Math.random() * 30;

      this.wires.push({
        index: i,
        color: CONFIG.wireColors[i % CONFIG.wireColors.length],
        label: CONFIG.wireLabels[i % CONFIG.wireLabels.length],
        leftX,
        leftY: y + yOffset,
        rightX,
        rightY: y + yOffset + (Math.random() - 0.5) * 20,
        sag,
        cutProgress: oldCutProgress.get(i) ?? 0,
        glowPhase: Math.random() * Math.PI * 2,
        swayPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  start(): void {
    this.isRunning = true;
    this.time = 0;
    this.particles = [];
    this.generateWires();
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  reset(): void {
    this.stop();
    this.wires = [];
    this.particles = [];
    this.hoveredWire = -1;
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private animate(): void {
    if (!this.isRunning) return;
    this.time += 0.016;
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.mouseX >= 0 && this.mouseY >= 0) {
      this.hoveredWire = this.wireAtPoint(this.mouseX, this.mouseY);
    }

    this.drawTerminalBlocks();
    this.drawWires();
    this.updateAndDrawParticles();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private drawTerminalBlocks(): void {
    const ctx = this.ctx;
    const blockWidth = 40;
    const leftX = this.width * 0.1 - blockWidth / 2;
    const rightX = this.width * 0.9 - blockWidth / 2;
    const topY = this.height * 0.15;
    const blockHeight = this.height * 0.7;

    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.fillRect(leftX, topY, blockWidth, blockHeight);
    ctx.strokeRect(leftX, topY, blockWidth, blockHeight);
    ctx.fillRect(rightX, topY, blockWidth, blockHeight);
    ctx.strokeRect(rightX, topY, blockWidth, blockHeight);

    this.wires.forEach(wire => {
      this.drawScrew(wire.leftX, wire.leftY);
      this.drawScrew(wire.rightX, wire.rightY);
    });
  }

  private drawScrew(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 3, y);
    ctx.moveTo(x, y - 3);
    ctx.lineTo(x, y + 3);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private getWirePath(wire: Wire): BezierPath {
    const sway = Math.sin(this.time * 1.5 + wire.swayPhase) * 3;
    const midX = (wire.leftX + wire.rightX) / 2;
    const midY = (wire.leftY + wire.rightY) / 2 + wire.sag + sway;
    return {
      start: { x: wire.leftX, y: wire.leftY },
      cp1: { x: midX - (wire.rightX - wire.leftX) * 0.15, y: midY },
      cp2: { x: midX + (wire.rightX - wire.leftX) * 0.15, y: midY },
      end: { x: wire.rightX, y: wire.rightY },
    };
  }

  private drawWires(): void {
    const ctx = this.ctx;
    const wireThickness = Math.max(3, Math.min(6, this.width * 0.004));

    this.wires.forEach((wire, i) => {
      const isCut = this.cutWires.has(wire.index);

      if (isCut) {
        this.drawCutWire(wire, wireThickness);
        return;
      }

      const path = this.getWirePath(wire);
      const isHovered = (i === this.hoveredWire);
      const glowIntensity = 0.3 + 0.2 * Math.sin(this.time * 3 + wire.glowPhase);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(path.start.x, path.start.y);
      ctx.bezierCurveTo(path.cp1.x, path.cp1.y, path.cp2.x, path.cp2.y, path.end.x, path.end.y);
      ctx.strokeStyle = wire.color;
      ctx.lineWidth = isHovered ? wireThickness * 3 : wireThickness * 2;
      ctx.shadowColor = wire.color;
      ctx.shadowBlur = isHovered ? 25 : 15 * glowIntensity;
      ctx.globalAlpha = isHovered ? 0.6 : 0.3 * glowIntensity;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(path.start.x, path.start.y);
      ctx.bezierCurveTo(path.cp1.x, path.cp1.y, path.cp2.x, path.cp2.y, path.end.x, path.end.y);
      ctx.strokeStyle = wire.color;
      ctx.lineWidth = isHovered ? wireThickness * 1.5 : wireThickness;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (isHovered) {
        ctx.fillStyle = wire.color;
        ctx.font = '12px "Share Tech Mono", monospace';
        ctx.fillText(wire.label, wire.leftX + 30, wire.leftY - 12);
      }
    });

    this.canvas.style.cursor = this.hoveredWire >= 0 ? 'crosshair' : 'default';
  }

  private drawCutWire(wire: Wire, wireThickness: number): void {
    const ctx = this.ctx;
    const path = this.getWirePath(wire);
    const t = 0.5;
    const progress = Math.min(wire.cutProgress, 1);
    const cutPoint = this.bezierPoint(path, t);
    const droop = progress * 60;

    ctx.beginPath();
    ctx.moveTo(path.start.x, path.start.y);
    ctx.quadraticCurveTo(
      (path.start.x + cutPoint.x) / 2,
      (path.start.y + cutPoint.y) / 2 + droop,
      cutPoint.x - 5,
      cutPoint.y + droop
    );
    ctx.strokeStyle = wire.color;
    ctx.lineWidth = wireThickness;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(path.end.x, path.end.y);
    ctx.quadraticCurveTo(
      (path.end.x + cutPoint.x) / 2,
      (path.end.y + cutPoint.y) / 2 + droop,
      cutPoint.x + 5,
      cutPoint.y + droop
    );
    ctx.strokeStyle = wire.color;
    ctx.lineWidth = wireThickness;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (wire.cutProgress < 1) {
      wire.cutProgress += 0.05;
    }
  }

  private bezierPoint(path: BezierPath, t: number): Point {
    const x = Math.pow(1 - t, 3) * path.start.x +
              3 * Math.pow(1 - t, 2) * t * path.cp1.x +
              3 * (1 - t) * Math.pow(t, 2) * path.cp2.x +
              Math.pow(t, 3) * path.end.x;
    const y = Math.pow(1 - t, 3) * path.start.y +
              3 * Math.pow(1 - t, 2) * t * path.cp1.y +
              3 * (1 - t) * Math.pow(t, 2) * path.cp2.y +
              Math.pow(t, 3) * path.end.y;
    return { x, y };
  }

  private wireAtPoint(px: number, py: number): number {
    // BUG FIX: threshold scales with screen size
    const threshold = Math.max(15, this.height * 0.025);
    for (let i = this.wires.length - 1; i >= 0; i--) {
      const wire = this.wires[i];
      if (this.cutWires.has(wire.index)) continue;
      const path = this.getWirePath(wire);

      for (let t = 0; t <= 1; t += 0.02) {
        const point = this.bezierPoint(path, t);
        const dist = Math.sqrt(Math.pow(px - point.x, 2) + Math.pow(py - point.y, 2));
        if (dist < threshold) return i;
      }
    }
    return -1;
  }

  private getCanvasCoords(clientX: number, clientY: number): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  private handleMouseMove(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
    this.mouseX = x;
    this.mouseY = y;
  }

  private handleClick(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
    const wireIndex = this.wireAtPoint(x, y);
    if (wireIndex >= 0 && this.onWireCut) {
      this.onWireCut(wireIndex);
    }
  }

  private handleTouch(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (!touch) return;
    const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
    const wireIndex = this.wireAtPoint(x, y);
    if (wireIndex >= 0 && this.onWireCut) {
      this.onWireCut(wireIndex);
    }
  }

  triggerCutAnimation(wireIndex: number, isCorrect: boolean): void {
    const wire = this.wires[wireIndex];
    if (!wire) return;
    wire.cutProgress = 0;
    const path = this.getWirePath(wire);
    const cutPoint = this.bezierPoint(path, 0.5);
    this.spawnSparks(cutPoint.x, cutPoint.y, wire.color, isCorrect ? 30 : 15);
  }

  private spawnSparks(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  explode(): void {
    const cx = this.width / 2;
    const cy = this.height / 2;
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 10;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 100,
        y: cy + (Math.random() - 0.5) * 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.01 + Math.random() * 0.02,
        color: ['#ff3333', '#ff8800', '#ffdd33', '#ffffff'][Math.floor(Math.random() * 4)],
        size: 3 + Math.random() * 5,
      });
    }
    const particleLoop = () => {
      if (this.particles.length === 0) return;
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.updateAndDrawParticles();
      requestAnimationFrame(particleLoop);
    };
    particleLoop();
  }

  private updateAndDrawParticles(): void {
    const ctx = this.ctx;
    this.particles = this.particles.filter(p => p.life > 0);

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= p.decay;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, p.size * p.life), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/WireRenderer.ts
git commit -m "feat: port WireRenderer with scaled hit detection and external cut state"
```

---

## Task 6: Wire Defusal Screens (WireCanvas, WireDefusalScreen, WireDefusalGame)

**Files:**
- Create: `src/components/WireCanvas.tsx`, `src/components/WireDefusalScreen.tsx`, `src/components/WireDefusalGame.tsx`, `src/styles/wire-defusal.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create src/styles/wire-defusal.css**

```css
/* === ACTIVE SCREEN === */
.wire-defusal-screen {
  flex-direction: column;
}

/* === TIMER === */
.timer-display {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
}

.timer-value {
  font-size: clamp(3rem, 8vw, 6rem);
  color: #33ff88;
  text-shadow: 0 0 20px rgba(51, 255, 136, 0.5), 0 0 40px rgba(51, 255, 136, 0.2);
  letter-spacing: 0.1em;
  font-variant-numeric: tabular-nums;
}

.timer-value.warning {
  color: #ff3333;
  text-shadow: 0 0 20px rgba(255, 51, 51, 0.5), 0 0 40px rgba(255, 51, 51, 0.2);
  animation: pulse-timer 0.5s ease-in-out infinite;
}

/* === WIRE CANVAS === */
.wire-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* === STATUS BAR === */
.status-bar {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.status-text {
  font-size: clamp(0.8rem, 2vw, 1.1rem);
  color: #666;
  letter-spacing: 0.3em;
}

@media (max-height: 480px) {
  .timer-display {
    top: 0.5rem;
  }

  .timer-value {
    font-size: clamp(2rem, 6vw, 3.5rem);
  }

  .status-bar {
    bottom: 0.5rem;
  }
}
```

- [ ] **Step 2: Create src/components/WireCanvas.tsx**

```typescript
import { useEffect, useRef } from 'react';
import { WireRenderer } from '../lib/WireRenderer';
import '../styles/wire-defusal.css';

interface WireCanvasProps {
  cutWires: Set<number>;
  onWireCut: (index: number) => void;
  running: boolean;
}

export default function WireCanvas({ cutWires, onWireCut, running }: WireCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WireRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new WireRenderer(canvasRef.current);
    rendererRef.current = renderer;
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setOnWireCut(onWireCut);
  }, [onWireCut]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setCutWires(cutWires);
  }, [cutWires]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (running) {
      renderer.start();
    } else {
      renderer.stop();
    }
  }, [running]);

  return <canvas ref={canvasRef} className="wire-canvas" />;
}
```

- [ ] **Step 3: Create src/components/WireDefusalScreen.tsx**

```typescript
import { formatTime } from '../hooks/useTimer';
import WireCanvas from './WireCanvas';
import '../styles/wire-defusal.css';

interface WireDefusalScreenProps {
  active: boolean;
  timeRemaining: number;
  cutWires: Set<number>;
  statusMessage: string;
  onWireCut: (index: number) => void;
}

export default function WireDefusalScreen({
  active,
  timeRemaining,
  cutWires,
  statusMessage,
  onWireCut,
}: WireDefusalScreenProps) {
  return (
    <div className={`screen wire-defusal-screen${active ? ' active' : ''}`}>
      <div className="timer-display">
        <div className="timer-label">TIME REMAINING</div>
        <div className={`timer-value${timeRemaining <= 30 ? ' warning' : ''}`}>
          {formatTime(timeRemaining)}
        </div>
      </div>
      <WireCanvas cutWires={cutWires} onWireCut={onWireCut} running={active} />
      <div className="status-bar">
        <div className="status-text">{statusMessage}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create src/components/WireDefusalGame.tsx**

This wrapper component owns the shared timer and cut wire state, switching between wire and code phases:

```typescript
import { useState, useCallback, useRef } from 'react';
import { CONFIG } from '../config';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import WireDefusalScreen from './WireDefusalScreen';
import CodeEntryScreen from './CodeEntryScreen';

interface WireDefusalGameProps {
  active: boolean;
  onWin: () => void;
  onLose: () => void;
  flashScreen: (color: 'red' | 'white') => void;
  shakeScreen: (heavy?: boolean) => void;
}

export default function WireDefusalGame({
  active,
  onWin,
  onLose,
  flashScreen,
  shakeScreen,
}: WireDefusalGameProps) {
  const [phase, setPhase] = useState<'wires' | 'code'>('wires');
  const [cutWires, setCutWires] = useState<Set<number>>(new Set());
  const [statusMessage, setStatusMessage] = useState('SELECT WIRE TO CUT');
  const audio = useAudio();
  const alarmStartedRef = useRef(false);

  const { timeRemaining, applyPenalty, reset: resetTimer } = useTimer({
    initialSeconds: CONFIG.timerSeconds,
    running: active,
    onExpire: () => {
      audio.stopAlarm();
      audio.playExplosion();
      flashScreen('white');
      shakeScreen(true);
      setTimeout(() => onLose(), 1500);
    },
  });

  // Start alarm when game becomes active
  if (active && !alarmStartedRef.current) {
    alarmStartedRef.current = true;
    audio.startAlarm();
  }
  if (!active && alarmStartedRef.current) {
    alarmStartedRef.current = false;
    audio.stopAll();
    // Reset game state when leaving
    setCutWires(new Set());
    setPhase('wires');
    setStatusMessage('SELECT WIRE TO CUT');
    resetTimer();
  }

  const handleWireCut = useCallback((wireIndex: number) => {
    if (cutWires.has(wireIndex)) return;

    const newCutWires = new Set(cutWires);
    newCutWires.add(wireIndex);
    setCutWires(newCutWires);
    audio.playSnip();

    if (wireIndex === CONFIG.correctWire - 1) {
      // Correct wire — transition to code entry
      audio.stopAlarm();
      setTimeout(() => {
        setPhase('code');
      }, 1500);
    } else {
      // Wrong wire — penalty
      applyPenalty(CONFIG.penaltySeconds);
      flashScreen('red');
      shakeScreen();
      audio.playZap();
      setStatusMessage(`WRONG WIRE — PENALTY ${CONFIG.penaltySeconds}s`);
      setTimeout(() => {
        setStatusMessage('SELECT WIRE TO CUT');
      }, 2000);
    }
  }, [cutWires, audio, applyPenalty, flashScreen, shakeScreen]);

  const handleCodeCorrect = useCallback(() => {
    audio.playSuccess();
    setTimeout(() => onWin(), 1000);
  }, [audio, onWin]);

  const handleCodePenalty = useCallback(() => {
    applyPenalty(CONFIG.codePenaltySeconds);
    flashScreen('red');
    shakeScreen();
    audio.playZap();
  }, [applyPenalty, flashScreen, shakeScreen, audio]);

  return (
    <>
      <WireDefusalScreen
        active={active && phase === 'wires'}
        timeRemaining={timeRemaining}
        cutWires={cutWires}
        statusMessage={statusMessage}
        onWireCut={handleWireCut}
      />
      <CodeEntryScreen
        active={active && phase === 'code'}
        timeRemaining={timeRemaining}
        onCorrect={handleCodeCorrect}
        onPenalty={handleCodePenalty}
      />
    </>
  );
}
```

- [ ] **Step 5: Update src/App.tsx to include WireDefusalGame**

Add to the imports:

```typescript
import WireDefusalGame from './components/WireDefusalGame';
```

Add inside the `<div id="game-container">`, after `<IdleScreen>`:

```typescript
<WireDefusalGame
  active={screen === 'wire-defusal' || screen === 'code-entry'}
  onWin={() => setScreen('win')}
  onLose={() => setScreen('lose')}
  flashScreen={flashScreen}
  shakeScreen={shakeScreen}
/>
```

Note: `WireDefusalGame` manages its own wire/code phase internally, so `App` just needs to know it's in the wire-defusal activity. Update `handleIdleStart` to set screen to `'wire-defusal'`:

The App screen type should be simplified — since WireDefusalGame handles wire/code switching internally, remove `'code-entry'` from the Screen type:

```typescript
type Screen = 'menu' | 'idle' | 'wire-defusal' | 'countdown' | 'win' | 'lose';
```

- [ ] **Step 6: Verify dev server — Note: CodeEntryScreen doesn't exist yet**

This step will have a compile error because `WireDefusalGame` imports `CodeEntryScreen` which doesn't exist. Create a placeholder:

Create `src/components/CodeEntryScreen.tsx`:

```typescript
interface CodeEntryScreenProps {
  active: boolean;
  timeRemaining: number;
  onCorrect: () => void;
  onPenalty: () => void;
}

export default function CodeEntryScreen({ active }: CodeEntryScreenProps) {
  return (
    <div className={`screen${active ? ' active' : ''}`}>
      <div style={{ color: '#33ff88', fontSize: '2rem' }}>CODE ENTRY (placeholder)</div>
    </div>
  );
}
```

- [ ] **Step 7: Verify TypeScript compiles and dev server shows wire defusal**

```bash
npx tsc --noEmit && npm run dev
```

Expected: Menu → Wire Defusal → Idle → Click to start → Wires render, can be clicked, alarm plays, timer counts down.

- [ ] **Step 8: Commit**

```bash
git add src/components/WireCanvas.tsx src/components/WireDefusalScreen.tsx src/components/WireDefusalGame.tsx src/components/CodeEntryScreen.tsx src/styles/wire-defusal.css src/App.tsx
git commit -m "feat: add wire defusal game with canvas renderer and timer"
```

---

## Task 7: Code Entry Screen

**Files:**
- Modify: `src/components/CodeEntryScreen.tsx`
- Create: `src/styles/code-entry.css`

- [ ] **Step 1: Create src/styles/code-entry.css**

```css
.code-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.code-timer-display {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
}

.code-timer-value {
  font-size: clamp(2rem, 5vw, 3.5rem);
  color: #33ff88;
  text-shadow: 0 0 20px rgba(51, 255, 136, 0.5), 0 0 40px rgba(51, 255, 136, 0.2);
  letter-spacing: 0.1em;
  font-variant-numeric: tabular-nums;
}

.code-timer-value.warning {
  color: #ff3333;
  text-shadow: 0 0 20px rgba(255, 51, 51, 0.5), 0 0 40px rgba(255, 51, 51, 0.2);
  animation: pulse-timer 0.5s ease-in-out infinite;
}

.code-title {
  font-size: clamp(1rem, 3vw, 1.8rem);
  color: #ff3333;
  letter-spacing: 0.4em;
  margin-bottom: 2rem;
  text-shadow: 0 0 15px rgba(255, 51, 51, 0.4);
}

.code-display {
  display: flex;
  gap: clamp(0.5rem, 2vw, 1.5rem);
  margin-bottom: 2rem;
}

.code-digit {
  font-size: clamp(2.5rem, 7vw, 5rem);
  color: #33ff88;
  text-shadow: 0 0 15px rgba(51, 255, 136, 0.5);
  width: clamp(3rem, 8vw, 5rem);
  border-bottom: 3px solid rgba(51, 255, 136, 0.3);
  padding-bottom: 0.3rem;
  font-variant-numeric: tabular-nums;
}

.code-digit.filled {
  text-shadow: 0 0 20px rgba(51, 255, 136, 0.8);
}

.code-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(0.4rem, 1vw, 0.7rem);
  max-width: 300px;
}

.keypad-btn {
  font-family: 'Share Tech Mono', monospace;
  font-size: clamp(1.2rem, 3vw, 1.8rem);
  color: #33ff88;
  background: rgba(51, 255, 136, 0.05);
  border: 1px solid rgba(51, 255, 136, 0.2);
  padding: clamp(0.6rem, 2vw, 1rem);
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0.1em;
}

.keypad-btn:hover {
  background: rgba(51, 255, 136, 0.15);
  border-color: rgba(51, 255, 136, 0.5);
}

.keypad-btn:active {
  background: rgba(51, 255, 136, 0.25);
}

.keypad-clear {
  color: #ff3333;
  border-color: rgba(255, 51, 51, 0.2);
  background: rgba(255, 51, 51, 0.05);
}

.keypad-clear:hover {
  background: rgba(255, 51, 51, 0.15);
  border-color: rgba(255, 51, 51, 0.5);
}

.keypad-enter {
  color: #33ff88;
  border-color: rgba(51, 255, 136, 0.3);
  background: rgba(51, 255, 136, 0.08);
}

.keypad-enter:hover {
  background: rgba(51, 255, 136, 0.2);
  border-color: rgba(51, 255, 136, 0.6);
}

.code-status {
  margin-top: 1.5rem;
  font-size: clamp(0.8rem, 2vw, 1.1rem);
  color: #ff3333;
  letter-spacing: 0.3em;
  min-height: 1.5em;
}

@media (max-height: 480px) {
  .code-timer-display {
    top: 0.5rem;
  }

  .code-title {
    margin-bottom: 1rem;
  }

  .code-display {
    margin-bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .code-keypad {
    max-width: 80vw;
  }
}
```

- [ ] **Step 2: Replace src/components/CodeEntryScreen.tsx**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '../config';
import { formatTime } from '../hooks/useTimer';
import '../styles/code-entry.css';

interface CodeEntryScreenProps {
  active: boolean;
  timeRemaining: number;
  onCorrect: () => void;
  onPenalty: () => void;
}

export default function CodeEntryScreen({
  active,
  timeRemaining,
  onCorrect,
  onPenalty,
}: CodeEntryScreenProps) {
  const [codeEntry, setCodeEntry] = useState('');
  const [statusText, setStatusText] = useState('');
  const codeLength = CONFIG.correctCode.length;

  // Reset code when screen becomes active
  useEffect(() => {
    if (active) {
      setCodeEntry('');
      setStatusText('');
    }
  }, [active]);

  const enterDigit = useCallback((digit: string) => {
    setCodeEntry(prev => {
      if (prev.length >= codeLength) return prev;
      return prev + digit;
    });
  }, [codeLength]);

  const clearCode = useCallback(() => {
    setCodeEntry('');
    setStatusText('');
  }, []);

  const submitCode = useCallback(() => {
    if (codeEntry.length !== codeLength) return;

    if (codeEntry === CONFIG.correctCode) {
      onCorrect();
    } else {
      onPenalty();
      setStatusText(`WRONG CODE — PENALTY ${CONFIG.codePenaltySeconds}s`);
      setCodeEntry('');
      setTimeout(() => setStatusText(''), 2000);
    }
  }, [codeEntry, codeLength, onCorrect, onPenalty]);

  // Keyboard input
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        enterDigit(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitCode();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        clearCode();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, enterDigit, submitCode, clearCode]);

  const digits = Array.from({ length: codeLength }, (_, i) => {
    const char = i < codeEntry.length ? codeEntry[i] : '_';
    const filled = i < codeEntry.length;
    return (
      <span key={i} className={`code-digit${filled ? ' filled' : ''}`}>
        {char}
      </span>
    );
  });

  return (
    <div className={`screen${active ? ' active' : ''}`}>
      <div className="code-content">
        <div className="code-timer-display">
          <div className="timer-label">TIME REMAINING</div>
          <div className={`code-timer-value${timeRemaining <= 30 ? ' warning' : ''}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
        <div className="code-title">ENTER DEFUSAL CODE</div>
        <div className="code-display">{digits}</div>
        <div className="code-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
            <button key={key} className="keypad-btn" onClick={() => enterDigit(key)}>
              {key}
            </button>
          ))}
          <button className="keypad-btn keypad-clear" onClick={clearCode}>CLR</button>
          <button className="keypad-btn" onClick={() => enterDigit('0')}>0</button>
          <button className="keypad-btn keypad-enter" onClick={submitCode}>&#9166;</button>
        </div>
        <div className="code-status">{statusText}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify full wire defusal flow works**

```bash
npm run dev
```

Expected: Menu → Wire Defusal → Idle → Start → Cut correct wire → Code entry screen appears with timer still running → Enter correct code (1977) → Win screen. Wrong wire/code applies penalty with flash/shake.

- [ ] **Step 4: Commit**

```bash
git add src/components/CodeEntryScreen.tsx src/styles/code-entry.css
git commit -m "feat: add code entry screen with keypad and keyboard input"
```

---

## Task 8: Countdown Timer Screen

**Files:**
- Create: `src/components/CountdownScreen.tsx`, `src/hooks/useCountdown.ts`, `src/styles/countdown.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create src/hooks/useCountdown.ts**

Millisecond-precision countdown using `requestAnimationFrame` (same approach as current `timer.js`):

```typescript
import { useState, useRef, useCallback } from 'react';

type CountdownState = 'waiting' | 'running' | 'stopped' | 'finished';

interface UseCountdownOptions {
  totalMs: number;
  onFinish: () => void;
}

export function useCountdown({ totalMs, onFinish }: UseCountdownOptions) {
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const [state, setState] = useState<CountdownState>('waiting');
  const lastFrameRef = useRef<number | null>(null);
  const animIdRef = useRef<number | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const remainingRef = useRef(totalMs);

  const tick = useCallback(() => {
    const now = performance.now();
    const delta = now - (lastFrameRef.current ?? now);
    lastFrameRef.current = now;

    remainingRef.current = Math.max(0, remainingRef.current - delta);
    setRemainingMs(remainingRef.current);

    if (remainingRef.current <= 0) {
      setState('finished');
      animIdRef.current = null;
      onFinishRef.current();
      return;
    }

    animIdRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    setState('running');
    lastFrameRef.current = performance.now();
    animIdRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    setState('stopped');
    if (animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    if (animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    }
    setState('waiting');
    remainingRef.current = totalMs;
    setRemainingMs(totalMs);
    lastFrameRef.current = null;
  }, [totalMs]);

  return { remainingMs, state, start, stop, reset };
}

export function formatCountdown(ms: number): string {
  const totalSecs = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return mins + ':' + String(secs).padStart(2, '0');
}
```

- [ ] **Step 2: Create src/styles/countdown.css**

```css
.timer-activity-content {
  text-align: center;
}

.countdown-value {
  font-size: clamp(4rem, 12vw, 10rem);
  color: #33ff88;
  text-shadow: 0 0 20px rgba(51, 255, 136, 0.5), 0 0 40px rgba(51, 255, 136, 0.2);
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
  margin-bottom: 2rem;
}

.countdown-value.warning {
  color: #ff3333;
  text-shadow: 0 0 20px rgba(255, 51, 51, 0.5), 0 0 40px rgba(255, 51, 51, 0.2);
  animation: pulse-timer 0.5s ease-in-out infinite;
}

.countdown-prompt {
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  color: #ff3333;
  letter-spacing: 0.2em;
  animation: pulse-text 2s ease-in-out infinite;
  margin-top: 1rem;
}

.countdown-timesup {
  font-size: clamp(2.5rem, 6vw, 5rem);
  color: #ff3333;
  text-shadow: 0 0 30px rgba(255, 51, 51, 0.6), 0 0 60px rgba(255, 51, 51, 0.3);
  letter-spacing: 0.3em;
  margin-bottom: 2rem;
}
```

- [ ] **Step 3: Create src/components/CountdownScreen.tsx**

```typescript
import { useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { useCountdown, formatCountdown } from '../hooks/useCountdown';
import { useAudio } from '../hooks/useAudio';
import '../styles/countdown.css';

interface CountdownScreenProps {
  active: boolean;
}

export default function CountdownScreen({ active }: CountdownScreenProps) {
  const audio = useAudio();
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { remainingMs, state, start, stop, reset } = useCountdown({
    totalMs: CONFIG.countdownSeconds * 1000,
    onFinish: () => {
      stopTickSound();
      audio.playTimesUp();
    },
  });

  const stopTickSound = () => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  };

  // Reset when becoming active/inactive
  useEffect(() => {
    if (active) {
      reset();
    } else {
      stopTickSound();
      reset();
    }
    return () => stopTickSound();
  }, [active, reset]);

  // Tick sound in last 10 seconds
  useEffect(() => {
    if (state === 'running' && remainingMs <= 10000 && !tickIntervalRef.current) {
      audio.playTick();
      tickIntervalRef.current = setInterval(() => {
        audio.playTick();
      }, 1000);
    }
    if (state !== 'running') {
      stopTickSound();
    }
  }, [state, remainingMs, audio]);

  // Keyboard handler
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (state === 'waiting') {
        start();
      } else if (state === 'running') {
        stop();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, state, start, stop]);

  const isWarning = remainingMs <= 30000;

  return (
    <div className={`screen${active ? ' active' : ''}`}>
      <div className="timer-activity-content">
        <div>
          <div className="timer-label">COUNTDOWN</div>
          <div className={`countdown-value${isWarning ? ' warning' : ''}`}>
            {formatCountdown(remainingMs)}
          </div>
        </div>
        {state === 'running' && (
          <div className="countdown-prompt">PRESS SPACEBAR TO STOP THE TIME</div>
        )}
        {state === 'finished' && (
          <div className="countdown-timesup">TIMES UP!</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update src/App.tsx to include CountdownScreen**

Add to imports:

```typescript
import CountdownScreen from './components/CountdownScreen';
```

Add inside `<div id="game-container">`, after `<WireDefusalGame>`:

```typescript
<CountdownScreen active={screen === 'countdown'} />
```

- [ ] **Step 5: Verify countdown timer works**

```bash
npm run dev
```

Expected: Menu → Countdown Timer → Shows 1:30 → Press spacebar → Timer counts down → Spacebar stops it. Last 10 seconds tick. Reaching 0 shows "TIMES UP!".

- [ ] **Step 6: Commit**

```bash
git add src/components/CountdownScreen.tsx src/hooks/useCountdown.ts src/styles/countdown.css src/App.tsx
git commit -m "feat: add countdown timer screen with millisecond precision"
```

---

## Task 9: Remove Old Vanilla Files and Final Verification

**Files:**
- Delete: `js/config.js`, `js/audio.js`, `js/renderer.js`, `js/game.js`, `js/timer.js`, `js/menu.js`, `css/style.css`

- [ ] **Step 1: Verify the full React app works end-to-end**

```bash
npm run dev
```

Test the following flows manually:
1. Menu → Wire Defusal → Idle → Start → Cut wrong wires (penalty, flash, shake) → Cut correct wire → Code entry → Wrong code (penalty) → Correct code (1977) → Win → Click → Menu
2. Menu → Wire Defusal → Idle → Start → Let timer expire → Lose → Click → Menu
3. Menu → Countdown Timer → Spacebar to start → Spacebar to stop → Menu button → Menu
4. Menu → Countdown Timer → Let it reach 0 → "TIMES UP!" plays sound
5. Resize browser during wire defusal — cut wires should stay cut
6. Menu button works from all screens

- [ ] **Step 2: Verify production build works**

```bash
npm run build && npm run preview
```

Expected: Production build succeeds. Preview server at `http://localhost:4173` shows working app.

- [ ] **Step 3: Delete old vanilla JS and CSS files**

```bash
rm -rf js/ css/
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old vanilla JS/CSS files, migration complete"
```

---

## Task 10: Add GitHub Pages Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create .github/workflows/deploy.yml**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
mkdir -p .github/workflows
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deployment workflow"
```
