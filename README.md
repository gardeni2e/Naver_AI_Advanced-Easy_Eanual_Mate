# Easy Manual Mate

React + FastAPI로 분리한 Easy Manual Mate 1차 MVP 초안입니다.

PDF 매뉴얼을 업로드하면 백엔드가 텍스트를 추출하고 chunk로 나눈 뒤 embedding을 생성해 FAISS index로 저장합니다. 질문 시에는 유사 chunk를 검색하고, 해당 문단을 context로 CLOVA Studio Chat Completions에 전달해 답변과 참고 문단을 반환합니다.

API 키가 없을 때도 화면과 파이프라인을 확인할 수 있도록 로컬 목업 embedding/답변/TTS를 제공합니다. 실제 제출 전에는 `backend/.env`에 CLOVA 키를 넣으면 됩니다.

## 구조

```text
easy-manual-mate/
  frontend/   React + Vite + TypeScript + Tailwind
  backend/    FastAPI + pypdf + CLOVA Studio + FAISS
```

## Backend 실행

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend 실행

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:5173`, 백엔드는 `http://localhost:8000`에서 동작합니다.

## 구현된 API

- `GET /health`
- `POST /api/manuals/pdf`
- `POST /api/manuals/ocr`
- `GET /api/manuals`
- `POST /api/chat`
- `POST /api/tts`
- `GET /api/search/manuals`
- `GET /api/videos`

## 1차 MVP 구현 범위

- React/Vite/TypeScript/Tailwind 단일 화면 UI
- FastAPI 백엔드 분리 구조
- PDF 업로드
- pypdf 기반 PDF 텍스트 추출
- chunk 분할
- CLOVA Embedding v2 호출 코드
- FAISS index 저장 및 manual_id별 로드
- 질문 embedding 및 top-k chunk 검색
- CLOVA Studio HCX-005 Chat Completions 호출 코드
- 답변, 참고 문단, 쉬운 말/단계별/기본 모드
- 큰 글씨 UI

## 확장 자리

- CLOVA OCR: `backend/app/services/ocr_service.py`
- CLOVA Voice: `backend/app/services/clova_voice_service.py`
- 공식 매뉴얼 검색: `backend/app/services/manual_search_service.py`
- YouTube 영상 추천: `backend/app/services/video_search_service.py`

## 환경 변수

`backend/.env.example`과 `frontend/.env.example`을 복사해서 사용하세요. API Key는 코드에 직접 넣지 않습니다.

큰 PDF에서 CLOVA Embedding `429 Too Many Requests`가 발생하면 요청 수를 줄이기 위해 `backend/.env`에서 chunk 크기를 키우세요.

```env
CHUNK_SIZE=1200
CHUNK_OVERLAP=120
CLOVA_EMBED_REQUEST_INTERVAL=0.5
```

이미 서버가 켜져 있다면 `.env` 변경 후 백엔드를 재시작해야 합니다.

## 검색 API 구조

- 제품명 기반 공식 매뉴얼 후보: `GEMINI_API_KEY`를 사용합니다.
- Gemini Search Grounding은 사용하지 않습니다.
- Google Custom Search API는 사용하지 않습니다.
- 관련 영상 추천: `YOUTUBE_API_KEY`가 있으면 YouTube Data API `search.list`를 사용합니다.
- API 키가 없을 때는 화면 흐름 확인용 임시 링크를 표시합니다.
