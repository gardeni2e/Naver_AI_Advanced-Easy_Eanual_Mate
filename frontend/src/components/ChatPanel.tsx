import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bot, ChevronDown, FileText, Loader2, Send, Settings2, Type, User, Volume2 } from "lucide-react";
import { getApiErrorMessage } from "../api/client";
import { askManual } from "../api/chat";
import type { AnswerMode, ChatResponse, FontSizeMode, ManualListItem } from "../types/api";
import { getDisplayManualName } from "../utils/manualDisplay";

interface ChatPanelProps {
  manuals: ManualListItem[];
  selectedManualId: string;
  answer: string;
  fontSize: FontSizeMode;
  onFontSize: (fontSize: FontSizeMode) => void;
  onAnswered: (response: ChatResponse) => void;
  audioUrl?: string;
  audioMessage?: string;
  onCreateTts?: () => void;
  ttsLoading?: boolean;
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const answerModes: Array<{ label: string; value: AnswerMode; description: string }> = [
  { label: "쉬운 말", value: "easy", description: "전문 용어를 풀어서 설명" },
  { label: "단계별", value: "step_by_step", description: "순서대로 따라 하기" },
  { label: "기본", value: "basic", description: "간결한 일반 답변" }
];

const fontSizes: Array<{ label: string; value: FontSizeMode }> = [
  { label: "보통", value: "normal" },
  { label: "크게", value: "large" },
  { label: "아주 크게", value: "xlarge" }
];

export function ChatPanel({
  manuals,
  selectedManualId,
  answer,
  fontSize,
  onFontSize,
  onAnswered,
  audioUrl,
  audioMessage,
  onCreateTts,
  ttsLoading = false
}: ChatPanelProps) {
  const [question, setQuestion] = useState("");
  const [answerMode, setAnswerMode] = useState<AnswerMode>("basic");
  const [status, setStatus] = useState("등록 문서 관리∙선택에서 매뉴얼을 고른 뒤 질문해 주세요.");
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState<"answer" | "font" | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const selectedManual = manuals.find((manual) => manual.manual_id === selectedManualId);
  const selectedManualName = selectedManual ? getDisplayManualName(selectedManual.file_name) : "선택된 매뉴얼 없음";

  useEffect(() => {
    setMessages([]);
    setAnswerMode("basic");
  }, [selectedManualId]);

  async function handleAsk() {
    const trimmedQuestion = question.trim();
    if (!selectedManualId) {
      setStatus("먼저 등록 문서 관리∙선택에서 매뉴얼을 선택해 주세요.");
      return;
    }
    if (!trimmedQuestion) {
      setStatus("질문을 입력해 주세요.");
      return;
    }
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: trimmedQuestion
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);
    setStatus("AI가 선택된 매뉴얼에서 관련 내용을 찾고 있습니다.");
    try {
      const response = await askManual(selectedManualId, trimmedQuestion, answerMode);
      onAnswered(response);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: response.answer
        }
      ]);
      setStatus("답변을 생성했습니다.");
    } catch (error) {
      const message = getApiErrorMessage(error, "질문 처리에 실패했습니다. 다시 시도해 주세요.");
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          text: message
        }
      ]);
      setStatus(message);
    } finally {
      setLoading(false);
    }
  }

  const answerClass = {
    normal: "answer-normal",
    large: "answer-large",
    xlarge: "answer-xlarge"
  }[fontSize];

  const visibleMessages = useMemo<ChatMessage[]>(() => {
    if (messages.length) {
      return messages;
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        text: `${selectedManual ? `✨ ${selectedManualName} 연결 완료!` : "✨ 매뉴얼 연결을 기다리고 있어요!"}\n\n안녕하세요, Easy Manual Mate입니다 😊\n어려운 설명서 내용은 제가 대신 찾아보고 쉽게 풀어드릴게요.\n\n이렇게 물어볼 수 있어요:\n• 이 버튼은 언제 눌러야 해?\n• 초기화는 어떻게 해?\n• 경고등이 뜨면 뭘 확인해야 해?\n\n답변이 너무 어렵다면? 👉 '대답형식'에서 쉬운 말/단계별로 바꿔보세요!\n글씨가 작게 느껴진다면? 👉 '글자크기'에서 크게 볼 수 있어요.\n읽기보다 듣고 싶다면? 👉 답변 후 '음성변환'을 눌러보세요 🔊\n\n궁금한 내용을 편하게 적어주세요. 같이 차근차근 볼게요 🚀`
      }
    ];
  }, [messages, selectedManual, selectedManualName]);

  const selectedAnswerMode = answerModes.find((mode) => mode.value === answerMode)?.label ?? "대답형식";
  const selectedFontSize = fontSizes.find((size) => size.value === fontSize)?.label ?? "글자크기";

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-accent to-violet px-5 py-4 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/18">
            <Bot className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black">AI 매뉴얼 상담</h3>
            <p className="truncate text-xs font-medium text-white/78">등록 문서 관리∙선택에서 고른 문서를 기준으로 답변합니다.</p>
          </div>
        </div>
        <span className="hidden rounded-full bg-white/16 px-3 py-1 text-xs font-bold sm:inline-flex">근거 문단 표시</span>
      </div>

      <div className="border-b border-line bg-white/80 p-4">
        <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-3">
          <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-muted">현재 챗봇에 연결된 매뉴얼</p>
            <p className="truncate text-sm font-black text-ink">
              {selectedManualName}
              {selectedManual ? ` · ${selectedManual.chunk_count} chunks` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-[480px] bg-gradient-to-b from-panel/40 to-white p-3 sm:p-4">
        <div className="flex w-full flex-col gap-4">
          {visibleMessages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div key={message.id} className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser ? (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white shadow-sm">
                    <Bot className="h-5 w-5" aria-hidden />
                  </span>
                ) : null}
                <div
                  className={`max-w-[92%] rounded-lg px-4 py-3 shadow-sm sm:max-w-[86%] ${
                    isUser ? "bg-accent text-white" : `border border-line bg-white text-ink ${answerClass}`
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
                </div>
                {isUser ? (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-white shadow-sm">
                    <User className="h-5 w-5" aria-hidden />
                  </span>
                ) : null}
              </div>
            );
          })}
          {loading ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-muted">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              </span>
              선택된 매뉴얼에서 관련 내용을 찾고 있어요.
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-line bg-white p-4">
        <div className="relative mb-3 flex flex-wrap gap-2">
          <ToolMenuButton
            icon={<Settings2 className="h-4 w-4" aria-hidden />}
            label="대답형식"
            value={selectedAnswerMode}
            open={openMenu === "answer"}
            onClick={() => setOpenMenu((current) => (current === "answer" ? null : "answer"))}
          >
            {answerModes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => {
                  setAnswerMode(mode.value);
                  setOpenMenu(null);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left transition hover:bg-info ${
                  answerMode === mode.value ? "bg-info text-accent" : "text-ink"
                }`}
              >
                <span className="block text-sm font-black">{mode.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{mode.description}</span>
              </button>
            ))}
          </ToolMenuButton>

          <ToolMenuButton
            icon={<Type className="h-4 w-4" aria-hidden />}
            label="글자크기"
            value={selectedFontSize}
            open={openMenu === "font"}
            onClick={() => setOpenMenu((current) => (current === "font" ? null : "font"))}
          >
            {fontSizes.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => {
                  onFontSize(size.value);
                  setOpenMenu(null);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-black transition hover:bg-info ${
                  fontSize === size.value ? "bg-info text-accent" : "text-ink"
                }`}
              >
                {size.label}
              </button>
            ))}
          </ToolMenuButton>

          <button
            type="button"
            onClick={onCreateTts}
            disabled={!onCreateTts || ttsLoading}
            className="btn-secondary h-11 text-sm"
          >
            {ttsLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
            음성변환
          </button>
        </div>

        {audioUrl ? <audio className="mb-3 w-full" src={audioUrl} controls /> : null}
        {audioMessage ? <p className="mb-3 text-sm leading-6 text-muted">{audioMessage}</p> : null}

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="예: 공유기 초기화는 어떻게 하나요?"
            className="field h-14 min-h-14 resize-none p-3 leading-6"
          />
          <button type="button" onClick={handleAsk} disabled={loading} className="btn-primary h-14 sm:w-28">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            전송
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">{status}</p>
      </div>
    </section>
  );
}

interface ToolMenuButtonProps {
  icon: ReactNode;
  label: string;
  value: string;
  open: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ToolMenuButton({ icon, label, value, open, onClick, children }: ToolMenuButtonProps) {
  return (
    <div className="relative">
      <button type="button" onClick={onClick} className="btn-secondary h-11 text-sm">
        {icon}
        <span>{label}</span>
        <span className="text-muted">{value}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-lg border border-line bg-white p-2 shadow-card-menu">
          {children}
        </div>
      ) : null}
    </div>
  );
}
