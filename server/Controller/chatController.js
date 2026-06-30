import { embedText } from "../embedder.js";
import { topKSearch } from "../search.js";

let embeddedChunks = [];

export const setChunks = (chunks) => {
  embeddedChunks = chunks;
};

export const retreveRouter = async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return res
      .status(400)
      .json({ error: "Missing or invalid 'question' in request body." });
  }
  if (embeddedChunks.length === 0) {
    return res
      .status(503)
      .json({ error: "Retrieval is still warming up. Try again in a moment." });
  }
  try {
    // Embed the question with the SAME model used for the chunks so the
    // vectors live in the same space, then retrieve the closest chunks.
    const vector = await embedText(question);
    const results = topKSearch(vector, embeddedChunks, 2);
    res.status(200).send({
      message: "route successful",
      hasContext: results.length > 0,
      chunks: results,
    });
  } catch (err) {
    console.error("Error in retreveRouter:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};
