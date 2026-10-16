<!--
Data/Hora: 2026-10-15T22:39:00-03:00 (UTC-3)
Branch: Web-Atom
Commit: 7dce1c2
Status: Atualizado
-->

# Backlog Tático — A.T.O.M.

Este é o backlog oficial e único de rastreabilidade do projeto **A.T.O.M.** Qualquer nova demanda, débito técnico ou funcionalidade deve ser registrada exclusivamente neste documento.

---

## 🎯 Transformação A.T.O.M. (Execução do `plano.md`)

- [x] **Passo 1: Deploy em Nuvem (Render / Procfile)**
  - [x] Criar `Procfile` com comando de inicialização Uvicorn e porta `$PORT`.
  - [x] Testar compatibilidade de portas locais e em container.
- [x] **Passo 2: Catálogo de Modelos Cloud (`config/api_models.json`)**
  - [x] Cadastrar `gemini-flash-latest` (Google Gemini padrão).
  - [x] Cadastrar `gemini-3.6-flash` (Google Gemini 3.6).
  - [x] Cadastrar `groq-llama-vision` (`meta-llama/llama-4-scout-17b-16e-instruct`).
- [x] **Passo 3: Ferramenta de Pesquisa com DuckDuckGo & ArXiv & Jina (`search_tool.py`)**
  - [x] Implementar fallback resiliente via `ddgs` (DuckDuckGo).
  - [x] Implementar extração limpa de páginas via `r.jina.ai`.
  - [x] Implementar busca em artigos acadêmicos via API XML do `arXiv`.
  - [x] Adicionar cache em memória com TTL de 30 minutos.
- [x] **Passo 4: Ferramenta de Sistema Operacional Adaptativa (`system_tool.py`)**
  - [x] Implementar detecção automática de ambiente (`is_cloud_environment()`).
  - [x] Configurar allowlist segura para ambiente de nuvem.
  - [x] Habilitar retorno com intenção `open_url` quando em nuvem para abertura no navegador do cliente.
- [x] **Passo 5: Geração de Relatórios Markdown & Download (`markdown_tool.py`)**
  - [x] Atualizar persona nos relatórios para A.T.O.M. por Rubens Mota.
  - [x] Criar função `get_research_file_path()` com proteção contra path traversal.
  - [x] Adicionar campo `download_url` no retorno estruturado de dossiês.
- [x] **Passo 6: Cliente de API Multimodal (`api_client.py`)**
  - [x] Suportar `image_base64` via Google GenAI SDK (`types.Part.from_bytes`) e fallback REST.
  - [x] Suportar envio de imagens em formato URL base64 para Groq Vision e OpenAI.
  - [x] Garantir fallback inteligente para `gemini-flash-latest`.
- [x] **Passo 7: Servidor FastAPI com Rotas de Download e Visão (`server.py`)**
  - [x] Atualizar título da aplicação para **A.T.O.M. Tactical OS**.
  - [x] Adicionar `image_base64` no esquema Pydantic `ChatRequest`.
  - [x] Implementar rota `GET /api/researches/{filename}/download` com `FileResponse`.
  - [x] Otimizar verificação do Ollama com socket probe rápido para não travar na nuvem.
- [x] **Passo 8: Cérebro do A.T.O.M. com Orquestração Completa (`atom.py`)**
  - [x] Definir persona oficial A.T.O.M. por Rubens Mota.
  - [x] Orquestrar visão multimodal, arXiv, DuckDuckGo e Jina.
  - [x] Emitir eventos SSE `client_action` e `report_created`.
- [x] **Passo 9: Interface Front-end com Novo Design System Tático, Visão, Download e PWA**
  - [x] Aplicar Design System **Dark Tactical Red** em `style.css` com paleta `#ef4444` e fontes `Space Grotesk` / `JetBrains Mono`.
  - [x] Implementar cantoneiras táticas nos painéis HUD e `border-radius: 4px`.
  - [x] Atualizar animação do canvas para órbitas quânticas e elétrons pulsantes em `reactor.js`.
  - [x] Criar botão `#screen-share-btn` com compressão canvas (máx 1280px JPEG 0.75) e badge no composer.
  - [x] Renderizar cards com botão de download no chat ao disparar `report_created`.
  - [x] Adicionar botões de download na gaveta de dossiês e no leitor modal.
  - [x] Criar `manifest.json`, `atom-icon.svg` e `sw.js` para suporte PWA desktop e mobile.

---

## 🔮 Futuras Expansões Táticas
- [ ] Implementar suporte a gravação contínua de sessão de tela para envio sob demanda.
- [ ] Adicionar exportação de dossiês para PDF tático com tema escuro.
- [ ] Integrar telemetria de GPU (NVIDIA CUDA) no painel de hardware quando rodando localmente.
