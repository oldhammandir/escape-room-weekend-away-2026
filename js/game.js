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

    this.audio = new AudioManager();
    this.renderer = new WireRenderer(document.getElementById('wire-canvas'), this);

    this.bindEvents();
  }

  bindEvents() {
    this.screens.idle.addEventListener('click', () => this.start());
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
      if (this.renderer) this.renderer.stop();
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
    this.timerValue.classList.remove('warning');
    this.statusText.textContent = 'SELECT WIRE TO CUT';
    if (this.audio) this.audio.stopAll();
    if (this.renderer) this.renderer.reset();
    this.showScreen('idle');
  }
}

// Initialize
const game = new Game();
