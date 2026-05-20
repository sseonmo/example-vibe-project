import { describe, it, expect } from "vitest";
import { listConcepts, findConcept } from "@/lib/concepts";

describe("lib/concepts", () => {
  it("listConcepts는 최소 2개 이상의 개념을 반환한다", () => {
    const all = listConcepts();
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all.every((c) => c.slug && c.title)).toBe(true);
  });

  it("findConcept는 존재하는 slug에 매칭된다", () => {
    const concept = findConcept("agent-loop");
    expect(concept).toBeDefined();
    expect(concept?.title).toMatch(/에이전트 루프/);
  });

  it("findConcept는 없는 slug에 undefined를 반환한다", () => {
    expect(findConcept("does-not-exist")).toBeUndefined();
  });
});
