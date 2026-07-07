export type AnswerMode = "basic" | "easy" | "step_by_step";
export type FontSizeMode = "normal" | "large" | "xlarge";

export interface ProductInfo {
  manufacturer: string;
  product_name: string;
  model_name: string;
  product_type: string;
  confidence: string;
}

export interface ManualUploadResponse {
  manual_id: string;
  source_type: "PDF";
  file_name: string;
  estimated_product: ProductInfo;
  chunk_count: number;
  preview: string;
}

export interface OcrUploadResponse {
  manual_id: string;
  source_type: "OCR";
  ocr_text: string;
  chunk_count: number;
  preview: string;
}

export interface ManualListItem {
  manual_id: string;
  source_type: "PDF" | "OCR";
  file_name: string;
  chunk_count: number;
  created_at: string;
  estimated_product?: ProductInfo | null;
}

export interface ManualListResponse {
  manuals: ManualListItem[];
}

export interface SourceChunk {
  source: string;
  page: number | null;
  score: number;
  text: string;
}

export interface ChatResponse {
  answer: string;
  sources: SourceChunk[];
}

export interface LinkCandidate {
  title: string;
  url: string;
  source: string;
  reason: string;
}

export interface ManualSearchResponse {
  product: string;
  manual_candidates: LinkCandidate[];
}

export interface VideoCandidate {
  title: string;
  url: string;
  thumbnail_url: string;
  channel: string;
}

export interface VideoSearchResponse {
  videos: VideoCandidate[];
}

export interface TtsResponse {
  audio_url: string;
  message: string;
}
