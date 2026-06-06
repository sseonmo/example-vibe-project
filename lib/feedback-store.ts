export type FeedbackEntry = {
  id: string;
  conceptSlug: string;
  rating: number;
  comment?: string;
  savedAt: string;
};

export type FeedbackInput = {
  conceptSlug: string;
  rating: number;
  comment?: string;
};

// 모듈 레벨 in-memory 저장소 — 재시작 시 소실 OK (IDEAS #3 명시 허용)
const entries: FeedbackEntry[] = [];

export function saveFeedback(input: FeedbackInput): FeedbackEntry {
  const entry: FeedbackEntry = {
    id: crypto.randomUUID(),
    conceptSlug: input.conceptSlug,
    rating: input.rating,
    comment: input.comment,
    savedAt: new Date().toISOString(),
  };
  entries.push(entry);
  return entry;
}

export function listFeedback(): FeedbackEntry[] {
  return entries;
}

export function clearFeedback(): void {
  entries.length = 0;
}
