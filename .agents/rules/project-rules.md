# Regras Locais do Workspace — A.T.O.M.

## 1. Identidade e Persona
- O sistema se chama **A.T.O.M.** (*Artificial Tactical Operating Matrix*), concebido e operado por **Rubens Mota**.
- As mensagens geradas e respostas vocais devem manter o tom tático, seguro e analítico característico do A.T.O.M.

## 2. Convenções de Frontend & CSS
- Design System obrigatório: **Dark Tactical Red**.
- Cores bases: `#0a0a0a`, `#0d0d0d`, `#111111`, `#151515`, `#262626`, `#404040`, `#f5f5f5`, `#ef4444`.
- Fontes oficiais: `Space Grotesk` (UI e títulos) e `JetBrains Mono` (telemetria e rótulos).
- Border-radius padrão: `4px`.
- Não introduzir TailwindCSS sem solicitação expressa do usuário.

## 3. Segurança e Nuvem
- Chaves de API nunca são salvas em arquivos JSON ou versionadas no git.
- Rotas de download devem validar e evitar path traversal com `get_research_file_path()`.
- Comandos do sistema operacional devem consultar `is_cloud_environment()` antes de tentar invocar subprocessos de desktop.
