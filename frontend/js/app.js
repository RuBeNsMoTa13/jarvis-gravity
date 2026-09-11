/**
 * APLICAÇÃO PRINCIPAL J.A.R.V.I.S.
 * Conecta UI, Arc Reactor, Sistema de Áudio/Voz e API de IA Local.
 */

import { ArcReactor } from './reactor.js';
import { JarvisAudio } from './audio.js';
import { JarvisAPI } from './api.js';

class JarvisApp {
  constructor() {
    this.messages = [];
    this.currentModel = '';
    this.isGenerating = false;
    this.pollTelemetryTimer = null;

    // Inicializar Reator Arc
    this.reactor = new ArcReactor('arc-reactor-canvas');

    // Inicializar Sistema de Áudio
    this.audio = new JarvisAudio(
      (speechText) => this.handleSpeechInput(speechText),
      (state) => this.reactor.setState(state)
    );

    // Inicializar Elementos de UI
    this.bindDOMElements();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();

    // Inicialização do Sistema
    this.bootSystem();
  }

  bindDOMElements() {
    // Cabeçalho & Seletores
    this.modelSelect = document.getElementById('model-select');
    this.refreshModelsBtn = document.getElementById('refresh-models-btn');
    this.statusText = document.getElementById('status-text');
    this.researchCountBadge = document.getElementById('research-count');

    // Telemetria
    this.cpuVal = document.getElementById('cpu-val');
    this.cpuBar = document.getElementById('cpu-bar');
    this.ramVal = document.getElementById('ram-val');
    this.ramBar = document.getElementById('ram-bar');
    this.diskVal = document.getElementById('disk-val');
    this.diskBar = document.getElementById('disk-bar');
    this.ollamaStatus = document.getElementById('ollama-status');
    this.engineModelTag = document.getElementById('engine-model-tag');

    // Terminal
    this.terminalOutput = document.getElementById('terminal-output');
    this.clearTermBtn = document.getElementById('clear-term-btn');

    // Chat
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('send-btn');
    this.clearChatBtn = document.getElementById('clear-chat-btn');
    this.toolBanner = document.getElementById('tool-banner');
    this.toolBannerName = document.getElementById('tool-banner-name');
    this.toolBannerDetail = document.getElementById('tool-banner-detail');
    this.autonomousToggle = document.getElementById('autonomous-toggle');

    // Controles de Áudio & Voz
    this.micBtn = document.getElementById('mic-toggle-btn');
    this.ttsToggleBtn = document.getElementById('tts-toggle-btn');
    this.sfxToggleBtn = document.getElementById('sfx-toggle-btn');

    // Drawers & Modais
    this.toggleResearchesBtn = document.getElementById('toggle-researches-btn');
    this.toggleSettingsBtn = document.getElementById('toggle-settings-btn');
    this.researchesDrawer = document.getElementById('researches-drawer');
    this.settingsDrawer = document.getElementById('settings-drawer');
    this.researchesList = document.getElementById('researches-list');
    this.openResearchFolderBtn = document.getElementById('open-research-folder-btn');

    // Configurações
    this.pullModelInput = document.getElementById('pull-model-input');
    this.pullModelBtn = document.getElementById('pull-model-btn');
    this.pullProgressBox = document.getElementById('pull-progress-box');
    this.pullStatusText = document.getElementById('pull-status-text');
    this.pullPercentText = document.getElementById('pull-percent-text');
    this.pullBarFill = document.getElementById('pull-bar-fill');
    this.tempSlider = document.getElementById('temp-slider');
    this.tempVal = document.getElementById('temp-val');

    this.voiceSelect = document.getElementById('voice-select');
    this.voiceRate = document.getElementById('voice-rate');
    this.voiceRateVal = document.getElementById('voice-rate-val');
    this.voicePitch = document.getElementById('voice-pitch');
    this.voicePitchVal = document.getElementById('voice-pitch-val');
    this.testVoiceBtn = document.getElementById('test-voice-btn');

    // Modal Dossiê
    this.dossierModal = document.getElementById('dossier-modal');
    this.modalDossierTitle = document.getElementById('modal-dossier-title');
    this.modalDossierContent = document.getElementById('modal-dossier-content');
    this.modalOpenWinBtn = document.getElementById('modal-open-win-btn');
    this.closeModalBtn = document.getElementById('close-modal-btn');
  }

