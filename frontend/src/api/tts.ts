import { apiClient } from "./client";
import type { TtsResponse } from "../types/api";

export async function createTts(text: string) {
  const { data } = await apiClient.post<TtsResponse>("/api/tts", { text });
  return data;
}
