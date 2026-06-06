/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "@/app/api/feedback/route";
import * as feedbackStore from "@/lib/feedback-store";
import { clearFeedback, listFeedback } from "@/lib/feedback-store";

function makeRequest(body: unknown, raw = false) {
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

describe("POST /api/feedback", () => {
  beforeEach(() => {
    clearFeedback();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("유효한 body면 200 + { id, savedAt } 반환하고 저장된다", async () => {
    const res = await POST(
      makeRequest({ conceptSlug: "agent-loop", rating: 5, comment: "좋아요" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.id).toBe("string");
    expect(typeof json.savedAt).toBe("string");
    expect(new Date(json.savedAt).toISOString()).toBe(json.savedAt);
    expect(listFeedback()).toHaveLength(1);
  });

  it("comment 생략/빈 문자열도 200", async () => {
    const noComment = await POST(
      makeRequest({ conceptSlug: "agent-loop", rating: 3 }),
    );
    expect(noComment.status).toBe(200);

    const emptyComment = await POST(
      makeRequest({ conceptSlug: "agent-loop", rating: 3, comment: "" }),
    );
    expect(emptyComment.status).toBe(200);
  });

  it("존재하지 않는 slug면 400 + unknown_concept_slug", async () => {
    const res = await POST(
      makeRequest({ conceptSlug: "does-not-exist", rating: 3 }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("unknown_concept_slug");
  });

  it("rating 범위 밖이면 400 + invalid_rating", async () => {
    const res = await POST(
      makeRequest({ conceptSlug: "agent-loop", rating: 6 }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_rating");
  });

  it("rating 비정수/null/누락이면 400", async () => {
    for (const body of [
      { conceptSlug: "agent-loop", rating: 4.5 },
      { conceptSlug: "agent-loop", rating: null }, // 폼 NaN → JSON.stringify가 null로 직렬화
      { conceptSlug: "agent-loop" }, // rating 누락
    ]) {
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("invalid_rating");
    }
  });

  it("comment 201자면 400 + invalid_comment", async () => {
    const res = await POST(
      makeRequest({
        conceptSlug: "agent-loop",
        rating: 3,
        comment: "가".repeat(201),
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_comment");
  });

  it("JSON이 아니면 400 + invalid_json", async () => {
    const res = await POST(makeRequest("not json", true));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_json");
  });

  it("conceptSlug 누락/타입 오류면 400 + invalid_concept_slug", async () => {
    for (const body of [{ rating: 3 }, { conceptSlug: 123, rating: 3 }]) {
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("invalid_concept_slug");
    }
  });

  it("JSON이되 객체가 아니면(null) 400 + invalid_json", async () => {
    const res = await POST(makeRequest("null", true));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_json");
  });

  it("예상 밖 예외는 500 + internal_error + 고정 메시지", async () => {
    vi.spyOn(feedbackStore, "saveFeedback").mockImplementation(() => {
      throw new Error("unexpected boom");
    });
    const res = await POST(
      makeRequest({ conceptSlug: "agent-loop", rating: 3 }),
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("internal_error");
    expect(json.message).toBe("내부 오류");
    expect(json.message).not.toContain("unexpected boom");
  });
});
