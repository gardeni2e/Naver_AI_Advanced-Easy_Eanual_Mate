from __future__ import annotations

from app.models.schemas import DocChunk


def text_to_chunks(
    text: str,
    manual_id: str,
    source: str,
    source_type: str,
    max_chars: int,
    overlap: int,
) -> list[DocChunk]:
    clean_text = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    chunks: list[DocChunk] = []
    start = 0
    while start < len(clean_text):
        end = min(start + max_chars, len(clean_text))
        chunk_text = clean_text[start:end].strip()
        if chunk_text:
            chunks.append(
                DocChunk(
                    text=chunk_text,
                    source=source,
                    page=None,
                    manual_id=manual_id,
                    source_type=source_type,
                )
            )
        if end >= len(clean_text):
            break
        start = max(end - overlap, start + 1)
    return chunks