  setupEventListeners() {
    // Envio de Mensagem
    this.sendBtn.addEventListener('click', () => this.handleUserSubmit());
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleUserSubmit();
      }
    });

    // Auto-ajustar altura do textarea
    this.chatInput.addEventListener('input', () => {
      this.chatInput.style.height = 'auto';
      this.chatInput.style.height = `${Math.min(this.chatInput.scrollHeight, 120)}px`;
    });

    // Microfone
    this.micBtn.addEventListener('click', () => {
      this.audio.toggleListening();
      this.updateMicBtnState();
    });

    // Toggles de Áudio
    this.ttsToggleBtn.addEventListener('click', () => {
      this.audio.ttsEnabled = !this.audio.ttsEnabled;
      this.ttsToggleBtn.classList.toggle('active', this.audio.ttsEnabled);
    });

    this.sfxToggleBtn.addEventListener('click', () => {
      this.audio.sfxEnabled = !this.audio.sfxEnabled;
      this.sfxToggleBtn.classList.toggle('active', this.audio.sfxEnabled);
    });

    // Comandos Rápidos
    document.querySelectorAll('.quick-cmd-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        if (prompt) {
          this.chatInput.value = prompt;
          this.handleUserSubmit();
        }
      });
    });

    // Limpar Chat
    this.clearChatBtn.addEventListener('click', () => {
      this.messages = [];
      this.chatMessages.innerHTML = `
        <div class="chat-msg jarvis-msg">
          <div class="msg-avatar">◈</div>
          <div class="msg-body">
            <div class="msg-meta"><span class="msg-sender">JARVIS</span><span class="msg-time">AGORA</span></div>
            <div class="msg-content">Histórico limpo, senhor. Como posso ajudá-lo agora?</div>
          </div>
        </div>
      `;
      this.audio.playToolBeep();
    });

    // Limpar Terminal
    this.clearTermBtn.addEventListener('click', () => {
      this.terminalOutput.innerHTML = '<div class="log-line sys">[SYSTEM] Terminal limpo.</div>';
    });

    // Alternância de Modelos
    this.modelSelect.addEventListener('change', (e) => {
      this.currentModel = e.target.value;
      this.engineModelTag.innerText = this.currentModel;
      this.logTerminal(`[MODELO ATIVO]: Alternado para ${this.currentModel}`, 'sys');
      this.audio.playToolBeep();
    });

    this.refreshModelsBtn.addEventListener('click', () => {
      this.loadModels();
      this.audio.playToolBeep();
    });

    // Drawers
    this.toggleResearchesBtn.addEventListener('click', () => this.toggleDrawer('researches-drawer'));
    this.toggleSettingsBtn.addEventListener('click', () => this.toggleDrawer('settings-drawer'));

    document.querySelectorAll('.close-drawer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-drawer');
        if (id) {
          document.getElementById(id).classList.remove('open');
        } else {
          this.dossierModal.classList.add('hidden');
        }
      });
    });

    this.openResearchFolderBtn.addEventListener('click', () => {
      JarvisAPI.openResearch();
      this.logTerminal(`[SISTEMA]: Abrindo diretório de pesquisas no Windows Explorer...`, 'cmd');
    });

    // Baixar Novo Modelo (Pull)
    this.pullModelBtn.addEventListener('click', () => this.handlePullModel());

    // Sliders de Configuração
    this.tempSlider.addEventListener('input', (e) => {
      this.tempVal.innerText = parseFloat(e.target.value).toFixed(2);
    });

    this.voiceRate.addEventListener('input', (e) => {
      this.audio.voiceRate = parseFloat(e.target.value);
      this.voiceRateVal.innerText = `${this.audio.voiceRate.toFixed(2)}x`;
    });

    this.voicePitch.addEventListener('input', (e) => {
      this.audio.voicePitch = parseFloat(e.target.value);
      this.voicePitchVal.innerText = this.audio.voicePitch.toFixed(2);
    });

    this.voiceSelect.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value, 10);
      if (this.audio.voices[idx]) {
        this.audio.selectedVoice = this.audio.voices[idx];
      }
    });

    this.testVoiceBtn.addEventListener('click', () => {
      this.audio.speak("Sistemas vocais operacionais, senhor. JARVIS às suas ordens.");
    });

    // Fechar modal ao clicar fora
    this.dossierModal.addEventListener('click', (e) => {
      if (e.target === this.dossierModal) {
        this.dossierModal.classList.add('hidden');
      }
    });
  }

  setupKeyboardShortcuts() {
    let spaceDown = false;

    window.addEventListener('keydown', (e) => {
      // Push-to-Talk com tecla Espaço (apenas se não estiver digitando em input/textarea)
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if (e.code === 'Space' && !isInput && !spaceDown) {
        e.preventDefault();
        spaceDown = true;
        this.audio.startListening();
        this.updateMicBtnState();
      }
    });

    window.addEventListener('keyup', (e) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if (e.code === 'Space' && !isInput && spaceDown) {
        e.preventDefault();
        spaceDown = false;
        this.audio.stopListening();
        this.updateMicBtnState();
      }
    });
  }

  async bootSystem() {
    this.audio.playStartupSFX();
    this.logTerminal('[SYSTEM] Inicializando subsistemas do protocolo JARVIS...', 'sys');

    await this.loadModels();
    await this.updateTelemetry();
    await this.loadResearches();

    // Iniciar loop de telemetria a cada 3 segundos
    this.pollTelemetryTimer = setInterval(() => this.updateTelemetry(), 3000);
  }

  async loadModels() {
    const data = await JarvisAPI.getModels();
    this.modelSelect.innerHTML = '';

    if (data.models && data.models.length > 0) {
      data.models.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = `${m.name} (${m.size_gb ? m.size_gb + ' GB' : 'Local'})`;
        this.modelSelect.appendChild(opt);
      });

      // Definir modelo padrão
      if (!this.currentModel) {
        this.currentModel = data.default_model || data.models[0].name;
      }
      this.modelSelect.value = this.currentModel;
      this.engineModelTag.innerText = this.currentModel;
      this.logTerminal(`[OLLAMA]: ${data.models.length} modelos locais disponíveis detectados.`, 'sys');
    } else {
      const opt = document.createElement('option');
      opt.textContent = 'Nenhum modelo encontrado';
      this.modelSelect.appendChild(opt);
    }
  }

  async updateTelemetry() {
    const data = await JarvisAPI.getTelemetry();
    if (!data.success) return;

    // Atualizar CPU
    const cpu = Math.round(data.cpu_percent || 0);
    this.cpuVal.innerText = `${cpu}%`;
    this.cpuBar.style.width = `${cpu}%`;

    // Atualizar RAM
    const ramPercent = Math.round(data.ram_percent || 0);
    this.ramVal.innerText = `${data.ram_used_gb || 0} / ${data.ram_total_gb || 0} GB`;
    this.ramBar.style.width = `${ramPercent}%`;

    // Atualizar Disco
    const diskPercent = Math.round(data.disk_percent || 0);
    this.diskVal.innerText = `${data.disk_free_gb || 0} GB LIVRES`;
    this.diskBar.style.width = `${diskPercent}%`;

    // Atualizar Ollama
    if (data.ollama_connected) {
      this.ollamaStatus.innerText = 'CONECTADO';
      this.ollamaStatus.className = 'badge-status online';
    } else {
      this.ollamaStatus.innerText = 'DESCONECTADO';
      this.ollamaStatus.className = 'badge-status offline';
    }
  }

  async loadResearches() {
    const res = await JarvisAPI.getResearches();
    if (!res.success) return;

    this.researchCountBadge.innerText = res.count;
    this.researchesList.innerHTML = '';

    if (res.items.length === 0) {
      this.researchesList.innerHTML = `
        <div class="empty-dossier-state">Nenhum dossiê gerado ainda. Peça ao JARVIS: <em>"Crie um resumo em markdown sobre IA"</em></div>
      `;
      return;
    }

    res.items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'dossier-card';
      card.innerHTML = `
        <div class="dossier-head">
          <span class="dossier-title">📄 ${item.title}</span>
          <span class="dossier-date">${item.modified}</span>
        </div>
        <p class="dossier-preview">${item.preview || 'Sem pré-visualização'}</p>
      `;
      card.addEventListener('click', () => this.openDossierModal(item.filename));
      this.researchesList.appendChild(card);
    });
  }

  async openDossierModal(filename) {
    const res = await JarvisAPI.getResearchContent(filename);
    if (!res || !res.success) return;

    this.modalDossierTitle.innerText = res.filename;
    
    // Renderizar com Marked
    if (window.marked) {
      this.modalDossierContent.innerHTML = window.marked.parse(res.content);
    } else {
      this.modalDossierContent.innerText = res.content;
    }

    this.modalOpenWinBtn.onclick = () => {
      JarvisAPI.openResearch(filename);
      this.logTerminal(`[SISTEMA]: Abrindo ${filename} no Windows...`, 'cmd');
    };

    this.dossierModal.classList.remove('hidden');
    this.audio.playToolBeep();
  }

  async handlePullModel() {
    const modelName = this.pullModelInput.value.trim();
    if (!modelName) return;

    this.pullProgressBox.classList.remove('hidden');
    this.pullStatusText.innerText = `Conectando ao repositório para ${modelName}...`;
    this.pullBarFill.style.width = '0%';
    this.pullPercentText.innerText = '0%';
    this.pullModelBtn.disabled = true;

    this.logTerminal(`[OLLAMA PULL]: Iniciando download do modelo '${modelName}'...`, 'cmd');

    await JarvisAPI.pullModel(modelName, (progress) => {
      if (progress.status === 'error') {
        this.pullStatusText.innerText = `Erro: ${progress.error}`;
        this.pullModelBtn.disabled = false;
        this.logTerminal(`[ERRO PULL]: ${progress.error}`, 'sys');
      } else {
        this.pullStatusText.innerText = progress.status || 'Baixando...';
        if (progress.percent !== undefined) {
          this.pullPercentText.innerText = `${progress.percent}%`;
          this.pullBarFill.style.width = `${progress.percent}%`;
        }

        if (progress.done) {
          this.pullStatusText.innerText = 'Download concluído com sucesso!';
          this.pullModelBtn.disabled = false;
          this.loadModels();
          this.audio.playCompletionChime();
          this.logTerminal(`[OLLAMA]: Modelo ${modelName} pronto para uso!`, 'sys');
        }
      }
    });
  }

  handleSpeechInput(text) {
    this.chatInput.value = text;
    this.handleUserSubmit();
  }

  updateMicBtnState() {
    if (this.audio.isListening) {
      this.micBtn.classList.add('recording');
      document.getElementById('mic-btn-label').innerText = 'OUVINDO...';
    } else {
      this.micBtn.classList.remove('recording');
      document.getElementById('mic-btn-label').innerText = 'FALAR COM JARVIS';
    }
  }

  toggleDrawer(id) {
    const drawer = document.getElementById(id);
    const isOpen = drawer.classList.contains('open');

    // Fechar todos
    this.researchesDrawer.classList.remove('open');
    this.settingsDrawer.classList.remove('open');

    if (!isOpen) {
      drawer.classList.add('open');
      if (id === 'researches-drawer') {
        this.loadResearches();
      }
    }
    this.audio.playToolBeep();
  }

  logTerminal(text, type = 'out') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.innerText = text;
    this.terminalOutput.appendChild(line);
    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
  }

  /* ==========================================================================
     SUBMISSÃO DO USUÁRIO & PROCESSAMENTO STREAMING
     ========================================================================== */

  async handleUserSubmit() {
    if (this.isGenerating) return;

    const text = this.chatInput.value.trim();
    if (!text) return;

    this.chatInput.value = '';
    this.chatInput.style.height = 'auto';

    // 1. Renderizar mensagem do usuário
    this.appendMessage('user', text);
    this.messages.push({ role: 'user', content: text });

    this.isGenerating = true;
    this.reactor.setState('THINKING');
    this.audio.playToolBeep();

    // 2. Criar card da resposta do JARVIS com streaming
    const assistantMsg = this.appendStreamingMessage();
    let fullResponse = '';

    const temperature = parseFloat(this.tempSlider.value) || 0.7;
    const autonomous = this.autonomousToggle.checked;

    await JarvisAPI.chatStream({
      messages: this.messages,
      model: this.currentModel,
      temperature: temperature,
      autonomous: autonomous,

      onToken: (token) => {
        fullResponse += token;
        assistantMsg.updateContent(fullResponse);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      },

      onToolStart: (toolEvent) => {
        this.showToolBanner(toolEvent.label, toolEvent.details);
        this.logTerminal(`[FERRAMENTA INICIADA]: ${toolEvent.label} (${toolEvent.tool})`, 'cmd');
        assistantMsg.appendToolBadge(toolEvent);
      },

      onToolEnd: (toolEvent) => {
        this.hideToolBanner();
        this.logTerminal(`[FERRAMENTA CONCLUÍDA]: ${toolEvent.tool}`, 'sys');
        if (toolEvent.tool === 'os_command' && toolEvent.data) {
          const out = toolEvent.data.stdout || toolEvent.data.stderr || '(sem saída)';
          this.logTerminal(`[SAÍDA]: ${out.substring(0, 160)}`, 'out');
        }
      },

      onFileCreated: (fileData) => {
        this.loadResearches();
        assistantMsg.appendFileCreatedCard(fileData);
        this.logTerminal(`[DOSSIÊ SALVO]: ${fileData.filename} (${fileData.size} bytes)`, 'sys');
      },

      onDone: (finalContent) => {
        this.isGenerating = false;
        this.hideToolBanner();
        this.reactor.setState('IDLE');
        this.audio.playCompletionChime();

        if (finalContent) {
          this.messages.push({ role: 'assistant', content: finalContent });
          // Falar resposta se TTS estiver ativado
          this.audio.speak(finalContent);
        }
      },

      onError: (errMsg) => {
        this.isGenerating = false;
        this.hideToolBanner();
        this.reactor.setState('IDLE');
        assistantMsg.updateContent(`⚠️ **Erro de Comunicação Neural**: ${errMsg}`);
        this.logTerminal(`[ERRO]: ${errMsg}`, 'sys');
      }
    });
  }

  showToolBanner(name, detail) {
    this.toolBannerName.innerText = name.toUpperCase();
    this.toolBannerDetail.innerText = detail;
    this.toolBanner.classList.remove('hidden');
  }

  hideToolBanner() {
    this.toolBanner.classList.add('hidden');
  }

  appendMessage(role, content) {
    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${role === 'user' ? 'user-msg' : 'jarvis-msg'}`;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatar = role === 'user' ? 'U' : '◈';
    const sender = role === 'user' ? 'OPERADOR' : 'JARVIS';

    msgEl.innerHTML = `
      <div class="msg-avatar">${avatar}</div>
      <div class="msg-body">
        <div class="msg-meta">
          <span class="msg-sender">${sender}</span>
          <span class="msg-time">${now}</span>
        </div>
        <div class="msg-content">${this.renderMarkdown(content)}</div>
      </div>
    `;

    this.chatMessages.appendChild(msgEl);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  appendStreamingMessage() {
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg jarvis-msg';

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgEl.innerHTML = `
      <div class="msg-avatar">◈</div>
      <div class="msg-body">
        <div class="msg-meta">
          <span class="msg-sender">JARVIS</span>
          <span class="msg-time">${now}</span>
        </div>
        <div class="msg-tools-container"></div>
        <div class="msg-content"><span class="streaming-cursor">█</span></div>
      </div>
    `;

    this.chatMessages.appendChild(msgEl);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    const contentDiv = msgEl.querySelector('.msg-content');
    const toolsContainer = msgEl.querySelector('.msg-tools-container');

    return {
      updateContent: (rawMarkdown) => {
        contentDiv.innerHTML = this.renderMarkdown(rawMarkdown);
      },
      appendToolBadge: (toolEvent) => {
        const badge = document.createElement('div');
        const toolTypeClass = toolEvent.tool.includes('search') ? 'search' : toolEvent.tool.includes('command') ? 'cmd' : 'dossier';
        badge.className = `tool-execution-card ${toolTypeClass}`;
        badge.innerHTML = `
          <div class="tool-header-line">⚡ ${toolEvent.label}</div>
          <div>${toolEvent.details}</div>
        `;
        toolsContainer.appendChild(badge);
      },
      appendFileCreatedCard: (fileData) => {
        const card = document.createElement('div');
        card.className = 'tool-execution-card dossier';
        card.innerHTML = `
          <div class="tool-header-line">📄 DOSSIÊ SALVO EM MARKDOWN</div>
          <div style="margin: 4px 0;"><strong>${fileData.title}</strong></div>
          <div style="font-size: 10px; color: #94a3b8;">${fileData.filename} (${fileData.size} bytes)</div>
          <button class="hud-btn-subtle" style="margin-top: 6px; padding: 4px 8px; font-size: 10px; cursor: pointer;">📂 Abrir no Windows</button>
        `;
        const btn = card.querySelector('button');
        btn.addEventListener('click', () => {
          JarvisAPI.openResearch(fileData.filename);
        });
        toolsContainer.appendChild(card);
      }
    };
  }

  renderMarkdown(text) {
    if (!text) return '';
    if (window.marked) {
      try {
        return window.marked.parse(text);
      } catch (e) {
        console.error("Erro no parse de Markdown:", e);
      }
    }
    // Fallback básico
    return text.replace(/\n/g, '<br>');
  }
}

// Inicializar aplicativo quando o DOM carregar
window.addEventListener('DOMContentLoaded', () => {
  window.jarvisApp = new JarvisApp();
});
