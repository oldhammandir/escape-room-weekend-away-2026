# Cut the Wire — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive "cut the correct wire" escape room puzzle as a fullscreen web app for a dedicated tablet.

**Architecture:** Vanilla HTML/CSS/JS with no build tools. Canvas API for wire rendering and particle effects. Web Audio API for procedurally generated sound (no audio files needed). Simple state machine for game flow. Operator configuration via a JS config file.

**Tech Stack:** HTML5 Canvas, CSS3 (animations, gradients, filters), Web Audio API, Fullscreen API, Google Fonts (Share Tech Mono)

**Design Doc:** `docs/plans/2026-02-17-cut-the-wire-design.md`

---

### Task 1: Project Scaffold + Idle Screen

**Goal:** Create all project files and implement the idle state — a black screen with pulsing "CLICK TO START" text that goes fullscreen on click.

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/config.js`
- Create: `js/audio.js` (empty placeholder)
- Create: `js/renderer.js` (empty placeholder)
- Create: `js/game.js`

**Step 1: Create `js/config.js`**

```js
const CONFIG = {
  timerSeconds: 120,
  penaltySeconds: 30,
  wireCount: 5,
  correctWire: 3,
  wireColors: ['#ff3333', '#3388ff', '#33ff88', '#ffdd33', '#ffffff'],
  wireLabels: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'WHITE'],
};
```

**Step 2: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>WIRE DEFUSAL SYSTEM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="game-container">
    <!-- Idle Screen -->
    <div id="idle-screen" class="screen active">
      <div class="idle-content">
        <div class="idle-title">WIRE DEFUSAL SYSTEM</div>
        <div class="idle-subtitle">AUTHORIZED PERSONNEL ONLY</div>
        <div class="idle-prompt">[ CLICK TO INITIATE ]</div>
      </div>
    </div>

    <!-- Active Screen -->
    <div id="active-screen" class="screen">
      <div id="timer-display">
        <div class="timer-label">TIME REMAINING</div>
        <div id="timer-value">02:00</div>
      </div>
      <canvas id="wire-canvas"></canvas>
      <div id="status-bar">
        <div id="status-text">SELECT WIRE TO CUT</div>
      </div>
    </div>

    <!-- Win Screen -->
    <div id="win-screen" class="screen">
      <div class="result-content">
        <div class="result-icon">&#10003;</div>
        <div class="result-title">BOMB DEFUSED</div>
        <div class="result-subtitle">SYSTEM NEUTRALIZED</div>
      </div>
    </div>

    <!-- Lose Screen -->
    <div id="lose-screen" class="screen">
      <div class="result-content">
        <div class="result-icon">&#10007;</div>
        <div class="result-title">DETONATION</div>
        <div class="result-subtitle">DEFUSAL FAILED</div>
      </div>
    </div>

    <!-- Scanline overlay -->
    <div id="scanlines"></div>
    <!-- Screen flash overlay -->
    <div id="screen-flash"></div>
  </div>

  <script src="js/config.js"></script>
  <script src="js/audio.js"></script>
  <script src="js/renderer.js"></script>
  <script src="js/game.js"></script>
</body>
</html>
```

**Step 3: Create `css/style.css`**

Full theme CSS with:
- Dark metal panel background using CSS gradients
- Scanline overlay effect
- Pulsing idle text animation
- LED-style timer display
- Screen flash overlay for effects
- Fullscreen layout
- Military/tech theme throughout

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
#scanlines {
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
#screen-flash {
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

#screen-flash.red {
  background: rgba(255, 0, 0, 0.4);
  opacity: 1;
}

#screen-flash.white {
  background: rgba(255, 255, 255, 0.9);
  opacity: 1;
}

#screen-flash.fade-out {
  transition: opacity 0.5s ease;
  opacity: 0;
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

@keyframes pulse-text {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* === ACTIVE SCREEN === */
#active-screen {
  flex-direction: column;
}

