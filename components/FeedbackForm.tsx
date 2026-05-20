"use client";

import { useState } from "react";
import { postFeedback } from "@/lib/api/axios-client";

export function FeedbackForm({ slug }: { slug: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">(
    "idle",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await postFeedback({ conceptSlug: slug, rating, comment });
      setStatus("ok");
    } catch {
      setStatus("err");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-xs uppercase tracking-widest text-[var(--color-muted)]">
        평점 (1-5)
        <input
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs uppercase tracking-widest text-[var(--color-muted)]">
        한 줄 코멘트 (선택)
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="이 페이지에서 가장 명확했던 것"
          className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg border border-[var(--color-brand)] px-4 py-2 text-sm hover:bg-[rgba(168,85,247,0.1)]"
      >
        {status === "sending" ? "전송 중…" : "피드백 보내기"}
      </button>
      {status === "ok" && (
        <p className="text-xs text-[var(--color-brand-2)]">전송 완료 ✓</p>
      )}
      {status === "err" && (
        <p className="text-xs text-red-400">
          전송 실패 — /api/feedback이 아직 stub입니다. IDEAS.md #3에서 완성하세요.
        </p>
      )}
    </form>
  );
}
