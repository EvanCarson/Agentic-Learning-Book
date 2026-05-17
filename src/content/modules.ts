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
];
