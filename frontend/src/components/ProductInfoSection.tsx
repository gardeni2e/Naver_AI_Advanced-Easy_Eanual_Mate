import { BadgeCheck } from "lucide-react";
import type { ProductInfo } from "../types/api";
import { BrandLogo } from "./BrandLogo";

interface ProductInfoSectionProps {
  productInfo: ProductInfo | null | undefined;
}

export function ProductInfoSection({ productInfo }: ProductInfoSectionProps) {
  const items = [
    { label: "제조사", value: productInfo?.manufacturer || "미확인" },
    { label: "제품명", value: productInfo?.product_name || "미확인" },
    { label: "모델명", value: productInfo?.model_name || "미확인" },
    { label: "제품 유형", value: productInfo?.product_type || "미확인" },
    { label: "추정 신뢰도", value: productInfo?.confidence || "미확인" }
  ];

  return (
    <section className="surface-card animate-slide-up p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-info text-accent">
          <BadgeCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold text-accent">Analysis Result</p>
          <h2 className="flex flex-wrap items-center gap-2 text-2xl font-black">
            추정 제품 정보
            <BrandLogo brand="gemini" variant="inline" />
          </h2>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-line bg-white/75 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{item.label}</p>
            <p className="mt-2 break-words text-base font-black text-ink">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
