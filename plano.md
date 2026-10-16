# Plano de Implementação: A.T.O.M. (Artificial Tactical Operating Matrix)
### Web App Híbrido com Visão Multimodal, Relatórios de Pesquisa e Design System Tático

> **Identidade do Projeto:** **A.T.O.M.** (*Mota* invertido — identidade proprietária por Rubens Mota).  
> **Estética:** Dark Tactical Red (Preto profundo, vermelho de alta precisão, tipografia Space Grotesk e JetBrains Mono).  
> **Arquitetura:** Híbrida Adaptativa (Local no Windows com Ollama/PowerShell + Nuvem no Render com Visão de Tela, Jina Reader, arXiv e PWA).

---

## 🎨 Design System Oficial A.T.O.M. (Dark Tactical Red)

### 1. Paleta de Cores
- **Fundo da Página:** `#0a0a0a`
- **Cards e Painéis:** `#0d0d0d`, `#111111` e `#151515`
- **Linhas e Bordas:** `#262626` *(borda de ênfase forte: `#404040`)*
- **Tipografia:**
  - Texto Principal: `#f5f5f5`
  - Texto Secundário: `#d4d4d4`
  - Texto Apagado / Muted: `#a3a3a3` e `#8a8a8a`
- **Acentos e Energia Tática:**
  - Vermelho de Destaque (rótulos, foco, alvos): `#ef4444`
  - Vermelho de Preenchimento (botões de ação e estados ativos): `#e11d1d`
  - Painéis Vermelhos Escuros (táticos/alertas): `#1f0d0d` e `#140a0a`, com borda `#3b1515`

### 2. Tipografia e Hierarquia Visual
- **Fonte Principal (Space Grotesk):**
  - Utilizada em quase todos os textos de interface, corpo de mensagens e títulos.
  - **Título Principal:** `44px` no celular e `72px` no desktop, peso `500` a `600`, tracking apertado (`letter-spacing: -0.03em`).
- **Fonte Mono / HUD (JetBrains Mono):**
  - Utilizada nos rótulos de precisão estilo `01 · APRESENTAÇÃO` (`12px`, maiúsculas, cor `#ef4444`, tracking espaçado `letter-spacing: 0.15em`).
  - Utilizada no terminal PowerShell HUD, telemetria de hardware e blocos de código.

### 3. Geometria e Acabamento Tático
- **Bordas / Raio:** Cantos pouco arredondados (`border-radius: 4px`).
- **Cantoneiras Táticas:** Painéis com cantoneiras decorativas vermelhas nos cantos (`::before` / `::after` com acento em `#ef4444`).
- **Reator Central (Canvas):** Núcleo com órbitas atômicas pulsantes em tons de `#ef4444` e glow suave.

---

## 🏛️ Diretrizes Arquiteturais do A.T.O.M.

1. **Naming & Persona (A.T.O.M.):**
   - Atualização da persona do sistema em prompts, títulos, telemetria e HUD para **A.T.O.M. (Artificial Tactical Operating Matrix)**.
2. **Ambiente Híbrido Adaptativo (`is_cloud_environment`):**
   - **Local (Windows):** Acesso a modelos locais offline (Ollama), comandos nativos PowerShell/CMD, abertura de `.exe` (`calc`, `notepad`, `code`) e Explorer.
   - **Nuvem (Web App):** Desativa comandos locais do SO de risco; substitui a abertura de sites pelo evento SSE `client_action` com `window.open`; ativa fallback gracioso caso Ollama esteja offline.
3. **Gestão de Relatórios de Pesquisa:**
   - Endpoint dedicado para download: `GET /api/researches/{filename}/download` (`FileResponse`).
   - Botão **⬇️ Baixar Relatório (.md)** na Central de Relatórios e na bolha do chat ao gerar novos materiais.
   - Cache no navegador (`localStorage`) para preservar relatórios caso o container da nuvem reinicie.
4. **Visão de Tela Otimizada:**
   - Captura via `navigator.mediaDevices.getDisplayMedia`.
   - Compressão no `<canvas>` para JPEG com qualidade `0.75` e largura máxima de 1280px (payload leve de ~150KB, evitando estouro de RAM no Render).
   - Listener `track.onended` para desligar o indicador do HUD ao cancelar o compartilhamento pelo navegador.
5. **Pesquisa Aprofundada e Acadêmica:**
   - `search_web()` via DuckDuckGo + Leitura profunda com `https://r.jina.ai/<url>` (truncamento seguro a ~5.000 caracteres).
   - `search_arxiv()` para teses e artigos científicos reais em tempo real.
   - Cache com TTL em memória para acelerar consultas repetidas.
6. **Progressive Web App (PWA):**
   - `manifest.json` com nome A.T.O.M. permitindo instalação em 1 clique como app de desktop/celular.

