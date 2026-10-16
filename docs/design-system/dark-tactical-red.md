<!--
Data/Hora: 2026-10-15T22:39:00-03:00 (UTC-3)
Branch: Web-Atom
Commit: 7dce1c2
Status: Atualizado
-->

# Especificação do Design System: Dark Tactical Red

O **Design System Dark Tactical Red** foi concebido por Rubens Mota para dotar o **A.T.O.M.** de uma estética militar e futurista de alta precisão, priorizando ergonomia visual em ambientes de baixa luminosidade e máxima densidade informacional.

---

## 1. Tokens de Cores Oficiais

Definidos em `:root` no arquivo [frontend/css/style.css](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/frontend/css/style.css):

```css
:root {
  /* Fundos Táticos */
  --bg-space: #0a0a0a;            /* Espaço exterior e fundo primário */
  --bg-cockpit: #0d0d0d;          /* Cockpit central */
  --bg-panel: rgba(17, 17, 17, 0.92); /* Superfícies de vidro dos painéis */
  --bg-card: #111111;             /* Cards de telemetria e dossiês */
  --bg-card-hover: #151515;       /* Hover em cards e botões */
  --bg-input: #151515;            /* Entradas e textareas */

  /* Estrutura & Bordas */
  --border-color: #262626;        /* Bordas padrão */
  --border-muted: #404040;        /* Linhas divisórias atenuadas */
  --red-border-subtle: #3b1515;   /* Borda vermelha de baixa saturação */

  /* Acentos de Energia Tática */
  --accent-red: #ef4444;          /* Vermelho tático primário */
  --accent-red-hover: #e11d1d;    /* Vermelho de ação/hover */
  --accent-glow: rgba(239, 68, 68, 0.35); /* Glow difuso */
  --red-bg-subtle: #1f0d0d;       /* Fundo sutil para badges e botões */
  --red-bg-dark: #140a0a;         /* Fundo escuro para relatórios */

  /* Texto */
  --text-primary: #f5f5f5;        /* Texto de alto contraste */
  --text-secondary: #d4d4d4;      /* Informações secundárias */
  --text-muted: #a3a3a3;          /* Metadados e rótulos secundários */
  --text-dim: #8a8a8a;            /* Legendas de telemetria */
}
```

---

## 2. Tipografia Tática

O A.T.O.M. utiliza uma combinação harmoniosa de duas fontes do Google Fonts:

1. **`Space Grotesk` (Interface & Títulos):**
   - Utilizada em cabeçalhos, títulos principais, botões de ação e corpo de mensagens.
   - Proporciona personalidade moderna, angular e sci-fi sem comprometer a legibilidade.
2. **`JetBrains Mono` (Telemetria, HUD & Rótulos):**
   - Utilizada em rótulos de estilo `01 · APRESENTAÇÃO` (`12px`, maiúsculas, cor `#ef4444`, `letter-spacing: 0.14em`).
   - Aplicada em dados de CPU, RAM, blocos de código e terminal de comandos.

---

## 3. Cantoneiras Táticas & Geometria

- **`border-radius: 4px` padronizado:** Cantos com raio fechado reforçam a estética militar e a sensação de equipamento de alta precisão.
- **Cantoneiras nos 4 Vértices:** Painéis como `.hud-sidebar`, `.hud-centerstage`, `.hud-chat-panel`, `.hud-drawer` e `.hud-modal-window` utilizam pseudo-elementos `::before` e `::after` com bordas de `2px solid #ef4444` nos cantos superior-esquerdo e inferior-direito, simulando mirantes HUD.

---

## 4. Reator Atômico Quântico (Canvas 2D)

Implementado no módulo [frontend/js/reactor.js](file:///c:/Users/Rubens/Desktop/projetinhos/jarvis%20gravity/frontend/js/reactor.js):
- Renderizado a **60fps** em um `<canvas width="400" height="400">`.
- Composto por:
  1. **Núcleo Central:** Circunferência pulsante com gradiente radial `#ef4444` -> `#dc2626` e sombra difusa.
  2. **Três Órbitas Elípticas:** Rotacionadas em ângulos simétricos de 60 graus.
  3. **Elétrons em Órbita:** Partículas brilhantes que percorrem as órbitas conforme funções trigonométricas de tempo real (`Math.sin`, `Math.cos`).
  4. **Estados Reativos:** A velocidade e a pulsação mudam dinamicamente conforme o assistente transita entre:
     - `IDLE` (Em Espera): Rotação suave e respiração lenta.
     - `LISTENING` (Ouvindo): Pulsação rápida com anéis dourados.
     - `THINKING` (Processando): Aceleração de rotação e partículas emitidas do núcleo.
     - `SPEAKING` (Falando): Ondas de áudio ativas em conjunto com o sintetizador vocal.
