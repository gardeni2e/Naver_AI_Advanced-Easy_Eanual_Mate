import { Loader2 } from "lucide-react";

export function AnalysisLoadingSection() {
  return (
    <section className="surface-card animate-slide-up p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-info text-accent">
        <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
      </div>
      <h2 className="mt-5 text-2xl font-black">매뉴얼을 분석하고 있어요...</h2>
      <div className="mx-auto mt-4 grid max-w-2xl gap-2 text-sm leading-6 text-muted sm:grid-cols-3">
        <p className="rounded-lg bg-white/70 p-3">제품명과 모델명을 추정하는 중입니다.</p>
        <p className="rounded-lg bg-white/70 p-3">문서 내용을 읽기 쉬운 단위로 나누고 있어요.</p>
        <p className="rounded-lg bg-white/70 p-3">질문에 답하기 위한 인덱스를 생성하고 있어요.</p>
      </div>
    </section>
  );
}
