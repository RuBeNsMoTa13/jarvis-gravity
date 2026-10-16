"""
A.T.O.M. • Ferramentas de Pesquisa Tática
- search_web(): busca ágil via DuckDuckGo.
- read_url_content(): leitura profunda de páginas via Jina Reader (r.jina.ai).
- search_arxiv(): artigos científicos reais em tempo real via API pública do arXiv.
- Cache em memória com TTL para acelerar consultas repetidas.

Todas as chamadas HTTP usam apenas a biblioteca padrão (urllib), mantendo o
container de nuvem leve e sem dependências extras.
"""
import logging
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from typing import Any, Callable, Dict, List, Optional, Tuple

logger = logging.getLogger("atom.tools.search")

USER_AGENT = "ATOM-Tactical-OS/2.0 (+https://github.com/RuBeNsMoTa13)"
JINA_READER_BASE = "https://r.jina.ai/"
ARXIV_API_URL = "https://export.arxiv.org/api/query"
DEFAULT_READ_LIMIT = 5000

# ---------------------------------------------------------------------------
# CACHE EM MEMÓRIA COM TTL
# ---------------------------------------------------------------------------

class TTLCache:
    """Cache simples, thread-safe e com expiração por item."""

    def __init__(self, ttl_seconds: int = 600, max_items: int = 256):
        self.ttl = ttl_seconds
        self.max_items = max_items
        self._store: Dict[Tuple, Tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: Tuple) -> Optional[Any]:
        with self._lock:
            item = self._store.get(key)
            if not item:
                return None
            expires_at, value = item
            if time.time() > expires_at:
                self._store.pop(key, None)
                return None
            return value

    def set(self, key: Tuple, value: Any) -> None:
        with self._lock:
            if len(self._store) >= self.max_items:
                # Remove o item mais próximo de expirar
                oldest = min(self._store.items(), key=lambda kv: kv[1][0])[0]
                self._store.pop(oldest, None)
            self._store[key] = (time.time() + self.ttl, value)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


_search_cache = TTLCache(ttl_seconds=600)
_read_cache = TTLCache(ttl_seconds=1800, max_items=64)
_arxiv_cache = TTLCache(ttl_seconds=3600)


def _cached(cache: TTLCache, key: Tuple, producer: Callable[[], Dict[str, Any]]) -> Dict[str, Any]:
    """Retorna valor do cache ou produz, armazenando apenas resultados de sucesso."""
    hit = cache.get(key)
    if hit is not None:
        return {**hit, "cached": True}
    result = producer()
    if result.get("success"):
        cache.set(key, result)
    return {**result, "cached": False}


def _http_get(url: str, timeout: int = 15, headers: Optional[Dict[str, str]] = None) -> str:
    req_headers = {"User-Agent": USER_AGENT}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="replace")


def _smart_truncate(text: str, limit: int) -> str:
    """Trunca preservando o último parágrafo/frase completa antes do limite."""
    if len(text) <= limit:
        return text
    cut = text[:limit]
    for sep in ("\n\n", "\n", ". "):
        idx = cut.rfind(sep)
        if idx > limit * 0.6:
            cut = cut[: idx + len(sep)]
            break
    return cut.rstrip() + "\n\n[... conteúdo truncado pelo A.T.O.M. para economia de contexto ...]"


# ---------------------------------------------------------------------------
# PESQUISA WEB (DuckDuckGo)
# ---------------------------------------------------------------------------

def _search_web_raw(query: str, max_results: int) -> Dict[str, Any]:
    results: List[Dict[str, str]] = []
    try:
        try:
            from ddgs import DDGS  # Sucessor oficial do duckduckgo_search
        except ImportError:
            from duckduckgo_search import DDGS

        with DDGS() as ddgs:
            for item in list(ddgs.text(query, max_results=max_results)):
                results.append({
                    "title": item.get("title", ""),
                    "snippet": item.get("body", item.get("snippet", "")),
                    "url": item.get("href", item.get("link", "")),
                })
        return {"success": True, "query": query, "count": len(results), "results": results}
    except Exception as e:
        logger.error(f"Erro na pesquisa DuckDuckGo: {e}", exc_info=True)
        return {"success": False, "query": query, "count": 0, "results": [], "error": str(e)}


def search_web(query: str, max_results: int = 5) -> Dict[str, Any]:
    """Executa busca na web via DuckDuckGo (com cache TTL de 10 minutos)."""
    key = ("web", query.strip().lower(), max_results)
    return _cached(_search_cache, key, lambda: _search_web_raw(query, max_results))


# ---------------------------------------------------------------------------
# LEITURA PROFUNDA (Jina Reader)
# ---------------------------------------------------------------------------

def _read_url_raw(url: str, max_chars: int) -> Dict[str, Any]:
    if not url.lower().startswith(("http://", "https://")):
        return {"success": False, "url": url, "error": "URL inválida (use http:// ou https://)."}
    try:
        content = _http_get(
            f"{JINA_READER_BASE}{url}",
            timeout=20,
            headers={"Accept": "text/plain", "X-Return-Format": "markdown"},
        )
        content = content.strip()
        original_len = len(content)
        return {
            "success": bool(content),
            "url": url,
            "content": _smart_truncate(content, max_chars),
            "original_length": original_len,
            "truncated": original_len > max_chars,
            **({} if content else {"error": "Página sem conteúdo legível."}),
        }
    except urllib.error.HTTPError as e:
        return {"success": False, "url": url, "error": f"Jina Reader HTTP {e.code}"}
    except Exception as e:
        logger.warning(f"Falha ao ler URL via Jina ({url}): {e}")
        return {"success": False, "url": url, "error": str(e)}


