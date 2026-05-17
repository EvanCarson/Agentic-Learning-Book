export interface Module {
  id: string;
  title: string;
  order: number;
  summary: string;
}

export const modules: Module[] = [
  {
    id: "foundations",
    title: "Foundations",
    order: 1,
    summary:
      "The agent loop, the LLM as decision policy, and the deterministic mock-LLM harness every later module builds on.",
  },
  {
    id: "prompting",
    title: "Prompting & Control",
    order: 2,
    summary: "Turning model output into reliable, parseable decisions.",
  },
  {
    id: "tools",
    title: "Tool Use",
    order: 3,
    summary: "Letting agents act through well-described, testable tools.",
  },
  {
    id: "rag",
    title: "Retrieval & RAG",
    order: 4,
    summary: "Grounding answers in retrieved context with citations.",
  },
  {
    id: "memory",
    title: "Memory & State",
    order: 5,
    summary: "Carrying state across turns: working memory and summaries.",
  },
  {
    id: "planning",
    title: "Planning & Reasoning",
    order: 6,
    summary: "Decomposition, plan-execute, and reflection loops.",
  },
  {
    id: "multi-agent",
    title: "Multi-Agent Systems",
    order: 7,
    summary: "Coordinating specialised agents: supervisor and workers.",
  },
];
