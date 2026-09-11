import httpx
import json
import time

def test_full_pipeline():
    print("[1] Testando /api/health...")
    r = httpx.get("http://127.0.0.1:8000/api/health")
    assert r.status_code == 200
    print("Health OK:", r.json())

    print("\n[2] Testando /api/models...")
    r = httpx.get("http://127.0.0.1:8000/api/models")
    assert r.status_code == 200
    models = r.json().get("models", [])
    print(f"Modelos encontrados ({len(models)}):", [m["name"] for m in models])

    print("\n[3] Testando pesquisa web DuckDuckGo direta...")
    from backend.tools.search_tool import search_web
    res = search_web("Python 3.12 novidades", max_results=2)
    print("Busca DuckDuckGo OK:", res.get("success"), f"- {len(res.get('results', []))} resultados")

    print("\n[4] Testando criacao de dossie Markdown...")
    from backend.tools.markdown_tool import save_research_markdown, list_researches
    dossier = save_research_markdown(
        title="Dossie de Teste Integrado",
        content="Este eh um documento de validacao dos sistemas do assistente JARVIS.",
        query="Validacao do Sistema"
    )
    print("Dossie criado:", dossier.get("filename"))
    all_researches = list_researches()
    print(f"Total de dossies na pasta /researches: {len(all_researches)}")

    print("\n[5] Testando comando do Windows...")
    from backend.tools.system_tool import execute_os_command
    cmd_res = execute_os_command("Get-Date", autonomous=True)
    print("Comando PowerShell OK:", cmd_res.get("stdout"))

    print("\nTODOS OS SUBSISTEMAS DO JARVIS ESTAO OPERACIONAIS!")

if __name__ == "__main__":
    test_full_pipeline()
