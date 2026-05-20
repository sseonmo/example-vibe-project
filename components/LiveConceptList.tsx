"use client";

import { useEffect, useState } from "react";
import { fetchConcepts } from "@/lib/api/fetch-client";
import type { Concept } from "@/lib/concepts";

export function LiveConceptList() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConcepts()
      .then(setConcepts)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-400">불러오기 실패: {error}</p>
    );
  }

  if (concepts.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">불러오는 중…</p>;
  }

  return (
    <ul className="grid gap-2 text-sm">
      {concepts.map((c) => (
        <li
          key={c.slug}
          className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2"
        >
          <span className="text-[var(--color-fg)]">{c.title}</span>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            /{c.slug}
          </span>
        </li>
      ))}
    </ul>
  );
}
