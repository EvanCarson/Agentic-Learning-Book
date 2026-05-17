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
];
