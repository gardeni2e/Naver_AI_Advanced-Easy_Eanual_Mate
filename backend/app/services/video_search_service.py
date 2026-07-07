from __future__ import annotations

from urllib.parse import quote_plus

import requests

from app.core.config import settings
from app.models.schemas import VideoCandidate


def search_video_candidates(product: str) -> list[VideoCandidate]:
    if settings.youtube_api_key:
        try:
            videos = search_with_youtube_data_api(product)
            if videos:
                return videos
        except Exception:
            if not settings.mock_when_no_api_key:
                raise
    return fallback_video_candidates(product)


def search_with_youtube_data_api(product: str) -> list[VideoCandidate]:
    response = requests.get(
        "https://www.googleapis.com/youtube/v3/search",
        params={
            "part": "snippet",
            "q": f"{product} manual tutorial how to use",
            "type": "video",
            "maxResults": 5,
            "key": settings.youtube_api_key,
            "safeSearch": "moderate",
            "relevanceLanguage": "ko",
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
    topics = ["manual tutorial", "setup guide", "how to use"]
    return [
        VideoCandidate(
            title=f"{product} {topic}",
            url=f"https://www.youtube.com/results?search_query={quote_plus(product + ' ' + topic)}",
            thumbnail_url="",
            channel="YouTube 검색",
        )
        for topic in topics
    ]
