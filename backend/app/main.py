from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routers import chat, manuals, search, tts, videos


app = FastAPI(title="Easy Manual Mate API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings.ensure_directories()
app.mount("/static/audio", StaticFiles(directory=settings.audio_path), name="audio")

app.include_router(manuals.router, prefix="/api/manuals", tags=["manuals"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(tts.router, prefix="/api/tts", tags=["tts"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
