from __future__ import annotations

from fastapi import APIRouter, Query

from app.models.schemas import ManualSearchResponse
from app.services.manual_search_service import search_manual_candidates


router = APIRouter()


@router.get("/manuals", response_model=ManualSearchResponse)
def search_manuals(product: str = Query(..., min_length=1)) -> ManualSearchResponse:
    return ManualSearchResponse(product=product, manual_candidates=search_manual_candidates(product))
