from __future__ import annotations

import hashlib
import time
from typing import Iterable

import numpy as np
import requests

from app.core.config import settings


LOCAL_EMBED_DIM = 384


class EmbeddingService:
    def embed(self, texts: list[str]) -> np.ndarray:
        if settings.clova_api_key:
            return self._embed_with_clova(texts)
        if settings.mock_when_no_api_key:
            return self._embed_locally(texts)
        raise RuntimeError("CLOVA_API_KEY가 설정되어 있지 않습니다.")

    def _embed_with_clova(self, texts: list[str]) -> np.ndarray:
        vectors = []
        headers = {
            "Authorization": f"Bearer {settings.clova_api_key}",
            "Content-Type": "application/json",
        }
        for index, text in enumerate(texts, start=1):
            response = self._post_clova_embedding(headers, text, index, len(texts))
            payload = response.json()
            result = payload.get("result", {})
            embedding = result.get("embedding") or payload.get("embedding")
            if not embedding:
                raise RuntimeError("CLOVA Embedding 응답에서 embedding 값을 찾지 못했습니다.")
            vectors.append(embedding)
            if settings.clova_embed_request_interval > 0:
                time.sleep(settings.clova_embed_request_interval)
        return normalize(np.asarray(vectors, dtype="float32"))

    def _post_clova_embedding(
        self,
        headers: dict[str, str],
        text: str,
        index: int,
        total: int,
    ) -> requests.Response:
        last_error: requests.HTTPError | None = None
        for attempt in range(settings.clova_embed_retry_count + 1):
            response = requests.post(
                settings.clova_embed_v2_url,
                headers=headers,
                json={"text": text[:2000]},
                timeout=30,
            )
            if response.status_code != 429:
                response.raise_for_status()
                return response

            last_error = requests.HTTPError(
                f"CLOVA Embedding 요청 제한에 걸렸습니다. ({index}/{total})",
                response=response,
            )
            retry_after = response.headers.get("Retry-After")
            if retry_after and retry_after.isdigit():
                delay = float(retry_after)
            else:
                delay = settings.clova_embed_retry_base_delay * (attempt + 1)
            time.sleep(delay)

        raise RuntimeError(
            "CLOVA Embedding API 요청 제한이 계속 발생했습니다. "
            "잠시 후 다시 업로드하거나 CHUNK_SIZE를 더 크게 설정해 요청 수를 줄여 주세요."
        ) from last_error

    def _embed_locally(self, texts: Iterable[str]) -> np.ndarray:
        vectors = []
        for text in texts:
            vector = np.zeros(LOCAL_EMBED_DIM, dtype="float32")
            for token in tokenize(text):
                digest = hashlib.sha256(token.encode("utf-8")).digest()
                index = int.from_bytes(digest[:4], "little") % LOCAL_EMBED_DIM
                vector[index] += 1.0
            vectors.append(vector)
        return normalize(np.asarray(vectors, dtype="float32"))


def tokenize(text: str) -> list[str]:
    token = ""
    tokens: list[str] = []
    for char in text.lower():
        if char.isalnum() or ("가" <= char <= "힣"):
            token += char
        elif token:
            tokens.append(token)
            token = ""
    if token:
        tokens.append(token)
    return [item for item in tokens if len(item) > 1]


def normalize(vectors: np.ndarray) -> np.ndarray:
    if vectors.size == 0:
        return vectors.astype("float32")
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return (vectors / norms).astype("float32")


embedding_service = EmbeddingService()
