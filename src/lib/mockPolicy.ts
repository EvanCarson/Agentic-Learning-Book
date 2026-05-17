// Deterministic async stand-in for a real model, matching the original
// `02-the-agent-loop` rule so the lesson's mock output is byte-identical.
export async function mockAgentLoopPolicy(
  observation: string,
): Promise<string> {
  return observation.includes("unknown") ? "search" : "answer";
}
