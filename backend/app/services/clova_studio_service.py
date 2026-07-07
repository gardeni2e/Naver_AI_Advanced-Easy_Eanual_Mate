from __future__ import annotations

import uuid

import requests

from app.core.config import settings
from app.core.prompts import BASIC_SYSTEM_PROMPT, EASY_MODE_PROMPT, RISK_KEYWORDS, STEP_MODE_PROMPT
from app.models.schemas import AnswerMode, SourceChunk


class ClovaStudioService:
    def answer(self, question: str, sources: list[SourceChunk], mode: AnswerMode, source_type: str = "PDF") -> str:
        context = self._build_context(sources)
        if not context:
            return "제공된 매뉴얼에서 확인할 수 없습니다."
        if settings.clova_api_key:
            return self._answer_with_clova(question, context, mode, source_type)
        if settings.mock_when_no_api_key:
            return self._answer_locally(question, sources, mode)
        raise RuntimeError("CLOVA_API_KEY가 설정되어 있지 않습니다.")

    def _answer_with_clova(self, question: str, context: str, mode: AnswerMode, source_type: str) -> str:
        mode_prompt = {"easy": EASY_MODE_PROMPT, "step_by_step": STEP_MODE_PROMPT}.get(mode, "")
        ocr_prompt = ""
        if source_type == "OCR":
            ocr_prompt = """
현재 컨텍스트는 종이 매뉴얼 사진 1장을 OCR로 읽은 텍스트입니다.
OCR 텍스트에 적힌 순서와 문장만 근거로 답변하세요.
사진에 없는 일반 보안 조언, 추측, 추가 기능 설명은 절대 넣지 마세요.
OCR이 불완전해 보이면 "사진에서 확인되는 내용 기준"이라고 말하고, 확인되는 단계만 답하세요.
답변은 3~5문장 또는 짧은 번호 목록으로 제한하세요.
"""
        messages = [
            {"role": "system", "content": f"{BASIC_SYSTEM_PROMPT}\n{mode_prompt}\n{ocr_prompt}".strip()},
            {
                "role": "user",
                "content": (
                    f"[컨텍스트]\n{context}\n\n"
                    f"[질문]\n{question}\n\n"
                    "[답변 언어]\n"
                    "반드시 한국어로 답변하세요. 영어 매뉴얼 내용은 한국어로 풀어서 설명하세요."
                ),
            },
        ]
        response = requests.post(
            f"{settings.clova_api_base}/v3/chat-completions/{settings.clova_chat_model_id}",
            headers={
                "Authorization": f"Bearer {settings.clova_api_key}",
                "X-NCP-CLOVASTUDIO-REQUEST-ID": str(uuid.uuid4()),
                "Content-Type": "application/json",
            },
            json={
                "messages": messages,
                "temperature": 0.2,
                "topP": 0.8,
                "maxTokens": 360 if source_type == "OCR" else 700,
            },
            timeout=45,
        )
        response.raise_for_status()
        payload = response.json()
        result = payload.get("result", {})
        message = result.get("message", {})
        content = message.get("content") or result.get("text") or ""
        return content.strip() or "제공된 매뉴얼에서 확인할 수 없습니다."

    def _answer_locally(self, question: str, sources: list[SourceChunk], mode: AnswerMode) -> str:
        text = sources[0].text.strip()
        if mode == "step_by_step":
            answer = (
                "1. 매뉴얼에서 질문과 가장 가까운 문단을 찾았습니다.\n"
                f"2. 관련 원문은 다음과 같습니다: {text[:450]}\n"
                "3. 실제 답변은 CLOVA API 키를 설정하면 한국어로 번역해 생성됩니다.\n"
                "4. 실제 제품 상태를 확인한 뒤 한 단계씩 진행하세요."
            )
        elif mode == "easy":
            answer = (
                "쉽게 말하면, 매뉴얼은 아래 내용을 확인하라고 안내합니다.\n\n"
                f"{text[:650]}\n\n"
                "CLOVA API 키를 설정하면 영어 매뉴얼도 한국어로 풀어서 답변합니다."
            )
        else:
            answer = f"매뉴얼에서 확인한 관련 내용입니다.\n\n{text[:850]}"
        if self._needs_safety_notice(question + "\n" + answer):
            answer += "\n\n주의: 초기화, 전원, 수리처럼 되돌리기 어렵거나 안전과 관련된 작업은 제품 상태를 확인한 뒤 진행하세요."
        return answer

    def _build_context(self, sources: list[SourceChunk]) -> str:
        return "\n\n".join(f"[{item.source}]\n{item.text}" for item in sources)

    def _needs_safety_notice(self, text: str) -> bool:
        return any(keyword in text for keyword in RISK_KEYWORDS)


clova_studio_service = ClovaStudioService()
