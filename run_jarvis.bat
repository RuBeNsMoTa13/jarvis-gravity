@echo off
title J.A.R.V.I.S. Protocol - Stark Industries HUD
color 0b
echo ========================================================
echo        J.A.R.V.I.S. - SISTEMA TACTICAL OS ONLINE
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando conexao com motor neural Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Ollama nao respondeu de imediato. Iniciando servico em segundo plano...
    start "" ollama serve
    timeout /t 3 /nobreak >nul
)

echo [2/3] Abrindo interface HUD do JARVIS no navegador...
timeout /t 2 /nobreak >nul
start http://localhost:8000

echo [3/3] Iniciando servidor FastAPI local do JARVIS...
echo.
echo ========================================================
echo  JARVIS pronto na porta 8000. Pressione Ctrl+C para parar.
echo ========================================================
echo.

python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000
pause
