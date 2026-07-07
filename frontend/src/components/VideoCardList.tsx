import { ExternalLink, PlaySquare } from "lucide-react";
import type { VideoCandidate } from "../types/api";

interface VideoCardListProps {
  videos: VideoCandidate[];
}

export function VideoCardList({ videos }: VideoCardListProps) {
  if (!videos.length) {
    return <p className="text-sm leading-6 text-muted">PDF 업로드 또는 제품명 검색 후 관련 영상이 여기에 표시됩니다.</p>;
  }

  return (
    <div className="grid gap-2">
      {videos.map((video) => (
        <a key={video.url} href={video.url} target="_blank" rel="noreferrer" className="quiet-link-card flex items-center gap-3 p-3 text-sm">
          <PlaySquare className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{video.title}</span>
            <span className="block truncate text-muted">{video.channel}</span>
          </span>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        </a>
      ))}
    </div>
  );
}
