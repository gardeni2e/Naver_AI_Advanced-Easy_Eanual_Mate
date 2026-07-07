import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface RecognizedTextModalProps {
  title: string;
  text: string;
  onClose: () => void;
}

export function RecognizedTextModal({ title, text, onClose }: RecognizedTextModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 px-6 py-8 backdrop-blur-xl"
      role="presentation"
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="닫기" onClick={onClose} />
      <section
        className="relative z-10 flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recognized-text-title"
        style={{
          width: "min(680px, calc(100vw - 48px))",
          maxHeight: "min(620px, calc(100dvh - 96px))"
        }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-sm font-bold text-accent">Recognized Text</p>
            <h2 id="recognized-text-title" className="text-xl font-black text-ink">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-muted transition hover:border-accent hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
            aria-label="닫기"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 p-5">
          <pre
            className="overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-panel/70 p-4 text-sm leading-7 text-ink"
            style={{ maxHeight: "min(462px, calc(100dvh - 230px))" }}
          >
            {text || "표시할 인식 결과가 없습니다."}
          </pre>
        </div>
      </section>
    </div>,
    document.body
  );
}
