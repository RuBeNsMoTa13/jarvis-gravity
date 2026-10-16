<!--
Data/Hora: 2026-10-15T22:39:00-03:00 (UTC-3)
Branch: Web-Atom
Commit: 7dce1c2
Status: Atualizado
-->

# Especificação da API: Endpoints REST & Eventos SSE

Este documento fornece a referência técnica exata de todos os endpoints HTTP e do protocolo de streaming Server-Sent Events (SSE) implementados no [backend/server.py](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/backend/server.py).

---

## 1. Endpoints REST

### `GET /api/health`
Retorna o estado geral de saúde dos subsistemas do A.T.O.M.
- **Resposta `200 OK`:**
  ```json
  {
    "status": "online",
    "system": "A.T.O.M. Tactical Operating Matrix",
    "ollama_connected": true,
    "environment": {
      "mode": "local",
      "is_cloud": false,
      "os": "Windows",
      "platform": "Windows Desktop"
    }
  }
  ```

---

### `GET /api/models`
Retorna a lista combinada de modelos de IA locais (via Ollama) e modelos de API em nuvem catalogados.
- **Resposta `200 OK`:**
  ```json
  {
    "local_models": ["llama3.2:latest", "mistral:latest"],
    "api_models": [
      {
        "id": "api:google:gemini-flash-latest",
        "name": "Gemini Flash (Mais Recente - Auto)",
        "provider": "google",
        "has_env_key": true
      },
      {
        "id": "api:groq-llama-vision",
        "name": "Groq LLaMA 4 Scout Vision",
        "provider": "groq",
        "has_env_key": false
      }
    ],
    "default_model": "api:google:gemini-flash-latest"
  }
  ```

---

### `GET /api/researches`
Lista todos os relatórios e dossiês salvos no diretório `./researches/`.
- **Resposta `200 OK`:**
  ```json
  {
    "success": true,
    "count": 2,
    "items": [
      {
        "filename": "2026-10-15_22-30-00_Computacao_Quantica.md",
        "title": "Computação Quântica e Criptografia",
        "modified": "15/10/2026 22:30:15",
        "size": 4096,
        "preview": "Relatório analítico sobre algoritmos de Shor e Grover..."
      }
    ]
  }
  ```

---

### `GET /api/researches/{filename}`
Obtém o conteúdo textual integral de um dossiê Markdown para leitura no modal.
- **Resposta `200 OK`:**
  ```json
  {
    "success": true,
    "filename": "2026-10-15_22-30-00_Computacao_Quantica.md",
    "content": "---\ntitle: ...\n# Dossiê Tático\n..."
  }
  ```

---

### `GET /api/researches/{filename}/download`
Download binário direto do arquivo `.md` como anexo no navegador.
- **Cabeçalhos de Resposta:**
  - `Content-Disposition: attachment; filename="2026-10-15_22-30-00_Computacao_Quantica.md"`
  - `Content-Type: text/markdown; charset=utf-8`

---

## 2. Streaming em Tempo Real: `POST /api/chat/stream`

Endpoint central de conversação multimodal, pesquisa e execução de comandos.

### 2.1. Payload de Requisição (`ChatRequest`)
```json
{
  "messages": [
    { "role": "user", "content": "Analise esta tela e resuma as informações" }
  ],
  "model": "api:google:gemini-flash-latest",
  "temperature": 0.7,
  "autonomous": true,
  "session_key": "AIzaSy...",
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### 2.2. Protocolo de Eventos SSE (`text/event-stream`)
Cada linha enviada pelo backend segue o formato padrão `data: <JSON>\n\n`.

| Tipo de Evento (`type`) | Payload Exemplo | Descrição |
| :--- | :--- | :--- |
| `token` | `{"type": "token", "content": "Analisando"}` | Token de texto emitido em tempo real. |
| `tool_start` | `{"type": "tool_start", "tool": "web_search", "label": "Pesquisa Web", "details": "Buscando 'IA tática'..."}` | Disparado antes de executar uma ferramenta. |
| `tool_end` | `{"type": "tool_end", "tool": "web_search", "success": true}` | Disparado após término da ferramenta. |
| `client_action` | `{"type": "client_action", "action": "open_url", "url": "https://arxiv.org/abs/..."}` | Comanda o navegador do cliente a abrir uma URL em nova aba. |
| `report_created` | `{"type": "report_created", "filename": "dossie_123.md", "download_url": "/api/researches/dossie_123.md/download"}` | Notifica que um dossiê foi gerado e disponibiliza o download imediato. |
| `file_created` | `{"type": "file_created", "data": {"filename": "dossie_123.md", "title": "IA"}}` | Metadados do arquivo gravado. |
| `stream_end` | `{"type": "stream_end", "full_content": "Resposta completa..."}` | Finalização do streaming da mensagem. |
| `error` | `{"type": "error", "error": "Chave de API inválida"}` | Emissão de falha operacional. |
