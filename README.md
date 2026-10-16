# ⚛️ A.T.O.M. — Artificial Tactical Operating Matrix

> **Sistema Operacional Tático Híbrido com Inteligência Artificial Multimodal, Pesquisa Aprofundada & HUD de Comando**  
> **Concebido & Desenvolvido por:** Rubens Mota  
> **Versão:** 2.0 (Produção Tática)  
> **Design System:** Dark Tactical Red (`#0a0a0a` / `#ef4444`)

---

## 📋 Visão Geral

O **A.T.O.M.** (*Artificial Tactical Operating Matrix*) é um sistema operacional com inteligência artificial híbrida adaptativa, projetado para execução nativa no **Windows Desktop** e deploy em escala em containers de nuvem (**Render / Docker**).

O sistema conta com um cockpit HUD imersivo estilo militar/sci-fi com animação quântica em Canvas 2D, combinando percepção visual de tela em tempo real, pesquisa sintética em bases acadêmicas (**arXiv**) e web (**DuckDuckGo + Jina Reader**), automação de sistema operacional e exportação de dossiês em Markdown com download seguro.

---

## 🚀 Funcionalidades Principais

### 1. 👁️ Visão Multimodal de Tela em Tempo Real
- Captura de tela com baixa latência via `navigator.mediaDevices.getDisplayMedia`.
- Compressão inteligente off-screen em `<canvas>` (redimensionamento a máx 1280px mantendo proporção, JPEG qualidade 0.75).
- Payload ultraleve (~150KB) injetado diretamente em modelos com visão computacional:
  - **Google Gemini** (`gemini-flash-latest`, `gemini-3.6-flash`) via `types.Part.from_bytes` e fallback REST `inline_data`.
  - **Groq Cloud Vision** (`meta-llama/llama-4-scout-17b-16e-instruct`) via data URL base64.
- Badge flutuante tático no compositor indicando transmissão ativa.

### 2. 🔬 Pesquisa Aprofundada & Síntese Científica
- **Web em Tempo Real:** Busca resiliente sem chaves via DuckDuckGo (`ddgs`).
- **Extração Limpa de Artigos:** Bypass de paywalls e remoção de poluição visual através do Jina Reader (`r.jina.ai`).
- **Base Acadêmica do arXiv:** Consulta direta à API XML do arXiv (`export.arxiv.org`), extraindo resumos, autores, IDs e links de PDFs científicos.
- **Cache de Telemetria:** Cache em memória com TTL de 30 minutos para consultas repetidas.

