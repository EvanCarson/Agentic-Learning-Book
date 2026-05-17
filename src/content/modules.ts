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
      "What an agent is and the perceive–decide–act loop that powers it.",
  },
  {
    id: "patterns",
    title: "Patterns & Best Practices",
    order: 2,
    summary: "Common agentic patterns and how to apply them well.",
  },
];
