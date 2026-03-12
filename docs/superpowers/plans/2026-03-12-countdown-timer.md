# Countdown Timer + Menu System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a menu system and countdown timer activity to the escape room app.

**Architecture:** Menu becomes the app entry point; each activity (wire defusal, countdown timer) is a self-contained module launched from the menu. Activities communicate with the menu only via show/hide/reset. The timer uses DOM rendering (no canvas) and Web Audio API for the buzzer.

**Tech Stack:** Vanilla JS, HTML, CSS, Web Audio API (no dependencies)

**Spec:** `docs/superpowers/specs/2026-03-12-countdown-timer-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `js/config.js` | Modify | Add `countdownSeconds: 90` |
| `js/audio.js` | Modify | Add `playBuzzer()` method |
| `js/timer.js` | Create | Countdown timer activity (3 states, spacebar/touch, display) |
| `js/menu.js` | Create | Menu screen logic, activity launching |
| `js/game.js` | Modify | Defer idle screen, add `show()`/`hide()`/`reset()` for menu integration |
| `index.html` | Modify | Add menu + timer HTML sections, new script tags, update title |
| `css/style.css` | Modify | Add menu, timer, and menu-button styles |

---

## Chunk 1: Foundation (Config, Audio, HTML structure)

### Task 1: Add countdown config and buzzer audio

**Files:**
- Modify: `js/config.js`
- Modify: `js/audio.js`

- [ ] **Step 1: Add countdown duration to config**

In `js/config.js`, add `countdownSeconds: 90` to the CONFIG object:

```js
const CONFIG = {
  timerSeconds: 120,
  penaltySeconds: 30,
  wireCount: 5,
  correctWire: 3,
  wireColors: ['#ff3333', '#3388ff', '#33ff88', '#ffdd33', '#ffffff'],
  wireLabels: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'WHITE'],
  countdownSeconds: 90,
};
```

- [ ] **Step 2: Add playBuzzer() to AudioManager**

In `js/audio.js`, add this method to the `AudioManager` class, after the `playSuccess()` method (before `stopAll()`):

```js
playBuzzer() {
  this.ensureContext();
  const duration = 1.0;
  const gain = this.ctx.createGain();
  gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
  gain.connect(this.ctx.destination);

  const osc = this.ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 120;
  osc.connect(gain);
  osc.start();
  osc.stop(this.ctx.currentTime + duration);

  const osc2 = this.ctx.createOscillator();
  osc2.type = 'square';
  osc2.frequency.value = 80;
  osc2.connect(gain);
  osc2.start();
  osc2.stop(this.ctx.currentTime + duration);
}
```

- [ ] **Step 3: Test buzzer in browser console**

Open `index.html` in a browser, open the console, and run:

```js
const audio = new AudioManager();
audio.playBuzzer();
```

Expected: a harsh ~1 second buzzer sound plays.

- [ ] **Step 4: Commit**

```bash
git add js/config.js js/audio.js
git commit -m "feat: add countdown config and buzzer audio"
```

### Task 2: Add HTML structure for menu and timer screens

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update page title**

Change `<title>WIRE DEFUSAL SYSTEM</title>` to `<title>ESCAPE ROOM</title>`.

- [ ] **Step 2: Add menu screen HTML**

Add this as the first child of `#game-container`, before the idle screen. The menu screen gets the `active` class (it's the new default). Remove the `active` class from `#idle-screen`.

