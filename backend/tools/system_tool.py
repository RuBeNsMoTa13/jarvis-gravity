import subprocess
import os
import platform
import shlex
import shutil
import re
import time
from functools import lru_cache
from typing import Dict, Any, List, Optional


# ==========================================================================
# DETECÇÃO DE AMBIENTE HÍBRIDO (LOCAL WINDOWS x NUVEM)
# ==========================================================================

@lru_cache(maxsize=1)
def is_cloud_environment() -> bool:
    """
    Detecta se o A.T.O.M. está rodando em nuvem/container.
    Critérios: variável RENDER (Render.com), CONTAINER/DOCKER, ATOM_CLOUD=1
    ou qualquer sistema operacional que não seja Windows.
    ATOM_FORCE_LOCAL=1 força o modo local (útil para desenvolvimento).
    """
    if os.environ.get("ATOM_FORCE_LOCAL", "").strip() in ("1", "true", "yes"):
        return False
    if os.environ.get("ATOM_CLOUD", "").strip() in ("1", "true", "yes"):
        return True
    if os.environ.get("RENDER") or os.environ.get("CONTAINER") or os.environ.get("DOCKER"):
        return True
    if os.path.exists("/.dockerenv"):
        return True
    return platform.system() != "Windows"


def get_environment_info() -> Dict[str, Any]:
    """Resumo do ambiente de execução para o HUD e para o cérebro do A.T.O.M."""
    cloud = is_cloud_environment()
    return {
        "mode": "cloud" if cloud else "local",
        "is_cloud": cloud,
        "os": platform.system(),
        "platform": "Render" if os.environ.get("RENDER") else ("Container" if cloud else "Windows Desktop"),
    }

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

# Equivalentes web usados no modo nuvem (o navegador do operador abre a aba)
CLOUD_WEB_EQUIVALENTS = {
    "calc": "https://www.google.com/search?q=calculadora",
    "calculadora": "https://www.google.com/search?q=calculadora",
    "notepad": "https://docs.new",
    "bloco de notas": "https://docs.new",
    "code": "https://vscode.dev",
    "vscode": "https://vscode.dev",
    "paint": "https://www.tldraw.com",
    "edge": "https://www.bing.com",
    "chrome": "https://www.google.com",
}

# Comandos somente-leitura permitidos dentro do container de nuvem
CLOUD_SAFE_COMMANDS = {
    "date", "get-date", "echo", "write-output", "whoami", "hostname", "uname",
    "pwd", "get-location", "ls", "dir", "get-childitem", "uptime", "df", "free",
    "python", "python3", "pip", "nproc", "get-process", "ps"
}
CLOUD_FORBIDDEN_TOKENS = re.compile(r"[;&|`$<>]|\.\.|\.env|/etc/|/proc/|\bsudo\b|\bcurl\b|\bwget\b", re.IGNORECASE)


def is_dangerous_command(command: str) -> bool:
    """Verifica se o comando contém padrões potencialmente destrutivos."""
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return True
    return False


def is_cloud_safe_command(command: str) -> bool:
    """Allowlist restrita: apenas comandos de leitura sem encadeamento/redirecionamento."""
    if CLOUD_FORBIDDEN_TOKENS.search(command) or is_dangerous_command(command):
        return False
    first = command.strip().split()[0].lower() if command.strip() else ""
    if first not in CLOUD_SAFE_COMMANDS:
        return False
    # python/pip apenas para consultas de versão/listagem
    if first in ("python", "python3"):
        return command.strip().lower() in ("python --version", "python3 --version", "python -v")
    if first == "pip":
        return command.strip().lower() in ("pip list", "pip --version", "pip freeze")
    return True


def _resolve_shell_command(command: str) -> Optional[List[str]]:
    """Retorna o comando para o shell disponível (PowerShell no Windows, pwsh ou sh no Linux)."""
    for exe in ("powershell.exe", "powershell", "pwsh"):
        if shutil.which(exe):
            return [exe, "-NoProfile", "-NonInteractive", "-Command", command]
    if shutil.which("sh"):
        # Sem shell interpretando o texto: separação segura dos argumentos
        try:
            return shlex.split(command)
        except ValueError:
            return None
    return None


def open_application(app_name: str) -> Dict[str, Any]:
    """
    Abre aplicativos comuns do Windows ou URLs no navegador padrão.
    - Local (Windows): executa o .exe ou usa os.startfile.
    - Nuvem: devolve a intenção `client_action` para o navegador do operador abrir o link.
    """
    cleaned = app_name.strip().lower()
    is_url = cleaned.startswith("http://") or cleaned.startswith("https://")

    # --- MODO NUVEM: nunca executa binários no container ---
    if is_cloud_environment():
        url = app_name.strip() if is_url else CLOUD_WEB_EQUIVALENTS.get(cleaned)
        if url:
            return {
                "success": True,
                "client_action": "open_url",
                "url": url,
                "message": f"Modo nuvem: o navegador do operador abrirá {url}"
            }
        return {
            "success": False,
            "cloud_blocked": True,
            "error": f"'{app_name}' é um aplicativo nativo do Windows e não pode ser aberto no modo nuvem."
        }

    # --- MODO LOCAL (WINDOWS) ---
    if is_url:
        try:
            if hasattr(os, "startfile"):
                os.startfile(app_name.strip())
                return {"success": True, "message": f"URL aberta no navegador: {cleaned}"}
            return {"success": True, "client_action": "open_url", "url": app_name.strip(),
                    "message": "Navegador do operador abrirá o link."}
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
    Executa comandos do sistema operacional de forma controlada.
    - Local (Windows): PowerShell com bloqueio de comandos destrutivos (exceto modo autônomo).
    - Nuvem: sandbox com allowlist somente-leitura, mesmo no modo autônomo.
    """
    if not command or not command.strip():
        return {"success": False, "error": "Comando vazio"}

    command = command.strip()
    cloud = is_cloud_environment()

    # Proteção do container: allowlist estrita, independente do modo autônomo
    if cloud and not is_cloud_safe_command(command):
        return {
            "success": False,
            "blocked": True,
            "cloud_blocked": True,
            "command": command,
            "error": "Modo nuvem: apenas comandos de leitura (ex: date, whoami, uname, ls) são permitidos no container."
        }

    # Checagem de segurança
    if not autonomous and is_dangerous_command(command):
        return {
            "success": False,
            "blocked": True,
            "requires_confirmation": True,
            "command": command,
            "error": "Comando com potencial de dano ao sistema identificado. Requer confirmação explícita do operador."
        }

    argv = _resolve_shell_command(command)
    if not argv:
        return {
            "success": False,
            "command": command,
            "error": "Nenhum shell compatível (PowerShell/pwsh/sh) disponível neste ambiente."
        }

    start_time = time.time()
    try:
        # Executar com o shell disponível (PowerShell no Windows)
        process = subprocess.run(
            argv,
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
    Coleta métricas em tempo real do A.T.O.M. (processo Python + Ollama)
    em relação aos recursos totais do computador ou container.
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
            "environment": get_environment_info(),
            # Métricas específicas do A.T.O.M. (chaves jarvis_* mantidas por compatibilidade)
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
