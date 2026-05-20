import type { Concept } from "@/lib/concepts";

export async function fetchConcepts(): Promise<Concept[]> {
  const res = await fetch("/api/concepts");
  if (!res.ok) {
    throw new Error(`fetchConcepts failed: ${res.status}`);
  }
  const json = (await res.json()) as { concepts: Concept[] };
  return json.concepts;
}
