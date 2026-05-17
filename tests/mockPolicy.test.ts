import { describe, it, expect } from "vitest";
import { mockAgentLoopPolicy } from "../src/lib/mockPolicy";

describe("mockAgentLoopPolicy", () => {
  it("returns 'search' when the observation contains 'unknown', else 'answer'", async () => {
    expect(await mockAgentLoopPolicy("unknown topic")).toBe("search");
    expect(await mockAgentLoopPolicy("known fact")).toBe("answer");
    expect(await mockAgentLoopPolicy("unknown thing")).toBe("search");
  });

  it("is deterministic across calls", async () => {
    expect(await mockAgentLoopPolicy("unknown topic")).toBe(
      await mockAgentLoopPolicy("unknown topic"),
    );
  });
});
