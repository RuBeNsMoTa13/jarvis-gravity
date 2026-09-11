/**
 * SISTEMA DE ÁUDIO & VOZ DO J.A.R.V.I.S.
 * - Efeitos sonoros futuristas sintetizados em tempo real via Web Audio API.
 * - Reconhecimento de fala híbrido de alta resiliência:
 *   1) Web Speech API nativo em tempo real (digita ao vivo no chat).
 *   2) Gravação direta de hardware (MediaRecorder) com envio para o backend STT (/api/audio/transcribe)
 *      para funcionamento 100% garantido no Brave, Edge, Chrome, Firefox e redes com bloqueio.
 * - Síntese de fala (TTS) com perfil vocal sci-fi do JARVIS.
 */

import { JarvisAPI } from './api.js';

export class JarvisAudio {
  constructor(onSpeechRecognized, onStateChange, onErrorMessage = null, onStatusMessage = null) {
    this.onSpeechRecognized = onSpeechRecognized;
    this.onStateChange = onStateChange;
    this.onErrorMessage = onErrorMessage;
    this.onStatusMessage = onStatusMessage;

    this.audioCtx = null;
    this.micStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.analyser = null;
    this.volumeTimer = null;

    this.isListening = false;
    this.isTranscribing = false;
    this.hasSpoken = false;
    this.currentText = '';
    this.sfxEnabled = true;
    this.ttsEnabled = true;

    // TTS Config
    this.voiceRate = 1.05;
    this.voicePitch = 0.95;
    this.selectedVoice = null;
    this.voices = [];

    // STT Native Config
    this.recognition = null;

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
     RECONHECIMENTO DE FALA (STT) - MOTOR HÍBRIDO NATIVO + HARDWARE BACKEND
     ========================================================================== */

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.info("Web Speech API nativo não disponível neste browser. O sistema usará o gravador de hardware com backend STT.");
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'pt-BR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      const transcriptEl = document.getElementById('speech-transcript');
      const bannerEl = document.getElementById('speech-banner');

      this.recognition.onstart = () => {
        if (bannerEl) bannerEl.classList.remove('hidden');
        if (transcriptEl) transcriptEl.innerText = '● Microfone ativo. Pode falar seu comando...';
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript + ' ';
          } else {
            interim += item[0].transcript;
          }
        }

        const text = (finalTranscript + interim).trim();

