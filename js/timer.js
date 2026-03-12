class CountdownTimer {
  constructor() {
    this.state = 'waiting'; // waiting, running, paused, finished
    this.totalMs = CONFIG.countdownSeconds * 1000;
    this.remainingMs = this.totalMs;
    this.lastFrameTime = null;
    this.animationId = null;
    this.tickInterval = null;

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
    this._stopTickSound();
    this.state = 'waiting';
  }

  resetTimer() {
    this._stopLoop();
    this._stopTickSound();
    this.state = 'waiting';
    this.remainingMs = this.totalMs;
    this.lastFrameTime = null;
    this._updateDisplay();
    this.display.classList.remove('warning');
    this.prompt.style.display = '';
    this.pausedIndicator.style.visibility = 'hidden';
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
    this._stopTickSound();
    this.pausedIndicator.style.visibility = 'visible';
  }

  _resume() {
    this.state = 'running';
    this.pausedIndicator.style.visibility = 'hidden';
    this.lastFrameTime = performance.now();
    if (this.remainingMs <= 10000) this._startTickSound();
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

    // Start ticking in last 10 seconds
    if (this.remainingMs <= 10000 && !this.tickInterval) {
      this._startTickSound();
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
    this._stopTickSound();
    this.remainingMs = 0;
    this._updateDisplay();
    this.pausedIndicator.style.visibility = 'hidden';
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

  _startTickSound() {
    this._stopTickSound();
    if (this.audio) this.audio.playTick();
    this.tickInterval = setInterval(() => {
      if (this.audio && this.state === 'running') this.audio.playTick();
    }, 1000);
  }

  _stopTickSound() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  _stopLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