```html
<!-- Menu Screen -->
<div id="menu-screen" class="screen active">
  <div class="menu-content">
    <div class="menu-title">ESCAPE ROOM</div>
    <div class="menu-subtitle">SELECT ACTIVITY</div>
    <div class="menu-buttons">
      <button class="menu-btn" data-activity="wire-defusal">
        <span class="menu-btn-icon">&#9889;</span>
        <span class="menu-btn-label">WIRE DEFUSAL</span>
      </button>
      <button class="menu-btn" data-activity="countdown-timer">
        <span class="menu-btn-icon">&#9201;</span>
        <span class="menu-btn-label">COUNTDOWN TIMER</span>
      </button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add timer screen HTML**

Add this after the lose screen, before the scanline overlay:

```html
<!-- Timer Screen -->
<div id="timer-screen" class="screen">
  <div class="timer-activity-content">
    <div id="countdown-display">
      <div class="timer-label">COUNTDOWN</div>
      <div id="countdown-value">1:30.000</div>
    </div>
    <div id="countdown-prompt" class="idle-prompt">TAP OR PRESS SPACEBAR TO START</div>
    <div id="countdown-paused" class="countdown-paused" style="display:none;">PAUSED</div>
    <div id="countdown-finished" style="display:none;">
      <div class="countdown-timesup">TIMES UP!</div>
      <button id="countdown-reset-btn" class="reset-btn">RESET</button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Add global corner menu button**

Add a single menu button inside `#game-container`, positioned absolutely, hidden by default, shown when an activity is active. Add this right before the scanline overlay `<div id="scanlines">`:

```html
<button id="activity-menu-btn" class="corner-menu-btn" style="display:none;">&#9666; MENU</button>
```

This button lives outside all `.screen` divs and uses `z-index: 50` to float above activity screens. The menu module shows/hides it when launching/returning from activities.

- [ ] **Step 5: Add new script tags**

Add these script tags after the `game.js` script tag, in this order:

```html
<script src="js/timer.js"></script>
<script src="js/menu.js"></script>
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add menu and timer HTML structure"
```

### Task 3: Add CSS styles for menu, timer, and corner button

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Add menu screen styles**

Append after the `/* === IDLE SCREEN === */` section (before `/* === ACTIVE SCREEN === */`):

```css
/* === MENU SCREEN === */
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
```

- [ ] **Step 2: Add corner menu button styles**

Append after the menu screen styles:

```css
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
```

- [ ] **Step 3: Add countdown timer styles**

Append after the corner menu button styles:

```css
/* === COUNTDOWN TIMER === */
.timer-activity-content {
  text-align: center;
}

#countdown-value {
  font-size: clamp(4rem, 12vw, 10rem);
  color: #33ff88;
  text-shadow: 0 0 20px rgba(51, 255, 136, 0.5), 0 0 40px rgba(51, 255, 136, 0.2);
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
  margin-bottom: 2rem;
}

#countdown-value.warning {
  color: #ff3333;
  text-shadow: 0 0 20px rgba(255, 51, 51, 0.5), 0 0 40px rgba(255, 51, 51, 0.2);
  animation: pulse-timer 0.5s ease-in-out infinite;
}

#countdown-prompt {
  margin-top: 1rem;
}

.countdown-paused {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  color: #ffdd33;
  text-shadow: 0 0 15px rgba(255, 221, 51, 0.5);
  letter-spacing: 0.3em;
  animation: pulse-text 1.5s ease-in-out infinite;
  margin-top: 1rem;
}

.countdown-timesup {
  font-size: clamp(2.5rem, 6vw, 5rem);
  color: #ff3333;
  text-shadow: 0 0 30px rgba(255, 51, 51, 0.6), 0 0 60px rgba(255, 51, 51, 0.3);
  letter-spacing: 0.3em;
  margin-bottom: 2rem;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 51, 51, 0.3);
  color: #ff3333;
  font-family: 'Share Tech Mono', monospace;
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  padding: 0.8rem 2.5rem;
  cursor: pointer;
  letter-spacing: 0.2em;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: rgba(255, 51, 51, 0.15);
  border-color: rgba(255, 51, 51, 0.6);
}
```

- [ ] **Step 4: Commit**

```bash
git add css/style.css
git commit -m "feat: add menu, timer, and corner button CSS styles"
```

---

## Chunk 2: Timer Activity + Menu Logic + Game Refactor

### Task 4: Create the countdown timer module

**Files:**
- Create: `js/timer.js`

- [ ] **Step 1: Write the full timer.js file**

