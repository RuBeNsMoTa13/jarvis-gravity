import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .core.ollama_client import ollama_manager
from .core.jarvis import jarvis_brain
from .tools.markdown_tool import list_researches, read_research, open_research_file
from .tools.system_tool import get_system_telemetry, execute_os_command

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("jarvis.server")

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="JARVIS AI Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELOS PYDANTIC ---
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    autonomous: Optional[bool] = False

class PullModelRequest(BaseModel):
    model_name: str

class ExecuteCmdRequest(BaseModel):
    command: str
    autonomous: Optional[bool] = False

class OpenResearchRequest(BaseModel):
    filename: Optional[str] = None

# --- ROTAS DA API ---

@app.get("/api/health")
def health_check():
    ollama_ok = ollama_manager.is_available()
    return {
        "status": "online",
        "system": "JARVIS Protocol",
        "ollama_connected": ollama_ok
    }

@app.get("/api/models")
def get_models():
    """Lista todos os modelos locais disponíveis no Ollama."""
    models = ollama_manager.list_models()
    return {
        "success": True,
        "models": models,
        "default_model": jarvis_brain.default_model
    }

@app.post("/api/models/pull")
async def pull_model(req: PullModelRequest):
    """Baixa um novo modelo do repositório Ollama com streaming de progresso SSE."""
    async def event_generator():
        async for progress in ollama_manager.pull_model_stream(req.model_name):
            yield f"data: {json.dumps(progress, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    """Processa a conversa em tempo real com execução de ferramentas e streaming SSE."""
    messages_payload = [{"role": m.role, "content": m.content} for m in req.messages]

    async def sse_generator():
        try:
            async for event in jarvis_brain.process_conversation_stream(
                messages=messages_payload,
                model=req.model,
                temperature=req.temperature or 0.7,
                autonomous=req.autonomous or False
            ):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.error(f"Erro no streaming do chat: {e}", exc_info=True)
            err_payload = {"type": "error", "error": str(e)}
            yield f"data: {json.dumps(err_payload, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/api/telemetry")
def get_telemetry():
    """Retorna métricas em tempo real de hardware e status do Ollama."""
    telemetry = get_system_telemetry()
    telemetry["ollama_connected"] = ollama_manager.is_available()
    return telemetry

@app.get("/api/researches")
def get_researches():
    """Lista todos os arquivos de pesquisa Markdown criados."""
    items = list_researches()
    return {"success": True, "count": len(items), "items": items}

@app.get("/api/researches/{filename}")
def get_research_content(filename: str):
    """Retorna o conteúdo do arquivo Markdown solicitado."""
    res = read_research(filename)
    if not res:
        raise HTTPException(status_code=404, detail="Dossiê não encontrado")
    return res

@app.post("/api/researches/open")
def open_research(req: OpenResearchRequest):
    """Abre o arquivo ou a pasta no Windows Explorer."""
    return open_research_file(req.filename)

@app.post("/api/cmd/execute")
def execute_command(req: ExecuteCmdRequest):
    """Execução direta de comando via terminal HUD do operador."""
    return execute_os_command(req.command, autonomous=req.autonomous or False)

# --- ARQUIVOS ESTÁTICOS DO FRONTEND ---
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
else:
    logger.warning(f"Diretório frontend não encontrado em: {FRONTEND_DIR}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.server:app", host="0.0.0.0", port=8000, reload=False)
