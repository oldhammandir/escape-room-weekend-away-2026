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