```js
class CountdownTimer {
  constructor() {
    this.state = 'waiting'; // waiting, running, paused, finished
    this.totalMs = CONFIG.countdownSeconds * 1000;
    this.remainingMs = this.totalMs;
    this.lastFrameTime = null;
    this.animationId = null;

    // DOM elements
    this.screen = document.getElementById('timer-screen');
    this.display = document.getElementById('countdown-value');
    this.prompt = document.getElementById('countdown-prompt');
    this.pausedIndicator = document.getElementById('countdown-paused');
    this.finishedContainer = document.getElementById('countdown-finished');
    this.resetBtn = document.getElementById('countdown-reset-btn');

    this.audio = null; // set by menu

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onTap = this._onTap.bind(this);

    this.resetBtn.addEventListener('click', () => this.resetTimer());
  }

  show(audio) {
    this.audio = audio;
    this.screen.classList.add('active');
    document.addEventListener('keydown', this._onKeyDown);
    this.screen.addEventListener('click', this._onTap);
    this.resetTimer();
  }

  hide() {
    this.screen.classList.remove('active');
    document.removeEventListener('keydown', this._onKeyDown);
    this.screen.removeEventListener('click', this._onTap);
    this._stopLoop();
    this.state = 'waiting';
  }

  resetTimer() {
    this._stopLoop();
    this.state = 'waiting';
    this.remainingMs = this.totalMs;
    this.lastFrameTime = null;
    this._updateDisplay();
    this.display.classList.remove('warning');
    this.prompt.style.display = '';
    this.pausedIndicator.style.display = 'none';
    this.finishedContainer.style.display = 'none';
  }

  _onKeyDown(e) {
    if (e.code !== 'Space') return;
    e.preventDefault();
    this._handleInput();
  }

  _onTap(e) {
    // Ignore clicks on buttons
    if (e.target.closest('button')) return;
    this._handleInput();
  }

  _handleInput() {
    if (this.state === 'waiting') {
      this._start();
    } else if (this.state === 'running') {
      this._pause();
    } else if (this.state === 'paused') {
      this._resume();
    }
    // finished state: spacebar ignored, must click RESET
  }

  _start() {
    this.state = 'running';
    this.prompt.style.display = 'none';
    this.lastFrameTime = performance.now();
    this._tick();
  }

  _pause() {
    this.state = 'paused';
    this._stopLoop();
    this.pausedIndicator.style.display = '';
  }

  _resume() {
    this.state = 'running';
    this.pausedIndicator.style.display = 'none';
    this.lastFrameTime = performance.now();
    this._tick();
  }

  _tick() {
    if (this.state !== 'running') return;

    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.remainingMs = Math.max(0, this.remainingMs - delta);
    this._updateDisplay();

    // Warning state under 30 seconds
    if (this.remainingMs <= 30000) {
      this.display.classList.add('warning');
    } else {
      this.display.classList.remove('warning');
    }

    if (this.remainingMs <= 0) {
      this._finish();
      return;
    }

    this.animationId = requestAnimationFrame(() => this._tick());
  }

  _finish() {
    this.state = 'finished';
    this._stopLoop();
    this.remainingMs = 0;
    this._updateDisplay();
    this.pausedIndicator.style.display = 'none';
    this.finishedContainer.style.display = '';
    if (this.audio) this.audio.playBuzzer();
  }

  _updateDisplay() {
    const mins = Math.floor(this.remainingMs / 60000);
    const secs = Math.floor((this.remainingMs % 60000) / 1000);
    const ms = Math.floor(this.remainingMs % 1000);

    this.display.textContent =
      mins + ':' +
      String(secs).padStart(2, '0') + '.' +
      String(ms).padStart(3, '0');
  }

  _stopLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/timer.js
git commit -m "feat: add countdown timer activity module"
```

### Task 5: Refactor game.js for menu integration

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: Remove auto-idle-screen and add show/hide methods**

Replace the bottom of `game.js`. The `Game` constructor should no longer show the idle screen by default (the menu handles that now). Also, the `reset()` method should not show idle screen — it should call `onReset` callback if set.

Changes to `js/game.js`:

1. In the constructor, remove the implicit idle screen display (currently `#idle-screen` has `active` class in HTML, which we already removed in Task 2).

