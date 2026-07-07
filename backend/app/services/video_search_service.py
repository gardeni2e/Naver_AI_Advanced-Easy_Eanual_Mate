from __future__ import annotations

import re
from urllib.parse import quote_plus

import requests

from app.core.config import settings
from app.models.schemas import VideoCandidate


GENERIC_VIDEO_TERMS = (
    "manual",
    "tutorial",
    "setup",
    "guide",
    "how",
    "to",
    "use",
    "owner",
    "owners",
    "owner's",
    "pdf",
)


def search_video_candidates(product: str) -> list[VideoCandidate]:
    product = normalize_video_query(product)
    if settings.youtube_api_key:
        try:
            videos = search_with_youtube_data_api(product)
            if videos:
                return videos
        except Exception:
            if not settings.mock_when_no_api_key:
                raise
    return fallback_video_candidates(product)


def normalize_video_query(product: str) -> str:
    value = re.sub(r"[_-]+", " ", product or "")
    value = re.sub(r"\b[A-Z]\d{1,3}\b", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"\b[A-Z]{1,8}\d{2,}[A-Z0-9]*\b", " ", value)
    value = re.sub(r"\b[A-Z0-9]*\d[A-Z0-9]{2,}\b", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"\b\d{2,}\b", " ", value)
    value = re.sub(r"\s+", " ", value).strip()

    words: list[str] = []
    seen: set[str] = set()
    for word in value.split():
        key = word.lower().strip(".,()[]")
        if key in GENERIC_VIDEO_TERMS or key in seen:
            continue
        seen.add(key)
        words.append(word)
    return " ".join(words).strip()


def build_youtube_queries(product: str) -> list[str]:
    base = normalize_video_query(product)
    if not base:
        return []
    return [
        f"{base} 사용법",
        f"{base} manual tutorial",
        f"{base} how to use",
        f"{base} setup guide",
    ]


def search_with_youtube_data_api(product: str) -> list[VideoCandidate]:
    for query in build_youtube_queries(product):
        videos = request_youtube_videos(query)
        if videos:
            return videos
    return []


def request_youtube_videos(query: str) -> list[VideoCandidate]:
    response = requests.get(
        "https://www.googleapis.com/youtube/v3/search",
        params={
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": 5,
            "key": settings.youtube_api_key,
            "safeSearch": "moderate",
            "regionCode": "KR",
        },
        timeout=30,
    )
    response.raise_for_status()
    videos: list[VideoCandidate] = []
    for item in response.json().get("items", []):
        video_id = item.get("id", {}).get("videoId")
        snippet = item.get("snippet", {})
        if not video_id:
            continue
        thumbnails = snippet.get("thumbnails", {})
        thumbnail = (
            thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
            or ""
        )
        videos.append(
            VideoCandidate(
                title=snippet.get("title", "관련 영상"),
                url=f"https://www.youtube.com/watch?v={video_id}",
                thumbnail_url=thumbnail,
                channel=snippet.get("channelTitle", ""),
            )
        )
    return videos


def fallback_video_candidates(product: str) -> list[VideoCandidate]:
    base = normalize_video_query(product) or product.strip()
    topics = ["사용법", "manual tutorial", "setup guide"]
    return [
        VideoCandidate(
            title=f"{base} {topic}",
            url=f"https://www.youtube.com/results?search_query={quote_plus(base + ' ' + topic)}",
            thumbnail_url="",
            channel="YouTube 검색",
        )
        for topic in topics
    ]
