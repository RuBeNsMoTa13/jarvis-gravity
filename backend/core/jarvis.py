import json
import logging
import re
from typing import AsyncGenerator, Dict, Any, List, Optional
from .ollama_client import ollama_manager
from ..tools.search_tool import search_web, format_search_context
from ..tools.markdown_tool import save_research_markdown, list_researches, read_research, open_research_file
from ..tools.system_tool import execute_os_command, open_application, get_system_telemetry

logger = logging.getLogger("jarvis.core.brain")

DEFAULT_SYSTEM_PROMPT = """Você é o J.A.R.V.I.S. (Just A Rather Very Intelligent System), um assistente de inteligência artificial avançado, elegante, ultra-eficiente e leal ao seu operador.
Você opera localmente com máxima privacidade e baixa latência através do Ollama.

Suas capacidades integradas incluem:
1. Pesquisa na web em tempo real (DuckDuckGo).
2. Criação e gestão de relatórios e resumos estruturados em arquivos Markdown (.md).
3. Execução de comandos do sistema operacional Windows (PowerShell/CMD) e abertura de aplicativos.

Diretrizes de comunicação:
- Responda em Português do Brasil com tom polido, perspicaz, técnico e prestativo (estilo Stark Industries).
- Seja conciso e direto quando solicitado comandos ou status.
- Quando dados de pesquisa web ou comandos do sistema forem fornecidos no contexto, sintetize-os de maneira clara e analítica.
"""