def read_url_content(url: str, max_chars: int = DEFAULT_READ_LIMIT) -> Dict[str, Any]:
    """Lê o conteúdo completo de uma página via Jina Reader, truncado a ~5.000 caracteres."""
    key = ("read", url.strip(), max_chars)
    return _cached(_read_cache, key, lambda: _read_url_raw(url.strip(), max_chars))


def deep_search(query: str, max_results: int = 5, read_top: int = 2, max_chars: int = 2500) -> Dict[str, Any]:
    """Pesquisa no DuckDuckGo e enriquece os primeiros resultados com leitura via Jina."""
    search_res = search_web(query, max_results=max_results)
    if not search_res.get("success"):
        return search_res
    enriched = []
    for idx, res in enumerate(search_res.get("results", [])):
        item = dict(res)
        if idx < read_top and item.get("url"):
            page = read_url_content(item["url"], max_chars=max_chars)
            if page.get("success"):
                item["full_content"] = page["content"]
        enriched.append(item)
    return {**search_res, "results": enriched, "deep": True}


# ---------------------------------------------------------------------------
# PESQUISA ACADÊMICA (arXiv)
# ---------------------------------------------------------------------------

_ATOM_NS = {"atom": "http://www.w3.org/2005/Atom"}


def _search_arxiv_raw(query: str, max_results: int) -> Dict[str, Any]:
    params = urllib.parse.urlencode({
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": max_results,
        "sortBy": "relevance",
        "sortOrder": "descending",
    })
    try:
        xml_text = _http_get(f"{ARXIV_API_URL}?{params}", timeout=20)
        root = ET.fromstring(xml_text)
        papers = []
        for entry in root.findall("atom:entry", _ATOM_NS):
            def txt(tag: str) -> str:
                el = entry.find(tag, _ATOM_NS)
                return " ".join((el.text or "").split()) if el is not None else ""

            pdf_url = ""
            for link in entry.findall("atom:link", _ATOM_NS):
                if link.get("title") == "pdf":
                    pdf_url = link.get("href", "")
            papers.append({
                "title": txt("atom:title"),
                "summary": txt("atom:summary")[:900],
                "authors": [" ".join((a.findtext("atom:name", "", _ATOM_NS)).split())
                            for a in entry.findall("atom:author", _ATOM_NS)][:6],
                "published": txt("atom:published")[:10],
                "url": txt("atom:id"),
                "pdf_url": pdf_url,
            })
        return {"success": True, "query": query, "count": len(papers), "papers": papers}
    except Exception as e:
        logger.error(f"Erro na pesquisa arXiv: {e}")
        return {"success": False, "query": query, "count": 0, "papers": [], "error": str(e)}


def search_arxiv(query: str, max_results: int = 3) -> Dict[str, Any]:
    """Busca artigos científicos reais no arXiv (cache TTL de 1 hora)."""
    key = ("arxiv", query.strip().lower(), max_results)
    return _cached(_arxiv_cache, key, lambda: _search_arxiv_raw(query, max_results))


# ---------------------------------------------------------------------------
# FORMATAÇÃO DE CONTEXTO PARA O LLM
# ---------------------------------------------------------------------------

def format_search_context(search_data: Dict[str, Any]) -> str:
    """Formata os resultados de busca web para injeção no contexto do LLM."""
    if not search_data.get("success") or not search_data.get("results"):
        return (f"Não foram encontrados resultados na web para '{search_data.get('query')}'. "
                f"Erro: {search_data.get('error', 'Sem resultados')}")

    formatted = [f"### Resultados da Pesquisa Web para: '{search_data['query']}':\n"]
    for i, res in enumerate(search_data["results"], 1):
        formatted.append(f"{i}. **{res['title']}**")
        formatted.append(f"   - Snippet: {res['snippet']}")
        formatted.append(f"   - Link: {res['url']}")
        if res.get("full_content"):
            formatted.append(f"   - Conteúdo extraído (Jina Reader):\n{res['full_content']}")
        formatted.append("")
    return "\n".join(formatted)


def format_arxiv_context(arxiv_data: Dict[str, Any]) -> str:
    """Formata artigos do arXiv para injeção no contexto do LLM."""
    if not arxiv_data.get("success") or not arxiv_data.get("papers"):
        return (f"Nenhum artigo encontrado no arXiv para '{arxiv_data.get('query')}'. "
                f"Erro: {arxiv_data.get('error', 'Sem resultados')}")

    formatted = [f"### Artigos Científicos (arXiv) para: '{arxiv_data['query']}':\n"]
    for i, p in enumerate(arxiv_data["papers"], 1):
        authors = ", ".join(p["authors"]) or "Autores não informados"
        formatted.append(f"{i}. **{p['title']}** ({p['published']})")
        formatted.append(f"   - Autores: {authors}")
        formatted.append(f"   - Resumo: {p['summary']}")
        formatted.append(f"   - Link: {p['url']}" + (f" | PDF: {p['pdf_url']}" if p.get("pdf_url") else ""))
        formatted.append("")
    return "\n".join(formatted)


def format_page_context(page_data: Dict[str, Any]) -> str:
    """Formata o conteúdo lido de uma URL para injeção no contexto do LLM."""
    if not page_data.get("success"):
        return f"Não foi possível ler a página {page_data.get('url')}: {page_data.get('error')}"
    return f"### Conteúdo da página {page_data['url']} (Jina Reader):\n{page_data['content']}"
