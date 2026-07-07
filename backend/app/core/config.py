from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    clova_api_key: str = ""
    clova_chat_model_id: str = "HCX-005"
    clova_api_base: str = "https://clovastudio.stream.ntruss.com"
    clova_embed_v2_url: str = "https://clovastudio.stream.ntruss.com/v1/api-tools/embedding/v2"

    clova_ocr_api_url: str = ""
    clova_ocr_secret_key: str = ""
    clova_voice_client_id: str = ""
    clova_voice_client_secret: str = ""
    clova_voice_api_url: str = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts"
    clova_voice_speaker: str = "nara"

    youtube_api_key: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"

    chunk_size: int = 1200
    chunk_overlap: int = 120
    top_k: int = 4
    clova_embed_retry_count: int = 8
    clova_embed_retry_base_delay: float = 4.0
    clova_embed_request_interval: float = 0.8
    clova_embed_remote_enabled: bool = False
    clova_embed_fallback_to_local: bool = True
    clova_embed_max_remote_chunks: int = 80
    mock_when_no_api_key: bool = True

    upload_dir: str = "app/data/uploads"
    ocr_image_dir: str = "app/data/ocr_images"
    audio_dir: str = "app/data/audio"
    vector_store_dir: str = "app/data/vector_store"
    sqlite_db_path: str = "app/data/app.db"

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def resolve_path(self, value: str) -> Path:
        path = Path(value)
        return path if path.is_absolute() else BACKEND_DIR / path

    def ensure_directories(self) -> None:
        for directory in [
            self.resolve_path(self.upload_dir),
            self.resolve_path(self.ocr_image_dir),
            self.resolve_path(self.audio_dir),
            self.resolve_path(self.vector_store_dir),
            self.resolve_path(str(Path(self.sqlite_db_path).parent)),
        ]:
            directory.mkdir(parents=True, exist_ok=True)

    @property
    def uploads_path(self) -> Path:
        return self.resolve_path(self.upload_dir)

    @property
    def ocr_images_path(self) -> Path:
        return self.resolve_path(self.ocr_image_dir)

    @property
    def audio_path(self) -> Path:
        return self.resolve_path(self.audio_dir)

    @property
    def vector_store_path(self) -> Path:
        return self.resolve_path(self.vector_store_dir)

    @property
    def db_path(self) -> Path:
        return self.resolve_path(self.sqlite_db_path)


settings = Settings()
