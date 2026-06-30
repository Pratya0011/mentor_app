/**
 * Talks to the backend retrieval service. The phone sends the raw question
 * text; the server embeds it (same MiniLM used for the chunks) and returns
 * the most relevant chunks. Generation then happens on-device with Qwen.
 */

// Android emulator reaches the host machine via 10.0.2.2.
// For a real phone, change this to your Mac's LAN IP, e.g. http://192.168.1.5:8080
export const API_BASE = 'http://10.0.2.2:8080';

export type RetrievedChunk = {
  id: string;
  topic: string;
  text: string;
  score: number;
};

export type RetrieveResult = {
  hasContext: boolean;
  chunks: RetrievedChunk[];
};

/** Sends the question to the backend and returns the retrieved chunks. */
export async function retrieveContext(question: string): Promise<RetrieveResult> {
  const res = await fetch(`${API_BASE}/chat/retreve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    throw new Error(`Retrieve failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    hasContext: Boolean(data.hasContext),
    chunks: Array.isArray(data.chunks) ? data.chunks : [],
  };
}

/** Builds the system prompt that grounds Qwen in the retrieved chunks. */
export function buildSystemPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return 'You are a helpful mentor. If you do not know the answer, say so honestly rather than guessing.';
  }

  const context = chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n');
  return [
    'You are a helpful mentor. Answer the question using ONLY the context below.',
    "If the context does not contain the answer, say you don't have that information.",
    '',
    'Context:',
    context,
  ].join('\n');
}
