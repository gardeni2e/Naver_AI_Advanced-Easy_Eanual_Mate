from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


AnswerMode = Literal["basic", "easy", "step_by_step"]
SourceType = Literal["PDF", "OCR"]


@dataclass
class DocChunk:
    text: str
    source: str
    page: int | None = None
    manual_id: str | None = None
    source_type: str = "PDF"


class ProductInfo(BaseModel):
    manufacturer: str = ""
    product_name: str = ""
    model_name: str = ""
    product_type: str = ""
    confidence: str = "low"


class SourceChunk(BaseModel):
    source: str
    page: int | None = None
    score: float
    text: str
    source_type: SourceType = "PDF"


class ManualUploadResponse(BaseModel):
    manual_id: str
    source_type: SourceType
    file_name: str
    estimated_product: ProductInfo
    chunk_count: int
    preview: str


class OcrUploadResponse(BaseModel):
    manual_id: str
    source_type: Literal["OCR"] = "OCR"
    ocr_text: str
    chunk_count: int
    preview: str


class ChatRequest(BaseModel):
    manual_id: str
    question: str
    answer_mode: AnswerMode = "easy"
    top_k: int = 4


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]


class TtsRequest(BaseModel):
    text: str


class TtsResponse(BaseModel):
    audio_url: str
    message: str = ""


class ManualListItem(BaseModel):
    manual_id: str
    source_type: SourceType
    file_name: str
    chunk_count: int
    created_at: datetime
    estimated_product: ProductInfo | None = None


class ManualListResponse(BaseModel):
    manuals: list[ManualListItem]


class LinkCandidate(BaseModel):
    title: str
    url: str
    source: str = "candidate"
    reason: str = ""


class ManualSearchResponse(BaseModel):
    product: str
    manual_candidates: list[LinkCandidate]


class VideoCandidate(BaseModel):
    title: str
    url: str
    thumbnail_url: str = ""
    channel: str = ""


class VideoSearchResponse(BaseModel):
    videos: list[VideoCandidate]
