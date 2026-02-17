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
      const yOffset = (Math.random() - 0.5) * spacing * 0.3;
      const sag = 20 + Math.random() * 30;

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
        cutProgress: 0,
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
    this.time += 0.016;
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

  drawScrew(x, y) {
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

  getWirePath(wire) {
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

      // Wire label
      if (isHovered) {
        ctx.fillStyle = wire.color;
        ctx.font = '12px "Share Tech Mono", monospace';
        ctx.fillText(wire.label, wire.leftX + 30, wire.leftY - 12);
      }
    });

    this.canvas.style.cursor = this.hoveredWire >= 0 ? 'crosshair' : 'default';
  }

  drawCutWire(wire) {
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
    ctx.lineWidth = 4;
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
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;

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

  wireAtPoint(px, py) {
    const threshold = 15;
    for (let i = this.wires.length - 1; i >= 0; i--) {
      const wire = this.wires[i];
      if (wire.cut) continue;
      const path = this.getWirePath(wire);

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

    const path = this.getWirePath(wire);
    const cutPoint = this.bezierPoint(path, 0.5);
    this.spawnSparks(cutPoint.x, cutPoint.y, wire.color, isCorrect ? 30 : 15);

    if (isCorrect) {
      setTimeout(() => {
        this.wires.forEach(w => {
          if (!w.cut) {
            w.cut = true;
            w.cutProgress = 1;
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
      p.vy += 0.15;
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
