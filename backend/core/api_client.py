import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, AsyncGenerator, Optional

logger = logging.getLogger("jarvis.core.api_client")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = BASE_DIR / "config"
CONFIG_FILE = CONFIG_DIR / "api_models.json"
ENV_FILE = BASE_DIR / ".env"

# Carregar arquivo .env manualmente se existir para nao depender de pacote externo
def load_dotenv_if_present():
    if ENV_FILE.exists():
        try:
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k and v and k not in os.environ:
                            os.environ[k] = v
        except Exception as e:
            logger.warning(f"Erro ao ler .env: {e}")

load_dotenv_if_present()

PROVIDER_DEFAULTS = {
    "google": {
        "env_var": "GEMINI_API_KEY",
        "default_model": "gemini-3.6-flash",
        "base_url": None
    },
    "openai": {
        "env_var": "OPENAI_API_KEY",
        "default_model": "gpt-4o-mini",
        "base_url": "https://api.openai.com/v1"
    },
    "groq": {
        "env_var": "GROQ_API_KEY",
        "default_model": "llama-3.3-70b-versatile",
        "base_url": "https://api.groq.com/openai/v1"
    },
    "openrouter": {
        "env_var": "OPENROUTER_API_KEY",
        "default_model": "anthropic/claude-3.5-sonnet",
        "base_url": "https://openrouter.ai/api/v1"
    },
    "deepseek": {
        "env_var": "DEEPSEEK_API_KEY",
        "default_model": "deepseek-chat",
        "base_url": "https://api.deepseek.com/v1"
    },
    "custom": {
        "env_var": "CUSTOM_API_KEY",
        "default_model": "custom-model",
        "base_url": "http://localhost:8080/v1"
    }
}

