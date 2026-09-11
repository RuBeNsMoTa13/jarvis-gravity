import subprocess
import os
import shutil
import re
import time
from typing import Dict, Any

# Comandos de alta periculosidade que exigem confirmação explícita no modo seguro
DANGEROUS_PATTERNS = [
    r"\bformat\b",
    r"\bdel\s+/[sfq]",
    r"\brmdir\s+/[sq]",
    r"\bRemove-Item\b.*(-Recurse|-Force)",
    r"\bStop-Computer\b",
    r"\bRestart-Computer\b",
    r"\bshutdown\b",
    r"\bClear-Disk\b",
    r"\bdiskpart\b",
    r"\brm\s+-r[f]?",
    r"\bDrop-Database\b"
]

APP_SHORTCUTS = {
    "notepad": "notepad.exe",
    "bloco de notas": "notepad.exe",
    "calc": "calc.exe",
    "calculadora": "calc.exe",
    "explorer": "explorer.exe",
    "explorador": "explorer.exe",
    "gerenciador de tarefas": "taskmgr.exe",
    "taskmgr": "taskmgr.exe",
    "cmd": "cmd.exe",
    "powershell": "powershell.exe",
    "code": "code",
    "vscode": "code",
    "paint": "mspaint.exe",
    "edge": "msedge.exe",
    "chrome": "chrome.exe"
}

def is_dangerous_command(command: str) -> bool:
    """Verifica se o comando contém padrões potencialmente destrutivos."""
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return True
    return False

def open_application(app_name: str) -> Dict[str, Any]:
    """
    Abre aplicativos comuns do Windows ou URLs no navegador padrão.
    """
    cleaned = app_name.strip().lower()
    
    # Se for uma URL
    if cleaned.startswith("http://") or cleaned.startswith("https://"):
        try:
            os.startfile(cleaned)
            return {"success": True, "message": f"URL aberta no navegador: {cleaned}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # Verificar atalhos
    target = APP_SHORTCUTS.get(cleaned, cleaned)
    try:
        # Se for um executável direto ou comando do sistema
        proc = subprocess.Popen(
            target,
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return {
            "success": True,
            "message": f"Aplicativo '{app_name}' iniciado com sucesso (PID: {proc.pid})."
        }
    except Exception as e:
        return {"success": False, "error": f"Falha ao iniciar {app_name}: {str(e)}"}

def execute_os_command(command: str, timeout: int = 15, autonomous: bool = False) -> Dict[str, Any]:
    """
    Executa comandos do sistema operacional Windows via PowerShell de forma controlada.
    """
    if not command or not command.strip():
        return {"success": False, "error": "Comando vazio"}

    command = command.strip()
    
    # Checagem de segurança
    if not autonomous and is_dangerous_command(command):
        return {
            "success": False,
            "blocked": True,
            "requires_confirmation": True,
            "command": command,
            "error": "Comando com potencial de dano ao sistema identificado. Requer confirmação explícita do operador."
        }

    start_time = time.time()
    try:
        # Executar com PowerShell
        process = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command],
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace"
        )
        elapsed = round(time.time() - start_time, 2)
        
        stdout = process.stdout.strip()
        stderr = process.stderr.strip()
        
        return {
            "success": process.returncode == 0,
            "exit_code": process.returncode,
            "command": command,
            "stdout": stdout,
            "stderr": stderr,
            "elapsed_seconds": elapsed
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "timeout": True,
            "command": command,
            "error": f"O comando excedeu o tempo limite de {timeout} segundos."
        }
    except Exception as e:
        return {
            "success": False,
            "command": command,
            "error": f"Erro na execução do sistema: {str(e)}"
        }

def get_system_telemetry() -> Dict[str, Any]:
    """
    Coleta informações em tempo real de hardware e sistema operacional (CPU, RAM, Disco).
    """
    try:
        import psutil
        cpu_percent = psutil.cpu_percent(interval=None)
        virtual_mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        
        return {
            "success": True,
            "cpu_percent": cpu_percent,
            "ram_used_gb": round((virtual_mem.total - virtual_mem.available) / (1024**3), 2),
            "ram_total_gb": round(virtual_mem.total / (1024**3), 2),
            "ram_percent": virtual_mem.percent,
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_percent": disk.percent
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