---

## 🚀 Roteiro de Execução Passo a Passo

### Passo 1: Configuração de Deploy em Nuvem (`Procfile`)
- **Arquivo:** `Procfile` (na raiz do projeto)
- **Ação:** Criar o arquivo sem extensão com a inicialização para Uvicorn:
```text
web: python -m uvicorn backend.server:app --host 0.0.0.0 --port $PORT
```
- **Verificação:** Validar se o arquivo está na raiz com a linha exata.

---

### Passo 2: Atualização do Catálogo de Modelos (`config/api_models.json`)
- **Arquivo:** `config/api_models.json`
- **Ação:** Definir os modelos multimodais de alta velocidade e gratuitos da Google e Groq:
```json
[
  {
    "id": "api:google:gemini-flash-latest",
    "name": "Gemini Flash (Mais Recente - Auto)",
    "provider": "google",
    "model_id": "gemini-flash-latest",
    "env_var": "GEMINI_API_KEY",
    "description": "Aponta automaticamente para o modelo Flash ativo mais recente do Google (Suporta Visão de Tela)"
  },
  {
    "id": "api:google:gemini-3.6-flash",
    "name": "Gemini 3.6 Flash",
    "provider": "google",
    "model_id": "gemini-3.6-flash",
    "env_var": "GEMINI_API_KEY",
    "description": "Modelo de última geração ultra-rápido com raciocínio e visão multimodal"
  },
  {
    "id": "api:groq-llama-vision",
    "name": "Groq LLaMA 4 Scout Vision (Lê Tela Grátis)",
    "provider": "groq",
    "model_id": "meta-llama/llama-4-scout-17b-16e-instruct",
    "base_url": "https://api.groq.com/openai/v1",
    "env_var": "GROQ_API_KEY",
    "description": "Modelo multimodal gratuito na Groq capaz de enxergar sua tela"
  }
]
```
- **Verificação:** Recarregar a rota `/api/models` e validar a presença dos novos modelos.

---

### Passo 3: Pesquisa Avançada com Jina Reader, arXiv e Cache (`backend/tools/search_tool.py`)
- **Arquivo:** `backend/tools/search_tool.py`
- **Ação:**
  1. Manter `search_web()` ágil via DuckDuckGo.
  2. Implementar `read_url_content(url)` consumindo `https://r.jina.ai/<url>` com truncamento inteligente a ~5.000 caracteres.
  3. Implementar `search_arxiv(query, max_results=3)` para artigos científicos reais.
  4. Implementar cache simples em memória com TTL para consultas repetidas.
- **Verificação:** Testar individualmente as buscas web e acadêmica.

---

### Passo 4: Telemetria e Comandos de Sistema Adaptativos (`backend/tools/system_tool.py`)
- **Arquivo:** `backend/tools/system_tool.py`
- **Ação:**
  1. Criar função `is_cloud_environment()` (detectando `RENDER`, `CONTAINER` ou SO não-Windows).
  2. Adaptar `open_application()`:
     - Local: executa aplicativos `.exe` ou `os.startfile`.
     - Nuvem: devolve intenção de link para o cliente abrir via navegador.
  3. Adaptar `execute_os_command()`:
     - Nuvem: protege o container contra comandos destrutivos.
- **Verificação:** Testar comandos em modo seguro sem exceções em ambientes sem PowerShell.

---

### Passo 5: Relatórios de Pesquisa Markdown com Download HTTP (`backend/tools/markdown_tool.py`)
- **Arquivo:** `backend/tools/markdown_tool.py`
- **Ação:**
  1. Atualizar o cabeçalho dos relatórios para a persona **A.T.O.M. Tactical Intelligence**.
  2. Criar função `get_research_file_path(filename)` para servir o arquivo com segurança.
  3. Adaptar `open_research_file()`: no Windows abre no Explorer; no modo nuvem orienta o download.
- **Verificação:** Confirmar que o caminho e o conteúdo do `.md` são localizados e válidos.

---

### Passo 6: Cliente de IA Multimodal com Visão (`backend/core/api_client.py`)
- **Arquivo:** `backend/core/api_client.py`
- **Ação:**
  1. Adicionar `image_base64: Optional[str] = None` em `generate_stream()`.
  2. Injetar o frame JPEG base64 no Google Gemini e na Groq Vision.
  3. Garantir fallback para `gemini-flash-latest`.
- **Verificação:** Enviar prompt com imagem e validar resposta sem erro de API.

---

