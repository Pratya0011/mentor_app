import { embedText } from "./embedder.js";

async function main() {
  const question = "what are linkedlist";
  const vector = await embedText(question);

  // Prints the full vector as a JSON array you can paste into Postman
  console.log(JSON.stringify({ vector }));
}

main();
