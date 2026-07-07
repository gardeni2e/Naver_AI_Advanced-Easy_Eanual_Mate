from __future__ import annotations

import math
import uuid
import wave
from pathlib import Path

import requests

from app.core.config import settings


class ClovaVoiceService:
    def create_audio(self, text: str) -> tuple[str, str]:
        if not text.strip():
            raise ValueError("음성으로 읽을 답변이 없습니다.")
        settings.audio_path.mkdir(parents=True, exist_ok=True)
        if settings.clova_voice_client_id and settings.clova_voice_client_secret:
            return self._create_with_clova(text)
        return self._create_demo_audio()

    def _create_with_clova(self, text: str) -> tuple[str, str]:
        file_name = f"tts_{uuid.uuid4().hex[:8]}.mp3"
        path = settings.audio_path / file_name
        response = requests.post(
            settings.clova_voice_api_url,
            headers={
                "X-NCP-APIGW-API-KEY-ID": settings.clova_voice_client_id,
                "X-NCP-APIGW-API-KEY": settings.clova_voice_client_secret,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "speaker": settings.clova_voice_speaker,
                "text": self._prepare_text(text),
                "format": "mp3",
                "volume": "0",
                "speed": "0",
                "pitch": "0",
            },
            timeout=45,
        )
        content_type = response.headers.get("Content-Type", "")
        if response.status_code >= 400:
            raise RuntimeError(f"CLOVA Voice 호출에 실패했습니다. ({response.status_code}) {response.text[:200]}")
        if "audio" not in content_type and not response.content.startswith(b"ID3"):
            raise RuntimeError(f"CLOVA Voice가 오디오가 아닌 응답을 반환했습니다: {response.text[:200]}")
        path.write_bytes(response.content)
        return f"/static/audio/{file_name}", "CLOVA Voice 음성을 생성했습니다."

    def _create_demo_audio(self) -> tuple[str, str]:
        file_name = f"tts_{uuid.uuid4().hex[:8]}.wav"
        path = settings.audio_path / file_name
        self._write_demo_tone(path)
        return f"/static/audio/{file_name}", "CLOVA Voice 키가 없어서 데모 안내음을 생성했습니다."

    def _prepare_text(self, text: str) -> str:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        prepared = " ".join(lines)
        return prepared[:900]

    def _write_demo_tone(self, path: Path, seconds: float = 0.8, sample_rate: int = 22050) -> None:
        frames = int(seconds * sample_rate)
        with wave.open(str(path), "w") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(sample_rate)
            for index in range(frames):
                value = int(11000 * math.sin(2 * math.pi * 660 * index / sample_rate))
                wav.writeframesraw(value.to_bytes(2, byteorder="little", signed=True))


clova_voice_service = ClovaVoiceService()
