import { ExternalLink, PlaySquare } from "lucide-react";
import type { VideoCandidate } from "../types/api";
import { BrandLogo } from "./BrandLogo";

interface RecommendedVideosSectionProps {
  videos: VideoCandidate[];
}

export function RecommendedVideosSection({ videos }: RecommendedVideosSectionProps) {
  return (
    <section className="surface-card animate-slide-up p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-info text-accent">
          <PlaySquare className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold text-accent">Guide Videos</p>
        <h2 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-black">
          추천 매뉴얼 영상
          <BrandLogo brand="youtube" variant="inline" />
        </h2>
        </div>
      </div>
      {videos.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {videos.slice(0, 3).map((video) => (
            <a key={video.url} href={video.url} target="_blank" rel="noreferrer" className="quiet-link-card overflow-hidden">
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-info to-white">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <PlaySquare className="h-10 w-10 text-accent" aria-hidden />
                )}
              </div>
              <div className="p-4">
                <p className="line-clamp-2 font-bold leading-6">{video.title}</p>
                <p className="mt-2 truncate text-sm text-muted">{video.channel || "YouTube"}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-accent">
                  외부 링크 열기
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-line bg-white/70 p-5 text-sm leading-6 text-muted">
          분석된 제품명이나 모델명을 기준으로 관련 영상이 표시됩니다.
        </p>
      )}
    </section>
  );
}
