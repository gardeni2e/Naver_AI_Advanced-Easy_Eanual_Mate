import { apiClient } from "./client";
import type { AnswerMode, ChatResponse } from "../types/api";

export async function askManual(manualId: string, question: string, answerMode: AnswerMode) {
  const { data } = await apiClient.post<ChatResponse>("/api/chat", {
    manual_id: manualId,
    question,
    answer_mode: answerMode,
    top_k: 4
  });
  return data;
}
