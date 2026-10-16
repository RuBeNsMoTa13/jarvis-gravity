<!--
Data/Hora: 2026-10-15T22:39:00-03:00 (UTC-3)
Branch: Web-Atom
Commit: 7dce1c2
Status: Atualizado
-->

# Guia de Deploy & Operação: Render (Cloud) & Windows (Local)

Este documento orienta a configuração do ambiente, instalação de dependências e implantação do **A.T.O.M. (Artificial Tactical Operating Matrix)** tanto em ambiente local no Windows quanto na nuvem via Render / Docker.

---

## 1. Execução Local no Windows

### 1.1. Pré-requisitos
- **Python:** Versão 3.10 ou superior (recomendado Python 3.12).
- **Ollama (Opcional):** Para quem deseja executar modelos 100% offline localmente (`gemma4`, `llama3.2`, `mistral`, etc.).
- **Navegador Moderno:** Chrome, Edge ou Brave (compatíveis com Web Speech API e `getDisplayMedia`).

### 1.2. Inicialização via Script Automatizado
O projeto possui o script executável [run_atom.bat](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/run_atom.bat):
1. Dê um duplo clique em `run_atom.bat`.
2. O script verifica se o serviço Ollama está ativo na porta 11434.
3. Inicia o Uvicorn na porta 8000 com flag `--reload`.
4. Abre automaticamente `http://localhost:8000` no seu navegador padrão.

### 1.3. Inicialização Manual via PowerShell
```powershell
# 1. Ativar ambiente virtual (se aplicável)
# .venv\Scripts\Activate.ps1

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Iniciar servidor FastAPI
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```

---

## 2. Deploy em Nuvem no Render

O repositório já está 100% pré-configurado para implantação como um **Web Service** no [Render](https://render.com).

### 2.1. Arquivo Procfile
Na raiz do repositório, o arquivo [Procfile](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/Procfile) comanda a inicialização do container:
```text
web: python -m uvicorn backend.server:app --host 0.0.0.0 --port $PORT
```
O Render injeta automaticamente a variável de ambiente `$PORT`, garantindo bind imediato em `0.0.0.0`.

### 2.2. Passo a Passo de Implantação
1. No painel do Render, clique em **New +** e selecione **Web Service**.
2. Conecte sua conta do GitHub e selecione o repositório `RuBeNsMoTa13/jarvis-gravity` (ou o nome do seu fork).
3. Selecione a branch: `Web-Atom` (ou `main`).
4. Configure as seguintes opções:
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** Deixe vazio (o Render usará o `Procfile` automaticamente) ou insira `python -m uvicorn backend.server:app --host 0.0.0.0 --port $PORT`.
5. Em **Environment Variables**, adicione suas chaves:
   - `GEMINI_API_KEY`: Sua chave de API do Google AI Studio (permite visão de tela e chat multimodal em nuvem).
   - `GROQ_API_KEY` *(Opcional)*: Para utilizar visão ultrarrápida da Groq Cloud.
6. Clique em **Deploy Web Service**.

---

## 3. Instalação PWA (Progressive Web App)

Uma vez aberto no navegador (local ou via HTTPS no Render):
- **No Google Chrome / Edge (Desktop):** Clique no ícone de instalação no lado direito da barra de endereços ("Instalar A.T.O.M.") para fixá-lo como um aplicativo tático na barra de tarefas do Windows.
- **No Android / iOS:** Acesse a URL gerada pelo Render, abra o menu do navegador e selecione **"Adicionar à Tela de Início"**.