2. Add `show()` and `hide()` methods:

After the `reset()` method, add:

```js
show() {
  this.showScreen('idle');
}

hide() {
  this.reset();
  Object.values(this.screens).forEach(s => s.classList.remove('active'));
}
```

3. Change `reset()` to go back to idle screen within the wire defusal activity (not menu):

The existing `reset()` already does `this.showScreen('idle')` which is correct — when playing wire defusal, win/lose screens click back to idle. The menu button is handled separately by `menu.js`.

4. Remove the auto-initialization at the bottom. Change:

```js
// Initialize
const game = new Game();
```

To just the class definition (no auto-init). The menu will create the instance. Actually, to keep it simple and avoid refactoring how `WireRenderer` references `game`, keep the global but don't auto-show:

```js
// Game instance created at load, but idle screen not shown until menu launches it
const game = new Game();
```

The key change is that `#idle-screen` no longer has `class="screen active"` in HTML (done in Task 2), so nothing shows until menu calls `game.show()`.

- [ ] **Step 2: Commit**

```bash
git add js/game.js
git commit -m "refactor: add show/hide to Game for menu integration"
```

### Task 6: Create the menu module

**Files:**
- Create: `js/menu.js`

- [ ] **Step 1: Write the full menu.js file**

```js
class Menu {
  constructor() {
    this.screen = document.getElementById('menu-screen');
    this.menuBtn = document.getElementById('activity-menu-btn');
    this.activeActivity = null;

    // Activity instances (game is already created globally)
    this.timer = new CountdownTimer();

    // Menu button clicks
    this.screen.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.launch(btn.dataset.activity);
      });
    });

    // Corner menu button returns to menu
    this.menuBtn.addEventListener('click', () => this.returnToMenu());
  }

  launch(activity) {
    this.screen.classList.remove('active');
    this.menuBtn.style.display = '';
    this.activeActivity = activity;

    if (activity === 'wire-defusal') {
      game.show();
    } else if (activity === 'countdown-timer') {
      this.timer.show(game.audio);
    }
  }

  returnToMenu() {
    this.menuBtn.style.display = 'none';

    if (this.activeActivity === 'wire-defusal') {
      game.hide();
    } else if (this.activeActivity === 'countdown-timer') {
      this.timer.hide();
    }

    this.activeActivity = null;
    this.screen.classList.add('active');
  }
}

// Initialize
const menu = new Menu();
```

- [ ] **Step 2: Commit**

```bash
git add js/menu.js
git commit -m "feat: add menu system for activity selection"
```

### Task 7: Manual integration test

- [ ] **Step 1: Test menu → wire defusal flow**

Open `index.html` in browser. Verify:
1. Menu screen shows with "ESCAPE ROOM" title and two buttons
2. Click "WIRE DEFUSAL" → idle screen appears with corner MENU button
3. Click idle screen → game starts normally (alarm, wires, timer)
4. Click MENU corner button → returns to menu (game resets)

- [ ] **Step 2: Test menu → countdown timer flow**

1. Click "COUNTDOWN TIMER" → timer screen shows `1:30.000` with "TAP OR PRESS SPACEBAR TO START"
2. Press spacebar → timer starts counting down with millisecond precision
3. Press spacebar → timer pauses, "PAUSED" indicator appears
4. Press spacebar → timer resumes
5. Click MENU corner button → returns to menu (timer resets)

- [ ] **Step 3: Test timer expiry**

1. Launch countdown timer
2. Wait for timer to reach 0 (or temporarily set `CONFIG.countdownSeconds = 5` for quick test)
3. Verify: "TIMES UP!" appears, buzzer sounds, RESET button visible
4. Press spacebar → nothing happens (ignored in finished state)
5. Click RESET → timer resets to `1:30.000` and waiting state

- [ ] **Step 4: Test touch/tap input**

1. Open in mobile mode (browser dev tools) or actual tablet
2. Tap the timer area → starts/pauses/resumes (same as spacebar)
3. Tap RESET button → resets

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete menu system and countdown timer activity"
```