/* === TIMER === */
#timer-display {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
}

.timer-label {
  font-size: clamp(0.6rem, 1.5vw, 0.9rem);
  color: #888;
  letter-spacing: 0.4em;
  margin-bottom: 0.5rem;
}

#timer-value {
  font-size: clamp(3rem, 8vw, 6rem);
  color: #33ff88;
  text-shadow: 0 0 20px rgba(51, 255, 136, 0.5), 0 0 40px rgba(51, 255, 136, 0.2);
  letter-spacing: 0.1em;
  font-variant-numeric: tabular-nums;
}

#timer-value.warning {
  color: #ff3333;
  text-shadow: 0 0 20px rgba(255, 51, 51, 0.5), 0 0 40px rgba(255, 51, 51, 0.2);
  animation: pulse-timer 0.5s ease-in-out infinite;
}

@keyframes pulse-timer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* === WIRE CANVAS === */
#wire-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* === STATUS BAR === */
#status-bar {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

#status-text {
  font-size: clamp(0.8rem, 2vw, 1.1rem);
  color: #666;
  letter-spacing: 0.3em;
}

/* === WIN SCREEN === */
#win-screen {
  background: radial-gradient(ellipse at center, #0a2a0a 0%, #0a0a0a 70%);
}

.result-content {
  text-align: center;
}

#win-screen .result-icon {
  font-size: clamp(4rem, 10vw, 8rem);
  color: #33ff88;
  text-shadow: 0 0 30px rgba(51, 255, 136, 0.6);
  margin-bottom: 1rem;
}

#win-screen .result-title {
  font-size: clamp(2rem, 5vw, 4rem);
  color: #33ff88;
  text-shadow: 0 0 20px rgba(51, 255, 136, 0.4);
  letter-spacing: 0.3em;
  margin-bottom: 1rem;
}

#win-screen .result-subtitle {
  font-size: clamp(0.8rem, 2vw, 1.2rem);
  color: #228855;
  letter-spacing: 0.4em;
}

/* === LOSE SCREEN === */
#lose-screen {
  background: radial-gradient(ellipse at center, #2a0a0a 0%, #0a0a0a 70%);
}

#lose-screen .result-icon {
  font-size: clamp(4rem, 10vw, 8rem);
  color: #ff3333;
  text-shadow: 0 0 30px rgba(255, 51, 51, 0.6);
  margin-bottom: 1rem;
}

#lose-screen .result-title {
  font-size: clamp(2rem, 5vw, 4rem);
  color: #ff3333;
  text-shadow: 0 0 20px rgba(255, 51, 51, 0.4);
  letter-spacing: 0.3em;
  margin-bottom: 1rem;
}

#lose-screen .result-subtitle {
  font-size: clamp(0.8rem, 2vw, 1.2rem);
  color: #882222;
  letter-spacing: 0.4em;
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
```

**Step 4: Create `js/game.js` with idle screen click handler**

```js
class Game {
  constructor() {
    this.state = 'idle'; // idle, active, win, lose
    this.timeRemaining = CONFIG.timerSeconds;
    this.timerInterval = null;
    this.cutWires = new Set();

    // DOM elements
    this.container = document.getElementById('game-container');
    this.screens = {
      idle: document.getElementById('idle-screen'),
      active: document.getElementById('active-screen'),
      win: document.getElementById('win-screen'),
      lose: document.getElementById('lose-screen'),
    };
    this.timerValue = document.getElementById('timer-value');
    this.statusText = document.getElementById('status-text');
    this.screenFlash = document.getElementById('screen-flash');

    this.bindEvents();
  }

