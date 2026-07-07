import { Camera, CheckCircle2, FileText } from "lucide-react";

export type ManualMode = "pdf" | "ocr";

interface HeroSectionProps {
  selectedMode: ManualMode | null;
  onSelectMode: (mode: ManualMode) => void;
}

const modes: Array<{
  mode: ManualMode;
  icon: typeof FileText;
  title: string;
  description: string;
}> = [
  {
    mode: "pdf",
    icon: FileText,
    title: "공식 매뉴얼 파일이 있어요",
    description: "PDF 매뉴얼을 업로드하고 바로 질문할 수 있게 분석합니다."
  },
  {
    mode: "ocr",
    icon: Camera,
    title: "실물 매뉴얼을 가지고 있어요",
    description: "종이 설명서 사진을 OCR로 읽어 질문용 문서로 만듭니다."
  }
];

export function HeroSection({ selectedMode, onSelectMode }: HeroSectionProps) {
  return (
    <section className="mx-auto max-w-[1180px] pb-8 pt-12 sm:pb-12 sm:pt-16">
      <div className="text-center">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">Easy Manual Mate</p>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal text-ink sm:text-6xl">
          <span className="block">복잡한 매뉴얼?</span>
          <span className="block">이제 펼쳐만 두세요!</span>
        </h1>
        <p className="mx-auto mt-5 max-w-4xl text-base leading-8 text-muted sm:text-lg">
          <span className="inline-flex flex-wrap items-center justify-center gap-x-1">
            <span>PDF든 사진이든 제품명이든, 필요한 사용법은 Easy Manual Mate가 찾아드릴게요!</span>
            <span className="whitespace-nowrap">😎</span>
          </span>
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {modes.map((item) => {
          const Icon = item.icon;
          const active = selectedMode === item.mode;
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => onSelectMode(item.mode)}
              className={`surface-card group p-6 text-left transition hover:-translate-y-1 ${
                active ? "border-accent bg-info shadow-[0_18px_54px_rgba(59,130,246,0.18)]" : "hover:border-accent"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-info text-accent transition group-hover:scale-105">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-xl font-black">
                    {item.title}
                    {active ? <CheckCircle2 className="h-5 w-5 text-accent" aria-hidden /> : null}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-muted">{item.description}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
