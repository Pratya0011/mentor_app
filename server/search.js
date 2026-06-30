const cosineSimilarity = (vecA, vecB) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Below this, even the best match is treated as "no relevant context".
const MIN_SCORE = 0.25;
// A secondary chunk is kept only if it's at least this fraction of the top score.
const RELATIVE_GAP = 0.6;

export const topKSearch = (queryVector, embeddedChunks, k = 2) => {
  const scored = embeddedChunks
    .map((chunk) => ({
      id: chunk.id,
      topic: chunk.topic,
      text: chunk.text,
      score: cosineSimilarity(queryVector, chunk.vector),
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, k);

  // No good match at all → return empty so the LLM can say "I don't know".
  if (top.length === 0 || top[0].score < MIN_SCORE) return [];

  // Drop secondary chunks that are far weaker than the best match.
  const best = top[0].score;
  return top.filter((chunk) => chunk.score >= best * RELATIVE_GAP);
};