  bindEvents() {
    this.screens.idle.addEventListener('click', () => this.start());
    // Win/lose screens click to reset
    this.screens.win.addEventListener('click', () => this.reset());
    this.screens.lose.addEventListener('click', () => this.reset());
  }

  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    this.screens[name].classList.add('active');
  }

  start() {
    if (this.state !== 'idle') return;
    this.state = 'active';
    this.timeRemaining = CONFIG.timerSeconds;
    this.cutWires.clear();
    this.showScreen('active');
    this.updateTimerDisplay();
    this.startTimer();
    // Audio and renderer will be connected in later tasks
    if (this.audio) this.audio.startAlarm();
    if (this.renderer) this.renderer.start();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        this.lose();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const mins = Math.floor(Math.max(0, this.timeRemaining) / 60);
    const secs = Math.max(0, this.timeRemaining) % 60;
    this.timerValue.textContent =
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

    if (this.timeRemaining <= 30) {
      this.timerValue.classList.add('warning');
    } else {
      this.timerValue.classList.remove('warning');
    }
  }

  cutWire(wireIndex) {
    if (this.state !== 'active') return;
    if (this.cutWires.has(wireIndex)) return;

    this.cutWires.add(wireIndex);

    if (wireIndex === CONFIG.correctWire - 1) {
      this.win();
    } else {
      this.penalty(wireIndex);
    }
  }

  penalty(wireIndex) {
    this.timeRemaining = Math.max(0, this.timeRemaining - CONFIG.penaltySeconds);
    this.updateTimerDisplay();

    // Flash red
    this.flashScreen('red');
    this.shakeScreen();

    if (this.audio) this.audio.playZap();
    if (this.renderer) this.renderer.cutWire(wireIndex, false);

    this.statusText.textContent = 'WRONG WIRE — PENALTY ' + CONFIG.penaltySeconds + 's';
    setTimeout(() => {
      if (this.state === 'active') {
        this.statusText.textContent = 'SELECT WIRE TO CUT';
      }
    }, 2000);

    if (this.timeRemaining <= 0) {
      this.lose();
    }
  }

  win() {
    this.state = 'win';
    clearInterval(this.timerInterval);

    if (this.audio) {
      this.audio.stopAlarm();
      this.audio.playSuccess();
    }
    if (this.renderer) this.renderer.cutWire(CONFIG.correctWire - 1, true);

    setTimeout(() => {
      this.showScreen('win');
    }, 1500);
  }

  lose() {
    this.state = 'lose';
    clearInterval(this.timerInterval);
    this.timeRemaining = 0;
    this.updateTimerDisplay();

    if (this.audio) {
      this.audio.stopAlarm();
      this.audio.playExplosion();
    }

    // Explosion sequence
    this.flashScreen('white');
    this.shakeScreen(true);

    setTimeout(() => {
      this.showScreen('lose');
    }, 1500);
  }

  flashScreen(color) {
    this.screenFlash.className = color;
    setTimeout(() => {
      this.screenFlash.classList.add('fade-out');
      setTimeout(() => {
        this.screenFlash.className = '';
      }, 500);
    }, 150);
  }

  shakeScreen(heavy = false) {
    this.container.classList.remove('shaking', 'shaking-heavy');
    // Force reflow to restart animation
    void this.container.offsetWidth;
    this.container.classList.add(heavy ? 'shaking-heavy' : 'shaking');
    setTimeout(() => {
      this.container.classList.remove('shaking', 'shaking-heavy');
    }, heavy ? 800 : 400);
  }

  reset() {
    this.state = 'idle';
    clearInterval(this.timerInterval);
    this.timeRemaining = CONFIG.timerSeconds;
    this.cutWires.clear();
    this.timerValue.classList.remove('warning');
    this.statusText.textContent = 'SELECT WIRE TO CUT';
    if (this.audio) this.audio.stopAll();
    if (this.renderer) this.renderer.reset();
    this.showScreen('idle');
  }
}