### 3. 📄 Central de Dossiês & Downloads Seguros
- Geração automática de relatórios Markdown estruturados com frontmatter YAML, metadados de autoria (*Rubens Mota*), tags e síntese executiva.
- Proteção estrita contra *path traversal* (`../`) na resolução de arquivos com [get_research_file_path()](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/backend/tools/markdown_tool.py#L18-L37).
- Download direto via endpoint `GET /api/researches/{filename}/download` (`FileResponse`).
- Botões de download com 1 clique integrados diretamente nos balões do chat e no modal de leitura.
- Fallback em `localStorage` para leitura offline de relatórios no navegador.

### 4. 🌐 Arquitetura Híbrida Adaptativa (Local Windows vs. Nuvem Render)
- A função [is_cloud_environment()](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/backend/tools/system_tool.py) identifica automaticamente o ambiente através de variáveis (`RENDER`, `PORT`, `RAILWAY_ENVIRONMENT`, etc.):
  - **Em Desktop Windows:** Executa ferramentas do sistema (`calc.exe`, `notepad.exe`, comandos PowerShell) localmente via `subprocess.Popen`.
  - **Em Container Nuvem:** Bloqueia comandos destrutivos via allowlist e emite eventos SSE `client_action` com ação `open_url` para que links e ferramentas sejam abertos diretamente no navegador do operador.

### 5. 🎨 Design System: Dark Tactical Red
- **Paleta Tática:** Fundo `#0a0a0a`, cockpit `#0d0d0d`, cards `#111111`, bordas `#262626` e acentos de energia em `#ef4444` / `#e11d1d`.
- **Tipografia:** `Space Grotesk` (Interface & Títulos) e `JetBrains Mono` (Telemetria, HUD e Rótulos).
- **Geometria Tática:** Cantos com `border-radius: 4px` e cantoneiras vermelhas nos 4 vértices dos painéis.
- **Reator Atômico Quântico:** Animação a 60fps em HTML5 Canvas com órbitas elípticas, elétrons pulsantes e núcleo reativo.

### 6. 📱 Suporte a PWA (Progressive Web App)
- Manifesto configurado em [manifest.json](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/frontend/manifest.json) com identidade e ícones vetoriais [atom-icon.svg](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/frontend/icons/atom-icon.svg).
- [sw.js](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/frontend/sw.js) para cache da casca da aplicação e instalação como app autônomo no Windows, Android e iOS.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Backend Core** | Python 3.12, FastAPI, Uvicorn | Servidor assíncrono, SSE streaming e downloads |
| **IA & Modelos** | Google GenAI SDK v2, Groq, Ollama | Google Gemini, Groq Vision, LLaMA local |
| **Pesquisa** | `ddgs`, Jina Reader, arXiv XML API | Coleta de dados web e artigos científicos |
| **Frontend UI** | HTML5 Semântico, Vanilla CSS Moderno | Cockpit HUD, tokens HSL/Hex, micro-animações |
| **Canvas** | HTML5 2D Context | Reator atômico quântico reativo |
| **Áudio & Voz** | Web Speech API, Web Audio API | Síntese TTS, transcrição STT e SFX táticos |
| **Deploy** | Procfile, Render, Docker | Inicialização automática em nuvem |

---

## 📦 Como Executar

### Método 1: Iniciar em 1 Clique (Windows)
Dê um duplo clique no inicializador:
👉 **[run_atom.bat](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/run_atom.bat)**

O script verifica o motor Ollama, inicia o Uvicorn e abre automaticamente o Cockpit HUD em `http://localhost:8000`.

### Método 2: Iniciar Manualmente via Terminal
```powershell
# 1. Instalar dependências
pip install -r requirements.txt

# 2. Iniciar o servidor com auto-reload
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```
Acesse no seu navegador: **`http://localhost:8000`**

### Método 3: Deploy em Nuvem (Render)
1. Conecte este repositório no [Render](https://render.com) como um **Web Service (Python 3)**.
2. O arquivo [Procfile](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/Procfile) já comanda o startup:
   ```text
   web: python -m uvicorn backend.server:app --host 0.0.0.0 --port $PORT
   ```
3. Defina a variável de ambiente `GEMINI_API_KEY` no painel do Render.

---

## 📚 Documentação Técnica Completa

Toda a documentação técnica detalhada, fluxos e governança estão centralizados no diretório [docs/](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/docs):

- 🗂️ **[docs/README.md](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/docs/README.md)**: Índice geral navegável.
- 🎯 **[docs/todo.md](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/docs/todo.md)**: Backlog oficial e rastreabilidade de tarefas.
- 🏛️ **[docs/arquitetura/atom-tactical-os.md](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/docs/arquitetura/atom-tactical-os.md)**: Arquitetura completa e diagramas.
- 👁️ **[docs/fluxos/visao-multimodal.md](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/docs/fluxos/visao-multimodal.md)**: Fluxo de visão computacional de tela.
- 🔬 **[docs/fluxos/pesquisa-e-sintese.md](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/docs/fluxos/pesquisa-e-sintese.md)**: Busca web, Jina Reader e arXiv.
- 📡 **[docs/api/endpoints.md](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/docs/api/endpoints.md)**: Especificação de rotas REST e eventos SSE.
- 🌐 **[docs/deploy/render-e-local.md](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/docs/deploy/render-e-local.md)**: Guia completo de deploy e ambiente.
- 🎨 **[docs/design-system/dark-tactical-red.md](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/docs/design-system/dark-tactical-red.md)**: Design system Dark Tactical Red.

---

## 🔒 Segurança & Privacidade
- **Zero-Persistência de Chaves em Git:** Chaves de API ficam salvas no seu `.env` local ou apenas na memória da aba aberta (`sessionStorage`).
- **Downloads Seguros:** Validação estrita de extensão e bloqueio de caracteres especiais ou sequências de diretórios maliciosas.

---

## 👤 Autor
**Rubens Mota**  
*Arquiteto de Software & Engenheiro de Inteligência Artificial*
