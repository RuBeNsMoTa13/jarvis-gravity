import logging
from typing import List, Dict, Any

logger = logging.getLogger("jarvis.tools.search")

def search_web(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Executa busca na web utilizando DuckDuckGo e retorna resultados estruturados.
    """
    results = []
    try:
        try:
            from duckduckgo_search import DDGS
        except ImportError:
            from ddgs import DDGS

        with DDGS() as ddgs:
            raw_results = list(ddgs.text(query, max_results=max_results))
            for item in raw_results:
                results.append({
                    "title": item.get("title", ""),
                    "snippet": item.get("body", item.get("snippet", "")),
                    "url": item.get("href", item.get("link", ""))
                })
        
        return {
            "success": True,
            "query": query,
            "count": len(results),
            "results": results
        }
    except Exception as e:
        logger.error(f"Erro na pesquisa DuckDuckGo: {e}", exc_info=True)
        return {
            "success": False,
            "query": query,
            "count": 0,
            "results": [],
            "error": str(e)
        }

def format_search_context(search_data: Dict[str, Any]) -> str:
    """
    Formata os resultados de busca para serem injetados no contexto do LLM.
    """
    if not search_data.get("success") or not search_data.get("results"):
        return f"Não foram encontrados resultados na web para '{search_data.get('query')}'. Erro: {search_data.get('error', 'Sem resultados')}"
    
    formatted = [f"### Resultados da Pesquisa Web para: '{search_data['query']}':\n"]
    for i, res in enumerate(search_data["results"], 1):
        formatted.append(f"{i}. **{res['title']}**")
        formatted.append(f"   - Snippet: {res['snippet']}")
        formatted.append(f"   - Link: {res['url']}\n")
    return "\n".join(formatted)
