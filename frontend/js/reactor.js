/**
 * ARC REACTOR CANVAS VISUALIZER - J.A.R.V.I.S. HUD
 * Renderiza em tempo real o núcleo de energia e reage aos estados operacionais.
 */

export class ArcReactor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.state = 'IDLE'; // 'IDLE', 'LISTENING', 'THINKING', 'SPEAKING'
    this.angle1 = 0;
    this.angle2 = 0;
    this.pulse = 0;
    this.particles = [];
    this.audioLevel = 0; // 0.0 a 1.0

    this.initParticles();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setState(newState) {
    this.state = newState;
    const titleEl = document.getElementById('core-state-title');
    const subEl = document.getElementById('core-state-subtitle');
    const waveEl = document.getElementById('audio-waves');

    if (newState === 'IDLE') {
      if (titleEl) titleEl.innerText = 'JARVIS';
      if (subEl) subEl.innerText = 'ONLINE';
      if (waveEl) waveEl.style.opacity = '0.3';
    } else if (newState === 'LISTENING') {
      if (titleEl) titleEl.innerText = 'OUVINDO';
      if (subEl) subEl.innerText = 'MIC ATIVO';
      if (waveEl) waveEl.style.opacity = '1';
    } else if (newState === 'THINKING') {
      if (titleEl) titleEl.innerText = 'PROCESSANDO';
      if (subEl) subEl.innerText = 'NEURAL LOCAL';
      if (waveEl) waveEl.style.opacity = '0.8';
    } else if (newState === 'SPEAKING') {
      if (titleEl) titleEl.innerText = 'FALANDO';
      if (subEl) subEl.innerText = 'RESPOSTA DE ÁUDIO';
      if (waveEl) waveEl.style.opacity = '1';
    }
  }

  setAudioLevel(level) {
    this.audioLevel = Math.max(0, Math.min(1, level));
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 40 + Math.random() * 80,
        speed: 0.005 + Math.random() * 0.015,
        size: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.7
      });
    }
  }

  animate() {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Ajustar velocidade conforme estado
    let speedMult = 1;
    let mainColor = '#00f3ff';
    let glowColor = 'rgba(0, 243, 255, 0.4)';

    if (this.state === 'THINKING') {
      speedMult = 3.5;
      mainColor = '#ffaa00';
      glowColor = 'rgba(255, 170, 0, 0.5)';
    } else if (this.state === 'LISTENING') {
      speedMult = 1.2;
      mainColor = '#ff3366';
      glowColor = 'rgba(255, 51, 102, 0.5)';
    } else if (this.state === 'SPEAKING') {
      speedMult = 1.8;
      mainColor = '#00ff9d';
      glowColor = 'rgba(0, 255, 157, 0.5)';
    }

    this.angle1 += 0.01 * speedMult;
    this.angle2 -= 0.015 * speedMult;
    this.pulse += 0.03 * speedMult;

    const pulseScale = 1 + Math.sin(this.pulse) * 0.05 + this.audioLevel * 0.2;

    // 1. ANEL EXTERNO GRADIENTE
    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.arc(0, 0, 140 * pulseScale, 0, Math.PI * 2);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. SEGMENTOS GIRATÓRIOS EXTERNOS (ÂNGULO 1)
    ctx.save();
    ctx.rotate(this.angle1);
    const segments = 12;
    for (let i = 0; i < segments; i++) {
      const startA = (i * (Math.PI * 2 / segments));
      const endA = startA + (Math.PI * 2 / segments) * 0.55;
      ctx.beginPath();
      ctx.arc(0, 0, 125, startA, endA);
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 4;
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
    ctx.restore();

    // 3. ANEL INTERMEDIÁRIO COM MARCADORES TÁTICOS (ÂNGULO 2)
    ctx.save();
    ctx.rotate(this.angle2);
    const ticks = 24;
    for (let i = 0; i < ticks; i++) {
      const a = i * (Math.PI * 2 / ticks);
      const r1 = 95;
      const r2 = (i % 4 === 0) ? 110 : 103;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.strokeStyle = (i % 4 === 0) ? mainColor : 'rgba(0, 243, 255, 0.3)';
      ctx.lineWidth = (i % 4 === 0) ? 2.5 : 1;
      ctx.stroke();
    }
    ctx.restore();

    // 4. PARTÍCULAS EM ÓRBITA
    this.particles.forEach(p => {
      p.angle += p.speed * speedMult;
      const px = Math.cos(p.angle) * p.radius;
      const py = Math.sin(p.angle) * p.radius;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = mainColor;
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 6;
      ctx.fill();
    });

    // 5. NÚCLEO CENTRAL RADIAL
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 75 * pulseScale);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, mainColor);
    grad.addColorStop(0.8, 'rgba(0, 243, 255, 0.15)');
    grad.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(0, 0, 75 * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();

    // Atualizar barras de onda de áudio na interface
    this.updateWaveBars();

    requestAnimationFrame(this.animate);
  }

  updateWaveBars() {
    const bars = document.querySelectorAll('.wave-bar');
    if (!bars.length) return;
    bars.forEach((bar, index) => {
      let h = 4;
      if (this.state === 'SPEAKING' || this.state === 'LISTENING') {
        const factor = Math.sin(this.pulse * 3 + index) * 0.5 + 0.5;
        h = 4 + factor * 14 * (0.6 + this.audioLevel * 0.8);
      }
      bar.style.height = `${h}px`;
    });
  }
}
