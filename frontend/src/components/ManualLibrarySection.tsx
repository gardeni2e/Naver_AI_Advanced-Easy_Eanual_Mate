import { Database, FileText, Trash2 } from "lucide-react";
import type { ManualListItem } from "../types/api";
import { getDisplayManualName } from "../utils/manualDisplay";

interface ManualLibrarySectionProps {
  manuals: ManualListItem[];
  selectedManualId: string;
  status: string;
  onSelectManual: (manualId: string) => void;
  onDeleteManual: (manualId: string) => void;
}

export function ManualLibrarySection({
  manuals,
  selectedManualId,
  status,
  onSelectManual,
  onDeleteManual
}: ManualLibrarySectionProps) {
  return (
    <section className="surface-card animate-slide-up p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-info text-accent">
          <Database className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold text-accent">Library</p>
          <h2 className="text-2xl font-black">등록 문서 관리∙선택</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            선택한 매뉴얼이 아래 제품 정보, 추천 영상, 챗봇 답변에 함께 적용됩니다.
          </p>
        </div>
      </div>

      {status ? <p className="mb-3 rounded-lg bg-info px-3 py-2 text-sm font-semibold text-accent">{status}</p> : null}
      {manuals.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {manuals.map((manual) => {
            const displayName = getDisplayManualName(manual.file_name);
            const selected = selectedManualId === manual.manual_id;
            return (
              <div
                key={manual.manual_id}
                className={`flex items-start gap-3 rounded-lg border p-4 text-sm transition ${
                  selected ? "border-accent bg-info" : "border-line bg-white/80 hover:border-accent"
                }`}
              >
                <button type="button" onClick={() => onSelectManual(manual.manual_id)} className="min-w-0 flex-1 text-left">
                  <span className="flex items-center gap-2 font-bold">
                    <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                    <span className="truncate">{displayName}</span>
                  </span>
                  <span className="mt-1 block text-muted">
                    {manual.source_type} · {manual.chunk_count} chunks
                  </span>
                  {selected ? (
                    <span className="mt-2 inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">
                      현재 사용 중
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteManual(manual.manual_id)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-muted transition hover:border-warning hover:text-warning focus:outline-none focus:ring-4 focus:ring-warning/10"
                  title="매뉴얼 삭제"
                  aria-label={`${displayName} 삭제`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-line bg-white/70 p-5 text-sm leading-6 text-muted">
          아직 등록된 문서가 없습니다.
        </p>
      )}
    </section>
  );
}
