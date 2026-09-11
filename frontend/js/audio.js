/**
 * SISTEMA DE ÁUDIO & VOZ DO J.A.R.V.I.S.
 * - Efeitos sonoros futuristas sintetizados em tempo real via Web Audio API.
 * - Reconhecimento de fala (STT) com suporte a atalhos e Push-To-Talk.
 * - Síntese de fala (TTS) com perfil vocal do JARVIS.
 */

export class JarvisAudio {
  constructor(onSpeechRecognized, onStateChange) {
    this.onSpeechRecognized = onSpeechRecognized;
    this.onStateChange = onStateChange;

    this.audioCtx = null;
    this.sfxEnabled = true;
    this.ttsEnabled = true;

    // TTS Config
    this.voiceRate = 1.05;
    this.voicePitch = 0.95;
    this.selectedVoice = null;
    this.voices = [];

    // STT Config
    this.recognition = null;
    this.isListening = false;

    this.initAudioContext();
    this.initSpeechSynthesis();
    this.initSpeechRecognition();
  }

  initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn("Web Audio API não inicializado:", e);
    }
  }

  ensureAudioContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /* ==========================================================================
     SÍNTESE DE EFEITOS SONOROS SCI-FI (WEB AUDIO API)
     ========================================================================== */

  playStartupSFX() {
    if (!this.sfxEnabled || !this.audioCtx) return;
    this.ensureAudioContext();
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.5);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  playToolBeep() {
    if (!this.sfxEnabled || !this.audioCtx) return;
    this.ensureAudioContext();
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.setValueAtTime(780, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playCompletionChime() {
    if (!this.sfxEnabled || !this.audioCtx) return;
    this.ensureAudioContext();
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    [660, 880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.08, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    });
  }

  /* ==========================================================================
     RECONHECIMENTO DE FALA (STT)
     ========================================================================== */

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Navegador não suporta Web Speech Recognition API nativa.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    const transcriptEl = document.getElementById('speech-transcript');
    const bannerEl = document.getElementById('speech-banner');

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStateChange) this.onStateChange('LISTENING');
      if (bannerEl) bannerEl.classList.remove('hidden');
      if (transcriptEl) transcriptEl.innerText = 'Escutando...';
      this.playToolBeep();
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (transcriptEl) {
        transcriptEl.innerText = finalTranscript || interim || 'Processando fala...';
      }

      if (finalTranscript.trim()) {
        if (bannerEl) bannerEl.classList.add('hidden');
        if (this.onSpeechRecognized) {
          this.onSpeechRecognized(finalTranscript.trim());
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.warn("Erro no reconhecimento de fala:", event.error);
      this.stopListening();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (bannerEl) bannerEl.classList.add('hidden');
      if (this.onStateChange) this.onStateChange('IDLE');
    };
  }

  toggleListening() {
    if (!this.recognition) {
      alert("Reconhecimento de fala não suportado neste navegador. Use o Chrome ou Edge.");
      return;
    }

    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening() {
    if (!this.recognition || this.isListening) return;
    try {
      this.recognition.start();
    } catch (e) {
      console.error(e);
    }
  }

  stopListening() {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
    } catch (e) {
      console.error(e);
    }
    this.isListening = false;
  }

  /* ==========================================================================
     SÍNTESE VOCAL (TEXT-TO-SPEECH)
     ========================================================================== */

  initSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
      console.warn("SpeechSynthesis não suportado.");
      return;
    }

    const loadVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
      const select = document.getElementById('voice-select');
      if (!select) return;

      select.innerHTML = '';
      let defaultIdx = 0;

      this.voices.forEach((v, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = `${v.name} (${v.lang})`;

        // Priorizar voz em português com tom masculino/robótico se disponível
        if (v.lang.includes('pt') || v.lang.includes('PT')) {
          option.textContent += ' ★';
          if (!this.selectedVoice) {
            defaultIdx = idx;
            this.selectedVoice = v;
          }
        }
        select.appendChild(option);
      });

      if (this.voices.length > 0) {
        select.value = defaultIdx;
        this.selectedVoice = this.voices[defaultIdx];
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  speak(text) {
    if (!this.ttsEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Cancelar falas anteriores

    // Limpar markdown e caracteres especiais do texto antes de falar
    const cleanText = text
      .replace(/\[TOOL:[^\]]+\]/g, '')
      .replace(/[#*`_~]/g, '')
      .replace(/https?:\/\/\S+/g, 'link na web')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) return;

    // Dividir em sentenças para manter áudio fluido
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = this.voiceRate;
    utterance.pitch = this.voicePitch;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      if (this.onStateChange) this.onStateChange('SPEAKING');
    };

    utterance.onend = () => {
      if (this.onStateChange) this.onStateChange('IDLE');
    };

    utterance.onerror = () => {
      if (this.onStateChange) this.onStateChange('IDLE');
    };

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (this.onStateChange) this.onStateChange('IDLE');
    }
  }
}
