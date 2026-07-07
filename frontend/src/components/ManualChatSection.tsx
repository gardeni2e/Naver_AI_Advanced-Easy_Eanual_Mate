import { ChatPanel } from "./ChatPanel";
import type { ChatResponse, FontSizeMode, ManualListItem } from "../types/api";

interface ManualChatSectionProps {
  manuals: ManualListItem[];
  selectedManualId: string;
  answer: string;
  fontSize: FontSizeMode;
  onFontSize: (fontSize: FontSizeMode) => void;
  onAnswered: (response: ChatResponse) => void;
  audioUrl: string;
  audioMessage: string;
  onCreateTts: () => void;
  ttsLoading: boolean;
}

export function ManualChatSection({
  manuals,
  selectedManualId,
  answer,
  fontSize,
  onFontSize,
  onAnswered,
  audioUrl,
  audioMessage,
  onCreateTts,
  ttsLoading
}: ManualChatSectionProps) {
  return (
    <section className="animate-slide-up">
      <div className="mb-5">
        <p className="text-sm font-bold text-accent">Ask Manual</p>
        <h2 className="mt-1 text-3xl font-black">궁금한 것을 물어보세요!</h2>
      </div>
      <ChatPanel
        manuals={manuals}
        selectedManualId={selectedManualId}
        answer={answer}
        fontSize={fontSize}
        onFontSize={onFontSize}
        onAnswered={onAnswered}
        audioUrl={audioUrl}
        audioMessage={audioMessage}
        onCreateTts={onCreateTts}
        ttsLoading={ttsLoading}
      />
    </section>
  );
}