### Passo 7: Servidor FastAPI com Rotas de Download e Visão (`backend/server.py`)
- **Arquivo:** `backend/server.py`
- **Ação:**
  1. Atualizar título da aplicação para **A.T.O.M. Tactical OS**.
  2. Adicionar `image_base64: Optional[str] = None` no modelo Pydantic `ChatRequest`.
  3. Criar rota `GET /api/researches/{filename}/download` retornando `FileResponse(media_type="text/markdown")`.
  4. Otimizar verificação do Ollama com timeout rápido para não travar na nuvem.
- **Verificação:** Testar o download do arquivo via endpoint `/api/researches/{filename}/download`.

---

### Passo 8: Cérebro do A.T.O.M. com Orquestração Completa (`backend/core/jarvis.py` -> `backend/core/atom.py`)
- **Arquivo:** `backend/core/jarvis.py` (e compatibilidade)
- **Ação:**
  1. Atualizar a persona do system prompt:
     `Você é o A.T.O.M. (Artificial Tactical Operating Matrix), criado por Rubens Mota...`
  2. Definir modelo padrão para `api:google:gemini-flash-latest`.
  3. Atualizar `detect_intent()` para coordenar:
     - Análise visual quando `image_base64` for enviado.
     - Pesquisa profunda (DuckDuckGo + Jina).
     - Artigos acadêmicos (arXiv).
     - Abertura de links via evento SSE `{"type": "client_action", "action": "open_url", "url": "..."}`.
     - Notificação de relatório gerado com `{"type": "report_created", "filename": "..."}`.
- **Verificação:** Validar o streaming e as respostas ricas no console/HUD.

---

### Passo 9: Interface Front-end com Novo Design System Tático, Visão, Download e PWA
- **Arquivos:** `frontend/index.html`, `frontend/css/style.css`, `frontend/js/api.js`, `frontend/js/app.js`, `frontend/manifest.json`
- **Ação:**
  1. **Design System & CSS (`style.css`):**
     - Importar fontes `Space Grotesk` e `JetBrains Mono` do Google Fonts.
     - Atualizar variáveis CSS com a paleta oficial (`#0a0a0a`, `#0d0d0d`, `#111111`, `#151515`, `#262626`, `#404040`, `#f5f5f5`, `#d4d4d4`, `#a3a3a3`, `#8a8a8a`, `#ef4444`, `#e11d1d`, `#1f0d0d`, `#140a0a`, `#3b1515`).
     - Aplicar `border-radius: 4px` e estilizar cantoneiras táticas vermelhas nos painéis.
     - Ajustar tipografia com títulos de 44px/72px (`Space Grotesk`, -0.03em) e rótulos estilo `01 · APRESENTAÇÃO` (`JetBrains Mono`, 12px, `#ef4444`, maiúsculas, tracking largo).
  2. **Reator Atômico:** Adaptar a animação do canvas para órbitas quânticas e pulsar de energia vermelha tática (`#ef4444`).
  3. **Botão Visão de Tela (`#screen-share-btn`):** Adicionar no painel inferior e gerenciar `getDisplayMedia()` com redimensionamento em `<canvas>` (1280px máx, JPEG 0.75).
  4. **Tratamento de Eventos SSE:**
     - `client_action`: executa `window.open(url, '_blank')`.
     - `report_created`: renderiza botão de download imediato na bolha do chat.
  5. **Central de Relatórios:** Adicionar botão **⬇️ Baixar** ao lado de cada arquivo na lista e no leitor.
  6. **PWA:** Criar `manifest.json` com identidade A.T.O.M. para permitir instalação do aplicativo no Windows e mobile.
- **Verificação:** Rodar a aplicação, testar a visão de tela, o download do relatório, a abertura de abas e a instalação do app.

---

## 🏁 Status de Execução do Plano: 100% Concluído
Todos os 9 passos foram rigorosamente implementados e validados:
- [x] **Passo 1:** Deploy Cloud com `Procfile` criado.
- [x] **Passo 2:** Catálogo de Modelos Cloud atualizado em `config/api_models.json`.
- [x] **Passo 3:** DuckDuckGo (`ddgs`), Jina Reader e arXiv implementados com cache TTL em `backend/tools/search_tool.py`.
- [x] **Passo 4:** Ferramenta adaptativa SO/Cloud em `backend/tools/system_tool.py`.
- [x] **Passo 5:** Geração de dossiês seguros e downloads em `backend/tools/markdown_tool.py`.
- [x] **Passo 6:** Cliente multimodal (Gemini / Groq Vision) com base64 em `backend/core/api_client.py`.
- [x] **Passo 7:** Servidor FastAPI com rota `GET /api/researches/{filename}/download` em `backend/server.py`.
- [x] **Passo 8:** Orquestração completa do cérebro A.T.O.M. em `backend/core/atom.py` e bridge `jarvis.py`.
- [x] **Passo 9:** Design System Dark Tactical Red, reator quântico, visão de tela via canvas e PWA (`manifest.json` e `sw.js`).