from __future__ import annotations

import json
import re
from urllib.parse import quote_plus

import requests

from app.core.config import settings
from app.models.schemas import LinkCandidate


def search_manual_candidates(product: str) -> list[LinkCandidate]:
    if settings.gemini_api_key:
        try:
            candidates = search_manual_candidates_with_gemini(product)
            if candidates:
                return candidates
        except Exception as exc:
            if not settings.mock_when_no_api_key:
                raise
            return fallback_manual_candidates(product, error_message=str(exc))
    return fallback_manual_candidates(product)


def search_manual_candidates_with_gemini(product: str) -> list[LinkCandidate]:
    prompt = f"""
제품명 또는 모델명: {product}

이 제품의 공식 매뉴얼, 제조사 고객지원, 사용설명서 PDF 후보 링크를 찾아야 합니다.
Google Search Grounding이나 별도 검색 도구는 사용하지 않습니다.
모델이 알고 있는 범위에서 가장 그럴듯한 공식 후보만 반환하세요.

중요:
- 제조사 공식 사이트, 공식 고객지원, 공식 PDF로 보이는 후보를 우선하세요.
- 확실하지 않은 링크는 reason에 "확인 필요"라고 표시하세요.
- 응답은 JSON 배열만 반환하세요.
- markdown 코드블록을 쓰지 마세요.

JSON 형식:
[
  {{
    "title": "후보 제목",
    "url": "https://...",
    "source": "official | support | pdf | candidate",
    "reason": "이 링크를 후보로 고른 이유"
  }}
]
""".strip()
    payload = {
        "model": settings.gemini_model,
        "system_instruction": "당신은 제품 공식 매뉴얼 링크 후보를 정리하는 도우미입니다. 답변은 반드시 JSON 배열만 반환합니다.",
        "input": prompt,
        "generation_config": {
            "temperature": 0.2,
            "thinking_level": "low",
        },
    }
    response = requests.post(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        headers={
            "x-goog-api-key": settings.gemini_api_key,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=45,
    )
    response.raise_for_status()
    text = extract_gemini_text(response.json())
    raw_candidates = parse_json_array(text)
    candidates: list[LinkCandidate] = []
    for item in raw_candidates[:5]:
        url = str(item.get("url", "")).strip()
        title = str(item.get("title", "")).strip() or f"{product} 매뉴얼 후보"
        if not url.startswith("http"):
            continue
        candidates.append(
            LinkCandidate(
                title=title,
                url=url,
                source=str(item.get("source", "candidate")).strip() or "candidate",
                reason=str(item.get("reason", "Gemini가 추천한 매뉴얼 후보입니다.")).strip(),
            )
        )
    return candidates


def extract_gemini_text(payload: dict) -> str:
    if isinstance(payload.get("output_text"), str):
        return payload["output_text"]
    texts: list[str] = []
    for step in payload.get("steps", []):
        if step.get("type") != "model_output":
            continue
        for block in step.get("content", []):
            if block.get("type") == "text" and block.get("text"):
                texts.append(block["text"])
    if texts:
        return "\n".join(texts)
    # Older generateContent-style responses are tolerated for easier future migration.
    for candidate in payload.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if part.get("text"):
                texts.append(part["text"])
    return "\n".join(texts)


def parse_json_array(text: str) -> list[dict]:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    if not cleaned.startswith("["):
        match = re.search(r"\[[\s\S]*\]", cleaned)
        cleaned = match.group(0) if match else "[]"
    parsed = json.loads(cleaned)
    return parsed if isinstance(parsed, list) else []


def fallback_manual_candidates(product: str, error_message: str = "") -> list[LinkCandidate]:
    encoded_pdf = quote_plus(f"{product} 공식 매뉴얼 PDF")
    encoded_support = quote_plus(f"{product} 고객지원 설명서")
    if settings.gemini_api_key:
        title = "Gemini 응답을 받지 못해 임시 검색 링크를 표시합니다"
        reason = "GEMINI_API_KEY는 감지되었지만 Gemini 요청이 실패했습니다. 백엔드 로그와 네트워크/API 모델 설정을 확인해 주세요."
        if error_message:
            reason = f"{reason} 오류: {error_message[:180]}"
    else:
        title = "Gemini API 키가 없어 임시 검색 링크를 표시합니다"
        reason = "GEMINI_API_KEY를 설정하면 Gemini가 제품명 기반 매뉴얼 후보 링크를 반환합니다."
    return [
        LinkCandidate(
            title=title,
            url=f"https://www.google.com/search?q={encoded_pdf}",
            source="fallback",
            reason=reason,
        ),
        LinkCandidate(
            title=f"{product} 고객지원 페이지 검색",
            url=f"https://www.google.com/search?q={encoded_support}",
            source="fallback",
            reason="공식 매뉴얼 후보를 직접 확인할 수 있는 임시 검색 링크입니다.",
        ),
    ]