// Initialize
const game = new Game();
```

**Step 5: Create placeholder files**

Create empty `js/audio.js` and `js/renderer.js` with just a comment so the script tags don't 404:

`js/audio.js`:
```js
// AudioManager — implemented in Task 2
```

`js/renderer.js`:
```js
// WireRenderer — implemented in Task 3
```

**Step 6: Verify**

Open `index.html` in browser. Verify:
- Black screen with red "WIRE DEFUSAL SYSTEM" title
- Pulsing "CLICK TO INITIATE" text
- Click transitions to active screen with timer counting down
- Timer turns red and pulses under 30s
- Timer reaching 0 shows lose screen with explosion flash + shake
- Clicking lose/win screen returns to idle

**Step 7: Commit**

```bash
git add index.html css/style.css js/config.js js/game.js js/audio.js js/renderer.js
git commit -m "feat: scaffold project with idle screen, timer, and game state machine"
```

---

### Task 2: Audio Manager (Synthesized Sounds)

**Goal:** Build an audio manager using Web Audio API that procedurally generates all sounds — no audio files needed.

**Files:**
- Modify: `js/audio.js`
- Modify: `js/game.js` (connect audio)

**Step 1: Implement `js/audio.js`**

```js
class AudioManager {
  constructor() {
    this.ctx = null; // Created on first user interaction
    this.alarmOscillators = [];
    this.alarmGain = null;
    this.isAlarmPlaying = false;
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startAlarm() {
    this.ensureContext();
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    // Two-tone siren effect
    this.alarmGain = this.ctx.createGain();
    this.alarmGain.gain.value = 0.3;
    this.alarmGain.connect(this.ctx.destination);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 440;
    osc1.connect(this.alarmGain);
    osc1.start();

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 523.25;
    osc2.connect(this.alarmGain);
    osc2.start();

    this.alarmOscillators = [osc1, osc2];

    // Siren modulation
    this._alarmInterval = setInterval(() => {
      const now = this.ctx.currentTime;
      osc1.frequency.linearRampToValueAtTime(660, now + 0.5);
      osc2.frequency.linearRampToValueAtTime(784, now + 0.5);
      setTimeout(() => {
        if (!this.isAlarmPlaying) return;
        const now2 = this.ctx.currentTime;
        osc1.frequency.linearRampToValueAtTime(440, now2 + 0.5);
        osc2.frequency.linearRampToValueAtTime(523.25, now2 + 0.5);
      }, 500);
    }, 1000);
  }

  stopAlarm() {
    this.isAlarmPlaying = false;
    clearInterval(this._alarmInterval);
    this.alarmOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.alarmOscillators = [];
    if (this.alarmGain) {
      this.alarmGain.disconnect();
      this.alarmGain = null;
    }
  }

  playSnip() {
    this.ensureContext();
    const duration = 0.08;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 2000;
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playZap() {
    this.ensureContext();
    const duration = 0.3;
    // Noise-like buzz using detuned oscillators
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    gain.connect(this.ctx.destination);

    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 100 + Math.random() * 300;
      osc.connect(gain);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }
  }

  playExplosion() {
    this.ensureContext();
    const duration = 1.5;
    // Low rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);

    // Noise burst using buffer
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start();
  }

  playSuccess() {
    this.ensureContext();
    // Descending power-down tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
  }

  stopAll() {
    this.stopAlarm();
  }
}
```

**Step 2: Connect audio in `js/game.js`**

In the `Game` constructor, after the DOM element setup, add:

```js
this.audio = new AudioManager();
```

No other changes needed — `game.js` already has `if (this.audio)` guards.

**Step 3: Verify**

Open in browser. Click to start:
- Two-tone alarm siren should play and modulate
- Timer reaching 0 should play explosion sound and stop alarm
- Clicking reset and restarting should work cleanly

**Step 4: Commit**

```bash
git add js/audio.js js/game.js
git commit -m "feat: add synthesized audio (alarm, zap, explosion, success)"
```

---

### Task 3: Wire Renderer (Canvas Drawing)

**Goal:** Draw the wires on the Canvas with glow effects, terminal blocks, and hover highlighting. Handle wire cut animations with particle effects.

**Files:**
- Modify: `js/renderer.js`

**Step 1: Implement `js/renderer.js`**

```js
class WireRenderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.wires = [];
    this.particles = [];
    this.animationId = null;
    this.hoveredWire = -1;
    this.time = 0;
    this.isRunning = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('touchstart', (e) => this.onTouch(e), { passive: false });
  }

  resize() {
    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    if (this.isRunning) this.generateWires();
  }

  generateWires() {
    this.wires = [];
    const count = CONFIG.wireCount;
    const margin = this.height * 0.2;
    const availableHeight = this.height - margin * 2;
    const spacing = availableHeight / (count + 1);
    const leftX = this.width * 0.1;
    const rightX = this.width * 0.9;

    for (let i = 0; i < count; i++) {
      const y = margin + spacing * (i + 1);
      // Add some vertical offset variation for natural look
      const yOffset = (Math.random() - 0.5) * spacing * 0.3;
      const sag = 20 + Math.random() * 30; // wire sag amount

      this.wires.push({
        index: i,
        color: CONFIG.wireColors[i % CONFIG.wireColors.length],
        label: CONFIG.wireLabels[i % CONFIG.wireLabels.length],
        leftX: leftX,
        leftY: y + yOffset,
        rightX: rightX,
        rightY: y + yOffset + (Math.random() - 0.5) * 20,
        sag: sag,
        cut: false,
        cutX: 0,
        cutProgress: 0, // 0 to 1 for cut animation
        glowPhase: Math.random() * Math.PI * 2,
        swayPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  start() {
    this.isRunning = true;
    this.time = 0;
    this.particles = [];
    this.generateWires();
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  reset() {
    this.stop();
    this.wires = [];
    this.particles = [];
    this.hoveredWire = -1;
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  animate() {
    if (!this.isRunning) return;
    this.time += 0.016; // ~60fps
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawTerminalBlocks();
    this.drawWires();
    this.updateAndDrawParticles();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  drawTerminalBlocks() {
    const ctx = this.ctx;
    const blockWidth = 40;
    const leftX = this.width * 0.1 - blockWidth / 2;
    const rightX = this.width * 0.9 - blockWidth / 2;
    const topY = this.height * 0.15;
    const blockHeight = this.height * 0.7;

    // Left terminal block
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.fillRect(leftX, topY, blockWidth, blockHeight);
    ctx.strokeRect(leftX, topY, blockWidth, blockHeight);

    // Right terminal block
    ctx.fillRect(rightX, topY, blockWidth, blockHeight);
    ctx.strokeRect(rightX, topY, blockWidth, blockHeight);

    // Connection points (screws)
    this.wires.forEach(wire => {
      this.drawScrew(wire.leftX, wire.leftY);
      this.drawScrew(wire.rightX, wire.rightY);
    });
  }

  drawScrew(x, y) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Cross pattern
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 3, y);
    ctx.moveTo(x, y - 3);
    ctx.lineTo(x, y + 3);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  getWirePath(wire) {
    // Returns bezier control points for a wire with sag
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

  drawWires() {
    const ctx = this.ctx;

    this.wires.forEach((wire, i) => {
      if (wire.cut) {
        this.drawCutWire(wire);
        return;
      }

      const path = this.getWirePath(wire);
      const isHovered = (i === this.hoveredWire);
      const glowIntensity = 0.3 + 0.2 * Math.sin(this.time * 3 + wire.glowPhase);

      // Glow effect
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(path.start.x, path.start.y);
      ctx.bezierCurveTo(
        path.cp1.x, path.cp1.y,
        path.cp2.x, path.cp2.y,
        path.end.x, path.end.y
      );
      ctx.strokeStyle = wire.color;
      ctx.lineWidth = isHovered ? 12 : 8;
      ctx.shadowColor = wire.color;
      ctx.shadowBlur = isHovered ? 25 : 15 * glowIntensity;
      ctx.globalAlpha = isHovered ? 0.6 : 0.3 * glowIntensity;
      ctx.stroke();
      ctx.restore();

      // Main wire
      ctx.beginPath();
      ctx.moveTo(path.start.x, path.start.y);
      ctx.bezierCurveTo(
        path.cp1.x, path.cp1.y,
        path.cp2.x, path.cp2.y,
        path.end.x, path.end.y
      );
      ctx.strokeStyle = wire.color;
      ctx.lineWidth = isHovered ? 6 : 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Wire label (near left terminal)
      if (isHovered) {
        ctx.fillStyle = wire.color;
        ctx.font = '12px "Share Tech Mono", monospace';
        ctx.fillText(wire.label, wire.leftX + 30, wire.leftY - 12);
      }
    });

    // Update cursor
    this.canvas.style.cursor = this.hoveredWire >= 0 ? 'crosshair' : 'default';
  }

  drawCutWire(wire) {
    const ctx = this.ctx;
    const path = this.getWirePath(wire);
    const t = 0.5; // cut at midpoint for simplicity (will use cutX in full version)
    const progress = Math.min(wire.cutProgress, 1);

    // Calculate bezier point at cut location
    const cutPoint = this.bezierPoint(path, t);

    // Left half - droops down
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
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Right half - droops down
    ctx.beginPath();
    ctx.moveTo(path.end.x, path.end.y);
    ctx.quadraticCurveTo(
      (path.end.x + cutPoint.x) / 2,
      (path.end.y + cutPoint.y) / 2 + droop,
      cutPoint.x + 5,
      cutPoint.y + droop
    );
    ctx.strokeStyle = wire.color;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Animate cut progress
    if (wire.cutProgress < 1) {
      wire.cutProgress += 0.05;
    }
  }

  bezierPoint(path, t) {
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

  // Hit detection: find which wire is near a point
  wireAtPoint(px, py) {
    const threshold = 15; // px tolerance for touch friendliness
    for (let i = this.wires.length - 1; i >= 0; i--) {
      const wire = this.wires[i];
      if (wire.cut) continue;
      const path = this.getWirePath(wire);

      // Sample points along bezier and check distance
      for (let t = 0; t <= 1; t += 0.02) {
        const point = this.bezierPoint(path, t);
        const dist = Math.sqrt(Math.pow(px - point.x, 2) + Math.pow(py - point.y, 2));
        if (dist < threshold) return i;
      }
    }
    return -1;
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.hoveredWire = this.wireAtPoint(x, y);
  }

  onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const wireIndex = this.wireAtPoint(x, y);
    if (wireIndex >= 0) {
      this.game.cutWire(wireIndex);
    }
  }

  onTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const wireIndex = this.wireAtPoint(x, y);
    if (wireIndex >= 0) {
      this.game.cutWire(wireIndex);
    }
  }

  cutWire(wireIndex, isCorrect) {
    const wire = this.wires[wireIndex];
    if (!wire || wire.cut) return;
    wire.cut = true;
    wire.cutProgress = 0;

    // Spawn spark particles at cut point
    const path = this.getWirePath(wire);
    const cutPoint = this.bezierPoint(path, 0.5);
    this.spawnSparks(cutPoint.x, cutPoint.y, wire.color, isCorrect ? 30 : 15);

    // If correct wire: power down all remaining wires after delay
    if (isCorrect) {
      setTimeout(() => {
        this.wires.forEach(w => {
          if (!w.cut) {
            w.cut = true;
            w.cutProgress = 1; // instant droop
          }
        });
      }, 500);
    }
  }

  spawnSparks(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        color: color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  updateAndDrawParticles() {
    const ctx = this.ctx;
    this.particles = this.particles.filter(p => p.life > 0);

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.life -= p.decay;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    });
  }
}
```

**Step 2: Verify**

Open in browser. Click to start:
- Wires should appear connecting left and right terminal blocks
- Wires should glow and gently sway
- Hovering over a wire highlights it and shows label
- Crosshair cursor on wire hover
- Clicking a wire cuts it with spark particles and drooping animation

**Step 3: Commit**

```bash
git add js/renderer.js
git commit -m "feat: add canvas wire renderer with glow, hover, cut animations, and particles"
```

---

### Task 4: Connect Renderer to Game + Final Integration

**Goal:** Wire the renderer into the game state machine, add the audio snip sound on cut, and handle fullscreen.

**Files:**
- Modify: `js/game.js`

**Step 1: Update Game constructor to create renderer**

In `js/game.js`, in the `constructor`, after `this.audio = new AudioManager();`, add:

```js
this.renderer = new WireRenderer(document.getElementById('wire-canvas'), this);
```

**Step 2: Add fullscreen request on start**

In the `start()` method, add fullscreen request after `this.state = 'active';`:

```js
// Request fullscreen for immersive experience
const el = document.documentElement;
if (el.requestFullscreen) {
  el.requestFullscreen().catch(() => {});
} else if (el.webkitRequestFullscreen) {
  el.webkitRequestFullscreen();
}
```

**Step 3: Add snip sound to cutWire**

In the `cutWire()` method, right after the `this.cutWires.add(wireIndex);` line, add:

```js
if (this.audio) this.audio.playSnip();
```

**Step 4: Stop renderer on win/lose**

In both `win()` and `lose()`, inside the `setTimeout` callback (before `this.showScreen`), add:

```js
if (this.renderer) this.renderer.stop();
```

**Step 5: Verify full flow**

1. Open in browser
2. See black idle screen with pulsing text
3. Click — alarm starts, timer counts down, wires appear with glow
4. Hover over wires — highlights with crosshair cursor
5. Click wrong wire — spark particles, red flash, screen shake, timer drops 30s, zap sound
6. Click correct wire — snip + sparks, alarm stops, power-down sound, wires all droop, win screen after 1.5s
7. Click win screen — returns to idle
8. Test lose path: let timer run down — explosion sound, white flash, heavy shake, lose screen
9. Click lose screen — returns to idle

**Step 6: Commit**

```bash
git add js/game.js
git commit -m "feat: integrate renderer, audio, and fullscreen for complete game loop"
```

---

### Task 5: Polish & Final Touches

**Goal:** Add finishing touches: better explosion effect on canvas, ensure touch works for tablets, add meta tags for tablet use.

**Files:**
- Modify: `index.html` (add meta tags)
- Modify: `js/renderer.js` (explosion particles)
- Modify: `js/game.js` (explosion canvas effect)

**Step 1: Add tablet meta tags to `index.html`**

In the `<head>`, add after the viewport meta:

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#000000">
```

**Step 2: Add explosion particle burst to renderer**

Add a method to `WireRenderer`:

```js
explode() {
  // Massive particle burst from center
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
  // Keep animating particles even after stop
  const particleLoop = () => {
    if (this.particles.length === 0) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.updateAndDrawParticles();
    requestAnimationFrame(particleLoop);
  };
  particleLoop();
}
```

**Step 3: Call explode from game.lose()**

In `game.js` `lose()`, before the `setTimeout`, add:

```js
if (this.renderer) this.renderer.explode();
```

**Step 4: Verify everything**

Full playthrough on both desktop and tablet simulator:
- All states work correctly
- Touch events work
- Fullscreen activates
- All sounds play
- All animations are smooth
- Timer penalty and warning states work
- Explosion particles on lose

**Step 5: Commit**

```bash
git add index.html js/renderer.js js/game.js
git commit -m "feat: add explosion particles, tablet meta tags, and polish"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Scaffold + idle screen + game state machine + full CSS theme | All files created |
| 2 | Synthesized audio (alarm, zap, explosion, success) | `js/audio.js` |
| 3 | Canvas wire renderer with glow, hover, cut, particles | `js/renderer.js` |
| 4 | Connect all modules, add fullscreen | `js/game.js` |
| 5 | Polish: explosion particles, tablet support | All files |
