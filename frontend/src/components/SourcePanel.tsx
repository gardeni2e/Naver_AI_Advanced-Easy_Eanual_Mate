import { FileText } from "lucide-react";
import type { SourceChunk } from "../types/api";
import { getDisplayManualName } from "../utils/manualDisplay";

interface SourcePanelProps {
  sources: SourceChunk[];
}

export function SourcePanel({ sources }: SourcePanelProps) {
  if (!sources.length) {
    return <p className="text-sm leading-6 text-muted">질문 후 참고한 매뉴얼 문단이 여기에 표시됩니다.</p>;
  }

  return (
    <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
      {sources.map((source, index) => (
        <article key={`${source.source}-${index}`} className="quiet-link-card p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold">
            <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span className="truncate">{getDisplayManualName(source.source)}</span>
            <span className="ml-auto shrink-0 rounded-full bg-panel px-2 py-0.5 text-xs text-muted">{source.score.toFixed(3)}</span>
          </div>
          <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-muted">{source.text}</p>
        </article>
      ))}
    </div>
  );
}
