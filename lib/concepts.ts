import concepts from "./data/concepts.json";

export type Concept = {
  slug: string;
  title: string;
  summary: string;
  source: string;
  tags: string[];
};

export function listConcepts(): Concept[] {
  return concepts as Concept[];
}

export function findConcept(slug: string): Concept | undefined {
  return (concepts as Concept[]).find((c) => c.slug === slug);
}
