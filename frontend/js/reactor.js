/**
 * A.T.O.M. TACTICAL QUANTUM REACTOR - CANVAS VISUALIZER
 * Renderiza em tempo real o núcleo de energia atômica com órbitas quânticas
 * e reage visualmente aos estados operacionais e de áudio (Dark Tactical Red).
 */

export class ArcReactor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.state = 'IDLE'; // 'IDLE', 'LISTENING', 'THINKING', 'SPEAKING'
    this.orbitAngle1 = 0;
    this.orbitAngle2 = 0;
    this.orbitAngle3 = 0;
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
      if (titleEl) titleEl.innerText = 'A.T.O.M.';
      if (subEl) subEl.innerText = 'ONLINE';
      if (waveEl) waveEl.style.opacity = '0.35';
    } else if (newState === 'LISTENING') {
      if (titleEl) titleEl.innerText = 'OUVINDO';
      if (subEl) subEl.innerText = 'MIC ATIVO';
      if (waveEl) waveEl.style.opacity = '1';
    } else if (newState === 'THINKING') {
      if (titleEl) titleEl.innerText = 'PROCESSANDO';
      if (subEl) subEl.innerText = 'MATRIZ TÁTICA';
      if (waveEl) waveEl.style.opacity = '0.85';
    } else if (newState === 'SPEAKING') {
      if (titleEl) titleEl.innerText = 'TRANSMITINDO';
      if (subEl) subEl.innerText = 'SÍNTESE VOCAL';
      if (waveEl) waveEl.style.opacity = '1';
    }
  }

  setAudioLevel(level) {
    this.audioLevel = Math.max(0, Math.min(1, level));
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 36; i++) {
      this.particles.push({
        orbitIndex: i % 3,
        angle: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.02,
        size: 1.5 + Math.random() * 2,
        alpha: 0.4 + Math.random() * 0.6
      });
    }
  }

  animate() {
    const { ctx, canvas } = this;
    if (!canvas || !ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Ajustar velocidade e paleta conforme estado
    let speedMult = 1;
    let mainColor = '#ef4444';
    let secondaryColor = '#e11d1d';
    let glowColor = 'rgba(239, 68, 68, 0.45)';

    if (this.state === 'THINKING') {
      speedMult = 3.2;
      mainColor = '#ff6b6b';
      secondaryColor = '#ef4444';
      glowColor = 'rgba(255, 107, 107, 0.6)';
    } else if (this.state === 'LISTENING') {
      speedMult = 1.4;
      mainColor = '#ffffff';
      secondaryColor = '#ef4444';
      glowColor = 'rgba(239, 68, 68, 0.7)';
    } else if (this.state === 'SPEAKING') {
      speedMult = 2.0;
      mainColor = '#ef4444';
      secondaryColor = '#b91c1c';
      glowColor = 'rgba(239, 68, 68, 0.55)';
    }

    this.orbitAngle1 += 0.012 * speedMult;
    this.orbitAngle2 += 0.018 * speedMult;
    this.orbitAngle3 += 0.015 * speedMult;
    this.pulse += 0.035 * speedMult;

    const pulseScale = 1 + Math.sin(this.pulse) * 0.05 + this.audioLevel * 0.22;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. ANEL EXTERNO TÁTICO COM CANTONEIRAS
    ctx.beginPath();
    ctx.arc(0, 0, 142 * pulseScale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Marcadores Táticos a cada 90 graus
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const r1 = 136 * pulseScale;
      const r2 = 148 * pulseScale;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 8;
      ctx.stroke();
    }

    // 2. ÓRBITAS ELÍPTICAS ATÔMICAS (3 ÂNGULOS: 0°, 60°, 120°)
    const rx = 126 * pulseScale;
    const ry = 48 * pulseScale;
    const orbitAngles = [0, Math.PI / 3, (2 * Math.PI) / 3];

    orbitAngles.forEach((rotAngle, idx) => {
      ctx.save();
      ctx.rotate(rotAngle);

      // Traçado da elipse
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 0 ? mainColor : 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = idx === 0 ? 2 : 1.2;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Elétron / quantum em trânsito
      const curAngle = (idx === 0 ? this.orbitAngle1 : idx === 1 ? this.orbitAngle2 : this.orbitAngle3);
      const ex = Math.cos(curAngle) * rx;
      const ey = Math.sin(curAngle) * ry;

      ctx.beginPath();
      ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 12;
      ctx.fill();

      ctx.restore();
    });

    // 3. ANEL INTERNO COM MARCADORES DILATADOS
    ctx.save();
    ctx.rotate(-this.orbitAngle1 * 0.8);
    const ticks = 24;
    for (let i = 0; i < ticks; i++) {
      const a = (i * Math.PI * 2) / ticks;
      const r1 = 88;
      const r2 = i % 6 === 0 ? 100 : 93;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.strokeStyle = i % 6 === 0 ? mainColor : 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = i % 6 === 0 ? 2 : 1;
      ctx.stroke();
    }
    ctx.restore();

    // 4. PARTÍCULAS EM VAPOR TÁTICO
    this.particles.forEach((p) => {
      p.angle += p.speed * speedMult;
      const rot = orbitAngles[p.orbitIndex];
      const px = Math.cos(p.angle) * rx * 0.9;
      const py = Math.sin(p.angle) * ry * 0.9;

      ctx.save();
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = mainColor;
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    });

    // 5. NÚCLEO DE FUSÃO CENTRAL (RADIAL GLOW)
    const coreGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 68 * pulseScale);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.25, mainColor);
    coreGrad.addColorStop(0.65, secondaryColor);
    coreGrad.addColorStop(0.9, 'rgba(31, 13, 13, 0.7)');
    coreGrad.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(0, 0, 68 * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 18;
    ctx.fill();

    ctx.restore();

    // Atualizar barras de modulação de voz
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
