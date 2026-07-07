from __future__ import annotations

import re
from pathlib import Path

import requests

from app.core.config import settings
from app.models.schemas import ProductInfo
from app.services.manual_search_service import extract_gemini_text, parse_json_array


MODEL_RE = re.compile(r"\b[A-Z]{1,8}\d{2,6}[A-Z0-9-]*\b")
UPLOAD_PREFIX_RE = re.compile(r"^[0-9a-f]{16,}[_-]", re.IGNORECASE)
DOC_CODE_RE = re.compile(r"\b(?:DB|DD|IB|UM|BN|DA)\d{2,}[-A-Z0-9]*\b", re.IGNORECASE)
DATE_RE = re.compile(r"\b\d{6,8}\b")
KNOWN_MAKERS = {
    "iptime": "ipTIME",
    "samsung": "Samsung",
    "lg": "LG",
    "canon": "Canon",
    "epson": "Epson",
    "dyson": "Dyson",
    "xiaomi": "Xiaomi",
    "philips": "Philips",
    "cuckoo": "Cuckoo",
}


def estimate_product_info(text: str, file_name: str) -> ProductInfo:
    if settings.gemini_api_key:
        try:
            return estimate_product_info_with_gemini(text, file_name)
        except Exception:
            if not settings.mock_when_no_api_key:
                raise
    return estimate_product_info_locally(text, file_name)


def estimate_product_info_with_gemini(text: str, file_name: str) -> ProductInfo:
    clean_name = clean_file_stem(file_name)
    prompt = f"""
아래 파일명과 매뉴얼 앞부분 텍스트를 보고 제품 정보를 추정하세요.
매뉴얼 링크 검색에 바로 사용할 수 있도록 제품명/모델명을 최대한 정확히 정리하세요.

[파일명]
{clean_name}

[매뉴얼 앞부분]
{text[:2500]}

규칙:
- 파일명 앞에 붙은 UUID, 난수, 업로드 ID는 제품명에서 제외하세요.
- 버전명, 언어 코드, "manual", "guide", "pilots guide", "사용설명서" 같은 문서 유형 단어는 필요할 때만 product_name에 남기세요.
- manufacturer, product_name, model_name, product_type, confidence를 추정하세요.
- 모르면 빈 문자열을 사용하세요.
- confidence는 high, medium, low 중 하나입니다.
- JSON 배열 안에 객체 1개만 반환하세요.
- markdown 코드블록을 쓰지 마세요.

JSON 형식:
[
  {{
    "manufacturer": "",
    "product_name": "",
    "model_name": "",
    "product_type": "",
    "confidence": "high | medium | low"
  }}
]
""".strip()
    response = requests.post(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        headers={
            "x-goog-api-key": settings.gemini_api_key,
            "Content-Type": "application/json",
        },
        json={
            "model": settings.gemini_model,
            "system_instruction": "당신은 제품 매뉴얼 파일에서 제품 정보를 추출하는 도우미입니다. 반드시 JSON 배열만 반환합니다.",
            "input": prompt,
            "generation_config": {
                "temperature": 0.1,
                "thinking_level": "low",
            },
        },
        timeout=45,
    )
    response.raise_for_status()
    candidates = parse_json_array(extract_gemini_text(response.json()))
    if not candidates:
        return estimate_product_info_locally(text, file_name)
    item = candidates[0]
    return ProductInfo(
        manufacturer=str(item.get("manufacturer", "")).strip(),
        product_name=str(item.get("product_name", "")).strip() or Path(file_name).stem,
        model_name=str(item.get("model_name", "")).strip(),
        product_type=str(item.get("product_type", "")).strip() or "제품 매뉴얼",
        confidence=str(item.get("confidence", "medium")).strip() or "medium",
    )


def estimate_product_info_locally(text: str, file_name: str) -> ProductInfo:
    clean_name = clean_file_stem(file_name)
    preview = f"{clean_name}\n{text[:2500]}"
    lower = preview.lower()
    manufacturer = ""
    for token, label in KNOWN_MAKERS.items():
        if token in lower:
            manufacturer = label
            break
    model_matches = rank_model_candidates(MODEL_RE.findall(preview))
    model_name = model_matches[0] if model_matches else ""
    inferred_manufacturer, product_type = infer_from_model_or_name(model_name, clean_name)
    manufacturer = manufacturer or inferred_manufacturer
    product_name = make_product_name(clean_name, model_name, manufacturer, product_type)
    if model_name and model_name.lower() not in product_name.lower():
        product_name = f"{product_name} {model_name}".strip()
    confidence = "medium" if manufacturer or model_name else "low"
    return ProductInfo(
        manufacturer=manufacturer,
        product_name=product_name,
        model_name=model_name,
        product_type=product_type,
        confidence=confidence,
    )


def clean_file_stem(file_name: str) -> str:
    stem = Path(file_name).stem
    stem = UPLOAD_PREFIX_RE.sub("", stem)
    return stem.replace("_", " ").replace("-", " ").strip()


def rank_model_candidates(candidates: list[str]) -> list[str]:
    unique = []
    for candidate in candidates:
        normalized = candidate.strip().upper()
        if not normalized or normalized in unique:
            continue
        if DOC_CODE_RE.match(normalized) or DATE_RE.match(normalized):
            continue
        unique.append(normalized)
    return sorted(unique, key=lambda value: (score_model(value), len(value)), reverse=True)


def score_model(value: str) -> int:
    score = 0
    if re.search(r"[A-Z]", value):
        score += 2
    if re.search(r"\d", value):
        score += 2
    if re.search(r"[A-Z]\d+[A-Z]", value):
        score += 3
    if value.startswith(("DW", "AF", "WF", "RF", "QN", "UN")):
        score += 2
    return score


def infer_from_model_or_name(model_name: str, clean_name: str) -> tuple[str, str]:
    upper = f"{model_name} {clean_name}".upper()
    if model_name.startswith("DW") or "DISHWASHER" in upper or "식기" in clean_name:
        return "Samsung", "식기세척기"
    if model_name.startswith("AF") or "AIR" in upper or "에어컨" in clean_name:
        return "Samsung", "에어컨"
    if model_name.startswith(("WF", "WW")):
        return "Samsung", "세탁기"
    if model_name.startswith("RF"):
        return "Samsung", "냉장고"
    return "", "제품 매뉴얼"


def make_product_name(clean_name: str, model_name: str, manufacturer: str, product_type: str) -> str:
    if model_name and product_type != "제품 매뉴얼":
        prefix = f"{manufacturer} " if manufacturer else ""
        return f"{prefix}{model_name} {product_type}".strip()

    words = clean_name.split()
    filtered = []
    for word in words:
        upper = word.upper()
        if upper in {"QUICK", "GUIDE", "MANUAL", "USER", "OWNER", "KR", "KO", "EN"}:
            continue
        if DOC_CODE_RE.match(upper) or DATE_RE.match(upper):
            continue
        if re.fullmatch(r"\d{1,4}[A-Z]?", upper):
            continue
        filtered.append(word)
    if model_name and model_name not in [item.upper() for item in filtered]:
        filtered.append(model_name)
    return " ".join(filtered).strip() or clean_name
