import axios from "axios";

export type FeedbackPayload = {
  conceptSlug: string;
  rating: number;
  comment?: string;
};

export async function postFeedback(payload: FeedbackPayload) {
  const { data } = await axios.post("/api/feedback", payload);
  return data;
}
