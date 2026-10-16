@echo off
title A.T.O.M. Protocol - Tactical Operating Matrix
color 0c
echo ========================================================
echo        A.T.O.M. - TACTICAL OPERATING MATRIX ONLINE
echo        Criado por Rubens Mota // Versao 2.0
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando motor neural local Ollama (opcional)...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Ollama local offline. O A.T.O.M. operara com APIs em Nuvem (Gemini / Groq).
) else (
    echo [OK] Motor neural Ollama online.
)

echo [2/3] Abrindo Cockpit HUD tatico no navegador...
timeout /t 2 /nobreak >nul
start http://localhost:8000

echo [3/3] Iniciando servidor FastAPI A.T.O.M. Tactical OS...
echo.
echo ========================================================
echo  A.T.O.M. operacional em http://localhost:8000
echo  Pressione Ctrl+C para encerrar o servidor.
echo ========================================================
echo.

python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
pause
