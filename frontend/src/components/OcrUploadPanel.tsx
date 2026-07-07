import { useMemo, useState } from "react";
import { Eye, Image, Loader2, Upload } from "lucide-react";
import { getApiErrorMessage } from "../api/client";
import { uploadOcrManual } from "../api/manuals";
import type { ManualListItem, OcrUploadResponse } from "../types/api";
import { RecognizedTextModal } from "./RecognizedTextModal";

interface OcrUploadPanelProps {
  onUploaded: (manual: OcrUploadResponse) => void;
  onRefreshManuals: () => Promise<ManualListItem[]>;
  onStart?: () => void;
  onFinish?: () => void;
}

export function OcrUploadPanel({ onUploaded, onRefreshManuals, onStart, onFinish }: OcrUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("사진을 올리면 OCR이 글자를 자동으로 읽어 매뉴얼로 등록합니다.");
  const [recognizedText, setRecognizedText] = useState("");
  const [showRecognizedText, setShowRecognizedText] = useState(false);
  const [loading, setLoading] = useState(false);
  const imagePreview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  async function handleUpload() {
    if (!file) {
      setStatus("이미지 파일을 먼저 선택해 주세요.");
      return;
    }
    setLoading(true);
    onStart?.();
    setStatus("사진 속 글자를 읽고 매뉴얼로 정리하고 있어요.");
    try {
      const result = await uploadOcrManual(file, "");
      setStatus(`OCR 등록 완료 · ${result.chunk_count}개 문단`);
      setRecognizedText(result.preview || result.ocr_text);
      onUploaded(result);
      await onRefreshManuals();
    } catch (error) {
      setStatus(getApiErrorMessage(error, "OCR 등록에 실패했습니다. 이미지와 API 설정을 확인해 주세요."));
    } finally {
      setLoading(false);
      onFinish?.();
    }
  }

  return (
    <section className="surface-card p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-info text-accent">
          <Image className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-2xl font-black">실물 매뉴얼 사진 업로드</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            종이 매뉴얼이나 제품 설명서를 사진으로 찍어 업로드하면 OCR이 자동으로 글자를 읽어드립니다.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="block w-full rounded-lg border border-line bg-white/90 p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-info file:px-3 file:py-2 file:font-bold file:text-accent"
      />
      {imagePreview ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white">
          <img src={imagePreview} alt="업로드한 매뉴얼 사진 미리보기" className="max-h-72 w-full object-contain" />
        </div>
      ) : null}

      <button type="button" disabled={loading} onClick={handleUpload} className="btn-primary mt-4 h-12 w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
        OCR 분석 시작하기
      </button>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-6 text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>{status}</span>
        {recognizedText ? (
          <button type="button" onClick={() => setShowRecognizedText(true)} className="btn-secondary h-10 shrink-0 text-sm">
            <Eye className="h-4 w-4" aria-hidden />
            인식결과 보기
          </button>
        ) : null}
      </div>

      {showRecognizedText ? (
        <RecognizedTextModal title="OCR 인식 결과" text={recognizedText} onClose={() => setShowRecognizedText(false)} />
      ) : null}
    </section>
  );
}
