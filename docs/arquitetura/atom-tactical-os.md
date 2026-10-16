<!--
Data/Hora: 2026-10-15T20:10:00-03:00 (UTC-3)
Branch: Web-Atom
Commit: 7dce1c2
Status: Atualizado
-->

# Arquitetura Geral do Sistema — A.T.O.M.

Este documento detalha o fluxo de dados, a arquitetura híbrida e a orquestração multimodal do **A.T.O.M. (Artificial Tactical Operating Matrix)** concebido por Rubens Mota.

---

## 1. Visão Arquitetural

```mermaid
graph TD
    User["Operador Rubens Mota (Browser / PWA)"] -->|Chat / Voz / Tela| Frontend["Cockpit HUD A.T.O.M."]
    
    subgraph Frontend_Layer ["Camada Cliente (Frontend)"]
        Frontend --> CanvasReactor["Reator Quântico (reactor.js)"]
        Frontend --> AudioModule["Áudio & TTS (audio.js)"]
        Frontend --> ScreenVision["Visão de Tela (getDisplayMedia -> Canvas 1280px JPEG)"]
        Frontend --> APIClient["API & SSE Consumer (api.js)"]
    end

    APIClient -->|HTTP POST /api/chat/stream| ServerFastAPI["FastAPI Server (server.py)"]
    
    subgraph Backend_Layer ["Camada Servidor (Python Core)"]
        ServerFastAPI --> AtomBrain["A.T.O.M. Brain (atom.py)"]
        
        AtomBrain --> IntentRouter{"Roteador de Intenção"}
        
        IntentRouter -->|Visão Multimodal| MultimodalClient["API Client (Gemini / Groq Vision)"]
        IntentRouter -->|Pesquisa Web| SearchTool["Search Tool (DDGS + Jina)"]
        IntentRouter -->|Pesquisa Acadêmica| ArxivTool["ArXiv XML Engine"]
        IntentRouter -->|Comandos do SO| AdaptiveSysTool["Adaptive System Tool (Local/Cloud)"]
        IntentRouter -->|Geração de Dossiês| MarkdownTool["Markdown Dossier Tool"]
    end
    
    AdaptiveSysTool -->|Se Cloud| SSE_Action["Evento SSE: client_action (open_url)"]
    MarkdownTool -->|Relatório Gerado| SSE_Report["Evento SSE: report_created (download)"]
    
    SSE_Action -->|window.open| User
    SSE_Report -->|Card de Download| User
```

---

## 2. Otimização de Visão Multimodal
Para viabilizar a percepção de tela em containers leves na nuvem (Render, 512MB RAM) e prevenir gargalos de rede:
1. O usuário aciona `#screen-share-btn`.
2. A API nativa `navigator.mediaDevices.getDisplayMedia` obtém o stream de vídeo.
3. No momento do envio da ordem pelo operador, o frame ativo do vídeo é capturado em um `<canvas>` offscreen.
4. O canvas redimensiona a imagem dinamicamente para uma resolução máxima de **1280px**, mantendo a proporção.
5. A imagem é comprimida em **JPEG com fator de qualidade 0.75**, gerando um payload leve de aproximadamente 120KB a 180KB em base64.
6. O frame é injetado no payload do Google Gemini via `types.Part.from_bytes` ou Groq Vision via `image_url`.

---

## 3. Arquitetura Adaptativa Local vs. Nuvem
A função `is_cloud_environment()` em `backend/tools/system_tool.py` inspeciona a presença de variáveis de ambiente típicas de container (`RENDER`, `PORT`, `RAILWAY_ENVIRONMENT`, `HEROKU`, `KUBERNETES_SERVICE_HOST`).

- **Quando em Ambiente Local (Windows Desktop):**
  - Comandos como abrir Calculadora (`calc.exe`) ou Bloco de Notas (`notepad.exe`) são disparados via `subprocess.Popen` no host do operador.
- **Quando em Ambiente de Nuvem (Container Linux):**
  - Tentativas de abrir aplicativos desktop do Windows são convertidas com segurança em avisos táticos amigáveis ou eventos SSE `client_action` com ação `open_url` para que o navegador do cliente abra o link em uma nova aba.
