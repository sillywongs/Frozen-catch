// Original canvas vector art: ice, fish, penguins, igloos, splash and melt.
import { cloneGrid, COLOR_NAMES } from '../logic/board.js';

const COLOR_STYLES = [
  { fill: '#ff7a6b', pattern: 'spots' },
  { fill: '#2ec4b6', pattern: 'triangles' },
  { fill: '#ffd166', pattern: 'stripes' },
  { fill: '#9b5de5', pattern: 'diamonds' },
  { fill: '#7bd389', pattern: 'dots' },
  { fill: '#ff8fab', pattern: 'zigzag' },
  { fill: '#4cc9f0', pattern: 'doublestripe' },
  { fill: '#f4a261', pattern: 'cross' },
];

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.anims = [];
    this.particles = [];
    this.reveal = null;
    this.raf = null;
    this.lastState = null;
    this.reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = this.canvas.clientWidth || 320;
    const height = this.canvas.clientHeight || 400;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = width;
    this.height = height;
    if (this.lastState) this.render(this.lastState);
  }

  layout(state) {
    const margin = 10;
    const boardHeight = this.height * 0.74;
    const cell = Math.min((this.width - margin * 2) / state.cols, (boardHeight - margin) / state.rows);
    const boardWidth = cell * state.cols;
    return {
      cell,
      boardX: (this.width - boardWidth) / 2,
      boardY: margin + (boardHeight - margin - cell * state.rows) / 2,
      slotY: this.height * 0.78,
    };
  }

  render(state) {
    this.lastState = state;
    const ctx = this.ctx;
    const { cell, boardX, boardY, slotY } = this.layout(state);
    ctx.clearRect(0, 0, this.width, this.height);

    const water = ctx.createLinearGradient(0, 0, 0, this.height);
    water.addColorStop(0, '#0b2a4a');
    water.addColorStop(1, '#155d84');
    ctx.fillStyle = water;
    ctx.fillRect(0, 0, this.width, this.height);

    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const x = boardX + c * cell;
        const y = boardY + r * cell;
        const iceBlock = state.grid[r][c];
        if (iceBlock) this.drawIceCell(x, y, cell, iceBlock);
        else this.drawOpenWater(x, y, cell);
      }
    }

    for (const igloo of state.igloos) {
      this.drawIgloo(boardX + igloo.c * cell, boardY + igloo.r * cell, cell);
    }

    this.drawSlots(state, slotY, cell);
    this.drawAnimations(state, cell, boardX, boardY);
    this.drawParticles();
    if (this.reveal) this.drawReveal(state, cell, boardX, boardY);
  }

  drawOpenWater(x, y, cell) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(9,42,74,.55)';
    ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    ctx.strokeStyle = 'rgba(160,220,255,.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + cell * 0.2, y + cell * 0.55);
    ctx.quadraticCurveTo(x + cell * 0.5, y + cell * 0.4, x + cell * 0.8, y + cell * 0.58);
    ctx.stroke();
  }

  drawIceCell(x, y, cell, iceBlock) {
    const ctx = this.ctx;
    const pad = 2;
    ctx.fillStyle = 'rgba(215,236,248,.93)';
    this.roundRect(x + pad, y + pad, cell - pad * 2, cell - pad * 2, cell * 0.16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.65)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,170,205,.35)';
    ctx.beginPath();
    ctx.moveTo(x + cell * 0.18, y + cell * 0.75);
    ctx.lineTo(x + cell * 0.45, y + cell * 0.5);
    ctx.lineTo(x + cell * 0.72, y + cell * 0.68);
    ctx.stroke();
    this.drawFish(x + cell / 2, y + cell / 2, cell * 0.62, iceBlock);
  }

  drawFish(x, y, size, cell) {
    const ctx = this.ctx;
    if (cell.m) {
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38607f';
      ctx.font = 'bold ' + Math.round(size * 0.42) + 'px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x, y + 1);
      return;
    }
    const style = COLOR_STYLES[cell.c % COLOR_STYLES.length];
    const bodyW = size * 0.52;
    const bodyH = size * 0.34;
    ctx.fillStyle = style.fill;
    ctx.beginPath();
    ctx.ellipse(x, y, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + bodyW / 2 - 1, y);
    ctx.lineTo(x + bodyW / 2 + size * 0.16, y - bodyH * 0.42);
    ctx.lineTo(x + bodyW / 2 + size * 0.16, y + bodyH * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(x - bodyW * 0.22, y - bodyH * 0.12, Math.max(1, size * 0.035), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,50,80,.5)';
    ctx.lineWidth = Math.max(1, size * 0.035);
    this.drawPattern(x, y, size, style.pattern);
    if (cell.l) {
      ctx.fillStyle = 'rgba(230,246,255,.55)';
      this.roundRect(x - size * 0.36, y - size * 0.36, size * 0.72, size * 0.72, size * 0.12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawPattern(x, y, size, pattern) {
    const ctx = this.ctx;
    ctx.beginPath();
    if (pattern === 'spots') {
      ctx.arc(x - size * 0.08, y + size * 0.05, size * 0.05, 0, Math.PI * 2);
      ctx.arc(x + size * 0.08, y - size * 0.04, size * 0.04, 0, Math.PI * 2);
    } else if (pattern === 'triangles') {
      ctx.moveTo(x - size * 0.12, y + size * 0.08);
      ctx.lineTo(x, y - size * 0.06);
      ctx.lineTo(x + size * 0.12, y + size * 0.08);
      ctx.closePath();
    } else if (pattern === 'stripes') {
      ctx.moveTo(x - size * 0.16, y);
      ctx.lineTo(x + size * 0.1, y);
      ctx.moveTo(x - size * 0.1, y + size * 0.1);
      ctx.lineTo(x + size * 0.14, y + size * 0.1);
    } else if (pattern === 'diamonds') {
      ctx.moveTo(x, y - size * 0.1);
      ctx.lineTo(x + size * 0.07, y);
      ctx.lineTo(x, y + size * 0.1);
      ctx.lineTo(x - size * 0.07, y);
      ctx.closePath();
    } else if (pattern === 'dots') {
      ctx.arc(x, y, size * 0.045, 0, Math.PI * 2);
      ctx.arc(x + size * 0.12, y + size * 0.05, size * 0.035, 0, Math.PI * 2);
    } else if (pattern === 'zigzag') {
      ctx.moveTo(x - size * 0.15, y);
      ctx.lineTo(x - size * 0.05, y - size * 0.07);
      ctx.lineTo(x + size * 0.05, y);
      ctx.lineTo(x + size * 0.15, y - size * 0.07);
    } else if (pattern === 'doublestripe') {
      ctx.moveTo(x - size * 0.14, y - size * 0.05);
      ctx.lineTo(x + size * 0.1, y - size * 0.05);
      ctx.moveTo(x - size * 0.14, y + size * 0.07);
      ctx.lineTo(x + size * 0.1, y + size * 0.07);
    } else {
      ctx.moveTo(x - size * 0.1, y);
      ctx.lineTo(x + size * 0.1, y);
      ctx.moveTo(x, y - size * 0.1);
      ctx.lineTo(x, y + size * 0.1);
    }
    ctx.stroke();
  }

  drawIgloo(x, y, cell) {
    const ctx = this.ctx;
    const cx = x + cell / 2;
    const cy = y + cell * 0.62;
    const radius = cell * 0.42;
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.7);
    glow.addColorStop(0, 'rgba(255,209,102,.4)');
    glow.addColorStop(1, 'rgba(255,209,102,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - radius * 2, cy - radius * 2, radius * 4, radius * 4);
    ctx.fillStyle = '#eef7ff';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2f5f80';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.34, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }

  drawSlots(state, slotY, cell) {
    const ctx = this.ctx;
    const slotWidth = Math.min(cell * 0.9, (this.width - 24) / state.slotCap - 6);
    const gap = 6;
    const totalWidth = state.slotCap * slotWidth + (state.slotCap - 1) * gap;
    let x = (this.width - totalWidth) / 2;
    for (let slot = 0; slot < state.slotCap; slot++) {
      ctx.fillStyle = 'rgba(215,236,248,.16)';
      this.roundRect(x, slotY, slotWidth, cell * 0.72, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(215,236,248,.4)';
      ctx.stroke();
      const squad = state.active.find((active) => active.slot === slot);
      if (squad) {
        this.drawPenguin(x + slotWidth / 2, slotY + cell * 0.4, cell * 0.5, squad.color, 0);
        ctx.fillStyle = '#eaf6ff';
        ctx.font = 'bold ' + Math.round(cell * 0.2) + 'px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(String(squad.remaining), x + slotWidth / 2, slotY + cell * 0.68);
      }
      x += slotWidth + gap;
    }
  }

  drawPenguin(x, y, size, color, angle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#22303c';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.34, size * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4fbff';
    ctx.beginPath();
    ctx.ellipse(-size * 0.03, size * 0.02, size * 0.22, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLOR_STYLES[color % COLOR_STYLES.length].fill;
    ctx.fillRect(-size * 0.1, -size * 0.16, size * 0.2, size * 0.07);
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.moveTo(size * 0.26, -size * 0.03);
    ctx.lineTo(size * 0.4, 0);
    ctx.lineTo(size * 0.26, size * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawAnimations(state, cell, boardX, boardY) {
    const ctx = this.ctx;
    const now = performance.now();
    this.anims = this.anims.filter((anim) => now < anim.t0 + anim.dur + 50);
    for (const anim of this.anims) {
      if (now < anim.t0) continue;
      const p = anim.dur ? Math.min(1, (now - anim.t0) / anim.dur) : 1;
      if (anim.type === 'collect') {
        const igloo = state.igloos[0];
        const startX = boardX + igloo.c * cell + cell / 2;
        const startY = boardY + igloo.r * cell + cell / 2;
        const endX = boardX + anim.c * cell + cell / 2;
        const endY = boardY + anim.r * cell + cell / 2;
        const travel = p < 0.5 ? p * 2 : (1 - p) * 2;
        const x = startX + (endX - startX) * travel;
        const y = startY + (endY - startY) * travel;
        const angle = p < 0.5 ? 0.5 : -0.5;
        this.drawPenguin(x, y, cell * 0.55, anim.color, angle);
        if (!this.reduced && p > 0.45 && p < 0.55 && !anim.splashed) {
          anim.splashed = true;
          this.burst(endX, endY, anim.color);
          this.splashCallback && this.splashCallback();
        }
      } else if (anim.type === 'reveal') {
        const x = boardX + anim.c * cell + cell / 2;
        const y = boardY + anim.r * cell + cell / 2;
        ctx.strokeStyle = 'rgba(255,255,255,' + (1 - p) * 0.9 + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, cell * (0.3 + p * 0.35), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  drawReveal(state, cell, boardX, boardY) {
    const ctx = this.ctx;
    const now = performance.now();
    const duration = this.reduced ? 500 : 2400;
    const p = Math.min(1, (now - this.reveal.t0) / duration);
    ctx.fillStyle = 'rgba(8,32,58,' + 0.72 * p + ')';
    ctx.fillRect(0, 0, this.width, this.height);
    const grid = this.reveal.grid;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const original = grid[r][c];
        if (!original) continue;
        const x = boardX + c * cell + cell / 2;
        const y = boardY + r * cell + cell / 2;
        ctx.globalAlpha = p;
        this.drawFish(x, y, cell * 0.72, { c: original.c });
        ctx.globalAlpha = 1;
      }
    }
    if (!this.reduced) {
      for (let i = 0; i < 26; i++) {
        const sparklePhase = (p * 3 + i * 0.37) % 1;
        const x = ((i * 97) % 100) / 100 * this.width;
        const y = ((i * 53) % 100) / 100 * this.height * 0.75;
        ctx.fillStyle = 'rgba(255,255,255,' + (1 - sparklePhase) * 0.8 + ')';
        ctx.beginPath();
        ctx.arc(x, y, 1.6 + sparklePhase * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (p >= 1 && this.reveal.onDone) {
      const done = this.reveal.onDone;
      this.reveal = null;
      done();
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    const now = performance.now();
    this.particles = this.particles.filter((particle) => now < particle.t0 + particle.life);
    for (const particle of this.particles) {
      const p = (now - particle.t0) / particle.life;
      ctx.fillStyle = 'rgba(190,235,255,' + (1 - p) * 0.9 + ')';
      ctx.beginPath();
      ctx.arc(particle.x + particle.vx * p * 30, particle.y + particle.vy * p * 30, 2.2 * (1 - p) + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  burst(x, y, color) {
    const now = performance.now();
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
        t0: now,
        life: this.reduced ? 1 : 520,
      });
    }
  }

  playEvents(events) {
    const now = performance.now();
    let delay = 0;
    for (const event of events) {
      if (event.type === 'collect') {
        this.anims.push({ type: 'collect', r: event.r, c: event.c, color: event.color, t0: now + delay, dur: this.reduced ? 0 : 620 });
        delay += this.reduced ? 0 : 130;
      } else if (event.type === 'reveal') {
        this.anims.push({ type: 'reveal', r: event.r, c: event.c, t0: now + delay, dur: this.reduced ? 0 : 380 });
        delay += this.reduced ? 0 : 110;
      }
    }
    if (delay > 0 || this.anims.length) this.start();
    else this.render(this.lastState);
  }

  playWinReveal(originalGrid, onDone) {
    this.reveal = { grid: cloneGrid(originalGrid), t0: performance.now(), onDone };
    this.start();
  }

  start() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(this.loop);
  }

  loop() {
    this.raf = null;
    if (this.lastState) this.render(this.lastState);
    if (this.anims.length || this.particles.length || this.reveal) {
      this.raf = requestAnimationFrame(this.loop);
    }
  }

  roundRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }
}
