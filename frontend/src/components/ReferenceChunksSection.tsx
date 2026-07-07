import { FileText } from "lucide-react";
import { SourcePanel } from "./SourcePanel";
import type { SourceChunk } from "../types/api";

interface ReferenceChunksSectionProps {
  sources: SourceChunk[];
}

export function ReferenceChunksSection({ sources }: ReferenceChunksSectionProps) {
  return (
    <section className="surface-card animate-slide-up p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-info text-accent">
          <FileText className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold text-accent">References</p>
          <h2 className="text-2xl font-black">참고 문단</h2>
        </div>
      </div>
      <SourcePanel sources={sources} />
    </section>
  );
}
