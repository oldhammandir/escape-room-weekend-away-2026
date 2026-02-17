class AudioManager {
  constructor() {
    this.ctx = null;
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
