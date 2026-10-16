# GEMINI.md — A.T.O.M. (Artificial Tactical Operating Matrix)

> **Fonte Primária da Verdade Arquitetural e Operacional**
> **Arquiteto & Operador Principal:** Rubens Mota  
> **Status:** Produção Tática / Pronto para Deploy em Nuvem (Render) e Local (Windows)

---

## 1. Visão Geral do Sistema
O **A.T.O.M.** (*Artificial Tactical Operating Matrix*) é um sistema operacional tático híbrido com inteligência artificial multimodal, desenvolvido para execução local no Windows e deploy em nuvem (Render, Docker).

A aplicação conta com uma interface HUD imersiva no padrão **Dark Tactical Red**, combinando:
- **Visão de Tela em Tempo Real (Multimodal):** Captura de vídeo via `getDisplayMedia` com compressão JPEG canvas a 1280px e 0.75 de qualidade enviada diretamente para modelos visuais (Google Gemini / Groq Vision).
- **Pesquisa Aprofundada & Síntese Científica:** Busca web via `ddgs`, extração limpa de artigos via Jina Reader (`r.jina.ai`) e busca direta na base acadêmica do **arXiv**.
- **Central de Relatórios & Dossiês Markdown:** Geração automática de dossiês com metadados YAML e rota de download dedicada `GET /api/researches/{filename}/download`.
- **Arquitetura Tática Híbrida Adaptativa:** Detecta dinamicamente se o ambiente é desktop Windows (onde comandos de sistema operacional como Notepad/Calc são executados localmente) ou container em nuvem (onde links são abertos no navegador do cliente via eventos SSE `client_action`).

---

## 2. Stack Tecnológica

| Camada | Tecnologias Utilizadas |
| :--- | :--- |
| **Backend Core** | Python 3.12, FastAPI, Uvicorn, Pydantic v2, SSE (Server-Sent Events) |
| **Modelos de IA** | Google Gemini (`google-genai` SDK e REST v1beta), Groq Cloud Vision, Ollama Local |
| **Pesquisa & Web** | DuckDuckGo (`ddgs`), arXiv API XML, Jina Reader (`r.jina.ai`), HTTPX |
| **Frontend UI** | HTML5 Semântico, Vanilla CSS Moderno (Tokens HSL/Hex, Design System Dark Tactical Red) |
| **Canvas Visualizer** | Canvas 2D Reator Atômico (Órbitas Quânticas, Elétrons Pulsantes) |
| **Áudio & Voz** | Web Speech API (Sintetizador TTS + Reconhecimento STT), Web Audio API SFX |
| **PWA & Instalação** | Web App Manifest (`manifest.json`), Service Worker (`sw.js`), SVG Icons |
| **Deploy** | Procfile (`web: python -m uvicorn backend.server:app --host 0.0.0.0 --port $PORT`) |

---

## 3. Design System: Dark Tactical Red

- **Cores de Fundo:** `#0a0a0a` (primário), `#0d0d0d` (cockpit), `#111111` (cards), `#151515` (hover/inputs)
- **Bordas & Estrutura:** `#262626` (bordas principais), `#404040` (bordas atenuadas), cantoneiras táticas vermelhas (`::before`, `::after`)
- **Texto:** `#f5f5f5` (primário), `#d4d4d4` (secundário), `#a3a3a3` (muted), `#8a8a8a` (dim)
- **Acentos Táticos:** `#ef4444` (vermelho primário), `#e11d1d` (hover), `#1f0d0d` (fundo sutil), `#3b1515` (borda sutil)
- **Tipografia:** `Space Grotesk` (Interface & Títulos) e `JetBrains Mono` (HUD, Telemetria & Rótulos)
- **Geometria:** `border-radius: 4px` padronizado.

---

## 4. Estrutura de Diretórios

```text
├── Procfile                    # Comando de inicialização no Render / Cloud
├── GEMINI.md                   # Fonte primária da verdade arquitetural
├── plano.md                    # Plano de execução dos 9 passos táticos
├── requirements.txt            # Dependências Python
├── backend/
│   ├── server.py               # Servidor FastAPI com rotas SSE, download e arquivos estáticos
│   ├── core/
│   │   ├── atom.py             # Cérebro orquestrador A.T.O.M. (Rubens Mota)
│   │   ├── jarvis.py           # Bridge de compatibilidade legada
│   │   ├── api_client.py       # Cliente unificado de APIs Cloud (Gemini, Groq, OpenAI)
│   │   └── ollama_client.py    # Cliente Ollama local com verificação rápida
│   └── tools/
│       ├── search_tool.py      # DuckDuckGo, Jina Reader e arXiv com TTL cache
│       ├── system_tool.py      # Execução de comandos adaptativa (Local/Cloud)
│       └── markdown_tool.py    # Geração segura de dossiês e downloads
├── config/
│   └── api_models.json         # Catálogo oficial de modelos de API
├── frontend/
│   ├── index.html              # Cockpit HUD A.T.O.M.
│   ├── manifest.json           # Manifesto PWA
│   ├── sw.js                   # Service Worker para instalação PWA
│   ├── icons/atom-icon.svg     # Ícone do átomo vetorial tático
│   ├── css/style.css           # Design System Dark Tactical Red
│   └── js/
│       ├── app.js              # Controlador principal da aplicação e visão de tela
│       ├── api.js              # Cliente de API e parser SSE
│       ├── audio.js            # Módulo de áudio, voz e SFX
│       └── reactor.js          # Reator quântico animado via HTML5 Canvas
├── researches/                 # Diretório de armazenamento de relatórios markdown
└── docs/                       # Governança, auditoria, backlog e arquitetura
```

---

## 5. Diretrizes de Governança
- **Sem Commits Autônomos:** O assistente não executa comandos `git commit` por conta própria.
- **Rastreabilidade:** Todos os documentos em `docs/` mantêm cabeçalho com UTC-3, Branch e Commit.
