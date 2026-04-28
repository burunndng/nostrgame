import type { CreatureState, Emotion } from '@/systems/types';
import { AFFINITY_COLORS } from '@/systems/constants';

// ─────────────────────────── Particle System ──────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  alpha: number;
}

class ParticleSystem {
  particles: Particle[] = [];
  maxParticles = 200;

  spawn(
    count: number,
    x: number,
    y: number,
    hue: number,
    spread: number = 20,
    speed: number = 1
  ) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed;
      this.particles.push({
        x: x + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel - Math.random() * 0.5,
        life: 0,
        maxLife: 60 + Math.random() * 60,
        size: 1 + Math.random() * 2.5,
        hue: hue + (Math.random() - 0.5) * 30,
        alpha: 1,
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.99; // slight drag
      p.alpha = 1 - p.life / p.maxLife;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const a = p.alpha * 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${a})`;
      ctx.fill();
    }
  }
}

// ─────────────────────────── Body Procedural Generator ────────────────────

interface Limb {
  angle: number;
  length: number;
  width: number;
  curve: number;
  taper: number;
  segments: number;
  wobbleFreq: number;
  wobbleAmp: number;
}

function generateLimbs(seed: number[], archetype: string): Limb[] {
  const limbCounts: Record<string, number> = { Lumis: 6, Umbra: 5, Vex: 7, Wraith: 4 };
  const baseCount = limbCounts[archetype] ?? 5;
  const limbs: Limb[] = [];

  for (let i = 0; i < baseCount; i++) {
    const s = seed[i % seed.length];
    limbs.push({
      angle: ((i / baseCount) * Math.PI * 2) + ((s - 128) / 255) * 0.3,
      length: 40 + (s / 255) * 60,
      width: 8 + ((seed[(i + 3) % seed.length] / 255)) * 12,
      curve: ((seed[(i + 1) % seed.length] - 128) / 128) * 0.6,
      taper: 0.3 + (seed[(i + 2) % seed.length] / 255) * 0.5,
      segments: 5 + Math.max(0, Math.floor(seed[(i + 4) % seed.length] / 255 * 6)),
      wobbleFreq: 1 + (seed[(i + 5) % seed.length] / 255) * 3,
      wobbleAmp: 3 + (seed[(i + 6) % seed.length] / 255) * 8,
    });
  }
  return limbs;
}

// ─────────────────────────── Main Renderer ────────────────────────────────

export class CreatureRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: ParticleSystem;
  private animClock = 0;
  private lastTimestamp = 0;

  // Creature reference (updated externally)
  creature: CreatureState | null = null;
  emotion: Emotion = 'breathing';
  glowIntensity = 0.7;
  adrenalineLevel = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.particles = new ParticleSystem();
  }

  resize(width: number, height: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  render(timestamp: number) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    this.animClock += dt;

    const W = this.canvas.width / (window.devicePixelRatio || 1);
    const H = this.canvas.height / (window.devicePixelRatio || 1);

    this.renderVoid(W, H);
    this.renderAmbientParticles();

    if (this.creature) {
      const cx = W / 2;
      const cy = H / 2 + 20;
      this.renderGlowAura(cx, cy);
      this.renderBody(cx, cy);
      this.renderMarkings(cx, cy);
      this.renderEmotionIndicator(cx, cy);

      // Spawn ambient particles from the creature
      if (this.animClock % 1.5 < 0.016) {
        const alignmentHue = this.getAlignmentHue();
        this.particles.spawn(2, cx, cy, alignmentHue, 40, 0.3);
      }

      // Battle adrenaline effect
      if (this.adrenalineLevel > 0) {
        this.particles.spawn(4, cx, cy, 50, 60, 1.2); // gold burst
      }

      // Sick / feral particles
      if (this.emotion === 'sick') {
        this.particles.spawn(1, cx, cy - 40, 0, 30, 0.1);
      }
      if (this.emotion === 'feral') {
        this.particles.spawn(2, cx, cy, 270, 50, 0.8);
      }
    }

    this.particles.update();
    this.particles.draw(this.ctx);

    // Battle adrenaline fade
    if (this.adrenalineLevel > 0) {
      this.adrenalineLevel = Math.max(0, this.adrenalineLevel - dt * 0.5);
    }
  }

  private renderVoid(W: number, H: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#030508';
    ctx.fillRect(0, 0, W, H);

    // Subtle deep navy undertone
    const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.7);
    grad.addColorStop(0, 'rgba(2, 8, 20, 0.5)');
    grad.addColorStop(1, 'rgba(3, 5, 8, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Very faint stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 60; i++) {
      const px = ((i * 137.5) % W);
      const py = ((i * 89.7) % H);
      const twinkle = Math.sin(this.animClock * 0.5 + i) * 0.5 + 0.5;
      ctx.globalAlpha = twinkle * 0.3;
      ctx.fillRect(px, py, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  private renderAmbientParticles() {
    // Handled by particle system now
  }

  private renderGlowAura(cx: number, cy: number) {
    if (!this.creature) return;
    const ctx = this.ctx;
    const bond = this.creature.stats.bond;
    const alignmentColor = this.getAlignmentHue();

    // Primary glow — radial gradient
    const glowRadius = (bond / 2) + 40 + this.adrenalineLevel * 30;
    const pulse = Math.sin(this.animClock * 0.4) * 0.1 + 1;
    const finalRadius = glowRadius * pulse;

    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, finalRadius);
    const r = Math.min(255, Math.max(0, alignmentColor));
    const g = Math.min(255, Math.max(0, 180 + (this.creature.alignment / 100) * 40));
    const b = Math.min(255, Math.max(0, 220 - Math.abs(this.creature.alignment) / 100 * 80));

    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.glowIntensity * 0.6})`);
    grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${this.glowIntensity * 0.25})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(cx - finalRadius, cy - finalRadius, finalRadius * 2, finalRadius * 2);

    // Health flicker when low
    if (this.creature.needs.health < 30) {
      const flicker = Math.sin(this.animClock * Math.PI * 4) > 0 ? 0.15 : 0;
      const redGlow = ctx.createRadialGradient(cx, cy, 5, cx, cy, 60);
      redGlow.addColorStop(0, `rgba(230, 57, 70, ${flicker})`);
      redGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = redGlow;
      ctx.fillRect(cx - 60, cy - 60, 120, 120);
    }
  }

  private renderBody(cx: number, cy: number) {
    if (!this.creature) return;
    const ctx = this.ctx;
    const genome = this.creature.genome;
    const seed = genome.bodyMorphSeed;
    // Safety check for seed array
    if (!seed || seed.length === 0) {
      return;
    }
    const limbs = generateLimbs(Array.from(seed), genome.archetype);

    const hue = genome.baseHue;
    const alignmentColor = this.getAlignmentHue();
    const mainColor = `hsl(${alignmentColor}, 70%, ${this.emotion === 'sick' ? 25 : 55}%)`;
    const glowColor = `hsl(${alignmentColor}, 80%, 65%)`;

    ctx.save();

    // Apply emotion transforms
    if (this.emotion === 'sleeping') {
      cy += 5; // sink a bit
    }
    if (this.emotion === 'hungry') {
      cy -= 2;
    }

    // Global breathing animation
    const breath = Math.sin(this.animClock * 2.1) * 0.5 + 1;
    const breathY = this.emotion === 'happy' ? Math.sin(this.animClock * 1.2) * 4 : 0;
    const scale = this.emotion === 'sleeping' ? 0.9 : 1;

    // --- Core Body ---
    const coreSize = 25 + (this.creature.stage * 3);
    ctx.globalCompositeOperation = 'screen';

    // Core glow
    const coreGrad = ctx.createRadialGradient(cx, cy + breathY, 2, cx, cy + breathY, coreSize * breath * scale);
    coreGrad.addColorStop(0, glowColor);
    coreGrad.addColorStop(0.6, mainColor);
    coreGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + breathY, coreSize * breath * scale, 0, Math.PI * 2);
    ctx.fill();

    // --- Body Shape Variants by Archetype ---
    if (genome.archetype === 'Lumis') {
      this.renderLumisBody(ctx, cx, cy + breathY, coreSize, hue, mainColor, glowColor, scale);
    } else if (genome.archetype === 'Umbra') {
      this.renderUmbraBody(ctx, cx, cy + breathY, coreSize, hue, mainColor, glowColor, scale);
    } else if (genome.archetype === 'Vex') {
      this.renderVexBody(ctx, cx, cy + breathY, coreSize, hue, mainColor, glowColor, scale);
    } else {
      this.renderWraithBody(ctx, cx, cy + breathY, coreSize, hue, mainColor, glowColor, scale);
    }

    // --- Limbs (tendrils/appendages) ---
    for (let i = 0; i < limbs.length; i++) {
      const limb = limbs[i];
      this.renderLimb(ctx, cx, cy + breathY, limb, i, hue, mainColor);
    }

    // --- Eyes ---
    this.renderEyes(ctx, cx, cy + breathY, coreSize * scale);

    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
  }

  private renderLumisBody(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    coreSize: number,
    hue: number,
    mainColor: string,
    glowColor: string,
    scale: number
  ) {
    // Lumis: flowing wing-like shapes
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const wingLength = coreSize * 2.5;
    const wingWidth = coreSize * 0.8;

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(
        side * wingLength * 0.6,
        -wingWidth,
        side * wingLength,
        -wingWidth * 0.3 + Math.sin(this.animClock * 1.5 + side) * 3
      );
      ctx.quadraticCurveTo(
        side * wingLength * 0.8,
        wingWidth * 0.5,
        0,
        coreSize * 0.5
      );
      ctx.fillStyle = `hsla(${hue + 20}, 50%, 40%, 0.4)`;
      ctx.fill();
    }

    ctx.restore();
  }

  private renderUmbraBody(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    coreSize: number,
    hue: number,
    mainColor: string,
    glowColor: string,
    scale: number
  ) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Umbra: jagged carapace shape
    ctx.beginPath();
    const spikes = 7;
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2 - Math.PI / 2;
      const spikeLen = coreSize * (1.2 + Math.sin(i * 2.1) * 0.3);
      const innerLen = coreSize * 0.6;
      const tipX = Math.cos(angle) * spikeLen;
      const tipY = Math.sin(angle) * spikeLen;
      const base1X = Math.cos(angle - 0.4) * innerLen;
      const base1Y = Math.sin(angle - 0.4) * innerLen;
      const base2X = Math.cos(angle + 0.4) * innerLen;
      const base2Y = Math.sin(angle + 0.4) * innerLen;

      if (i === 0) ctx.moveTo(base1X, base1Y);
      else ctx.lineTo(base1X, base1Y);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(base2X, base2Y);
    }
    ctx.closePath();
    ctx.fillStyle = `hsla(${hue}, 50%, 25%, 0.5)`;
    ctx.fill();
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  private renderVexBody(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    coreSize: number,
    hue: number,
    mainColor: string,
    glowColor: string,
    scale: number
  ) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.rotate(Math.sin(this.animClock * 0.7) * 0.05);

    // Vex: irregular blob with internal chaotic shapes
    const blobs = 5;
    for (let i = 0; i < blobs; i++) {
      const angle = (i / blobs) * Math.PI * 2 + this.animClock * 0.2 * (i % 2 === 0 ? 1 : -1);
      const dist = coreSize * (0.7 + Math.sin(this.animClock + i) * 0.15);
      const bx = Math.cos(angle) * dist;
      const by = Math.sin(angle) * dist;
      const br = coreSize * (0.35 + Math.sin(i * 3.7) * 0.1);

      const blobGrad = ctx.createRadialGradient(bx, by, 1, bx, by, br);
      blobGrad.addColorStop(0, `hsla(${hue + i * 30}, 60%, 50%, 0.5)`);
      blobGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = blobGrad;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderWraithBody(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    coreSize: number,
    hue: number,
    mainColor: string,
    glowColor: string,
    scale: number
  ) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Wraith: tall ethereal figure
    ctx.beginPath();
    ctx.moveTo(-coreSize * 0.3, coreSize);
    ctx.lineTo(-coreSize * 0.2, coreSize * 2.5 + Math.sin(this.animClock * 0.8) * 5);
    ctx.lineTo(coreSize * 0.2, coreSize * 2.5 + Math.sin(this.animClock * 0.8 + 1) * 5);
    ctx.lineTo(coreSize * 0.3, coreSize);
    ctx.fillStyle = `hsla(${hue}, 30%, 30%, 0.4)`;
    ctx.fill();

    // Floating "rings" around the body
    const ringY = coreSize * 1.5 + Math.sin(this.animClock * 0.5) * 8;
    ctx.beginPath();
    ctx.ellipse(0, ringY, coreSize * 0.8, coreSize * 0.2, this.animClock * 0.1, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${hue}, 60%, 50%, 0.4)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  private renderLimb(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    limb: Limb,
    index: number,
    hue: number,
    color: string
  ) {
    ctx.save();
    ctx.translate(cx, cy);

    const wobble = Math.sin(this.animClock * limb.wobbleFreq + index) * limb.wobbleAmp;

    // Build curve points
    const points: Array<{ x: number; y: number; width: number }> = [];
    const segments = Math.max(1, Math.floor(limb.segments));
    for (let s = 0; s <= segments; s++) {
      const t = s / limb.segments;
      const baseAngle = limb.angle + limb.curve * t * Math.sin(t * Math.PI);
      const len = limb.length * t;

      const x = Math.cos(baseAngle) * len + wobble * t * t;
      const y = Math.sin(baseAngle) * len + Math.sin(this.animClock + index) * 2 * t;
      const width = limb.width * (1 - t * limb.taper);

      points.push({ x, y, width });
    }

    ctx.strokeStyle = color;
    ctx.lineCap = 'round';

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      ctx.lineWidth = Math.max(1, (p1.width + p2.width) / 2);
      ctx.globalAlpha = 0.5 - (i / points.length) * 0.2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Glow tip
    if (points.length > 0) {
      const tip = points[points.length - 1];
      ctx.globalAlpha = 0.8 - Math.sin(this.animClock + index) * 0.3;
      ctx.fillStyle = `hsl(${hue + index * 15}, 80%, 65%)`;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, Math.max(1, tip.width * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, _coreSize: number) {
    if (this.emotion === 'sleeping') {
      // Closed eyes — simple lines
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx - 6, cy - 3, 4, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 6, cy - 3, 4, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      return;
    }

    const blink = Math.sin(this.animClock * 0.8) > 0.95 ? 0.1 : 1;
    const eyeColor = this.emotion === 'sick' ? 'rgba(200,50,50,0.6)' : 'rgba(255,255,255,0.9)';
    const pupilColor = this.emotion === 'feral' ? '#ff0055' : this.creature ? AFFINITY_COLORS[this.creature.genome.innateAffinity] : '#fff';

    // Left eye
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(cx - 7, cy - 4, 5 * blink, 6 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pupilColor;
    ctx.beginPath();
    ctx.arc(cx - 7, cy - 3, 2 * blink, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(cx + 7, cy - 4, 5 * blink, 6 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pupilColor;
    ctx.beginPath();
    ctx.arc(cx + 7, cy - 3, 2 * blink, 0, Math.PI * 2);
    ctx.fill();

    if (this.emotion === 'happy') {
      // Happy sparkle
      ctx.fillStyle = 'rgba(255,255,200,0.6)';
      ctx.beginPath();
      ctx.arc(cx - 7 + 2, cy - 4 - 2, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderMarkings(cx: number, cy: number) {
    if (!this.creature) return;
    const ctx = this.ctx;
    const genome = this.creature.genome;

    // Birthmark sigil
    ctx.save();
    ctx.font = '12px monospace';
    ctx.fillStyle = `hsla(${genome.baseHue}, 50%, 60%, 0.3)`;
    ctx.textAlign = 'center';
    ctx.fillText(genome.birthmark, cx, cy + 45);
    ctx.restore();
  }

  private renderEmotionIndicator(cx: number, cy: number) {
    const ctx = this.ctx;
    let emoji: string;
    switch (this.emotion) {
      case 'hungry':
        emoji = '···';
        break;
      case 'happy':
        emoji = '✦';
        break;
      case 'sleeping':
        emoji = 'z';
        // Z particles
        if (Math.sin(this.animClock * 2) > 0.8) {
          ctx.fillStyle = 'rgba(180,200,255,0.4)';
          ctx.font = '10px sans-serif';
          ctx.fillText('z', cx + 15, cy - 30);
        }
        if (Math.sin(this.animClock * 2 + 1) > 0.8) {
          ctx.fillStyle = 'rgba(180,200,255,0.3)';
          ctx.font = '8px sans-serif';
          ctx.fillText('z', cx + 22, cy - 38);
        }
        break;
      case 'excited':
        emoji = '!';
        break;
      case 'sick':
        emoji = '×';
        break;
      case 'feral':
        emoji = '◊';
        break;
      default:
        emoji = '';
    }
    if (emoji) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(emoji, cx, cy - 40);
    }
  }

  private getAlignmentHue(): number {
    if (!this.creature) return 180;
    const a = this.creature.alignment;
    if (a > 30) return 195; // icy cyan
    if (a < -30) return 340; // crimson
    return 160; // phosphorescent green-gold
  }

  triggerAdrenaline() {
    this.adrenalineLevel = 1;
  }

  destroy() {
    // nothing to clean yet
  }
}
