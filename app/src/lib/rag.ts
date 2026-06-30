/**
 * Talks to the backend retrieval service. The phone sends the raw question
 * text; the server embeds it (same MiniLM used for the chunks) and returns
 * the most relevant chunks. Generation then happens on-device with Qwen.
 */

// Backend hosted on Render. Works from the emulator and a real phone alike
// (no LAN-IP juggling). For local backend dev, swap to http://10.0.2.2:8080.
export const API_BASE = 'https://mentor-app-9izg.onrender.com';

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
  console.log('[RAG] →', `${API_BASE}/chat/retreve`, { question });

  const res = await fetch(`${API_BASE}/chat/retreve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  console.log('[RAG] status:', res.status);

  if (!res.ok) {
    throw new Error(`Retrieve failed: ${res.status}`);
  }

  const data = await res.json();
  console.log('[RAG] chunks:', data.chunks?.length ?? 0, data.chunks);

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
    'You are a helpful mentor. The context below contains factual information — use it as your foundation.',
    'Build on it freely: give examples, analogies, step-by-step explanations, and elaborations using your own knowledge.',
    'Stay consistent with the context, but do not limit yourself to only what is literally written there.',
    '',
    'Context:',
    context,
  ].join('\n');
}
