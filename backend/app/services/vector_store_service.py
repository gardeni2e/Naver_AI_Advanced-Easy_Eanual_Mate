from __future__ import annotations

import json
import shutil
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np

from app.core.config import settings
from app.models.schemas import DocChunk, SourceChunk

try:
    import faiss
except ImportError:  # pragma: no cover - local fallback for machines without faiss.
    faiss = None


@dataclass
class RAGIndex:
    embeddings: np.ndarray
    chunks: list[DocChunk]
    faiss_index: object | None = None

    @property
    def dim(self) -> int:
        return int(self.embeddings.shape[1])


class VectorStoreService:
    def manual_dir(self, manual_id: str) -> Path:
        return settings.vector_store_path / manual_id

    def save(self, manual_id: str, embeddings: np.ndarray, chunks: list[DocChunk]) -> None:
        target = self.manual_dir(manual_id)
        target.mkdir(parents=True, exist_ok=True)
        np.save(target / "embeddings.npy", embeddings)
        (target / "chunks.json").write_text(
            json.dumps([asdict(chunk) for chunk in chunks], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        if faiss is not None and embeddings.size:
            index = faiss.IndexFlatIP(embeddings.shape[1])
            index.add(embeddings)
            try:
                faiss.write_index(index, str(target / "index.faiss"))
            except Exception:
                # FAISS Windows wheels can fail to write paths containing non-ASCII
                # characters. The app can still search from embeddings.npy.
                pass

    def load(self, manual_id: str) -> RAGIndex:
        target = self.manual_dir(manual_id)
        if not target.exists():
            raise FileNotFoundError(f"manual_id를 찾을 수 없습니다: {manual_id}")
        embeddings = np.load(target / "embeddings.npy")
        raw_chunks = json.loads((target / "chunks.json").read_text(encoding="utf-8"))
        chunks = [DocChunk(**item) for item in raw_chunks]
        index = None
        if faiss is not None and (target / "index.faiss").exists():
            index = faiss.read_index(str(target / "index.faiss"))
        return RAGIndex(embeddings=embeddings, chunks=chunks, faiss_index=index)

    def delete(self, manual_id: str) -> None:
        target = self.manual_dir(manual_id)
        if target.exists():
            shutil.rmtree(target)

    def search(self, rag_index: RAGIndex, query_embedding: np.ndarray, top_k: int) -> list[SourceChunk]:
        if query_embedding.ndim == 1:
            query_embedding = query_embedding.reshape(1, -1)
        if rag_index.faiss_index is not None:
            scores, indexes = rag_index.faiss_index.search(query_embedding.astype("float32"), top_k)
            pairs = zip(indexes[0].tolist(), scores[0].tolist())
        else:
            scores = rag_index.embeddings @ query_embedding[0]
            top_indexes = np.argsort(scores)[::-1][:top_k]
            pairs = [(int(index), float(scores[index])) for index in top_indexes]
        sources: list[SourceChunk] = []
        for index, score in pairs:
            if index < 0 or index >= len(rag_index.chunks):
                continue
            chunk = rag_index.chunks[index]
            sources.append(
                SourceChunk(
                    source=chunk.source,
                    page=chunk.page,
                    score=round(float(score), 4),
                    text=chunk.text,
                    source_type=chunk.source_type,
                )
            )
        return sources


vector_store_service = VectorStoreService()
