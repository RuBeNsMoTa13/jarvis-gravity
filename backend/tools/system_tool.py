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

_CURRENT_PROCESS = None
_CPU_COUNT = None

def _get_process():
    global _CURRENT_PROCESS, _CPU_COUNT
    try:
        import psutil
        if _CPU_COUNT is None:
            _CPU_COUNT = psutil.cpu_count() or 1
        if _CURRENT_PROCESS is None:
            _CURRENT_PROCESS = psutil.Process(os.getpid())
            _CURRENT_PROCESS.cpu_percent(interval=None)
    except Exception:
        pass
    return _CURRENT_PROCESS

def get_system_telemetry() -> Dict[str, Any]:
    """
    Coleta métricas em tempo real do JARVIS (processo Python + Ollama)
    em relação aos recursos totais do computador.
    """
    try:
        import psutil
        from pathlib import Path

        proc = _get_process()
        virtual_mem = psutil.virtual_memory()
        total_pc_ram_bytes = virtual_mem.total
        total_pc_ram_gb = round(total_pc_ram_bytes / (1024**3), 1)
        pc_ram_used_gb = round((total_pc_ram_bytes - virtual_mem.available) / (1024**3), 2)
        pc_cpu_total = round(psutil.cpu_percent(interval=None), 1)

        # 1. Medir consumo do processo Python do JARVIS e seus filhos
        jarvis_cpu_raw = 0.0
        jarvis_ram_bytes = 0
        if proc:
            try:
                jarvis_cpu_raw = proc.cpu_percent(interval=None)
                jarvis_ram_bytes = proc.memory_info().rss
                for child in proc.children(recursive=True):
                    try:
                        jarvis_cpu_raw += child.cpu_percent(interval=None)
                        jarvis_ram_bytes += child.memory_info().rss
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
            except Exception:
                pass

        # 2. Medir consumo do motor Ollama (caso esteja em execução)
        ollama_ram_bytes = 0
        ollama_running = False
        try:
            for p in psutil.process_iter(['name', 'memory_info']):
                try:
                    p_name = (p.info.get('name') or '').lower()
                    if 'ollama' in p_name:
                        ollama_running = True
                        mem_info = p.info.get('memory_info')
                        if mem_info:
                            ollama_ram_bytes += mem_info.rss
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
        except Exception:
            pass

        # Valores consolidados do JARVIS
        total_jarvis_ram_bytes = jarvis_ram_bytes + ollama_ram_bytes
        total_jarvis_ram_mb = round(total_jarvis_ram_bytes / (1024**2), 1)
        jarvis_core_ram_mb = round(jarvis_ram_bytes / (1024**2), 1)
        ollama_ram_mb = round(ollama_ram_bytes / (1024**2), 1)

        # Percentual de uso em relação ao computador
        cores = _CPU_COUNT or 1
        jarvis_cpu_percent = round(jarvis_cpu_raw / cores, 1)
        jarvis_ram_percent = round((total_jarvis_ram_bytes / total_pc_ram_bytes) * 100, 2)

        # 3. Espaço em disco (projeto JARVIS e disco do computador)
        base_dir = Path(__file__).resolve().parent.parent.parent
        disk = psutil.disk_usage(str(base_dir.anchor or "/"))
        disk_free_gb = round(disk.free / (1024**3), 1)
        disk_total_gb = round(disk.total / (1024**3), 1)
        disk_percent = round(disk.percent, 1)

        # Cálculo leve do diretório do projeto (apenas primeiro nível e arquivos essenciais)
        project_bytes = 0
        try:
            for root, dirs, files in os.walk(base_dir):
                dirs[:] = [d for d in dirs if d not in ('.git', '__pycache__', 'node_modules', '.venv', 'venv')]
                for f in files:
                    try:
                        project_bytes += os.path.getsize(os.path.join(root, f))
                    except Exception:
                        pass
        except Exception:
            pass
        project_mb = round(project_bytes / (1024**2), 1)

        return {
            "success": True,
            # Métricas específicas do JARVIS
            "jarvis_cpu_percent": jarvis_cpu_percent,
            "jarvis_cpu_raw": round(jarvis_cpu_raw, 1),
            "jarvis_ram_mb": total_jarvis_ram_mb,
            "jarvis_core_ram_mb": jarvis_core_ram_mb,
            "ollama_ram_mb": ollama_ram_mb,
            "jarvis_ram_percent": jarvis_ram_percent,
            "project_mb": project_mb,
            "ollama_running": ollama_running,

            # Métricas do Computador como referência
            "pc_cpu_total": pc_cpu_total,
            "pc_ram_total_gb": total_pc_ram_gb,
            "pc_ram_used_gb": pc_ram_used_gb,
            "pc_ram_percent": virtual_mem.percent,
            "disk_free_gb": disk_free_gb,
            "disk_total_gb": disk_total_gb,
            "disk_percent": disk_percent,

            # Compatibilidade legada
            "cpu_percent": jarvis_cpu_percent,
            "ram_percent": jarvis_ram_percent,
            "ram_used_gb": round(total_jarvis_ram_bytes / (1024**3), 2),
            "ram_total_gb": total_pc_ram_gb
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
