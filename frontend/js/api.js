/**
 * CLIENTE DE COMUNICAÇÃO COM O BACKEND DO J.A.R.V.I.S.
 * - Suporte a chamadas REST e Streaming Server-Sent Events (SSE).
 */

const API_BASE = window.location.origin;

export const JarvisAPI = {
  /**
   * Obtém a lista de modelos instalados no Ollama.
   */
  async getModels() {
    try {
      const res = await fetch(`${API_BASE}/api/models`);
      return await res.json();
    } catch (e) {
      console.error("Erro ao buscar modelos:", e);
      return { success: false, models: [] };
    }
  },

  /**
   * Obtém as métricas de hardware e conexão com Ollama.
   */
  async getTelemetry() {
    try {
      const res = await fetch(`${API_BASE}/api/telemetry`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Obtém a lista de dossiês Markdown gerados.
   */
  async getResearches() {
    try {
      const res = await fetch(`${API_BASE}/api/researches`);
      return await res.json();
    } catch (e) {
      return { success: false, items: [] };
    }
  },

  /**
   * Obtém o conteúdo de um arquivo Markdown específico.
   */
  async getResearchContent(filename) {
    try {
      const res = await fetch(`${API_BASE}/api/researches/${encodeURIComponent(filename)}`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Abre o arquivo ou a pasta no Windows Explorer.
   */
  async openResearch(filename = null) {
    try {
      const res = await fetch(`${API_BASE}/api/researches/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Baixa um novo modelo Ollama com streaming de progresso SSE.
   */
  async pullModel(modelName, onProgress) {
    try {
      const response = await fetch(`${API_BASE}/api/models/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: modelName })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Mantém dados incompletos

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', '').trim());
              onProgress(data);
            } catch (err) {
              console.error("Erro ao decodificar progresso:", err);
            }
          }
        }
      }
    } catch (e) {
      onProgress({ status: 'error', error: e.message, done: true });
    }
  },

  /**
   * Envia uma mensagem e consome a resposta com streaming SSE em tempo real.
   */
  async chatStream({
    messages,
    model,
    temperature = 0.7,
    autonomous = false,
    onToken,
    onToolStart,
    onToolEnd,
    onFileCreated,
    onDone,
    onError
  }) {
    try {
      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model,
          temperature,
          autonomous
        })
      });

      if (!response.ok) {
        throw new Error(`Servidor respondeu com status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawJson = line.replace('data: ', '').trim();
            if (!rawJson) continue;

            try {
              const event = JSON.parse(rawJson);

              if (event.type === 'token' && onToken) {
                onToken(event.content);
              } else if (event.type === 'tool_start' && onToolStart) {
                onToolStart(event);
              } else if (event.type === 'tool_end' && onToolEnd) {
                onToolEnd(event);
              } else if (event.type === 'file_created' && onFileCreated) {
                onFileCreated(event.data);
              } else if (event.type === 'stream_end' && onDone) {
                onDone(event.full_content);
              } else if (event.type === 'error' && onError) {
                onError(event.error);
              }
            } catch (err) {
              console.error("Erro no parse de evento SSE:", err, rawJson);
            }
          }
        }
      }
    } catch (e) {
      if (onError) onError(e.message);
    }
  }
};