class ApiModelManager:
    def __init__(self):
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        if not CONFIG_FILE.exists():
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)

    def list_models(self) -> List[Dict[str, Any]]:
        """
        Retorna a lista de modelos de API cadastrados.
        Informa se a chave está configurada no ambiente do sistema operacional/dotenv.
        NENHUMA CHAVE É EXPOSTA.
        """
        load_dotenv_if_present()
        try:
            if not CONFIG_FILE.exists():
                return []
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                models = json.load(f)
            
            result = []
            for m in models:
                env_var = m.get("env_var", "")
                has_env = bool(os.environ.get(env_var)) if env_var else False
                
                result.append({
                    "id": m["id"],
                    "name": m["name"],
                    "provider": m["provider"],
                    "model_id": m["model_id"],
                    "base_url": m.get("base_url"),
                    "env_var": env_var,
                    "has_env_key": has_env,
                    "description": m.get("description", ""),
                    "type": "api"
                })
            return result
        except Exception as e:
            logger.error(f"Erro ao ler {CONFIG_FILE}: {e}")
            return []

    def get_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        # 1. Procurar no catalogo cadastrado
        models = self.list_models()
        for m in models:
            if m["id"] == model_id or m["model_id"] == model_id:
                return m
            # Tratar caso de api:google:gemini-3.6-flash vs gemini-3.6-flash
            if model_id.endswith(m["model_id"]):
                return m

        # 2. Resolução dinâmica de modelo digitado manualmente pelo usuário
        clean_id = model_id.strip()
        
        # Casos explícitos com prefixo
        if clean_id.startswith("api:"):
            parts = clean_id.split(":", 2)
            if len(parts) == 3:
                prov, m_id = parts[1], parts[2]
                env_v = PROVIDER_DEFAULTS.get(prov, {}).get("env_var", "API_KEY")
                base_u = PROVIDER_DEFAULTS.get(prov, {}).get("base_url")
                return {
                    "id": clean_id,
                    "name": f"{prov.upper()}: {m_id}",
                    "provider": prov,
                    "model_id": m_id,
                    "base_url": base_u,
                    "env_var": env_v,
                    "type": "api"
                }

        # Detecção inteligente por prefixo do nome do modelo
        lower = clean_id.lower()
        if lower.startswith("gemini-") or "gemini" in lower:
            # Modelo Google
            clean_m = lower.replace("google:", "").replace("api:google:", "").strip()
            return {
                "id": f"api:google:{clean_m}",
                "name": f"Google {clean_m}",
                "provider": "google",
                "model_id": clean_m,
                "env_var": "GEMINI_API_KEY",
                "type": "api"
            }
        elif lower.startswith("gpt-") or lower.startswith("o1") or lower.startswith("o3"):
            # Modelo OpenAI
            clean_m = lower.replace("openai:", "").replace("api:openai:", "").strip()
            return {
                "id": f"api:openai:{clean_m}",
                "name": f"OpenAI {clean_m}",
                "provider": "openai",
                "model_id": clean_m,
                "env_var": "OPENAI_API_KEY",
                "base_url": "https://api.openai.com/v1",
                "type": "api"
            }
        elif lower.startswith("groq:") or lower.startswith("llama-"):
            clean_m = lower.replace("groq:", "").replace("api:groq:", "").strip()
            return {
                "id": f"api:groq:{clean_m}",
                "name": f"Groq {clean_m}",
                "provider": "groq",
                "model_id": clean_m,
                "env_var": "GROQ_API_KEY",
                "base_url": "https://api.groq.com/openai/v1",
                "type": "api"
            }

        return None

    def list_google_models(self, session_key: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Consulta a API do Google Gemini em tempo real e retorna todos os modelos disponíveis para a chave.
        """
        key = self.resolve_api_key({"provider": "google", "env_var": "GEMINI_API_KEY"}, session_key)
        if not key:
            return []

        try:
            from google import genai
            client = genai.Client(api_key=key)
            result = []
            
            # Listar modelos disponíveis
            for m in client.models.list():
                # Filtrar modelos de chat/geração de conteúdo
                m_name = getattr(m, 'name', '') or ''
                # Remover prefixo 'models/'
                clean_name = m_name.replace("models/", "")
                
                # Ignorar embeddings, ferramentas não-chat e versões 1 e 2 descontinuadas
                ignored_keywords = [
                    "embedding", "bison", "aqa", "imagen", "veo", "lyria", "robotics",
                    "transcribe", "gemini-1.", "gemini-2.", "gemini-1.5", "gemini-2.0", "gemini-2.5"
                ]
                if any(x in clean_name.lower() for x in ignored_keywords):
                    continue

                display_name = getattr(m, 'display_name', clean_name) or clean_name
                desc = getattr(m, 'description', '') or ''

                result.append({
                    "id": f"api:google:{clean_name}",
                    "name": display_name,
                    "model_id": clean_name,
                    "provider": "google",
                    "description": desc[:150]
                })

            return result
        except Exception as e:
            logger.warning(f"Não foi possível listar modelos do Google via API: {e}")
            return []

    def add_model(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cadastra um novo modelo.
        IMPORTANTE: remove qualquer chave 'api_key' antes de salvar no disco!
        """
        provider = data.get("provider", "openai").lower()
        model_name = data.get("name", "").strip() or data.get("model_id", "Modelo API")
        model_ref = data.get("model_id", "").strip()
        base_url = data.get("base_url", "").strip() or PROVIDER_DEFAULTS.get(provider, {}).get("base_url")
        env_var = data.get("env_var", "").strip() or PROVIDER_DEFAULTS.get(provider, {}).get("env_var", "API_KEY")
        
        entry_id = f"api:{provider}:{model_ref}".lower().replace("/", "_")

        new_entry = {
            "id": entry_id,
            "name": model_name,
            "provider": provider,
            "model_id": model_ref,
            "base_url": base_url,
            "env_var": env_var,
            "description": data.get("description", f"Modelo {provider} ({model_ref})")
        }

        # Carregar existentes e atualizar ou adicionar
        current = self.list_models()
        # Filtrar se já existia com o mesmo ID
        filtered = [m for m in current if m["id"] != entry_id]
        filtered.append(new_entry)

        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(filtered, f, indent=2, ensure_ascii=False)

        return {"success": True, "model": new_entry}

    def delete_model(self, model_id: str) -> bool:
        current = self.list_models()
        filtered = [m for m in current if m["id"] != model_id]
        if len(filtered) < len(current):
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(filtered, f, indent=2, ensure_ascii=False)
            return True
        return False

    def resolve_api_key(self, model_cfg: Dict[str, Any], session_key: Optional[str] = None) -> Optional[str]:
        """
        Resolve a chave na seguinte ordem de prioridade:
        1. Chave da sessão enviada pelo navegador (volátil).
        2. Variável de ambiente configurada no SO ou no arquivo .env.
        """
        if session_key and session_key.strip():
            return session_key.strip()

        env_var = model_cfg.get("env_var")
        if env_var and os.environ.get(env_var):
            return os.environ.get(env_var).strip()

        # Fallbacks comuns
        provider = model_cfg.get("provider", "")
        if provider == "google":
            return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        elif provider == "openai":
            return os.environ.get("OPENAI_API_KEY")
        elif provider == "groq":
            return os.environ.get("GROQ_API_KEY")
        elif provider == "openrouter":
            return os.environ.get("OPENROUTER_API_KEY")
        elif provider == "deepseek":
            return os.environ.get("DEEPSEEK_API_KEY")

        return None

    async def test_connection(
        self,
        provider: str,
        model_id: str,
        api_key: str,
        base_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Testa a conectividade com a API sem salvar nada no disco.
        """
        if not api_key or not api_key.strip():
            return {"success": False, "error": "Chave de API não informada."}

        key = api_key.strip()
        provider = provider.lower()

        try:
            if provider == "google":
                from google import genai
                client = genai.Client(api_key=key)
                # Chamada de teste rápida
                response = client.models.generate_content(
                    model=model_id or "gemini-3.6-flash",
                    contents="Responda apenas: OK"
                )
                text = response.text or "OK"
                return {"success": True, "message": f"Conexão com Google Gemini bem-sucedida! Resposta: {text.strip()}"}
            else:
                from openai import AsyncOpenAI
                url = base_url or PROVIDER_DEFAULTS.get(provider, {}).get("base_url") or "https://api.openai.com/v1"
                client = AsyncOpenAI(api_key=key, base_url=url)
                
                resp = await client.chat.completions.create(
                    model=model_id,
                    messages=[{"role": "user", "content": "Diga OK"}],
                    max_tokens=10
                )
                content = resp.choices[0].message.content or "OK"
                return {"success": True, "message": f"Conexão com {provider.upper()} bem-sucedida! Resposta: {content.strip()}"}
        except Exception as e:
            logger.error(f"Falha no teste de conexão com {provider}: {e}")
            return {"success": False, "error": str(e)}

    async def chat_stream(
        self,
        model_cfg: Dict[str, Any],
        messages: List[Dict[str, str]],
        session_key: Optional[str] = None,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Executa streaming token-por-token de provedores de API externos.
        """
        api_key = self.resolve_api_key(model_cfg, session_key)
        if not api_key:
            env_var = model_cfg.get("env_var", "sua chave de API")
            yield f"\n[ERRO]: Chave de API não encontrada para o modelo '{model_cfg.get('name')}'.\nPor favor, insira a chave no menu de Configurações (Sessão) ou defina a variável de ambiente '{env_var}' no seu sistema."
            return

        provider = model_cfg.get("provider", "openai").lower()
        model_id = model_cfg.get("model_id")

        try:
            if provider == "google":
                from google import genai
                client = genai.Client(api_key=api_key)
                
                # Montar prompt unificado
                prompt_parts = []
                if system_prompt:
                    prompt_parts.append(f"INSTRUÇÃO DO SISTEMA:\n{system_prompt}\n\n")
                
                for m in messages:
                    role_label = "USUÁRIO" if m["role"] == "user" else "ASSISTENTE"
                    prompt_parts.append(f"{role_label}: {m['content']}")
                
                full_contents = "\n\n".join(prompt_parts)

                response_stream = client.models.generate_content_stream(
                    model=model_id,
                    contents=full_contents,
                )
                for chunk in response_stream:
                    if chunk.text:
                        yield chunk.text

            else:
                # Provedores compatíveis com OpenAI (OpenAI, Groq, OpenRouter, DeepSeek, Custom)
                from openai import AsyncOpenAI
                url = model_cfg.get("base_url") or PROVIDER_DEFAULTS.get(provider, {}).get("base_url")
                client = AsyncOpenAI(api_key=api_key, base_url=url)

                formatted_messages = []
                if system_prompt:
                    formatted_messages.append({"role": "system", "content": system_prompt})
                formatted_messages.extend(messages)

                response = await client.chat.completions.create(
                    model=model_id,
                    messages=formatted_messages,
                    stream=True,
                    temperature=temperature
                )
                async for chunk in response:
                    if chunk.choices and len(chunk.choices) > 0:
                        delta = chunk.choices[0].delta
                        if delta and delta.content:
                            yield delta.content

        except Exception as e:
            logger.error(f"Erro no streaming de API com {provider}/{model_id}: {e}", exc_info=True)
            yield f"\n[Erro na comunicação com a API {provider.upper()}: {str(e)}]"

api_model_manager = ApiModelManager()
