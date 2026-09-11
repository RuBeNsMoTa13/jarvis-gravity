import logging
from typing import List, Dict, Any, AsyncGenerator, Optional
import ollama

logger = logging.getLogger("jarvis.core.ollama")

class OllamaManager:
    def __init__(self, host: str = "http://localhost:11434"):
        self.host = host
        self.client = ollama.Client(host=host)
        self.async_client = ollama.AsyncClient(host=host)

    def is_available(self) -> bool:
        """Verifica se o servidor Ollama está respondendo."""
        try:
            self.client.list()
            return True
        except Exception as e:
            logger.warning(f"Ollama offline ou inacessível: {e}")
            return False

    def list_models(self) -> List[Dict[str, Any]]:
        """Lista todos os modelos locais instalados no Ollama."""
        try:
            response = self.client.list()
            raw_models = response.get("models", [])
            models_list = []
            
            for m in raw_models:
                # Tratar atributos conforme versão do SDK
                name = m.get("model", m.get("name", "unknown"))
                size_bytes = m.get("size", 0)
                size_gb = round(size_bytes / (1024**3), 2) if size_bytes else 0
                modified = m.get("modified_at", "")
                
                models_list.append({
                    "id": name,
                    "name": name,
                    "size_gb": size_gb,
                    "modified": modified,
                    "details": m.get("details", {})
                })
            return models_list
        except Exception as e:
            logger.error(f"Erro ao listar modelos do Ollama: {e}")
            return []

    async def pull_model_stream(self, model_name: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Faz o pull de um novo modelo com streaming de progresso."""
        try:
            async for progress in await self.async_client.pull(model_name, stream=True):
                completed = progress.get("completed", 0)
                total = progress.get("total", 0)
                percent = round((completed / total * 100), 1) if total > 0 else 0
                
                yield {
                    "status": progress.get("status", "baixando"),
                    "completed": completed,
                    "total": total,
                    "percent": percent,
                    "done": progress.get("status") == "success"
                }
        except Exception as e:
            logger.error(f"Erro no download do modelo {model_name}: {e}")
            yield {
                "status": "error",
                "error": str(e),
                "done": True
            }

    async def chat_stream(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Gera resposta em streaming token por token."""
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        options = {
            "temperature": temperature
        }

        try:
            response = await self.async_client.chat(
                model=model,
                messages=full_messages,
                stream=True,
                options=options
            )
            async for chunk in response:
                content = chunk.get("message", {}).get("content", "")
                if content:
                    yield content
        except Exception as e:
            logger.error(f"Erro no chat streaming com {model}: {e}")
            yield f"\n[Erro na comunicação com o modelo local '{model}': {str(e)}]"

ollama_manager = OllamaManager()
