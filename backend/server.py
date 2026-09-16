import io
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
try:
    import speech_recognition as sr
except ImportError:
    sr = None

from .core.ollama_client import ollama_manager
from .core.api_client import api_model_manager
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
    session_key: Optional[str] = None

class PullModelRequest(BaseModel):
    model_name: str

class AddApiModelRequest(BaseModel):
    name: str
    provider: str
    model_id: str
    base_url: Optional[str] = None
    description: Optional[str] = None

class TestApiModelRequest(BaseModel):
    provider: str
    model_id: str
    api_key: str
    base_url: Optional[str] = None

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
    """Lista todos os modelos locais (Ollama) e modelos de nuvem (API)."""
    local_models = ollama_manager.list_models()
    api_models = api_model_manager.list_models()
    return {
        "success": True,
        "local_models": local_models,
        "api_models": api_models,
        "default_model": jarvis_brain.default_model
    }

@app.get("/api/models/google")
def get_google_models(session_key: Optional[str] = None):
    """Consulta os modelos do Google Gemini disponíveis para a chave configurada."""
    models = api_model_manager.list_google_models(session_key=session_key)
    return {"success": True, "models": models}

@app.post("/api/models/api")
def add_api_model(req: AddApiModelRequest):
    """Cadastra um novo modelo de API (apenas metadados e provedor, sem chaves)."""
    return api_model_manager.add_model(req.model_dump())

@app.delete("/api/models/api/{model_id}")
def delete_api_model(model_id: str):
    """Remove um modelo de API cadastrado do catálogo."""
    success = api_model_manager.delete_model(model_id)
    if not success:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    return {"success": True}

@app.post("/api/models/api/test")
async def test_api_model(req: TestApiModelRequest):
    """Testa uma chave e conexão com a API sem salvar nada no servidor."""
    return await api_model_manager.test_connection(
        provider=req.provider,
        model_id=req.model_id,
        api_key=req.api_key,
        base_url=req.base_url
    )

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

@app.post("/api/audio/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcreve áudio gravado diretamente do microfone (WAV, WebM, Ogg) via SpeechRecognition backend."""
    try:
        content = await audio.read()
        if not content or len(content) < 400:
            return {"success": False, "error": "Áudio muito curto ou vazio."}

        buf = io.BytesIO(content)
        # Se não começar com cabeçalho RIFF (WAV puro), converter via pydub
        if not content.startswith(b'RIFF'):
            try:
                from pydub import AudioSegment
                seg = AudioSegment.from_file(io.BytesIO(content))
                buf = io.BytesIO()
                seg.export(buf, format="wav")
                buf.seek(0)
            except Exception as conv_err:
                logger.warning(f"Tentativa de conversão de formato de áudio: {conv_err}")

        if sr is None:
            return {"success": False, "error": "Pacote SpeechRecognition não instalado. Instale com: pip install SpeechRecognition"}

        recognizer = sr.Recognizer()

        with sr.AudioFile(buf) as source:
            audio_data = recognizer.record(source)

        text = recognizer.recognize_google(audio_data, language="pt-BR")
        logger.info(f"[TRANSCRIÇÃO DE ÁUDIO SUCESSO]: '{text}'")
        return {"success": True, "text": text}
    except sr.UnknownValueError:
        logger.info("[TRANSCRIÇÃO DE ÁUDIO]: Nenhuma fala compreensível detectada no arquivo.")
        return {"success": False, "error": "Nenhuma fala audível detectada. Verifique se o microfone está ativo."}
    except sr.RequestError as e:
        logger.warning(f"[TRANSCRIÇÃO DE ÁUDIO]: Erro de rede na API Google: {e}")
        return {"success": False, "error": f"Erro de conexão no serviço de transcrição: {e}"}
    except Exception as e:
        logger.error(f"[ERRO TRANSCRIÇÃO]: {e}")
        return {"success": False, "error": f"Falha ao processar áudio: {str(e)}"}

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
                autonomous=req.autonomous or False,
                session_key=req.session_key
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
