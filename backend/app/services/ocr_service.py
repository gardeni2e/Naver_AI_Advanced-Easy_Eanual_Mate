from __future__ import annotations

import json
import shutil
import time
import uuid
from pathlib import Path

from fastapi import UploadFile
import requests

from app.core.config import settings


async def save_ocr_image(file: UploadFile) -> Path:
    settings.ocr_images_path.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename or "ocr_image.jpg").name
    target = settings.ocr_images_path / f"{uuid.uuid4().hex}_{safe_name}"
    with target.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return target


def extract_text_with_clova(image_path: Path) -> str:
    if not settings.clova_ocr_api_url or not settings.clova_ocr_secret_key:
        if settings.mock_when_no_api_key:
            return ""
        raise RuntimeError("CLOVA OCR 환경 변수가 설정되어 있지 않습니다.")
    request_json = {
        "version": "V2",
        "requestId": str(uuid.uuid4()),
        "timestamp": int(time.time() * 1000),
        "images": [{"format": image_path.suffix.lstrip(".") or "jpg", "name": image_path.stem}],
    }
    response = requests.post(
        settings.clova_ocr_api_url,
        headers={"X-OCR-SECRET": settings.clova_ocr_secret_key},
        data={"message": json.dumps(request_json).encode("utf-8")},
        files={"file": (image_path.name, image_path.read_bytes(), f"image/{request_json['images'][0]['format']}")},
        timeout=45,
    )
    if response.status_code == 404:
        raise RuntimeError(
            "CLOVA OCR 호출 URL을 찾을 수 없습니다. "
            "Naver Cloud OCR 콘솔의 Invoke URL을 다시 복사해 CLOVA_OCR_API_URL에 넣어 주세요. "
            "일반 OCR 도메인은 보통 /general 로 끝나는 URL을 사용합니다."
        )
    if response.status_code in {401, 403}:
        raise RuntimeError(
            "CLOVA OCR 인증에 실패했습니다. CLOVA_OCR_SECRET_KEY가 현재 OCR 도메인의 Secret Key인지 확인해 주세요."
        )
    response.raise_for_status()
    payload = response.json()
    fields = payload.get("images", [{}])[0].get("fields", [])
    return order_ocr_fields(fields)


def order_ocr_fields(fields: list[dict]) -> str:
    items = []
    for field in fields:
        text = (field.get("inferText") or "").strip()
        vertices = field.get("boundingPoly", {}).get("vertices", [])
        if not text or not vertices:
            continue
        xs = [float(vertex.get("x", 0)) for vertex in vertices]
        ys = [float(vertex.get("y", 0)) for vertex in vertices]
        items.append(
            {
                "text": text,
                "x": min(xs),
                "y": min(ys),
                "height": max(ys) - min(ys),
            }
        )

    if not items:
        return "\n".join((field.get("inferText") or "").strip() for field in fields if field.get("inferText")).strip()

    median_height = sorted(item["height"] for item in items)[len(items) // 2] or 18
    row_threshold = max(median_height * 0.7, 12)
    rows: list[list[dict]] = []
    for item in sorted(items, key=lambda value: (value["y"], value["x"])):
        if not rows:
            rows.append([item])
            continue
        row_y = sum(row_item["y"] for row_item in rows[-1]) / len(rows[-1])
        if abs(item["y"] - row_y) <= row_threshold:
            rows[-1].append(item)
        else:
            rows.append([item])

    lines = []
    for row in rows:
        ordered = sorted(row, key=lambda value: value["x"])
        lines.append(" ".join(item["text"] for item in ordered))
    return "\n".join(lines).strip()
