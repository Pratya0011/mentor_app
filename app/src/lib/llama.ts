import { initLlama, LlamaContext } from 'llama.rn';

import { ensureModel } from './model';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

let context: LlamaContext | null = null;

/**
 * Loads the GGUF into llama.cpp once and caches the context.
 * The model is expected to already be downloaded (see ./model).
 */
export async function loadModel(): Promise<LlamaContext> {
  if (context) return context;

  const uri = await ensureModel();
  context = await initLlama({
    model: uri.replace('file://', ''), // llama.rn wants a raw path
    n_ctx: 4096, // context window
    n_gpu_layers: 0, // CPU inference (no Hexagon/GPU on emulator)
  });

  return context;
}

/**
 * Runs a chat completion. `onToken` streams the growing reply so the
 * UI can render the answer as it's generated.
 */
export async function chat(
  messages: ChatMessage[],
  onToken?: (partial: string) => void,
): Promise<string> {
  if (!context) {
    throw new Error('Model not loaded. Call loadModel() first.');
  }

  let streamed = '';
  const result = await context.completion(
    {
      messages,
      n_predict: 512, // max tokens generated
      temperature: 0.7,
      stop: ['<|im_end|>'], // ChatML turn boundary used by Qwen
    },
    (data) => {
      streamed += data.token;
      onToken?.(streamed);
    },
  );

  return result.text;
}

/** Frees the model from memory. */
export async function unloadModel(): Promise<void> {
  if (context) {
    await context.release();
    context = null;
  }
}
