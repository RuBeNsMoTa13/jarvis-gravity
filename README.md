# ◈ J.A.R.V.I.S. - Tactical Assistant OS

Assistente de inteligência artificial em tempo real estilo **JARVIS**, operando **100% localmente com baixa latência e privacidade via Ollama**, com interface holográfica Stark Industries HUD, pesquisa na web, geração automática de dossiês em Markdown e automação de comandos no Windows.

---

## 🚀 Funcionalidades Principais

1. **Inferência Local Offline com Baixa Latência (Ollama)**:
   - Integração com a biblioteca oficial Python `ollama`.
   - Streaming em tempo real token-por-token via Server-Sent Events (SSE).
   - Suporte a qualquer modelo instalado (`gemma4:latest`, `gemma:latest`, `llama3.2`, `mistral`, `deepseek-r1`, `qwen2.5`, etc.).
   - Baixe novos modelos diretamente pelo painel do HUD com barra de progresso em tempo real (`Ollama Pull`).

2. **Modelos em Nuvem via API (Google Gemini, OpenAI, Groq, OpenRouter, DeepSeek)**:
   - 🛡️ **Segurança Total (Zero-Persistência em Git)**: Nenhuma chave de API é gravada em arquivos JSON do projeto.
   - **Variáveis de Ambiente / .env**: Configure suas chaves no arquivo `.env` (já incluído no `.gitignore`) ou nas variáveis do sistema operacional (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, etc.).
   - **Chave em Sessão de Navegador**: Se preferir, insira sua chave diretamente pela interface; ela fica salva **apenas na memória da aba aberta (`sessionStorage`)** e é transmitida de forma volátil durante as mensagens.
   - **Alternância Unificada no Topo**: O seletor de modelos do cabeçalho agrupa automaticamente `🏠 Modelos Locais (Ollama)` e `☁️ Modelos em Nuvem (API)`.

3. **Interface Holográfica Stark HUD**:
   - **Reator Arc Reativo (Canvas)**: Animações fluídas a 60fps que reagem dinamicamente aos estados do assistente (*Em Espera*, *Ouvindo*, *Processando*, *Falando*).
   - **Design Futurista**: Glassmorphism, iluminação neon azul-ciano e âmbar, scanlines táticas e tipografia sci-fi Orbitron.
   - **Telemetria de Sistema**: Monitoramento em tempo real de CPU, Memória RAM, Armazenamento e status do servidor local Ollama.
   - **Terminal PowerShell HUD**: Visualização ao vivo dos comandos executados no sistema operacional.

3. **Conversação em Tempo Real (Voz e Texto)**:
   - **Reconhecimento de Fala (STT)**: Fale com o JARVIS clicando no botão do microfone ou simplesmente **segurando a Barra de Espaço** (*Push-To-Talk*).
   - **Síntese Vocal (TTS)**: O JARVIS responde por voz com entonação configurável, velocidade, tom e seleção de voz.
   - **Efeitos Sonoros Sci-Fi Sintetizados**: Sons de inicialização, bips de confirmação e alertas táticos gerados diretamente pela Web Audio API sem arquivos externos.

4. **Pesquisa na Web Integrada**:
   - O JARVIS pesquisa a internet em tempo real via DuckDuckGo ao detectar perguntas sobre tópicos recentes, cotações, notícias ou comandos explícitos (*"JARVIS, pesquise sobre..."*).

5. **Geração Automática de Dossiês Markdown**:
   - Criação automática de arquivos `.md` bem estruturados salvos no diretório `./researches/`.
   - Inclui tabela de metadados, resumo executivo e fontes.
   - Gaveta de Dossiês no HUD para leitura com renderizador Markdown completo e botão para abrir diretamente no Windows Explorer.

6. **Automação no Sistema Operacional Windows**:
   - Abertura de aplicativos comuns (`calculadora`, `bloco de notas`, `vscode`, `explorador de arquivos`, `gerenciador de tarefas`).
   - Abertura de links e sites no navegador padrão.
   - Execução de comandos PowerShell com captura de saída `stdout` e `stderr`.
   - Controle de segurança: **Modo Seguro** (bloqueia comandos de risco) vs. **Modo Autônomo** (executa diretamente com feedback no HUD).

---

## 📦 Inicialização Rápida

### Método 1: Iniciar em 1 Clique (Recomendado)
Dê um duplo-clique no arquivo:
```bat
run_jarvis.bat
```
O script verifica o Ollama, abre o navegador automaticamente em `http://localhost:8000` e inicia o servidor.

### Método 2: Iniciar via Terminal (Manual)
```bash
# 1. Instalar dependências (caso não tenham sido instaladas):
pip install -r requirements.txt

# 2. Iniciar o servidor FastAPI:
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000
```
Em seguida, acesse no navegador: [http://localhost:8000](http://localhost:8000)

---

## 🎯 Exemplos de Ordens para o JARVIS

- 💬 **Conversa Geral**: *"Olá JARVIS, relate o status dos nossos sistemas."*
- 🌐 **Pesquisa Web**: *"Pesquise as novidades recentes sobre inteligência artificial e robótica."*
- 📝 **Criar Dossiê Markdown**: *"Crie um resumo em markdown sobre a arquitetura dos computadores quânticos."*
- 🧮 **Abrir Aplicativo**: *"JARVIS, abra a calculadora."*
- 📝 **Abrir Bloco de Notas**: *"Abra o bloco de notas para anotações."*
- 📊 **Diagnóstico de Hardware**: *"Qual o uso atual de memória RAM e CPU do sistema?"*
- 💻 **Comando Windows**: *"Execute o comando ipconfig no powershell."*

---

## 📁 Estrutura de Arquivos

```
jarvis gravity/
├── backend/
│   ├── core/
│   │   ├── jarvis.py          # Cérebro do agente e detecção de ferramentas
│   │   └── ollama_client.py   # Integração e streaming com o Ollama SDK
│   ├── tools/
│   │   ├── search_tool.py     # Pesquisa web DuckDuckGo
│   │   ├── markdown_tool.py   # Gestor de dossiês Markdown (.md)
│   │   └── system_tool.py     # Automação do Windows (PowerShell/CMD)
│   └── server.py              # API FastAPI & Servidor estático
├── frontend/
│   ├── index.html             # Cockpit HUD Stark Industries
│   ├── css/
│   │   └── style.css          # Design futurista, glassmorphism e neon
│   └── js/
│       ├── reactor.js         # Arc Reactor animado em Canvas
│       ├── audio.js           # Reconhecimento, síntese vocal e SFX
│       ├── api.js             # Streaming SSE e chamadas de API
│       └── app.js             # Orquestrador do frontend
├── researches/                # Diretório onde os arquivos Markdown são salvos
├── requirements.txt           # Dependências Python
├── run_jarvis.bat             # Launcher rápido para Windows
└── README.md                  # Documentação do sistema
```
