import { useState, type ReactNode } from "react";
import { Play, Sparkles } from "lucide-react";

type Brand = "gemini" | "youtube";

interface BrandLogoProps {
  brand: Brand;
  variant?: "section" | "inline";
}

const brandConfig = {
  gemini: {
    sources: ["/logos/gemini.webp", "/logos/gemini.png", "/logos/gemini.svg"],
    label: "Gemini",
    fallback: <Sparkles className="h-5 w-5 text-accent" aria-hidden />
  },
  youtube: {
    sources: ["/logos/youtube.webp", "/logos/youtube.png", "/logos/youtube.svg"],
    label: "YouTube",
    fallback: <Play className="h-5 w-5 fill-red-500 text-red-500" aria-hidden />
  }
} satisfies Record<Brand, { sources: string[]; label: string; fallback: ReactNode }>;

export function BrandLogo({ brand, variant = "section" }: BrandLogoProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const config = brandConfig[brand];
  const isInline = variant === "inline";
  const source = config.sources[sourceIndex];

  return (
    <span
      className={
        isInline
          ? "inline-flex h-7 w-7 shrink-0 align-middle items-center justify-center rounded-full border border-line bg-white shadow-card"
          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-white shadow-card"
      }
      aria-label={config.label}
      title={config.label}
    >
      {!source ? (
        config.fallback
      ) : (
        <img
          src={source}
          alt={config.label}
          className={isInline ? "h-4 w-4 object-contain" : "h-6 w-6 object-contain"}
          onError={() => setSourceIndex((current) => current + 1)}
        />
      )}
    </span>
  );
}
