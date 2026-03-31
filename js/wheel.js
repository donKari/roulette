/**
 * SpinLux – Wheel Engine
 * Canvas-based wheel renderer with premium physics animation
 */

import { getTextColor, lightenColor, pickWeightedIndex, easeOutQuart, randomBetween } from "./utils.js";

export class WheelEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.sections = [];
    this.rotation = 0;          // current angle in radians
    this.spinning = false;
    this.onResult = options.onResult || null;
    this.onStart  = options.onStart  || null;

    // Animation state
    this._raf = null;
    this._startAngle = 0;
    this._targetAngle = 0;
    this._spinDuration = 0;
    this._spinStart = 0;

    // Visual options
    this.showShadow = options.showShadow !== false;
    this.rimColor   = options.rimColor   || "#C9A84C";
    this.rimWidth   = options.rimWidth   || 14;
    this.glowColor  = options.glowColor  || "rgba(201,168,76,0.45)";
    this.pinColor   = options.pinColor   || "#C9A84C";

    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._resize();

    // Click to spin
    canvas.addEventListener("click", () => {
      if (!this.spinning) this.requestSpin?.();
    });

    window.addEventListener("resize", () => this._resize());
  }

  // ── Setup ────────────────────────────────────────────────────────────────

  _resize() {
    const size = this.canvas.parentElement?.clientWidth || 480;
    const dim  = Math.min(size, 600);
    this.canvas.style.width  = dim + "px";
    this.canvas.style.height = dim + "px";
    this.canvas.width  = dim * this._dpr;
    this.canvas.height = dim * this._dpr;
    this.ctx.scale(this._dpr, this._dpr);
    this._dim = dim;
    this.draw();
  }

  setSections(sections) {
    this.sections = sections;
    this.draw();
  }

  // ── Drawing ──────────────────────────────────────────────────────────────

  draw() {
    const ctx = this.ctx;
    const dim = this._dim || this.canvas.width / this._dpr;
    const cx  = dim / 2;
    const cy  = dim / 2;
    const r   = dim / 2 - this.rimWidth - 4;

    ctx.clearRect(0, 0, dim, dim);

    if (!this.sections || this.sections.length < 2) {
      this._drawEmptyState(ctx, cx, cy, r);
      return;
    }

    // Outer glow
    if (this.showShadow) {
      ctx.save();
      ctx.shadowBlur  = 36;
      ctx.shadowColor = this.glowColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r + this.rimWidth / 2, 0, Math.PI * 2);
      ctx.strokeStyle = this.rimColor;
      ctx.lineWidth = 0;
      ctx.stroke();
      ctx.restore();
    }

    // Sections
    const total  = this.sections.reduce((s, sec) => s + (sec.weight || 1), 0);
    let startAng = this.rotation - Math.PI / 2;

    this.sections.forEach((sec, i) => {
      const slice    = ((sec.weight || 1) / total) * Math.PI * 2;
      const endAng   = startAng + slice;
      const midAng   = startAng + slice / 2;
      const color    = sec.color || "#555";
      const txtColor = getTextColor(color);

      // Arc
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAng, endAng);
      ctx.closePath();

      // Radial gradient for depth
      const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      grad.addColorStop(0, lightenColor(color, 0.18));
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.fill();

      // Divider line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAng, endAng);
      ctx.closePath();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Section shimmer
      const shimmerGrad = ctx.createLinearGradient(
        cx + Math.cos(midAng) * r * 0.3,
        cy + Math.sin(midAng) * r * 0.3,
        cx + Math.cos(midAng) * r * 0.9,
        cy + Math.sin(midAng) * r * 0.9
      );
      shimmerGrad.addColorStop(0, "rgba(255,255,255,0.12)");
      shimmerGrad.addColorStop(0.5, "rgba(255,255,255,0.04)");
      shimmerGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAng, endAng);
      ctx.closePath();
      ctx.fillStyle = shimmerGrad;
      ctx.fill();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAng);
      const textX = r * 0.62;
      const fontSize = Math.max(10, Math.min(18, (r * 0.42) / Math.max(1, sec.text.length * 0.5)));
      ctx.font = `600 ${fontSize}px 'Outfit', sans-serif`;
      ctx.fillStyle = txtColor;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.shadowBlur = 3;
      ctx.shadowColor = "rgba(0,0,0,0.5)";

      const maxW = r * 0.72;
      let label = sec.text || "";
      while (ctx.measureText(label).width > maxW && label.length > 2) {
        label = label.slice(0, -1);
      }
      if (label !== sec.text) label = label.slice(0, -1) + "…";

      ctx.fillText(label, textX, 0);
      ctx.restore();

      startAng = endAng;
    });

    // Rim
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = this.rimColor;
    ctx.lineWidth = this.rimWidth;
    ctx.stroke();

    // Rim inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + this.rimWidth / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r - this.rimWidth / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center hub
    const hubR = r * 0.085;
    const hubGrad = ctx.createRadialGradient(cx - hubR * 0.2, cy - hubR * 0.2, 1, cx, cy, hubR);
    hubGrad.addColorStop(0, "#fff9e6");
    hubGrad.addColorStop(0.5, this.rimColor);
    hubGrad.addColorStop(1, "#8a6914");
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(201,168,76,0.6)";
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  _drawEmptyState(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = this.rimColor;
    ctx.lineWidth = this.rimWidth;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(201,168,76,0.06)";
    ctx.fill();

    ctx.font = `500 18px 'Outfit', sans-serif`;
    ctx.fillStyle = "rgba(201,168,76,0.5)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Ajoutez des sections", cx, cy);
  }

  // ── Spin Physics ─────────────────────────────────────────────────────────

  spin(targetSectionIndex) {
    if (this.spinning || this.sections.length < 2) return;

    const total   = this.sections.reduce((s, sec) => s + (sec.weight || 1), 0);
    let cumAngle  = 0;
    let sectionMidAngle = 0;

    for (let i = 0; i <= targetSectionIndex; i++) {
      const sliceFrac = (this.sections[i].weight || 1) / total;
      const sliceAng  = sliceFrac * Math.PI * 2;
      if (i === targetSectionIndex) {
        sectionMidAngle = cumAngle + sliceAng / 2;
      }
      cumAngle += sliceAng;
    }

    // We want sectionMidAngle to land at the top (π/2 from rotation base)
    // rotation + sectionMidAngle = -π/2  =>  rotation = -π/2 - sectionMidAngle
    const targetRotation = -Math.PI / 2 - sectionMidAngle;

    // Add random full spins (5–9) for excitement
    const extraSpins     = Math.floor(randomBetween(5, 9)) * Math.PI * 2;
    const randomOffset   = randomBetween(-0.03, 0.03); // tiny randomness within section
    const rawDelta       = targetRotation - this.rotation + randomOffset;
    const normalizedDelta = rawDelta - Math.floor(rawDelta / (Math.PI * 2)) * Math.PI * 2;
    const totalDelta     = normalizedDelta + extraSpins;

    this.spinning        = true;
    this._startAngle     = this.rotation;
    this._targetAngle    = this.rotation + totalDelta;
    this._spinDuration   = randomBetween(4200, 5800); // ms
    this._spinStart      = null;

    this.onStart?.();
    this._animateSpin();
  }

  spinRandom() {
    if (this.spinning || this.sections.length < 2) return;
    const weights = this.sections.map((s) => s.weight || 1);
    const index   = pickWeightedIndex(weights);
    this.spin(index);
    return index;
  }

  _animateSpin(timestamp) {
    if (!this._spinStart) this._spinStart = timestamp;
    const elapsed  = timestamp - this._spinStart;
    const progress = Math.min(elapsed / this._spinDuration, 1);
    const eased    = easeOutQuart(progress);

    this.rotation = this._startAngle + (this._targetAngle - this._startAngle) * eased;
    this.draw();

    if (progress < 1) {
      this._raf = requestAnimationFrame((ts) => this._animateSpin(ts));
    } else {
      this.rotation = this._targetAngle;
      this.spinning  = false;
      this.draw();
      this._resolveResult();
    }
  }

  _animateSpin = this._animateSpin.bind(this);

  _resolveResult() {
    // Find which section is at the top pointer
    const normalizedRot = ((this.rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const pointerAngle  = (Math.PI * 1.5 - normalizedRot + Math.PI * 2) % (Math.PI * 2);
    const total         = this.sections.reduce((s, sec) => s + (sec.weight || 1), 0);
    let cumAngle        = 0;

    for (let i = 0; i < this.sections.length; i++) {
      const sliceAng = ((this.sections[i].weight || 1) / total) * Math.PI * 2;
      if (pointerAngle >= cumAngle && pointerAngle < cumAngle + sliceAng) {
        this.onResult?.(i, this.sections[i]);
        return;
      }
      cumAngle += sliceAng;
    }

    // Fallback to last section
    const last = this.sections.length - 1;
    this.onResult?.(last, this.sections[last]);
  }

  startFrame(ts) {
    this._raf = requestAnimationFrame((t) => this._animateSpin(t));
  }
}

// ── Pin / Arrow Renderer ────────────────────────────────────────────────────

export function drawPin(pinCanvas, color = "#C9A84C") {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  pinCanvas.width  = 40 * dpr;
  pinCanvas.height = 52 * dpr;
  pinCanvas.style.width  = "40px";
  pinCanvas.style.height = "52px";
  const ctx = pinCanvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // Arrow pointing down
  ctx.beginPath();
  ctx.moveTo(20, 48);
  ctx.lineTo(4, 8);
  ctx.lineTo(12, 14);
  ctx.lineTo(20, 4);
  ctx.lineTo(28, 14);
  ctx.lineTo(36, 8);
  ctx.closePath();

  const grad = ctx.createLinearGradient(4, 4, 36, 48);
  grad.addColorStop(0, "#fff9e6");
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, "#8a6914");
  ctx.fillStyle = grad;
  ctx.shadowBlur  = 12;
  ctx.shadowColor = "rgba(201,168,76,0.7)";
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
}
