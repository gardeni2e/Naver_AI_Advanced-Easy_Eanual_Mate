from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.models.schemas import ManualListResponse, ManualUploadResponse, OcrUploadResponse
from app.services.metadata_service import metadata_service
from app.services.ocr_service import extract_text_with_clova, save_ocr_image
from app.services.rag_service import delete_manual, ingest_ocr_text, ingest_pdf_upload


router = APIRouter()


@router.post("/pdf", response_model=ManualUploadResponse)
async def upload_pdf_manual(file: UploadFile = File(...)) -> ManualUploadResponse:
    try:
        return await ingest_pdf_upload(file)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/ocr", response_model=OcrUploadResponse)
async def upload_ocr_manual(
    file: UploadFile = File(...),
    corrected_text: str | None = Form(default=None),
) -> OcrUploadResponse:
    try:
        image_path = await save_ocr_image(file)
        ocr_text = (corrected_text or "").strip() or extract_text_with_clova(image_path)
        if not ocr_text:
            raise ValueError("OCR 결과가 비어 있습니다. CLOVA OCR 키를 설정하거나 corrected_text를 함께 보내 주세요.")
        return await ingest_ocr_text(image_path.name, ocr_text)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=ManualListResponse)
def list_manuals() -> ManualListResponse:
    return ManualListResponse(manuals=metadata_service.list_manuals())


@router.delete("/{manual_id}")
def remove_manual(manual_id: str) -> dict[str, str]:
    try:
        return delete_manual(manual_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
