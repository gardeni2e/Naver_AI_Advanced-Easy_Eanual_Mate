from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import TtsRequest, TtsResponse
from app.services.clova_voice_service import clova_voice_service


router = APIRouter()


@router.post("", response_model=TtsResponse)
def create_tts(request: TtsRequest) -> TtsResponse:
    try:
        audio_url, message = clova_voice_service.create_audio(request.text)
        return TtsResponse(audio_url=audio_url, message=message)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
