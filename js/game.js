class Game {
  constructor() {
    this.state = 'idle'; // idle, active, code, win, lose
    this.timeRemaining = CONFIG.timerSeconds;
    this.timerInterval = null;
    this.cutWires = new Set();
    this.codeEntry = '';

    // DOM elements
    this.container = document.getElementById('game-container');
    this.screens = {
      idle: document.getElementById('idle-screen'),
      active: document.getElementById('active-screen'),
      code: document.getElementById('code-screen'),
      win: document.getElementById('win-screen'),
      lose: document.getElementById('lose-screen'),
    };
    this.timerValue = document.getElementById('timer-value');
    this.codeTimerValue = document.getElementById('code-timer-value');
    this.statusText = document.getElementById('status-text');
    this.screenFlash = document.getElementById('screen-flash');
    this.codeDigits = document.querySelectorAll('.code-digit');
    this.codeStatus = document.getElementById('code-status');

    this.audio = new AudioManager();
    this.renderer = new WireRenderer(document.getElementById('wire-canvas'), this);

    this.bindEvents();
  }

  bindEvents() {
    this.screens.idle.addEventListener('click', () => this.start());
    this.screens.win.addEventListener('click', () => this.reset());
    this.screens.lose.addEventListener('click', () => this.reset());

    // Keypad buttons
    document.getElementById('code-keypad').addEventListener('click', (e) => {
      const btn = e.target.closest('.keypad-btn');
      if (!btn || this.state !== 'code') return;
      const key = btn.dataset.key;
      if (key === 'clear') {
        this.clearCode();
      } else if (key === 'enter') {
        this.submitCode();
      } else {
        this.enterDigit(key);
      }
    });

    // Keyboard input for code screen
    this._onCodeKeyDown = (e) => {
      if (this.state !== 'code') return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        this.enterDigit(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.submitCode();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.clearCode();
      }
    };
    document.addEventListener('keydown', this._onCodeKeyDown);
  }

  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    this.screens[name].classList.add('active');
  }

  start() {
    if (this.state !== 'idle') return;
    this.state = 'active';

    // Request fullscreen for immersive experience
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }

    this.timeRemaining = CONFIG.timerSeconds;
    this.cutWires.clear();
    this.showScreen('active');
    this.updateTimerDisplay();
    this.startTimer();
    if (this.audio) this.audio.startAlarm();
    if (this.renderer) this.renderer.start();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.state === 'active') {
        this.updateTimerDisplay();
      } else if (this.state === 'code') {
        this.updateCodeTimerDisplay();
      }

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
    if (this.audio) this.audio.playSnip();

    if (wireIndex === CONFIG.correctWire - 1) {
      this.win();
    } else {
      this.penalty(wireIndex);
    }
  }

  penalty(wireIndex) {
    this.timeRemaining = Math.max(0, this.timeRemaining - CONFIG.penaltySeconds);
    this.updateTimerDisplay();

    this.flashScreen('red');
    this.shakeScreen();

    if (this.audio) this.audio.playZap();
    if (this.renderer) this.renderer.cutWire(wireIndex, false);

    this.statusText.textContent = 'WRONG WIRE \u2014 PENALTY ' + CONFIG.penaltySeconds + 's';
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
    // Correct wire cut — transition to code entry
    this.state = 'code';

    if (this.audio) this.audio.stopAlarm();
    if (this.renderer) this.renderer.cutWire(CONFIG.correctWire - 1, true);

    this.codeEntry = '';
    this.updateCodeDisplay();
    this.codeStatus.textContent = '';

    setTimeout(() => {
      if (this.renderer) this.renderer.stop();
      this.showScreen('code');
      this.updateCodeTimerDisplay();
    }, 1500);
  }

  enterDigit(digit) {
    if (this.codeEntry.length >= CONFIG.correctCode.length) return;
    this.codeEntry += digit;
    this.updateCodeDisplay();
  }

  clearCode() {
    this.codeEntry = '';
    this.updateCodeDisplay();
    this.codeStatus.textContent = '';
  }

  submitCode() {
    if (this.codeEntry.length !== CONFIG.correctCode.length) return;

    if (this.codeEntry === CONFIG.correctCode) {
      this.codeCorrect();
    } else {
      this.codePenalty();
    }
  }

  codeCorrect() {
    this.state = 'win';
    clearInterval(this.timerInterval);
    if (this.audio) this.audio.playSuccess();

    setTimeout(() => {
      this.showScreen('win');
    }, 1000);
  }

  codePenalty() {
    this.timeRemaining = Math.max(0, this.timeRemaining - CONFIG.codePenaltySeconds);
    this.updateCodeTimerDisplay();

    this.flashScreen('red');
    this.shakeScreen();
    if (this.audio) this.audio.playZap();

    this.codeStatus.textContent = 'WRONG CODE — PENALTY ' + CONFIG.codePenaltySeconds + 's';
    this.codeEntry = '';
    this.updateCodeDisplay();

    setTimeout(() => {
      if (this.state === 'code') {
        this.codeStatus.textContent = '';
      }
    }, 2000);

    if (this.timeRemaining <= 0) {
      this.lose();
    }
  }

  updateCodeDisplay() {
    const len = CONFIG.correctCode.length;
    for (let i = 0; i < len; i++) {
      if (i < this.codeEntry.length) {
        this.codeDigits[i].textContent = this.codeEntry[i];
        this.codeDigits[i].classList.add('filled');
      } else {
        this.codeDigits[i].textContent = '_';
        this.codeDigits[i].classList.remove('filled');
      }
    }
  }

  updateCodeTimerDisplay() {
    const mins = Math.floor(Math.max(0, this.timeRemaining) / 60);
    const secs = Math.max(0, this.timeRemaining) % 60;
    this.codeTimerValue.textContent =
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

    if (this.timeRemaining <= 30) {
      this.codeTimerValue.classList.add('warning');
    } else {
      this.codeTimerValue.classList.remove('warning');
    }
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

    if (this.renderer) this.renderer.explode();
    this.flashScreen('white');
    this.shakeScreen(true);

    setTimeout(() => {
      if (this.renderer) this.renderer.stop();
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
    this.codeEntry = '';
    this.timerValue.classList.remove('warning');
    this.codeTimerValue.classList.remove('warning');
    this.statusText.textContent = 'SELECT WIRE TO CUT';
    if (this.audio) this.audio.stopAll();
    if (this.renderer) this.renderer.reset();
    this.showScreen('idle');
  }

  show() {
    this.showScreen('idle');
  }

  hide() {
    this.reset();
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
  }
}

// Game instance created at load, but idle screen not shown until menu launches it
const game = new Game();