class JarvisBrain:
    def __init__(self):
        self.default_model = "gemma:latest"
        self.system_prompt = DEFAULT_SYSTEM_PROMPT
        self.autonomous_mode = False

    def detect_intent(self, user_message: str) -> Dict[str, Any]:
        """
        Detecta intenções explícitas de ferramentas para execução proativa e sem falhas.
        """
        msg = user_message.strip()
        lower = msg.lower()

        # 1. Intenção: Abrir aplicativo conhecido
        app_patterns = [
            (r"(?:abra|inicie|execute|abrir)\s+(?:o\s+|a\s+)?(calculadora|calc)", "calc"),
            (r"(?:abra|inicie|execute|abrir)\s+(?:o\s+|a\s+)?(bloco de notas|notepad)", "notepad"),
            (r"(?:abra|inicie|execute|abrir)\s+(?:o\s+|a\s+)?(vs\s*code|vscode|code)", "code"),
            (r"(?:abra|inicie|execute|abrir)\s+(?:o\s+|a\s+)?(explorador|explorer|pastas?)", "explorer"),
            (r"(?:abra|inicie|execute|abrir)\s+(?:o\s+|a\s+)?(gerenciador de tarefas|taskmgr)", "taskmgr"),
            (r"(?:abra|inicie|execute|abrir)\s+(?:o\s+|a\s+)?(paint|mspaint)", "paint"),
            (r"(?:abra|inicie|execute|abrir)\s+(?:o\s+|a\s+)?(site|página|link|url)?\s*(https?://\S+)", "url")
        ]
        for pattern, app in app_patterns:
            match = re.search(pattern, lower)
            if match:
                target = match.group(2) if app == "url" else app
                return {"tool": "open_app", "target": target}

        # 2. Intenção: Telemetria de Hardware/Sistema
        if any(phrase in lower for phrase in [
            "status do sistema", "uso de cpu", "uso de memória", "uso de ram",
            "telemetria", "como está a máquina", "espaço em disco", "status de hardware"
        ]):
            return {"tool": "system_telemetry"}

        # 3. Intenção: Execução explícita de comando no Windows / PowerShell
        cmd_match = re.search(r"(?:execute|rode|rodar|comando)\s+(?:no sistema|no windows|powershell|cmd)?\s*[:\-]?\s*[`'\"]?([^`'\"]+)[`'\"]?$", msg, re.IGNORECASE)
        if cmd_match and len(cmd_match.group(1).split()) <= 8:
            cmd = cmd_match.group(1).strip()
            # Ignorar perguntas genéricas
            if not any(w in cmd.lower() for w in ["como", "qual", "quem", "porque", "pesquise"]):
                return {"tool": "os_command", "command": cmd}

        # 4. Intenção: Criar resumo / relatório em Markdown
        markdown_match = re.search(r"(?:crie|gere|salve|fazer|faça)\s+(?:um\s+)?(?:arquivo\s+)?(?:resumo|relat[oó]rio|dossi[êe]|nota|anota[çc][ãa]o)\s+(?:em\s+markdown|\.md)?\s*(?:sobre|de)?\s*(.*)", lower)
        if markdown_match:
            topic = markdown_match.group(1).strip() or "Pesquisa"
            return {"tool": "create_markdown", "topic": topic}

        # 5. Intenção: Pesquisa Web
        search_match = re.search(r"(?:pesquise|busque|procure|pesquisar|buscar)\s+(?:na web|na internet|sobre|por)?\s*(.*)", lower)
        if search_match:
            query = search_match.group(1).strip()
            if query:
                return {"tool": "web_search", "query": query}

        # Verificação secundária para perguntas temporais que exigem dados atualizados da web
        if any(term in lower for term in ["últimas notícias", "notícias de hoje", "notícias recentes", "preço atual", "cotação hoje", "lançamento de"]):
            return {"tool": "web_search", "query": msg}

        return {"tool": None}

    async def process_conversation_stream(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        autonomous: bool = False
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Processa a mensagem com detecção de ferramentas, execução e streaming em tempo real.
        """
        target_model = model or self.default_model
        user_message = messages[-1]["content"] if messages else ""
        
        # 1. Analisar intenção
        intent = self.detect_intent(user_message)
        tool_name = intent.get("tool")

        context_injection = ""

        # --- EXECUÇÃO DE FERRAMENTAS ---
        if tool_name == "open_app":
            target = intent["target"]
            yield {
                "type": "tool_start",
                "tool": "open_app",
                "label": "Iniciando Aplicativo",
                "details": f"Executando '{target}' no Windows..."
            }
            res = open_application(target)
            yield {
                "type": "tool_end",
                "tool": "open_app",
                "success": res.get("success", False),
                "data": res
            }
            context_injection = f"\n[SISTEMA]: O aplicativo '{target}' foi acionado no Windows. Resultado: {res.get('message', res.get('error'))}."

        elif tool_name == "system_telemetry":
            yield {
                "type": "tool_start",
                "tool": "system_telemetry",
                "label": "Diagnóstico de Hardware",
                "details": "Coletando telemetria em tempo real (CPU, RAM, Disco)..."
            }
            telem = get_system_telemetry()
            yield {
                "type": "tool_end",
                "tool": "system_telemetry",
                "success": telem.get("success", False),
                "data": telem
            }
            context_injection = (
                f"\n[TELEMETRIA DO SISTEMA]:\n"
                f"- CPU: {telem.get('cpu_percent')}% em uso\n"
                f"- RAM: {telem.get('ram_used_gb')}GB usados de {telem.get('ram_total_gb')}GB ({telem.get('ram_percent')}%)\n"
                f"- Armazenamento: {telem.get('disk_free_gb')}GB livres de {telem.get('disk_total_gb')}GB ({telem.get('disk_percent')}% usado)\n"
            )

        elif tool_name == "os_command":
            cmd = intent["command"]
            yield {
                "type": "tool_start",
                "tool": "os_command",
                "label": "Terminal Windows",
                "details": f"Executando comando PowerShell: `{cmd}`"
            }
            cmd_result = execute_os_command(cmd, autonomous=autonomous)
            yield {
                "type": "tool_end",
                "tool": "os_command",
                "success": cmd_result.get("success", False),
                "data": cmd_result
            }
            context_injection = (
                f"\n[COMANDO POWERSHELL EXECUTADO]: `{cmd}`\n"
                f"Código de Saída: {cmd_result.get('exit_code')}\n"
                f"Saída (stdout):\n{cmd_result.get('stdout', '(sem saída)')}\n"
                f"Erros (stderr):\n{cmd_result.get('stderr', '(nenhum)')}\n"
            )

        elif tool_name == "web_search":
            query = intent["query"]
            yield {
                "type": "tool_start",
                "tool": "web_search",
                "label": "Pesquisa Web Tática",
                "details": f"Buscando no DuckDuckGo: \"{query}\"..."
            }
            search_res = search_web(query, max_results=5)
            yield {
                "type": "tool_end",
                "tool": "web_search",
                "success": search_res.get("success", False),
                "data": search_res
            }
            context_injection = "\n" + format_search_context(search_res)

        elif tool_name == "create_markdown":
            topic = intent["topic"]
            yield {
                "type": "tool_start",
                "tool": "web_search",
                "label": "Coleta de Inteligência para Dossiê",
                "details": f"Pesquisando dados sobre \"{topic}\"..."
            }
            # Fazer busca prévia para enriquecer o resumo
            search_res = search_web(topic, max_results=4)
            yield {
                "type": "tool_end",
                "tool": "web_search",
                "success": search_res.get("success", False),
                "data": search_res
            }
            
            context_injection = (
                f"\n[INSTRUÇÃO DO PROTOCOLO JARVIS]: O operador solicitou um resumo/dossiê em Markdown sobre '{topic}'.\n"
                f"Abaixo estão os dados coletados:\n"
                f"{format_search_context(search_res)}\n"
                f"Gere um relatório abrangente, detalhado e técnico com títulos, tópicos e conclusões."
            )

        # Montar mensagens com a injeção de contexto se houver
        augmented_messages = list(messages)
        if context_injection:
            last_msg = augmented_messages[-1]
            augmented_messages[-1] = {
                "role": last_msg["role"],
                "content": last_msg["content"] + f"\n\n[DADOS DE SUPORTE OPERACIONAL]:{context_injection}"
            }

        # 2. Streaming da resposta do modelo
        yield {"type": "stream_start", "model": target_model}

        accumulated_response = ""
        async for chunk in ollama_manager.chat_stream(
            model=target_model,
            messages=augmented_messages,
            temperature=temperature,
            system_prompt=self.system_prompt
        ):
            accumulated_response += chunk
            yield {"type": "token", "content": chunk}

        # 3. Se a intenção era criar um arquivo markdown, salvar o relatório gerado
        if tool_name == "create_markdown" and accumulated_response.strip():
            topic = intent["topic"]
            save_res = save_research_markdown(
                title=f"Dossiê - {topic.title()}",
                content=accumulated_response,
                query=topic
            )
            yield {
                "type": "file_created",
                "tool": "create_markdown",
                "data": save_res
            }

        yield {"type": "stream_end", "full_content": accumulated_response}

jarvis_brain = JarvisBrain()
