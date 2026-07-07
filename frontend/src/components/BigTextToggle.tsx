import type { FontSizeMode } from "../types/api";

interface BigTextToggleProps {
  value: FontSizeMode;
  onChange: (value: FontSizeMode) => void;
}

const sizes: Array<{ label: string; value: FontSizeMode }> = [
  { label: "보통", value: "normal" },
  { label: "크게", value: "large" },
  { label: "아주 크게", value: "xlarge" }
];

export function BigTextToggle({ value, onChange }: BigTextToggleProps) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg bg-panel p-1">
      {sizes.map((size) => (
        <button
          key={size.value}
          type="button"
          onClick={() => onChange(size.value)}
          className={`h-10 rounded-lg text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-accent/10 ${
            value === size.value ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-white hover:text-ink"
          }`}
        >
          {size.label}
        </button>
      ))}
    </div>
  );
}
