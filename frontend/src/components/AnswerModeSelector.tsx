import type { AnswerMode } from "../types/api";

interface AnswerModeSelectorProps {
  value: AnswerMode;
  onChange: (value: AnswerMode) => void;
}

const modes: Array<{ label: string; value: AnswerMode }> = [
  { label: "쉬운 말", value: "easy" },
  { label: "단계별", value: "step_by_step" },
  { label: "기본", value: "basic" }
];

export function AnswerModeSelector({ value, onChange }: AnswerModeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg bg-panel p-1">
      {modes.map((mode) => (
        <button
          key={mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
          className={`h-10 rounded-lg text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-accent/10 ${
            value === mode.value ? "bg-accent text-white shadow-sm" : "text-muted hover:bg-white hover:text-ink"
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
