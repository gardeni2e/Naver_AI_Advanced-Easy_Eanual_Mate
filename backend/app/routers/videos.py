from __future__ import annotations

from fastapi import APIRouter, Query

from app.models.schemas import VideoSearchResponse
from app.services.video_search_service import search_video_candidates


router = APIRouter()


@router.get("", response_model=VideoSearchResponse)
def search_videos(product: str = Query(..., min_length=1)) -> VideoSearchResponse:
    return VideoSearchResponse(videos=search_video_candidates(product))
