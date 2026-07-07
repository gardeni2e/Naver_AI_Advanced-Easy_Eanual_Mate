import { useState } from "react";
import { CheckCircle2, Eye, Loader2, Upload } from "lucide-react";
import { getApiErrorMessage } from "../api/client";
import { uploadPdfManual } from "../api/manuals";
import { searchVideos } from "../api/search";
import type { ManualListItem, ManualUploadResponse, VideoCandidate } from "../types/api";
import { getDisplayManualName } from "../utils/manualDisplay";
import { buildVideoSearchQueryFromUpload } from "../utils/videoSearchQuery";
import { RecognizedTextModal } from "./RecognizedTextModal";

interface UploadPanelProps {
  onUploaded: (manual: ManualUploadResponse, videos: VideoCandidate[]) => void;
  onRefreshManuals: () => Promise<ManualListItem[]>;
  onStart?: () => void;
  onFinish?: () => void;
}

export function UploadPanel({ onUploaded, onRefreshManuals, onStart, onFinish }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("PDF 매뉴얼을 올리면 질문할 준비를 해드립니다.");
  const [recognizedText, setRecognizedText] = useState("");
  const [showRecognizedText, setShowRecognizedText] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) {
      setStatus("먼저 PDF 파일을 선택해 주세요.");
      return;
    }
    setLoading(true);
    onStart?.();
    setStatus("매뉴얼을 읽고 질문할 수 있게 준비하고 있어요.");
    try {
      const result = await uploadPdfManual(file);
      const videoQuery = buildVideoSearchQueryFromUpload(result);
      const videos = videoQuery ? await searchVideos(videoQuery) : [];
      setStatus(`${getDisplayManualName(result.file_name)} 등록 완료 · ${result.chunk_count}개 문단`);
      setRecognizedText(result.preview);
      onUploaded(result, videos);
      await onRefreshManuals();
    } catch (error) {
      setStatus(getApiErrorMessage(error, "업로드에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setLoading(false);
      onFinish?.();
    }
  }

  return (
    <section className="surface-card p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">공식 PDF 매뉴얼 업로드</h2>
          <p className="mt-2 text-sm leading-6 text-muted">보유 중인 공식 PDF 매뉴얼을 업로드하면 내용을 분석합니다.</p>
        </div>
        {recognizedText ? <CheckCircle2 className="h-6 w-6 shrink-0 text-accent" aria-hidden /> : null}
      </div>

      <label className="group flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-white/65 px-6 text-center transition hover:-translate-y-0.5 hover:border-accent hover:bg-info/70">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-info text-accent transition group-hover:scale-105">
          <Upload className="h-7 w-7" aria-hidden />
        </span>
        <span className="text-xl font-black">PDF 파일을 여기에 끌어다 놓거나 클릭해서 업로드하세요</span>
        <span className="mt-2 text-sm text-muted">지원 형식: PDF</span>
        <input
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        {file ? <span className="mt-4 max-w-full truncate text-sm font-bold text-accent">{file.name}</span> : null}
      </label>

      <button type="button" onClick={handleUpload} disabled={loading} className="btn-primary mt-5 h-12 w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
        분석 시작하기
      </button>

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-line bg-white/80 p-3 text-sm font-semibold leading-6 text-ink sm:flex-row sm:items-center sm:justify-between">
        <span>{status}</span>
        {recognizedText ? (
          <button type="button" onClick={() => setShowRecognizedText(true)} className="btn-secondary h-10 shrink-0 text-sm">
            <Eye className="h-4 w-4" aria-hidden />
            인식결과 보기
          </button>
        ) : null}
      </div>

      {showRecognizedText ? (
        <RecognizedTextModal title="PDF 인식 결과" text={recognizedText} onClose={() => setShowRecognizedText(false)} />
      ) : null}
    </section>
  );
}
