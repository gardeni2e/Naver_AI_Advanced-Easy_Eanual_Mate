import { apiClient } from "./client";
import type { ManualSearchResponse, VideoSearchResponse } from "../types/api";

export async function searchManuals(product: string) {
  const { data } = await apiClient.get<ManualSearchResponse>("/api/search/manuals", {
    params: { product }
  });
  return data.manual_candidates;
}

export async function searchVideos(product: string) {
  const { data } = await apiClient.get<VideoSearchResponse>("/api/videos", {
    params: { product }
  });
  return data.videos;
}
