import os
import re
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent
RESEARCHES_DIR = BASE_DIR / "researches"
RESEARCHES_DIR.mkdir(parents=True, exist_ok=True)

def sanitize_filename(name: str) -> str:
    """Sanitiza string para uso seguro como nome de arquivo."""
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    name = re.sub(r'\s+', '_', name.strip())
    return name[:60] or "pesquisa"

def save_research_markdown(title: str, content: str, query: str = "", tags: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Cria ou atualiza um arquivo Markdown com relatório de pesquisa estruturado.
    """
    now = datetime.datetime.now()
    date_prefix = now.strftime("%Y-%m-%d_%H-%M-%S")
    clean_title = sanitize_filename(title)
    filename = f"{date_prefix}_{clean_title}.md"
    file_path = RESEARCHES_DIR / filename

    tag_str = ", ".join(tags) if tags else "Pesquisa Geral, JARVIS Intelligence"

    markdown_document = f"""---
title: "{title}"
date: "{now.strftime('%d/%m/%Y %H:%M:%S')}"
query: "{query}"
tags: [{tag_str}]
system: "JARVIS Protocol - Offline Neural Processing"
---

# {title}

| Metadado | Informação |
| :--- | :--- |
| **Data de Geração** | {now.strftime('%d/%m/%Y às %H:%M:%S')} |
| **Consulta Original** | `{query or title}` |
| **Classificação** | Dossiê Tático & Pesquisa Integrada |
| **Mecanismo** | JARVIS AI Local (Ollama) + Web Intelligence |

---

## 📋 Resumo Executivo
{content}

---
*Documento gerado automaticamente pelo protocolo JARVIS. Todos os direitos reservados.*
"""

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(markdown_document)

    return {
        "success": True,
        "filename": filename,
        "path": str(file_path),
        "title": title,
        "size": len(markdown_document),
        "created_at": now.isoformat()
    }

def list_researches() -> List[Dict[str, Any]]:
    """
    Lista todos os relatórios e resumos Markdown existentes na pasta de pesquisas.
    """
    items = []
    if not RESEARCHES_DIR.exists():
        return items

    for path in sorted(RESEARCHES_DIR.glob("*.md"), key=os.path.getmtime, reverse=True):
        stat = path.stat()
        title = path.stem
        preview = ""
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                lines = [line.strip() for line in f.readlines() if line.strip()]
                # Procurar primeiro header # ou título
                for line in lines:
                    if line.startswith("# "):
                        title = line.replace("# ", "").strip()
                        break
                # Obter breve preview
                preview = " ".join(lines[2:8])[:220]
        except Exception:
            pass

        items.append({
            "filename": path.name,
            "title": title,
            "preview": preview,
            "size": stat.st_size,
            "modified": datetime.datetime.fromtimestamp(stat.st_mtime).strftime("%d/%m/%Y %H:%M:%S"),
            "path": str(path)
        })
    return items

def read_research(filename: str) -> Optional[Dict[str, Any]]:
    """
    Lê o conteúdo de um arquivo Markdown específico.
    """
    file_path = RESEARCHES_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        return None

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {
            "success": True,
            "filename": filename,
            "content": content,
            "path": str(file_path)
        }
    except Exception as e:
        return {
            "success": False,
            "filename": filename,
            "error": str(e)
        }

def open_research_file(filename: Optional[str] = None) -> Dict[str, Any]:
    """
    Abre o arquivo Markdown ou a pasta de pesquisas no visualizador padrão do Windows.
    """
    target = (RESEARCHES_DIR / filename) if filename else RESEARCHES_DIR
    if not target.exists():
        return {"success": False, "error": "Arquivo ou pasta não encontrado"}

    try:
        os.startfile(str(target))
        return {"success": True, "opened": str(target)}
    except Exception as e:
        return {"success": False, "error": str(e)}
