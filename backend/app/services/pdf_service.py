from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader

from app.models.schemas import DocChunk


def extract_pdf_text(pdf_path: Path) -> tuple[str, list[tuple[int, str]]]:
    pages = extract_with_pypdf(pdf_path)
    full_text = "\n\n".join(f"[page {page}]\n{text}" for page, text in pages)
    if is_garbled_text(full_text):
        fallback_pages = extract_with_pymupdf(pdf_path)
        fallback_text = "\n\n".join(f"[page {page}]\n{text}" for page, text in fallback_pages)
        if fallback_pages and not is_garbled_text(fallback_text):
            return fallback_text, fallback_pages
        raise ValueError(
            "PDF 텍스트를 추출했지만 글자가 깨져 있습니다. "
            "이 PDF는 글꼴/인코딩 때문에 일반 텍스트 추출이 어렵습니다. "
            "사진 OCR 등록 기능을 사용하거나 OCR 기반 PDF 처리가 필요합니다."
        )
    return full_text, pages


def extract_with_pypdf(pdf_path: Path) -> list[tuple[int, str]]:
    reader = PdfReader(str(pdf_path))
    pages: list[tuple[int, str]] = []
    for page_index, page in enumerate(reader.pages, start=1):
        page_text = (page.extract_text() or "").strip()
        if page_text:
            pages.append((page_index, page_text))
    return pages


def extract_with_pymupdf(pdf_path: Path) -> list[tuple[int, str]]:
    try:
        import fitz
    except ImportError:
        return []
    pages: list[tuple[int, str]] = []
    with fitz.open(str(pdf_path)) as document:
        for page_index, page in enumerate(document, start=1):
            page_text = page.get_text("text").strip()
            if page_text:
                pages.append((page_index, page_text))
    return pages


def is_garbled_text(text: str) -> bool:
    sample = text[:5000]
    if len(sample) < 120:
        return False
    meaningful = sum(1 for char in sample if char.isalnum() or ("가" <= char <= "힣"))
    suspicious = sum(
        1
        for char in sample
        if char in {"�", "\x00", "\x03"}
        or 0x2190 <= ord(char) <= 0x2BFF
        or 0x0E00 <= ord(char) <= 0x0FFF
        or 0x1800 <= ord(char) <= 0x18AF
    )
    korean = sum(1 for char in sample if "가" <= char <= "힣")
    return suspicious / max(len(sample), 1) > 0.08 or (korean == 0 and suspicious / max(meaningful, 1) > 0.25)


def pages_to_chunks(
    pages: list[tuple[int, str]],
    manual_id: str,
    source: str,
    source_type: str,
    max_chars: int,
    overlap: int,
) -> list[DocChunk]:
    chunks: list[DocChunk] = []
    for page, text in pages:
        clean_text = "\n".join(line.strip() for line in text.splitlines() if line.strip())
        start = 0
        while start < len(clean_text):
            end = min(start + max_chars, len(clean_text))
            chunk_text = clean_text[start:end].strip()
            if chunk_text:
                chunks.append(
                    DocChunk(
                        text=chunk_text,
                        source=f"{source}_page{page}",
                        page=page,
                        manual_id=manual_id,
                        source_type=source_type,
                    )
                )
            if end >= len(clean_text):
                break
            start = max(end - overlap, start + 1)
    return chunks
