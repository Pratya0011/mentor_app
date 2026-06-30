export const chunks = [
  // ── Topic 1: Machine Learning Fundamentals ──────────────────────
  {
    id: "ml-definition",
    topic: "Machine Learning",
    text: "Machine Learning is a subset of artificial intelligence where systems learn patterns from data without being explicitly programmed. Instead of writing rules manually, you feed examples to an algorithm and it figures out the rules itself. There are three main types: supervised learning (labeled data), unsupervised learning (unlabeled data), and reinforcement learning (learning through rewards and penalties).",
  },
  {
    id: "ml-overfitting",
    topic: "Machine Learning",
    text: "Overfitting happens when a model learns the training data too well — including its noise and outliers — and performs poorly on new unseen data. It's like memorizing exam answers instead of understanding the concept. Common fixes include adding more training data, using dropout layers, applying regularization techniques like L1 or L2, or simplifying the model architecture.",
  },

  // ── Topic 2: RAG in AI ──────────────────────────────────────────
  {
    id: "rag-definition",
    topic: "RAG in AI",
    text: "Retrieval-Augmented Generation (RAG) is an AI technique that combines a retrieval system with a generative language model. Instead of relying solely on knowledge baked into model weights during training, RAG fetches relevant external documents at inference time and feeds them into the model as context. This allows the model to answer questions grounded in specific, up-to-date information without retraining.",
  },
  {
    id: "rag-vs-finetuning",
    topic: "RAG in AI",
    text: "RAG and fine-tuning solve different problems. Fine-tuning bakes knowledge into model weights — it's expensive, requires retraining when knowledge changes, and can cause catastrophic forgetting. RAG keeps knowledge external and updatable without touching the model. RAG is better for dynamic factual knowledge. Fine-tuning is better for style, tone, or domain-specific reasoning patterns that don't change often.",
  },

  // ── Topic 3: Data Structures ────────────────────────────────────
  {
    id: "ds-arrays-vs-linkedlists",
    topic: "Data Structures",
    text: "Arrays store elements in contiguous memory, giving O(1) random access by index but O(n) insertion and deletion in the middle. Linked lists store elements as nodes with pointers to the next node, giving O(1) insertion and deletion but O(n) access by index. Use arrays when you need fast reads. Use linked lists when you need frequent insertions or deletions at arbitrary positions.",
  },
  {
    id: "ds-hashmaps",
    topic: "Data Structures",
    text: "A hashmap stores key-value pairs and provides average O(1) lookup, insertion, and deletion. It works by running the key through a hash function to get a bucket index, then storing the value there. Collisions — when two keys hash to the same bucket — are handled via chaining (linked list at each bucket) or open addressing (probing nearby buckets). Worst case degrades to O(n) if collisions are excessive.",
  },
];
