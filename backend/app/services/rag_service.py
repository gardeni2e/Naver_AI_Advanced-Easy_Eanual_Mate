from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.models.schemas import ChatResponse, ManualUploadResponse, OcrUploadResponse, ProductInfo
from app.services.chunk_service import text_to_chunks
from app.services.clova_studio_service import clova_studio_service
from app.services.embedding_service import embedding_service
from app.services.metadata_service import metadata_service
from app.services.pdf_service import extract_pdf_text, pages_to_chunks
from app.services.product_info_service import estimate_product_info
from app.services.vector_store_service import vector_store_service


def make_manual_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


async def save_upload(file: UploadFile, directory: Path) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename or "upload.bin").name
    target = directory / f"{uuid.uuid4().hex}_{safe_name}"
    with target.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return target


async def ingest_pdf_upload(file: UploadFile) -> ManualUploadResponse:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise ValueError("PDF 파일만 업로드할 수 있습니다.")
    manual_id = make_manual_id("manual")
    pdf_path = await save_upload(file, settings.uploads_path)
    full_text, pages = extract_pdf_text(pdf_path)
    if not pages:
        raise ValueError("PDF에서 텍스트를 추출할 수 없습니다. 스캔본 PDF일 가능성이 있습니다. 사진 OCR 등록 기능을 사용해 주세요.")
    chunks = pages_to_chunks(
        pages=pages,
        manual_id=manual_id,
        source=pdf_path.name,
        source_type="PDF",
        max_chars=settings.chunk_size,
        overlap=settings.chunk_overlap,
    )
    embeddings = embedding_service.embed([chunk.text for chunk in chunks])
    vector_store_service.save(manual_id, embeddings, chunks)
    product = estimate_product_info(full_text, file.filename or pdf_path.name)
    metadata_service.upsert_manual(manual_id, "PDF", pdf_path.name, product, len(chunks))
    return ManualUploadResponse(
        manual_id=manual_id,
        source_type="PDF",
        file_name=pdf_path.name,
        estimated_product=product,
        chunk_count=len(chunks),
        preview=full_text[:1200],
    )


async def ingest_ocr_text(file_name: str, ocr_text: str) -> OcrUploadResponse:
    manual_id = make_manual_id("ocr")
    chunks = text_to_chunks(
        text=ocr_text,
        manual_id=manual_id,
        source=file_name,
        source_type="OCR",
        max_chars=max(len(ocr_text), settings.chunk_size),
        overlap=0,
    )
    embeddings = embedding_service.embed([chunk.text for chunk in chunks])
    vector_store_service.save(manual_id, embeddings, chunks)
    metadata_service.upsert_manual(manual_id, "OCR", file_name, ProductInfo(product_name=file_name), len(chunks))
    return OcrUploadResponse(
        manual_id=manual_id,
        ocr_text=ocr_text,
        chunk_count=len(chunks),
        preview=ocr_text[:1200],
    )


def answer_question(manual_id: str, question: str, answer_mode: str, top_k: int) -> ChatResponse:
    rag_index = vector_store_service.load(manual_id)
    query_embedding = embedding_service.embed([question])
    sources = vector_store_service.search(rag_index, query_embedding, top_k)
    source_type = sources[0].source_type if sources else "PDF"
    answer = clova_studio_service.answer(question, sources, answer_mode, source_type=source_type)
    return ChatResponse(answer=answer, sources=sources)


def delete_manual(manual_id: str) -> dict[str, str]:
    manual = metadata_service.get_manual(manual_id)
    if manual is None:
        raise FileNotFoundError(f"등록된 매뉴얼을 찾을 수 없습니다: {manual_id}")

    vector_store_service.delete(manual_id)
    metadata_service.delete_manual(manual_id)

    storage_dir = settings.uploads_path if manual.source_type == "PDF" else settings.ocr_images_path
    stored_file = storage_dir / manual.file_name
    if stored_file.exists():
        stored_file.unlink()

    return {
        "manual_id": manual_id,
        "message": "매뉴얼과 검색 데이터가 삭제되었습니다.",
    }
