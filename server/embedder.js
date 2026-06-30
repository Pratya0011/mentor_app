import { env, pipeline } from "@xenova/transformers";

// Cache the loading *promise*, not the resolved pipeline. Otherwise concurrent
// callers (embedChunks embeds all chunks in parallel) each see a null pipeline
// and load the model separately — loading MiniLM N times instead of once.
let embedPipelinePromise = null;

const getEmbedPipeline = () => {
  if (!embedPipelinePromise) {
    // Locally, set ALLOW_REMOTE_MODELS=false to load the cached model offline
    // (avoids slow/hanging network probes). In production (Render) the fresh
    // container has no cache, so remote stays enabled to download MiniLM once.
    // Read here (not at import) so dotenv has already populated process.env.
    env.allowRemoteModels = process.env.ALLOW_REMOTE_MODELS !== "false";
    console.log("[Embedder] Loading MiniLM model...");
    embedPipelinePromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    ).then((pipe) => {
      console.log("[Embedder] Model ready.");
      return pipe;
    });
  }
  return embedPipelinePromise;
};

export const embedText = async (text) => {
  const pipe = await getEmbedPipeline();
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
};

export const embedChunks = async (chunks) => {
  console.log(`[Embedder] Embedding ${chunks.length} chunks...`);
  const embedded = await Promise.all(
    chunks.map(async (chunk) => ({
      ...chunk,
      vector: await embedText(chunk.text),
    })),
  );
  console.log("[Embedder] All chunks embedded.");
  return embedded;
};
