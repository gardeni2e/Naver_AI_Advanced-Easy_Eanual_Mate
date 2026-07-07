import { apiClient } from "./client";
import type { ManualListResponse, ManualUploadResponse, OcrUploadResponse } from "../types/api";

export async function uploadPdfManual(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<ManualUploadResponse>("/api/manuals/pdf", formData);
  return data;
}

export async function uploadOcrManual(file: File, correctedText: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (correctedText.trim()) {
    formData.append("corrected_text", correctedText.trim());
  }
  const { data } = await apiClient.post<OcrUploadResponse>("/api/manuals/ocr", formData);
  return data;
}

export async function fetchManuals() {
  const { data } = await apiClient.get<ManualListResponse>("/api/manuals");
  return data.manuals;
}

export async function deleteManual(manualId: string) {
  const { data } = await apiClient.delete<{ manual_id: string; message: string }>(`/api/manuals/${manualId}`);
  return data;
}
