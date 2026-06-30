import express from "express";
import bodyParser from "body-parser";
import { config } from "dotenv";
import chatRouter from "./Routes/chatRoute.js";
import { embedChunks } from "./embedder.js";
import { chunks } from "./chunks.js";
import { setChunks } from "./Controller/chatController.js";

config();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/chat", chatRouter);

// Start listening immediately so the server is reachable right away, then
// embed the chunks in the background. Retrieval becomes ready once embedding
// finishes (see the "[Server] Retrieval ready" log).
app.listen(process.env.PORT, () => {
  console.log(`server listening on port ${process.env.PORT}`);
  console.log("[Server] Warming up retrieval (embedding chunks)...");

  embedChunks(chunks)
    .then((embedded) => {
      setChunks(embedded);
      console.log("[Server] Retrieval ready.");
    })
    .catch((err) => {
      console.error("[Server] Embedding failed:", err);
    });
});
