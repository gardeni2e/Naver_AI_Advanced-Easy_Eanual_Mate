from __future__ import annotations

import re
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
            answer = self._answer_with_clova(question, context, mode, source_type)
            return self._ensure_easy_glossary(answer, context, mode)
        if settings.mock_when_no_api_key:
            answer = self._answer_locally(question, sources, mode)
            return self._ensure_easy_glossary(answer, context, mode)
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

    def _ensure_easy_glossary(self, answer: str, context: str, mode: AnswerMode) -> str:
        if mode != "easy" or "어려운 용어 쉽게 풀기" in answer:
            return answer
        glossary = build_easy_glossary(answer, context)
        if not glossary:
            return answer
        lines = ["", "💡 어려운 용어 쉽게 풀기"]
        lines.extend(f"- {term}: {description}" for term, description in glossary)
        return f"{answer.rstrip()}\n\n" + "\n".join(lines)


TERM_EXPLANATIONS = {
    "린스": "그릇이 더 잘 마르고 물자국이 덜 남도록 도와주는 보조제입니다.",
    "전용 린스": "식기세척기에 맞게 만든 헹굼 보조제로, 일반 세제와는 다릅니다.",
    "FILL": "액체를 어디까지 채워야 하는지 알려주는 기준 표시입니다.",
    "FILL 표시": "린스나 세제를 정해진 양까지 넣었는지 확인하는 기준선입니다.",
    "표시부": "제품 상태나 알림이 화면이나 불빛으로 나타나는 부분입니다.",
    "전원 표시부": "전원이 켜져 있는지와 필요한 알림을 보여주는 부분입니다.",
    "보충": "부족한 것을 다시 채워 넣는다는 뜻입니다.",
    "투입량": "제품 안에 넣는 린스나 세제의 양입니다.",
    "조절": "필요에 맞게 양이나 세기를 바꾸는 것입니다.",
    "사용설명서": "제품을 안전하고 올바르게 쓰는 방법을 적어 둔 문서입니다.",
    "preset": "미리 저장해 둔 소리나 설정값입니다.",
    "footswitch": "발로 눌러 기능을 바꾸는 스위치입니다.",
    "expression pedal": "발로 움직여 볼륨이나 효과 정도를 조절하는 페달입니다.",
    "firmware": "제품 안에서 동작을 제어하는 기본 프로그램입니다.",
}


def build_easy_glossary(answer: str, context: str) -> list[tuple[str, str]]:
    combined = f"{answer}\n{context}"
    glossary: list[tuple[str, str]] = []
    for term, description in TERM_EXPLANATIONS.items():
        if len(glossary) >= 5:
            break
        if re.search(re.escape(term), combined, re.IGNORECASE):
            glossary.append((term, description))
    return glossary


clova_studio_service = ClovaStudioService()