        // ESCRITA AO VIVO NO CAMPO DO CHAT!
        if (text) {
          this.currentText = text;
          this.hasSpoken = true;

          const chatInput = document.getElementById('chat-input');
          if (chatInput) {
            chatInput.value = text;
            chatInput.style.height = 'auto';
            chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
          }

          if (transcriptEl) {
            transcriptEl.innerText = `● "${text}"`;
          }
        }
      };

      this.recognition.onerror = (event) => {
        console.warn("SpeechRecognition nativo aviso/erro:", event.error);
        // Não travar - o MediaRecorder continuará gravando e o backend transcreverá se necessário
      };

      this.recognition.onend = () => {
        // Se ainda estamos escutando e o browser finalizou a sessão nativa antes da hora, tentar reiniciar
        if (this.isListening && this.recognition) {
          try {
            this.recognition.start();
          } catch (e) {}
        }
      };
    } catch (e) {
      console.warn("Erro ao configurar SpeechRecognition nativo:", e);
      this.recognition = null;
    }
  }

  async toggleListening() {
    if (this.isListening) {
      await this.stopListening();
    } else {
      await this.startListening();
    }
  }

  async startListening() {
    this.ensureAudioContext();

    if (this.isListening || this.isTranscribing) return;

    this.currentText = '';
    this.hasSpoken = false;
    this.audioChunks = [];

    const bannerEl = document.getElementById('speech-banner');
    const transcriptEl = document.getElementById('speech-transcript');
    if (bannerEl) bannerEl.classList.remove('hidden');
    if (transcriptEl) transcriptEl.innerText = '● Microfone conectando...';

    // 1. Obter Stream do Microfone de Hardware
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (err) {
      console.warn("Erro ao acessar microfone:", err);
      let msg = "Microfone inacessível no navegador.";
      if (err.name === 'NotAllowedError') {
        msg = "Permissão de microfone negada! Clique no cadeado na barra de endereços do navegador e marque 'Permitir'.";
      } else if (err.name === 'NotFoundError') {
        msg = "Nenhum microfone encontrado conectado ao computador.";
      }
      if (this.onErrorMessage) this.onErrorMessage(msg);
      if (transcriptEl) transcriptEl.innerText = `⚠️ ${msg}`;
      if (bannerEl) bannerEl.classList.remove('hidden');
      alert(msg);
      return;
    }

    this.isListening = true;
    if (this.onStateChange) this.onStateChange('LISTENING');
    this.playToolBeep();

    // 2. Conectar AnalyserNode para medir volume em tempo real & verificar som real
    try {
      this.ensureAudioContext();
      const source = this.audioCtx.createMediaStreamSource(this.micStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      this.startVolumeMonitor();
    } catch (e) {
      console.warn("AnalyserNode não inicializado:", e);
    }

    // 3. Iniciar Gravador de Hardware (MediaRecorder para Fallback de Alta Precisão)
    try {
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        }

        const options = mimeType ? { mimeType } : {};
        this.mediaRecorder = new MediaRecorder(this.micStream, options);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };

        this.mediaRecorder.start(100); // Coletar fatias a cada 100ms
      }
    } catch (e) {
      console.warn("MediaRecorder falhou ao iniciar:", e);
    }

    // 4. Iniciar SpeechRecognition Nativo (Web Speech API)
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        // Ignorar se já iniciado
      }
    }
  }

  startVolumeMonitor() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const transcriptEl = document.getElementById('speech-transcript');
    let silenceCount = 0;
    let zeroCount = 0;

    const checkVolume = () => {
      if (!this.isListening) return;

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const vol = Math.min(100, Math.round(avg / 1.8));

      // Se o volume estiver captando som (> 8%)
      if (vol > 8) {
        this.hasSpoken = true;
        silenceCount = 0;
        zeroCount = 0;

        if (!this.currentText && transcriptEl) {
          transcriptEl.innerText = `🗣️ Captando voz [Volume: ${vol}%] - Fale seu comando...`;
        }
      } else {
        if (!this.hasSpoken) {
          zeroCount++;
          if (zeroCount === 30 && transcriptEl) { // 3 segundos de silêncio absoluto
            transcriptEl.innerText = `● Microfone ativo [Vol: 0%] - Verifique se não está mudo no Windows ou fale mais perto`;
          }
        } else {
          silenceCount++;
          // Se o usuário falou e agora ficou em silêncio por ~1.6 segundos (16 * 100ms)
          if (silenceCount >= 16) {
            if (this.onStatusMessage) this.onStatusMessage("Silêncio detectado após a fala. Processando ordem...");
            this.stopListening();
            return;
          }
        }
      }

      this.volumeTimer = setTimeout(checkVolume, 100);
    };

    checkVolume();
  }

  async stopListening() {
    if (!this.isListening) return;
    this.isListening = false;
    clearTimeout(this.volumeTimer);

    const transcriptEl = document.getElementById('speech-transcript');
    const bannerEl = document.getElementById('speech-banner');

    // 1. Parar reconhecimento nativo
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    // 2. Parar gravador de hardware
    const recorder = this.mediaRecorder;
    const stream = this.micStream;

    const stopHardwarePromise = new Promise((resolve) => {
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = () => {
          if (stream) {
            stream.getTracks().forEach(t => t.stop());
          }
          resolve();
        };
        recorder.stop();
      } else {
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }
        resolve();
      }
    });

    await stopHardwarePromise;

    // 3. Avaliar resultado do reconhecimento
    const recognizedText = (this.currentText || '').trim();

    // Cenário A: O navegador já transcreveu texto via Web Speech API nativo
    if (recognizedText) {
      if (transcriptEl) transcriptEl.innerText = `✔ "${recognizedText}"`;
      setTimeout(() => {
        if (bannerEl) bannerEl.classList.add('hidden');
      }, 1500);

      this.currentText = '';
      if (this.onStateChange) this.onStateChange('IDLE');
      if (this.onSpeechRecognized) {
        this.onSpeechRecognized(recognizedText);
      }
      return;
    }

    // Cenário B: Web Speech API nativo não transcreveu nada (Brave, silêncio do Google ou sem suporte)
    // Enviar o áudio captado do microfone para o backend Python JARVIS decodificar!
    if (this.audioChunks.length > 0) {
      const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });

      // Se tiver dados de áudio reais (> 800 bytes)
      if (audioBlob.size > 800) {
        this.isTranscribing = true;
        if (this.onStateChange) this.onStateChange('THINKING');
        if (transcriptEl) transcriptEl.innerText = '⚡ JARVIS decodificando comando de voz via IA...';
        if (this.onStatusMessage) this.onStatusMessage("Transcrevendo áudio via servidor neural...");

        try {
          const res = await JarvisAPI.transcribeAudio(audioBlob);
          this.isTranscribing = false;

          if (res && res.success && res.text && res.text.trim()) {
            const finalSpoken = res.text.trim();
            if (transcriptEl) transcriptEl.innerText = `✔ "${finalSpoken}"`;
            setTimeout(() => {
              if (bannerEl) bannerEl.classList.add('hidden');
            }, 1500);

            // Escrever imediatamente no input
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
              chatInput.value = finalSpoken;
              chatInput.style.height = 'auto';
              chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
            }

            if (this.onStateChange) this.onStateChange('IDLE');
            if (this.onSpeechRecognized) {
              this.onSpeechRecognized(finalSpoken);
            }
            return;
          } else {
            const err = res?.error || "Nenhuma palavra compreensível identificada.";
            if (transcriptEl) transcriptEl.innerText = `⚠️ ${err}`;
            if (this.onStatusMessage) this.onStatusMessage(`[TRANSCRIÇÃO]: ${err}`);
            setTimeout(() => {
              if (bannerEl) bannerEl.classList.add('hidden');
            }, 3000);
          }
        } catch (postErr) {
          this.isTranscribing = false;
          console.error("Erro na transcrição de áudio:", postErr);
          if (transcriptEl) transcriptEl.innerText = '⚠️ Erro de conexão ao transcrever áudio.';
        }
      } else {
        if (transcriptEl) transcriptEl.innerText = '⚠️ Áudio muito curto ou sem fala.';
        setTimeout(() => {
          if (bannerEl) bannerEl.classList.add('hidden');
        }, 2000);
      }
    } else {
      if (bannerEl) bannerEl.classList.add('hidden');
    }

    if (this.onStateChange) this.onStateChange('IDLE');
  }

  async testMicrophoneHardware(onProgress, onResult) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.ensureAudioContext();
      const source = this.audioCtx.createMediaStreamSource(stream);
      const analyser = this.audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxVol = 0;
      let count = 0;

      const timer = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const pct = Math.round((sum / dataArray.length) / 2.55);
        if (pct > maxVol) maxVol = pct;
        count++;

        if (onProgress) onProgress(pct);

        if (count >= 25) { // 2.5 segundos de teste
          clearInterval(timer);
          stream.getTracks().forEach(t => t.stop());
          if (onResult) onResult(maxVol);
        }
      }, 100);
    } catch (e) {
      if (onResult) onResult(-1, e.message);
    }
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

        // Priorizar voz em português
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

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/\[TOOL:[^\]]+\]/g, '')
      .replace(/[#*`_~]/g, '')
      .replace(/https?:\/\/\S+/g, 'link na web')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) return;

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
