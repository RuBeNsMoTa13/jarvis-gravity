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
      (state) => {
        this.reactor.setState(state);
        this.updateMicBtnState();
      },
      (errMsg) => {
        this.logTerminal(`[SISTEMA DE VOZ]: ${errMsg}`, 'sys');
      },
      (statusMsg) => {
        this.logTerminal(`[VOZ]: ${statusMsg}`, 'sys');
      }
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
    this.composerMicBtn = document.getElementById('composer-mic-btn');
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
    this.testMicHardwareBtn = document.getElementById('test-mic-hardware-btn');

    // Modelos de API
    this.apiModels = [];
    this.apiModelsCatalog = document.getElementById('api-models-catalog');
    this.sessionKeyProvider = document.getElementById('session-key-provider');
    this.sessionApiKeyInput = document.getElementById('session-api-key-input');
    this.toggleKeyVisBtn = document.getElementById('toggle-key-visibility-btn');
    this.testApiKeyBtn = document.getElementById('test-api-key-btn');
    this.saveSessionKeyBtn = document.getElementById('save-session-key-btn');
    this.clearSessionKeyBtn = document.getElementById('clear-session-key-btn');
    this.keyTestFeedback = document.getElementById('key-test-feedback');
    this.toggleAddModelBtn = document.getElementById('toggle-add-model-btn');
    this.addApiModelContainer = document.getElementById('add-api-model-container');
    this.newModelProvider = document.getElementById('new-model-provider');
    this.newModelName = document.getElementById('new-model-name');
    this.newModelId = document.getElementById('new-model-id');
    this.newModelBaseUrl = document.getElementById('new-model-base-url');
    this.submitNewModelBtn = document.getElementById('submit-new-model-btn');

    // Entrada Manual de Modelo & Toolkit Google
    this.toggleManualModelBtn = document.getElementById('toggle-manual-model-btn');
    this.manualModelBar = document.getElementById('manual-model-bar');
    this.manualModelInput = document.getElementById('manual-model-input');
    this.applyManualModelBtn = document.getElementById('apply-manual-model-btn');
    this.cancelManualModelBtn = document.getElementById('cancel-manual-model-btn');
    this.syncGoogleModelsBtn = document.getElementById('sync-google-models-btn');
    this.googleSyncedFeedback = document.getElementById('google-synced-feedback');

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
    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => {
        this.audio.toggleListening();
        this.updateMicBtnState();
      });
    }

    if (this.composerMicBtn) {
      this.composerMicBtn.addEventListener('click', () => {
        this.audio.toggleListening();
        this.updateMicBtnState();
      });
    }

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
            <div class="msg-meta">
              <span class="msg-sender">JARVIS</span>
              <span class="msg-time">AGORA</span>
              <button class="copy-msg-btn" title="Copiar mensagem">📋 Copiar</button>
            </div>
            <div class="msg-content">Histórico limpo, senhor. Como posso ajudá-lo agora?</div>
          </div>
        </div>
      `;
      this.audio.playToolBeep();
    });

    // Cópia rápida de mensagens via delegação de eventos
    this.chatMessages.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.copy-msg-btn');
      if (copyBtn) {
        const msgBody = copyBtn.closest('.msg-body');
        const contentDiv = msgBody ? msgBody.querySelector('.msg-content') : null;
        if (contentDiv) {
          const textToCopy = contentDiv.innerText || contentDiv.textContent || '';
          this.copyToClipboard(textToCopy, copyBtn);
        }
      }
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

    if (this.testMicHardwareBtn) {
      this.testMicHardwareBtn.addEventListener('click', () => {
        this.logTerminal(`[TESTE HARDWARE]: Testando microfone... Fale algo nos próximos 3 segundos!`, 'cmd');
        this.testMicHardwareBtn.disabled = true;
        this.testMicHardwareBtn.innerText = '🎙️ Captando... Fale!';

        this.audio.testMicrophoneHardware(
          (currentVol) => {
            if (currentVol > 4) {
              this.logTerminal(`[SINAL DE ÁUDIO]: Nível detectado: ${currentVol}%`, 'out');
            }
          },
          (maxVol, err) => {
            this.testMicHardwareBtn.disabled = false;
            this.testMicHardwareBtn.innerText = '🎙️ Testar Entrada de Microfone';

            if (err) {
              this.logTerminal(`[ERRO HARDWARE]: ${err}`, 'sys');
              alert(`Erro no microfone: ${err}`);
            } else if (maxVol > 5) {
              this.logTerminal(`[SUCESSO]: Microfone funcionando perfeitamente! Volume máximo detectado: ${maxVol}%`, 'sys');
              this.audio.playCompletionChime();
            } else {
              this.logTerminal(`[AVISO]: Volume detectado foi 0% ou muito baixo. Verifique se o microfone está desmutado e configurado como dispositivo padrão no Windows (Configurações > Sistema > Som).`, 'sys');
            }
          }
        );
      });
    }

    // Eventos de Modelos de API & Chaves de Sessão
    if (this.toggleKeyVisBtn) {
      this.toggleKeyVisBtn.addEventListener('click', () => {
        const isPass = this.sessionApiKeyInput.type === 'password';
        this.sessionApiKeyInput.type = isPass ? 'text' : 'password';
        this.toggleKeyVisBtn.innerText = isPass ? '🔒' : '👁️';
      });
    }

    if (this.sessionKeyProvider) {
      this.sessionKeyProvider.addEventListener('change', () => {
        const prov = this.sessionKeyProvider.value;
        const stored = sessionStorage.getItem('jarvis_key_' + prov) || '';
        this.sessionApiKeyInput.value = stored;
        this.keyTestFeedback.classList.add('hidden');
      });
    }

    if (this.saveSessionKeyBtn) {
      this.saveSessionKeyBtn.addEventListener('click', () => {
        const prov = this.sessionKeyProvider.value;
        const key = this.sessionApiKeyInput.value.trim();
        if (key) {
          sessionStorage.setItem('jarvis_key_' + prov, key);
          this.showKeyFeedback(`✓ Chave de ${prov.toUpperCase()} gravada na memória desta sessão!`, 'success');
          this.logTerminal(`[SEGURANÇA]: Chave de ${prov.toUpperCase()} ativada na sessão do navegador (volátil).`, 'sys');
        } else {
          sessionStorage.removeItem('jarvis_key_' + prov);
          this.showKeyFeedback(`Chave de ${prov.toUpperCase()} removida da sessão.`, 'info');
        }
        this.renderApiModelsCatalog();
      });
    }

    if (this.clearSessionKeyBtn) {
      this.clearSessionKeyBtn.addEventListener('click', () => {
        const prov = this.sessionKeyProvider.value;
        sessionStorage.removeItem('jarvis_key_' + prov);
        this.sessionApiKeyInput.value = '';
        this.showKeyFeedback(`Chave da sessão limpa.`, 'info');
        this.renderApiModelsCatalog();
      });
    }

    if (this.testApiKeyBtn) {
      this.testApiKeyBtn.addEventListener('click', async () => {
        const prov = this.sessionKeyProvider.value;
        const key = this.sessionApiKeyInput.value.trim() || sessionStorage.getItem('jarvis_key_' + prov) || '';
        if (!key) {
          this.showKeyFeedback('Por favor, digite uma chave para testar.', 'error');
          return;
        }

        this.showKeyFeedback('⏳ Testando conexão com a API...', 'info');
        // Achar um model_id padrão para o provedor
        const defaultModel = prov === 'google' ? 'gemini-3.6-flash' : prov === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
        const res = await JarvisAPI.testApiModel({
          provider: prov,
          model_id: defaultModel,
          api_key: key
        });

        if (res.success) {
          this.showKeyFeedback(`✓ ${res.message}`, 'success');
          this.audio.playCompletionChime();
        } else {
          this.showKeyFeedback(`✕ Falha: ${res.error}`, 'error');
          this.audio.playToolBeep();
        }
      });
    }

    if (this.toggleAddModelBtn) {
      this.toggleAddModelBtn.addEventListener('click', () => {
        this.addApiModelContainer.classList.toggle('hidden');
      });
    }

    // Chips de sugestão de modelo
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.newModelProvider.value = btn.getAttribute('data-provider');
        this.newModelId.value = btn.getAttribute('data-model');
        this.newModelName.value = btn.getAttribute('data-name');
        this.addApiModelContainer.classList.remove('hidden');
      });
    });

    // Salvar novo modelo de API no catálogo
    if (this.submitNewModelBtn) {
      this.submitNewModelBtn.addEventListener('click', async () => {
        const prov = this.newModelProvider.value;
        const name = this.newModelName.value.trim();
        const modelId = this.newModelId.value.trim();
        const baseUrl = this.newModelBaseUrl.value.trim() || null;

        if (!modelId) {
          alert('Por favor, informe o Model ID da API.');
          return;
        }

        const res = await JarvisAPI.addApiModel({
          provider: prov,
          name: name || modelId,
          model_id: modelId,
          base_url: baseUrl
        });

        if (res.success) {
          this.logTerminal(`[CATÁLOGO API]: Modelo '${name || modelId}' cadastrado.`, 'sys');
          this.newModelName.value = '';
          this.newModelId.value = '';
          this.newModelBaseUrl.value = '';
          this.addApiModelContainer.classList.add('hidden');
          await this.loadModels();
          this.audio.playCompletionChime();
        } else {
          alert(`Erro ao cadastrar modelo: ${res.error}`);
        }
      });
    }

    // ENTRADA MANUAL DE MODELO (QUALQUER MODELO)
    if (this.toggleManualModelBtn) {
      this.toggleManualModelBtn.addEventListener('click', () => {
        this.manualModelBar.classList.toggle('hidden');
        if (!this.manualModelBar.classList.contains('hidden')) {
          this.manualModelInput.focus();
        }
      });
    }

    if (this.cancelManualModelBtn) {
      this.cancelManualModelBtn.addEventListener('click', () => {
        this.manualModelBar.classList.add('hidden');
      });
    }

    const applyManualModel = () => {
      const val = this.manualModelInput.value.trim();
      if (!val) return;

      this.setCustomModel(val);
      this.manualModelBar.classList.add('hidden');
      this.manualModelInput.value = '';
    };

    if (this.applyManualModelBtn) {
      this.applyManualModelBtn.addEventListener('click', applyManualModel);
    }
    if (this.manualModelInput) {
      this.manualModelInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyManualModel();
        } else if (e.key === 'Escape') {
          this.manualModelBar.classList.add('hidden');
        }
      });
    }

    // SINCRONIZAÇÃO DINÂMICA DE MODELOS GOOGLE VIA API
    if (this.syncGoogleModelsBtn) {
      this.syncGoogleModelsBtn.addEventListener('click', async () => {
        const sessionKey = sessionStorage.getItem('jarvis_key_google');
        this.syncGoogleModelsBtn.innerText = '⏳ Sincronizando...';
        this.syncGoogleModelsBtn.disabled = true;

        const res = await JarvisAPI.getGoogleModels(sessionKey);
        this.syncGoogleModelsBtn.innerText = '🔄 Sincronizar da API Google';
        this.syncGoogleModelsBtn.disabled = false;

        if (res.success && res.models && res.models.length > 0) {
          this.renderGoogleChips(res.models);
          this.googleSyncedFeedback.innerText = `✓ ${res.models.length} modelos Google sincronizados diretamente da API!`;
          this.googleSyncedFeedback.className = 'google-synced-msg success';
          this.googleSyncedFeedback.classList.remove('hidden');
          this.audio.playCompletionChime();
          this.logTerminal(`[GOOGLE API]: ${res.models.length} modelos sincronizados com sucesso.`, 'sys');
        } else {
          this.googleSyncedFeedback.innerText = '✕ Não foi possível sincronizar da API. Verifique sua chave no .env ou no campo de sessão abaixo.';
          this.googleSyncedFeedback.className = 'google-synced-msg error';
          this.googleSyncedFeedback.classList.remove('hidden');
          this.audio.playToolBeep();
        }
      });
    }

    // Eventos nos chips fixos de Google Gemini
    this.bindGeminiChips();

    // Fechar modal ao clicar fora
    this.dossierModal.addEventListener('click', (e) => {
      if (e.target === this.dossierModal) {
        this.dossierModal.classList.add('hidden');
      }
    });
  }

  updateMicBtnState() {
    const isListening = this.audio ? this.audio.isListening : false;

    if (this.micBtn) {
      this.micBtn.classList.toggle('active', isListening);
      this.micBtn.classList.toggle('listening', isListening);
      this.micBtn.classList.toggle('recording', isListening);
      const label = document.getElementById('mic-btn-label');
      if (label) {
        label.innerText = isListening ? 'ESCUTANDO... [NUMLOCK P/ PARAR]' : 'FALAR COM JARVIS [NUMLOCK]';
      }
    }

    if (this.composerMicBtn) {
      this.composerMicBtn.classList.toggle('active', isListening);
      this.composerMicBtn.classList.toggle('listening', isListening);
      this.composerMicBtn.classList.toggle('recording', isListening);
      this.composerMicBtn.title = isListening ? 'Parar escuta (Tecla NumLock)' : 'Ativar microfone (Tecla NumLock ou Ctrl+Espaço)';
    }

    if (this.statusText) {
      this.statusText.innerText = isListening ? 'ESCUTANDO VOZ...' : 'SISTEMAS PRONTOS';
    }
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // 1. ATALHO PRINCIPAL SOLICITADO: TECLA NUMLOCK
      const isNumLock = e.code === 'NumLock' || e.key === 'NumLock' || e.keyCode === 144;
      if (isNumLock) {
        e.preventDefault();
        this.logTerminal(`[TECLADO]: Tecla NumLock pressionada -> Alternando microfone...`, 'cmd');
        if (this.audio) {
          this.audio.toggleListening();
          this.updateMicBtnState();
        }
        return;
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

    const localList = data.local_models || data.models || [];
    const apiList = data.api_models || [];
    this.apiModels = apiList;

    // 1. Grupo de Modelos Locais (Ollama)
    if (localList.length > 0) {
      const localGroup = document.createElement('optgroup');
      localGroup.label = '🏠 Modelos Locais (Ollama Offline)';

      localList.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = `${m.name} (${m.size_gb ? m.size_gb + ' GB' : 'Local'})`;
        localGroup.appendChild(opt);
      });
      this.modelSelect.appendChild(localGroup);
    }

    // 2. Grupo de Modelos em Nuvem (API)
    if (apiList.length > 0) {
      const apiGroup = document.createElement('optgroup');
      apiGroup.label = '☁️ Modelos em Nuvem (API)';

      apiList.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.name} [${m.provider.toUpperCase()}]`;
        apiGroup.appendChild(opt);
      });
      this.modelSelect.appendChild(apiGroup);
    }

    // Definir modelo padrão se ainda não definido
    if (!this.currentModel) {
      if (localList.length > 0) {
        this.currentModel = data.default_model || localList[0].name;
      } else if (apiList.length > 0) {
        this.currentModel = apiList[0].id;
      }
    }
    this.modelSelect.value = this.currentModel;
    this.engineModelTag.innerText = this.currentModel;

    this.logTerminal(`[MODELOS]: ${localList.length} locais (Ollama) e ${apiList.length} em nuvem (API) carregados.`, 'sys');
    this.renderApiModelsCatalog();
  }

  renderApiModelsCatalog() {
    if (!this.apiModelsCatalog) return;
    this.apiModelsCatalog.innerHTML = '';

    if (this.apiModels.length === 0) {
      this.apiModelsCatalog.innerHTML = '<div class="catalog-empty">Nenhum modelo de API cadastrado no catálogo.</div>';
      return;
    }

    this.apiModels.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'api-model-item';

      const sessionKey = sessionStorage.getItem('jarvis_key_' + m.provider);
      let statusBadge = '';
      if (m.has_env_key) {
        statusBadge = '<span class="status-chip env" title="Chave configurada em variável de ambiente (.env)">ENV ATIVA</span>';
      } else if (sessionKey) {
        statusBadge = '<span class="status-chip session" title="Chave ativa apenas nesta sessão do navegador">SESSÃO ATIVA</span>';
      } else {
        statusBadge = '<span class="status-chip pending" title="Defina no .env ou no campo de sessão abaixo">CHAVE PENDENTE</span>';
      }

      card.innerHTML = `
        <div class="api-model-info">
          <div class="api-model-top">
            <span class="api-model-name">${m.name}</span>
            <span class="api-provider-tag ${m.provider}">${m.provider.toUpperCase()}</span>
            ${statusBadge}
          </div>
          <div class="api-model-meta">
            <code>${m.model_id}</code> &bull; Env: <code>${m.env_var || 'API_KEY'}</code>
          </div>
        </div>
        <button class="delete-model-btn" title="Remover modelo do catálogo" data-id="${m.id}">✕</button>
      `;

      const delBtn = card.querySelector('.delete-model-btn');
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Remover '${m.name}' do catálogo de modelos?`)) {
          await JarvisAPI.deleteApiModel(m.id);
          this.logTerminal(`[CATÁLOGO API]: Modelo '${m.name}' removido.`, 'sys');
          await this.loadModels();
        }
      });

      this.apiModelsCatalog.appendChild(card);
    });
  }

  showKeyFeedback(msg, type = 'info') {
    if (!this.keyTestFeedback) return;
    this.keyTestFeedback.className = `key-feedback-msg ${type}`;
    this.keyTestFeedback.innerText = msg;
    this.keyTestFeedback.classList.remove('hidden');
  }

  setCustomModel(modelString) {
    const raw = modelString.trim();
    if (!raw) return;

    // Detectar provedor inteligentemente
    let provider = 'google';
    let cleanId = raw;
    let displayName = raw;

    if (raw.toLowerCase().startsWith('gemini-') || raw.toLowerCase().includes('gemini')) {
      provider = 'google';
      cleanId = raw.replace(/^(api:google:|google:)/i, '');
      displayName = `Google ${cleanId}`;
    } else if (raw.toLowerCase().startsWith('gpt-') || raw.toLowerCase().startsWith('o1') || raw.toLowerCase().startsWith('o3')) {
      provider = 'openai';
      cleanId = raw.replace(/^(api:openai:|openai:)/i, '');
      displayName = `OpenAI ${cleanId}`;
    } else if (raw.toLowerCase().startsWith('llama-') || raw.toLowerCase().startsWith('groq:')) {
      provider = 'groq';
      cleanId = raw.replace(/^(api:groq:|groq:)/i, '');
      displayName = `Groq ${cleanId}`;
    }

    const fullId = `api:${provider}:${cleanId}`;

    // Verificar se já existe no select
    let existingOpt = Array.from(this.modelSelect.options).find(o => o.value === fullId || o.value === cleanId);
    if (!existingOpt) {
      const customOpt = document.createElement('option');
      customOpt.value = fullId;
      customOpt.textContent = `⚡ ${displayName} (Manual)`;
      this.modelSelect.prepend(customOpt);
    }

    // Registrar no catálogo em memória para este cliente
    if (!this.apiModels.some(m => m.id === fullId)) {
      this.apiModels.unshift({
        id: fullId,
        name: displayName,
        provider: provider,
        model_id: cleanId,
        env_var: provider === 'google' ? 'GEMINI_API_KEY' : provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'
      });
    }

    this.modelSelect.value = fullId;
    this.currentModel = fullId;
    this.engineModelTag.innerText = cleanId;

    this.logTerminal(`[MODELO ATIVO]: Alternado para modelo manual: ${displayName} (${cleanId})`, 'sys');
    this.audio.playToolBeep();
    this.renderApiModelsCatalog();
  }

  bindGeminiChips() {
    document.querySelectorAll('.gemini-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const modelId = chip.getAttribute('data-model');
        this.setCustomModel(modelId);
        
        // Destaque visual no chip ativo
        document.querySelectorAll('.gemini-chip').forEach(c => c.classList.remove('active-chip'));
        chip.classList.add('active-chip');
      });
    });
  }

  renderGoogleChips(modelsList) {
    const container = document.getElementById('quick-gemini-chips');
    if (!container) return;
    container.innerHTML = '';

    modelsList.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'gemini-chip';
      btn.setAttribute('data-model', m.model_id);
      btn.title = m.description || m.name;
      btn.innerText = m.model_id;
      container.appendChild(btn);
    });

    this.bindGeminiChips();
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
    if (!text || !text.trim()) return;
    const clean = text.trim();

    // 1. Escrever visivelmente no campo de entrada do chat
    this.chatInput.value = clean;
    this.chatInput.style.height = 'auto';
    this.chatInput.style.height = `${Math.min(this.chatInput.scrollHeight, 120)}px`;
    this.chatInput.focus();

    this.logTerminal(`[COMANDO DE VOZ]: "${clean}" -> Enviando ordem...`, 'cmd');

    // 2. Pequeno delay de 350ms para que o usuário veja a frase escrita no chat antes de despachar
    setTimeout(() => {
      this.handleUserSubmit();
    }, 350);
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

    // Resolver chave de sessão volátil se for um modelo de API
    let sessionKey = null;
    const selectedApiModel = this.apiModels.find(m => m.id === this.currentModel);
    if (selectedApiModel) {
      sessionKey = sessionStorage.getItem('jarvis_key_' + selectedApiModel.provider);
    }

    await JarvisAPI.chatStream({
      messages: this.messages,
      model: this.currentModel,
      temperature: temperature,
      autonomous: autonomous,
      session_key: sessionKey,

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

  copyToClipboard(text, btn) {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        this.showCopiedState(btn);
      }).catch(() => {
        this.fallbackCopy(text, btn);
      });
    } else {
      this.fallbackCopy(text, btn);
    }
  }

  fallbackCopy(text, btn) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showCopiedState(btn);
    } catch (e) {
      console.error('Falha ao copiar:', e);
    }
  }

  showCopiedState(btn) {
    if (!btn) return;
    const originalHTML = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = '✓ Copiado!';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = originalHTML;
    }, 2000);
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
          <button class="copy-msg-btn" title="Copiar mensagem">📋 Copiar</button>
        </div>
        <div class="msg-content">${this.renderMarkdown(content)}</div>
      </div>
    `;

    const copyBtn = msgEl.querySelector('.copy-msg-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyToClipboard(content, copyBtn);
      });
    }

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
          <button class="copy-msg-btn" title="Copiar resposta">📋 Copiar</button>
        </div>
        <div class="msg-tools-container"></div>
        <div class="msg-content"><span class="streaming-cursor">█</span></div>
      </div>
    `;

    this.chatMessages.appendChild(msgEl);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    const contentDiv = msgEl.querySelector('.msg-content');
    const toolsContainer = msgEl.querySelector('.msg-tools-container');
    const copyBtn = msgEl.querySelector('.copy-msg-btn');

    let currentRawMarkdown = '';
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const textToCopy = currentRawMarkdown || contentDiv.innerText || '';
        this.copyToClipboard(textToCopy, copyBtn);
      });
    }

    return {
      updateContent: (rawMarkdown) => {
        currentRawMarkdown = rawMarkdown;
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
